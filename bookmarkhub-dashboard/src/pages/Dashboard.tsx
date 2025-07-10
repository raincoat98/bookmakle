import { useState, useEffect } from "react";
import { AddBookmarkModal } from "../components/AddBookmarkModal";
import { EditBookmarkModal } from "../components/EditBookmarkModal";
import { BookmarkList } from "../components/BookmarkList";
import { CollectionList } from "../components/CollectionList";
import { Header } from "../components/Header";
import { useAuth } from "../hooks/useAuth";
import { useBookmarks } from "../hooks/useBookmarks";
import { useCollections } from "../hooks/useCollections";
import type { Bookmark, BookmarkFormData } from "../types";

export const Dashboard = () => {
  const { user } = useAuth();
  const { bookmarks, addBookmark, updateBookmark, deleteBookmark } =
    useBookmarks(user?.uid || "", "all");
  const { collections, loading, addCollection, deleteCollection } =
    useCollections(user?.uid || "");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [selectedCollection, setSelectedCollection] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortedBookmarks, setSortedBookmarks] = useState<Bookmark[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // 북마크 데이터가 변경될 때마다 정렬 상태 초기화
  useEffect(() => {
    setSortedBookmarks(bookmarks);
  }, [bookmarks]);

  // 선택된 컬렉션에 따라 북마크 필터링
  const filteredBookmarks = sortedBookmarks.filter((bookmark) => {
    const matchesSearch =
      bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bookmark.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bookmark.description &&
        bookmark.description.toLowerCase().includes(searchTerm.toLowerCase()));

    if (selectedCollection === "all") {
      return matchesSearch;
    } else if (selectedCollection === "none") {
      return (
        matchesSearch && (!bookmark.collection || bookmark.collection === "")
      );
    } else {
      return matchesSearch && bookmark.collection === selectedCollection;
    }
  });

  const handleAddBookmark = async (bookmarkData: BookmarkFormData) => {
    try {
      await addBookmark(bookmarkData);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Error adding bookmark:", error);
      alert("북마크 추가 중 오류가 발생했습니다.");
    }
  };

  const handleUpdateBookmark = async (
    id: string,
    bookmarkData: BookmarkFormData
  ) => {
    try {
      await updateBookmark(id, bookmarkData);
      setEditingBookmark(null);
    } catch (error) {
      console.error("Error updating bookmark:", error);
      alert("북마크 수정 중 오류가 발생했습니다.");
    }
  };

  const handleUpdateFavicon = async (id: string, favicon: string) => {
    try {
      const bookmark = bookmarks.find((b) => b.id === id);
      if (bookmark) {
        await updateBookmark(id, {
          title: bookmark.title,
          url: bookmark.url,
          description: bookmark.description || "",
          favicon,
          collection: bookmark.collection || "",
        });
      }
    } catch (error) {
      console.error("Error updating favicon:", error);
      alert("파비콘 업데이트 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    try {
      await deleteBookmark(id);
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      alert("북마크 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleReorderBookmarks = (newBookmarks: Bookmark[]) => {
    setSortedBookmarks(newBookmarks);
  };

  const handleAddCollection = async (
    name: string,
    description: string,
    icon: string
  ) => {
    await addCollection({ name, description, icon });
  };

  const handleDeleteCollection = async (collectionId: string) => {
    await deleteCollection(collectionId);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            로그인이 필요합니다
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            북마크를 관리하려면 먼저 로그인해주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        onMenuClick={() => setIsDrawerOpen(true)}
        showMenuButton={true}
        onAddBookmark={() => setIsAddModalOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className="flex h-[calc(100vh-64px)]">
        {/* 사이드바: 데스크탑에서는 항상, 모바일에서는 Drawer */}
        <div className="hidden sm:flex w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col">
          <CollectionList
            collections={collections}
            loading={loading}
            selectedCollection={selectedCollection}
            onCollectionChange={setSelectedCollection}
            onAddCollection={handleAddCollection}
            onDeleteCollection={handleDeleteCollection}
          />
        </div>
        {/* 모바일 Drawer */}
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
              <CollectionList
                collections={collections}
                loading={loading}
                selectedCollection={selectedCollection}
                onCollectionChange={(id) => {
                  setSelectedCollection(id);
                  setIsDrawerOpen(false);
                }}
                onAddCollection={handleAddCollection}
                onDeleteCollection={handleDeleteCollection}
              />
            </div>
            <div
              className="flex-1 bg-black bg-opacity-30"
              onClick={() => setIsDrawerOpen(false)}
            />
          </div>
        )}

        {/* 메인 콘텐츠 */}
        <div className="flex-1 flex flex-col w-full min-w-0">
          {/* 북마크 목록 */}
          <div className="flex-1 p-4 lg:p-6 overflow-y-auto w-full min-w-0">
            <BookmarkList
              bookmarks={filteredBookmarks}
              collections={collections}
              onEdit={setEditingBookmark}
              onDelete={handleDeleteBookmark}
              onUpdateFavicon={handleUpdateFavicon}
              onReorder={handleReorderBookmarks}
              viewMode={viewMode}
            />
          </div>

          {/* 북마크 추가 모달 */}
          <AddBookmarkModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onAdd={handleAddBookmark}
            collections={collections}
          />

          {/* 북마크 수정 모달 */}
          <EditBookmarkModal
            isOpen={!!editingBookmark}
            onClose={() => setEditingBookmark(null)}
            onUpdate={handleUpdateBookmark}
            bookmark={editingBookmark}
            collections={collections}
          />
        </div>
      </div>
    </div>
  );
};
