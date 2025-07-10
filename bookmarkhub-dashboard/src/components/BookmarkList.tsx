import { useState, useEffect } from "react";
import { BookmarkCard } from "./BookmarkCard";
import { BookmarkListItem } from "./BookmarkListItem";
import type { Bookmark, Collection } from "../types";

type ViewType = "grid" | "list";

interface BookmarkListProps {
  bookmarks: Bookmark[];
  collections: Collection[];
  loading: boolean;
  onDelete: (id: string) => void;
  onEdit: (bookmark: Bookmark) => void;
}

export const BookmarkList = ({
  bookmarks,
  collections,
  loading,
  onDelete,
  onEdit,
}: BookmarkListProps) => {
  const [viewType, setViewType] = useState<ViewType>("grid");

  // 로컬 스토리지에서 뷰 타입 불러오기
  useEffect(() => {
    const savedViewType = localStorage.getItem(
      "bookmark-view-type"
    ) as ViewType;
    if (
      savedViewType &&
      (savedViewType === "grid" || savedViewType === "list")
    ) {
      setViewType(savedViewType);
    }
  }, []);

  // 뷰 타입 변경 시 로컬 스토리지에 저장
  const handleViewTypeChange = (newViewType: ViewType) => {
    setViewType(newViewType);
    localStorage.setItem("bookmark-view-type", newViewType);
  };

  if (loading) {
    return (
      <div className="flex-1 p-4 lg:p-6 overflow-y-auto scrollbar-hide">
        {viewType === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="flex-1 p-4 lg:p-6 overflow-y-auto scrollbar-hide">
        <div className="text-center py-8 lg:py-12">
          <div className="text-4xl lg:text-6xl mb-4">📚</div>
          <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-2">
            북마크가 없습니다
          </h3>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
            첫 번째 북마크를 추가해보세요!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 lg:p-6 overflow-y-auto scrollbar-hide">
      {/* 뷰 전환 버튼 */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          총 {bookmarks.length}개의 북마크
        </div>
        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => handleViewTypeChange("grid")}
            className={`p-2 rounded-md transition-colors duration-200 ${
              viewType === "grid"
                ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
            title="그리드 뷰"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </button>
          <button
            onClick={() => handleViewTypeChange("list")}
            className={`p-2 rounded-md transition-colors duration-200 ${
              viewType === "list"
                ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
            title="리스트 뷰"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* 북마크 목록 */}
      {viewType === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {bookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              collections={collections}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {bookmarks.map((bookmark) => (
            <BookmarkListItem
              key={bookmark.id}
              bookmark={bookmark}
              collections={collections}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
};
