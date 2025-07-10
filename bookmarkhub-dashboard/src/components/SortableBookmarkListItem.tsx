import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Bookmark } from "../types";

interface SortableBookmarkListItemProps {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
  onRefreshFavicon: (bookmark: Bookmark) => Promise<void>;
  faviconLoading: boolean;
}

export const SortableBookmarkListItem = ({
  bookmark,
  onEdit,
  onDelete,
  onRefreshFavicon,
  faviconLoading,
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

  const handleRefreshFavicon = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onRefreshFavicon(bookmark);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={
        `group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden w-full min-w-0 flex flex-col` +
        (isDragging ? " opacity-50 shadow-lg" : "")
      }
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
          onClick={handleRefreshFavicon}
          disabled={faviconLoading}
          className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          title="파비콘 재가져오기"
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
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
        <button
          onClick={handleEdit}
          className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
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
          className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
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
      <div className="p-4 pt-10 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full min-w-0">
        {/* 파비콘 */}
        <div className="relative flex-shrink-0 mb-2 sm:mb-0">
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
          {faviconLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>

        {/* 텍스트 내용 */}
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-base font-medium text-gray-900 dark:text-white truncate">
              {bookmark.title}
            </h3>
          </div>
          {/* 태그 배지 */}
          {bookmark.tags && bookmark.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {bookmark.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate break-all">
            {bookmark.url}
          </p>
          {bookmark.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2 break-all">
              {bookmark.description}
            </p>
          )}
        </div>

        {/* 날짜 */}
        <div className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400 mt-2 sm:mt-0">
          {bookmark.createdAt.toLocaleDateString()}
        </div>
      </div>

      {/* 클릭 영역 */}
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 z-10"
        aria-label={`${bookmark.title} 열기`}
      />
    </div>
  );
};
