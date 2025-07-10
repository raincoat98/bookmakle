import { useAuth } from "../hooks/useAuth";
import { useState, useEffect } from "react";

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export const Header = ({
  onMenuClick,
  showMenuButton = false,
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
        <div className="flex items-center justify-between h-16">
          {/* 로고와 햄버거 메뉴 */}
          <div className="flex items-center space-x-2 sm:space-x-4">
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
            <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
              북마클
            </h1>
          </div>

          {/* 사용자 정보 */}
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
            {user ? (
              <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
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
                  aria-label="로그아웃"
                >
                  로그아웃
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

            {/* 테마 토글 버튼 */}
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="테마 변경"
            >
              {theme === "light" ? (
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
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              ) : (
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
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
