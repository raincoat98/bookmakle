import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
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
    console.log("Received idToken:", ev.data.idToken ? "Yes" : "No");

    try {
      // 현재 로그인된 사용자 확인
      let currentUser = auth.currentUser;

      // 현재 사용자가 없고 idToken이 있으면 세션 복원 시도
      if (!currentUser && ev.data.idToken) {
        console.log(
          "Attempting to restore Firebase Auth session with idToken..."
        );

        try {
          await setPersistence(auth, browserLocalPersistence);

          // 세션 복원 대기
          currentUser = await new Promise((resolve) => {
            const timeout = setTimeout(() => {
              console.log("Auth state restoration timeout");
              resolve(auth.currentUser);
            }, 7000);

            if (auth.currentUser) {
              clearTimeout(timeout);
              resolve(auth.currentUser);
              return;
            }

            const unsubscribe = auth.onAuthStateChanged((user) => {
              console.log("Auth state changed:", user ? user.uid : "null");
              if (user) {
                clearTimeout(timeout);
                unsubscribe();
                resolve(user);
              }
            });
          });
        } catch (error) {
          console.error("Failed to restore session with idToken:", error);
        }
      }

      // 현재 사용자가 없으면 세션 복원 대기
      if (!currentUser) {
        console.log("Waiting for auth state restoration...");
        currentUser = await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            console.log("Auth state restoration timeout");
            resolve(auth.currentUser);
          }, 5000);

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
          }, 5000); // 3초 → 5초로 증가

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
    console.log("Saving bookmark request received");
    console.log("Received idToken:", ev.data.idToken ? "Yes" : "No");

    try {
      let currentUser = auth.currentUser;

      // 현재 사용자가 없고 idToken이 있으면 세션 복원 시도
      if (!currentUser && ev.data.idToken) {
        console.log(
          "Attempting to restore Firebase Auth session with idToken..."
        );

        // idToken으로 세션 복원 시도
        try {
          // Firebase Auth에 idToken 정보가 있다면 onAuthStateChanged가 트리거될 것임
          await setPersistence(auth, browserLocalPersistence);

          // 세션 복원 대기
          currentUser = await new Promise((resolve) => {
            const timeout = setTimeout(() => {
              console.log("Auth state restoration timeout for bookmark save");
              resolve(auth.currentUser);
            }, 7000); // 더 긴 타임아웃

            if (auth.currentUser) {
              clearTimeout(timeout);
              resolve(auth.currentUser);
              return;
            }

            const unsubscribe = auth.onAuthStateChanged((user) => {
              console.log(
                "Auth state changed for bookmark save:",
                user ? user.uid : "null"
              );
              if (user) {
                clearTimeout(timeout);
                unsubscribe();
                resolve(user);
              }
            });
          });
        } catch (error) {
          console.error("Failed to restore session with idToken:", error);
        }
      }

      // 여전히 사용자가 없으면 일반적인 세션 복원 시도
      if (!currentUser) {
        console.log("Waiting for auth state restoration for bookmark save...");
        currentUser = await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            console.log("Auth state restoration timeout for bookmark save");
            resolve(auth.currentUser);
          }, 5000);

          if (auth.currentUser) {
            clearTimeout(timeout);
            resolve(auth.currentUser);
            return;
          }

          const unsubscribe = auth.onAuthStateChanged((user) => {
            console.log(
              "Auth state changed for bookmark save:",
              user ? user.uid : "null"
            );
            if (user) {
              clearTimeout(timeout);
              unsubscribe();
              resolve(user);
            }
          });
        });
      }

      if (!currentUser) {
        console.error("User not authenticated for bookmark save");
        send({
          type: "BOOKMARK_SAVE_ERROR",
          name: "AuthError",
          code: "auth/not-authenticated",
          message: "User is not authenticated. Please sign in first.",
        });
        return;
      }

      console.log("Saving bookmark for authenticated user:", currentUser.uid);

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

// URL 쿼리 파라미터 확인
const urlParams = new URLSearchParams(window.location.search);
const source = urlParams.get("source");
const extensionId = urlParams.get("extensionId");

console.log("=== PAGE LOAD ===");
console.log("URL:", window.location.href);
console.log("URL params - source:", source, "extensionId:", extensionId);
console.log("=================");

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
  const userInfoEl = document.getElementById("userInfo");
  const userEmailEl = document.getElementById("userEmail");
  const loggedOutButtonsEl = document.getElementById("loggedOutButtons");
  const loggedInButtonsEl = document.getElementById("loggedInButtons");
  const loginBtn = document.getElementById("loginBtn");
  const dashboardBtn = document.getElementById("dashboardBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const closeTabBtn = document.getElementById("closeTabBtn");
  const emailLoginSection = document.getElementById("emailLoginSection");
  const signupSection = document.getElementById("signupSection");
  const emailLoginForm = document.getElementById("emailLoginForm");
  const signupForm = document.getElementById("signupForm");
  const switchToSignupBtn = document.getElementById("switchToSignupBtn");
  const switchToLoginBtn = document.getElementById("switchToLoginBtn");
  const toggleLogsBtn = document.getElementById("toggleLogsBtn");
  const debugContentEl = document.getElementById("debugContent");
  const debugLogsEl = document.getElementById("debugLogs");
  const debugControlsEl = document.getElementById("debugControls");
  const clearLogsBtn = document.getElementById("clearLogsBtn");

  if (!authStatusEl || !loginBtn) {
    console.error("UI elements not found!");
    return;
  }

  let logsVisible = false;

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
      authStatusEl.className = "auth-status status-logged-in";
      authStatusEl.innerHTML = `<i data-lucide="check-circle" style="width: 12px; height: 12px;"></i> 로그인`;
      userEmailEl.textContent = `${currentUser.email || "N/A"}`;
      userInfoEl.style.display = "block";
      loggedOutButtonsEl.classList.add("hidden");
      loggedInButtonsEl.classList.remove("hidden");
      emailLoginSection.classList.add("hidden");
      signupSection.classList.add("hidden");
      addLog(`로그인 확인: ${currentUser.email}`, "success");

      // Lucide 아이콘 재초기화
      if (typeof lucide !== "undefined") {
        lucide.createIcons();
      }
    } else {
      authStatusEl.className = "auth-status status-logged-out";
      authStatusEl.innerHTML = `<i data-lucide="x-circle" style="width: 12px; height: 12px;"></i> 로그아웃`;
      userInfoEl.style.display = "none";
      loggedOutButtonsEl.classList.remove("hidden");
      loggedInButtonsEl.classList.add("hidden");
      emailLoginSection.classList.remove("hidden");
      signupSection.classList.add("hidden");
      addLog("로그인되지 않음", "error");

      // Lucide 아이콘 재초기화
      if (typeof lucide !== "undefined") {
        lucide.createIcons();
      }
    }
  }

  // 로그 토글
  toggleLogsBtn.addEventListener("click", () => {
    logsVisible = !logsVisible;
    if (logsVisible) {
      debugContentEl.classList.add("show");
      toggleLogsBtn.textContent = "숨기기";
    } else {
      debugContentEl.classList.remove("show");
      toggleLogsBtn.textContent = "보기";
    }
  });

  // 로그인 버튼 클릭
  loginBtn.addEventListener("click", async () => {
    const currentUser = auth.currentUser;

    if (currentUser) {
      // 이미 로그인된 경우 (이 경우는 거의 없음)
      updateAuthStatus();
      return;
    }

    // 로그인
    try {
      addLog("Google 로그인 시작...", "info");
      loginBtn.disabled = true;
      loginBtn.innerHTML = `<div class="loading-spinner"></div> 로그인 중...`;

      const result = await signInWithPopup(auth, provider);
      addLog(`로그인 성공: ${result.user.email}`, "success");

      updateAuthStatus();

      // Extension에서 왔다면 로그인 정보 전달
      console.log(
        "Check redirect - source:",
        source,
        "extensionId:",
        extensionId
      );

      if (source === "extension" && extensionId) {
        await handleExtensionLogin(result.user);
      } else {
        console.log("Not redirecting - source or extensionId missing");
        console.log("Current URL:", window.location.href);
      }
    } catch (error) {
      addLog(`로그인 실패: ${error.message}`, "error");
    } finally {
      loginBtn.disabled = false;
      loginBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Google 로그인
      `;
    }
  });

  // 대시보드 버튼 클릭
  dashboardBtn.addEventListener("click", () => {
    addLog("대시보드로 이동 중...", "info");
    window.open("https://bookmarkhub-5ea6c.web.app/", "_blank");
  });

  // 로그아웃 버튼 클릭
  logoutBtn.addEventListener("click", async () => {
    try {
      addLog("로그아웃 중...", "info");
      await auth.signOut();
      addLog("로그아웃 완료", "success");
      updateAuthStatus();

      // Extension에서 왔다면 로그아웃 알림
      if (source === "extension" && extensionId) {
        try {
          await chrome.runtime.sendMessage(extensionId, {
            type: "LOGOUT_SUCCESS",
          });
          addLog("Extension에 로그아웃 알림 전송", "success");
        } catch (error) {
          addLog(`Extension 통신 실패: ${error.message}`, "error");
        }
      }
    } catch (error) {
      addLog(`로그아웃 실패: ${error.message}`, "error");
    }
  });

  // 탭 닫기 버튼 클릭
  closeTabBtn.addEventListener("click", () => {
    addLog("탭을 닫는 중...", "info");
    window.close();
  });

  // 로그 지우기 버튼
  clearLogsBtn.addEventListener("click", () => {
    debugLogsEl.innerHTML = "";
    addLog("로그 초기화됨", "info");
  });

  // 이메일 로그인 폼 제출
  emailLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const email = formData.get("email");
    const password = formData.get("password");

    if (!email || !password) {
      addLog("이메일과 비밀번호를 입력해주세요", "error");
      return;
    }

    try {
      addLog("이메일 로그인 시도 중...", "info");
      const emailLoginBtn = document.getElementById("emailLoginBtn");
      emailLoginBtn.disabled = true;
      emailLoginBtn.innerHTML = `<div class="loading-spinner"></div> 로그인 중...`;

      const result = await signInWithEmailAndPassword(auth, email, password);
      addLog(`이메일 로그인 성공: ${result.user.email}`, "success");

      updateAuthStatus();

      // Extension에서 왔다면 로그인 정보 전달
      if (source === "extension" && extensionId) {
        await handleExtensionLogin(result.user);
      }
    } catch (error) {
      console.error("Email login error:", error);
      let errorMessage = "로그인에 실패했습니다.";

      if (error.code === "auth/user-not-found") {
        errorMessage = "등록되지 않은 이메일입니다.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "비밀번호가 올바르지 않습니다.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "올바른 이메일 형식이 아닙니다.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage =
          "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.";
      }

      addLog(`이메일 로그인 실패: ${errorMessage}`, "error");
    } finally {
      const emailLoginBtn = document.getElementById("emailLoginBtn");
      emailLoginBtn.disabled = false;
      emailLoginBtn.innerHTML = "📧 이메일로 로그인";
    }
  });

  // 회원가입 폼 제출
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const displayName = formData.get("displayName");
    const email = formData.get("email");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (!displayName || !email || !password || !confirmPassword) {
      addLog("모든 필드를 입력해주세요", "error");
      return;
    }

    if (password !== confirmPassword) {
      addLog("비밀번호가 일치하지 않습니다", "error");
      return;
    }

    if (password.length < 6) {
      addLog("비밀번호는 최소 6자 이상이어야 합니다", "error");
      return;
    }

    try {
      addLog("회원가입 시도 중...", "info");
      const signupBtn = document.getElementById("signupBtn");
      signupBtn.disabled = true;
      signupBtn.innerHTML = `<div class="loading-spinner"></div> 가입 중...`;

      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // 사용자명 업데이트
      await updateProfile(result.user, {
        displayName: displayName,
      });

      addLog(`회원가입 성공: ${result.user.email}`, "success");

      updateAuthStatus();

      // Extension에서 왔다면 로그인 정보 전달
      if (source === "extension" && extensionId) {
        await handleExtensionLogin(result.user);
      }
    } catch (error) {
      console.error("Signup error:", error);
      let errorMessage = "회원가입에 실패했습니다.";

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "이미 가입된 이메일입니다.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "비밀번호는 최소 6자 이상이어야 합니다.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "올바른 이메일 형식이 아닙니다.";
      }

      addLog(`회원가입 실패: ${errorMessage}`, "error");
    } finally {
      const signupBtn = document.getElementById("signupBtn");
      signupBtn.disabled = false;
      signupBtn.innerHTML = "✍️ 회원가입";
    }
  });

  // 회원가입 모드 전환
  switchToSignupBtn.addEventListener("click", () => {
    emailLoginSection.classList.add("hidden");
    signupSection.classList.remove("hidden");
    addLog("회원가입 모드로 전환", "info");
  });

  // 로그인 모드 전환
  switchToLoginBtn.addEventListener("click", () => {
    signupSection.classList.add("hidden");
    emailLoginSection.classList.remove("hidden");
    addLog("로그인 모드로 전환", "info");
  });

  // Extension 로그인 처리 함수
  async function handleExtensionLogin(user) {
    addLog("Extension에 로그인 정보 전달 중...", "info");

    try {
      // ID 토큰 가져오기
      const idToken = await user.getIdToken();
      console.log("ID token obtained for extension");

      // 컬렉션 가져오기
      addLog("컬렉션 불러오는 중...", "info");
      const collections = await fetchCollections(user.uid);
      console.log("Collections fetched for extension:", collections.length);

      // Extension에 로그인 정보 및 컬렉션 전달
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      };

      console.log(
        "Sending login info and collections to extension:",
        extensionId
      );
      console.log("Collections to send:", collections);

      const response = await chrome.runtime.sendMessage(extensionId, {
        type: "LOGIN_SUCCESS",
        user: userData,
        idToken: idToken,
        collections: collections,
      });

      console.log("Extension 응답:", response);
      addLog(
        `✅ 로그인 정보 및 ${collections.length}개의 컬렉션이 확장 프로그램에 전달되었습니다!`,
        "success"
      );

      // 성공 후 현재 페이지에서 로그인 상태 유지 (리다이렉트 없음)
      addLog("로그인 완료! 이 페이지에서 계속 사용할 수 있습니다.", "success");
    } catch (error) {
      console.error("Extension 통신 오류:", error);
      addLog(`❌ Extension 통신 실패: ${error.message}`, "error");
    }
  }

  // 초기화
  addLog("북마클 로그인 페이지 초기화 완료", "success");

  // 인증 상태 모니터링
  let hasRedirected = false; // 중복 리다이렉트 방지

  auth.onAuthStateChanged(async (user) => {
    console.log(
      "onAuthStateChanged - user:",
      user ? user.email : "null",
      "source:",
      source,
      "extensionId:",
      extensionId,
      "hasRedirected:",
      hasRedirected
    );
    addLog(`인증 상태 변경: ${user ? user.email : "로그아웃"}`, "info");
    updateAuthStatus();

    // Extension에서 왔는데 이미 로그인되어 있으면 정보 전달
    if (user && source === "extension" && extensionId && !hasRedirected) {
      hasRedirected = true;
      console.log("Already logged in - sending info to extension immediately");
      addLog("이미 로그인되어 있음 - Extension에 정보 전달", "info");

      try {
        await handleExtensionLogin(user);
      } catch (error) {
        console.error("Extension 통신 오류 (auto):", error);
        addLog(`❌ Extension 통신 실패: ${error.message}`, "error");
      }
    }
  });

  // 초기 상태 표시
  updateAuthStatus();
}
