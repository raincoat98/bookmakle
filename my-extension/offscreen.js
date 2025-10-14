// 외부 공개 페이지(iframe)에 로그인 시퀀스를 시작하고, 결과를 다시 background로 전달.
const PUBLIC_POPUP_URL = "https://bookmarkhub-5ea6c-sign.web.app"; // Firebase Hosting 권장

// 현재 사용자 상태 저장
let currentUser = null;
let currentIdToken = null;

const iframe = document.createElement("iframe");
iframe.src = PUBLIC_POPUP_URL;
iframe.style.display = "none"; // iframe 숨기기
document.documentElement.appendChild(iframe);

// iframe 로드 확인
iframe.addEventListener("load", () => {
  console.log("SignIn popup iframe loaded successfully");
  // background에 준비 완료 신호 보내기
  chrome.runtime.sendMessage({ type: "OFFSCREEN_READY" }).catch(() => {
    // 메시지를 받을 리스너가 없을 수 있음 (무시)
  });
});

iframe.addEventListener("error", () => {
  console.error("SignIn popup iframe failed to load");
});

// Chrome Extension Storage에서 사용자 정보 및 토큰 로드
if (chrome.storage && chrome.storage.local) {
  chrome.storage.local.get(["currentUser", "currentIdToken"], (result) => {
    if (result.currentUser) {
      currentUser = result.currentUser;
    }
    if (result.currentIdToken) {
      currentIdToken = result.currentIdToken;
      console.log("Loaded idToken from storage");
    }
  });
}

// background → offscreen 메시지 브리지
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.target !== "offscreen") return;

  // PING 응답 (준비 확인용)
  if (msg.type === "PING") {
    sendResponse({ ready: true });
    return true;
  }

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

        // 로그인 성공 시 사용자 정보와 토큰 저장
        if (data.user) {
          currentUser = data.user;
          currentIdToken = data.idToken;
          if (chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({
              currentUser: data.user,
              currentIdToken: data.idToken,
            });
          }
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
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.remove(["currentUser"]);
    }
    sendResponse({ success: true });
    return true;
  }

  if (msg.type === "GET_COLLECTIONS") {
    // 컬렉션 데이터 요청
    const origin = new URL(PUBLIC_POPUP_URL).origin;

    function handleCollectionsMessage(ev) {
      // Firebase 내부 메시지 노이즈 필터
      if (typeof ev.data === "string" && ev.data.startsWith("!_{")) return;

      try {
        const data =
          typeof ev.data === "string" ? JSON.parse(ev.data) : ev.data;

        // 컬렉션 데이터 응답만 처리
        if (
          data.type === "COLLECTIONS_DATA" ||
          data.type === "COLLECTIONS_ERROR"
        ) {
          window.removeEventListener("message", handleCollectionsMessage);
          sendResponse(data);
        }
      } catch (e) {
        window.removeEventListener("message", handleCollectionsMessage);
        sendResponse({
          type: "COLLECTIONS_ERROR",
          name: "ParseError",
          message: e.message,
        });
      }
    }

    window.addEventListener("message", handleCollectionsMessage, false);
    iframe.contentWindow.postMessage(
      {
        getCollections: true,
        idToken: currentIdToken, // ID 토큰 함께 전달
      },
      origin
    );

    return true; // async 응답
  }

  if (msg.type === "GET_BOOKMARKS") {
    // 북마크 데이터 요청
    const origin = new URL(PUBLIC_POPUP_URL).origin;

    function handleBookmarksMessage(ev) {
      // Firebase 내부 메시지 노이즈 필터
      if (typeof ev.data === "string" && ev.data.startsWith("!_{")) return;

      try {
        const data =
          typeof ev.data === "string" ? JSON.parse(ev.data) : ev.data;

        // 북마크 데이터 응답만 처리
        if (data.type === "BOOKMARKS_DATA" || data.type === "BOOKMARKS_ERROR") {
          window.removeEventListener("message", handleBookmarksMessage);
          sendResponse(data);
        }
      } catch (e) {
        window.removeEventListener("message", handleBookmarksMessage);
        sendResponse({
          type: "BOOKMARKS_ERROR",
          name: "ParseError",
          message: e.message,
        });
      }
    }

    window.addEventListener("message", handleBookmarksMessage, false);
    iframe.contentWindow.postMessage(
      {
        getBookmarks: true,
        collectionId: msg.collectionId,
        idToken: currentIdToken, // ID 토큰 함께 전달
      },
      origin
    );

    return true; // async 응답
  }

  if (msg.type === "SAVE_BOOKMARK") {
    // 북마크 저장 요청
    const origin = new URL(PUBLIC_POPUP_URL).origin;

    function handleSaveBookmarkMessage(ev) {
      // Firebase 내부 메시지 노이즈 필터
      if (typeof ev.data === "string" && ev.data.startsWith("!_{")) return;

      try {
        const data =
          typeof ev.data === "string" ? JSON.parse(ev.data) : ev.data;

        // 북마크 저장 응답만 처리
        if (
          data.type === "BOOKMARK_SAVED" ||
          data.type === "BOOKMARK_SAVE_ERROR"
        ) {
          window.removeEventListener("message", handleSaveBookmarkMessage);
          sendResponse(data);
        }
      } catch (e) {
        window.removeEventListener("message", handleSaveBookmarkMessage);
        sendResponse({
          type: "BOOKMARK_SAVE_ERROR",
          name: "ParseError",
          message: e.message,
        });
      }
    }

    window.addEventListener("message", handleSaveBookmarkMessage, false);
    iframe.contentWindow.postMessage(
      {
        saveBookmark: true,
        bookmarkData: msg.bookmarkData,
        idToken: currentIdToken, // ID 토큰 함께 전달
      },
      origin
    );

    return true; // async 응답
  }
});
