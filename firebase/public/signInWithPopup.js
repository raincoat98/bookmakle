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

// Chrome Extension 통신 (기존 코드 유지)
const PARENT_FRAME = document.location.ancestorOrigins[0];

function sendResponse(result) {
  if (PARENT_FRAME) {
    window.parent.postMessage(JSON.stringify(result), PARENT_FRAME);
  }
}

window.addEventListener("message", function ({ data }) {
  if (data.initAuth) {
    signInWithPopup(auth, PROVIDER).then(sendResponse).catch(sendResponse);
  }
});
