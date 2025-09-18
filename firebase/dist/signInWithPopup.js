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

// 인증 상태 변경 감지
onAuthStateChanged(auth, (user) => {
  console.log("Auth state changed:", user);

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
  console.log("Manual sign-in button clicked");
  try {
    signinBtn.disabled = true;
    signinBtn.textContent = "로그인 중...";
    const result = await signInWithPopup(auth, PROVIDER);
    console.log("Manual sign-in successful:", result);
  } catch (error) {
    console.error("Manual sign-in error:", error);
    statusEl.textContent = `로그인 실패: ${error.message}`;
    statusEl.className = "status unauthenticated";
  } finally {
    signinBtn.disabled = false;
    signinBtn.textContent = "Google로 로그인";
  }
});

// 로그아웃 버튼 클릭
signoutBtn.addEventListener("click", async () => {
  console.log("Manual sign-out button clicked");
  try {
    signoutBtn.disabled = true;
    signoutBtn.textContent = "로그아웃 중...";
    await signOut(auth);
    console.log("Manual sign-out successful");
  } catch (error) {
    console.error("Manual sign-out error:", error);
  } finally {
    signoutBtn.disabled = false;
    signoutBtn.textContent = "로그아웃";
  }
});

// Chrome Extension 통신 (개선된 버전)
let PARENT_FRAME = null;
let isProcessingAuth = false; // 중복 요청 방지
let readyMessageSent = false; // 준비 메시지 전송 상태

// 부모 프레임 origin을 찾는 함수 (개선된 버전)
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

// 메시지 수신 처리 (개선된 버전)
window.addEventListener("message", async function ({ data, origin }) {
  console.log("Received message:", {
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

// 페이지 로드 완료 시 준비 상태 알림 (개선된 버전)
window.addEventListener("load", () => {
  console.log("Firebase auth page loaded and ready");
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

console.log("Firebase auth script loaded completely");
