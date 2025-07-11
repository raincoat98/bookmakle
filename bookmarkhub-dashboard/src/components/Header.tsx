import { useAuth } from "../hooks/useAuth";
import { useState, useEffect } from "react";
import { Menu, Sun, Moon, Briefcase, List, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
  defaultPage?: string | null;
}

export const Header = ({
  onMenuClick,
  showMenuButton = false,
  defaultPage,
}: HeaderProps) => {
  const { user, login, logout } = useAuth();
  const location = useLocation();
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
                className="block sm:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="메뉴 열기"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}
            <Link to="/" className="flex items-center space-x-2">
              <img src="/favicon.svg" alt="북마클" className="w-6 h-6" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
                북마클
              </h1>
            </Link>
          </div>

          {/* 네비게이션 링크 */}
          <div className="gap-2 mr-4 hidden sm:flex">
            <Link
              to="/dashboard"
              className={`px-3 py-1 rounded font-medium text-sm transition-colors flex items-center gap-1 ${
                location.pathname === "/dashboard" ||
                (location.pathname === "/" && defaultPage === "dashboard")
                  ? "bg-brand-600 text-white shadow"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-brand-100 dark:hover:bg-brand-900"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              대시보드
            </Link>
            <Link
              to="/bookmarks"
              className={`px-3 py-1 rounded font-medium text-sm transition-colors flex items-center gap-1 ${
                location.pathname === "/bookmarks" ||
                (location.pathname === "/" && defaultPage === "bookmarks")
                  ? "bg-brand-600 text-white shadow"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-brand-100 dark:hover:bg-brand-900"
              }`}
            >
              <List className="w-4 h-4" />
              북마크
            </Link>
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

            {/* 설정 버튼 */}
            <Link
              to="/settings"
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="설정"
            >
              <Settings className="w-5 h-5" />
            </Link>
            {/* 테마 토글 버튼 */}
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="테마 변경"
            >
              {theme === "light" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
