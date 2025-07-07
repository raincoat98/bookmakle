const FIREBASE_HOSTING_URL = "https://bookmarkhub-5ea6c.web.app";

const iframe = document.createElement("iframe");
iframe.src = FIREBASE_HOSTING_URL;
document.body.appendChild(iframe);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getAuth" && message.target === "offscreen") {
    let timeoutId;
    let messageHandler;
    let messageCount = 0;
    const MAX_MESSAGES = 10; // 최대 메시지 처리 횟수

    function handleIframeMessage({ data, origin }) {
      // 보안을 위해 origin 확인
      if (origin !== FIREBASE_HOSTING_URL) {
        console.log("Ignoring message from unauthorized origin:", origin);
        return;
      }

      messageCount++;
      console.log(`Received message ${messageCount} from iframe:`, data);

      // 최대 메시지 처리 횟수 초과 시 응답
      if (messageCount > MAX_MESSAGES) {
        console.log("Maximum message count reached, sending timeout error");
        window.removeEventListener("message", messageHandler);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        sendResponse({ error: "너무 많은 메시지가 수신되었습니다." });
        return;
      }

      // Firebase 내부 메시지 필터링
      if (typeof data === "string") {
        // Firebase 내부 메시지 패턴 확인
        if (
          data.startsWith("!_{") ||
          data.startsWith("!") ||
          data.includes('"h":""')
        ) {
          console.log("Ignoring Firebase internal message:", data);
          return;
        }

        // 빈 문자열이나 의미 없는 메시지 필터링
        if (data.trim() === "" || data.length < 10) {
          console.log("Ignoring empty or too short message:", data);
          return;
        }
      }

      try {
        // 데이터가 문자열인지 확인
        if (typeof data !== "string") {
          console.error("Received non-string data:", data);
          window.removeEventListener("message", messageHandler);
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          sendResponse({ error: "잘못된 데이터 형식입니다." });
          return;
        }

        const parsedData = JSON.parse(data);
        console.log("Parsed data:", parsedData);

        // 유효한 인증 응답인지 확인
        if (!parsedData || typeof parsedData !== "object") {
          console.log("Ignoring invalid parsed data:", parsedData);
          return;
        }

        // 타임아웃 클리어
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // 이벤트 리스너 제거
        window.removeEventListener("message", messageHandler);

        // 응답 처리
        if (parsedData.error) {
          sendResponse({ error: parsedData.error });
        } else if (parsedData.user) {
          sendResponse({ user: parsedData.user });
        } else {
          console.log("Ignoring message without user or error:", parsedData);
          sendResponse({ error: "인증 데이터가 올바르지 않습니다." });
        }
      } catch (e) {
        console.error("Error parsing iframe message:", e);
        console.error("Raw data:", data);

        // JSON 파싱 오류가 발생한 경우에도 계속 대기
        // Firebase에서 여러 메시지를 보낼 수 있으므로
        return;
      }
    }

    messageHandler = handleIframeMessage;
    window.addEventListener("message", messageHandler);

    // 30초 타임아웃 설정
    timeoutId = setTimeout(() => {
      window.removeEventListener("message", messageHandler);
      sendResponse({ error: "인증 요청 시간이 초과되었습니다." });
    }, 30000);

    // iframe에 인증 요청 전송
    try {
      console.log("Sending auth request to iframe");
      iframe.contentWindow.postMessage(
        { initAuth: true },
        FIREBASE_HOSTING_URL
      );
    } catch (e) {
      console.error("Error posting message to iframe:", e);
      window.removeEventListener("message", messageHandler);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      sendResponse({ error: "iframe 통신 오류: " + e.message });
    }

    return true; // Indicates we will send a response asynchronously
  }
});
