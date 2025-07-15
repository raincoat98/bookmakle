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
            isFavorite: data.isFavorite || false, // 즐겨찾기 필드 추가
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
          // order 필드가 있는 경우 우선적으로 사용
          if (a.order !== undefined && b.order !== undefined) {
            // order가 0이 아닌 경우에만 order로 정렬
            if (a.order !== 0 || b.order !== 0) {
              console.log(
                `Sorting by order: ${a.title}(${a.order}) vs ${b.title}(${b.order})`
              ); // 디버깅 로그
              return a.order - b.order;
            }
          }
          // order가 없거나 둘 다 0인 경우 생성일 기준으로 정렬
          console.log(`Sorting by date: ${a.title} vs ${b.title}`); // 디버깅 로그
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

        console.log("처리된 북마크:", filteredBookmarks.length, "개");
        console.log(
          "정렬된 북마크 순서:",
          filteredBookmarks.map((b) => ({
            title: b.title,
            order: b.order,
            isFavorite: b.isFavorite,
          }))
        ); // 디버깅 로그
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

  // isFavorite 필드 마이그레이션 함수 추가
  const migrateIsFavorite = async () => {
    if (!userId) return;

    const batch = writeBatch(db);
    let updatedCount = 0;

    for (const bookmark of bookmarks) {
      if (bookmark.isFavorite === undefined) {
        try {
          const bookmarkRef = doc(db, "bookmarks", bookmark.id);
          batch.update(bookmarkRef, { isFavorite: false });
          updatedCount++;
        } catch (error) {
          console.error(
            `북마크 ${bookmark.id}의 isFavorite 마이그레이션 실패:`,
            error
          );
        }
      }
    }

    if (updatedCount > 0) {
      try {
        await batch.commit();
        console.log(
          `${updatedCount}개의 북마크 isFavorite 필드가 마이그레이션되었습니다.`
        );
      } catch (error) {
        console.error("isFavorite 마이그레이션 실패:", error);
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
      isFavorite: bookmarkData.isFavorite || false, // 즐겨찾기 필드 추가
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
      isFavorite: bookmarkData.isFavorite || false, // 즐겨찾기 필드 추가
    });
  };

  const deleteBookmark = async (bookmarkId: string) => {
    await deleteDoc(doc(db, "bookmarks", bookmarkId));
  };

  const reorderBookmarks = async (newBookmarks: Bookmark[]) => {
    if (!userId) return;

    console.log(
      "reorderBookmarks called with:",
      newBookmarks.length,
      "bookmarks"
    ); // 디버깅 로그
    console.log(
      "New order:",
      newBookmarks.map((b) => ({ id: b.id, title: b.title, order: b.order }))
    ); // 디버깅 로그

    const batch = writeBatch(db);

    newBookmarks.forEach((bookmark, index) => {
      const bookmarkRef = doc(db, "bookmarks", bookmark.id);
      batch.update(bookmarkRef, { order: index });
      console.log(`Updating ${bookmark.title} with order: ${index}`); // 디버깅 로그
    });

    await batch.commit();
    console.log("reorderBookmarks completed successfully"); // 디버깅 로그
  };

  // 즐겨찾기 토글 함수 추가
  const toggleFavorite = async (bookmarkId: string, isFavorite: boolean) => {
    if (!userId) throw new Error("사용자가 로그인되지 않았습니다.");

    const bookmarkRef = doc(db, "bookmarks", bookmarkId);
    await updateDoc(bookmarkRef, {
      isFavorite: isFavorite,
      updatedAt: new Date(),
    });
  };

  return {
    bookmarks,
    loading,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    reorderBookmarks,
    toggleFavorite, // 즐겨찾기 토글 함수 추가
    migrateFavicons,
    migrateIsFavorite, // isFavorite 마이그레이션 함수 추가
  };
};
