import React, { useMemo, useState } from "react";
import type { Bookmark, Collection, SortOption } from "../types";
import { SortableBookmarkCard } from "./SortableBookmarkCard";
import { SortableBookmarkListItem } from "./SortableBookmarkListItem";
import { MobileIconView } from "./MobileIconView";
import { BookmarkSort } from "./BookmarkSort";
import { sortBookmarks } from "../utils/sortBookmarks";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { BookOpen, Folder } from "lucide-react";
import { toast } from "react-hot-toast";

interface BookmarkListProps {
  bookmarks: Bookmark[];
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onReorder: (newBookmarks: Bookmark[]) => void;
  onRefreshFavicon?: (bookmarkId: string, url: string) => Promise<string>; // 파비콘 새로고침 함수 추가
  collections?: Collection[];
  searchTerm: string;
  viewMode: "grid" | "list";
  // 정렬 관련 props 추가
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  // 그룹화된 북마크 데이터 추가
  groupedBookmarks?: {
    isGrouped: boolean;
    selectedCollectionBookmarks?: Bookmark[];
    selectedCollectionName?: string;
    groupedBookmarks?: {
      collectionId: string;
      collectionName: string;
      bookmarks: Bookmark[];
    }[];
  };
}

export const BookmarkList: React.FC<BookmarkListProps> = ({
  bookmarks,
  onEdit,
  onDelete,
  onToggleFavorite,
  onReorder,
  onRefreshFavicon, // 파비콘 새로고침 함수 추가
  collections = [],
  searchTerm,
  viewMode,
  currentSort,
  onSortChange,
  groupedBookmarks,
}) => {
  const [faviconLoadingStates, setFaviconLoadingStates] = useState<
    Record<string, boolean>
  >({});

  // 이동 중인 북마크 상태 추가
  const [movingBookmarkId, setMovingBookmarkId] = useState<string | null>(null);
  const [moveDirection, setMoveDirection] = useState<"up" | "down" | null>(
    null
  );

  // 필터링 및 정렬된 북마크
  const filteredAndSortedBookmarks = useMemo(() => {
    let filtered = bookmarks;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (bookmark) =>
          bookmark.title.toLowerCase().includes(term) ||
          bookmark.url.toLowerCase().includes(term) ||
          (bookmark.description &&
            bookmark.description.toLowerCase().includes(term))
      );
    }

    // 정렬 적용
    return sortBookmarks(filtered, currentSort);
  }, [bookmarks, searchTerm, currentSort]);

  // 그룹화된 북마크 정렬 처리
  const sortedGroupedBookmarks = useMemo(() => {
    if (!groupedBookmarks?.isGrouped) return undefined;

    return {
      ...groupedBookmarks,
      selectedCollectionBookmarks: sortBookmarks(
        groupedBookmarks.selectedCollectionBookmarks || [],
        currentSort
      ),
      groupedBookmarks: groupedBookmarks.groupedBookmarks?.map((group) => ({
        ...group,
        bookmarks: sortBookmarks(group.bookmarks, currentSort),
      })),
    };
  }, [groupedBookmarks, currentSort]);

  // 드래그 앤 드롭 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1, // 드래그 시작 거리를 최소로 설정
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 드래그 종료 핸들러
  const handleDragEnd = (event: DragEndEvent) => {
    console.log("Drag end event:", event); // 디버깅 로그
    const { active, over } = event;

    if (!over) {
      console.log("No drop target found"); // 드롭 타겟이 없는 경우
      return;
    }

    if (active.id !== over.id) {
      // 그룹화된 뷰인지 확인
      const bookmarksToUse = sortedGroupedBookmarks?.isGrouped
        ? [
            ...(sortedGroupedBookmarks.selectedCollectionBookmarks || []),
            ...(sortedGroupedBookmarks.groupedBookmarks?.flatMap(
              (group) => group.bookmarks
            ) || []),
          ]
        : filteredAndSortedBookmarks;

      const oldIndex = bookmarksToUse.findIndex(
        (item) => item.id === active.id
      );
      const newIndex = bookmarksToUse.findIndex((item) => item.id === over.id);

      console.log("Moving from index", oldIndex, "to", newIndex); // 디버깅 로그
      console.log("Active bookmark:", bookmarksToUse[oldIndex]?.title); // 이동하는 북마크
      console.log("Over bookmark:", bookmarksToUse[newIndex]?.title); // 대상 북마크

      const newBookmarks = arrayMove(bookmarksToUse, oldIndex, newIndex);
      console.log("New bookmarks array length:", newBookmarks.length); // 새로운 배열 길이

      // 부모 컴포넌트에 알림
      onReorder(newBookmarks);
    } else {
      console.log("Same position, no reorder needed"); // 같은 위치인 경우
    }
  };

  // 순서 변경 함수들 - 애니메이션 효과 추가
  const handleMoveUp = async (bookmark: Bookmark) => {
    const currentIndex = filteredAndSortedBookmarks.findIndex(
      (b) => b.id === bookmark.id
    );
    if (currentIndex > 0) {
      // 이동 시작 상태 설정
      setMovingBookmarkId(bookmark.id);
      setMoveDirection("up");

      // 약간의 지연 후 실제 이동 수행 (애니메이션 효과)
      setTimeout(() => {
        const newOrder = arrayMove(
          filteredAndSortedBookmarks,
          currentIndex,
          currentIndex - 1
        );
        onReorder(newOrder);

        // 이동 완료 후 상태 초기화 및 토스트
        setTimeout(() => {
          setMovingBookmarkId(null);
          setMoveDirection(null);
          toast.success(`"${bookmark.title}" 위로 이동 완료! 🔝`, {
            duration: 2000,
            icon: "📌",
          });
        }, 300);
      }, 100);
    }
  };

  const handleMoveDown = async (bookmark: Bookmark) => {
    const currentIndex = filteredAndSortedBookmarks.findIndex(
      (b) => b.id === bookmark.id
    );
    if (currentIndex < filteredAndSortedBookmarks.length - 1) {
      // 이동 시작 상태 설정
      setMovingBookmarkId(bookmark.id);
      setMoveDirection("down");

      // 약간의 지연 후 실제 이동 수행 (애니메이션 효과)
      setTimeout(() => {
        const newOrder = arrayMove(
          filteredAndSortedBookmarks,
          currentIndex,
          currentIndex + 1
        );
        onReorder(newOrder);

        // 이동 완료 후 상태 초기화 및 토스트
        setTimeout(() => {
          setMovingBookmarkId(null);
          setMoveDirection(null);
          toast.success(`"${bookmark.title}" 아래로 이동 완료! 🔽`, {
            duration: 2000,
            icon: "📌",
          });
        }, 300);
      }, 100);
    }
  };

  // 파비콘 새로고침 핸들러
  const handleRefreshFavicon = async (bookmark: Bookmark) => {
    if (!onRefreshFavicon) return;

    setFaviconLoadingStates((prev) => ({ ...prev, [bookmark.id]: true }));
    try {
      await onRefreshFavicon(bookmark.id, bookmark.url);
    } catch (error) {
      console.error("파비콘 새로고침 실패:", error);
    } finally {
      setFaviconLoadingStates((prev) => ({ ...prev, [bookmark.id]: false }));
    }
  };

  // 북마크 섹션 렌더링 함수
  const renderBookmarkSection = (
    bookmarks: Bookmark[],
    sectionTitle?: string,
    sectionIcon?: string,
    isSubSection: boolean = false
  ) => {
    if (bookmarks.length === 0) return null;

    return (
      <div
        className={`space-y-4 ${
          isSubSection
            ? "ml-4 border-l-2 border-purple-200 dark:border-purple-700 pl-6"
            : ""
        }`}
      >
        {/* 섹션 헤더 */}
        {sectionTitle && (
          <div
            className={`flex items-center gap-3 ${isSubSection ? "mt-6" : ""}`}
          >
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                isSubSection
                  ? "bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border border-purple-200 dark:border-purple-700"
                  : "bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800"
              }`}
            >
              {sectionIcon && <span className="text-lg">{sectionIcon}</span>}
              <h3
                className={`font-semibold text-sm ${
                  isSubSection
                    ? "text-purple-700 dark:text-purple-300"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                {sectionTitle}
              </h3>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  isSubSection
                    ? "bg-purple-200 dark:bg-purple-700 text-purple-700 dark:text-purple-300"
                    : "bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400"
                }`}
              >
                {bookmarks.length}개
              </span>
            </div>
          </div>
        )}

        {/* 북마크 그리드/리스트 */}
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
          }
        >
          {bookmarks.map((bookmark, idx) =>
            viewMode === "grid" ? (
              <SortableBookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onEdit={onEdit}
                onDelete={onDelete}
                onRefreshFavicon={
                  onRefreshFavicon ? handleRefreshFavicon : async () => {}
                }
                faviconLoading={faviconLoadingStates[bookmark.id] || false}
                collections={collections}
                onToggleFavorite={onToggleFavorite}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                isFirst={idx === 0}
                isLast={idx === bookmarks.length - 1}
                isMoving={movingBookmarkId === bookmark.id}
                moveDirection={moveDirection}
              />
            ) : (
              <SortableBookmarkListItem
                key={bookmark.id}
                bookmark={bookmark}
                onEdit={onEdit}
                onDelete={onDelete}
                onRefreshFavicon={
                  onRefreshFavicon ? handleRefreshFavicon : undefined
                }
                faviconLoading={faviconLoadingStates[bookmark.id] || false}
                collections={collections}
                onToggleFavorite={onToggleFavorite}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                isFirst={idx === 0}
                isLast={idx === bookmarks.length - 1}
                isMoving={movingBookmarkId === bookmark.id}
                moveDirection={moveDirection}
              />
            )
          )}
        </div>
      </div>
    );
  };

  // 그룹화된 북마크가 있는 경우 그룹화된 뷰 렌더링
  if (sortedGroupedBookmarks?.isGrouped) {
    // 그룹화된 뷰에서 사용할 모든 북마크 목록 (드래그 앤 드롭용)
    const allGroupedBookmarks = [
      ...(sortedGroupedBookmarks.selectedCollectionBookmarks || []),
      ...(sortedGroupedBookmarks.groupedBookmarks?.flatMap(
        (group) => group.bookmarks
      ) || []),
    ];

    return (
      <div className="space-y-6">
        {/* 정렬 컨트롤 */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            총 {allGroupedBookmarks.length}개의 북마크
          </div>
          <BookmarkSort currentSort={currentSort} onSortChange={onSortChange} />
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          onDragStart={(event) => {
            console.log("Drag start event:", event);
          }}
          onDragOver={(event) => {
            console.log("Drag over event:", event);
          }}
        >
          <SortableContext
            items={allGroupedBookmarks.map((item) => item.id)}
            strategy={
              viewMode === "grid"
                ? rectSortingStrategy
                : verticalListSortingStrategy
            }
          >
            <div className="space-y-8">
            {/* 상위 컬렉션 북마크 */}
            {sortedGroupedBookmarks.selectedCollectionBookmarks &&
              sortedGroupedBookmarks.selectedCollectionBookmarks.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                  {renderBookmarkSection(
                    sortedGroupedBookmarks.selectedCollectionBookmarks,
                    sortedGroupedBookmarks.selectedCollectionName,
                    collections.find(
                      (col) =>
                        col.name === sortedGroupedBookmarks.selectedCollectionName
                    )?.icon,
                    false
                  )}
                </div>
              )}

            {/* 하위 컬렉션 북마크들 */}
            {sortedGroupedBookmarks.groupedBookmarks &&
              sortedGroupedBookmarks.groupedBookmarks.length > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 shadow-sm border border-purple-200 dark:border-purple-700">
                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                      <Folder className="w-5 h-5" />
                      하위 컬렉션 북마크
                    </h2>
                    <p className="text-sm text-purple-600 dark:text-purple-400">
                      이 컬렉션의 하위 컬렉션에 속한 북마크들입니다.
                    </p>
                  </div>
                  <div className="space-y-6">
                    {sortedGroupedBookmarks.groupedBookmarks.map((group) =>
                      renderBookmarkSection(
                        group.bookmarks,
                        group.collectionName,
                        collections.find((col) => col.id === group.collectionId)
                          ?.icon,
                        true
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    );
  }

  // 일반 북마크 리스트 렌더링
  return (
    <div className="space-y-6">
      {/* 정렬 컨트롤 */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          총 {filteredAndSortedBookmarks.length}개의 북마크
        </div>
        <BookmarkSort currentSort={currentSort} onSortChange={onSortChange} />
      </div>

      {/* 북마크 그리드/리스트 */}
      {filteredAndSortedBookmarks.length > 0 ? (
        <>
          {/* 모바일 아이콘 뷰 */}
          <div className="block sm:hidden">
            <MobileIconView
              bookmarks={filteredAndSortedBookmarks}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleFavorite={onToggleFavorite}
              onReorder={onReorder}
            />
          </div>

          {/* 데스크톱 뷰 */}
          <div className="hidden sm:block">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              onDragStart={(event) => {
                console.log("Drag start event:", event); // 디버깅 로그
              }}
              onDragOver={(event) => {
                console.log("Drag over event:", event); // 디버깅 로그
              }}
            >
              <SortableContext
                items={filteredAndSortedBookmarks.map((item) => item.id)}
                strategy={
                  viewMode === "grid"
                    ? rectSortingStrategy
                    : verticalListSortingStrategy
                }
              >
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                      : "space-y-4"
                  }
                >
                  {filteredAndSortedBookmarks.map((bookmark, idx) =>
                    viewMode === "grid" ? (
                      <SortableBookmarkCard
                        key={bookmark.id}
                        bookmark={bookmark}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onRefreshFavicon={
                          onRefreshFavicon
                            ? handleRefreshFavicon
                            : async () => {}
                        }
                        faviconLoading={
                          faviconLoadingStates[bookmark.id] || false
                        }
                        collections={collections}
                        onToggleFavorite={onToggleFavorite}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                        isFirst={idx === 0}
                        isLast={idx === filteredAndSortedBookmarks.length - 1}
                        isMoving={movingBookmarkId === bookmark.id}
                        moveDirection={moveDirection}
                      />
                    ) : (
                      <SortableBookmarkListItem
                        key={bookmark.id}
                        bookmark={bookmark}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onRefreshFavicon={
                          onRefreshFavicon ? handleRefreshFavicon : undefined
                        }
                        faviconLoading={
                          faviconLoadingStates[bookmark.id] || false
                        }
                        collections={collections}
                        onToggleFavorite={onToggleFavorite}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                        isFirst={idx === 0}
                        isLast={idx === filteredAndSortedBookmarks.length - 1}
                        isMoving={movingBookmarkId === bookmark.id}
                        moveDirection={moveDirection}
                      />
                    )
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
            북마크가 없습니다
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-center max-w-md">
            {searchTerm
              ? "검색 결과가 없습니다. 다른 검색어를 시도해보세요."
              : "첫 번째 북마크를 추가해보세요!"}
          </p>
        </div>
      )}
    </div>
  );
};
