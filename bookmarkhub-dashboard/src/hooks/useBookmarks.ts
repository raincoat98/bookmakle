import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Bookmark, BookmarkFormData } from "../types";
import { getFaviconUrl } from "../utils/favicon";

export const useBookmarks = (
  userId: string,
  selectedCollection: string = "all"
) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setBookmarks([]);
      setLoading(false);
      return;
    }

    console.log(
      "북마크 로딩 시작, userId:",
      userId,
      "selectedCollection:",
      selectedCollection
    );

    // 컬렉션에 따라 쿼리 조건 설정
    let q;
    if (selectedCollection === "none") {
      // 컬렉션이 없는 북마크들 - Firestore 제한으로 인해 모든 북마크를 가져온 후 클라이언트에서 필터링
      q = query(collection(db, "bookmarks"), where("userId", "==", userId));
    } else if (selectedCollection === "all") {
      // 모든 북마크
      q = query(collection(db, "bookmarks"), where("userId", "==", userId));
    } else {
      // 특정 컬렉션의 북마크들
      q = query(
        collection(db, "bookmarks"),
        where("userId", "==", userId),
        where("collection", "==", selectedCollection)
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const bookmarkList: Bookmark[] = [];
        console.log("북마크 쿼리 결과:", querySnapshot.size, "개");

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log("북마크 데이터:", doc.id, data);
          bookmarkList.push({
            id: doc.id,
            title: data.title || "",
            url: data.url || "",
            description: data.description || "",
            favicon: data.favicon || "",
            collection: data.collection || null,
            order: data.order || 0,
            userId: data.userId || "",
            createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
            updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
            tags: data.tags || [],
          });
        });

        // "none" 컬렉션의 경우 클라이언트에서 필터링
        let filteredBookmarks = bookmarkList;
        if (selectedCollection === "none") {
          filteredBookmarks = bookmarkList.filter(
            (bookmark) =>
              !bookmark.collection ||
              bookmark.collection === "" ||
              bookmark.collection === null
          );
          console.log(
            "컬렉션 없음 필터링 결과:",
            filteredBookmarks.length,
            "개"
          );
        }

        // 클라이언트에서 정렬
        filteredBookmarks.sort((a, b) => {
          if (a.order === 0 && b.order === 0) {
            return b.createdAt.getTime() - a.createdAt.getTime();
          }
          return a.order - b.order;
        });

        console.log("처리된 북마크:", filteredBookmarks.length, "개");
        setBookmarks(filteredBookmarks);
        setLoading(false);
      },
      (error) => {
        console.error("북마크 로딩 오류:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, selectedCollection]);

  // favicon 필드 마이그레이션 함수
  const migrateFavicons = async () => {
    if (!userId) return;

    const batch = writeBatch(db);
    let updatedCount = 0;

    for (const bookmark of bookmarks) {
      if (!bookmark.favicon && bookmark.url) {
        try {
          const faviconUrl = getFaviconUrl(bookmark.url);
          const bookmarkRef = doc(db, "bookmarks", bookmark.id);
          batch.update(bookmarkRef, { favicon: faviconUrl });
          updatedCount++;
        } catch (error) {
          console.error(
            `북마크 ${bookmark.id}의 파비콘 마이그레이션 실패:`,
            error
          );
        }
      }
    }

    if (updatedCount > 0) {
      try {
        await batch.commit();
        console.log(
          `${updatedCount}개의 북마크 파비콘이 마이그레이션되었습니다.`
        );
      } catch (error) {
        console.error("파비콘 마이그레이션 실패:", error);
      }
    }
  };

  const addBookmark = async (bookmarkData: BookmarkFormData) => {
    if (!userId) throw new Error("사용자가 로그인되지 않았습니다.");

    // favicon이 없으면 자동으로 가져오기
    let favicon = bookmarkData.favicon;
    if (!favicon && bookmarkData.url) {
      favicon = getFaviconUrl(bookmarkData.url);
    }

    const newBookmark = {
      title: bookmarkData.title,
      url: bookmarkData.url,
      description: bookmarkData.description,
      favicon: favicon,
      collection: bookmarkData.collection || null,
      order: bookmarks.length,
      userId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: bookmarkData.tags || [],
    };

    await addDoc(collection(db, "bookmarks"), newBookmark);
  };

  const updateBookmark = async (
    bookmarkId: string,
    bookmarkData: BookmarkFormData
  ) => {
    if (!userId) throw new Error("사용자가 로그인되지 않았습니다.");

    // favicon이 없으면 자동으로 가져오기
    let favicon = bookmarkData.favicon;
    if (!favicon && bookmarkData.url) {
      favicon = getFaviconUrl(bookmarkData.url);
    }

    const bookmarkRef = doc(db, "bookmarks", bookmarkId);
    await updateDoc(bookmarkRef, {
      title: bookmarkData.title,
      url: bookmarkData.url,
      description: bookmarkData.description,
      favicon: favicon,
      collection: bookmarkData.collection || null,
      updatedAt: new Date(),
      tags: bookmarkData.tags || [],
    });
  };

  const deleteBookmark = async (bookmarkId: string) => {
    await deleteDoc(doc(db, "bookmarks", bookmarkId));
  };

  const reorderBookmarks = async (newBookmarks: Bookmark[]) => {
    if (!userId) return;

    const batch = writeBatch(db);

    newBookmarks.forEach((bookmark, index) => {
      const bookmarkRef = doc(db, "bookmarks", bookmark.id);
      batch.update(bookmarkRef, { order: index });
    });

    await batch.commit();
  };

  return {
    bookmarks,
    loading,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    reorderBookmarks,
    migrateFavicons,
  };
};
