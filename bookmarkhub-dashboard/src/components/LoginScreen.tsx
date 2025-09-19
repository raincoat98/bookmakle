import AuthButtons from "./AuthButtons";

export const LoginScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-brand-100 to-accent-100 dark:from-gray-900 dark:via-brand-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="card p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              북마크 허브
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              즐겨찾는 사이트를 한 곳에서 관리하세요
            </p>
          </div>
          <AuthButtons />
        </div>
      </div>
    </div>
  );
};
