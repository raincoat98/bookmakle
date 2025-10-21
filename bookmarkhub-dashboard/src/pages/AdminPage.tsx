import { Header } from "../components/Header";
import { AdminUserList } from "../components/AdminUserList";
import { useAdminUsers } from "../hooks/useAdminUsers";
import { ShieldCheck } from "lucide-react";

export function AdminPage() {
  const { users, loading, error, refetch, toggleUserStatus } = useAdminUsers();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 섹션 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="h-8 w-8 text-brand-600 dark:text-brand-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              관리자 대시보드
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            전체 사용자를 관리하고 통계를 확인할 수 있습니다.
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-red-800 dark:text-red-200">{error}</p>
              <button
                onClick={refetch}
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
              >
                다시 시도
              </button>
            </div>
          </div>
        )}

        {/* 사용자 목록 */}
        <AdminUserList
          users={users}
          loading={loading}
          onToggleUserStatus={toggleUserStatus}
        />
      </main>
    </div>
  );
}
