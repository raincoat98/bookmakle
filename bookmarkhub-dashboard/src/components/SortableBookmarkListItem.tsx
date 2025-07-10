import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BookmarkListItem } from "./BookmarkListItem";
import type { Bookmark, Collection } from "../types";

interface SortableBookmarkListItemProps {
  bookmark: Bookmark;
  collections: Collection[];
  onDelete: (id: string) => void;
  onEdit: (bookmark: Bookmark) => void;
}

export const SortableBookmarkListItem = ({
  bookmark,
  collections,
  onDelete,
  onEdit,
}: SortableBookmarkListItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bookmark.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="relative">
        {/* 드래그 핸들러 */}
        <div
          {...listeners}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 w-6 h-6 flex items-center justify-center cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-10"
        >
          <svg
            className="w-4 h-4"
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
        </div>

        {/* 북마크 아이템 (버튼 클릭 가능) */}
        <div className="pl-8">
          <BookmarkListItem
            bookmark={bookmark}
            collections={collections}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        </div>
      </div>
    </div>
  );
};
