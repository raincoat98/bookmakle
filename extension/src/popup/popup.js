document.addEventListener("DOMContentLoaded", async function () {
  const signInButton = document.getElementById("signInButton");
  const signOutButton = document.getElementById("signOutButton");
  const userInfo = document.getElementById("userInfo");
  const loginNotice = document.getElementById("loginNotice");
  const currentPageUrl = document.getElementById("currentPageUrl");
  const memoInput = document.getElementById("memoInput");
  const collectionSelect = document.getElementById("collectionSelect");
  const tagInput = document.getElementById("tagInput");
  const tagBtns = document.querySelectorAll(".tag-btn");
  const saveBookmarkButton = document.getElementById("saveBookmarkButton");
  const mainContent = document.getElementById("mainContent");

  let user = null;
  let currentTab = null;
  let collections = [];

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

            // 컬렉션이 없으면 기본 컬렉션 생성 요청
            if (collections.length === 0) {
              console.log(
                "No collections found, creating default collections..."
              );
              collectionSelect.innerHTML =
                '<option value="">🔄 기본 컬렉션 생성 중...</option>';

              chrome.runtime.sendMessage(
                { action: "createDefaultCollections", userId: user.uid },
                function (createResponse) {
                  if (createResponse && createResponse.success) {
                    console.log("Default collections created successfully");
                    // 기본 컬렉션 생성 후 다시 로드
                    loadCollections();
                  } else {
                    console.error(
                      "Failed to create default collections:",
                      createResponse?.error
                    );
                    updateCollectionSelect();
                  }
                }
              );
            } else {
              updateCollectionSelect();
            }
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
    chrome.runtime.sendMessage({ action: "signIn" }, function (response) {
      if (response && response.user) {
        chrome.storage.local.set({ user: response.user }, () => {
          updateUI(response.user);
        });
      }
    });
  });

  signOutButton.addEventListener("click", function () {
    chrome.storage.local.remove("user", () => {
      updateUI(null);
    });
  });

  // 저장된 사용자 정보 불러오기
  chrome.storage.local.get(["user"], function (result) {
    if (result.user) {
      user = result.user;
      updateUI(user);
    } else {
      updateUI(null); // 로그인 안 한 상태도 명확히 처리!
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

  // 태그 버튼 클릭 이벤트
  tagBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const tag = this.getAttribute("data-tag");
      const currentTags = tagInput.value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      if (!currentTags.includes(tag)) {
        const newTags = [...currentTags, tag];
        tagInput.value = newTags.join(", ");
      }
    });
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
});

console.log("load popup.js");
