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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고와 햄버거 메뉴 */}
          <div className="flex items-center space-x-4">
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
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              북마클
            </h1>
          </div>

          {/* 사용자 정보 */}
          <div className="flex items-center space-x-2 lg:space-x-4">
            {user ? (
              <div className="flex items-center space-x-2 lg:space-x-3">
                <span className="hidden sm:block text-sm text-gray-700 dark:text-gray-300">
                  {user.displayName}
                </span>
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <button onClick={logout} className="btn-secondary text-sm">
                  <span className="hidden sm:inline">로그아웃</span>
                  <span className="sm:hidden">로그아웃</span>
                </button>
              </div>
            ) : (
              <button onClick={login} className="btn-primary text-sm">
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
