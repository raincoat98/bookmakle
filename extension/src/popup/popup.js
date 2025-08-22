document.addEventListener("DOMContentLoaded", async function () {
  const signInButton = document.getElementById("signInButton");
  const signOutButton = document.getElementById("signOutButton");
  const userInfo = document.getElementById("userInfo");
  const loginNotice = document.getElementById("loginNotice");
  const currentPageUrl = document.getElementById("currentPageUrl");
  const memoInput = document.getElementById("memoInput");
  const collectionSelect = document.getElementById("collectionSelect");
  const saveBookmarkButton = document.getElementById("saveBookmarkButton");
  const mainContent = document.getElementById("mainContent");
  const tagInput = document.getElementById("tagInput");
  const tagList = document.getElementById("tagList");
  const quickModeCheckbox = document.getElementById("quickModeCheckbox");
  const collectionSection = document.getElementById("collectionSection");

  let user = null;
  let currentTab = null;
  let collections = [];
  let tags = [];
  let isQuickMode = false;

  // 빠른 실행 모드 토글 함수
  function toggleQuickMode() {
    isQuickMode = quickModeCheckbox.checked;

    // 빠른 실행 모드 상태 저장
    chrome.storage.local.set({ quickMode: isQuickMode });

    // UI 업데이트
    updateQuickModeUI();

    // 빠른 실행 모드 활성화 시 팝업 자동 닫기
    if (isQuickMode) {
      showToast(
        "⚡ 빠른 실행 모드 활성화! 이제 아이콘을 클릭하면 바로 저장됩니다."
      );

      // 1초 후 팝업 닫기
      setTimeout(() => {
        window.close();
      }, 1500);
    }
  }

  // 빠른 실행 모드 UI 업데이트
  function updateQuickModeUI(showToastMessage = false) {
    if (isQuickMode) {
      // 빠른 실행 모드 시 컬렉션, 태그 섹션 숨기기
      collectionSection.style.display = "none";
      tagInput.parentElement.style.display = "none";
      memoInput.parentElement.style.display = "none";
      saveBookmarkButton.style.display = "none";

      if (showToastMessage) {
        showToast("⚡ 빠른 실행 모드 활성화! 아이콘 클릭 시 바로 저장됩니다.");
      }
    } else {
      // 일반 모드 시 모든 섹션 표시
      collectionSection.style.display = "block";
      tagInput.parentElement.style.display = "block";
      memoInput.parentElement.style.display = "block";
      saveBookmarkButton.style.display = "block";
    }
  }

  // 빠른 저장 함수
  async function saveBookmarkQuickly() {
    if (!user || !currentTab) return;

    try {
      const url = currentTab.url;
      const title = currentTab.title;

      const bookmarkData = {
        title: title,
        description: "",
        url: url,
        pageTitle: title,
        userId: user.uid,
        collection: "", // 컬렉션 없음 (0번째)
        tags: [],
        createdAt: new Date().toISOString(),
      };

      console.log("=== 빠른 저장 ===", bookmarkData);

      // 백그라운드 스크립트로 북마크 저장 요청
      chrome.runtime.sendMessage(
        { action: "saveBookmark", bookmark: bookmarkData },
        function (response) {
          if (response && response.success) {
            showToast("⚡ 북마크가 빠르게 저장되었습니다!");
            // 빠른 모드 해제
            quickModeCheckbox.checked = false;
            toggleQuickMode();
          } else {
            console.error("빠른 저장 실패:", response?.error);
            showToast(
              "저장에 실패했습니다: " + (response?.error || "알 수 없는 오류"),
              "error"
            );
          }
        }
      );
    } catch (error) {
      console.error("빠른 저장 중 오류:", error);
      showToast("저장 중 오류가 발생했습니다.", "error");
    }
  }

  // toast 메시지 함수
  function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    if (toast) {
      toast.textContent = message;

      // 메시지 타입에 따라 스타일 변경
      if (type === "error") {
        toast.className =
          "fixed top-4 right-4 z-50 hidden min-w-[200px] max-w-[300px] bg-gray-800 text-white text-sm rounded-lg px-4 py-3 shadow-xl border-l-4 border-red-400";
      } else {
        toast.className =
          "fixed top-4 right-4 z-50 hidden min-w-[200px] max-w-[300px] bg-gray-800 text-white text-sm rounded-lg px-4 py-3 shadow-xl border-l-4 border-green-400";
      }

      toast.classList.remove("hidden");
      toast.classList.add("show");

      setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
          toast.classList.add("hidden");
        }, 300);
      }, 3000);
    } else {
      // toast 요소가 없으면 alert로 폴백
      alert(message);
    }
  }

  // 현재 탭 정보 가져오기
  async function getCurrentTab() {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    return tab;
  }

  // 컬렉션 목록 가져오기
  async function loadCollections() {
    if (!user) return;

    try {
      // 로딩 상태 표시
      collectionSelect.innerHTML =
        '<option value="">🔄 컬렉션 로딩 중...</option>';

      // 백그라운드 스크립트를 통해 컬렉션 가져오기
      chrome.runtime.sendMessage(
        { action: "getCollections", userId: user.uid },
        function (response) {
          if (response && response.success) {
            collections = response.collections;
            console.log("Loaded collections from Firebase:", collections);

            updateCollectionSelect();
          } else {
            console.error("Failed to load collections:", response?.error);
            // 기본 컬렉션으로 폴백
            collections = [];
            updateCollectionSelect();
          }
        }
      );
    } catch (error) {
      console.error("Error loading collections:", error);
      // 기본 컬렉션으로 폴백
      collections = [];
      updateCollectionSelect();
    }
  }

  // 컬렉션 선택 옵션 업데이트
  function updateCollectionSelect() {
    // 기존 옵션들을 모두 제거하고 새로 생성
    collectionSelect.innerHTML = "";

    // "컬렉션 없음" 옵션 추가
    const noCollectionOption = document.createElement("option");
    noCollectionOption.value = "";
    noCollectionOption.textContent = "📄 컬렉션 없음";
    collectionSelect.appendChild(noCollectionOption);

    collections.forEach((collection) => {
      const option = document.createElement("option");
      option.value = collection.id;
      option.textContent = `${collection.icon} ${collection.name}`;
      collectionSelect.appendChild(option);
    });

    // 컬렉션 선택 이벤트 리스너 추가
    collectionSelect.addEventListener("change", function () {
      const selectedCollectionId = this.value;
      if (selectedCollectionId) {
        const selectedCollection = collections.find(
          (c) => c.id === selectedCollectionId
        );
        if (selectedCollection) {
          console.log("Selected collection:", selectedCollection);
        }
      } else {
        console.log("No collection selected");
      }
    });
  }

  // 로그인 상태 UI 토글
  function updateUI(currentUser) {
    console.log("currentUser", currentUser);
    if (currentUser) {
      userInfo.textContent = `${currentUser.email} 님, 환영합니다!`;
      signInButton.style.display = "none";
      loginNotice.style.display = "none";
      saveBookmarkButton.disabled = false;
      signOutButton.style.display = "flex";
      if (mainContent) mainContent.style.display = "block";
      loadCollections(); // 컬렉션 로드
    } else {
      userInfo.textContent = "";
      signInButton.style.display = "flex";
      loginNotice.style.display = "flex";
      saveBookmarkButton.disabled = true;
      signOutButton.style.display = "none";
      collections = [];
      updateCollectionSelect();
      if (mainContent) mainContent.style.display = "none";
    }
  }

  // Google 로그인
  signInButton.addEventListener("click", function () {
    // 버튼 비활성화 및 로딩 상태 표시
    signInButton.disabled = true;
    signInButton.textContent = "로그인 중...";

    chrome.runtime.sendMessage({ action: "signIn" }, function (response) {
      // 버튼 상태 복원
      signInButton.disabled = false;
      signInButton.textContent = "로그인 하기";

      if (response && response.user) {
        chrome.storage.local.set({ user: response.user }, () => {
          updateUI(response.user);
        });
      } else if (response && response.error) {
        console.error("로그인 실패:", response.error);

        // 첫 번째 시도 실패 시 자동 재시도
        if (
          response.error.includes("잘못된 데이터 형식") ||
          response.error.includes("Offscreen") ||
          response.error.includes("iframe")
        ) {
          console.log("첫 번째 로그인 시도 실패, 재시도 중...");

          setTimeout(() => {
            signInButton.click();
          }, 1000);
        } else {
          // 다른 에러는 사용자에게 표시
          showToast("로그인에 실패했습니다: " + response.error, "error");
        }
      } else {
        console.error("로그인 응답이 올바르지 않습니다:", response);
        showToast("로그인에 실패했습니다.", "error");
      }
    });
  });

  signOutButton.addEventListener("click", function () {
    chrome.storage.local.remove("user", () => {
      updateUI(null);
    });
  });

  // 빠른 실행 모드 체크박스 이벤트 리스너
  quickModeCheckbox.addEventListener("change", toggleQuickMode);

  // 저장된 사용자 정보 및 빠른 실행 모드 상태 불러오기
  chrome.storage.local.get(["user", "quickMode"], function (result) {
    if (result.user) {
      user = result.user;
      updateUI(user);
    } else {
      updateUI(null); // 로그인 안 한 상태도 명확히 처리!
    }

    // 빠른 실행 모드 상태 복원
    if (result.quickMode !== undefined) {
      isQuickMode = result.quickMode;
      quickModeCheckbox.checked = isQuickMode;
      updateQuickModeUI(false); // 초기화 시에는 토스트 메시지 표시하지 않음
    }
  });

  // 현재 탭 정보 가져오기
  getCurrentTab().then((tab) => {
    currentTab = tab;
    if (currentPageUrl) {
      console.log("tab.url", tab.url);
      currentPageUrl.textContent = tab.url;
    }
  });

  // 북마크 저장 버튼 클릭 이벤트
  saveBookmarkButton.addEventListener("click", async function () {
    if (!user) return;
    console.log("user", user);

    try {
      // 버튼 비활성화 및 로딩 상태 표시
      saveBookmarkButton.disabled = true;
      saveBookmarkButton.textContent = "저장 중...";

      const url = currentTab ? currentTab.url : "";
      const title = currentTab ? currentTab.title : "";
      const memo = memoInput.value.trim();
      const collection = collectionSelect.value;
      const tags = tagInput.value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const bookmarkData = {
        title: title,
        description: memo,
        url: url,
        pageTitle: title,
        userId: user.uid,
        collection: collection || "",
        tags: tags,
        createdAt: new Date().toISOString(),
      };

      console.log("=== SAVING BOOKMARK ===", bookmarkData);

      // 백그라운드 스크립트로 북마크 저장 요청
      chrome.runtime.sendMessage(
        { action: "saveBookmark", bookmark: bookmarkData },
        function (response) {
          if (response && response.success) {
            console.log("북마크가 성공적으로 저장되었습니다.");
            showToast("북마크가 성공적으로 저장되었습니다!");

            // 폼 초기화
            memoInput.value = "";
            tagInput.value = "";
            collectionSelect.selectedIndex = 0;
          } else {
            console.error("북마크 저장 실패:", response?.error);
            showToast(
              "북마크 저장에 실패했습니다: " +
                (response?.error || "알 수 없는 오류"),
              "error"
            );
          }

          // 버튼 상태 복원
          saveBookmarkButton.disabled = false;
          saveBookmarkButton.textContent = "북마크 저장";
        }
      );
    } catch (error) {
      console.error("북마크 저장 중 오류:", error);
      showToast("북마크 저장 중 오류가 발생했습니다.", "error");

      // 버튼 상태 복원
      saveBookmarkButton.disabled = false;
      saveBookmarkButton.textContent = "북마크 저장";
    }
  });

  // 태그 렌더링 함수
  function renderTags() {
    tagList.innerHTML = "";
    tags.forEach((tag, idx) => {
      const tagEl = document.createElement("span");
      tagEl.className =
        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      tagEl.textContent = tag;
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "ml-1 text-xs";
      removeBtn.innerHTML = "&times;";
      removeBtn.onclick = () => {
        tags.splice(idx, 1);
        renderTags();
      };
      tagEl.appendChild(removeBtn);
      tagList.appendChild(tagEl);
    });
  }

  // 태그 입력 엔터 이벤트
  tagInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.isComposing) {
      e.preventDefault();
      const value = tagInput.value.trim();
      if (value && !tags.includes(value)) {
        tags.push(value);
        renderTags();
      }
      tagInput.value = "";
    }
  });

  // 태그 추가 버튼 동작 구현
  const tagAddButton = tagInput.parentElement.querySelector("button");
  if (tagAddButton) {
    tagAddButton.addEventListener("click", function () {
      const value = tagInput.value.trim();
      if (value && !tags.includes(value)) {
        tags.push(value);
        renderTags();
      }
      tagInput.value = "";
      tagInput.focus();
    });
  }
});

console.log("load popup.js");
