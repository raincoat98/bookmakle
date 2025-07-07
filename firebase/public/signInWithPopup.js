import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

// 환경 변수에서 Firebase 설정 로드
function getFirebaseConfig() {
  const urlParams = new URLSearchParams(window.location.search);

  return {
    apiKey: urlParams.get("apiKey") || "",
    authDomain:
      urlParams.get("authDomain") || "extension--auth-firebase.firebaseapp.com",
    projectId: urlParams.get("projectId") || "extension--auth-firebase",
    storageBucket:
      urlParams.get("storageBucket") ||
      "extension--auth-firebase.firebasestorage.app",
    messagingSenderId: urlParams.get("messagingSenderId") || "",
    appId: urlParams.get("appId") || "",
    measurementId: urlParams.get("measurementId") || "",
  };
}

const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const PROVIDER = new GoogleAuthProvider();

// UI 요소들
const statusEl = document.getElementById("status");
const signinBtn = document.getElementById("signin-btn");
const signoutBtn = document.getElementById("signout-btn");
const userInfoEl = document.getElementById("user-info");

// 인증 상태 변경 감지
onAuthStateChanged(auth, (user) => {
  if (user) {
    // 로그인된 상태
    statusEl.textContent = "로그인됨";
    statusEl.className = "status authenticated";
    signinBtn.style.display = "none";
    signoutBtn.style.display = "inline-block";

    // 사용자 정보 표시
    userInfoEl.style.display = "block";
    userInfoEl.innerHTML = `
      <img src="${
        user.photoURL || "https://via.placeholder.com/50"
      }" alt="프로필">
      <strong>${user.displayName}</strong><br>
      <small>${user.email}</small>
    `;
  } else {
    // 로그아웃된 상태
    statusEl.textContent = "로그아웃됨";
    statusEl.className = "status unauthenticated";
    signinBtn.style.display = "inline-block";
    signoutBtn.style.display = "none";
    userInfoEl.style.display = "none";
  }
});

// 로그인 버튼 클릭
signinBtn.addEventListener("click", async () => {
  try {
    signinBtn.disabled = true;
    signinBtn.textContent = "로그인 중...";
    await signInWithPopup(auth, PROVIDER);
  } catch (error) {
    console.error("로그인 오류:", error);
    statusEl.textContent = `로그인 실패: ${error.message}`;
    statusEl.className = "status unauthenticated";
  } finally {
    signinBtn.disabled = false;
    signinBtn.textContent = "Google로 로그인";
  }
});

// 로그아웃 버튼 클릭
signoutBtn.addEventListener("click", async () => {
  try {
    signoutBtn.disabled = true;
    signoutBtn.textContent = "로그아웃 중...";
    await signOut(auth);
  } catch (error) {
    console.error("로그아웃 오류:", error);
  } finally {
    signoutBtn.disabled = false;
    signoutBtn.textContent = "로그아웃";
  }
});

// Chrome Extension 통신
const PARENT_FRAME = document.location.ancestorOrigins[0];

function sendResponse(result) {
  if (PARENT_FRAME) {
    try {
      // 성공적인 인증 결과 처리
      if (result && result.user) {
        const userData = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          emailVerified: result.user.emailVerified,
        };

        const responseData = { user: userData };
        console.log("Sending success response:", responseData);
        window.parent.postMessage(JSON.stringify(responseData), PARENT_FRAME);
      } else {
        // 오류 처리
        const errorMessage =
          result?.message || result?.code || "알 수 없는 오류가 발생했습니다.";
        const responseData = { error: errorMessage };
        console.log("Sending error response:", responseData);
        window.parent.postMessage(JSON.stringify(responseData), PARENT_FRAME);
      }
    } catch (e) {
      console.error("Error sending response:", e);
      const errorResponse = { error: "응답 전송 중 오류가 발생했습니다." };
      window.parent.postMessage(JSON.stringify(errorResponse), PARENT_FRAME);
    }
  }
}

window.addEventListener("message", async function ({ data, origin }) {
  // 보안을 위해 origin 확인
  if (origin !== PARENT_FRAME) {
    console.log("Ignoring message from unauthorized origin:", origin);
    return;
  }

  if (data.initAuth) {
    console.log("Received initAuth request");
    try {
      const userCredential = await signInWithPopup(auth, PROVIDER);
      console.log("Authentication successful:", userCredential);
      sendResponse(userCredential);
    } catch (error) {
      console.error("Chrome Extension 인증 오류:", error);

      // 오류 코드별로 사용자 친화적인 메시지 제공
      let errorMessage = "인증 중 오류가 발생했습니다.";

      switch (error.code) {
        case "auth/popup-closed-by-user":
          errorMessage = "로그인 창이 닫혔습니다.";
          break;
        case "auth/popup-blocked":
          errorMessage = "팝업이 차단되었습니다. 팝업 차단을 해제해주세요.";
          break;
        case "auth/cancelled-popup-request":
          errorMessage = "로그인이 취소되었습니다.";
          break;
        case "auth/network-request-failed":
          errorMessage = "네트워크 연결을 확인해주세요.";
          break;
        case "auth/too-many-requests":
          errorMessage =
            "너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.";
          break;
        default:
          errorMessage =
            error.message || "알 수 없는 인증 오류가 발생했습니다.";
      }

      sendResponse({ error: errorMessage });
    }
  }
});
