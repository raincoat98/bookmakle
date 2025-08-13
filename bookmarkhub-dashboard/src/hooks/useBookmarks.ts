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
import { getFaviconUrl, refreshFavicon } from "../utils/favicon";

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

    try {
      console.log("북마크 추가 시작:", bookmarkData);

      // 데이터 유효성 검사
      if (!bookmarkData.title || !bookmarkData.title.trim()) {
        throw new Error("북마크 제목은 필수입니다.");
      }

      if (!bookmarkData.url || !bookmarkData.url.trim()) {
        throw new Error("북마크 URL은 필수입니다.");
      }

      // URL 유효성 검사
      try {
        new URL(
          bookmarkData.url.startsWith("http")
            ? bookmarkData.url
            : `https://${bookmarkData.url}`
        );
      } catch {
        throw new Error("올바른 URL 형식이 아닙니다.");
      }

      // favicon이 없으면 자동으로 가져오기
      let favicon = bookmarkData.favicon;
      if (!favicon && bookmarkData.url) {
        favicon = getFaviconUrl(bookmarkData.url);
      }

      const newBookmark = {
        title: bookmarkData.title.trim(),
        url: bookmarkData.url.trim(),
        description: bookmarkData.description || "",
        favicon: favicon || "",
        collection: bookmarkData.collection || null,
        order: bookmarks.length,
        userId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: Array.isArray(bookmarkData.tags) ? bookmarkData.tags : [],
        isFavorite: Boolean(bookmarkData.isFavorite),
      };

      console.log("Firestore에 저장할 북마크 데이터:", newBookmark);

      // Firestore에 저장
      const docRef = await addDoc(collection(db, "bookmarks"), newBookmark);
      console.log("북마크 추가 성공, 문서 ID:", docRef.id);
    } catch (error) {
      console.error("북마크 추가 실패 - 상세 오류:", error);
      console.error("오류 타입:", typeof error);
      console.error(
        "오류 메시지:",
        error instanceof Error ? error.message : "알 수 없는 오류"
      );
      console.error(
        "오류 스택:",
        error instanceof Error ? error.stack : "스택 없음"
      );
      throw error;
    }
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
      description: bookmarkData.description || "",
      favicon: favicon || "",
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

  // 파비콘 새로고침 함수 추가
  const updateBookmarkFavicon = async (bookmarkId: string, url: string) => {
    if (!userId) throw new Error("사용자가 로그인되지 않았습니다.");

    try {
      const newFavicon = await refreshFavicon(url);
      const bookmarkRef = doc(db, "bookmarks", bookmarkId);
      await updateDoc(bookmarkRef, {
        favicon: newFavicon,
        updatedAt: new Date(),
      });
      return newFavicon;
    } catch (error) {
      console.error("파비콘 새로고침 실패:", error);
      throw error;
    }
  };

  return {
    bookmarks,
    loading,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    reorderBookmarks,
    toggleFavorite, // 즐겨찾기 토글 함수 추가
    updateBookmarkFavicon, // 파비콘 새로고침 함수 추가
    migrateFavicons,
    migrateIsFavorite, // isFavorite 마이그레이션 함수 추가
  };
};
