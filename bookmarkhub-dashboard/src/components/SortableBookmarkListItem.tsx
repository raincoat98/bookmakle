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
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    onEdit(bookmark);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    onDelete(bookmark);
  };

  const collection = collections.find((col) => col.id === bookmark.collection);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 overflow-hidden min-w-0 backdrop-blur-sm ${
        isDragging ? "opacity-50 shadow-2xl z-50" : ""
      } hover:z-30 z-10`}
    >
      {/* 그라데이션 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* 드래그 핸들러 */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-grab active:cursor-grabbing z-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-1.5 shadow-sm"
      >
        <svg
          className="w-4 h-4 text-gray-500"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
        </svg>
      </div>

      {/* 액션 버튼들 */}
      <div className="absolute top-4 right-4 flex space-x-1.5 z-30 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <button
          onClick={handleEdit}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 min-w-[36px] min-h-[36px] flex items-center justify-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm hover:shadow-md"
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
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 min-w-[36px] min-h-[36px] flex items-center justify-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm hover:shadow-md"
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
      <div className="p-6 pt-14 relative z-10">
        <div className="flex items-center space-x-5">
          {/* 파비콘 */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center shadow-sm">
              {bookmark.favicon ? (
                <img
                  src={bookmark.favicon}
                  alt="파비콘"
                  className="w-8 h-8 rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <svg
                  className="w-6 h-6 text-gray-500 dark:text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              )}
            </div>
          </div>

          {/* 텍스트 내용 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-semibold text-gray-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 cursor-pointer"
                title={bookmark.title}
              >
                {bookmark.title}
              </a>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-2">
              {bookmark.url}
            </p>

            {/* 컬렉션 정보 */}
            <div className="flex items-center space-x-3 mb-3">
              {collection ? (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 shadow-sm">
                  {collection.icon} {collection.name}
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 shadow-sm">
                  컬렉션 없음
                </span>
              )}

              {/* 날짜 */}
              <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-md">
                {bookmark.createdAt.toLocaleDateString()}
              </div>
            </div>

            {bookmark.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 transition-colors duration-200 leading-relaxed">
                {bookmark.description}
              </p>
            )}
          </div>

          {/* 방문하기 버튼 */}
          <div className="flex-shrink-0">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
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
      </div>
    </div>
  );
};
