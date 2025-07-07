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

// iframe 로딩 완료 대기
let iframeLoaded = false;
iframe.addEventListener("load", () => {
  console.log("=== FIREBASE IFRAME LOADED SUCCESSFULLY ===");
  iframeLoaded = true;

  // 상태 업데이트
  if (document.getElementById("status")) {
    document.getElementById("status").textContent = "Firebase Iframe Loaded";
  }
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

    // 상태 업데이트
    if (document.getElementById("status")) {
      document.getElementById("status").textContent =
        "Processing Auth Request...";
    }

    let timeoutId;
    let messageHandler;
    let messageCount = 0;
    const MAX_MESSAGES = 50;
    let authRequestSent = false;
    let authResponseReceived = false;
    let readyMessageReceived = false;

    function handleIframeMessage({ data, origin }) {
      // 보안을 위해 origin 확인 (더 유연하게)
      if (!origin.startsWith(FIREBASE_HOSTING_URL)) {
        console.log(
          "Ignoring message from unauthorized origin:",
          origin,
          "Expected:",
          FIREBASE_HOSTING_URL
        );
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

      // 최대 메시지 처리 횟수 초과 시 응답
      if (messageCount > MAX_MESSAGES) {
        console.log("=== MAXIMUM MESSAGE COUNT REACHED ===");
        cleanup();
        sendResponse({ error: "너무 많은 메시지가 수신되었습니다." });
        return;
      }

      // Firebase 내부 메시지 필터링 개선
      if (typeof data === "string") {
        // Firebase 내부 메시지 패턴 확인 (더 정확한 필터링)
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

        // 빈 문자열이나 의미 없는 메시지 필터링
        if (data.trim() === "" || data.length < 3) {
          console.log("Ignoring empty or too short message:", data);
          return;
        }
      }

      try {
        // 데이터가 문자열인지 확인
        if (typeof data !== "string") {
          console.error("Received non-string data:", data);
          cleanup();
          sendResponse({ error: "잘못된 데이터 형식입니다." });
          return;
        }

        const parsedData = JSON.parse(data);
        console.log("=== PARSED DATA ===", parsedData);

        // 유효한 인증 응답인지 확인
        if (!parsedData || typeof parsedData !== "object") {
          console.log("Ignoring invalid parsed data:", parsedData);
          return;
        }

        // Firebase 페이지 준비 상태 확인
        if (parsedData.ready || parsedData.domReady) {
          console.log("=== FIREBASE PAGE IS READY ===");
          readyMessageReceived = true;

          // 상태 업데이트
          if (document.getElementById("status")) {
            document.getElementById("status").textContent =
              "Firebase Ready, Sending Auth Request...";
          }

          sendAuthRequest();
          return;
        }

        // 인증 성공 또는 오류 응답 처리
        if (parsedData.error || parsedData.user) {
          console.log("=== AUTHENTICATION RESPONSE RECEIVED ===");
          authResponseReceived = true;
          cleanup();

          // 상태 업데이트
          if (document.getElementById("status")) {
            document.getElementById("status").textContent = parsedData.error
              ? "Auth Error"
              : "Auth Success";
          }

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

        // JSON 파싱 오류가 발생한 경우에도 계속 대기
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

        // 상태 업데이트
        if (document.getElementById("status")) {
          document.getElementById("status").textContent =
            "Auth Request Sent...";
        }
      } catch (e) {
        console.error("Error posting message to iframe:", e);
        cleanup();
        sendResponse({ error: "iframe 통신 오류: " + e.message });
      }
    }

    messageHandler = handleIframeMessage;
    window.addEventListener("message", messageHandler);

    // 120초 타임아웃 설정
    timeoutId = setTimeout(() => {
      console.log("=== AUTHENTICATION TIMEOUT REACHED ===");
      console.log("Debug info:", {
        iframeLoaded,
        readyMessageReceived,
        authRequestSent,
        authResponseReceived,
        messageCount,
      });

      // 상태 업데이트
      if (document.getElementById("status")) {
        document.getElementById("status").textContent = "Auth Timeout";
      }

      if (!authResponseReceived) {
        cleanup();
        sendResponse({
          error: "인증 요청 시간이 초과되었습니다. 다시 시도해주세요.",
        });
      }
    }, 120000);

    // iframe 로딩 완료 대기 후 인증 요청 전송
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

    return true; // Indicates we will send a response asynchronously
  }
});

console.log("=== OFFScreen.js SETUP COMPLETE ===");

// 상태 업데이트
if (document.getElementById("status")) {
  document.getElementById("status").textContent = "Offscreen.js Ready";
}
