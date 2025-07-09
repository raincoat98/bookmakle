import { useAuth } from "../hooks/useAuth";

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export const Header = ({
  onMenuClick,
  showMenuButton = false,
}: HeaderProps) => {
  const { user, login, logout } = useAuth();

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

          {/* 검색창 */}
          <div className="flex-1 max-w-lg mx-4 lg:mx-8">
            <div className="relative">
              <input
                type="text"
                placeholder="북마크 검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
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
            </div>
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
          </div>
        </div>
      </div>
    </header>
  );
};
