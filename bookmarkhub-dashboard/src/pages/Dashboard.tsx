import { useState, useEffect, useMemo } from "react";
import { AddBookmarkModal } from "../components/AddBookmarkModal";
import { EditBookmarkModal } from "../components/EditBookmarkModal";
import { BookmarkList } from "../components/BookmarkList";
import { CollectionList } from "../components/CollectionList";
import { Header } from "../components/Header";
import { useAuth } from "../hooks/useAuth";
import { useBookmarks } from "../hooks/useBookmarks";
import { useCollections } from "../hooks/useCollections";
import { DeleteBookmarkModal } from "../components/DeleteBookmarkModal";
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
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // 북마크 삭제 모달 상태
  const [deleteBookmarkModal, setDeleteBookmarkModal] = useState<{
    isOpen: boolean;
    bookmark: Bookmark | null;
  }>({
    isOpen: false,
    bookmark: null,
  });
  const [isDeletingBookmark, setIsDeletingBookmark] = useState(false);

  // 북마크 데이터가 변경될 때마다 정렬 상태 초기화
  useEffect(() => {
    setSortedBookmarks(bookmarks);
  }, [bookmarks]);

  // 전체 북마크에서 사용된 태그 집계 (중복 없이)
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    bookmarks.forEach((b) => b.tags?.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [bookmarks]);

  // 하위 컬렉션 ID들을 재귀적으로 가져오는 함수
  const getChildCollectionIds = (parentId: string): string[] => {
    const childIds: string[] = [];
    const getChildren = (id: string) => {
      const children = collections.filter((col) => col.parentId === id);
      children.forEach((child) => {
        childIds.push(child.id);
        getChildren(child.id);
      });
    };
    getChildren(parentId);
    return childIds;
  };

  // 필터링된 북마크 (그룹화된 형태)
  const filteredBookmarksData = useMemo(() => {
    const filtered = sortedBookmarks.filter((bookmark) => {
      const matchesSearch = searchTerm
        ? bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bookmark.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (bookmark.description &&
            bookmark.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))
        : true;

      const matchesTag = selectedTag
        ? bookmark.tags && bookmark.tags.includes(selectedTag)
        : true;

      if (selectedCollection === "all") {
        return matchesSearch && matchesTag;
      } else if (selectedCollection === "none") {
        return (
          matchesSearch &&
          matchesTag &&
          (!bookmark.collection || bookmark.collection === "")
        );
      } else {
        // 선택된 컬렉션과 모든 하위 컬렉션의 북마크들 포함
        const childCollectionIds = getChildCollectionIds(selectedCollection);
        const targetCollectionIds = [selectedCollection, ...childCollectionIds];

        return (
          matchesSearch &&
          matchesTag &&
          bookmark.collection &&
          targetCollectionIds.includes(bookmark.collection)
        );
      }
    });

    // 상위 컬렉션이 선택된 경우 하위 컬렉션별로 그룹화
    if (
      selectedCollection !== "all" &&
      selectedCollection !== "none" &&
      selectedCollection
    ) {
      const childCollectionIds = getChildCollectionIds(selectedCollection);
      if (childCollectionIds.length > 0) {
        // 선택된 컬렉션의 북마크들
        const selectedCollectionBookmarks = filtered.filter(
          (bookmark) => bookmark.collection === selectedCollection
        );

        // 하위 컬렉션별로 그룹화
        const groupedBookmarks: {
          collectionId: string;
          collectionName: string;
          bookmarks: Bookmark[];
        }[] = [];

        childCollectionIds.forEach((childId) => {
          const childCollection = collections.find((col) => col.id === childId);
          if (childCollection) {
            const childBookmarks = filtered.filter(
              (bookmark) => bookmark.collection === childId
            );
            if (childBookmarks.length > 0) {
              groupedBookmarks.push({
                collectionId: childId,
                collectionName: childCollection.name,
                bookmarks: childBookmarks,
              });
            }
          }
        });

        // 선택된 컬렉션과 하위 컬렉션들을 합쳐서 반환
        return {
          isGrouped: true,
          selectedCollectionBookmarks,
          selectedCollectionName:
            collections.find((col) => col.id === selectedCollection)?.name ||
            "선택된 컬렉션",
          groupedBookmarks,
        };
      }
    }

    // 그룹화가 필요없는 경우 일반 배열 반환
    return {
      isGrouped: false,
      bookmarks: filtered,
    };
  }, [
    sortedBookmarks,
    searchTerm,
    selectedCollection,
    selectedTag,
    collections,
  ]);

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
          tags: bookmark.tags || [],
        });
      }
    } catch (error) {
      console.error("Error updating favicon:", error);
      alert("파비콘 업데이트 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    setIsDeletingBookmark(true);
    try {
      await deleteBookmark(id);
      setDeleteBookmarkModal({ isOpen: false, bookmark: null });
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      alert("북마크 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeletingBookmark(false);
    }
  };

  const openDeleteBookmarkModal = (bookmark: Bookmark) => {
    setDeleteBookmarkModal({ isOpen: true, bookmark });
  };

  const closeDeleteBookmarkModal = () => {
    setDeleteBookmarkModal({ isOpen: false, bookmark: null });
  };

  const handleReorderBookmarks = (newBookmarks: Bookmark[]) => {
    setSortedBookmarks(newBookmarks);
  };

  const handleAddCollection = async (
    name: string,
    description: string,
    icon: string,
    parentId?: string | null
  ) => {
    await addCollection({
      name,
      description,
      icon,
      parentId: parentId ?? null,
    });
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
      <Header onMenuClick={() => setIsDrawerOpen(true)} showMenuButton={true} />

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
            <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full transform transition-all duration-300 ease-in-out translate-x-0 opacity-100 animate-slide-in-left shadow-xl">
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
              className="flex-1 bg-black bg-opacity-30 transition-opacity duration-300"
              onClick={() => setIsDrawerOpen(false)}
            />
          </div>
        )}

        {/* 메인 콘텐츠 */}
        <div className="flex-1 flex flex-col w-full min-w-0">
          {/* 북마크 리스트 상단 컨트롤 바 */}
          <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between w-full">
              {/* 검색 */}
              <div className="flex-1 min-w-0 w-full">
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="북마크 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0"
                  />
                  <svg
                    className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* 뷰 모드 변경 및 북마크 추가 버튼 */}
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {/* 뷰 모드 변경 버튼 */}
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 w-auto">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-md transition-colors min-w-[40px] ${
                      viewMode === "grid"
                        ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                    title="그리드 뷰"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-md transition-colors min-w-[40px] ${
                      viewMode === "list"
                        ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                    title="리스트 뷰"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
                    </svg>
                  </button>
                </div>

                {/* 북마크 추가 버튼 */}
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 w-full sm:w-auto"
                >
                  <svg
                    className="w-5 h-5 mr-2"
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
                  북마크 추가
                </button>
              </div>
            </div>
          </div>

          {/* 북마크 목록 */}
          <div className="flex-1 p-4 lg:p-6 overflow-y-auto w-full min-w-0">
            <BookmarkList
              bookmarks={filteredBookmarksData}
              onEdit={setEditingBookmark}
              onDelete={openDeleteBookmarkModal}
              onUpdateFavicon={handleUpdateFavicon}
              onReorder={handleReorderBookmarks}
              viewMode={viewMode}
            />
            {/* 태그 필터 UI */}
            {(() => {
              // 현재 표시되는 북마크들에서 태그가 있는 북마크가 있는지 확인
              const currentBookmarks = (() => {
                if (
                  typeof filteredBookmarksData === "object" &&
                  "isGrouped" in filteredBookmarksData &&
                  filteredBookmarksData.isGrouped
                ) {
                  const groupedData = filteredBookmarksData as {
                    isGrouped: true;
                    selectedCollectionBookmarks: Bookmark[];
                    selectedCollectionName: string;
                    groupedBookmarks: {
                      collectionId: string;
                      collectionName: string;
                      bookmarks: Bookmark[];
                    }[];
                  };
                  return [
                    ...groupedData.selectedCollectionBookmarks,
                    ...groupedData.groupedBookmarks.flatMap(
                      (group) => group.bookmarks
                    ),
                  ];
                } else {
                  const bookmarksArray = Array.isArray(filteredBookmarksData)
                    ? filteredBookmarksData
                    : filteredBookmarksData.bookmarks || [];
                  return bookmarksArray;
                }
              })();

              const hasBookmarksWithTags = currentBookmarks.some(
                (bookmark) => bookmark.tags && bookmark.tags.length > 0
              );

              return allTags.length > 0 && hasBookmarksWithTags ? (
                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      selectedTag === null
                        ? "bg-purple-500 text-white border-purple-500"
                        : "bg-gray-100 text-gray-700 border-gray-200"
                    }`}
                    onClick={() => setSelectedTag(null)}
                  >
                    전체
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        selectedTag === tag
                          ? "bg-purple-500 text-white border-purple-500"
                          : "bg-gray-100 text-purple-700 border-gray-200 hover:bg-purple-100"
                      }`}
                      onClick={() => setSelectedTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              ) : null;
            })()}
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

          {/* 북마크 삭제 모달 */}
          <DeleteBookmarkModal
            isOpen={deleteBookmarkModal.isOpen}
            onClose={closeDeleteBookmarkModal}
            onDelete={handleDeleteBookmark}
            bookmark={deleteBookmarkModal.bookmark}
            isDeleting={isDeletingBookmark}
          />
        </div>
      </div>
    </div>
  );
};
