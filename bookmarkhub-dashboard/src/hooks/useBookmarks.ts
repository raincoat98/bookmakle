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
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Bookmark, BookmarkFormData } from "../types";

export const useBookmarks = (userId: string) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState<string>("all");

  // 북마크 목록 가져오기
  const fetchBookmarks = async () => {
    try {
      setLoading(true);

      // 모든 북마크를 가져온 후 클라이언트에서 필터링
      const q = query(
        collection(db, "bookmarks"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const bookmarkList: Bookmark[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        bookmarkList.push({
          id: doc.id,
          title: data.title || "",
          url: data.url || "",
          description: data.description || "",
          collection: data.collection || null,
          order: data.order || 0,
          userId: data.userId || "",
          createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
          updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
        });
      });

      // 클라이언트에서 order로 정렬 (인덱스 생성 후 서버 정렬로 변경 가능)
      bookmarkList.sort((a, b) => {
        // order가 없는 경우 createdAt으로 정렬
        if (a.order === 0 && b.order === 0) {
          return b.createdAt.getTime() - a.createdAt.getTime();
        }
        return a.order - b.order;
      });

      // 클라이언트에서 필터링
      let filteredBookmarks = bookmarkList;

      console.log("필터링 전 북마크 수:", bookmarkList.length);
      console.log("선택된 컬렉션:", selectedCollection);

      if (selectedCollection === "none") {
        // 컬렉션이 없는 북마크들
        filteredBookmarks = bookmarkList.filter(
          (bookmark) =>
            !bookmark.collection ||
            bookmark.collection === "" ||
            bookmark.collection === null
        );
        console.log("컬렉션 없음 필터 결과:", filteredBookmarks.length);
      } else if (selectedCollection !== "all") {
        // 특정 컬렉션의 북마크들
        filteredBookmarks = bookmarkList.filter(
          (bookmark) => bookmark.collection === selectedCollection
        );
        console.log("특정 컬렉션 필터 결과:", filteredBookmarks.length);
        console.log(
          "북마크 컬렉션들:",
          bookmarkList.map((b) => ({ id: b.id, collection: b.collection }))
        );
      }

      console.log("최종 필터링 결과:", filteredBookmarks.length);
      setBookmarks(filteredBookmarks);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
    } finally {
      setLoading(false);
    }
  };

  // 북마크 추가
  const addBookmark = async (bookmarkData: BookmarkFormData) => {
    try {
      // 새로운 북마크의 order는 현재 최대 order + 1
      const maxOrder =
        bookmarks.length > 0 ? Math.max(...bookmarks.map((b) => b.order)) : 0;
      const newOrder = maxOrder + 1;

      const docRef = await addDoc(collection(db, "bookmarks"), {
        ...bookmarkData,
        order: newOrder,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 새로 추가된 북마크를 목록에 추가
      const newBookmark: Bookmark = {
        id: docRef.id,
        ...bookmarkData,
        order: newOrder,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setBookmarks((prev) => [...prev, newBookmark]);
      return docRef.id;
    } catch (error) {
      console.error("Error adding bookmark:", error);
      throw error;
    }
  };

  // 북마크 삭제
  const deleteBookmark = async (bookmarkId: string) => {
    try {
      await deleteDoc(doc(db, "bookmarks", bookmarkId));
      setBookmarks((prev) =>
        prev.filter((bookmark) => bookmark.id !== bookmarkId)
      );
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      throw error;
    }
  };

  // 북마크 수정
  const updateBookmark = async (
    bookmarkId: string,
    bookmarkData: BookmarkFormData
  ) => {
    try {
      await updateDoc(doc(db, "bookmarks", bookmarkId), {
        ...bookmarkData,
        updatedAt: serverTimestamp(),
      });

      setBookmarks((prev) =>
        prev.map((bookmark) =>
          bookmark.id === bookmarkId
            ? {
                ...bookmark,
                ...bookmarkData,
                updatedAt: new Date(),
              }
            : bookmark
        )
      );
    } catch (error) {
      console.error("Error updating bookmark:", error);
      throw error;
    }
  };

  // 북마크 순서 변경
  const reorderBookmarks = async (newOrder: Bookmark[]) => {
    try {
      const batch = writeBatch(db);

      newOrder.forEach((bookmark, index) => {
        const bookmarkRef = doc(db, "bookmarks", bookmark.id);
        batch.update(bookmarkRef, {
          order: index + 1,
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();
      setBookmarks(
        newOrder.map((bookmark, index) => ({
          ...bookmark,
          order: index + 1,
          updatedAt: new Date(),
        }))
      );
    } catch (error) {
      console.error("Error reordering bookmarks:", error);
      throw error;
    }
  };

  // 기존 북마크들에 order 필드 추가 (마이그레이션)
  const migrateBookmarkOrder = async () => {
    try {
      console.log("북마크 순서 마이그레이션 시작...");

      const q = query(
        collection(db, "bookmarks"),
        where("userId", "==", userId),
        orderBy("createdAt", "asc")
      );

      const querySnapshot = await getDocs(q);
      const bookmarksToMigrate = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter(
          (bookmark: Record<string, unknown>) => bookmark.order === undefined
        );

      if (bookmarksToMigrate.length === 0) {
        console.log("마이그레이션이 필요하지 않습니다.");
        return;
      }

      console.log(
        `${bookmarksToMigrate.length}개의 북마크에 order 필드를 추가합니다...`
      );

      const batch = writeBatch(db);

      bookmarksToMigrate.forEach(
        (bookmark: Record<string, unknown>, index: number) => {
          const bookmarkRef = doc(db, "bookmarks", bookmark.id as string);
          batch.update(bookmarkRef, {
            order: index + 1,
            updatedAt: serverTimestamp(),
          });
        }
      );

      await batch.commit();
      console.log("북마크 순서 마이그레이션 완료!");

      // 마이그레이션 후 북마크 목록 새로고침
      await fetchBookmarks();
    } catch (error) {
      console.error("마이그레이션 중 오류:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (userId) {
      fetchBookmarks();
    }
  }, [userId, selectedCollection]);

  return {
    bookmarks,
    loading,
    selectedCollection,
    setSelectedCollection,
    addBookmark,
    deleteBookmark,
    updateBookmark,
    reorderBookmarks,
    migrateBookmarkOrder,
    refetch: fetchBookmarks,
  };
};
