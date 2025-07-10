import { useAuth } from "../hooks/useAuth";
import { useState, useEffect } from "react";

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
  onAddBookmark?: () => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  viewMode?: "grid" | "list";
  onViewModeChange?: (mode: "grid" | "list") => void;
}

export const Header = ({
  onMenuClick,
  showMenuButton = false,
  onAddBookmark,
  searchTerm = "",
  onSearchChange,
  viewMode = "grid",
  onViewModeChange,
}: HeaderProps) => {
  const { user, login, logout } = useAuth();
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex flex-wrap items-center h-16 min-w-0 overflow-x-auto">
          {/* 로고와 햄버거 메뉴 */}
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
            {showMenuButton && (
              <button
                onClick={onMenuClick}
                className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="메뉴 열기"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            )}
            <img src="/favicon.svg" alt="북마클" className="w-6 h-6" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block truncate">
              북마클
            </h1>
          </div>

          {/* 중앙 검색 및 컨트롤 */}
          <div className="flex-1 max-w-2xl mx-2 sm:mx-4 min-w-0">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              {/* 검색 입력창 */}
              {onSearchChange && (
                <div className="flex-1 relative min-w-0">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="검색..."
                    className="w-full px-3 py-2 pl-9 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0 text-sm"
                  />
                  <svg
                    className="absolute left-2 top-2.5 h-4 w-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              )}

              {/* 뷰 모드 전환 */}
              {onViewModeChange && (
                <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => onViewModeChange("grid")}
                    className={`p-2 rounded-md transition-colors duration-200 ${
                      viewMode === "grid"
                        ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                    title="그리드 뷰"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => onViewModeChange("list")}
                    className={`p-2 rounded-md transition-colors duration-200 ${
                      viewMode === "list"
                        ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                    title="리스트 뷰"
                  >
                    <svg
                      className="w-5 h-5"
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
                  </button>
                </div>
              )}

              {/* 북마크 추가 버튼 */}
              {onAddBookmark && (
                <button
                  onClick={onAddBookmark}
                  className="btn-primary flex items-center space-x-2 text-sm px-2 sm:px-4"
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
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <span className="hidden sm:inline">북마크 추가</span>
                </button>
              )}
            </div>
          </div>

          {/* 사용자 정보 */}
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4 min-w-0">
            {user ? (
              <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3 min-w-0">
                <span className="hidden sm:block text-sm text-gray-700 dark:text-gray-300 truncate max-w-[80px]">
                  {user.displayName}
                </span>
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <button
                  onClick={logout}
                  className="btn-secondary text-sm px-2 sm:px-4"
                >
                  <span className="hidden sm:inline">로그아웃</span>
                  <span className="sm:hidden">⎋</span>
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="btn-primary text-sm px-2 sm:px-4"
              >
                <span className="hidden sm:inline">Google로 로그인</span>
                <span className="sm:hidden">로그인</span>
              </button>
            )}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={theme === "dark" ? "라이트 모드" : "다크 모드"}
            >
              {theme === "dark" ? (
                <span role="img" aria-label="라이트 모드">
                  ☀️
                </span>
              ) : (
                <span role="img" aria-label="다크 모드">
                  🌙
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
