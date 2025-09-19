// Chrome Extension MV3에서는 Firebase SDK를 직접 import할 수 없음
// 모든 Firebase 로직은 offscreen document에서 처리

// Offscreen 문서 경로 상수
const OFFSCREEN_PATH = "offscreen.html";

// 동시 생성 방지
let creatingOffscreen;

async function hasOffscreen() {
  const clientsList = await self.clients.matchAll();
  return clientsList.some(
    (c) => c.url === chrome.runtime.getURL(OFFSCREEN_PATH)
  );
}

async function setupOffscreen() {
  if (await hasOffscreen()) return;
  if (creatingOffscreen) return creatingOffscreen;

  creatingOffscreen = chrome.offscreen.createDocument({
    url: OFFSCREEN_PATH,
    reasons: [chrome.offscreen.Reason.DOM_SCRAPING],
    justification: "Firebase signInWithPopup in iframe (MV3 limitation)",
  });
  await creatingOffscreen;
}

async function closeOffscreen() {
  if (await hasOffscreen()) {
    await chrome.offscreen.closeDocument();
  }
}

// 외부 웹사이트에서 로그인 완료 시 호출되는 메시지 처리
chrome.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {
    if (request.type === "LOGIN_SUCCESS" && request.user) {
      // Chrome Storage에 사용자 정보 저장
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ currentUser: request.user }, () => {
          console.log("User login saved from external site:", request.user);
          sendResponse({ success: true });
        });
      } else {
        console.error("Chrome Storage API가 사용할 수 없습니다");
        sendResponse({ success: false, error: "Storage API unavailable" });
      }
      return true;
    }

    if (request.type === "LOGOUT_SUCCESS") {
      // Chrome Storage에서 사용자 정보 제거
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.remove(["currentUser"], () => {
          console.log("User logout completed from external site");
          sendResponse({ success: true });
        });
      } else {
        console.error("Chrome Storage API가 사용할 수 없습니다");
        sendResponse({ success: false, error: "Storage API unavailable" });
      }
      return true;
    }
  }
);

// popup → background 메시지 수신 (통합된 단일 리스너)
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      if (msg?.type === "LOGIN_GOOGLE") {
        await setupOffscreen();
        // offscreen으로 위임
        const result = await chrome.runtime.sendMessage({
          target: "offscreen",
          type: "START_POPUP_AUTH",
        });
        await closeOffscreen();
        sendResponse(result);
        return;
      }

      if (msg?.type === "GET_AUTH_STATE") {
        // Chrome Storage에서 직접 사용자 정보 조회
        if (chrome.storage && chrome.storage.local) {
          chrome.storage.local.get(["currentUser"], (result) => {
            sendResponse({ user: result.currentUser || null });
          });
        } else {
          console.error("Chrome Storage API가 사용할 수 없습니다");
          sendResponse({ user: null, error: "Storage API unavailable" });
        }
        return;
      }

      if (msg?.type === "LOGOUT") {
        // Chrome Storage에서 사용자 정보 제거
        if (chrome.storage && chrome.storage.local) {
          chrome.storage.local.remove(["currentUser"], () => {
            sendResponse({ success: true });
          });
        } else {
          console.error("Chrome Storage API가 사용할 수 없습니다");
          sendResponse({ success: false, error: "Storage API unavailable" });
        }
        return;
      }
    } catch (error) {
      console.error("Background script error:", error);
      sendResponse({ error: error.message });
    }
  })();

  // async 응답을 위해 true
  return true;
});

// serializeUser 함수는 offscreen.js에서 처리

// 확장 프로그램 설치 시 컨텍스트 메뉴 생성
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("확장 프로그램 설치/업데이트됨:", details.reason);
  await createContextMenus();
});

// 확장 프로그램 시작 시 컨텍스트 메뉴 생성
chrome.runtime.onStartup.addListener(async () => {
  console.log("확장 프로그램 시작됨");
  await createContextMenus();
});

// 서비스 워커가 활성화될 때도 메뉴 생성 (MV3에서 중요)
self.addEventListener("activate", async (event) => {
  console.log("서비스 워커 활성화됨");
  event.waitUntil(createContextMenus());
});

// 컨텍스트 메뉴 생성 함수
async function createContextMenus() {
  try {
    console.log("컨텍스트 메뉴 생성 시작...");

    // 기존 메뉴 모두 제거
    await chrome.contextMenus.removeAll();
    console.log("기존 메뉴 제거 완료");

    // 빠른 실행 모드 상태 확인
    const result = await chrome.storage.local.get(["quickMode"]);
    const isQuickMode = result.quickMode || false;
    console.log("빠른 실행 모드 상태:", isQuickMode);

    // 메뉴 항목 생성
    chrome.contextMenus.create(
      {
        id: "toggle-quick-mode",
        title: isQuickMode
          ? "⚡ 빠른 실행 모드 비활성화"
          : "⚡ 빠른 실행 모드 활성화",
        contexts: ["action"],
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error(
            "빠른 실행 모드 메뉴 생성 실패:",
            chrome.runtime.lastError
          );
        } else {
          console.log("빠른 실행 모드 메뉴 생성 성공");
        }
      }
    );

    chrome.contextMenus.create(
      {
        id: "separator",
        type: "separator",
        contexts: ["action"],
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error("구분선 메뉴 생성 실패:", chrome.runtime.lastError);
        } else {
          console.log("구분선 메뉴 생성 성공");
        }
      }
    );

    chrome.contextMenus.create(
      {
        id: "open-dashboard",
        title: "📊 대시보드 열기",
        contexts: ["action"],
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error("대시보드 메뉴 생성 실패:", chrome.runtime.lastError);
        } else {
          console.log("대시보드 메뉴 생성 성공");
        }
      }
    );

    console.log("컨텍스트 메뉴 생성 완료");
  } catch (error) {
    console.error("컨텍스트 메뉴 생성 중 오류:", error);
  }
}

// 컨텍스트 메뉴 클릭 이벤트 처리
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log("컨텍스트 메뉴 클릭됨:", info.menuItemId);

  try {
    switch (info.menuItemId) {
      case "toggle-quick-mode":
        console.log("빠른 실행 모드 토글 실행");
        await toggleQuickMode();
        break;
      case "open-dashboard":
        console.log("대시보드 열기 실행");
        await openDashboard();
        break;
      default:
        console.log("알 수 없는 메뉴 항목:", info.menuItemId);
    }
  } catch (error) {
    console.error("컨텍스트 메뉴 처리 중 오류:", error);
  }
});

// 빠른 실행 모드 토글 함수
async function toggleQuickMode() {
  try {
    const result = await chrome.storage.local.get(["quickMode"]);
    const currentMode = result.quickMode || false;
    const newMode = !currentMode;

    await chrome.storage.local.set({ quickMode: newMode });

    // 메뉴 텍스트 업데이트
    chrome.contextMenus.update(
      "toggle-quick-mode",
      {
        title: newMode
          ? "⚡ 빠른 실행 모드 비활성화"
          : "⚡ 빠른 실행 모드 활성화",
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error("메뉴 업데이트 실패:", chrome.runtime.lastError);
        } else {
          console.log("메뉴 업데이트 성공");
        }
      }
    );

    console.log(`빠른 실행 모드 ${newMode ? "활성화" : "비활성화"}`);
  } catch (error) {
    console.error("빠른 실행 모드 토글 실패:", error);
  }
}

// 대시보드 열기 함수
async function openDashboard() {
  try {
    const dashboardUrl = "https://bookmarkhub-5ea6c.web.app";
    await chrome.tabs.create({ url: dashboardUrl });
  } catch (error) {
    console.error("대시보드 열기 실패:", error);
  }
}
