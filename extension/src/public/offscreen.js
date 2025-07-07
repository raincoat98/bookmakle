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

iframe.addEventListener("load", () => {
  console.log("=== FIREBASE IFRAME LOADED SUCCESSFULLY ===");
  iframeLoaded = true;

  // iframe 로딩 후 ready 메시지 대기
  const readyTimeout = setTimeout(() => {
    console.log("=== IFRAME READY TIMEOUT, ASSUMING READY ===");
    iframeReady = true;
  }, 5000);

  // ready 메시지 수신 시 타임아웃 취소
  const originalMessageHandler = window.onmessage;
  window.addEventListener("message", function (event) {
    if (event.origin === FIREBASE_HOSTING_URL) {
      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data && (data.ready || data.domReady)) {
          console.log("=== IFRAME READY MESSAGE RECEIVED ===");
          clearTimeout(readyTimeout);
          iframeReady = true;
          window.removeEventListener("message", arguments.callee);
        }
      } catch (e) {
        // JSON 파싱 실패는 무시
      }
    }
  });
});

iframe.addEventListener("error", (error) => {
  console.error("=== FIREBASE IFRAME LOADING ERROR ===", error);

  // 상태 업데이트
  if (document.getElementById("status")) {
    document.getElementById("status").textContent = "Iframe Load Error";
  }
});

// 디버깅을 위한 모든 메시지 로깅
window.addEventListener("message", (event) => {
  console.log("=== OFFScreen.js RECEIVED MESSAGE ===", {
    data: event.data,
    origin: event.origin,
    source: event.source,
    expectedOrigin: FIREBASE_HOSTING_URL,
    isExpectedOrigin: event.origin === FIREBASE_HOSTING_URL,
    timestamp: new Date().toISOString(),
  });
});

// Background.js와의 통신 설정
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("=== OFFScreen.js RECEIVED MESSAGE FROM BACKGROUND ===", message);

  // 상태 업데이트
  if (document.getElementById("status")) {
    document.getElementById("status").textContent =
      "Message Received: " + message.action;
  }

  if (message.action === "getAuth" && message.target === "offscreen") {
    console.log("=== PROCESSING GETAUTH REQUEST ===");

    // 인증 처리 (기존 코드 유지)
    let timeoutId;
    let messageHandler;
    let messageCount = 0;
    const MAX_MESSAGES = 50;
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
          console.log("Ignoring message without user or error:", parsedData);
        }
      } catch (e) {
        console.error("Error parsing iframe message:", e);
        console.error("Raw data:", data);
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

    timeoutId = setTimeout(() => {
      console.log("=== AUTHENTICATION TIMEOUT REACHED ===");
      if (!authResponseReceived) {
        cleanup();
        sendResponse({
          error: "인증 요청 시간이 초과되었습니다. 다시 시도해주세요.",
        });
      }
    }, 120000);

    if (iframeLoaded) {
      console.log(
        "=== IFRAME ALREADY LOADED, SENDING AUTH REQUEST IMMEDIATELY ==="
      );
      sendAuthRequest();
    } else {
      console.log("=== WAITING FOR IFRAME TO LOAD ===");
      const checkIframeLoaded = () => {
        if (iframeLoaded) {
          console.log("=== IFRAME LOADED, SENDING AUTH REQUEST ===");
          sendAuthRequest();
        } else {
          setTimeout(checkIframeLoaded, 1000);
        }
      };
      checkIframeLoaded();
    }

    return true;
  } else if (
    message.action === "saveBookmark" &&
    message.target === "offscreen"
  ) {
    console.log("=== PROCESSING SAVEBOOKMARK REQUEST ===", message.bookmark);
    console.log("=== IFRAME STATUS ===", { iframeLoaded, iframeReady });

    // iframe이 준비될 때까지 대기
    const waitForIframeReady = () => {
      console.log("=== CHECKING IFRAME READY STATUS ===", {
        iframeLoaded,
        iframeReady,
      });
      if (iframeLoaded && iframeReady) {
        console.log("=== IFRAME IS READY, SENDING BOOKMARK REQUEST ===");
        sendBookmarkToIframe();
      } else {
        console.log("=== IFRAME NOT READY, WAITING... ===");
        setTimeout(waitForIframeReady, 1000);
      }
    };

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

      // 타임아웃 처리
      const timeoutId = setTimeout(() => {
        console.log("=== BOOKMARK SAVE TIMEOUT ===");
        window.removeEventListener("message", handleIframeResponse);
        sendResponse({ error: "북마크 저장 응답 시간이 초과되었습니다." });
      }, 30000);
    }

    waitForIframeReady();
    return true;
  }
});

console.log("=== OFFScreen.js SETUP COMPLETE ===");

// 상태 업데이트
if (document.getElementById("status")) {
  document.getElementById("status").textContent = "Offscreen.js Ready";
}
