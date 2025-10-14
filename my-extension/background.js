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
  if (await hasOffscreen()) {
    // 이미 존재하면 준비 확인만
    await waitForOffscreenReady();
    return;
  }

  if (creatingOffscreen) {
    await creatingOffscreen;
    await waitForOffscreenReady();
    return;
  }

  creatingOffscreen = chrome.offscreen.createDocument({
    url: OFFSCREEN_PATH,
    reasons: [chrome.offscreen.Reason.DOM_SCRAPING],
    justification: "Firebase signInWithPopup in iframe (MV3 limitation)",
  });
  await creatingOffscreen;
  creatingOffscreen = null;

  // offscreen이 준비될 때까지 대기
  await waitForOffscreenReady();
}

// offscreen이 준비될 때까지 대기 (ping 테스트)
async function waitForOffscreenReady(maxWait = 5000) {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    try {
      // ping 메시지를 보내서 응답이 오는지 확인
      await chrome.runtime.sendMessage({
        target: "offscreen",
        type: "PING",
      });
      // 응답이 왔으면 준비된 것
      console.log("Offscreen is ready");
      return;
    } catch (error) {
      // 아직 준비 안됨, 조금 더 대기
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  console.warn("Offscreen may not be ready after maximum wait time");
}

// offscreen으로 메시지를 보내고 재시도 로직 포함
async function sendMessageToOffscreen(message, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await chrome.runtime.sendMessage(message);
      return result;
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      console.log(`Offscreen 메시지 전송 재시도 ${i + 1}/${maxRetries}`);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
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
        const result = await sendMessageToOffscreen({
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

      if (msg?.type === "GET_COLLECTIONS") {
        // 컬렉션 데이터 요청을 offscreen으로 전달
        await setupOffscreen();
        const result = await sendMessageToOffscreen({
          target: "offscreen",
          type: "GET_COLLECTIONS",
          userId: msg.userId,
        });
        sendResponse(result);
        return;
      }

      if (msg?.type === "GET_BOOKMARKS") {
        // 북마크 데이터 요청을 offscreen으로 전달
        await setupOffscreen();
        const result = await sendMessageToOffscreen({
          target: "offscreen",
          type: "GET_BOOKMARKS",
          userId: msg.userId,
          collectionId: msg.collectionId,
        });
        sendResponse(result);
        return;
      }

      if (msg?.type === "SAVE_BOOKMARK") {
        // 북마크 저장 요청을 offscreen으로 전달
        await setupOffscreen();
        const result = await sendMessageToOffscreen({
          target: "offscreen",
          type: "SAVE_BOOKMARK",
          bookmarkData: msg.bookmarkData,
        });

        // 저장 성공 시 아이콘에 체크 표시
        if (result?.type === "BOOKMARK_SAVED") {
          const [activeTab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });
          if (activeTab) {
            chrome.action.setBadgeText({ text: "✓", tabId: activeTab.id });
            chrome.action.setBadgeBackgroundColor({
              color: "#10b981",
              tabId: activeTab.id,
            });

            // 3초 후 제거
            setTimeout(() => {
              chrome.action.setBadgeText({ text: "", tabId: activeTab.id });
            }, 3000);
          }
        }

        sendResponse(result);
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

// 메뉴 생성 상태 추적
let isCreatingMenus = false;
let menuCreationPromise = null;

// 컨텍스트 메뉴 생성 함수
async function createContextMenus() {
  // 이미 메뉴 생성 중이면 기존 Promise 반환
  if (isCreatingMenus && menuCreationPromise) {
    console.log("메뉴 생성이 이미 진행 중입니다. 기존 작업을 기다립니다.");
    return menuCreationPromise;
  }

  isCreatingMenus = true;
  menuCreationPromise = createContextMenusInternal();

  try {
    await menuCreationPromise;
  } finally {
    isCreatingMenus = false;
    menuCreationPromise = null;
  }
}

async function createContextMenusInternal() {
  try {
    console.log("컨텍스트 메뉴 생성 시작...");

    // 기존 메뉴 완전 제거 및 확인
    await removeAllMenusSafely();

    // 빠른 실행 모드 상태 확인
    const result = await chrome.storage.local.get(["quickMode"]);
    const isQuickMode = result.quickMode || false;
    console.log("빠른 실행 모드 상태:", isQuickMode);

    // 메뉴 생성 (재시도 로직 포함)
    const menuItems = [
      {
        id: "toggle-quick-mode",
        title: isQuickMode
          ? "⚡ 빠른 실행 모드 비활성화"
          : "⚡ 빠른 실행 모드 활성화",
        contexts: ["action"],
      },
      {
        id: "separator",
        type: "separator",
        contexts: ["action"],
      },
      {
        id: "open-dashboard",
        title: "📊 대시보드 열기",
        contexts: ["action"],
      },
    ];

    for (const menuItem of menuItems) {
      await createContextMenuItemWithRetry(menuItem, 3);
    }

    console.log("컨텍스트 메뉴 생성 완료");
  } catch (error) {
    console.error("컨텍스트 메뉴 생성 중 오류:", error);
    // 실패해도 확장 프로그램이 계속 작동하도록 함
  }
}

// 안전한 메뉴 제거 함수
async function removeAllMenusSafely() {
  console.log("기존 메뉴 제거 시작...");

  // 첫 번째 시도: 일반 제거
  await new Promise((resolve) => {
    chrome.contextMenus.removeAll(() => {
      if (chrome.runtime.lastError) {
        console.warn(
          "첫 번째 메뉴 제거 시도 중 경고:",
          chrome.runtime.lastError.message
        );
      }
      resolve();
    });
  });

  // 제거 완료 대기
  await new Promise((resolve) => setTimeout(resolve, 200));

  // 두 번째 시도: 확실한 제거
  await new Promise((resolve) => {
    chrome.contextMenus.removeAll(() => {
      if (chrome.runtime.lastError) {
        console.warn(
          "두 번째 메뉴 제거 시도 중 경고:",
          chrome.runtime.lastError.message
        );
      } else {
        console.log("기존 메뉴 제거 완료");
      }
      resolve();
    });
  });

  // 추가 안전 대기
  await new Promise((resolve) => setTimeout(resolve, 300));
}

// 재시도 로직이 포함된 메뉴 생성 함수
async function createContextMenuItemWithRetry(properties, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await createContextMenuItem(properties);
      return; // 성공하면 종료
    } catch (error) {
      console.warn(
        `메뉴 생성 시도 ${attempt}/${maxRetries} 실패:`,
        error.message
      );

      if (attempt === maxRetries) {
        console.error(
          `메뉴 생성 최종 실패 [${properties.id || properties.type}]`
        );
        throw error; // 최대 재시도 후 실패하면 에러 던지기
      }

      // 재시도 전 대기 (지수적 백오프)
      const delay = Math.pow(2, attempt) * 100; // 200ms, 400ms, 800ms
      console.log(`${delay}ms 후 재시도합니다...`);
      await new Promise((resolve) => setTimeout(resolve, delay));

      // 중복 ID 오류인 경우 추가 메뉴 제거 시도
      if (error.message.includes("duplicate")) {
        console.log("중복 ID 오류 감지 - 추가 메뉴 제거 시도");
        await new Promise((resolve) => {
          chrome.contextMenus.removeAll(() => {
            resolve();
          });
        });
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }
}

// 개별 컨텍스트 메뉴 아이템 생성 헬퍼 함수
function createContextMenuItem(properties) {
  return new Promise((resolve, reject) => {
    try {
      chrome.contextMenus.create(properties, () => {
        if (chrome.runtime.lastError) {
          const error = chrome.runtime.lastError;
          const errorMsg =
            error.message || error.toString() || "알 수 없는 오류";
          console.error(
            `메뉴 생성 실패 [${properties.id || properties.type}]:`,
            errorMsg
          );
          console.error("메뉴 속성:", JSON.stringify(properties, null, 2));

          // 특정 오류 타입에 대한 추가 정보
          if (errorMsg.includes("duplicate")) {
            console.error(
              "중복 ID 오류 - 기존 메뉴가 완전히 제거되지 않았을 수 있습니다"
            );
          }

          reject(new Error(errorMsg));
        } else {
          console.log(`메뉴 생성 성공 [${properties.id || properties.type}]`);
          resolve();
        }
      });
    } catch (syncError) {
      console.error("메뉴 생성 중 동기 오류:", syncError);
      reject(syncError);
    }
  });
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

    // 메뉴 텍스트 업데이트 (Promise 방식으로 개선)
    await updateContextMenuItem("toggle-quick-mode", {
      title: newMode
        ? "⚡ 빠른 실행 모드 비활성화"
        : "⚡ 빠른 실행 모드 활성화",
    });

    // 팝업 동작 업데이트
    await updatePopupBehavior();

    console.log(`빠른 실행 모드 ${newMode ? "활성화" : "비활성화"}`);
  } catch (error) {
    console.error("빠른 실행 모드 토글 실패:", error);
  }
}

// 컨텍스트 메뉴 아이템 업데이트 헬퍼 함수
function updateContextMenuItem(id, updateProperties) {
  return new Promise((resolve, reject) => {
    chrome.contextMenus.update(id, updateProperties, () => {
      if (chrome.runtime.lastError) {
        const errorMsg =
          chrome.runtime.lastError.message ||
          JSON.stringify(chrome.runtime.lastError);
        console.error(`메뉴 업데이트 실패 [${id}]:`, errorMsg);
        reject(new Error(errorMsg));
      } else {
        console.log(`메뉴 업데이트 성공 [${id}]`);
        resolve();
      }
    });
  });
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

// 빠른실행모드 상태에 따라 팝업 설정 업데이트
async function updatePopupBehavior() {
  const result = await chrome.storage.local.get(["quickMode"]);
  const isQuickMode = result.quickMode || false;

  if (isQuickMode) {
    // 빠른실행모드: 팝업 제거하여 onClicked 이벤트 발생
    await chrome.action.setPopup({ popup: "" });
    console.log("빠른실행모드 활성화 - 팝업 비활성화");
  } else {
    // 일반 모드: 팝업 설정
    await chrome.action.setPopup({ popup: "popup.html" });
    console.log("일반 모드 - 팝업 활성화");
  }
}

// 확장 프로그램 아이콘 클릭 이벤트 (빠른실행모드 전용)
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // 사용자 정보 확인
    const result = await chrome.storage.local.get(["currentUser"]);
    const currentUser = result.currentUser;

    if (!currentUser) {
      console.log("빠른실행모드: 로그인 필요 - 대시보드로 이동");
      chrome.notifications.create({
        type: "basic",
        iconUrl: "public/bookmark.png",
        title: "로그인 필요",
        message: "북마크를 저장하려면 먼저 로그인하세요.",
        priority: 2,
      });
      await openDashboard();

      return;
    }

    console.log("⚡ 빠른 저장 시작...");

    // 현재 탭 정보
    const bookmarkData = {
      userId: currentUser.uid,
      title: tab.title || tab.url,
      url: tab.url,
      description: "",
      collectionId: null,
      tags: [],
      favIconUrl: tab.favIconUrl || "",
      order: Date.now(),
    };

    // offscreen 설정 및 저장
    await setupOffscreen();
    const saveResult = await sendMessageToOffscreen({
      target: "offscreen",
      type: "SAVE_BOOKMARK",
      bookmarkData: bookmarkData,
    });

    if (saveResult?.type === "BOOKMARK_SAVED") {
      // 아이콘에 체크 표시
      chrome.action.setBadgeText({ text: "✓", tabId: tab.id });
      chrome.action.setBadgeBackgroundColor({
        color: "#10b981",
        tabId: tab.id,
      });

      // 성공 알림
      chrome.notifications.create({
        type: "basic",
        iconUrl: "public/bookmark.png",
        title: "⚡ 빠른 저장 완료",
        message: `"${tab.title}" 북마크가 저장되었습니다.`,
        priority: 2,
      });
      console.log("빠른 저장 완료:", saveResult.bookmarkId);

      // 3초 후 체크 표시 제거
      setTimeout(() => {
        chrome.action.setBadgeText({ text: "", tabId: tab.id });
      }, 3000);
    } else {
      // 아이콘에 실패 표시
      chrome.action.setBadgeText({ text: "✕", tabId: tab.id });
      chrome.action.setBadgeBackgroundColor({
        color: "#ef4444",
        tabId: tab.id,
      });

      // 실패 알림
      chrome.notifications.create({
        type: "basic",
        iconUrl: "public/bookmark.png",
        title: "❌ 저장 실패",
        message: saveResult?.message || "북마크 저장에 실패했습니다.",
        priority: 2,
      });
      console.error("빠른 저장 실패:", saveResult);

      // 3초 후 제거
      setTimeout(() => {
        chrome.action.setBadgeText({ text: "", tabId: tab.id });
      }, 3000);
    }
  } catch (error) {
    console.error("빠른 저장 중 오류:", error);

    // 아이콘에 오류 표시
    chrome.action.setBadgeText({ text: "✕", tabId: tab.id });
    chrome.action.setBadgeBackgroundColor({ color: "#ef4444", tabId: tab.id });

    chrome.notifications.create({
      type: "basic",
      iconUrl: "public/bookmark.png",
      title: "❌ 오류 발생",
      message: "북마크 저장 중 오류가 발생했습니다.",
      priority: 2,
    });

    // 3초 후 제거
    setTimeout(() => {
      chrome.action.setBadgeText({ text: "", tabId: tab.id });
    }, 3000);
  }
});

// storage 변경 감지하여 팝업 동작 업데이트
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local" && changes.quickMode) {
    console.log("빠른실행모드 변경 감지:", changes.quickMode.newValue);
    updatePopupBehavior();
  }
});

// 확장 프로그램 시작 시 팝업 동작 초기화
updatePopupBehavior();
