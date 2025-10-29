import { useAuthStore } from "../stores";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

export const ExtensionLoginSuccessPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Extension에서 온 요청이 아니거나 로그인되지 않았다면 메인 페이지로 리다이렉트
    const urlParams = new URLSearchParams(location.search);
    const source = urlParams.get("source");

    if (source !== "extension" || !user) {
      navigate("/");
    }
  }, [user, navigate, location.search]);

  const sendToExtension = (extensionId: string, type: string, data?: any) => {
    if (
      typeof (window as any).chrome !== "undefined" &&
      (window as any).chrome.runtime
    ) {
      (window as any).chrome.runtime.sendMessage(
        extensionId,
        {
          type,
          user: data
            ? {
                uid: data.uid,
                email: data.email,
                displayName: data.displayName,
                photoURL: data.photoURL,
              }
            : undefined,
        },
        (response: any) => {
          if ((window as any).chrome.runtime.lastError) {
            console.error(
              "Extension communication error:",
              (window as any).chrome.runtime.lastError
            );
          } else {
            console.log("Extension response:", response);
          }
        }
      );
    }
  };

  const handleGoToDashboard = () => {
    const urlParams = new URLSearchParams(location.search);
    const extId = urlParams.get("extensionId");

    if (extId && user) {
      sendToExtension(extId, "LOGIN_SUCCESS", user);
    }
    navigate("/dashboard");
  };

  const handleCloseWindow = () => {
    const urlParams = new URLSearchParams(location.search);
    const extId = urlParams.get("extensionId");

    if (extId && user) {
      sendToExtension(extId, "LOGIN_SUCCESS", user);
    }

    // Extension에서 열린 창이라면 닫기
    if (window.opener) {
      window.close();
    } else {
      // 일반 브라우저에서 열렸다면 대시보드로 이동
      navigate("/dashboard");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-brand-100 to-accent-100 dark:from-gray-900 dark:via-brand-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="card p-8 text-center">
          {/* Extension 접속 알림 */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <span className="text-2xl">🔌</span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
              Chrome Extension에서 접속됨
            </p>
          </div>

          {/* 로그인 성공 메시지 */}
          <div className="mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              로그인 완료!
            </h1>

            <p className="text-gray-600 dark:text-gray-400 mb-4">
              안녕하세요,{" "}
              <span className="font-semibold text-brand-600 dark:text-brand-400">
                {user.displayName || user.email}
              </span>
              님!
            </p>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              북마클에 성공적으로 로그인되었습니다.
            </p>
          </div>

          {/* 액션 버튼들 */}
          <div className="space-y-3">
            <button
              onClick={handleGoToDashboard}
              className="w-full btn-primary flex items-center justify-center space-x-2"
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
              <span>대시보드로 가기</span>
            </button>

            <button
              onClick={handleCloseWindow}
              className="w-full btn-secondary flex items-center justify-center space-x-2"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span>창 닫기</span>
            </button>
          </div>

          {/* 추가 안내 */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              이제 Chrome Extension에서 북마크를 관리할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
