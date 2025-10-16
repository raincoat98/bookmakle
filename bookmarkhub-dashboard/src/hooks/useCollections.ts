import { useState, useEffect, useCallback } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Collection, CollectionFormData } from "../types";

export const useCollections = (userId: string) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  // 컬렉션 목록 가져오기
  const fetchCollections = useCallback(async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "collections"),
        where("userId", "==", userId)
      );

      const querySnapshot = await getDocs(q);
      const collectionList: Collection[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        collectionList.push({
          id: doc.id,
          name: data.name,
          icon: data.icon,
          description: data.description || "",
          userId: data.userId,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          parentId: data.parentId ?? null,
          isPinned: data.isPinned ?? false,
        });
      });

      // 클라이언트 측에서 핀된 컬렉션을 먼저, 그 다음 이름순으로 정렬
      collectionList.sort((a, b) => {
        // 핀된 컬렉션이 먼저 오도록 정렬
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        // 같은 핀 상태라면 이름순으로 정렬
        return a.name.localeCompare(b.name);
      });

      setCollections(collectionList);
    } catch (error) {
      console.error("Error fetching collections:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // 컬렉션 추가
  const addCollection = async (collectionData: CollectionFormData) => {
    try {
      const docRef = await addDoc(collection(db, "collections"), {
        ...collectionData,
        description: collectionData.description || "",
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        parentId: collectionData.parentId ?? null,
        isPinned: collectionData.isPinned ?? false,
      });

      // 새로 추가된 컬렉션을 목록에 추가
      const newCollection: Collection = {
        id: docRef.id,
        ...collectionData,
        description: collectionData.description || "",
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        parentId: collectionData.parentId ?? null,
        isPinned: collectionData.isPinned ?? false,
      };

      setCollections((prev) => [newCollection, ...prev]);
      return docRef.id;
    } catch (error) {
      console.error("Error adding collection:", error);
      throw error;
    }
  };

  // 컬렉션 수정
  const updateCollection = async (
    collectionId: string,
    collectionData: Partial<CollectionFormData>
  ) => {
    try {
      await updateDoc(doc(db, "collections", collectionId), {
        ...collectionData,
        updatedAt: serverTimestamp(),
      });

      setCollections((prev) =>
        prev.map((collection) =>
          collection.id === collectionId
            ? {
                ...collection,
                ...collectionData,
                updatedAt: new Date(),
              }
            : collection
        )
      );
    } catch (error) {
      console.error("Error updating collection:", error);
      throw error;
    }
  };

  // 컬렉션 삭제
  const deleteCollection = async (collectionId: string) => {
    try {
      // 인증 상태 확인
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // 1. 해당 컬렉션에 연결된 북마크들을 찾기
      const bookmarksQuery = query(
        collection(db, "bookmarks"),
        where("userId", "==", userId),
        where("collection", "==", collectionId)
      );
      const bookmarksSnapshot = await getDocs(bookmarksQuery);
      console.log("Found bookmarks to update:", bookmarksSnapshot.size);

      // 2. 연결된 북마크들의 collection 필드를 null로 업데이트 (개별 작업)
      if (bookmarksSnapshot.size > 0) {
        const updatePromises = bookmarksSnapshot.docs.map(
          async (bookmarkDoc) => {
            const bookmarkRef = doc(db, "bookmarks", bookmarkDoc.id);
            await updateDoc(bookmarkRef, {
              collection: null,
              updatedAt: serverTimestamp(),
            });
          }
        );

        // 3. 모든 북마크 업데이트 완료 대기
        await Promise.all(updatePromises);
      }

      // 4. 컬렉션 삭제
      const collectionRef = doc(db, "collections", collectionId);
      await deleteDoc(collectionRef);

      // 5. 로컬 상태 업데이트
      setCollections((prev) =>
        prev.filter((collection) => collection.id !== collectionId)
      );
    } catch (error) {
      console.error("Error deleting collection:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (userId) {
      fetchCollections();
    }
  }, [userId, fetchCollections]);

  // 컬렉션 핀 설정 (하나만 가능)
  const setPinned = async (collectionId: string, isPinned: boolean) => {
    try {
      const batch = [];

      if (isPinned) {
        // 새로운 컬렉션을 핀으로 설정할 때, 기존 핀된 컬렉션들을 모두 해제
        const currentPinnedCollections = collections.filter(
          (col) => col.isPinned
        );
        for (const pinnedCol of currentPinnedCollections) {
          batch.push(
            updateDoc(doc(db, "collections", pinnedCol.id), {
              isPinned: false,
              updatedAt: serverTimestamp(),
            })
          );
        }
      }

      // 대상 컬렉션의 핀 상태 설정
      batch.push(
        updateDoc(doc(db, "collections", collectionId), {
          isPinned: isPinned,
          updatedAt: serverTimestamp(),
        })
      );

      // 모든 업데이트 실행
      await Promise.all(batch);

      // 로컬 상태 업데이트
      setCollections((prev) =>
        prev
          .map((col) => {
            if (col.id === collectionId) {
              return { ...col, isPinned: isPinned, updatedAt: new Date() };
            } else if (isPinned && col.isPinned) {
              // 새로운 핀이 설정되면 기존 핀들 해제
              return { ...col, isPinned: false, updatedAt: new Date() };
            }
            return col;
          })
          .sort((a, b) => {
            // 핀된 컬렉션이 먼저 오도록 정렬
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            // 같은 핀 상태라면 이름순으로 정렬
            return a.name.localeCompare(b.name);
          })
      );
    } catch (error) {
      console.error("Error setting pin:", error);
      throw error;
    }
  };

  return {
    collections,
    loading,
    addCollection,
    updateCollection,
    deleteCollection,
    setPinned,
    refetch: fetchCollections,
  };
};
