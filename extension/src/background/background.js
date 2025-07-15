const OFFSCREEN_DOCUMENT_PATH = chrome.runtime.getURL("offscreen.html");
const FIREBASE_HOSTING_URL = "https://bookmarkhub-5ea6c.web.app";

console.log("Offscreen document path:", OFFSCREEN_DOCUMENT_PATH);

let creatingOffscreenDocument;
let offscreenDocumentReady = false;

async function hasOffscreenDocument() {
  try {
    const matchedClients = await clients.matchAll();
    const hasOffscreen = matchedClients.some((client) =>
      client.url.includes("offscreen.html")
    );
    console.log("Checking for offscreen document:", hasOffscreen);
    console.log(
      "Matched clients:",
      matchedClients.map((c) => c.url)
    );
    return hasOffscreen;
  } catch (error) {
    console.error("Error checking for offscreen document:", error);
    return false;
  }
}

async function setupOffscreenDocument() {
  console.log("Setting up offscreen document...");

  try {
    if (await hasOffscreenDocument()) {
      console.log("Offscreen document already exists");
      // 기존 offscreen document가 있으면 준비 상태 확인
      if (!offscreenDocumentReady) {
        console.log("Waiting for existing offscreen document to be ready...");
        await waitForOffscreenReady();
      }
      return;
    }

    if (creatingOffscreenDocument) {
      console.log(
        "Offscreen document creation already in progress, waiting..."
      );
      await creatingOffscreenDocument;
      // 생성 완료 후 준비 상태 확인
      if (!offscreenDocumentReady) {
        console.log(
          "Waiting for newly created offscreen document to be ready..."
        );
        await waitForOffscreenReady();
      }
    } else {
      console.log("Creating new offscreen document...");
      console.log("Document URL:", OFFSCREEN_DOCUMENT_PATH);

      creatingOffscreenDocument = chrome.offscreen.createDocument({
        url: OFFSCREEN_DOCUMENT_PATH,
        reasons: [chrome.offscreen.Reason.DOM_SCRAPING],
        justification: "Firebase Authentication",
      });

      await creatingOffscreenDocument;
      creatingOffscreenDocument = null;
      console.log("Offscreen document created successfully");

      // 새로 생성된 offscreen document가 준비될 때까지 대기
      console.log(
        "Waiting for newly created offscreen document to be ready..."
      );
      await waitForOffscreenReady();
    }
  } catch (error) {
    console.error("Error setting up offscreen document:", error);
    throw error;
  }
}

// offscreen document가 준비될 때까지 대기하는 함수
async function waitForOffscreenReady() {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      console.error("Timeout waiting for offscreen document to be ready");
      reject(new Error("Offscreen document 준비 시간 초과"));
    }, 10000);

    const checkReady = () => {
      chrome.runtime.sendMessage(
        { action: "ping", target: "offscreen" },
        (response) => {
          if (chrome.runtime.lastError) {
            console.log("Offscreen not ready yet, retrying...");
            setTimeout(checkReady, 500);
          } else if (response && response.ready) {
            console.log("Offscreen document is ready");
            offscreenDocumentReady = true;
            clearTimeout(timeoutId);
            resolve();
          } else {
            console.log("Offscreen not ready yet, retrying...");
            setTimeout(checkReady, 500);
          }
        }
      );
    };

    checkReady();
  });
}

async function getAuthFromOffscreen() {
  console.log("Getting auth from offscreen...");

  try {
    await setupOffscreenDocument();
  } catch (error) {
    console.error("Failed to setup offscreen document:", error);
    throw new Error("Offscreen 문서 설정에 실패했습니다: " + error.message);
  }

  return new Promise((resolve, reject) => {
    console.log("Sending getAuth request to offscreen");

    // 타임아웃 설정
    const timeoutId = setTimeout(() => {
      console.error("Timeout waiting for offscreen response");
      reject(new Error("Offscreen 응답 대기 시간 초과"));
    }, 30000);

    chrome.runtime.sendMessage(
      { action: "getAuth", target: "offscreen" },
      (response) => {
        clearTimeout(timeoutId);
        console.log("Background received response from offscreen:", response);

        if (chrome.runtime.lastError) {
          console.error("Runtime error:", chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (!response) {
          console.error("No response received from offscreen");
          reject(new Error("offscreen에서 응답을 받지 못했습니다."));
          return;
        }

        if (response.error) {
          console.error("Auth error from offscreen:", response.error);
          reject(new Error(response.error));
        } else if (response.user) {
          console.log("Auth success from offscreen:", response.user);
          resolve(response.user);
        } else {
          console.error("Invalid response format from offscreen:", response);
          reject(new Error("인증 응답이 올바르지 않습니다."));
        }
      }
    );
  });
}

async function saveBookmarkToFirebase(bookmarkData) {
  console.log("Saving bookmark to Firebase:", bookmarkData);

  try {
    await setupOffscreenDocument();
  } catch (error) {
    console.error(
      "Failed to setup offscreen document for bookmark save:",
      error
    );
    throw new Error("Offscreen 문서 설정에 실패했습니다: " + error.message);
  }

  return new Promise((resolve, reject) => {
    console.log("Sending saveBookmark request to offscreen");

    // 타임아웃 설정
    const timeoutId = setTimeout(() => {
      console.error("Timeout waiting for offscreen response");
      reject(new Error("Offscreen 응답 대기 시간 초과"));
    }, 60000);

    chrome.runtime.sendMessage(
      { action: "saveBookmark", target: "offscreen", bookmark: bookmarkData },
      (response) => {
        clearTimeout(timeoutId);
        console.log(
          "Background received bookmark save response from offscreen:",
          response
        );

        if (chrome.runtime.lastError) {
          console.error("Runtime error:", chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (!response) {
          console.error("No response received from offscreen");
          reject(new Error("offscreen에서 응답을 받지 못했습니다."));
          return;
        }

        if (response.error) {
          console.error("Bookmark save error from offscreen:", response.error);
          reject(new Error(response.error));
        } else if (response.success) {
          console.log("Bookmark saved successfully from offscreen:", response);
          resolve(response.bookmark);
        } else {
          console.error("Invalid response format from offscreen:", response);
          reject(new Error("북마크 저장 응답이 올바르지 않습니다."));
        }
      }
    );
  });
}

async function getCollectionsFromFirebase(userId) {
  console.log("Getting collections from Firebase for user:", userId);

  try {
    await setupOffscreenDocument();
  } catch (error) {
    console.error(
      "Failed to setup offscreen document for collections fetch:",
      error
    );
    throw new Error("Offscreen 문서 설정에 실패했습니다: " + error.message);
  }

  return new Promise((resolve, reject) => {
    console.log("Sending getCollections request to offscreen");

    // 타임아웃 설정
    const timeoutId = setTimeout(() => {
      console.error("Timeout waiting for offscreen response");
      reject(new Error("Offscreen 응답 대기 시간 초과"));
    }, 30000);

    chrome.runtime.sendMessage(
      { action: "getCollections", target: "offscreen", userId: userId },
      (response) => {
        clearTimeout(timeoutId);
        console.log(
          "Background received collections response from offscreen:",
          response
        );

        if (chrome.runtime.lastError) {
          console.error("Runtime error:", chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (!response) {
          console.error("No response received from offscreen");
          reject(new Error("offscreen에서 응답을 받지 못했습니다."));
          return;
        }

        if (response.error) {
          console.error(
            "Collections fetch error from offscreen:",
            response.error
          );
          reject(new Error(response.error));
        } else if (response.collections) {
          console.log(
            "Collections fetched successfully from offscreen:",
            response.collections
          );
          resolve(response.collections);
        } else {
          console.error("Invalid response format from offscreen:", response);
          reject(new Error("컬렉션 응답이 올바르지 않습니다."));
        }
      }
    );
  });
}

async function createDefaultCollectionsInFirebase(userId) {
  console.log("Creating default collections in Firebase for user:", userId);

  try {
    await setupOffscreenDocument();
  } catch (error) {
    console.error(
      "Failed to setup offscreen document for default collections creation:",
      error
    );
    throw new Error("Offscreen 문서 설정에 실패했습니다: " + error.message);
  }

  return new Promise((resolve, reject) => {
    console.log("Sending createDefaultCollections request to offscreen");

    // 타임아웃 설정
    const timeoutId = setTimeout(() => {
      console.error("Timeout waiting for offscreen response");
      reject(new Error("Offscreen 응답 대기 시간 초과"));
    }, 30000);

    chrome.runtime.sendMessage(
      {
        action: "createDefaultCollections",
        target: "offscreen",
        userId: userId,
      },
      (response) => {
        clearTimeout(timeoutId);
        console.log(
          "Background received createDefaultCollections response from offscreen:",
          response
        );

        if (chrome.runtime.lastError) {
          console.error("Runtime error:", chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (!response) {
          console.error("No response received from offscreen");
          reject(new Error("offscreen에서 응답을 받지 못했습니다."));
          return;
        }

        if (response.error) {
          console.error(
            "Create default collections error from offscreen:",
            response.error
          );
          reject(new Error(response.error));
        } else if (response.success) {
          console.log(
            "Default collections created successfully from offscreen:",
            response
          );
          resolve(response);
        } else {
          console.error("Invalid response format from offscreen:", response);
          reject(new Error("기본 컬렉션 생성 응답이 올바르지 않습니다."));
        }
      }
    );
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message);

  if (message.action === "signIn") {
    console.log("Background received signIn request");

    getAuthFromOffscreen()
      .then((user) => {
        console.log("Authentication successful, storing user data:", user);

        // 사용자 데이터를 storage에 저장
        chrome.storage.local.set({ user: user }, () => {
          if (chrome.runtime.lastError) {
            console.error("Error storing user data:", chrome.runtime.lastError);
            sendResponse({
              error: "사용자 데이터 저장 중 오류가 발생했습니다.",
            });
          } else {
            console.log("User data stored successfully");
            sendResponse({ user: user });
          }
        });
      })
      .catch((error) => {
        console.error("Authentication error:", error);

        // 오류 객체를 올바르게 처리
        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === "string"
            ? error
            : error?.message || "알 수 없는 인증 오류가 발생했습니다.";

        console.log("Sending error response:", errorMessage);
        sendResponse({ error: errorMessage });
      });

    return true; // Indicates we will send a response asynchronously
  } else if (message.action === "signOut") {
    console.log("Background received signOut request");

    chrome.storage.local.remove("user", () => {
      if (chrome.runtime.lastError) {
        console.error("Error removing user data:", chrome.runtime.lastError);
        sendResponse({ error: "로그아웃 중 오류가 발생했습니다." });
      } else {
        console.log("User data removed successfully");
        sendResponse({ success: true });
      }
    });

    return true; // Indicates we will send a response asynchronously
  } else if (message.action === "saveBookmark") {
    console.log("Background received saveBookmark request");

    // offscreen 문서를 통해 북마크 저장
    saveBookmarkToFirebase(message.bookmark)
      .then((result) => {
        console.log("Bookmark saved successfully:", result);
        sendResponse({ success: true, bookmark: result });
      })
      .catch((error) => {
        console.error("Error saving bookmark:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === "string"
            ? error
            : error?.message || "북마크 저장 중 오류가 발생했습니다.";

        sendResponse({ error: errorMessage });
      });

    return true; // Indicates we will send a response asynchronously
  } else if (message.action === "getCollections") {
    console.log("Background received getCollections request");

    // offscreen 문서를 통해 컬렉션 가져오기
    getCollectionsFromFirebase(message.userId)
      .then((collections) => {
        console.log("Collections fetched successfully:", collections);
        sendResponse({ success: true, collections: collections });
      })
      .catch((error) => {
        console.error("Error fetching collections:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === "string"
            ? error
            : error?.message || "컬렉션 가져오기 중 오류가 발생했습니다.";

        sendResponse({ error: errorMessage });
      });

    return true; // Indicates we will send a response asynchronously
  } else if (message.action === "createDefaultCollections") {
    console.log("Background received createDefaultCollections request");

    // offscreen 문서를 통해 기본 컬렉션 생성
    createDefaultCollectionsInFirebase(message.userId)
      .then((result) => {
        console.log("Default collections created successfully:", result);
        sendResponse({ success: true, result: result });
      })
      .catch((error) => {
        console.error("Error creating default collections:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === "string"
            ? error
            : error?.message || "기본 컬렉션 생성 중 오류가 발생했습니다.";

        sendResponse({ error: errorMessage });
      });

    return true; // Indicates we will send a response asynchronously
  }
});

// 아이콘 클릭 이벤트 처리 (빠른 실행 모드)
chrome.action.onClicked.addListener(async (tab) => {
  console.log("Extension icon clicked");

  try {
    // 빠른 실행 모드 상태와 사용자 정보 확인
    const result = await chrome.storage.local.get(["quickMode", "user"]);

    if (result.quickMode && result.user) {
      console.log("빠른 실행 모드로 북마크 저장 시작");

      const bookmarkData = {
        title: tab.title,
        description: "",
        url: tab.url,
        pageTitle: tab.title,
        userId: result.user.uid,
        collection: "", // 컬렉션 없음 (0번째)
        tags: [],
        createdAt: new Date().toISOString(),
      };

      // 북마크 저장
      try {
        await saveBookmarkToFirebase(bookmarkData);
        console.log("빠른 실행으로 북마크 저장 성공");

        // 성공 알림 (배지 표시)
        chrome.action.setBadgeText({ text: "✓" });
        chrome.action.setBadgeBackgroundColor({ color: "#10b981" });

        // 2초 후 배지 지우기
        setTimeout(() => {
          chrome.action.setBadgeText({ text: "" });
        }, 2000);
      } catch (error) {
        console.error("빠른 실행 북마크 저장 실패:", error);

        // 실패 알림 (배지 표시)
        chrome.action.setBadgeText({ text: "✗" });
        chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });

        // 2초 후 배지 지우기
        setTimeout(() => {
          chrome.action.setBadgeText({ text: "" });
        }, 2000);
      }
    } else {
      // 빠른 실행 모드가 아니거나 로그인하지 않은 경우 팝업 열기
      console.log("일반 모드 - 팝업 열기");
      chrome.action.setPopup({ popup: "popup.html" });

      // 팝업을 다시 열도록 요청
      // 사용자가 다시 클릭해야 하므로 안내 메시지 표시
      chrome.action.setBadgeText({ text: "📋" });
      chrome.action.setBadgeBackgroundColor({ color: "#6366f1" });

      // 3초 후 배지 지우기
      setTimeout(() => {
        chrome.action.setBadgeText({ text: "" });
      }, 3000);
    }
  } catch (error) {
    console.error("아이콘 클릭 처리 중 오류:", error);
  }
});

// 컨텍스트 메뉴 등록
chrome.runtime.onInstalled.addListener(async () => {
  // 빠른 실행 모드 상태 확인
  const result = await chrome.storage.local.get(["quickMode"]);
  const isQuickMode = result.quickMode || false;

  chrome.contextMenus.create({
    id: "toggle-quick-mode",
    title: isQuickMode
      ? "⚡ 빠른 실행 모드 비활성화"
      : "⚡ 빠른 실행 모드 활성화",
    contexts: ["action"],
  });

  chrome.contextMenus.create({
    id: "separator",
    type: "separator",
    contexts: ["action"],
  });

  chrome.contextMenus.create({
    id: "open-dashboard",
    title: "📊 대시보드 열기",
    contexts: ["action"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "open-dashboard") {
    chrome.tabs.create({ url: "https://bookmarkhub-5ea6c-dashboard.web.app/" });
  } else if (info.menuItemId === "toggle-quick-mode") {
    await toggleQuickMode();
  }
});

// 빠른 실행 모드 토글 함수
async function toggleQuickMode() {
  try {
    // 현재 빠른 실행 모드 상태 가져오기
    const result = await chrome.storage.local.get(["quickMode"]);
    const currentQuickMode = result.quickMode || false;
    const newQuickMode = !currentQuickMode;

    // 새로운 상태 저장
    await chrome.storage.local.set({ quickMode: newQuickMode });

    // 컨텍스트 메뉴 제목 업데이트
    await updateContextMenuTitle(newQuickMode);

    // 팝업 설정 업데이트
    if (newQuickMode) {
      chrome.action.setPopup({ popup: "" });
      // 성공 배지 표시
      chrome.action.setBadgeText({ text: "⚡" });
      chrome.action.setBadgeBackgroundColor({ color: "#10b981" });
    } else {
      chrome.action.setPopup({ popup: "popup.html" });
      // 일반 모드 배지 표시
      chrome.action.setBadgeText({ text: "📋" });
      chrome.action.setBadgeBackgroundColor({ color: "#6366f1" });
    }

    // 2초 후 배지 지우기
    setTimeout(() => {
      chrome.action.setBadgeText({ text: "" });
    }, 2000);

    console.log(
      `빠른 실행 모드가 ${newQuickMode ? "활성화" : "비활성화"}되었습니다.`
    );
  } catch (error) {
    console.error("빠른 실행 모드 토글 중 오류:", error);
  }
}

// 컨텍스트 메뉴 제목 업데이트 함수
async function updateContextMenuTitle(isQuickMode) {
  try {
    await chrome.contextMenus.update("toggle-quick-mode", {
      title: isQuickMode
        ? "⚡ 빠른 실행 모드 비활성화"
        : "⚡ 빠른 실행 모드 활성화",
    });
  } catch (error) {
    console.error("컨텍스트 메뉴 제목 업데이트 중 오류:", error);
  }
}

// 초기화 시 빠른 실행 모드 상태에 따라 팝업 설정
async function initializeExtension() {
  try {
    const result = await chrome.storage.local.get(["quickMode"]);
    const isQuickMode = result.quickMode || false;

    if (isQuickMode) {
      // 빠른 실행 모드가 활성화되어 있으면 팝업 제거
      chrome.action.setPopup({ popup: "" });
    } else {
      // 빠른 실행 모드가 비활성화되어 있으면 팝업 설정
      chrome.action.setPopup({ popup: "popup.html" });
    }

    // 컨텍스트 메뉴 제목 업데이트 (약간의 지연 후)
    setTimeout(async () => {
      await updateContextMenuTitle(isQuickMode);
    }, 100);
  } catch (error) {
    console.error("확장 프로그램 초기화 중 오류:", error);
  }
}

// storage 변경 이벤트 리스너 - 빠른 실행 모드 상태 변경 감지
chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === "local" && changes.quickMode) {
    console.log("빠른 실행 모드 상태 변경:", changes.quickMode.newValue);
    const newQuickMode = changes.quickMode.newValue;

    // 팝업 설정 업데이트
    if (newQuickMode) {
      // 빠른 실행 모드 활성화 시 팝업 제거
      chrome.action.setPopup({ popup: "" });
    } else {
      // 빠른 실행 모드 비활성화 시 팝업 설정
      chrome.action.setPopup({ popup: "popup.html" });
    }

    // 컨텍스트 메뉴 제목 업데이트
    await updateContextMenuTitle(newQuickMode);
  }
});

// 확장 프로그램 초기화
initializeExtension();

console.log("Background script loaded");
