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
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Bookmark, BookmarkFormData, Collection } from "../types";

export const useBookmarks = (userId: string) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] =
    useState<Collection>("all");

  // 북마크 목록 가져오기
  const fetchBookmarks = async () => {
    try {
      setLoading(true);
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
          title: data.title,
          url: data.url,
          description: data.description,
          collection: data.collection,
          userId: data.userId,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        });
      });

      setBookmarks(bookmarkList);
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

  // 컬렉션별 필터링된 북마크
  const filteredBookmarks =
    selectedCollection === "all"
      ? bookmarks
      : bookmarks.filter(
          (bookmark) => bookmark.collection === selectedCollection
        );

  useEffect(() => {
    if (userId) {
      fetchBookmarks();
    }
  }, [userId]);

  return {
    bookmarks: filteredBookmarks,
    loading,
    selectedCollection,
    setSelectedCollection,
    addBookmark,
    deleteBookmark,
    refetch: fetchBookmarks,
  };
};
