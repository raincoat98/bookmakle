import React from "react";
import { Settings } from "../components/Settings";
import { useAuth } from "../hooks/useAuth";
import { useBookmarks } from "../hooks/useBookmarks";
import { useCollections } from "../hooks/useCollections";

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { bookmarks, addBookmark } = useBookmarks(user?.uid || "", "all");
  const { collections, addCollection } = useCollections(user?.uid || "");

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
    <Settings
      onBack={() => window.history.back()}
      onImportData={handleImportData}
    />
  );
};
