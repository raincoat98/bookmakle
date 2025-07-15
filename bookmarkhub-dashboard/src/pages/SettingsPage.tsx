import React from "react";
import { Settings } from "../components/Settings";
import { useAuth } from "../hooks/useAuth";
import { useBookmarks } from "../hooks/useBookmarks";
import { useCollections } from "../hooks/useCollections";
import type { Bookmark, Collection } from "../types";
import { Drawer } from "../components/Drawer";

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { bookmarks, addBookmark, deleteBookmark } = useBookmarks(
    user?.uid || "",
    "all"
  );
  const { collections, addCollection, deleteCollection } = useCollections(
    user?.uid || ""
  );

  // 데이터 가져오기 함수
  const handleImportData = async (importData: {
    version: string;
    exportedAt: string;
    bookmarks: Record<string, unknown>[];
    collections: Record<string, unknown>[];
  }) => {
    try {
      // 북마크 데이터 가져오기
      if (importData.bookmarks && Array.isArray(importData.bookmarks)) {
        for (const bookmark of importData.bookmarks) {
          // 기존 북마크와 중복되지 않는 경우에만 추가
          const existingBookmark = bookmarks.find(
            (b) => b.url === bookmark.url
          );
          if (!existingBookmark) {
            await addBookmark({
              title: (bookmark.title as string) || "",
              url: (bookmark.url as string) || "",
              description: (bookmark.description as string) || "",
              favicon: (bookmark.favicon as string) || "",
              collection: (bookmark.collection as string) || "",
              tags: (bookmark.tags as string[]) || [],
              isFavorite: (bookmark.isFavorite as boolean) || false,
            });
          }
        }
      }

      // 컬렉션 데이터 가져오기
      if (importData.collections && Array.isArray(importData.collections)) {
        for (const collection of importData.collections) {
          // 기존 컬렉션과 중복되지 않는 경우에만 추가
          const existingCollection = collections.find(
            (c) => c.name === collection.name
          );
          if (!existingCollection) {
            await addCollection({
              name: (collection.name as string) || "",
              description: (collection.description as string) || "",
              icon: (collection.icon as string) || "📁",
              parentId: (collection.parentId as string) || null,
            });
          }
        }
      }
    } catch (error) {
      console.error("Import error:", error);
      throw error;
    }
  };

  // 데이터 복원 함수
  const handleRestoreBackup = async (backupData: {
    bookmarks: Bookmark[];
    collections: Collection[];
  }) => {
    try {
      // 기존 데이터 전체 삭제
      for (const bookmark of bookmarks) {
        if (bookmark.id) await deleteBookmark(bookmark.id);
      }
      for (const collection of collections) {
        if (collection.id) await deleteCollection(collection.id);
      }
      // 백업 데이터로 복원
      if (backupData.bookmarks && Array.isArray(backupData.bookmarks)) {
        for (const bookmark of backupData.bookmarks) {
          const exists = bookmarks.some((b) => b.url === bookmark.url);
          if (!exists) {
            await addBookmark({
              title: bookmark.title,
              url: bookmark.url,
              description: bookmark.description ?? "",
              favicon: bookmark.favicon,
              collection: bookmark.collection ?? "",
              tags: bookmark.tags ?? [],
              isFavorite: bookmark.isFavorite ?? false,
            });
          }
        }
      }
      if (backupData.collections && Array.isArray(backupData.collections)) {
        for (const collection of backupData.collections) {
          const exists = collections.some((c) => c.name === collection.name);
          if (!exists) {
            await addCollection({
              name: collection.name,
              description: collection.description ?? "",
              icon: collection.icon ?? "📁",
              parentId: collection.parentId ?? null,
            });
          }
        }
      }
    } catch (error) {
      console.error("Restore error:", error);
      throw error;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            로그인이 필요합니다
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            설정을 변경하려면 먼저 로그인해주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Drawer>
      <Settings
        onBack={() => window.history.back()}
        onImportData={handleImportData}
        onRestoreBackup={handleRestoreBackup}
      />
    </Drawer>
  );
};
