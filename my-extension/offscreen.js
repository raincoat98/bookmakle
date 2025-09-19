// 외부 공개 페이지(iframe)에 로그인 시퀀스를 시작하고, 결과를 다시 background로 전달.
const PUBLIC_POPUP_URL = "https://bookmarkhub-5ea6c-sign.web.app"; // Firebase Hosting 권장

// 현재 사용자 상태 저장
let currentUser = null;

const iframe = document.createElement("iframe");
iframe.src = PUBLIC_POPUP_URL;
iframe.style.display = "none"; // iframe 숨기기
document.documentElement.appendChild(iframe);

// iframe 로드 확인
iframe.addEventListener("load", () => {
  console.log("SignIn popup iframe loaded successfully");
});

iframe.addEventListener("error", () => {
  console.error("SignIn popup iframe failed to load");
});

// Chrome Extension Storage에서 사용자 정보 로드
chrome.storage.local.get(["currentUser"], (result) => {
  if (result.currentUser) {
    currentUser = result.currentUser;
  }
});

// background → offscreen 메시지 브리지
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.target !== "offscreen") return;

  if (msg.type === "START_POPUP_AUTH") {
    // 외부 페이지에 초기화 신호
    const origin = new URL(PUBLIC_POPUP_URL).origin;

    function handleIframeMessage(ev) {
      // Firebase 내부 메시지 노이즈 필터
      if (typeof ev.data === "string" && ev.data.startsWith("!_{")) return;

      try {
        const data =
          typeof ev.data === "string" ? JSON.parse(ev.data) : ev.data;
        window.removeEventListener("message", handleIframeMessage);

        // 로그인 성공 시 사용자 정보 저장
        if (data.user) {
          currentUser = data.user;
          chrome.storage.local.set({ currentUser: data.user });
        }

        sendResponse(data); // background로 결과 반환
      } catch (e) {
        sendResponse({ name: "ParseError", message: e.message });
      }
    }

    window.addEventListener("message", handleIframeMessage, false);
    iframe.contentWindow.postMessage({ initAuth: true }, origin);

    return true; // async 응답
  }

  if (msg.type === "GET_AUTH_STATE") {
    // 저장된 사용자 상태 반환
    sendResponse({
      user: currentUser,
    });
    return true;
  }

  if (msg.type === "LOGOUT") {
    // 로그아웃 처리
    currentUser = null;
    chrome.storage.local.remove(["currentUser"]);
    sendResponse({ success: true });
    return true;
  }
});
