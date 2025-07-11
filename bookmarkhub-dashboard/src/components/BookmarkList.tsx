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
  viewMode: "grid" | "list";
  collections: Collection[];
}

export const BookmarkList = ({
  bookmarks,
  onEdit,
  onDelete,
  onUpdateFavicon,
  onReorder,
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
      // 그룹화된 데이터의 경우 드래그 앤 드롭은 비활성화
      if (
        typeof bookmarks === "object" &&
        "isGrouped" in bookmarks &&
        bookmarks.isGrouped
      ) {
        return;
      }

      const allBookmarks = Array.isArray(bookmarks)
        ? bookmarks
        : bookmarks.bookmarks || [];
      const oldIndex = allBookmarks.findIndex(
        (bookmark) => bookmark.id === active.id
      );
      const newIndex = allBookmarks.findIndex(
        (bookmark) => bookmark.id === over?.id
      );

      const newBookmarks = arrayMove(allBookmarks, oldIndex, newIndex);
      onReorder(newBookmarks);
    }
  };

  const handleRefreshFavicon = async (bookmark: Bookmark) => {
    setFaviconLoadingStates((prev) => ({ ...prev, [bookmark.id]: true }));
    try {
      const newFavicon = await refreshFavicon(bookmark.url);
      onUpdateFavicon(bookmark.id, newFavicon);
    } catch (error) {
      console.error("파비콘 재가져오기 실패:", error);
      alert("파비콘 재가져오기에 실패했습니다.");
    } finally {
      setFaviconLoadingStates((prev) => ({ ...prev, [bookmark.id]: false }));
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
                    {groupedData.selectedCollectionBookmarks.map((bookmark) => (
                      <SortableBookmarkCard
                        key={bookmark.id}
                        bookmark={bookmark}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onRefreshFavicon={handleRefreshFavicon}
                        faviconLoading={faviconLoadingStates[bookmark.id]}
                        collections={collections}
                      />
                    ))}
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
                    {groupedData.selectedCollectionBookmarks.map((bookmark) => (
                      <SortableBookmarkListItem
                        key={bookmark.id}
                        bookmark={bookmark}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        collections={collections}
                      />
                    ))}
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
                    {group.bookmarks.map((bookmark) => (
                      <SortableBookmarkCard
                        key={bookmark.id}
                        bookmark={bookmark}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onRefreshFavicon={handleRefreshFavicon}
                        faviconLoading={faviconLoadingStates[bookmark.id]}
                        collections={collections}
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
                    {group.bookmarks.map((bookmark) => (
                      <SortableBookmarkListItem
                        key={bookmark.id}
                        bookmark={bookmark}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        collections={collections}
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
            {bookmarksArray.map((bookmark) => (
              <SortableBookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onEdit={onEdit}
                onDelete={onDelete}
                onRefreshFavicon={handleRefreshFavicon}
                faviconLoading={faviconLoadingStates[bookmark.id]}
                collections={collections}
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
            {bookmarksArray.map((bookmark) => (
              <SortableBookmarkListItem
                key={bookmark.id}
                bookmark={bookmark}
                onEdit={onEdit}
                onDelete={onDelete}
                collections={collections}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </DndContext>
  );
};
