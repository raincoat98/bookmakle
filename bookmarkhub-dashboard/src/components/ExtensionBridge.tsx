import { useEffect, useState } from "react";
import { useAuthStore } from "../stores";
import { useNavigate, useLocation } from "react-router-dom";

interface ExtensionBridgeProps {
  extensionId?: string;
}

export default function ExtensionBridge({}: ExtensionBridgeProps) {
  const { user, logout } = useAuthStore();
  const [isFromExtension, setIsFromExtension] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // URL 파라미터 확인 (location.search 사용)
    const urlParams = new URLSearchParams(location.search);
    const source = urlParams.get("source");
    const extId = urlParams.get("extensionId");

    if (source === "extension" && extId) {
      setIsFromExtension(true);

      // 로그인된 상태이고 Extension 성공 페이지에 있다면 Extension에 메시지 전송
      if (user && location.pathname === "/extension-login-success") {
        sendToExtension(extId, "LOGIN_SUCCESS", user);
      }
      // 이미 로그인된 상태이지만 성공 페이지가 아니라면 리다이렉트
      else if (user && location.pathname !== "/extension-login-success") {
        navigate("/extension-login-success" + location.search);
      }
    }
  }, [user, navigate, location.pathname, location.search]);

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

  const handleBackToExtension = () => {
    const urlParams = new URLSearchParams(location.search);
    const extId = urlParams.get("extensionId");

    if (extId && user) {
      sendToExtension(extId, "LOGIN_SUCCESS", user);
    }

    // Extension으로 돌아가기
    window.close(); // 탭이 Extension에 의해 열린 경우 닫기
  };

  const handleLogoutAndReturn = async () => {
    const urlParams = new URLSearchParams(location.search);
    const extId = urlParams.get("extensionId");

    try {
      await logout();

      if (extId) {
        sendToExtension(extId, "LOGOUT_SUCCESS");
      }

      window.close();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!isFromExtension || location.pathname !== "/extension-login-success") {
    return null; // Extension에서 온 요청이 아니거나 성공 페이지가 아니면 렌더링하지 않음
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: "#e3f2fd",
        padding: "12px",
        borderBottom: "1px solid #90caf9",
        zIndex: 1000,
        textAlign: "center",
      }}
    >
      <div
        style={{
          maxWidth: 600,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: "14px", color: "#1565c0" }}>
          🔌 Chrome Extension에서 접속됨
        </span>

        <div style={{ display: "flex", gap: "8px" }}>
          {user ? (
            <>
              <button
                onClick={handleBackToExtension}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#1976d2",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Extension으로 돌아가기
              </button>
              <button
                onClick={handleLogoutAndReturn}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#d32f2f",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                로그아웃 후 돌아가기
              </button>
            </>
          ) : (
            <span style={{ fontSize: "12px", color: "#1565c0" }}>
              로그인 후 자동으로 Extension으로 돌아갑니다
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
