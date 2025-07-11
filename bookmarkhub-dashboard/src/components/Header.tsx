import { useAuth } from "../hooks/useAuth";
import { useState, useEffect } from "react";
import { Menu, Sun, Moon, Briefcase, List } from "lucide-react";

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
  showDashboard?: boolean;
  setShowDashboard?: (value: boolean) => void;
}

export const Header = ({
  onMenuClick,
  showMenuButton = false,
  showDashboard,
  setShowDashboard,
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
                <Menu className="w-6 h-6" />
              </button>
            )}
            <img src="/favicon.svg" alt="북마클" className="w-6 h-6" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
              북마클
            </h1>
          </div>

          {/* 대시보드/북마크 토글 버튼 */}
          {typeof showDashboard === "boolean" && setShowDashboard && (
            <div className="flex gap-2 mr-4">
              <button
                className={`px-3 py-1 rounded font-medium text-sm transition-colors flex items-center gap-1 ${
                  showDashboard
                    ? "bg-brand-600 text-white shadow"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-brand-100 dark:hover:bg-brand-900"
                }`}
                onClick={() => setShowDashboard(true)}
              >
                <Briefcase className="w-4 h-4" />
                대시보드 보기
              </button>
              <button
                className={`px-3 py-1 rounded font-medium text-sm transition-colors flex items-center gap-1 ${
                  !showDashboard
                    ? "bg-brand-600 text-white shadow"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-brand-100 dark:hover:bg-brand-900"
                }`}
                onClick={() => setShowDashboard(false)}
              >
                <List className="w-4 h-4" />
                북마크 보기
              </button>
            </div>
          )}

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
