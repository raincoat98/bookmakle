import { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { CollectionList } from "../components/CollectionList";
import { BookmarkList } from "../components/BookmarkList";
import { AddBookmarkModal } from "../components/AddBookmarkModal";
import { useAuth } from "../hooks/useAuth";
import { useBookmarks } from "../hooks/useBookmarks";
import { useCollections } from "../hooks/useCollections";
import type { BookmarkFormData } from "../types";

export const Dashboard = () => {
  const { user } = useAuth();
  const {
    bookmarks,
    loading: bookmarksLoading,
    selectedCollection,
    setSelectedCollection,
    addBookmark,
    deleteBookmark,
    refetch: refetchBookmarks,
  } = useBookmarks(user?.uid || "");

  const {
    collections,
    loading: collectionsLoading,
    addCollection,
    deleteCollection,
  } = useCollections(user?.uid || "");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // 검색어에 따라 북마크 필터링
  const filteredBookmarks = bookmarks.filter((b) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      b.title.toLowerCase().includes(term) ||
      (b.description && b.description.toLowerCase().includes(term)) ||
      b.url.toLowerCase().includes(term)
    );
  });

  // 모바일 화면 크기 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 모바일에서 컬렉션 선택 시 사이드바 닫기
  const handleCollectionChange = (collectionId: string) => {
    setSelectedCollection(collectionId);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const handleAddBookmark = async (bookmarkData: BookmarkFormData) => {
    await addBookmark(bookmarkData);
  };

  const handleAddCollection = async (name: string, icon: string) => {
    await addCollection({ name, icon });
  };

  const handleDeleteCollection = async (collectionId: string) => {
    await deleteCollection(collectionId);
    // 컬렉션 삭제 후 북마크 목록 새로고침
    await refetchBookmarks();
  };

  // 선택된 컬렉션의 이름 가져오기
  const getSelectedCollectionName = () => {
    if (selectedCollection === "all") return "전체 북마크";
    const collection = collections.find((c) => c.id === selectedCollection);
    return collection ? collection.name : "컬렉션";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        showMenuButton={isMobile}
      />

      <div className="flex h-[calc(100vh-4rem)] relative">
        {/* 사이드바 오버레이 (모바일) */}
        {isMobile && isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* 사이드바 */}
        <div
          className={`
          ${
            isMobile
              ? `fixed top-16 left-0 h-full z-50 transform transition-transform duration-300 ease-in-out ${
                  isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`
              : "relative"
          }
          ${!isMobile ? "w-64" : "w-80"}
        `}
        >
          <CollectionList
            collections={collections}
            loading={collectionsLoading}
            selectedCollection={selectedCollection}
            onCollectionChange={handleCollectionChange}
            onAddCollection={handleAddCollection}
            onDeleteCollection={handleDeleteCollection}
          />
        </div>

        {/* 메인 콘텐츠 */}
        <div
          className={`
          flex-1 flex flex-col
          ${isMobile && isSidebarOpen ? "hidden" : ""}
        `}
        >
          <div className="flex justify-between items-center p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
              {getSelectedCollectionName()}
            </h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary flex items-center space-x-2 text-sm lg:text-base"
              disabled={collections.length === 0}
            >
              <svg
                className="w-4 h-4 lg:w-5 lg:h-5"
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
              <span className="hidden sm:inline">북마크 추가</span>
            </button>
          </div>

          {/* 검색 입력창 */}
          <div className="p-4 lg:p-6 border-b border-gray-100 dark:border-gray-800">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="북마크 검색 (제목, 설명, URL)"
              className="w-full max-w-md px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <BookmarkList
            bookmarks={filteredBookmarks}
            collections={collections}
            loading={bookmarksLoading}
            onDelete={deleteBookmark}
          />
        </div>
      </div>

      <AddBookmarkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddBookmark}
        collections={collections}
      />
    </div>
  );
};
