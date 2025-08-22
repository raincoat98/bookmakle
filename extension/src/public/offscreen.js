console.log("=== OFFScreen.js STARTING ===");

// 로딩 상태 표시
if (window.offscreenLoaded !== undefined) {
  window.offscreenLoaded = true;
}

const FIREBASE_HOSTING_URL = "https://bookmarkhub-5ea6c.web.app";

console.log("Offscreen.js loaded, setting up iframe...");

// 상태 업데이트
if (document.getElementById("status")) {
  document.getElementById("status").textContent = "Offscreen.js Starting...";
}

// iframe 생성 및 설정
const iframe = document.createElement("iframe");
iframe.src = FIREBASE_HOSTING_URL;
iframe.style.width = "100%";
iframe.style.height = "100vh";
iframe.style.border = "none";
document.body.appendChild(iframe);

console.log("Iframe created and added to body");

// 상태 업데이트
if (document.getElementById("status")) {
  document.getElementById("status").textContent = "Iframe Created...";
}

// iframe 로딩 상태 관리
let iframeLoaded = false;
let iframeReady = false;
let iframeReadyPromise = null;
let iframeReadyTimeout = null;

// iframe 준비 상태를 기다리는 함수 (개선된 버전)
function waitForIframeReady() {
  if (!iframeReadyPromise) {
    iframeReadyPromise = new Promise((resolve, reject) => {
      // 타임아웃 설정 (30초)
      iframeReadyTimeout = setTimeout(() => {
        console.error("=== IFRAME READY TIMEOUT ===");
        reject(new Error("iframe 준비 시간이 초과되었습니다."));
      }, 30000);

      const checkReady = () => {
        if (iframeLoaded && iframeReady) {
          clearTimeout(iframeReadyTimeout);
          resolve();
        } else {
          setTimeout(checkReady, 200);
        }
      };
      checkReady();
    });
  }
  return iframeReadyPromise;
}

// iframe 로드 이벤트 처리 (개선된 버전)
iframe.addEventListener("load", () => {
  console.log("=== FIREBASE IFRAME LOADED SUCCESSFULLY ===");
  iframeLoaded = true;

  // iframe 로딩 후 ready 메시지 대기 (타임아웃 단축)
  const readyTimeout = setTimeout(() => {
    console.log("=== IFRAME READY TIMEOUT, ASSUMING READY ===");
    iframeReady = true;
  }, 3000);

  // ready 메시지 수신 시 타임아웃 취소
  const messageHandler = function (event) {
    if (event.origin === FIREBASE_HOSTING_URL) {
      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data && (data.ready || data.domReady)) {
          console.log("=== IFRAME READY MESSAGE RECEIVED ===");
          clearTimeout(readyTimeout);
          iframeReady = true;
          window.removeEventListener("message", messageHandler);
        }
      } catch (e) {
        // JSON 파싱 실패는 무시
      }
    }
  };

  window.addEventListener("message", messageHandler);
});

iframe.addEventListener("error", (error) => {
  console.error("=== FIREBASE IFRAME LOADING ERROR ===", error);

  // 상태 업데이트
  if (document.getElementById("status")) {
    document.getElementById("status").textContent = "Iframe Load Error";
  }
});

// 디버깅을 위한 모든 메시지 로깅 (개선된 버전)
window.addEventListener("message", (event) => {
  // Firebase 내부 메시지 필터링
  if (
    typeof event.data === "string" &&
    (event.data.startsWith("!_{") ||
      event.data.includes('"h":""') ||
      event.data.includes('"type":"keep-alive"') ||
      event.data.includes('"type":"ping"') ||
      event.data.includes('"type":"pong"') ||
      event.data.includes('"type":"ack"') ||
      event.data.includes('"type":"heartbeat"'))
  ) {
    return; // Firebase 내부 메시지는 로깅하지 않음
  }

  console.log("=== OFFScreen.js RECEIVED MESSAGE ===", {
    data: event.data,
    origin: event.origin,
    source: event.source,
    expectedOrigin: FIREBASE_HOSTING_URL,
    isExpectedOrigin: event.origin === FIREBASE_HOSTING_URL,
    timestamp: new Date().toISOString(),
  });
});

// Background.js와의 통신 설정 (개선된 버전)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("=== OFFScreen.js RECEIVED MESSAGE FROM BACKGROUND ===", message);

  // 상태 업데이트
  if (document.getElementById("status")) {
    document.getElementById("status").textContent =
      "Message Received: " + message.action;
  }

  if (message.action === "ping" && message.target === "offscreen") {
    console.log("=== PROCESSING PING REQUEST ===");
    // offscreen document가 준비되었는지 확인
    if (iframeLoaded && iframeReady) {
      console.log("=== OFFScreen.js IS READY ===");
      sendResponse({ ready: true });
    } else {
      console.log("=== OFFScreen.js NOT READY YET ===");
      sendResponse({ ready: false });
    }
    return true;
  } else if (message.action === "getAuth" && message.target === "offscreen") {
    console.log("=== PROCESSING GETAUTH REQUEST ===");

    // iframe이 준비될 때까지 대기 후 인증 처리
    waitForIframeReady()
      .then(() => {
        console.log("=== IFRAME IS READY, STARTING AUTH PROCESS ===");

        // 인증 처리 (개선된 버전)
        let timeoutId;
        let messageHandler;
        let messageCount = 0;
        const MAX_MESSAGES = 30; // 메시지 수 제한
        let authRequestSent = false;
        let authResponseReceived = false;

        function handleIframeMessage({ data, origin }) {
          if (!origin.startsWith(FIREBASE_HOSTING_URL)) {
            return;
          }

          messageCount++;
          console.log(`=== RECEIVED MESSAGE ${messageCount} FROM IFRAME ===`, {
            data: data,
            origin: origin,
            type: typeof data,
            length: typeof data === "string" ? data.length : "N/A",
            timestamp: new Date().toISOString(),
          });

          if (messageCount > MAX_MESSAGES) {
            console.log("=== MAXIMUM MESSAGE COUNT REACHED ===");
            cleanup();
            sendResponse({ error: "너무 많은 메시지가 수신되었습니다." });
            return;
          }

          if (typeof data === "string") {
            // Firebase 내부 메시지 필터링
            if (
              data.startsWith("!_{") ||
              data.startsWith("!") ||
              data.includes('"h":""') ||
              data.includes('"type":"keep-alive"') ||
              data.includes('"type":"ping"') ||
              data.includes('"type":"pong"') ||
              data.includes('"type":"ack"') ||
              data.includes('"type":"heartbeat"')
            ) {
              console.log("Ignoring Firebase internal message:", data);
              return;
            }

            if (data.trim() === "" || data.length < 3) {
              console.log("Ignoring empty or too short message:", data);
              return;
            }
          }

          try {
            if (typeof data !== "string") {
              console.error("Received non-string data:", data);
              cleanup();
              sendResponse({ error: "잘못된 데이터 형식입니다." });
              return;
            }

            const parsedData = JSON.parse(data);
            console.log("=== PARSED DATA ===", parsedData);

            if (!parsedData || typeof parsedData !== "object") {
              console.log("Ignoring invalid parsed data:", parsedData);
              return;
            }

            if (parsedData.ready || parsedData.domReady) {
              console.log("=== FIREBASE PAGE IS READY ===");
              sendAuthRequest();
              return;
            }

            if (parsedData.error || parsedData.user) {
              console.log("=== AUTHENTICATION RESPONSE RECEIVED ===");
              authResponseReceived = true;
              cleanup();

              if (parsedData.error) {
                console.log("Authentication error:", parsedData.error);
                sendResponse({ error: parsedData.error });
              } else if (parsedData.user) {
                console.log("Authentication success:", parsedData.user);
                sendResponse({ user: parsedData.user });
              }
            } else {
              console.log(
                "Ignoring message without user or error:",
                parsedData
              );
            }
          } catch (e) {
            console.error("Error parsing iframe message:", e);
            console.error("Raw data:", data);
            // 파싱 에러 시에도 계속 진행 (다른 메시지를 기다림)
            return;
          }
        }

        function cleanup() {
          console.log("=== CLEANING UP ===");
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          if (messageHandler) {
            window.removeEventListener("message", messageHandler);
          }
        }

        function sendAuthRequest() {
          if (authRequestSent) {
            console.log("Auth request already sent, skipping");
            return;
          }

          try {
            console.log("=== SENDING AUTH REQUEST TO IFRAME ===");
            iframe.contentWindow.postMessage(
              { initAuth: true },
              FIREBASE_HOSTING_URL
            );
            authRequestSent = true;
          } catch (e) {
            console.error("Error posting message to iframe:", e);
            cleanup();
            sendResponse({ error: "iframe 통신 오류: " + e.message });
          }
        }

        messageHandler = handleIframeMessage;
        window.addEventListener("message", messageHandler);

        // 타임아웃 시간 단축 (60초)
        timeoutId = setTimeout(() => {
          console.log("=== AUTHENTICATION TIMEOUT REACHED ===");
          if (!authResponseReceived) {
            cleanup();
            sendResponse({
              error: "인증 요청 시간이 초과되었습니다. 다시 시도해주세요.",
            });
          }
        }, 60000);

        // iframe이 이미 준비되었으므로 바로 인증 요청 전송
        sendAuthRequest();
      })
      .catch((error) => {
        console.error("=== ERROR WAITING FOR IFRAME READY ===", error);
        sendResponse({
          error: "iframe 준비 중 오류가 발생했습니다: " + error.message,
        });
      });

    return true;
  } else if (
    message.action === "saveBookmark" &&
    message.target === "offscreen"
  ) {
    console.log("=== PROCESSING SAVEBOOKMARK REQUEST ===", message.bookmark);

    // iframe이 준비될 때까지 대기
    waitForIframeReady()
      .then(() => {
        console.log("=== IFRAME IS READY, SENDING BOOKMARK REQUEST ===");
        sendBookmarkToIframe();
      })
      .catch((error) => {
        console.error("=== ERROR WAITING FOR IFRAME READY ===", error);
        sendResponse({
          error: "iframe 준비 중 오류가 발생했습니다: " + error.message,
        });
      });

    function sendBookmarkToIframe() {
      const msgId =
        "bookmark-" +
        Date.now() +
        "-" +
        Math.random().toString(36).substr(2, 9);
      const bookmarkMsg = {
        saveBookmark: true,
        bookmark: message.bookmark,
        msgId: msgId,
      };

      console.log("=== PREPARING BOOKMARK REQUEST ===", bookmarkMsg);

      // 응답 핸들러
      function handleIframeResponse(event) {
        console.log("=== RECEIVED MESSAGE IN BOOKMARK HANDLER ===", event);

        if (!event.origin.startsWith(FIREBASE_HOSTING_URL)) {
          console.log(
            "=== IGNORING MESSAGE FROM WRONG ORIGIN ===",
            event.origin
          );
          return;
        }

        try {
          const data =
            typeof event.data === "string"
              ? JSON.parse(event.data)
              : event.data;
          console.log("=== PARSED BOOKMARK RESPONSE ===", data);

          if (data && data.msgId === msgId) {
            console.log("=== MATCHING MSGID FOUND, SENDING RESPONSE ===", data);
            window.removeEventListener("message", handleIframeResponse);
            clearTimeout(timeoutId);
            sendResponse(data);
          } else {
            console.log("=== MSGID MISMATCH OR NO MSGID ===", {
              receivedMsgId: data?.msgId,
              expectedMsgId: msgId,
            });
          }
        } catch (e) {
          console.error("=== ERROR PARSING BOOKMARK RESPONSE ===", e);
        }
      }

      window.addEventListener("message", handleIframeResponse);

      // 실제 요청 전송
      try {
        console.log("=== SENDING BOOKMARK REQUEST TO IFRAME ===");
        console.log("=== IFRAME CONTENT WINDOW ===", iframe.contentWindow);
        console.log("=== TARGET ORIGIN ===", FIREBASE_HOSTING_URL);

        iframe.contentWindow.postMessage(bookmarkMsg, FIREBASE_HOSTING_URL);
        console.log("=== BOOKMARK REQUEST SENT SUCCESSFULLY ===");
      } catch (e) {
        console.error("=== ERROR SENDING BOOKMARK REQUEST ===", e);
        window.removeEventListener("message", handleIframeResponse);
        sendResponse({ error: "iframe 통신 오류: " + e.message });
        return;
      }

      // 타임아웃 처리 (30초)
      const timeoutId = setTimeout(() => {
        console.log("=== BOOKMARK SAVE TIMEOUT ===");
        window.removeEventListener("message", handleIframeResponse);
        sendResponse({ error: "북마크 저장 응답 시간이 초과되었습니다." });
      }, 30000);
    }

    return true;
  } else if (
    message.action === "getCollections" &&
    message.target === "offscreen"
  ) {
    console.log("=== PROCESSING GETCOLLECTIONS REQUEST ===", message.userId);

    // iframe이 준비될 때까지 대기
    waitForIframeReady()
      .then(() => {
        console.log("=== IFRAME IS READY, SENDING COLLECTIONS REQUEST ===");
        sendCollectionsRequestToIframe();
      })
      .catch((error) => {
        console.error("=== ERROR WAITING FOR IFRAME READY ===", error);
        sendResponse({
          error: "iframe 준비 중 오류가 발생했습니다: " + error.message,
        });
      });

    function sendCollectionsRequestToIframe() {
      const msgId =
        "collections-" +
        Date.now() +
        "-" +
        Math.random().toString(36).substr(2, 9);
      const collectionsMsg = {
        getCollections: true,
        userId: message.userId,
        msgId: msgId,
      };

      console.log("=== PREPARING COLLECTIONS REQUEST ===", collectionsMsg);

      // 응답 핸들러
      function handleIframeResponse(event) {
        console.log("=== RECEIVED MESSAGE IN COLLECTIONS HANDLER ===", event);

        if (!event.origin.startsWith(FIREBASE_HOSTING_URL)) {
          console.log(
            "=== IGNORING MESSAGE FROM WRONG ORIGIN ===",
            event.origin
          );
          return;
        }

        try {
          const data =
            typeof event.data === "string"
              ? JSON.parse(event.data)
              : event.data;
          console.log("=== PARSED COLLECTIONS RESPONSE ===", data);

          if (data && data.msgId === msgId) {
            console.log("=== MATCHING MSGID FOUND, SENDING RESPONSE ===", data);
            window.removeEventListener("message", handleIframeResponse);
            clearTimeout(timeoutId);
            sendResponse(data);
          } else {
            console.log("=== MSGID MISMATCH OR NO MSGID ===", {
              receivedMsgId: data?.msgId,
              expectedMsgId: msgId,
            });
          }
        } catch (e) {
          console.error("=== ERROR PARSING COLLECTIONS RESPONSE ===", e);
        }
      }

      window.addEventListener("message", handleIframeResponse);

      // 실제 요청 전송
      try {
        console.log("=== SENDING COLLECTIONS REQUEST TO IFRAME ===");
        iframe.contentWindow.postMessage(collectionsMsg, FIREBASE_HOSTING_URL);
        console.log("=== COLLECTIONS REQUEST SENT SUCCESSFULLY ===");
      } catch (e) {
        console.error("=== ERROR SENDING COLLECTIONS REQUEST ===", e);
        window.removeEventListener("message", handleIframeResponse);
        sendResponse({ error: "iframe 통신 오류: " + e.message });
        return;
      }

      // 타임아웃 처리 (30초)
      const timeoutId = setTimeout(() => {
        console.log("=== COLLECTIONS REQUEST TIMEOUT ===");
        window.removeEventListener("message", handleIframeResponse);
        sendResponse({ error: "컬렉션 요청 응답 시간이 초과되었습니다." });
      }, 30000);
    }

    return true;
  } else if (
    message.action === "createCollection" &&
    message.target === "offscreen"
  ) {
    console.log(
      "=== PROCESSING CREATECOLLECTION REQUEST ===",
      message.collection
    );

    // iframe이 준비될 때까지 대기
    waitForIframeReady()
      .then(() => {
        console.log(
          "=== IFRAME IS READY, SENDING CREATE COLLECTION REQUEST ==="
        );
        sendCreateCollectionRequestToIframe();
      })
      .catch((error) => {
        console.error("=== ERROR WAITING FOR IFRAME READY ===", error);
        sendResponse({
          error: "iframe 준비 중 오류가 발생했습니다: " + error.message,
        });
      });

    function sendCreateCollectionRequestToIframe() {
      const msgId =
        "createCollection-" +
        Date.now() +
        "-" +
        Math.random().toString(36).substr(2, 9);
      const createCollectionMsg = {
        createCollection: true,
        collection: message.collection,
        msgId: msgId,
      };

      console.log(
        "=== PREPARING CREATE COLLECTION REQUEST ===",
        createCollectionMsg
      );

      // 응답 핸들러
      function handleIframeResponse(event) {
        console.log(
          "=== RECEIVED MESSAGE IN CREATE COLLECTION HANDLER ===",
          event
        );

        if (!event.origin.startsWith(FIREBASE_HOSTING_URL)) {
          console.log(
            "=== IGNORING MESSAGE FROM WRONG ORIGIN ===",
            event.origin
          );
          return;
        }

        try {
          const data =
            typeof event.data === "string"
              ? JSON.parse(event.data)
              : event.data;
          console.log("=== PARSED CREATE COLLECTION RESPONSE ===", data);

          if (data && data.msgId === msgId) {
            console.log("=== MATCHING MSGID FOUND, SENDING RESPONSE ===", data);
            window.removeEventListener("message", handleIframeResponse);
            clearTimeout(timeoutId);
            sendResponse(data);
          } else {
            console.log("=== MSGID MISMATCH OR NO MSGID ===", {
              receivedMsgId: data?.msgId,
              expectedMsgId: msgId,
            });
          }
        } catch (e) {
          console.error("=== ERROR PARSING CREATE COLLECTION RESPONSE ===", e);
        }
      }

      window.addEventListener("message", handleIframeResponse);

      // 실제 요청 전송
      try {
        console.log("=== SENDING CREATE COLLECTION REQUEST TO IFRAME ===");
        iframe.contentWindow.postMessage(
          createCollectionMsg,
          FIREBASE_HOSTING_URL
        );
        console.log("=== CREATE COLLECTION REQUEST SENT SUCCESSFULLY ===");
      } catch (e) {
        console.error("=== ERROR SENDING CREATE COLLECTION REQUEST ===", e);
        window.removeEventListener("message", handleIframeResponse);
        sendResponse({ error: "iframe 통신 오류: " + e.message });
        return;
      }

      // 타임아웃 처리 (30초)
      const timeoutId = setTimeout(() => {
        console.log("=== CREATE COLLECTION REQUEST TIMEOUT ===");
        window.removeEventListener("message", handleIframeResponse);
        sendResponse({ error: "컬렉션 생성 요청 응답 시간이 초과되었습니다." });
      }, 30000);
    }

    return true;
  } else if (message.action === "signOut" && message.target === "offscreen") {
    console.log("=== PROCESSING SIGNOUT REQUEST ===");

    // iframe이 준비될 때까지 대기
    waitForIframeReady()
      .then(() => {
        console.log("=== IFRAME IS READY, SENDING SIGNOUT REQUEST ===");
        sendSignOutRequestToIframe();
      })
      .catch((error) => {
        console.error("=== ERROR WAITING FOR IFRAME READY ===", error);
        sendResponse({
          error: "iframe 준비 중 오류가 발생했습니다: " + error.message,
        });
      });

    function sendSignOutRequestToIframe() {
      const msgId =
        "signOut-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
      const signOutMsg = {
        signOut: true,
        msgId: msgId,
      };

      console.log("=== PREPARING SIGNOUT REQUEST ===", signOutMsg);

      // 응답 핸들러
      function handleIframeResponse(event) {
        console.log("=== RECEIVED MESSAGE IN SIGNOUT HANDLER ===", event);

        if (!event.origin.startsWith(FIREBASE_HOSTING_URL)) {
          console.log(
            "=== IGNORING MESSAGE FROM WRONG ORIGIN ===",
            event.origin
          );
          return;
        }

        try {
          const data =
            typeof event.data === "string"
              ? JSON.parse(event.data)
              : event.data;
          console.log("=== PARSED SIGNOUT RESPONSE ===", data);

          if (data && data.msgId === msgId) {
            console.log("=== MATCHING MSGID FOUND, SENDING RESPONSE ===", data);
            window.removeEventListener("message", handleIframeResponse);
            clearTimeout(timeoutId);
            sendResponse(data);
          } else {
            console.log("=== MSGID MISMATCH OR NO MSGID ===", {
              receivedMsgId: data?.msgId,
              expectedMsgId: msgId,
            });
          }
        } catch (e) {
          console.error("=== ERROR PARSING SIGNOUT RESPONSE ===", e);
        }
      }

      window.addEventListener("message", handleIframeResponse);

      // 실제 요청 전송
      try {
        console.log("=== SENDING SIGNOUT REQUEST TO IFRAME ===");
        iframe.contentWindow.postMessage(signOutMsg, FIREBASE_HOSTING_URL);
        console.log("=== SIGNOUT REQUEST SENT SUCCESSFULLY ===");
      } catch (e) {
        console.error("=== ERROR SENDING SIGNOUT REQUEST ===", e);
        window.removeEventListener("message", handleIframeResponse);
        sendResponse({ error: "iframe 통신 오류: " + e.message });
        return;
      }

      // 타임아웃 처리 (10초)
      const timeoutId = setTimeout(() => {
        console.log("=== SIGNOUT REQUEST TIMEOUT ===");
        window.removeEventListener("message", handleIframeResponse);
        sendResponse({
          error: "로그아웃 요청 응답 시간이 초과되었습니다.",
        });
      }, 10000);
    }

    return true;
  }
});

console.log("=== OFFScreen.js SETUP COMPLETE ===");

// 상태 업데이트
if (document.getElementById("status")) {
  document.getElementById("status").textContent = "Offscreen.js Ready";
}
