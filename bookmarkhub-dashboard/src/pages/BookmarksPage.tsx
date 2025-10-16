import React, { useState, useMemo } from "react";
import { BookmarkList } from "../components/BookmarkList";
import { AddBookmarkModal } from "../components/AddBookmarkModal";
import { EditBookmarkModal } from "../components/EditBookmarkModal";
import { DeleteBookmarkModal } from "../components/DeleteBookmarkModal";
import { AddCollectionModal } from "../components/AddCollectionModal";
import { EditCollectionModal } from "../components/EditCollectionModal";
import { useAuth } from "../hooks/useAuth";
import { useBookmarks } from "../hooks/useBookmarks";
import { useCollections } from "../hooks/useCollections";
import type {
  Bookmark,
  BookmarkFormData,
  Collection,
  SortOption,
} from "../types";
import toast from "react-hot-toast";
import { Search, Grid3X3, List, Plus, FolderPlus } from "lucide-react";
import { Drawer } from "../components/Drawer";

export const BookmarksPage: React.FC = () => {
  const { user } = useAuth();

  // 상태 관리
  const [selectedCollection, setSelectedCollection] = useState("all");

  // 정렬 상태 관리
  const [currentSort, setCurrentSort] = useState<SortOption>({
    field: "order",
    direction: "asc",
    label: "사용자 순서",
  });

  const {
    collections,
    addCollection,
    updateCollection,
    deleteCollection,
    setPinned,
  } = useCollections(user?.uid || "");

  // 핀된 컬렉션을 기본 탭으로 설정
  React.useEffect(() => {
    if (collections.length > 0) {
      const pinnedCollection = collections.find((col) => col.isPinned);
      if (pinnedCollection) {
        setSelectedCollection((current) =>
          current === "all" ? pinnedCollection.id : current
        );
      }
    }
  }, [collections]);
  const {
    bookmarks,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    reorderBookmarks,
    toggleFavorite,
    updateBookmarkFavicon, // 파비콘 새로고침 함수 추가
  } = useBookmarks(user?.uid || "", selectedCollection, collections);

  // 나머지 상태 관리
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(
    null
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [targetCollectionId, setTargetCollectionId] = useState<string | null>(
    null
  );
  const [targetCollectionName, setTargetCollectionName] = useState<string>("");
  const [deletingCollectionId, setDeletingCollectionId] = useState<
    string | null
  >(null);
  const [isAddCollectionModalOpen, setIsAddCollectionModalOpen] =
    useState(false);
  const [isAddSubCollectionModalOpen, setIsAddSubCollectionModalOpen] =
    useState(false);
  const [subCollectionParentId, setSubCollectionParentId] = useState<
    string | null
  >(null);

  // 북마크 삭제 모달 상태
  const [deleteBookmarkModal, setDeleteBookmarkModal] = useState<{
    isOpen: boolean;
    bookmark: Bookmark | null;
  }>({
    isOpen: false,
    bookmark: null,
  });
  const [isDeletingBookmark, setIsDeletingBookmark] = useState(false);

  // 전체 북마크에서 사용된 태그 집계
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    bookmarks.forEach((b) => b.tags?.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [bookmarks]);

  // 하위 컬렉션 ID들을 재귀적으로 가져오는 함수
  const getChildCollectionIds = React.useCallback(
    (parentId: string): string[] => {
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
    },
    [collections]
  );

  // parentId의 깊이 계산 함수
  const getCollectionDepth = (id: string | null): number => {
    let depth = 0;
    let current = collections.find((col) => col.id === id);
    while (current && current.parentId) {
      depth++;
      const parent = collections.find((col) => col.id === current!.parentId);
      if (!parent) break;
      current = parent;
    }
    return depth;
  };

  // 컬렉션 추가 핸들러
  const handleAddCollection = async (
    name: string,
    description: string,
    icon: string,
    parentId?: string | null,
    isPinned?: boolean
  ) => {
    // parentId의 깊이가 2 이상이면 추가 불가
    if (parentId && getCollectionDepth(parentId) >= 2) {
      toast.error("2단계 이상 하위 컬렉션은 추가할 수 없습니다.");
      return;
    }

    try {
      const collectionId = await addCollection({
        name,
        description,
        icon,
        parentId: parentId ?? null,
        isPinned: isPinned ?? false,
      });

      // 핀이 설정된 경우, 다른 컬렉션들의 핀을 해제
      if (isPinned && collectionId) {
        await setPinned(collectionId, true);
      }

      toast.success("컬렉션이 추가되었습니다.");
    } catch (error) {
      console.error("Error adding collection:", error);
      toast.error("컬렉션 추가 중 오류가 발생했습니다.");
    }
  };

  // 필터링된 북마크 (검색 및 태그 필터링만)
  const filteredBookmarksData = useMemo(() => {
    const filtered = bookmarks.filter((bookmark) => {
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

      return matchesSearch && matchesTag;
    });

    // 하위 컬렉션이 있는 경우 그룹화
    if (
      selectedCollection !== "all" &&
      selectedCollection !== "none" &&
      selectedCollection
    ) {
      const childCollectionIds = getChildCollectionIds(selectedCollection);
      if (childCollectionIds.length > 0) {
        const selectedCollectionBookmarks = filtered.filter(
          (bookmark) => bookmark.collection === selectedCollection
        );

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

    return {
      isGrouped: false,
      bookmarks: filtered,
    };
  }, [
    bookmarks,
    searchTerm,
    selectedCollection,
    selectedTag,
    collections,
    getChildCollectionIds,
  ]);

  // 이벤트 핸들러들
  const handleAddBookmark = async (bookmarkData: BookmarkFormData) => {
    try {
      console.log("BookmarksPage - 북마크 추가 시도:", bookmarkData);

      await addBookmark({
        ...bookmarkData,
        isFavorite: bookmarkData.isFavorite || false,
      });
      setIsAddModalOpen(false);
      toast.success("북마크가 추가되었습니다.");
    } catch (error) {
      console.error("BookmarksPage - 북마크 추가 실패:", error);
      console.error("오류 상세:", {
        message: error instanceof Error ? error.message : "알 수 없는 오류",
        stack: error instanceof Error ? error.stack : "스택 없음",
        type: typeof error,
      });

      // 사용자에게 더 구체적인 오류 메시지 표시
      const errorMessage =
        error instanceof Error ? error.message : "알 수 없는 오류";
      toast.error(`북마크 추가 실패: ${errorMessage}`);
    }
  };

  const handleUpdateBookmark = async (
    id: string,
    bookmarkData: BookmarkFormData
  ) => {
    try {
      await updateBookmark(id, {
        ...bookmarkData,
        isFavorite: bookmarkData.isFavorite || false,
      });
      setEditingBookmark(null);
      toast.success("북마크가 수정되었습니다.");
    } catch (error) {
      console.error("Error updating bookmark:", error);
      toast.error("북마크 수정 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    setIsDeletingBookmark(true);
    try {
      await deleteBookmark(id);
      setDeleteBookmarkModal({ isOpen: false, bookmark: null });
      toast.success("북마크가 삭제되었습니다.");
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      toast.error("북마크 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeletingBookmark(false);
    }
  };

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    try {
      await toggleFavorite(id, isFavorite);
      toast.success(
        isFavorite
          ? "즐겨찾기에 추가되었습니다."
          : "즐겨찾기에서 제거되었습니다."
      );
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("즐겨찾기 상태 변경 중 오류가 발생했습니다.");
    }
  };

  // 파비콘 새로고침 핸들러 추가
  const handleRefreshFavicon = async (bookmarkId: string, url: string) => {
    try {
      const newFavicon = await updateBookmarkFavicon(bookmarkId, url);
      toast.success("파비콘이 새로고침되었습니다.");
      return newFavicon;
    } catch (error) {
      console.error("Error refreshing favicon:", error);
      toast.error("파비콘 새로고침 중 오류가 발생했습니다.");
      throw error;
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    setDeletingCollectionId(collectionId);
    try {
      await deleteCollection(collectionId);
      toast.success("컬렉션이 삭제되었습니다.");
      setDeletingCollectionId(null);
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting collection:", error);
      toast.error("컬렉션 삭제 중 오류가 발생했습니다.");
      setDeletingCollectionId(null);
    }
  };

  const handleUpdateCollection = async (
    collectionId: string,
    collectionData: Partial<Collection>
  ) => {
    try {
      // isPinned가 변경된 경우 setPinned 함수 사용
      if ("isPinned" in collectionData) {
        await setPinned(collectionId, collectionData.isPinned || false);
        // isPinned를 제외한 나머지 데이터만 updateCollection으로 처리
        const { isPinned: _, ...otherData } = collectionData;
        if (Object.keys(otherData).length > 0) {
          await updateCollection(collectionId, otherData);
        }
      } else {
        await updateCollection(collectionId, collectionData);
      }

      toast.success("컬렉션이 수정되었습니다.");
      setShowEditModal(false);
      setEditingCollection(null);
    } catch (error) {
      console.error("Error updating collection:", error);
      toast.error("컬렉션 수정 중 오류가 발생했습니다.");
    }
  };

  const handleReorderBookmarks = async (newBookmarks: Bookmark[]) => {
    console.log(
      "handleReorderBookmarks called with:",
      newBookmarks.length,
      "bookmarks"
    ); // 디버깅 로그
    console.log("Current bookmarks length:", bookmarks.length); // 현재 상태 로그
    console.log(
      "New bookmarks order:",
      newBookmarks.map((b) => ({ id: b.id, title: b.title }))
    ); // 새로운 순서 로그

    try {
      // Firestore에 순서 업데이트
      await reorderBookmarks(newBookmarks);

      console.log("Bookmarks reordered successfully"); // 디버깅 로그
      console.log("Updated bookmarks length:", newBookmarks.length); // 업데이트 후 상태 로그
      // toast.success("북마크 순서가 변경되었습니다."); // 중복 토스트 제거
    } catch (error) {
      console.error("Error reordering bookmarks:", error);
      toast.error("북마크 순서 변경 중 오류가 발생했습니다.");
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
            북마크를 관리하려면 먼저 로그인해주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Drawer
      collections={collections}
      collectionsLoading={false}
      selectedCollection={selectedCollection}
      onCollectionChange={setSelectedCollection}
      onDeleteCollectionRequest={(id, name) => {
        setTargetCollectionId(id);
        setTargetCollectionName(name);
        setShowDeleteModal(true);
      }}
      onEditCollection={(collection) => {
        setEditingCollection(collection);
        setShowEditModal(true);
      }}
      onOpenAddCollectionModal={() => setIsAddCollectionModalOpen(true)}
      onOpenAddSubCollectionModal={(parentId) => {
        setSubCollectionParentId(parentId);
        setIsAddSubCollectionModalOpen(true);
      }}
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* 북마크 리스트 상단 컨트롤 바 */}
        <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            {/* 검색창 - 데스크톱에서만 보임 */}
            <div className="relative w-full sm:flex-1 min-w-0 hidden sm:block">
              <input
                type="text"
                placeholder="북마크 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 h-[48px] border border-slate-300/50 dark:border-slate-600/50 rounded-xl bg-white/90 dark:bg-slate-800/90 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm shadow-sm"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            </div>

            {/* 데스크톱 컨트롤 */}
            <div className="hidden sm:flex items-center gap-4">
              {/* 뷰 모드 토글 버튼 - 데스크톱에서만 */}
              <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1 shadow-lg">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all duration-200 min-w-[40px] h-[40px] flex items-center justify-center ${
                    viewMode === "grid"
                      ? "bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-md"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="그리드 뷰"
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all duration-200 min-w-[40px] h-[40px] flex items-center justify-center ${
                    viewMode === "list"
                      ? "bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-md"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="리스트 뷰"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>

              {/* 데스크톱 버튼들 */}
              <div className="flex gap-3">
                <button
                  onClick={() => setIsAddCollectionModalOpen(true)}
                  className="inline-flex items-center justify-center px-6 py-3 h-[48px] bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 whitespace-nowrap shadow-lg hover:shadow-xl"
                >
                  <FolderPlus className="w-5 h-5 mr-2" />
                  컬렉션 추가
                </button>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center justify-center px-6 py-3 h-[48px] bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-xl transition-all duration-200 whitespace-nowrap shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  북마크 추가
                </button>
              </div>
            </div>
          </div>

          {/* 모바일 버튼들 - 한 줄에 2개 */}
          <div className="grid grid-cols-2 gap-3 mt-4 sm:hidden">
            <button
              onClick={() => setIsAddCollectionModalOpen(true)}
              className="flex items-center justify-center px-4 py-3 h-[48px] bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg"
            >
              <FolderPlus className="w-5 h-5 mr-2" />
              컬렉션 추가
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center px-4 py-3 h-[48px] bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              북마크 추가
            </button>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto w-full min-w-0 sm:pb-6 pb-24">
          {(() => {
            // 필터링된 북마크 데이터에서 실제 북마크 배열 추출
            let bookmarksToDisplay: Bookmark[] = [];

            if (Array.isArray(filteredBookmarksData)) {
              bookmarksToDisplay = filteredBookmarksData;
            } else if (filteredBookmarksData.isGrouped) {
              // 그룹된 데이터의 경우 모든 북마크를 평면화
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
              bookmarksToDisplay = [
                ...groupedData.selectedCollectionBookmarks,
                ...groupedData.groupedBookmarks.flatMap(
                  (group) => group.bookmarks
                ),
              ];
            } else {
              bookmarksToDisplay = filteredBookmarksData.bookmarks || [];
            }

            return (
              <BookmarkList
                bookmarks={bookmarksToDisplay}
                onEdit={setEditingBookmark}
                onDelete={(bookmark: Bookmark) => {
                  setDeleteBookmarkModal({
                    isOpen: true,
                    bookmark: bookmark,
                  });
                }}
                onToggleFavorite={handleToggleFavorite}
                onReorder={handleReorderBookmarks}
                onRefreshFavicon={handleRefreshFavicon} // 파비콘 새로고침 함수 전달
                collections={collections}
                searchTerm="" // 이미 필터링된 북마크를 전달하므로 빈 문자열
                viewMode={viewMode}
                currentSort={currentSort}
                onSortChange={setCurrentSort}
                groupedBookmarks={
                  filteredBookmarksData.isGrouped
                    ? filteredBookmarksData
                    : undefined
                }
              />
            );
          })()}

          {/* 모바일 하단 검색바 */}
          <div className="fixed bottom-0 left-0 right-0 backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-t border-slate-200/50 dark:border-slate-700/50 p-4 sm:hidden">
            <div className="relative">
              <input
                type="text"
                placeholder="검색어 또는 URL 입력"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-16 py-4 border border-slate-300/50 dark:border-slate-600/50 rounded-2xl bg-slate-50/80 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm shadow-lg"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl text-sm font-medium shadow-lg transition-all duration-200">
                완료
              </button>
            </div>
          </div>

          {/* 태그 필터 UI */}
          {(() => {
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
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all duration-200 shadow-sm ${
                    selectedTag === null
                      ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-500 shadow-lg"
                      : "bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:shadow-md backdrop-blur-sm"
                  }`}
                  onClick={() => setSelectedTag(null)}
                >
                  전체
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all duration-200 shadow-sm ${
                      selectedTag === tag
                        ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-500 shadow-lg"
                        : "bg-white/80 dark:bg-slate-800/80 text-purple-700 dark:text-purple-300 border-slate-300 dark:border-slate-600 hover:shadow-md backdrop-blur-sm hover:bg-purple-50 dark:hover:bg-purple-900/20"
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
      </div>

      {/* 모달들 */}
      <AddBookmarkModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={({ title, url, description, collection, tags, isFavorite }) => {
          handleAddBookmark({
            title,
            url,
            description: description || "",
            collection: collection || "",
            tags,
            isFavorite,
          });
        }}
        collections={collections}
      />

      <EditBookmarkModal
        isOpen={!!editingBookmark}
        onClose={() => setEditingBookmark(null)}
        onUpdate={handleUpdateBookmark}
        bookmark={editingBookmark}
        collections={collections}
      />

      <DeleteBookmarkModal
        isOpen={deleteBookmarkModal.isOpen}
        onClose={() =>
          setDeleteBookmarkModal({ isOpen: false, bookmark: null })
        }
        onDelete={handleDeleteBookmark}
        bookmark={deleteBookmarkModal.bookmark}
        isDeleting={isDeletingBookmark}
      />

      <EditCollectionModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingCollection(null);
        }}
        onUpdate={handleUpdateCollection}
        collection={editingCollection}
        collections={collections}
      />

      {showDeleteModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-xs">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              컬렉션 삭제
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              <span className="font-bold">{targetCollectionName}</span> 컬렉션을
              삭제하시겠습니까?
              <br />이 컬렉션에 속한 북마크들은 컬렉션에서 제거됩니다.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                취소
              </button>
              <button
                onClick={() =>
                  targetCollectionId &&
                  handleDeleteCollection(targetCollectionId)
                }
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                disabled={deletingCollectionId === targetCollectionId}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      <AddCollectionModal
        isOpen={isAddCollectionModalOpen}
        onClose={() => setIsAddCollectionModalOpen(false)}
        onAdd={handleAddCollection}
      />

      <AddCollectionModal
        isOpen={isAddSubCollectionModalOpen}
        onClose={() => {
          setIsAddSubCollectionModalOpen(false);
          setSubCollectionParentId(null);
        }}
        onAdd={handleAddCollection}
        parentId={subCollectionParentId}
      />
    </Drawer>
  );
};
