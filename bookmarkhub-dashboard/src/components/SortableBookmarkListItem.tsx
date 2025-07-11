import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Bookmark, Collection } from "../types";

interface SortableBookmarkListItemProps {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
  collections: Collection[];
  // onRefreshFavicon: (bookmark: Bookmark) => Promise<void>; // 제거
  // faviconLoading: boolean;
}

export const SortableBookmarkListItem = ({
  bookmark,
  onEdit,
  onDelete,
  collections,
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
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(bookmark);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(bookmark);
  };

  const collection = collections.find((col) => col.id === bookmark.collection);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:scale-[1.01] active:scale-95 transition-all duration-200 overflow-hidden min-w-0 ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
    >
      {/* 드래그 핸들러 */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-20"
      >
        <svg
          className="w-4 h-4 text-gray-400"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
        </svg>
      </div>

      {/* 액션 버튼들 */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 z-20">
        <button
          onClick={handleEdit}
          className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-transform duration-150 hover:scale-110 active:scale-95"
          title="수정"
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
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
        <button
          onClick={handleDelete}
          className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-transform duration-150 hover:scale-110 active:scale-95"
          title="삭제"
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      {/* 리스트 아이템 내용 */}
      <div className="p-4 pt-10">
        <div className="flex items-center space-x-4">
          {/* 파비콘 */}
          <div className="flex-shrink-0">
            {bookmark.favicon ? (
              <img
                src={bookmark.favicon}
                alt="파비콘"
                className="w-8 h-8 rounded"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
            )}
          </div>

          {/* 텍스트 내용 */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium text-gray-900 dark:text-white truncate">
              {bookmark.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
              {bookmark.url}
            </p>
            {/* 컬렉션 정보 */}
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {collection ? (
                <span>
                  {collection.icon} {collection.name}
                </span>
              ) : (
                <span className="text-gray-400">컬렉션 없음</span>
              )}
            </div>
            {bookmark.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2 transition-colors duration-200">
                {bookmark.description}
              </p>
            )}
          </div>

          {/* 날짜 */}
          <div className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
            {bookmark.createdAt.toLocaleDateString()}
          </div>
        </div>

        {/* 모바일에서만 보이는 방문하기 버튼 */}
        <div className="flex justify-end mt-3 sm:hidden">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 hover:scale-105 active:scale-95"
          >
            <span>방문하기</span>
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
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </div>

      {/* 클릭 영역: 데스크탑에서만 전체 이동 */}
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 z-10 hidden sm:block"
        aria-label={`${bookmark.title} 열기`}
      />
    </div>
  );
};
