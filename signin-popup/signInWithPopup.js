import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  signInWithCustomToken,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "./config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Persistence 설정
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Failed to set persistence:", error);
});

// 부모(= offscreen 문서) 오리진
const PARENT_ORIGIN = document.location.ancestorOrigins?.[0] || "*";

function send(result) {
  // 부모(offscreen)로 결과 전달 → background → popup
  console.log("Sending result to parent:", result);
  window.parent.postMessage(JSON.stringify(result), PARENT_ORIGIN);
}

window.addEventListener("message", async (ev) => {
  console.log("Received message:", ev.data);

  if (ev.data?.initAuth) {
    console.log("Starting Firebase Auth...");
    try {
      const userCredential = await signInWithPopup(auth, provider);
      console.log("Auth successful:", userCredential.user);

      // ID 토큰 가져오기
      const idToken = await userCredential.user.getIdToken();

      send({
        user: toSafeUser(userCredential.user),
        idToken: idToken,
        userCredential: { user: toSafeUser(userCredential.user) },
      });
    } catch (e) {
      console.error("Auth error:", e);
      send({
        name: e.name || "FirebaseError",
        code: e.code,
        message: e.message,
      });
    }
  }

  // 컬렉션 데이터 요청
  if (ev.data?.getCollections) {
    console.log("Getting collections request received");
    try {
      // 현재 로그인된 사용자 확인
      let currentUser = auth.currentUser;

      // 현재 사용자가 없으면 세션 복원 대기
      if (!currentUser) {
        console.log("Waiting for auth state restoration...");
        currentUser = await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            console.log("Auth state restoration timeout");
            resolve(auth.currentUser);
          }, 3000);

          // 먼저 현재 상태 확인
          if (auth.currentUser) {
            clearTimeout(timeout);
            resolve(auth.currentUser);
            return;
          }

          // 상태 변경 대기
          const unsubscribe = auth.onAuthStateChanged((user) => {
            console.log("Auth state changed:", user ? user.uid : "null");
            if (user) {
              clearTimeout(timeout);
              unsubscribe();
              resolve(user);
            }
          });
        });
      }

      if (!currentUser) {
        console.error("User not authenticated");
        send({
          type: "COLLECTIONS_ERROR",
          name: "AuthError",
          code: "auth/not-authenticated",
          message: "User is not authenticated. Please sign in first.",
        });
        return;
      }

      console.log(
        "Fetching collections for authenticated user:",
        currentUser.uid
      );
      const collections = await fetchCollections(currentUser.uid);
      console.log("Collections fetched:", collections.length);
      send({
        type: "COLLECTIONS_DATA",
        collections: collections,
      });
    } catch (e) {
      console.error("Collections fetch error:", e);
      send({
        type: "COLLECTIONS_ERROR",
        name: e.name || "FirestoreError",
        code: e.code,
        message: e.message,
      });
    }
  }

  // 북마크 데이터 요청
  if (ev.data?.getBookmarks) {
    console.log("Getting bookmarks, collection:", ev.data.collectionId);
    try {
      let currentUser = auth.currentUser;

      if (!currentUser) {
        currentUser = await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            resolve(auth.currentUser);
          }, 3000);

          if (auth.currentUser) {
            clearTimeout(timeout);
            resolve(auth.currentUser);
            return;
          }

          const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
              clearTimeout(timeout);
              unsubscribe();
              resolve(user);
            }
          });
        });
      }

      if (!currentUser) {
        send({
          type: "BOOKMARKS_ERROR",
          name: "AuthError",
          code: "auth/not-authenticated",
          message: "User is not authenticated. Please sign in first.",
        });
        return;
      }

      const bookmarks = await fetchBookmarks(
        currentUser.uid,
        ev.data.collectionId
      );
      console.log("Bookmarks fetched:", bookmarks.length);
      send({
        type: "BOOKMARKS_DATA",
        bookmarks: bookmarks,
        collectionId: ev.data.collectionId,
      });
    } catch (e) {
      console.error("Bookmarks fetch error:", e);
      send({
        type: "BOOKMARKS_ERROR",
        name: e.name || "FirestoreError",
        code: e.code,
        message: e.message,
      });
    }
  }

  // 북마크 저장 요청
  if (ev.data?.saveBookmark) {
    console.log("Saving bookmark");
    try {
      let currentUser = auth.currentUser;

      if (!currentUser) {
        currentUser = await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            resolve(auth.currentUser);
          }, 3000);

          if (auth.currentUser) {
            clearTimeout(timeout);
            resolve(auth.currentUser);
            return;
          }

          const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
              clearTimeout(timeout);
              unsubscribe();
              resolve(user);
            }
          });
        });
      }

      if (!currentUser) {
        send({
          type: "BOOKMARK_SAVE_ERROR",
          name: "AuthError",
          code: "auth/not-authenticated",
          message: "User is not authenticated. Please sign in first.",
        });
        return;
      }

      // 현재 로그인된 사용자의 ID로 북마크 데이터 업데이트
      const bookmarkData = {
        ...ev.data.bookmarkData,
        userId: currentUser.uid,
      };

      const bookmarkId = await saveBookmark(bookmarkData);
      console.log("Bookmark saved with ID:", bookmarkId);
      send({
        type: "BOOKMARK_SAVED",
        bookmarkId: bookmarkId,
      });
    } catch (e) {
      console.error("Bookmark save error:", e);
      send({
        type: "BOOKMARK_SAVE_ERROR",
        name: e.name || "FirestoreError",
        code: e.code,
        message: e.message,
      });
    }
  }
});

// 페이지 로드 완료 시 알림
console.log("SignIn popup page loaded, ready to receive messages");

function toSafeUser(user) {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

// Firestore에서 컬렉션 가져오기
async function fetchCollections(userId) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    const collectionsRef = collection(db, "collections");
    const q = query(collectionsRef, where("userId", "==", userId));

    const querySnapshot = await getDocs(q);
    const collections = [];

    querySnapshot.forEach((doc) => {
      collections.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // 클라이언트 측에서 정렬
    collections.sort((a, b) => (a.order || 0) - (b.order || 0));

    return collections;
  } catch (error) {
    console.error("Error fetching collections:", error);
    throw error;
  }
}

// Firestore에서 북마크 가져오기
async function fetchBookmarks(userId, collectionId = null) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    const bookmarksRef = collection(db, "bookmarks");
    let q;

    if (collectionId) {
      // 특정 컬렉션의 북마크만 가져오기
      q = query(
        bookmarksRef,
        where("userId", "==", userId),
        where("collectionId", "==", collectionId)
      );
    } else {
      // 모든 북마크 가져오기
      q = query(bookmarksRef, where("userId", "==", userId));
    }

    const querySnapshot = await getDocs(q);
    const bookmarks = [];

    querySnapshot.forEach((doc) => {
      bookmarks.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // 클라이언트 측에서 정렬
    bookmarks.sort((a, b) => (a.order || 0) - (b.order || 0));

    return bookmarks;
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    throw error;
  }
}

// Firestore에 북마크 저장
async function saveBookmark(bookmarkData) {
  if (!bookmarkData.userId) {
    throw new Error("User ID is required");
  }

  try {
    const bookmarksRef = collection(db, "bookmarks");

    // 북마크 데이터 준비
    const newBookmark = {
      userId: bookmarkData.userId,
      title: bookmarkData.title || "",
      url: bookmarkData.url || "",
      description: bookmarkData.description || "",
      collectionId: bookmarkData.collectionId || null,
      tags: bookmarkData.tags || [],
      favIconUrl: bookmarkData.favIconUrl || "",
      order: bookmarkData.order || 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Firestore에 저장
    const docRef = await addDoc(bookmarksRef, newBookmark);
    console.log("Bookmark saved with ID:", docRef.id);

    return docRef.id;
  } catch (error) {
    console.error("Error saving bookmark:", error);
    throw error;
  }
}

// ============================================
// UI 제어 코드
// ============================================

// DOM이 로드될 때까지 대기
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initUI);
} else {
  initUI();
}

function initUI() {
  console.log("Initializing UI...");

  // DOM 요소
  const authStatusEl = document.getElementById("authStatus");
  const userEmailEl = document.getElementById("userEmail");
  const loginBtn = document.getElementById("loginBtn");
  const refreshAuthBtn = document.getElementById("refreshAuthBtn");
  const loadCollectionsBtn = document.getElementById("loadCollectionsBtn");
  const clearCollectionsBtn = document.getElementById("clearCollectionsBtn");
  const collectionsStatusEl = document.getElementById("collectionsStatus");
  const collectionsListEl = document.getElementById("collectionsList");
  const clearLogsBtn = document.getElementById("clearLogsBtn");
  const debugLogsEl = document.getElementById("debugLogs");

  if (!authStatusEl || !loginBtn) {
    console.error("UI elements not found!");
    return;
  }

  // 디버그 로그 함수
  function addLog(message, type = "info") {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement("div");
    logEntry.className = `log-entry log-${type}`;
    logEntry.textContent = `[${timestamp}] ${message}`;
    debugLogsEl.appendChild(logEntry);
    debugLogsEl.scrollTop = debugLogsEl.scrollHeight;
    console.log(message);
  }

  // 로그인 상태 업데이트
  function updateAuthStatus() {
    const currentUser = auth.currentUser;

    if (currentUser) {
      authStatusEl.className = "status logged-in";
      authStatusEl.textContent = "✅ 로그인됨";
      userEmailEl.textContent = `📧 ${
        currentUser.email || "N/A"
      } (UID: ${currentUser.uid.substring(0, 8)}...)`;
      userEmailEl.style.display = "block";
      loginBtn.textContent = "로그아웃";
      addLog(`로그인 확인: ${currentUser.email}`, "success");
    } else {
      authStatusEl.className = "status logged-out";
      authStatusEl.textContent = "❌ 로그아웃 상태";
      userEmailEl.style.display = "none";
      loginBtn.textContent = "Google 로그인";
      addLog("로그인되지 않음", "error");
    }
  }

  // 컬렉션 표시 함수
  function displayCollections(collections) {
    if (!collections || collections.length === 0) {
      collectionsStatusEl.innerHTML =
        '<div class="loading">컬렉션이 없습니다.</div>';
      return;
    }

    collectionsStatusEl.innerHTML = `<div class="success">✅ ${collections.length}개의 컬렉션 로드됨</div>`;

    collectionsListEl.innerHTML = "";
    collections.forEach((collection, index) => {
      const item = document.createElement("div");
      item.className = "collection-item";
      item.innerHTML = `
        <strong>${index + 1}. ${collection.icon || "📁"} ${
        collection.name
      }</strong><br>
        <small style="color: #666;">ID: ${collection.id}</small>
        ${
          collection.description
            ? `<br><small>${collection.description}</small>`
            : ""
        }
      `;
      collectionsListEl.appendChild(item);
    });
  }

  // 로그인 버튼 클릭
  loginBtn.addEventListener("click", async () => {
    const currentUser = auth.currentUser;

    if (currentUser) {
      // 로그아웃
      try {
        await auth.signOut();
        addLog("로그아웃 완료", "success");
        updateAuthStatus();
      } catch (error) {
        addLog(`로그아웃 실패: ${error.message}`, "error");
      }
    } else {
      // 로그인
      try {
        addLog("Google 로그인 시작...", "info");
        const result = await signInWithPopup(auth, provider);
        addLog(`로그인 성공: ${result.user.email}`, "success");
        updateAuthStatus();
      } catch (error) {
        addLog(`로그인 실패: ${error.message}`, "error");
      }
    }
  });

  // 상태 새로고침 버튼
  refreshAuthBtn.addEventListener("click", () => {
    addLog("인증 상태 새로고침...", "info");
    updateAuthStatus();
  });

  // 컬렉션 불러오기 버튼
  loadCollectionsBtn.addEventListener("click", async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      addLog("로그인이 필요합니다", "error");
      collectionsStatusEl.innerHTML =
        '<div class="error">❌ 로그인이 필요합니다</div>';
      return;
    }

    addLog("컬렉션 불러오기 시작...", "info");
    collectionsStatusEl.innerHTML = '<div class="loading">⏳ 로딩 중...</div>';
    collectionsListEl.innerHTML = "";

    try {
      const collections = await fetchCollections(currentUser.uid);
      displayCollections(collections);
      addLog(`${collections.length}개의 컬렉션 로드 성공`, "success");
    } catch (error) {
      collectionsStatusEl.innerHTML = `<div class="error">❌ 오류: ${error.message}</div>`;
      addLog(`컬렉션 로드 실패: ${error.message}`, "error");
    }
  });

  // 목록 지우기 버튼
  clearCollectionsBtn.addEventListener("click", () => {
    collectionsListEl.innerHTML = "";
    collectionsStatusEl.innerHTML = "";
    addLog("컬렉션 목록 지움", "info");
  });

  // 로그 지우기 버튼
  clearLogsBtn.addEventListener("click", () => {
    debugLogsEl.innerHTML = "";
    addLog("로그 초기화됨", "info");
  });

  // 초기화
  addLog("SignIn popup 페이지 초기화 완료", "success");

  // 인증 상태 모니터링
  auth.onAuthStateChanged((user) => {
    addLog(`인증 상태 변경: ${user ? user.email : "로그아웃"}`, "info");
    updateAuthStatus();
  });

  // 초기 상태 표시
  updateAuthStatus();
}
