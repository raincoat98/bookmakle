import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// Firebase 설정
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

console.log("Initializing Firebase with config:", firebaseConfig);

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const PROVIDER = new GoogleAuthProvider();

// Google 로그인 설정 (COOP 오류 방지)
PROVIDER.setCustomParameters({
  prompt: "select_account",
});

// 팝업 설정 개선
PROVIDER.addScope("email");
PROVIDER.addScope("profile");

console.log("Firebase Auth initialized:", auth);

// UI 요소들
const statusEl = document.getElementById("status");
const signinBtn = document.getElementById("signin-btn");
const signoutBtn = document.getElementById("signout-btn");
const userInfoEl = document.getElementById("user-info");
const loginFormEl = document.getElementById("login-form");
const emailInput = document.getElementById("email-input");
const passwordInput = document.getElementById("password-input");
const emailLoginBtn = document.getElementById("email-login-btn");
const signupLink = document.getElementById("signup-link");

// Chrome Extension 통신 변수들
let PARENT_FRAME = null;
let isProcessingAuth = false; // 중복 요청 방지
let readyMessageSent = false; // 준비 메시지 전송 상태

// 부모 프레임 origin을 찾는 함수
function findParentFrame() {
  try {
    // 여러 방법으로 부모 프레임을 찾기
    if (
      document.location.ancestorOrigins &&
      document.location.ancestorOrigins.length > 0
    ) {
      PARENT_FRAME = document.location.ancestorOrigins[0];
      console.log("Found parent frame from ancestorOrigins:", PARENT_FRAME);
    } else if (window.parent && window.parent !== window) {
      // iframe에서 실행 중인 경우
      PARENT_FRAME = window.location.origin;
      console.log("Found parent frame from window.parent:", PARENT_FRAME);
    } else {
      console.log("No parent frame detected, running in standalone mode");
    }
  } catch (e) {
    console.error("Error finding parent frame:", e);
  }
}

console.log("Current location:", window.location.href);
console.log("Ancestor origins:", document.location.ancestorOrigins);
findParentFrame();

// 닫기 버튼 표시 함수
function showCloseButton() {
  // 기존 닫기 버튼이 있다면 제거
  const existingCloseBtn = document.getElementById("close-page-btn");
  if (existingCloseBtn) {
    existingCloseBtn.remove();
  }

  // 닫기 버튼 생성
  const closeBtn = document.createElement("button");
  closeBtn.id = "close-page-btn";
  closeBtn.className = "close-page-btn";
  closeBtn.innerHTML = `
    <svg viewBox="0 0 24 24" class="w-5 h-5 mr-2">
      <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>
    확장 프로그램으로 돌아가기
  `;

  // 버튼 클릭 이벤트
  closeBtn.addEventListener("click", () => {
    console.log("User clicked close button");
    window.close();
  });

  // 페이지에 추가
  document.body.appendChild(closeBtn);
}

// 응답 전송 함수 (개선된 버전)
function sendResponse(result) {
  if (PARENT_FRAME) {
    try {
      console.log("Attempting to send response to parent:", {
        parentFrame: PARENT_FRAME,
        result: result,
        timestamp: new Date().toISOString(),
      });

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

        // 재시도 로직으로 안정성 향상 (최대 3회)
        let sent = false;
        for (let i = 0; i < 3 && !sent; i++) {
          try {
            window.parent.postMessage(
              JSON.stringify(responseData),
              PARENT_FRAME
            );
            console.log(`Success response sent (attempt ${i + 1})`);
            sent = true;
          } catch (e) {
            console.error(
              `Failed to send success response (attempt ${i + 1}):`,
              e
            );
            if (i === 2) {
              // 마지막 시도에서도 실패하면 오류 응답 전송
              const errorResponse = { error: "응답 전송에 실패했습니다." };
              window.parent.postMessage(
                JSON.stringify(errorResponse),
                PARENT_FRAME
              );
            }
          }
        }
      } else {
        // 오류 처리
        const errorMessage =
          result?.message || result?.code || "알 수 없는 오류가 발생했습니다.";
        const responseData = { error: errorMessage };
        console.log("Sending error response:", responseData);

        // 재시도 로직으로 안정성 향상 (최대 3회)
        let sent = false;
        for (let i = 0; i < 3 && !sent; i++) {
          try {
            window.parent.postMessage(
              JSON.stringify(responseData),
              PARENT_FRAME
            );
            console.log(`Error response sent (attempt ${i + 1})`);
            sent = true;
          } catch (e) {
            console.error(
              `Failed to send error response (attempt ${i + 1}):`,
              e
            );
            if (i === 2) {
              // 마지막 시도에서도 실패하면 일반 오류 응답 전송
              const errorResponse = { error: "응답 전송에 실패했습니다." };
              window.parent.postMessage(
                JSON.stringify(errorResponse),
                PARENT_FRAME
              );
            }
          }
        }
      }
    } catch (e) {
      console.error("Error sending response:", e);
      const errorResponse = { error: "응답 전송 중 오류가 발생했습니다." };
      try {
        window.parent.postMessage(JSON.stringify(errorResponse), PARENT_FRAME);
      } catch (sendError) {
        console.error("Failed to send error response:", sendError);
      }
    }
  } else {
    console.log("No parent frame detected, running in standalone mode");
  }
}

// 준비 메시지 전송 함수 (개선된 버전)
function sendReadyMessage() {
  if (PARENT_FRAME && !readyMessageSent) {
    try {
      console.log("Sending ready message to parent frame");
      window.parent.postMessage(JSON.stringify({ ready: true }), PARENT_FRAME);
      console.log("Ready message sent successfully");
      readyMessageSent = true;
    } catch (e) {
      console.error("Could not send ready message to parent frame:", e);
    }
  }
}

// 인증 상태 변경 감지 (자동 로그인 비활성화)
onAuthStateChanged(auth, async (user) => {
  console.log("=== AUTH STATE CHANGED ===", user);
  console.log("Current URL:", window.location.href);
  console.log(
    "URL Params:",
    new URLSearchParams(window.location.search).toString()
  );

  if (user) {
    // 로그인된 상태
    statusEl.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
      로그인됨
    `;
    statusEl.className = "status-badge authenticated";

    // 로그인 폼 숨기기
    loginFormEl.style.display = "none";

    // 사용자 정보 표시
    userInfoEl.style.display = "block";
    userInfoEl.innerHTML = `
      <img src="${
        user.photoURL || "https://via.placeholder.com/48"
      }" alt="프로필">
      <div class="user-details">
        <strong>${user.displayName}</strong>
        <small>${user.email}</small>
      </div>
      <button id="signout-btn" class="logout-btn">로그아웃</button>
    `;

    // 자동 로그인 처리 제거 - 수동 로그인 버튼 클릭 시에만 확장 프로그램으로 메시지 전송
    console.log("사용자 로그인 상태 확인됨 - 자동 처리하지 않음");
  } else {
    // 로그아웃된 상태
    statusEl.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
      로그아웃됨
    `;
    statusEl.className = "status-badge unauthenticated";

    // 로그인 폼 표시
    loginFormEl.style.display = "block";
    userInfoEl.style.display = "none";
  }
});

// 로그인 버튼 클릭 - 확장 프로그램에서 온 요청 처리
signinBtn.addEventListener("click", async () => {
  console.log("로그인 버튼 클릭됨");

  // URL 파라미터 확인
  const urlParams = new URLSearchParams(window.location.search);
  const source = urlParams.get("source");
  const action = urlParams.get("action");

  console.log("URL 파라미터:", { source, action });

  try {
    signinBtn.disabled = true;
    signinBtn.innerHTML = `
      <svg class="google-icon" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      로그인 중...
    `;

    // 안전한 로그인 처리 (팝업 방식만 사용, 리다이렉트 제거)
    let result;
    try {
      result = await signInWithPopup(auth, PROVIDER);
      console.log("로그인 성공:", result);
    } catch (popupError) {
      console.error("로그인 팝업 오류:", popupError);

      // 팝업 관련 오류 처리
      if (popupError.code === "auth/popup-blocked") {
        statusEl.innerHTML = `
          <svg viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          팝업이 차단되었습니다. 브라우저에서 팝업을 허용해주세요.
        `;
        statusEl.className = "status-badge unauthenticated";
        throw popupError;
      } else if (popupError.code === "auth/popup-closed-by-user") {
        statusEl.innerHTML = `
          <svg viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          로그인 창이 닫혔습니다. 다시 시도해주세요.
        `;
        statusEl.className = "status-badge unauthenticated";
        throw popupError;
      } else if (
        popupError.message &&
        popupError.message.includes("Cross-Origin-Opener-Policy")
      ) {
        statusEl.innerHTML = `
          <svg viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          브라우저 보안 정책으로 인해 로그인에 실패했습니다. 페이지를 새로고침 후 다시 시도해주세요.
        `;
        statusEl.className = "status-badge unauthenticated";
        throw popupError;
      }

      // 다른 오류는 그대로 throw
      throw popupError;
    }

    // 확장 프로그램에서 온 요청인 경우에만 메시지 전달
    if (source === "extension" && action === "login") {
      console.log("확장 프로그램 로그인 요청 처리 - 수동 로그인 성공");

      // 로그인 성공 후 확장 프로그램으로 결과 전달
      const userData = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        emailVerified: result.user.emailVerified,
      };

      // Chrome Extension API를 통해 메시지 전송 시도
      try {
        if (window.chrome && window.chrome.runtime) {
          chrome.runtime.sendMessage(
            {
              action: "loginSuccess",
              user: userData,
            },
            (response) => {
              console.log("Chrome Extension API 응답 (수동 로그인):", response);
            }
          );
        }
      } catch (error) {
        console.log(
          "Chrome Extension API 직접 호출 실패 (수동 로그인):",
          error
        );
      }

      // localStorage를 통한 메시지 전달 (백업 방법)
      try {
        localStorage.setItem(
          "extensionLoginSuccess",
          JSON.stringify({
            action: "loginSuccess",
            user: userData,
            timestamp: Date.now(),
          })
        );
        // 로그인 성공 시 로그아웃 플래그 제거
        localStorage.removeItem("extensionLoggedOut");
        console.log(
          "localStorage에 로그인 성공 메시지 저장 및 로그아웃 플래그 제거 (수동 로그인)"
        );
      } catch (error) {
        console.log("localStorage 저장 실패 (수동 로그인):", error);
      }

      // URL 파라미터로 로그인 성공 알림
      const successUrl = new URL(window.location.href);
      successUrl.searchParams.set("loginSuccess", "true");
      successUrl.searchParams.set("uid", userData.uid);
      successUrl.searchParams.set("email", userData.email);
      successUrl.searchParams.set("displayName", userData.displayName || "");
      successUrl.searchParams.set("photoURL", userData.photoURL || "");

      // URL 업데이트
      window.history.replaceState({}, "", successUrl.toString());

      // 성공 메시지 표시
      statusEl.innerHTML = `
        <svg viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        로그인 성공! 확장 프로그램으로 돌아가세요
      `;
      statusEl.className = "status-badge authenticated";

      // 닫기 버튼 표시
      showCloseButton();

      // 3초 후 페이지 닫기
      setTimeout(() => {
        window.close();
      }, 3000);
    } else {
      console.log("일반 로그인 완료 - 확장 프로그램으로 메시지 전송하지 않음");
    }
  } catch (error) {
    console.error("로그인 오류:", error);
    statusEl.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
      로그인 실패: ${error.message}
    `;
    statusEl.className = "status-badge unauthenticated";
  } finally {
    signinBtn.disabled = false;
    signinBtn.innerHTML = `
      <svg class="google-icon" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Google로 로그인
    `;
  }
});

// 이메일 로그인 버튼 클릭
if (emailLoginBtn) {
  emailLoginBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      alert("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    try {
      emailLoginBtn.disabled = true;
      emailLoginBtn.textContent = "로그인 중...";

      // 이메일 로그인 시도
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("이메일 로그인 성공:", userCredential);

      // URL 파라미터 확인
      const urlParams = new URLSearchParams(window.location.search);
      const source = urlParams.get("source");
      const action = urlParams.get("action");

      // 확장 프로그램에서 온 요청인 경우에만 메시지 전달
      if (source === "extension" && action === "login") {
        console.log("확장 프로그램 이메일 로그인 요청 처리");

        const userData = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL,
          emailVerified: userCredential.user.emailVerified,
        };

        // Chrome Extension API를 통해 메시지 전송 시도
        try {
          if (window.chrome && window.chrome.runtime) {
            chrome.runtime.sendMessage(
              {
                action: "loginSuccess",
                user: userData,
              },
              (response) => {
                console.log(
                  "Chrome Extension API 응답 (이메일 로그인):",
                  response
                );
              }
            );
          }
        } catch (error) {
          console.log(
            "Chrome Extension API 직접 호출 실패 (이메일 로그인):",
            error
          );
        }

        // localStorage를 통한 메시지 전달 (백업 방법)
        try {
          localStorage.setItem(
            "extensionLoginSuccess",
            JSON.stringify({
              action: "loginSuccess",
              user: userData,
              timestamp: Date.now(),
            })
          );
          // 로그인 성공 시 로그아웃 플래그 제거
          localStorage.removeItem("extensionLoggedOut");
          console.log(
            "localStorage에 로그인 성공 메시지 저장 및 로그아웃 플래그 제거 (이메일 로그인)"
          );
        } catch (error) {
          console.log("localStorage 저장 실패 (이메일 로그인):", error);
        }

        // 성공 메시지 표시
        statusEl.innerHTML = `
          <svg viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          이메일 로그인 성공! 확장 프로그램으로 돌아가세요
        `;
        statusEl.className = "status-badge authenticated";

        // 닫기 버튼 표시
        showCloseButton();

        // 3초 후 페이지 닫기
        setTimeout(() => {
          window.close();
        }, 3000);
      } else {
        console.log(
          "일반 이메일 로그인 완료 - 확장 프로그램으로 메시지 전송하지 않음"
        );
        statusEl.innerHTML = `
          <svg viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          이메일 로그인 성공!
        `;
        statusEl.className = "status-badge authenticated";
      }
    } catch (error) {
      console.error("이메일 로그인 오류:", error);

      let errorMessage = "로그인에 실패했습니다.";
      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "등록되지 않은 이메일입니다.";
          break;
        case "auth/wrong-password":
          errorMessage = "비밀번호가 올바르지 않습니다.";
          break;
        case "auth/invalid-email":
          errorMessage = "올바르지 않은 이메일 형식입니다.";
          break;
        case "auth/too-many-requests":
          errorMessage =
            "너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.";
          break;
        default:
          errorMessage = `로그인 실패: ${error.message}`;
      }

      alert(errorMessage);
    } finally {
      emailLoginBtn.disabled = false;
      emailLoginBtn.textContent = "이메일로 로그인";
    }
  });
}

// 회원가입 링크 클릭
if (signupLink) {
  signupLink.addEventListener("click", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      alert("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    if (password.length < 6) {
      alert("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    try {
      emailLoginBtn.disabled = true;
      emailLoginBtn.textContent = "회원가입 중...";

      // 회원가입 시도
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("회원가입 성공:", userCredential);

      // URL 파라미터 확인
      const urlParams = new URLSearchParams(window.location.search);
      const source = urlParams.get("source");
      const action = urlParams.get("action");

      // 확장 프로그램에서 온 요청인 경우에만 메시지 전달
      if (source === "extension" && action === "login") {
        console.log("확장 프로그램 회원가입 요청 처리");

        const userData = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL,
          emailVerified: userCredential.user.emailVerified,
        };

        // Chrome Extension API를 통해 메시지 전송 시도
        try {
          if (window.chrome && window.chrome.runtime) {
            chrome.runtime.sendMessage(
              {
                action: "loginSuccess",
                user: userData,
              },
              (response) => {
                console.log("Chrome Extension API 응답 (회원가입):", response);
              }
            );
          }
        } catch (error) {
          console.log("Chrome Extension API 직접 호출 실패 (회원가입):", error);
        }

        // localStorage를 통한 메시지 전달 (백업 방법)
        try {
          localStorage.setItem(
            "extensionLoginSuccess",
            JSON.stringify({
              action: "loginSuccess",
              user: userData,
              timestamp: Date.now(),
            })
          );
          // 로그인 성공 시 로그아웃 플래그 제거
          localStorage.removeItem("extensionLoggedOut");
          console.log(
            "localStorage에 로그인 성공 메시지 저장 및 로그아웃 플래그 제거 (회원가입)"
          );
        } catch (error) {
          console.log("localStorage 저장 실패 (회원가입):", error);
        }

        // 성공 메시지 표시
        statusEl.innerHTML = `
          <svg viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          회원가입 성공! 자동으로 로그인되었습니다. 확장 프로그램으로 돌아가세요
        `;
        statusEl.className = "status-badge authenticated";

        // 닫기 버튼 표시
        showCloseButton();

        // 3초 후 페이지 닫기
        setTimeout(() => {
          window.close();
        }, 3000);
      } else {
        console.log(
          "일반 회원가입 완료 - 확장 프로그램으로 메시지 전송하지 않음"
        );
        statusEl.innerHTML = `
          <svg viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          회원가입 성공! 자동으로 로그인되었습니다.
        `;
        statusEl.className = "status-badge authenticated";
      }
    } catch (error) {
      console.error("회원가입 오류:", error);

      let errorMessage = "회원가입에 실패했습니다.";
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "이미 사용 중인 이메일입니다.";
          break;
        case "auth/invalid-email":
          errorMessage = "올바르지 않은 이메일 형식입니다.";
          break;
        case "auth/weak-password":
          errorMessage =
            "비밀번호가 너무 약합니다. 더 강한 비밀번호를 사용해주세요.";
          break;
        default:
          errorMessage = `회원가입 실패: ${error.message}`;
      }

      alert(errorMessage);
    } finally {
      emailLoginBtn.disabled = false;
      emailLoginBtn.textContent = "이메일로 로그인";
    }
  });
}

// 로그아웃 버튼 클릭 (동적으로 생성된 버튼에 이벤트 위임)
document.addEventListener("click", async (e) => {
  if (e.target.id === "signout-btn") {
    console.log("Manual sign-out button clicked");
    try {
      e.target.disabled = true;
      e.target.textContent = "로그아웃 중...";

      // Firebase Auth에서 로그아웃
      await signOut(auth);
      console.log("Manual sign-out successful");

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
      keysToRemove.forEach((key) => localStorage.removeItem(key));
      console.log("localStorage cleaned after signout");

      // UI 업데이트
      updateUIForLogout();
    } catch (error) {
      console.error("Manual sign-out error:", error);
      alert("로그아웃 중 오류가 발생했습니다: " + error.message);
    } finally {
      e.target.disabled = false;
      e.target.textContent = "로그아웃";
    }
  }
});

// 로그아웃 후 UI 업데이트 함수
function updateUIForLogout() {
  console.log("Updating UI for logout state");

  // 상태 배지 업데이트
  if (statusEl) {
    statusEl.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
      </svg>
      로그아웃됨
    `;
    statusEl.className = "status-badge unauthenticated";
  }

  // 로그인 폼 표시
  if (loginFormEl) {
    loginFormEl.style.display = "block";
  }

  // 사용자 정보 숨기기
  if (userInfoEl) {
    userInfoEl.style.display = "none";
  }

  // 북마크 목록 숨기기
  const bookmarksList = document.getElementById("bookmarksList");
  if (bookmarksList) {
    bookmarksList.style.display = "none";
  }

  // 입력 필드 초기화
  if (emailInput) emailInput.value = "";
  if (passwordInput) passwordInput.value = "";
}

// 북마크 저장 함수
async function saveBookmark(bookmarkData) {
  console.log("=== SAVING BOOKMARK ===", bookmarkData);

  try {
    // 사용자 인증 확인
    const user = auth.currentUser;
    if (!user) {
      throw new Error("사용자가 로그인되지 않았습니다.");
    }

    // 북마크 데이터 준비
    const bookmark = {
      title: bookmarkData.title || "",
      description: bookmarkData.description || "",
      url: bookmarkData.url || "",
      pageTitle: bookmarkData.pageTitle || bookmarkData.title || "",
      userId: user.uid,
      collection: bookmarkData.collection || "",
      tags: bookmarkData.tags || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    console.log("=== PREPARED BOOKMARK DATA ===", bookmark);

    // Firestore에 저장
    const docRef = await addDoc(collection(db, "bookmarks"), bookmark);
    console.log("=== BOOKMARK SAVED SUCCESSFULLY ===", docRef.id);

    // 저장된 북마크 반환
    return {
      success: true,
      bookmark: {
        id: docRef.id,
        ...bookmark,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("=== BOOKMARK SAVE ERROR ===", error);
    throw new Error("북마크 저장에 실패했습니다: " + error.message);
  }
}

// 컬렉션 로드 함수
async function loadCollections(userId) {
  console.log("=== LOADING COLLECTIONS ===", userId);

  try {
    // Firebase 초기화 상태 확인
    if (!db) {
      throw new Error("Firestore database is not initialized");
    }

    // 사용자 인증 확인
    const user = auth.currentUser;
    if (!user) {
      console.error("=== NO CURRENT USER ===");
      throw new Error("사용자가 로그인되지 않았습니다.");
    }

    // 사용자 ID 일치 확인
    if (user.uid !== userId) {
      console.error("=== USER ID MISMATCH ===", {
        currentUserUid: user.uid,
        requestedUserId: userId,
      });
      throw new Error("사용자 ID가 일치하지 않습니다.");
    }

    console.log("=== USER AUTHENTICATED ===", {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
    });

    // 컬렉션 쿼리
    console.log("=== CREATING FIRESTORE QUERY ===");
    const q = query(
      collection(db, "collections"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    console.log("=== EXECUTING FIRESTORE QUERY ===");
    const querySnapshot = await getDocs(q);
    console.log("=== QUERY EXECUTED ===", {
      size: querySnapshot.size,
      empty: querySnapshot.empty,
    });

    const collections = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      collections.push({
        id: doc.id,
        name: data.name || "",
        icon: data.icon || "",
        userId: data.userId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });

    console.log("=== COLLECTIONS LOADED SUCCESSFULLY ===", {
      count: collections.length,
      collections: collections,
    });

    return collections;
  } catch (error) {
    console.error("=== COLLECTIONS LOAD ERROR ===", {
      message: error.message,
      code: error.code,
      stack: error.stack,
      name: error.name,
    });
    return [];
  }
}

// 컬렉션 생성 함수
async function createCollection(collectionData) {
  console.log("=== CREATING COLLECTION ===", collectionData);

  try {
    // 사용자 인증 확인
    const user = auth.currentUser;
    if (!user) {
      throw new Error("사용자가 로그인되지 않았습니다.");
    }

    // 필수 필드 검증
    if (!collectionData.name || collectionData.name.trim() === "") {
      throw new Error("컬렉션 이름은 필수입니다.");
    }

    // 컬렉션 데이터 준비
    const newCollection = {
      name: collectionData.name.trim(),
      icon: collectionData.icon || "📁",
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Firestore에 컬렉션 추가
    const docRef = await addDoc(collection(db, "collections"), newCollection);

    const createdCollection = {
      id: docRef.id,
      name: newCollection.name,
      icon: newCollection.icon,
      userId: newCollection.userId,
      createdAt: newCollection.createdAt,
      updatedAt: newCollection.updatedAt,
    };

    console.log("=== COLLECTION CREATED SUCCESSFULLY ===", createdCollection);
    return createdCollection;
  } catch (error) {
    console.error("=== COLLECTION CREATION ERROR ===", error);
    throw new Error("컬렉션 생성에 실패했습니다: " + error.message);
  }
}

// 메시지 수신 처리 (개선된 버전)
window.addEventListener("message", async function ({ data, origin }) {
  console.log("=== FIREBASE RECEIVED MESSAGE ===", {
    data: data,
    origin: origin,
    parentFrame: PARENT_FRAME,
    isExpectedOrigin: origin === PARENT_FRAME,
    timestamp: new Date().toISOString(),
  });

  // Chrome Extension의 React DevTools나 기타 내부 메시지 필터링
  if (
    data &&
    (data.source === "react-devtools-content-script" || data.hello === true)
  ) {
    console.log("Ignoring React DevTools or internal message");
    return;
  }

  // 보안을 위해 origin 확인 (standalone 모드에서는 PARENT_FRAME이 null일 수 있음)
  if (PARENT_FRAME && origin !== PARENT_FRAME) {
    console.log(
      "Ignoring message from unauthorized origin:",
      origin,
      "Expected:",
      PARENT_FRAME
    );
    return;
  }

  // Standalone 모드 (Firebase 호스팅에서 직접 실행)에서는 origin 검사를 완화
  if (!PARENT_FRAME && !origin.includes("chrome-extension://")) {
    console.log("Running in standalone mode, accepting message from:", origin);
  }

  if (data.initAuth) {
    console.log("Received initAuth request");

    // 중복 요청 방지
    if (isProcessingAuth) {
      console.log("Auth request already in progress, ignoring");
      return;
    }

    isProcessingAuth = true;

    try {
      // 현재 인증 상태 확인
      const currentUser = auth.currentUser;
      if (currentUser) {
        console.log("User already authenticated:", currentUser);
        sendResponse({ user: currentUser });
        isProcessingAuth = false;
        return;
      }

      // 새로운 인증 시도
      console.log("Starting new authentication process");
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
        case "auth/user-disabled":
          errorMessage = "비활성화된 계정입니다.";
          break;
        case "auth/invalid-email":
          errorMessage = "잘못된 이메일 주소입니다.";
          break;
        case "auth/operation-not-allowed":
          errorMessage = "Google 로그인이 비활성화되어 있습니다.";
          break;
        case "auth/unauthorized-domain":
          errorMessage = "이 도메인에서 인증이 허용되지 않습니다.";
          break;
        case "auth/account-exists-with-different-credential":
          errorMessage = "다른 방법으로 가입된 계정입니다.";
          break;
        case "auth/credential-already-in-use":
          errorMessage = "이미 사용 중인 계정입니다.";
          break;
        case "auth/weak-password":
          errorMessage = "비밀번호가 너무 약합니다.";
          break;
        case "auth/user-not-found":
          errorMessage = "존재하지 않는 계정입니다.";
          break;
        case "auth/wrong-password":
          errorMessage = "잘못된 비밀번호입니다.";
          break;
        case "auth/email-already-in-use":
          errorMessage = "이미 사용 중인 이메일입니다.";
          break;
        case "auth/invalid-credential":
          errorMessage = "잘못된 인증 정보입니다.";
          break;
        case "auth/invalid-verification-code":
          errorMessage = "잘못된 인증 코드입니다.";
          break;
        case "auth/invalid-verification-id":
          errorMessage = "잘못된 인증 ID입니다.";
          break;
        case "auth/quota-exceeded":
          errorMessage = "요청 한도를 초과했습니다.";
          break;
        case "auth/app-not-authorized":
          errorMessage = "앱이 인증되지 않았습니다.";
          break;
        case "auth/captcha-check-failed":
          errorMessage = "캡차 확인에 실패했습니다.";
          break;
        case "auth/invalid-app-credential":
          errorMessage = "잘못된 앱 인증 정보입니다.";
          break;
        case "auth/session-expired":
          errorMessage = "세션이 만료되었습니다.";
          break;
        case "auth/tenant-id-mismatch":
          errorMessage = "테넌트 ID가 일치하지 않습니다.";
          break;
        case "auth/unsupported-persistence-type":
          errorMessage = "지원되지 않는 지속성 유형입니다.";
          break;
        case "auth/requires-recent-login":
          errorMessage = "최근 로그인이 필요합니다.";
          break;
        default:
          errorMessage =
            error.message || "알 수 없는 인증 오류가 발생했습니다.";
      }

      sendResponse({ error: errorMessage });
    } finally {
      isProcessingAuth = false;
    }
  } else if (data.signOut) {
    console.log("Received signOut request");

    try {
      // Firebase Auth에서 로그아웃
      await signOut(auth);
      console.log("Sign out successful");

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
      keysToRemove.forEach((key) => localStorage.removeItem(key));
      console.log("localStorage cleaned after signout");

      // UI 업데이트
      updateUIForLogout();

      sendResponse({ success: true });
    } catch (error) {
      console.error("Sign out error:", error);
      sendResponse({
        error: "로그아웃 중 오류가 발생했습니다: " + error.message,
      });
    }
  } else if (data.saveBookmark) {
    console.log("Received saveBookmark request", data);
    let result;
    try {
      result = await saveBookmark(data.bookmark);
      result.msgId = data.msgId; // 응답 식별자 포함
    } catch (error) {
      result = { error: error.message, msgId: data.msgId };
    }
    // 응답 전송
    window.parent.postMessage(JSON.stringify(result), PARENT_FRAME);
    return;
  } else if (data.getCollections) {
    console.log("Received getCollections request", data);
    let result;
    try {
      const collections = await loadCollections(data.userId);
      result = {
        success: true,
        collections: collections,
        msgId: data.msgId,
      };
    } catch (error) {
      result = { error: error.message, msgId: data.msgId };
    }
    // 응답 전송
    window.parent.postMessage(JSON.stringify(result), PARENT_FRAME);
    return;
  } else if (data.createCollection) {
    console.log("Received createCollection request", data);
    let result;
    try {
      const collection = await createCollection(data.collection);
      result = {
        success: true,
        collection: collection,
        msgId: data.msgId,
      };
    } catch (error) {
      result = { error: error.message, msgId: data.msgId };
    }
    // 응답 전송
    window.parent.postMessage(JSON.stringify(result), PARENT_FRAME);
    return;
  }
});

// 페이지 로드 완료 시 준비 상태 알림 (자동 로그인 비활성화)
window.addEventListener("load", async () => {
  console.log("Firebase auth page loaded and ready");

  // 리다이렉트 로그인 결과 확인
  try {
    const { getRedirectResult } = await import(
      "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js"
    );
    const redirectResult = await getRedirectResult(auth);
    if (redirectResult) {
      console.log("리다이렉트 로그인 성공:", redirectResult);

      // 확장 프로그램 요청인 경우 처리
      const urlParams = new URLSearchParams(window.location.search);
      const source = urlParams.get("source");
      const action = urlParams.get("action");

      if (source === "extension" && action === "login") {
        console.log("확장 프로그램 리다이렉트 로그인 요청 처리");

        const userData = {
          uid: redirectResult.user.uid,
          email: redirectResult.user.email,
          displayName: redirectResult.user.displayName,
          photoURL: redirectResult.user.photoURL,
          emailVerified: redirectResult.user.emailVerified,
        };

        // Chrome Extension API를 통해 메시지 전송 시도
        try {
          if (window.chrome && window.chrome.runtime) {
            chrome.runtime.sendMessage(
              {
                action: "loginSuccess",
                user: userData,
              },
              (response) => {
                console.log(
                  "Chrome Extension API 응답 (리다이렉트 로그인):",
                  response
                );
              }
            );
          }
        } catch (error) {
          console.log(
            "Chrome Extension API 직접 호출 실패 (리다이렉트 로그인):",
            error
          );
        }

        // localStorage를 통한 메시지 전달
        try {
          localStorage.setItem(
            "extensionLoginSuccess",
            JSON.stringify({
              action: "loginSuccess",
              user: userData,
              timestamp: Date.now(),
            })
          );
          localStorage.removeItem("extensionLoggedOut");
          console.log("localStorage에 리다이렉트 로그인 성공 메시지 저장");
        } catch (error) {
          console.log("localStorage 저장 실패 (리다이렉트 로그인):", error);
        }

        // 성공 메시지 표시
        statusEl.innerHTML = `
          <svg viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          로그인 성공! 확장 프로그램으로 돌아가세요
        `;
        statusEl.className = "status-badge authenticated";

        // 닫기 버튼 표시
        showCloseButton();
      }
    }
  } catch (error) {
    console.log("리다이렉트 결과 확인 중 오류:", error);
  }

  // 확장 프로그램의 로그아웃 상태 확인 (여러 방법으로 시도)
  try {
    let shouldForceLogout = false;

    // 1. localStorage에서 플래그 확인
    const extensionLogoutFlag = localStorage.getItem("extensionLoggedOut");
    if (extensionLogoutFlag === "true") {
      console.log("localStorage에서 확장 프로그램 로그아웃 플래그 발견");
      shouldForceLogout = true;
    }

    // 2. sessionStorage에서도 확인
    const sessionLogoutFlag = sessionStorage.getItem("extensionLoggedOut");
    if (sessionLogoutFlag === "true") {
      console.log("sessionStorage에서 확장 프로그램 로그아웃 플래그 발견");
      shouldForceLogout = true;
    }

    // 3. URL 파라미터로 강제 로그아웃 확인
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("forceLogout") === "true") {
      console.log("URL 파라미터로 강제 로그아웃 요청됨");
      shouldForceLogout = true;
    }

    if (shouldForceLogout) {
      console.log("강제 로그아웃 실행 시작");

      // Firebase에서 로그아웃
      if (auth.currentUser) {
        await signOut(auth);
        console.log("Firebase 로그아웃 완료");
      }

      // 모든 Firebase 관련 데이터 완전 정리
      await clearAllFirebaseData();

      // URL에서 forceLogout 파라미터 제거
      if (urlParams.get("forceLogout") === "true") {
        urlParams.delete("forceLogout");
        const newUrl = new URL(window.location.href);
        newUrl.search = urlParams.toString();
        window.history.replaceState({}, "", newUrl.toString());
      }

      console.log("강제 로그아웃 완료");
    }
  } catch (error) {
    console.log("확장 프로그램 로그아웃 상태 확인 중 오류:", error);
  }

  // 현재 로그인 상태 확인만 하고 자동 처리하지 않음
  const currentUser = auth.currentUser;
  console.log("Current user on page load:", currentUser);
  console.log("자동 로그인 처리 비활성화됨 - 수동 로그인 버튼 클릭 필요");

  // 약간의 지연 후 준비 메시지 전송
  setTimeout(() => {
    sendReadyMessage();
  }, 500);
});

// DOMContentLoaded 이벤트에서도 준비 상태 알림
document.addEventListener("DOMContentLoaded", () => {
  console.log("Firebase auth page DOM loaded");
  sendReadyMessage();
});

// 추가로 2초 후에도 준비 메시지 전송 (중복 방지)
setTimeout(() => {
  console.log("Sending delayed ready message");
  sendReadyMessage();
}, 2000);

// Firebase 관련 데이터 완전 정리 함수
async function clearAllFirebaseData() {
  console.log("모든 Firebase 데이터 정리 시작");

  // localStorage 정리 (더 포괄적으로)
  const localKeysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key &&
      (key.includes("firebase:") ||
        key.includes("extensionLogin") ||
        key.includes("extensionLoggedOut") ||
        key.startsWith("firebase") ||
        key.includes("authUser") ||
        key.includes("heartbeat") ||
        key.includes("host:") ||
        key.includes("appCheck") ||
        key.includes("analytics"))
    ) {
      localKeysToRemove.push(key);
    }
  }
  localKeysToRemove.forEach((key) => {
    localStorage.removeItem(key);
    console.log("localStorage에서 제거:", key);
  });

  // sessionStorage 정리
  const sessionKeysToRemove = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (
      key &&
      (key.includes("firebase:") ||
        key.includes("extensionLogin") ||
        key.includes("extensionLoggedOut") ||
        key.startsWith("firebase"))
    ) {
      sessionKeysToRemove.push(key);
    }
  }
  sessionKeysToRemove.forEach((key) => {
    sessionStorage.removeItem(key);
    console.log("sessionStorage에서 제거:", key);
  });

  // IndexedDB 정리 시도
  try {
    if (window.indexedDB && indexedDB.databases) {
      const databases = await indexedDB.databases();
      for (const db of databases) {
        if (
          db.name &&
          (db.name.includes("firebase") ||
            db.name.includes("firebaseLocalStorage"))
        ) {
          indexedDB.deleteDatabase(db.name);
          console.log("IndexedDB 삭제:", db.name);
        }
      }
    }
  } catch (error) {
    console.log("IndexedDB 정리 중 오류:", error);
  }

  // 쿠키 정리 시도
  try {
    if (document.cookie) {
      const cookies = document.cookie.split(";");
      for (let cookie of cookies) {
        const eqPos = cookie.indexOf("=");
        const name =
          eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name.includes("firebase") || name.includes("__session")) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          console.log("쿠키 삭제:", name);
        }
      }
    }
  } catch (error) {
    console.log("쿠키 정리 중 오류:", error);
  }

  console.log("모든 Firebase 데이터 정리 완료");
}

console.log("Firebase auth script loaded completely");
