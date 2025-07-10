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
import type { Bookmark, BookmarkFormData } from "../types";

export const useBookmarks = (userId: string) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState<string>("all");

  // 북마크 목록 가져오기
  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      let q;
      if (selectedCollection === "all") {
        q = query(
          collection(db, "bookmarks"),
          where("userId", "==", userId),
          orderBy("createdAt", "desc")
        );
      } else if (selectedCollection === "none") {
        // 컬렉션이 없는 북마크들 - 클라이언트에서 필터링
        q = query(
          collection(db, "bookmarks"),
          where("userId", "==", userId),
          orderBy("createdAt", "desc")
        );
      } else {
        q = query(
          collection(db, "bookmarks"),
          where("userId", "==", userId),
          where("collection", "==", selectedCollection),
          orderBy("createdAt", "desc")
        );
      }

      const querySnapshot = await getDocs(q);
      const bookmarkList: Bookmark[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        bookmarkList.push({
          id: doc.id,
          title: data.title,
          url: data.url,
          description: data.description,
          collection: data.collection || null,
          userId: data.userId,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        });
      });

      // "컬렉션 없음" 필터인 경우 클라이언트에서 필터링
      if (selectedCollection === "none") {
        const filteredBookmarks = bookmarkList.filter(
          (bookmark) => !bookmark.collection || bookmark.collection === ""
        );
        setBookmarks(filteredBookmarks);
      } else {
        setBookmarks(bookmarkList);
      }
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
    } finally {
      setLoading(false);
    }
  };

  // 북마크 추가
  const addBookmark = async (bookmarkData: BookmarkFormData) => {
    try {
      const docRef = await addDoc(collection(db, "bookmarks"), {
        ...bookmarkData,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 새로 추가된 북마크를 목록에 추가
      const newBookmark: Bookmark = {
        id: docRef.id,
        ...bookmarkData,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setBookmarks((prev) => [newBookmark, ...prev]);
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
    refetch: fetchBookmarks,
  };
};
