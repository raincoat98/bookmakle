import {
  collection,
  getDocs,
  doc,
  query,
  where,
  orderBy,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export const migrateBookmarkOrder = async (userId: string) => {
  try {
    console.log("북마크 순서 마이그레이션 시작...");

    // 사용자의 모든 북마크 가져오기
    const q = query(
      collection(db, "bookmarks"),
      where("userId", "==", userId),
      orderBy("createdAt", "asc")
    );

    const querySnapshot = await getDocs(q);
    const bookmarks = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // order 필드가 없는 북마크들만 필터링
    const bookmarksWithoutOrder = bookmarks.filter(
      (bookmark: Record<string, unknown>) => bookmark.order === undefined
    );

    if (bookmarksWithoutOrder.length === 0) {
      console.log("마이그레이션이 필요하지 않습니다.");
      return;
    }

    console.log(
      `${bookmarksWithoutOrder.length}개의 북마크에 order 필드를 추가합니다...`
    );

    // 배치 업데이트로 order 필드 추가
    const batch = writeBatch(db);

    bookmarksWithoutOrder.forEach((bookmark, index) => {
      const bookmarkRef = doc(db, "bookmarks", bookmark.id);
      batch.update(bookmarkRef, {
        order: index + 1,
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
    console.log("북마크 순서 마이그레이션 완료!");
  } catch (error) {
    console.error("마이그레이션 중 오류:", error);
    throw error;
  }
};

// 전역 함수로 노출 (브라우저에서 호출 가능)
if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).migrateBookmarkOrder =
    migrateBookmarkOrder;
}
