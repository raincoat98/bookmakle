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
  limit,
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
const bookmarksList = document.getElementById("bookmarksList");

// 인증 상태 변경 감지
onAuthStateChanged(auth, async (user) => {
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

    // 북마크 로드
    const bookmarks = await loadBookmarks(user.uid);
    displayBookmarks(bookmarks);
  } else {
    // 로그아웃된 상태
    statusEl.textContent = "로그아웃됨";
    statusEl.className = "status unauthenticated";
    signinBtn.style.display = "inline-block";
    signoutBtn.style.display = "none";
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

    bookmarksList.innerHTML = "<p>로그인 후 북마크를 확인하세요.</p>";
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

// 기본 컬렉션 데이터
const defaultCollections = [
  {
    name: "업무",
    icon: "💼",
    description: "업무 관련 북마크",
  },
  {
    name: "개인",
    icon: "🏠",
    description: "개인 관련 북마크",
  },
  {
    name: "학습",
    icon: "📚",
    description: "학습 관련 북마크",
  },
  {
    name: "즐겨찾기",
    icon: "⭐",
    description: "자주 사용하는 북마크",
  },
  {
    name: "개발",
    icon: "💻",
    description: "개발 관련 북마크",
  },
  {
    name: "디자인",
    icon: "🎨",
    description: "디자인 관련 북마크",
  },
];

// 기본 컬렉션 생성 함수
async function createDefaultCollections(userId) {
  try {
    console.log("=== CREATING DEFAULT COLLECTIONS FOR USER ===", userId);

    for (const collectionData of defaultCollections) {
      const docRef = await addDoc(collection(db, "collections"), {
        name: collectionData.name,
        icon: collectionData.icon,
        description: collectionData.description,
        userId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log(
        `=== COLLECTION CREATED: ${collectionData.name} (ID: ${docRef.id}) ===`
      );
    }

    console.log("=== ALL DEFAULT COLLECTIONS CREATED SUCCESSFULLY ===");
    return true;
  } catch (error) {
    console.error("=== ERROR CREATING DEFAULT COLLECTIONS ===", error);
    return false;
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

    // 컬렉션이 없으면 기본 컬렉션 생성
    if (collections.length === 0) {
      console.log("=== NO COLLECTIONS FOUND, CREATING DEFAULT ONES ===");
      await createDefaultCollections(userId);

      // 다시 컬렉션 로드
      const newQuerySnapshot = await getDocs(q);
      newQuerySnapshot.forEach((doc) => {
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
    }

    return collections;
  } catch (error) {
    console.error("=== COLLECTIONS LOAD ERROR ===", error);
    return [];
  }
}

// 북마크 목록 가져오기
async function loadBookmarks(userId) {
  try {
    const q = query(
      collection(db, "bookmarks"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const querySnapshot = await getDocs(q);
    const bookmarks = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      bookmarks.push({
        id: doc.id,
        title: data.title,
        url: data.url,
        description: data.description || "",
        pageTitle: data.pageTitle || data.title,
        userId: data.userId,
        collection: data.collection || null,
        tags: data.tags || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });

    return bookmarks;
  } catch (error) {
    console.error("북마크 로드 오류:", error);
    return [];
  }
}

// 북마크 목록 표시
function displayBookmarks(bookmarks) {
  bookmarksList.innerHTML = "";

  if (bookmarks.length === 0) {
    bookmarksList.innerHTML = "<p>저장된 북마크가 없습니다.</p>";
    return;
  }

  bookmarks.forEach((bookmark) => {
    const bookmarkElement = document.createElement("div");
    bookmarkElement.className = "bookmark-item";
    bookmarkElement.innerHTML = `
      <h3>${bookmark.title}</h3>
      <p><a href="${bookmark.url}" target="_blank">${bookmark.url}</a></p>
      ${bookmark.description ? `<p>${bookmark.description}</p>` : ""}
      ${
        bookmark.collection
          ? `<p><strong>컬렉션:</strong> ${bookmark.collection}</p>`
          : ""
      }
      ${
        bookmark.tags && bookmark.tags.length > 0
          ? `<p><strong>태그:</strong> ${bookmark.tags.join(", ")}</p>`
          : ""
      }
      <small>저장일: ${bookmark.createdAt.toDate().toLocaleString()}</small>
    `;
    bookmarksList.appendChild(bookmarkElement);
  });
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
  } else if (data.createDefaultCollections) {
    console.log("Received createDefaultCollections request", data);
    let result;
    try {
      const success = await createDefaultCollections(data.userId);
      result = {
        success: success,
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
