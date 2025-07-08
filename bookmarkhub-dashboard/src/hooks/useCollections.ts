import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Collection, CollectionFormData } from "../types";

const DEFAULT_COLLECTIONS = [
  {
    name: "업무",
    icon: "💼",
  },
  {
    name: "개인",
    icon: "🏠",
  },
  {
    name: "학습",
    icon: "📚",
  },
  {
    name: "즐겨찾기",
    icon: "⭐",
  },
  {
    name: "개발",
    icon: "💻",
  },
  {
    name: "디자인",
    icon: "🎨",
  },
];

export const useCollections = (userId: string) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  // 컬렉션 목록 가져오기
  const fetchCollections = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "collections"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const collectionList: Collection[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        collectionList.push({
          id: doc.id,
          name: data.name,
          icon: data.icon,
          userId: data.userId,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        });
      });

      setCollections(collectionList);

      // 컬렉션이 없으면 기본 컬렉션 생성
      if (collectionList.length === 0) {
        await createDefaultCollections();
        // 기본 컬렉션 생성 후 상태 업데이트
        const defaultCollectionList: Collection[] = DEFAULT_COLLECTIONS.map(
          (collection, index) => ({
            id: `default-${index}`,
            ...collection,
            userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        );
        setCollections(defaultCollectionList);
      }
    } catch (error) {
      console.error("Error fetching collections:", error);
    } finally {
      setLoading(false);
    }
  };

  // 기본 컬렉션 생성
  const createDefaultCollections = async () => {
    try {
      for (const defaultCollection of DEFAULT_COLLECTIONS) {
        await addDoc(collection(db, "collections"), {
          ...defaultCollection,
          userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error creating default collections:", error);
    }
  };

  // 컬렉션 추가
  const addCollection = async (collectionData: CollectionFormData) => {
    try {
      const docRef = await addDoc(collection(db, "collections"), {
        ...collectionData,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 새로 추가된 컬렉션을 목록에 추가
      const newCollection: Collection = {
        id: docRef.id,
        ...collectionData,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
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
      await deleteDoc(doc(db, "collections", collectionId));
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
  }, [userId]);

  return {
    collections,
    loading,
    addCollection,
    updateCollection,
    deleteCollection,
    refetch: fetchCollections,
  };
};
