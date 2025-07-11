import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Bookmark, Collection } from "../types";

interface SortableBookmarkCardProps {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
  onRefreshFavicon: (bookmark: Bookmark) => Promise<void>;
  faviconLoading: boolean;
  collections: Collection[];
}

export const SortableBookmarkCard = ({
  bookmark,
  onEdit,
  onDelete,
  onRefreshFavicon,
  faviconLoading,
  collections,
}: SortableBookmarkCardProps) => {
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

  const handleRefreshFavicon = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    await onRefreshFavicon(bookmark);
  };

  const collection = collections.find((col) => col.id === bookmark.collection);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden min-w-0 backdrop-blur-sm ${
        isDragging ? "opacity-50 shadow-2xl" : ""
      }`}
    >
      {/* 그라데이션 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* 드래그 핸들러 - 모바일에서 더 크게 */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 sm:top-3 sm:left-3 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-grab active:cursor-grabbing z-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-2 sm:p-1.5 shadow-sm min-w-[44px] min-h-[44px] flex items-center justify-center"
      >
        <svg
          className="w-5 h-5 sm:w-4 sm:h-4 text-gray-500"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
        </svg>
      </div>

      {/* 액션 버튼들 - 모바일에서 더 크고 간격 조정 */}
      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex space-x-2 sm:space-x-1.5 z-30 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <button
          onClick={handleRefreshFavicon}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          disabled={faviconLoading}
          className="p-3 sm:p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 transition-all duration-200 min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm hover:shadow-md active:scale-95"
          title="파비콘 재가져오기"
        >
          <svg
            className="w-5 h-5 sm:w-4 sm:h-4"
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
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="p-3 sm:p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm hover:shadow-md active:scale-95"
          title="수정"
        >
          <svg
            className="w-5 h-5 sm:w-4 sm:h-4"
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
          className="p-3 sm:p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm hover:shadow-md active:scale-95"
          title="삭제"
        >
          <svg
            className="w-5 h-5 sm:w-4 sm:h-4"
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

      {/* 카드 내용 - 모바일에서 수직 배치 */}
      <div className="p-4 sm:p-5 pt-14 sm:pt-12 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-start gap-y-3 sm:space-x-4">
          {/* 파비콘 - 모바일에서 위쪽 */}
          <div className="relative flex-shrink-0 flex justify-center sm:block mb-2 sm:mb-0">
            <div className="w-12 h-12 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center shadow-sm">
              {bookmark.favicon ? (
                <img
                  src={bookmark.favicon}
                  alt="파비콘"
                  className="w-8 h-8 sm:w-6 sm:h-6 rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <svg
                  className="w-6 h-6 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              )}
            </div>
            {faviconLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-5 sm:w-5 border-2 border-blue-500 border-t-transparent"></div>
              </div>
            )}
          </div>

          {/* 텍스트 및 정보 영역 - 수직 배치 */}
          <div className="flex-1 min-w-0 flex flex-col gap-y-2">
            <div className="flex items-center space-x-2 mb-1">
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg sm:text-base font-semibold text-gray-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 cursor-pointer"
                title={bookmark.title}
              >
                {bookmark.title}
              </a>
            </div>
            <p className="text-sm sm:text-sm text-gray-500 dark:text-gray-400 truncate">
              {bookmark.url}
            </p>
            {/* 컬렉션 정보 - 모바일에서 아래쪽 */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {collection ? (
                <span className="inline-flex items-center px-3 py-2 sm:px-2.5 sm:py-1 rounded-full text-sm sm:text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  {collection.icon} {collection.name}
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-2 sm:px-2.5 sm:py-1 rounded-full text-sm sm:text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                  컬렉션 없음
                </span>
              )}
              <div className="text-sm sm:text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-2 sm:px-2 sm:py-1 rounded-md">
                {bookmark.createdAt.toLocaleDateString()}
              </div>
            </div>
            {/* 태그 배지 - 모바일에서 아래쪽 */}
            {bookmark.tags && bookmark.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 sm:gap-1.5 mb-1">
                {bookmark.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1.5 sm:px-2.5 sm:py-1 rounded-full text-sm sm:text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 shadow-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            {bookmark.description && (
              <p className="text-sm sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-2 transition-colors duration-200 leading-relaxed">
                {bookmark.description}
              </p>
            )}
          </div>
        </div>
        {/* 방문하기 버튼: 모바일에서 전체 너비, 데스크톱은 우측 정렬 */}
        <div className="flex mt-4 sm:justify-end">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full sm:w-auto space-x-2 px-4 py-3 sm:px-4 sm:py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md active:scale-95 min-h-[44px] sm:min-h-[36px]"
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
  );
};
