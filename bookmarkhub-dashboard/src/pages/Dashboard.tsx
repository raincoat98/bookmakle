import { useState } from "react";
import { Header } from "../components/Header";
import { CollectionList } from "../components/CollectionList";
import { BookmarkList } from "../components/BookmarkList";
import { AddBookmarkModal } from "../components/AddBookmarkModal";
import { useAuth } from "../hooks/useAuth";
import { useBookmarks } from "../hooks/useBookmarks";
import type { BookmarkFormData } from "../types";

export const Dashboard = () => {
  const { user } = useAuth();
  const {
    bookmarks,
    loading,
    selectedCollection,
    setSelectedCollection,
    addBookmark,
    deleteBookmark,
  } = useBookmarks(user?.uid || "");

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddBookmark = async (bookmarkData: BookmarkFormData) => {
    await addBookmark(bookmarkData);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <div className="flex h-[calc(100vh-4rem)]">
        <CollectionList
          selectedCollection={selectedCollection}
          onCollectionChange={setSelectedCollection}
        />

        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {selectedCollection === "all"
                ? "전체 북마크"
                : selectedCollection === "default"
                ? "기본"
                : selectedCollection === "work"
                ? "Work"
                : "Personal"}
            </h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary flex items-center space-x-2"
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span>북마크 추가</span>
            </button>
          </div>

          <BookmarkList
            bookmarks={bookmarks}
            loading={loading}
            onDelete={deleteBookmark}
          />
        </div>
      </div>

      <AddBookmarkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddBookmark}
      />
    </div>
  );
};
