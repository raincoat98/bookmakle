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
import type { Bookmark } from "../types";
import { refreshFavicon } from "../utils/favicon";
import { SortableBookmarkCard } from "./SortableBookmarkCard";
import { SortableBookmarkListItem } from "./SortableBookmarkListItem";

interface BookmarkListProps {
  bookmarks: Bookmark[];
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
  onUpdateFavicon: (id: string, favicon: string) => void;
  onReorder: (bookmarks: Bookmark[]) => void;
  viewMode: "grid" | "list";
}

export const BookmarkList = ({
  bookmarks,
  onEdit,
  onDelete,
  onUpdateFavicon,
  onReorder,
  viewMode,
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
      const oldIndex = bookmarks.findIndex(
        (bookmark) => bookmark.id === active.id
      );
      const newIndex = bookmarks.findIndex(
        (bookmark) => bookmark.id === over?.id
      );

      const newBookmarks = arrayMove(bookmarks, oldIndex, newIndex);
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

  if (bookmarks.length === 0) {
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
          items={bookmarks.map((b) => b.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {bookmarks.map((bookmark) => (
              <SortableBookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onEdit={onEdit}
                onDelete={onDelete}
                onRefreshFavicon={handleRefreshFavicon}
                faviconLoading={faviconLoadingStates[bookmark.id]}
              />
            ))}
          </div>
        </SortableContext>
      ) : (
        <SortableContext
          items={bookmarks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {bookmarks.map((bookmark) => (
              <SortableBookmarkListItem
                key={bookmark.id}
                bookmark={bookmark}
                onEdit={onEdit}
                onDelete={onDelete}
                onRefreshFavicon={handleRefreshFavicon}
                faviconLoading={faviconLoadingStates[bookmark.id]}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </DndContext>
  );
};
