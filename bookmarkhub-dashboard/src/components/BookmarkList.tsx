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
import { useState } from "react";
import { toast } from "react-hot-toast";
import type { Bookmark, Collection } from "../types";
import { refreshFavicon } from "../utils/favicon";
import { SortableBookmarkCard } from "./SortableBookmarkCard";
import { SortableBookmarkListItem } from "./SortableBookmarkListItem";

interface BookmarkListProps {
  bookmarks:
    | Bookmark[]
    | {
        isGrouped: boolean;
        selectedCollectionBookmarks?: Bookmark[];
        selectedCollectionName?: string;
        groupedBookmarks?: {
          collectionId: string;
          collectionName: string;
          bookmarks: Bookmark[];
        }[];
        bookmarks?: Bookmark[];
      };
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
  onUpdateFavicon: (id: string, favicon: string) => void;
  onReorder: (bookmarks: Bookmark[]) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void; // 즐겨찾기 토글 함수 추가
  viewMode: "grid" | "list";
  collections: Collection[];
}

export const BookmarkList = ({
  bookmarks,
  onEdit,
  onDelete,
  onUpdateFavicon,
  onReorder,
  onToggleFavorite, // 즐겨찾기 토글 함수 추가
  viewMode,
  collections,
}: BookmarkListProps) => {
  const [faviconLoadingStates, setFaviconLoadingStates] = useState<
    Record<string, boolean>
  >({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      let allBookmarks: Bookmark[] = [];

      // 그룹화된 데이터인지 확인
      if (
        typeof bookmarks === "object" &&
        "isGrouped" in bookmarks &&
        bookmarks.isGrouped
      ) {
        const groupedData = bookmarks as {
          isGrouped: true;
          selectedCollectionBookmarks: Bookmark[];
          selectedCollectionName: string;
          groupedBookmarks: {
            collectionId: string;
            collectionName: string;
            bookmarks: Bookmark[];
          }[];
        };

        // 모든 북마크를 하나의 배열로 합치기
        allBookmarks = [
          ...groupedData.selectedCollectionBookmarks,
          ...groupedData.groupedBookmarks.flatMap((group) => group.bookmarks),
        ];
      } else {
        allBookmarks = Array.isArray(bookmarks)
          ? bookmarks
          : bookmarks.bookmarks || [];
      }

      const oldIndex = allBookmarks.findIndex(
        (bookmark) => bookmark.id === active.id
      );
      const newIndex = allBookmarks.findIndex(
        (bookmark) => bookmark.id === over?.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const newBookmarks = arrayMove(allBookmarks, oldIndex, newIndex);
        onReorder(newBookmarks);
      }
    }
  };

  const handleRefreshFavicon = async (bookmark: Bookmark) => {
    setFaviconLoadingStates((prev) => ({ ...prev, [bookmark.id]: true }));
    try {
      const newFavicon = await refreshFavicon(bookmark.url);
      onUpdateFavicon(bookmark.id, newFavicon);
    } catch (error) {
      console.error("파비콘 재가져오기 실패:", error);
      toast.error("파비콘 재가져오기에 실패했습니다.");
    } finally {
      setFaviconLoadingStates((prev) => ({ ...prev, [bookmark.id]: false }));
    }
  };

  // 상하 이동 핸들러들
  const handleMoveUp = (bookmark: Bookmark) => {
    let allBookmarks: Bookmark[] = [];

    // 그룹화된 데이터인지 확인
    if (
      typeof bookmarks === "object" &&
      "isGrouped" in bookmarks &&
      bookmarks.isGrouped
    ) {
      const groupedData = bookmarks as {
        isGrouped: true;
        selectedCollectionBookmarks: Bookmark[];
        selectedCollectionName: string;
        groupedBookmarks: {
          collectionId: string;
          collectionName: string;
          bookmarks: Bookmark[];
        }[];
      };

      // 모든 북마크를 하나의 배열로 합치기
      allBookmarks = [
        ...groupedData.selectedCollectionBookmarks,
        ...groupedData.groupedBookmarks.flatMap((group) => group.bookmarks),
      ];
    } else {
      allBookmarks = Array.isArray(bookmarks)
        ? bookmarks
        : bookmarks.bookmarks || [];
    }

    const currentIndex = allBookmarks.findIndex((b) => b.id === bookmark.id);
    if (currentIndex > 0) {
      const newBookmarks = [...allBookmarks];
      [newBookmarks[currentIndex], newBookmarks[currentIndex - 1]] = [
        newBookmarks[currentIndex - 1],
        newBookmarks[currentIndex],
      ];
      onReorder(newBookmarks);
    }
  };

  const handleMoveDown = (bookmark: Bookmark) => {
    let allBookmarks: Bookmark[] = [];

    // 그룹화된 데이터인지 확인
    if (
      typeof bookmarks === "object" &&
      "isGrouped" in bookmarks &&
      bookmarks.isGrouped
    ) {
      const groupedData = bookmarks as {
        isGrouped: true;
        selectedCollectionBookmarks: Bookmark[];
        selectedCollectionName: string;
        groupedBookmarks: {
          collectionId: string;
          collectionName: string;
          bookmarks: Bookmark[];
        }[];
      };

      // 모든 북마크를 하나의 배열로 합치기
      allBookmarks = [
        ...groupedData.selectedCollectionBookmarks,
        ...groupedData.groupedBookmarks.flatMap((group) => group.bookmarks),
      ];
    } else {
      allBookmarks = Array.isArray(bookmarks)
        ? bookmarks
        : bookmarks.bookmarks || [];
    }

    const currentIndex = allBookmarks.findIndex((b) => b.id === bookmark.id);
    if (currentIndex < allBookmarks.length - 1) {
      const newBookmarks = [...allBookmarks];
      [newBookmarks[currentIndex], newBookmarks[currentIndex + 1]] = [
        newBookmarks[currentIndex + 1],
        newBookmarks[currentIndex],
      ];
      onReorder(newBookmarks);
    }
  };

  // 그룹화된 데이터인지 확인
  const isGrouped =
    typeof bookmarks === "object" &&
    "isGrouped" in bookmarks &&
    bookmarks.isGrouped;

  if (isGrouped) {
    const groupedData = bookmarks as {
      isGrouped: true;
      selectedCollectionBookmarks: Bookmark[];
      selectedCollectionName: string;
      groupedBookmarks: {
        collectionId: string;
        collectionName: string;
        bookmarks: Bookmark[];
      }[];
    };

    const allBookmarks = [
      ...groupedData.selectedCollectionBookmarks,
      ...groupedData.groupedBookmarks.flatMap((group) => group.bookmarks),
    ];

    if (allBookmarks.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">북마크가 없습니다.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* 선택된 컬렉션의 북마크들 */}
        {groupedData.selectedCollectionBookmarks.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {groupedData.selectedCollectionName}
            </h3>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              {viewMode === "grid" ? (
                <SortableContext
                  items={groupedData.selectedCollectionBookmarks.map(
                    (b) => b.id
                  )}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 min-w-0">
                    {groupedData.selectedCollectionBookmarks.map(
                      (bookmark, index) => (
                        <SortableBookmarkCard
                          key={bookmark.id}
                          bookmark={bookmark}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onRefreshFavicon={handleRefreshFavicon}
                          faviconLoading={faviconLoadingStates[bookmark.id]}
                          onMoveUp={handleMoveUp}
                          onMoveDown={handleMoveDown}
                          isFirst={index === 0}
                          isLast={
                            index ===
                            groupedData.selectedCollectionBookmarks.length - 1
                          }
                          collections={collections}
                          onToggleFavorite={onToggleFavorite}
                        />
                      )
                    )}
                  </div>
                </SortableContext>
              ) : (
                <SortableContext
                  items={groupedData.selectedCollectionBookmarks.map(
                    (b) => b.id
                  )}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 w-full min-w-0 overflow-hidden">
                    {groupedData.selectedCollectionBookmarks.map(
                      (bookmark, index) => (
                        <SortableBookmarkListItem
                          key={bookmark.id}
                          bookmark={bookmark}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onMoveUp={handleMoveUp}
                          onMoveDown={handleMoveDown}
                          isFirst={index === 0}
                          isLast={
                            index ===
                            groupedData.selectedCollectionBookmarks.length - 1
                          }
                          collections={collections}
                          onToggleFavorite={onToggleFavorite}
                        />
                      )
                    )}
                  </div>
                </SortableContext>
              )}
            </DndContext>
          </div>
        )}

        {/* 하위 컬렉션들의 북마크들 */}
        {groupedData.groupedBookmarks.map((group) => (
          <div key={group.collectionId}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="text-gray-500 dark:text-gray-400 mr-2">└</span>
              {group.collectionName}
            </h3>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              {viewMode === "grid" ? (
                <SortableContext
                  items={group.bookmarks.map((b) => b.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 min-w-0">
                    {group.bookmarks.map((bookmark, index) => (
                      <SortableBookmarkCard
                        key={bookmark.id}
                        bookmark={bookmark}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onRefreshFavicon={handleRefreshFavicon}
                        faviconLoading={faviconLoadingStates[bookmark.id]}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                        isFirst={index === 0}
                        isLast={index === group.bookmarks.length - 1}
                        collections={collections}
                        onToggleFavorite={onToggleFavorite}
                      />
                    ))}
                  </div>
                </SortableContext>
              ) : (
                <SortableContext
                  items={group.bookmarks.map((b) => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 w-full min-w-0 overflow-hidden">
                    {group.bookmarks.map((bookmark, index) => (
                      <SortableBookmarkListItem
                        key={bookmark.id}
                        bookmark={bookmark}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                        isFirst={index === 0}
                        isLast={index === group.bookmarks.length - 1}
                        collections={collections}
                        onToggleFavorite={onToggleFavorite}
                      />
                    ))}
                  </div>
                </SortableContext>
              )}
            </DndContext>
          </div>
        ))}
      </div>
    );
  }

  // 일반 북마크 배열 처리
  const bookmarksArray = Array.isArray(bookmarks)
    ? bookmarks
    : bookmarks.bookmarks || [];

  if (bookmarksArray.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">북마크가 없습니다.</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      {viewMode === "grid" ? (
        <SortableContext
          items={bookmarksArray.map((b) => b.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 min-w-0">
            {bookmarksArray.map((bookmark, index) => (
              <SortableBookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onEdit={onEdit}
                onDelete={onDelete}
                onRefreshFavicon={handleRefreshFavicon}
                faviconLoading={faviconLoadingStates[bookmark.id]}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                isFirst={index === 0}
                isLast={index === bookmarksArray.length - 1}
                collections={collections}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        </SortableContext>
      ) : (
        <SortableContext
          items={bookmarksArray.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 w-full min-w-0 ">
            {bookmarksArray.map((bookmark, index) => (
              <SortableBookmarkListItem
                key={bookmark.id}
                bookmark={bookmark}
                onEdit={onEdit}
                onDelete={onDelete}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                isFirst={index === 0}
                isLast={index === bookmarksArray.length - 1}
                collections={collections}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </DndContext>
  );
};
