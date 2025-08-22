import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
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

// Google 로그인 설정
PROVIDER.setCustomParameters({
  prompt: "select_account",
});

console.log("Firebase Auth initialized:", auth);

// UI 요소들
const statusEl = document.getElementById("status");
const signinBtn = document.getElementById("signin-btn");
const signoutBtn = document.getElementById("signout-btn");
const userInfoEl = document.getElementById("user-info");
const loginFormEl = document.getElementById("login-form");

// 인증 상태 변경 감지
onAuthStateChanged(auth, async (user) => {
  console.log("Auth state changed:", user);

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

    // 사용자 정보를 부모 창에 전송
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          user: {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified,
          },
        },
        "*"
      );
    }
  } else {
    // 로그아웃된 상태
    statusEl.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
      로그아웃됨
    `;
    statusEl.className = "status-badge unauthenticated";

    // 로그인 폼 보이기
    loginFormEl.style.display = "block";
    userInfoEl.style.display = "none";

    // 로그아웃 상태를 부모 창에 전송
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          user: null,
        },
        "*"
      );
    }
  }
});

// 로그인 버튼 클릭
signinBtn.addEventListener("click", async () => {
  console.log("Manual sign-in button clicked");
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
    const result = await signInWithPopup(auth, PROVIDER);
    console.log("Manual sign-in successful:", result);
  } catch (error) {
    console.error("Manual sign-in error:", error);
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

// 로그아웃 버튼 클릭 (이벤트 위임 사용)
document.addEventListener("click", async (event) => {
  if (event.target && event.target.id === "signout-btn") {
    console.log("Manual sign-out button clicked");
    const logoutBtn = event.target;
    try {
      logoutBtn.disabled = true;
      logoutBtn.textContent = "로그아웃 중...";
      await signOut(auth);
      console.log("Manual sign-out successful");
    } catch (error) {
      console.error("Manual sign-out error:", error);
    } finally {
      logoutBtn.disabled = false;
      logoutBtn.textContent = "로그아웃";
    }
  }
});

// Chrome Extension 통신
let PARENT_FRAME = null;
let isProcessingAuth = false; // 중복 요청 방지
let isProcessingBookmark = false; // 북마크 저장 중복 요청 방지

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

        // 재시도 로직으로 안정성 향상
        for (let i = 0; i < 3; i++) {
          try {
            window.parent.postMessage(
              JSON.stringify(responseData),
              PARENT_FRAME
            );
            console.log(`Success response sent (attempt ${i + 1})`);
            break;
          } catch (e) {
            console.error(
              `Failed to send success response (attempt ${i + 1}):`,
              e
            );
            if (i === 2) throw e;
          }
        }
      } else {
        // 오류 처리
        const errorMessage =
          result?.message || result?.code || "알 수 없는 오류가 발생했습니다.";
        const responseData = { error: errorMessage };
        console.log("Sending error response:", responseData);

        // 재시도 로직으로 안정성 향상
        for (let i = 0; i < 3; i++) {
          try {
            window.parent.postMessage(
              JSON.stringify(responseData),
              PARENT_FRAME
            );
            console.log(`Error response sent (attempt ${i + 1})`);
            break;
          } catch (e) {
            console.error(
              `Failed to send error response (attempt ${i + 1}):`,
              e
            );
            if (i === 2) throw e;
          }
        }
      }
    } catch (e) {
      console.error("Error sending response:", e);
      const errorResponse = { error: "응답 전송 중 오류가 발생했습니다." };
      window.parent.postMessage(JSON.stringify(errorResponse), PARENT_FRAME);
    }
  } else {
    console.log("No parent frame detected, running in standalone mode");
  }
}

// 준비 메시지 전송 함수
function sendReadyMessage() {
  if (PARENT_FRAME) {
    try {
      console.log("Sending ready message to parent frame");
      window.parent.postMessage(JSON.stringify({ ready: true }), PARENT_FRAME);
      console.log("Ready message sent successfully");
    } catch (e) {
      console.error("Could not send ready message to parent frame:", e);
    }
  }
}

// 북마크 저장 함수
async function saveBookmark(bookmarkData) {
  try {
    console.log("=== SAVING BOOKMARK TO FIRESTORE ===", bookmarkData);

    // Firestore에 북마크 저장
    const docRef = await addDoc(collection(db, "bookmarks"), {
      title: bookmarkData.title,
      url: bookmarkData.url,
      description: bookmarkData.description || "",
      pageTitle: bookmarkData.pageTitle || bookmarkData.title,
      userId: bookmarkData.userId,
      collection: bookmarkData.collection || null,
      tags: bookmarkData.tags || [],
      createdAt: new Date(bookmarkData.createdAt),
      updatedAt: new Date(),
    });

    console.log("=== BOOKMARK SAVED SUCCESSFULLY ===", docRef.id);

    return {
      success: true,
      bookmarkId: docRef.id,
      message: "북마크가 성공적으로 저장되었습니다.",
    };
  } catch (error) {
    console.error("=== BOOKMARK SAVE ERROR ===", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// 컬렉션 목록 가져오기
async function loadCollections(userId) {
  try {
    console.log("=== LOADING COLLECTIONS FOR USER ===", userId);

    const q = query(
      collection(db, "collections"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
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

    console.log("=== COLLECTIONS LOADED SUCCESSFULLY ===", collections);

    return collections;
  } catch (error) {
    console.error("=== COLLECTIONS LOAD ERROR ===", error);
    return [];
  }
}

window.addEventListener("message", async function ({ data, origin }) {
  console.log("=== FIREBASE RECEIVED MESSAGE ===", {
    data: data,
    origin: origin,
    parentFrame: PARENT_FRAME,
    isExpectedOrigin: origin === PARENT_FRAME,
    timestamp: new Date().toISOString(),
  });

  // 보안을 위해 origin 확인
  if (origin !== PARENT_FRAME) {
    console.log(
      "Ignoring message from unauthorized origin:",
      origin,
      "Expected:",
      PARENT_FRAME
    );
    return;
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
        default:
          errorMessage =
            error.message || "알 수 없는 인증 오류가 발생했습니다.";
      }

      sendResponse({ error: errorMessage });
    } finally {
      isProcessingAuth = false;
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
  }
});

// 페이지 로드 완료 시 준비 상태 알림
window.addEventListener("load", () => {
  console.log("Firebase auth page loaded and ready");
  sendReadyMessage();
});

// DOMContentLoaded 이벤트에서도 준비 상태 알림
document.addEventListener("DOMContentLoaded", () => {
  console.log("Firebase auth page DOM loaded");
  sendReadyMessage();
});

// 추가로 1초 후에도 준비 메시지 전송
setTimeout(() => {
  console.log("Sending delayed ready message");
  sendReadyMessage();
}, 1000);

console.log("Firebase auth script loaded completely");
