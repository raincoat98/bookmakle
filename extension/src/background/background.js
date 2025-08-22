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

// Firebase에서 컬렉션 생성
async function createCollectionInFirebase(collectionData) {
  console.log("Creating collection in Firebase:", collectionData);

  try {
    await setupOffscreenDocument();
  } catch (error) {
    console.error(
      "Failed to setup offscreen document for collection creation:",
      error
    );
    throw new Error("Offscreen 문서 설정에 실패했습니다: " + error.message);
  }

  return new Promise((resolve, reject) => {
    console.log("Sending createCollection request to offscreen");

    // 타임아웃 설정
    const timeoutId = setTimeout(() => {
      console.error("Timeout waiting for offscreen response");
      reject(new Error("Offscreen 응답 대기 시간 초과"));
    }, 30000);

    chrome.runtime.sendMessage(
      {
        action: "createCollection",
        target: "offscreen",
        collection: collectionData,
      },
      (response) => {
        clearTimeout(timeoutId);
        console.log(
          "Background received createCollection response from offscreen:",
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
            "Collection creation error from offscreen:",
            response.error
          );
          reject(new Error(response.error));
        } else if (response.collection) {
          console.log(
            "Collection created successfully from offscreen:",
            response.collection
          );
          resolve(response.collection);
        } else {
          console.error("Invalid response format from offscreen:", response);
          reject(new Error("컬렉션 생성 응답이 올바르지 않습니다."));
        }
      }
    );
  });
}

async function getSignOutFromOffscreen() {
  console.log("Getting sign out from offscreen...");

  try {
    await setupOffscreenDocument();
  } catch (error) {
    console.error("Failed to setup offscreen document:", error);
    throw new Error("Offscreen 문서 설정에 실패했습니다: " + error.message);
  }

  return new Promise((resolve, reject) => {
    console.log("Sending signOut request to offscreen");

    // 타임아웃 설정
    const timeoutId = setTimeout(() => {
      console.error("Timeout waiting for offscreen response");
      reject(new Error("Offscreen 응답 대기 시간 초과"));
    }, 15000);

    chrome.runtime.sendMessage(
      { action: "signOut", target: "offscreen" },
      (response) => {
        clearTimeout(timeoutId);
        console.log(
          "Background received signOut response from offscreen:",
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
          console.error("Sign out error from offscreen:", response.error);
          reject(new Error(response.error));
        } else if (response.success) {
          console.log("Sign out successful from offscreen:", response);
          resolve(response);
        } else {
          console.error("Invalid response format from offscreen:", response);
          reject(new Error("로그아웃 응답이 올바르지 않습니다."));
        }
      }
    );
  });
}

// Firebase 호스팅에서 로그아웃
async function signOutFromFirebaseHosting() {
  console.log("Signing out from Firebase hosting...");

  try {
    // Firebase 호스팅 탭 찾기
    const tabs = await chrome.tabs.query({
      url: "https://bookmarkhub-5ea6c.web.app/*",
    });

    if (tabs.length === 0) {
      console.log(
        "No Firebase hosting tabs found, creating new tab for signout"
      );

      // Firebase 호스팅 탭을 새로 열어서 로그아웃 처리
      try {
        const newTab = await chrome.tabs.create({
          url: "https://bookmarkhub-5ea6c.web.app/",
          active: false, // 백그라운드에서 열기
        });

        console.log("Created new Firebase hosting tab for signout:", newTab.id);

        // 새 탭이 로드될 때까지 대기
        await new Promise((resolve) => {
          chrome.tabs.onUpdated.addListener(function listener(
            tabId,
            changeInfo
          ) {
            if (tabId === newTab.id && changeInfo.status === "complete") {
              chrome.tabs.onUpdated.removeListener(listener);
              resolve();
            }
          });
        });

        // 새로 생성된 탭에서 로그아웃 스크립트 실행
        return new Promise((resolve) => {
          chrome.scripting.executeScript(
            {
              target: { tabId: newTab.id },
              func: () => {
                try {
                  console.log("Starting Firebase Auth signout in new tab...");

                  // Firebase Auth 객체 찾기 (여러 방법 시도)
                  let auth = null;

                  // 1. 전역 변수에서 찾기
                  if (window.auth) {
                    auth = window.auth;
                    console.log("Found auth from window.auth");
                  }
                  // 2. Firebase 모듈에서 찾기
                  else if (window.firebase && window.firebase.auth) {
                    auth = window.firebase.auth();
                    console.log("Found auth from window.firebase.auth()");
                  }
                  // 3. 모듈 스코프에서 찾기 (Firebase v9+)
                  else if (typeof getAuth === "function") {
                    auth = getAuth();
                    console.log("Found auth from getAuth()");
                  }

                  if (auth) {
                    console.log("Firebase Auth found, signing out...");
                    return auth
                      .signOut()
                      .then(() => {
                        console.log("Firebase Auth signout successful");
                        // localStorage 정리
                        const keysToRemove = [];
                        for (let i = 0; i < localStorage.length; i++) {
                          const key = localStorage.key(i);
                          if (
                            key &&
                            (key.includes("firebase:authUser:") ||
                              key.includes("extensionLoginSuccess"))
                          ) {
                            keysToRemove.push(key);
                          }
                        }
                        keysToRemove.forEach((key) =>
                          localStorage.removeItem(key)
                        );
                        console.log("localStorage cleaned after signout");
                        return Promise.resolve();
                      })
                      .catch((error) => {
                        console.error("Firebase Auth signout error:", error);
                        // 에러가 발생해도 localStorage 정리
                        const keysToRemove = [];
                        for (let i = 0; i < localStorage.length; i++) {
                          const key = localStorage.key(i);
                          if (
                            key &&
                            (key.includes("firebase:authUser:") ||
                              key.includes("extensionLoginSuccess"))
                          ) {
                            keysToRemove.push(key);
                          }
                        }
                        keysToRemove.forEach((key) =>
                          localStorage.removeItem(key)
                        );
                        return Promise.resolve();
                      });
                  } else {
                    console.log(
                      "Firebase Auth not found, cleaning localStorage only..."
                    );
                    // localStorage에서 로그인 상태 제거
                    const keysToRemove = [];
                    for (let i = 0; i < localStorage.length; i++) {
                      const key = localStorage.key(i);
                      if (
                        key &&
                        (key.includes("firebase:authUser:") ||
                          key.includes("extensionLoginSuccess"))
                      ) {
                        keysToRemove.push(key);
                      }
                    }
                    keysToRemove.forEach((key) => localStorage.removeItem(key));
                    console.log("localStorage cleaned (no auth found)");
                    return Promise.resolve();
                  }
                } catch (error) {
                  console.error("Error during signout in new tab:", error);
                  // 에러가 발생해도 localStorage 정리
                  const keysToRemove = [];
                  for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (
                      key &&
                      (key.includes("firebase:authUser:") ||
                        key.includes("extensionLoginSuccess"))
                    ) {
                      keysToRemove.push(key);
                    }
                  }
                  keysToRemove.forEach((key) => localStorage.removeItem(key));
                  console.log("localStorage cleaned after error");
                  return Promise.resolve();
                }
              },
            },
            (results) => {
              if (chrome.runtime.lastError) {
                console.log(
                  "Script execution error in new tab (non-critical):",
                  chrome.runtime.lastError
                );
              } else {
                console.log("Firebase hosting signout completed in new tab");
              }

              // 탭 닫기
              chrome.tabs.remove(newTab.id);
              resolve();
            }
          );
        });
      } catch (error) {
        console.error("Error creating new tab for signout:", error);
        return Promise.resolve();
      }
    }

    // 모든 Firebase 호스팅 탭에서 로그아웃 시도
    const signoutPromises = tabs.map(async (tab) => {
      console.log("Executing signout script in Firebase hosting tab:", tab.id);

      return new Promise((resolve) => {
        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            func: () => {
              try {
                console.log(
                  "Starting Firebase Auth signout in existing tab..."
                );

                // Firebase Auth 객체 찾기 (여러 방법 시도)
                let auth = null;

                // 1. 전역 변수에서 찾기
                if (window.auth) {
                  auth = window.auth;
                  console.log("Found auth from window.auth");
                }
                // 2. Firebase 모듈에서 찾기
                else if (window.firebase && window.firebase.auth) {
                  auth = window.firebase.auth();
                  console.log("Found auth from window.firebase.auth()");
                }
                // 3. 모듈 스코프에서 찾기 (Firebase v9+)
                else if (typeof getAuth === "function") {
                  auth = getAuth();
                  console.log("Found auth from getAuth()");
                }

                if (auth) {
                  console.log("Firebase Auth found, signing out...");
                  return auth
                    .signOut()
                    .then(() => {
                      console.log("Firebase Auth signout successful");
                      // localStorage 정리
                      const keysToRemove = [];
                      for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (
                          key &&
                          (key.includes("firebase:authUser:") ||
                            key.includes("extensionLoginSuccess"))
                        ) {
                          keysToRemove.push(key);
                        }
                      }
                      keysToRemove.forEach((key) =>
                        localStorage.removeItem(key)
                      );
                      console.log("localStorage cleaned after signout");
                      return Promise.resolve();
                    })
                    .catch((error) => {
                      console.error("Firebase Auth signout error:", error);
                      // 에러가 발생해도 localStorage 정리
                      const keysToRemove = [];
                      for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (
                          key &&
                          (key.includes("firebase:authUser:") ||
                            key.includes("extensionLoginSuccess"))
                        ) {
                          keysToRemove.push(key);
                        }
                      }
                      keysToRemove.forEach((key) =>
                        localStorage.removeItem(key)
                      );
                      return Promise.resolve();
                    });
                } else {
                  console.log(
                    "Firebase Auth not found, cleaning localStorage only..."
                  );
                  // localStorage에서 로그인 상태 제거
                  const keysToRemove = [];
                  for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (
                      key &&
                      (key.includes("firebase:authUser:") ||
                        key.includes("extensionLoginSuccess"))
                    ) {
                      keysToRemove.push(key);
                    }
                  }
                  keysToRemove.forEach((key) => localStorage.removeItem(key));
                  console.log("localStorage cleaned (no auth found)");
                  return Promise.resolve();
                }
              } catch (error) {
                console.error("Error during signout:", error);
                // 에러가 발생해도 localStorage 정리
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                  const key = localStorage.key(i);
                  if (
                    key &&
                    (key.includes("firebase:authUser:") ||
                      key.includes("extensionLoginSuccess"))
                  ) {
                    keysToRemove.push(key);
                  }
                }
                keysToRemove.forEach((key) => localStorage.removeItem(key));
                console.log("localStorage cleaned after error");
                return Promise.resolve();
              }
            },
          },
          (results) => {
            if (chrome.runtime.lastError) {
              console.log(
                "Script execution error (non-critical):",
                chrome.runtime.lastError
              );
              resolve(); // 오류가 있어도 resolve (치명적이지 않음)
            } else {
              console.log(
                "Firebase hosting signout completed for tab:",
                tab.id
              );
              resolve();
            }
          }
        );
      });
    });

    // 모든 탭에서 로그아웃 완료 대기
    await Promise.allSettled(signoutPromises);
    console.log("Firebase hosting signout completed for all tabs");
  } catch (error) {
    console.error("Error during Firebase hosting signout:", error);
    // 오류가 발생해도 Promise.resolve() (치명적이지 않음)
    return Promise.resolve();
  }
}

// Firebase 호스팅에서 온 로그인 성공 메시지 처리
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message);

  // Firebase 호스팅에서 온 로그인 성공 메시지 처리
  if (message.action === "loginSuccess" && message.user) {
    console.log("Firebase 호스팅에서 로그인 성공 메시지 수신:", message.user);

    // 사용자 데이터를 storage에 저장
    chrome.storage.local.set({ user: message.user }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error storing user data:", chrome.runtime.lastError);
      } else {
        console.log("User data stored successfully from Firebase hosting");

        // 팝업에 알림 (팝업이 열려있는 경우)
        try {
          chrome.runtime.sendMessage(
            {
              action: "loginSuccessFromHosting",
              user: message.user,
            },
            (response) => {
              if (chrome.runtime.lastError) {
                // 팝업이 닫혀있거나 수신자가 없는 경우 무시
                console.log(
                  "Popup is closed or receiver not available:",
                  chrome.runtime.lastError.message
                );
              } else {
                console.log("Message sent to popup successfully");
              }
            }
          );
        } catch (error) {
          console.log("Failed to send message to popup:", error);
        }
      }
    });

    sendResponse({ success: true });
    return true;
  }

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

    // 로그아웃 처리 함수
    async function performSignOut() {
      try {
        // 1. Firebase 호스팅에서 로그아웃 시도
        console.log("Attempting Firebase hosting signout...");
        await signOutFromFirebaseHosting();
        console.log("Firebase hosting signout successful");
      } catch (error) {
        console.log("Firebase hosting signout failed (non-critical):", error);
        // Firebase 호스팅 로그아웃 실패는 치명적이지 않음
      }

      try {
        // 2. 로컬 스토리지에서 사용자 데이터 제거
        console.log("Removing local user data...");
        await new Promise((resolve, reject) => {
          chrome.storage.local.remove("user", () => {
            if (chrome.runtime.lastError) {
              console.error(
                "Error removing user data:",
                chrome.runtime.lastError
              );
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              console.log("User data removed successfully");
              resolve();
            }
          });
        });

        // 3. Firebase 호스팅 탭들 닫기
        try {
          const tabsToClose = await chrome.tabs.query({
            url: "https://bookmarkhub-5ea6c.web.app/*",
          });

          if (tabsToClose.length > 0) {
            console.log(
              `Closing ${tabsToClose.length} Firebase hosting tabs after signout`
            );
            const tabIds = tabsToClose.map((tab) => tab.id);
            await chrome.tabs.remove(tabIds);
            console.log("All Firebase hosting tabs closed after signout");
          }
        } catch (error) {
          console.error("Error closing Firebase hosting tabs:", error);
        }

        // 4. 성공 배지 표시
        chrome.action.setBadgeText({ text: "✓" });
        chrome.action.setBadgeBackgroundColor({ color: "#10b981" });
        setTimeout(() => {
          chrome.action.setBadgeText({ text: "" });
        }, 3000);

        // 5. 성공 응답
        sendResponse({ success: true });
        console.log("Signout completed successfully");
      } catch (error) {
        console.error("Error during local signout:", error);
        sendResponse({
          error: "로그아웃 중 오류가 발생했습니다: " + error.message,
        });
      }
    }

    // 로그아웃 실행
    performSignOut();

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
  } else if (message.action === "createCollection") {
    console.log("Background received createCollection request");
    createCollectionInFirebase(message.collection)
      .then((collection) => {
        console.log("Collection created successfully:", collection);
        sendResponse({ success: true, collection: collection });
      })
      .catch((error) => {
        console.error("Error creating collection:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === "string"
            ? error
            : error?.message || "컬렉션 생성 중 오류가 발생했습니다.";

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

// Firebase 호스팅 로그인 성공 감지 - 탭 변경 이벤트 리스너
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 탭이 완전히 로드되고 Firebase 호스팅 URL인 경우
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    tab.url.includes("bookmarkhub-5ea6c.web.app")
  ) {
    console.log("Firebase 호스팅 탭 업데이트 감지:", tab.url);

    // Firebase 호스팅 URL에서만 localStorage 확인
    if (tab.url.startsWith("https://bookmarkhub-5ea6c.web.app/")) {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabId },
          func: () => {
            try {
              const loginData = localStorage.getItem("extensionLoginSuccess");
              if (loginData) {
                const data = JSON.parse(loginData);
                console.log("localStorage에서 로그인 데이터 발견:", data);

                // localStorage 클리어
                localStorage.removeItem("extensionLoginSuccess");

                // 메시지 전달
                return data;
              }
            } catch (error) {
              console.error("localStorage 확인 중 오류:", error);
            }
            return null;
          },
        },
        (results) => {
          if (results && results[0] && results[0].result) {
            const loginData = results[0].result;
            console.log("localStorage에서 로그인 성공 데이터 수신:", loginData);

            if (loginData.action === "loginSuccess" && loginData.user) {
              // 사용자 데이터를 storage에 저장
              chrome.storage.local.set({ user: loginData.user }, () => {
                if (chrome.runtime.lastError) {
                  console.error(
                    "Error storing user data:",
                    chrome.runtime.lastError
                  );
                } else {
                  console.log(
                    "User data stored successfully from localStorage"
                  );

                  // 팝업에 알림 (팝업이 열려있는 경우)
                  try {
                    chrome.runtime.sendMessage(
                      {
                        action: "loginSuccessFromHosting",
                        user: loginData.user,
                      },
                      (response) => {
                        if (chrome.runtime.lastError) {
                          console.log(
                            "Popup is closed or receiver not available:",
                            chrome.runtime.lastError.message
                          );
                        } else {
                          console.log("Message sent to popup successfully");
                        }
                      }
                    );
                  } catch (error) {
                    console.log("Failed to send message to popup:", error);
                  }

                  // 성공 배지 표시
                  chrome.action.setBadgeText({ text: "✓" });
                  chrome.action.setBadgeBackgroundColor({ color: "#10b981" });
                  setTimeout(() => {
                    chrome.action.setBadgeText({ text: "" });
                  }, 3000);
                }
              });
            }
          }
        }
      );
    }

    // URL 파라미터에서 로그인 성공 확인 (기존 방식)
    const url = new URL(tab.url);
    const loginSuccess = url.searchParams.get("loginSuccess");

    if (loginSuccess === "true") {
      console.log("Firebase 호스팅에서 로그인 성공 감지 (URL 파라미터)");

      // 사용자 정보 추출
      const userData = {
        uid: url.searchParams.get("uid"),
        email: url.searchParams.get("email"),
        displayName: url.searchParams.get("displayName") || "",
        photoURL: url.searchParams.get("photoURL") || "",
        emailVerified: true,
      };

      console.log("추출된 사용자 데이터:", userData);

      // 사용자 데이터를 storage에 저장
      chrome.storage.local.set({ user: userData }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error storing user data:", chrome.runtime.lastError);
        } else {
          console.log("User data stored successfully from Firebase hosting");

          // 팝업에 알림 (팝업이 열려있는 경우)
          try {
            chrome.runtime.sendMessage(
              {
                action: "loginSuccessFromHosting",
                user: userData,
              },
              (response) => {
                if (chrome.runtime.lastError) {
                  console.log(
                    "Popup is closed or receiver not available:",
                    chrome.runtime.lastError.message
                  );
                } else {
                  console.log("Message sent to popup successfully");
                }
              }
            );
          } catch (error) {
            console.log("Failed to send message to popup:", error);
          }

          // 성공 배지 표시
          chrome.action.setBadgeText({ text: "✓" });
          chrome.action.setBadgeBackgroundColor({ color: "#10b981" });
          setTimeout(() => {
            chrome.action.setBadgeText({ text: "" });
          }, 3000);
        }
      });
    }
  }
});

// 탭 URL 변경 감지 (history.replaceState 등으로 인한 변경)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // URL이 변경된 경우 (changeInfo.url이 있는 경우)
  if (
    changeInfo.url &&
    tab.url &&
    tab.url.includes("bookmarkhub-5ea6c.web.app")
  ) {
    console.log("Firebase 호스팅 URL 변경 감지:", tab.url);

    // Firebase 호스팅 URL에서만 처리
    if (tab.url.startsWith("https://bookmarkhub-5ea6c.web.app/")) {
      // URL 파라미터에서 로그인 성공 확인
      const url = new URL(tab.url);
      const loginSuccess = url.searchParams.get("loginSuccess");

      if (loginSuccess === "true") {
        console.log("Firebase 호스팅에서 로그인 성공 감지 (URL 변경)");

        // 사용자 정보 추출
        const userData = {
          uid: url.searchParams.get("uid"),
          email: url.searchParams.get("email"),
          displayName: url.searchParams.get("displayName") || "",
          photoURL: url.searchParams.get("photoURL") || "",
          emailVerified: true,
        };

        console.log("추출된 사용자 데이터:", userData);

        // 사용자 데이터를 storage에 저장
        chrome.storage.local.set({ user: userData }, () => {
          if (chrome.runtime.lastError) {
            console.error("Error storing user data:", chrome.runtime.lastError);
          } else {
            console.log("User data stored successfully from Firebase hosting");

            // 팝업에 알림 (팝업이 열려있는 경우)
            try {
              chrome.runtime.sendMessage(
                {
                  action: "loginSuccessFromHosting",
                  user: userData,
                },
                (response) => {
                  if (chrome.runtime.lastError) {
                    console.log(
                      "Popup is closed or receiver not available:",
                      chrome.runtime.lastError.message
                    );
                  } else {
                    console.log("Message sent to popup successfully");
                  }
                }
              );
            } catch (error) {
              console.log("Failed to send message to popup:", error);
            }

            // 성공 배지 표시
            chrome.action.setBadgeText({ text: "✓" });
            chrome.action.setBadgeBackgroundColor({ color: "#10b981" });
            setTimeout(() => {
              chrome.action.setBadgeText({ text: "" });
            }, 3000);
          }
        });
      }
    }
  }
});

// 주기적으로 Firebase 호스팅 탭 확인 (로그인 상태 동기화)
setInterval(async () => {
  try {
    // 현재 로그인 상태 확인
    const userData = await new Promise((resolve) => {
      chrome.storage.local.get("user", (result) => {
        resolve(result.user || null);
      });
    });

    // 로그아웃된 상태라면 주기적 확인 건너뛰기
    if (!userData) {
      return;
    }

    const tabs = await chrome.tabs.query({
      url: "https://bookmarkhub-5ea6c.web.app/*",
    });

    for (const tab of tabs) {
      if (
        tab.url &&
        tab.url.includes("source=extension") &&
        tab.url.includes("action=login")
      ) {
        console.log("주기적 확인: Firebase 호스팅 탭 발견:", tab.url);

        // localStorage 확인
        // URL 파라미터에서 로그인 성공 확인
        const url = new URL(tab.url);
        const loginSuccess = url.searchParams.get("loginSuccess");

        if (loginSuccess === "true") {
          console.log("주기적 확인: URL 파라미터에서 로그인 성공 감지");

          // 사용자 정보 추출
          const userData = {
            uid: url.searchParams.get("uid"),
            email: url.searchParams.get("email"),
            displayName: url.searchParams.get("displayName") || "",
            photoURL: url.searchParams.get("photoURL") || "",
            emailVerified: true,
          };

          console.log("주기적 확인: URL에서 추출된 사용자 데이터:", userData);

          // 사용자 데이터를 storage에 저장
          chrome.storage.local.set({ user: userData }, () => {
            console.log("주기적 확인: 사용자 데이터 저장 완료");

            try {
              chrome.runtime.sendMessage(
                {
                  action: "loginSuccessFromHosting",
                  user: userData,
                },
                (response) => {
                  if (chrome.runtime.lastError) {
                    console.log(
                      "Popup is closed or receiver not available:",
                      chrome.runtime.lastError.message
                    );
                  } else {
                    console.log("Message sent to popup successfully");
                  }
                }
              );
            } catch (error) {
              console.log("Failed to send message to popup:", error);
            }

            chrome.action.setBadgeText({ text: "✓" });
            chrome.action.setBadgeBackgroundColor({ color: "#10b981" });
            setTimeout(() => {
              chrome.action.setBadgeText({ text: "" });
            }, 3000);
          });
        } else {
          // localStorage 확인 (백업 방법)
          chrome.scripting.executeScript(
            {
              target: { tabId: tab.id },
              func: () => {
                try {
                  console.log("주기적 확인: localStorage 확인 시작");
                  const loginData = localStorage.getItem(
                    "extensionLoginSuccess"
                  );
                  console.log(
                    "주기적 확인: localStorage에서 읽은 데이터:",
                    loginData
                  );

                  if (loginData) {
                    const data = JSON.parse(loginData);
                    console.log(
                      "주기적 확인: localStorage에서 로그인 데이터 발견:",
                      data
                    );
                    localStorage.removeItem("extensionLoginSuccess");
                    console.log(
                      "주기적 확인: localStorage에서 데이터 제거 완료"
                    );
                    return data;
                  } else {
                    console.log(
                      "주기적 확인: localStorage에 로그인 데이터 없음"
                    );
                  }
                } catch (error) {
                  console.error(
                    "주기적 확인: localStorage 확인 중 오류:",
                    error
                  );
                }
                return null;
              },
            },
            (results) => {
              if (results && results[0] && results[0].result) {
                const loginData = results[0].result;
                console.log("주기적 확인: 로그인 성공 데이터 수신:", loginData);

                if (loginData.action === "loginSuccess" && loginData.user) {
                  chrome.storage.local.set({ user: loginData.user }, () => {
                    console.log("주기적 확인: 사용자 데이터 저장 완료");

                    chrome.runtime.sendMessage({
                      action: "loginSuccessFromHosting",
                      user: loginData.user,
                    });

                    chrome.action.setBadgeText({ text: "✓" });
                    chrome.action.setBadgeBackgroundColor({ color: "#10b981" });
                    setTimeout(() => {
                      chrome.action.setBadgeText({ text: "" });
                    }, 3000);
                  });
                }
              }
            }
          );
        }
      }
    }
  } catch (error) {
    console.error("주기적 확인 중 오류:", error);
  }
}, 2000); // 2초마다 확인

// 확장 프로그램 초기화
initializeExtension();

console.log("Background script loaded");
