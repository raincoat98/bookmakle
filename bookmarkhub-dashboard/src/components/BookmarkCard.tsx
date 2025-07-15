import { useState } from "react";
import type { Bookmark } from "../types";
import { Edit, Trash2, MoreVertical, ExternalLink } from "lucide-react";

interface BookmarkCardProps {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onToggleMenu?: (id: string) => void;
  isMenuOpen?: boolean;
}

export const BookmarkCard = ({
  bookmark,
  onEdit,
  onDelete,
  onToggleFavorite,
  onToggleMenu,
  isMenuOpen = false,
}: BookmarkCardProps) => {
  const [faviconLoading, setFaviconLoading] = useState(false);

  const handleFaviconError = () => {
    setFaviconLoading(false);
  };

  const handleFaviconLoad = () => {
    setFaviconLoading(false);
  };

  return (
    <div className="card-glass hover-lift group">
      <div className="p-6">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            {/* 파비콘 */}
            <div className="relative flex-shrink-0">
              {bookmark.favicon ? (
                <img
                  src={bookmark.favicon}
                  alt="파비콘"
                  className="w-8 h-8 rounded-xl shadow-soft"
                  onError={handleFaviconError}
                  onLoad={handleFaviconLoad}
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-r from-brand-500 to-accent-500 rounded-xl flex items-center justify-center shadow-soft">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
              )}
              {faviconLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="spinner w-5 h-5"></div>
                </div>
              )}
            </div>

            {/* 제목과 URL */}
            <div className="flex-1 min-w-0">
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base font-semibold text-gray-900 dark:text-white truncate hover:gradient-text transition-all duration-200 cursor-pointer block"
                title={bookmark.title}
              >
                {bookmark.title}
              </a>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                {bookmark.url}
              </p>
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="relative flex-shrink-0 flex items-center space-x-2">
            {/* 즐겨찾기 버튼 */}
            <button
              onClick={() =>
                onToggleFavorite(bookmark.id, !bookmark.isFavorite)
              }
              className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-xl transition-all duration-200 hover:scale-110 hover:bg-white/50 dark:hover:bg-gray-700/50 backdrop-blur-sm min-w-[40px] min-h-[40px] flex items-center justify-center"
              aria-label={
                bookmark.isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"
              }
            >
              <svg
                className={`w-5 h-5 ${
                  bookmark.isFavorite
                    ? "text-red-500 dark:text-red-400 fill-current"
                    : "text-gray-400"
                }`}
                fill={bookmark.isFavorite ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>

            {/* 외부 링크 버튼 */}
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 rounded-xl transition-all duration-200 hover:scale-110 hover:bg-white/50 dark:hover:bg-gray-700/50 backdrop-blur-sm min-w-[40px] min-h-[40px] flex items-center justify-center"
              aria-label="새 탭에서 열기"
            >
              <ExternalLink className="w-5 h-5" />
            </a>

            {/* 메뉴 버튼 */}
            {onToggleMenu && (
              <button
                onClick={() => onToggleMenu(bookmark.id)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-xl transition-all duration-200 hover:scale-110 hover:bg-white/50 dark:hover:bg-gray-700/50 backdrop-blur-sm min-w-[40px] min-h-[40px] flex items-center justify-center"
                aria-label="메뉴"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* 메뉴 드롭다운 */}
        {isMenuOpen && onToggleMenu && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-glass border border-white/20 dark:border-gray-700/20 z-50 animate-slide-up">
            <div className="p-2 space-y-1">
              <button
                onClick={() => onEdit(bookmark)}
                className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-xl transition-colors duration-200"
              >
                <Edit className="w-4 h-4" />
                <span>편집</span>
              </button>
              <button
                onClick={() => onDelete(bookmark.id)}
                className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4" />
                <span>삭제</span>
              </button>
            </div>
          </div>
        )}

        {/* 메타데이터 */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <span>
            생성일: {new Date(bookmark.createdAt).toLocaleDateString()}
          </span>
          {bookmark.collection && (
            <span className="badge">{bookmark.collection}</span>
          )}
        </div>
      </div>
    </div>
  );
};
