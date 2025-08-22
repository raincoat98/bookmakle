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
          if (chrome.runtime.lastError) {
            console.error(
              "Runtime error during quick save:",
              chrome.runtime.lastError
            );
            showToast("저장 중 연결 오류가 발생했습니다.", "error");
            return;
          }

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
      } else if (type === "info") {
        toast.className =
          "fixed top-4 right-4 z-50 hidden min-w-[200px] max-w-[300px] bg-gray-800 text-white text-sm rounded-lg px-4 py-3 shadow-xl border-l-4 border-blue-400";
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
          if (chrome.runtime.lastError) {
            console.error(
              "Runtime error during getCollections:",
              chrome.runtime.lastError
            );
            showToast("컬렉션 로드 중 연결 오류가 발생했습니다.", "error");
            collections = [];
            updateCollectionSelect();
            return;
          }

          if (response && response.success) {
            collections = response.collections;
            console.log("Loaded collections from Firebase:", collections);

            updateCollectionSelect();

            // 컬렉션 개수 표시
            if (collections.length === 0) {
              showToast("컬렉션이 없습니다. 새 컬렉션을 만들어보세요!", "info");
            } else {
              showToast(
                `${collections.length}개의 컬렉션을 불러왔습니다.`,
                "success"
              );
            }
          } else {
            console.error("Failed to load collections:", response?.error);
            showToast(
              "컬렉션 로드에 실패했습니다: " +
                (response?.error || "알 수 없는 오류"),
              "error"
            );
            // 기본 컬렉션으로 폴백
            collections = [];
            updateCollectionSelect();
          }
        }
      );
    } catch (error) {
      console.error("Error loading collections:", error);
      showToast("컬렉션 로드 중 오류가 발생했습니다.", "error");
      // 기본 컬렉션으로 폴백
      collections = [];
      updateCollectionSelect();
    }
  }

  // 컬렉션 새로고침 함수
  function refreshCollections() {
    console.log("Refreshing collections...");
    loadCollections();
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

    // 새 컬렉션 생성 옵션 추가
    const createNewOption = document.createElement("option");
    createNewOption.value = "create_new";
    createNewOption.textContent = "➕ 새 컬렉션 만들기";
    collectionSelect.appendChild(createNewOption);

    // 컬렉션 새로고침 옵션 추가
    const refreshOption = document.createElement("option");
    refreshOption.value = "refresh";
    refreshOption.textContent = "🔄 컬렉션 새로고침";
    collectionSelect.appendChild(refreshOption);

    // 컬렉션 선택 이벤트 리스너 추가
    collectionSelect.addEventListener("change", function () {
      const selectedValue = this.value;

      if (selectedValue === "create_new") {
        // 새 컬렉션 생성 모달 표시
        showCreateCollectionModal();
        // 선택을 원래대로 되돌리기
        this.value = "";
      } else if (selectedValue === "refresh") {
        // 컬렉션 새로고침
        refreshCollections();
        // 선택을 원래대로 되돌리기
        this.value = "";
      } else if (selectedValue) {
        const selectedCollection = collections.find(
          (c) => c.id === selectedValue
        );
        if (selectedCollection) {
          console.log("Selected collection:", selectedCollection);
        }
      } else {
        console.log("No collection selected");
      }
    });
  }

  // 새 컬렉션 생성 모달 표시
  function showCreateCollectionModal() {
    const modal = document.createElement("div");
    modal.className =
      "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 w-80 max-w-sm">
        <h3 class="text-lg font-semibold mb-4">새 컬렉션 만들기</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">컬렉션 이름</label>
            <input type="text" id="newCollectionName" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="컬렉션 이름을 입력하세요">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">아이콘</label>
            <select id="newCollectionIcon" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="📁">📁 폴더</option>
              <option value="⭐">⭐ 즐겨찾기</option>
              <option value="💻">💻 개발</option>
              <option value="📚">📚 학습</option>
              <option value="🏠">🏠 일상</option>
              <option value="🎯">🎯 목표</option>
              <option value="💡">💡 아이디어</option>
              <option value="📝">📝 메모</option>
            </select>
          </div>
          <div class="flex space-x-3">
            <button id="createCollectionBtn" class="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors">생성</button>
            <button id="cancelCreateCollectionBtn" class="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors">취소</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 이벤트 리스너 추가
    const createBtn = modal.querySelector("#createCollectionBtn");
    const cancelBtn = modal.querySelector("#cancelCreateCollectionBtn");
    const nameInput = modal.querySelector("#newCollectionName");
    const iconSelect = modal.querySelector("#newCollectionIcon");

    createBtn.addEventListener("click", async () => {
      const name = nameInput.value.trim();
      const icon = iconSelect.value;

      if (!name) {
        alert("컬렉션 이름을 입력해주세요.");
        return;
      }

      try {
        createBtn.disabled = true;
        createBtn.textContent = "생성 중...";

        // 백그라운드 스크립트를 통해 컬렉션 생성
        chrome.runtime.sendMessage(
          {
            action: "createCollection",
            collection: { name, icon },
          },
          function (response) {
            if (response && response.success) {
              console.log(
                "Collection created successfully:",
                response.collection
              );

              // 새 컬렉션을 목록에 추가
              collections.unshift(response.collection);

              // UI 업데이트
              updateCollectionSelect();

              // 모달 닫기
              document.body.removeChild(modal);

              showToast("컬렉션이 생성되었습니다!", "success");
            } else {
              console.error("Failed to create collection:", response?.error);
              alert(
                "컬렉션 생성에 실패했습니다: " +
                  (response?.error || "알 수 없는 오류")
              );
            }

            createBtn.disabled = false;
            createBtn.textContent = "생성";
          }
        );
      } catch (error) {
        console.error("Error creating collection:", error);
        alert("컬렉션 생성 중 오류가 발생했습니다.");
        createBtn.disabled = false;
        createBtn.textContent = "생성";
      }
    });

    cancelBtn.addEventListener("click", () => {
      document.body.removeChild(modal);
    });

    // Enter 키로 생성
    nameInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        createBtn.click();
      }
    });

    // 모달 외부 클릭으로 닫기
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

    // 포커스 설정
    nameInput.focus();
  }

  // 로그인 상태 UI 토글
  function updateUI(currentUser) {
    console.log("Updating UI with user:", currentUser);

    const loginGuide = document.getElementById("loginGuide");

    if (currentUser) {
      // 로그인된 상태
      console.log("User is logged in, showing user section");

      // 로그인 버튼 숨기기
      if (signInButton) signInButton.style.display = "none";
      if (loginNotice) loginNotice.style.display = "none";
      if (loginGuide) loginGuide.style.display = "none";

      // 로그아웃 버튼 표시
      if (signOutButton) signOutButton.style.display = "flex";

      // 메인 콘텐츠 표시
      if (mainContent) mainContent.style.display = "block";

      // 사용자 정보 표시
      if (userInfo) {
        userInfo.innerHTML = `
          <div class="flex items-center space-x-3 mb-4">
            <img src="${
              currentUser.photoURL || "https://via.placeholder.com/40"
            }" alt="프로필" class="w-10 h-10 rounded-full">
            <div>
              <div class="font-semibold text-gray-800">${
                currentUser.displayName || "사용자"
              }</div>
              <div class="text-sm text-gray-600">${
                currentUser.email || ""
              }</div>
            </div>
          </div>
        `;
      }

      // 컬렉션 로드
      loadCollections();
    } else {
      // 로그아웃된 상태
      console.log("User is not logged in, showing login section");

      // 로그인 버튼 표시
      if (signInButton) signInButton.style.display = "flex";
      if (loginNotice) loginNotice.style.display = "flex";
      if (loginGuide) loginGuide.style.display = "block";

      // 로그아웃 버튼 숨기기
      if (signOutButton) signOutButton.style.display = "none";

      // 메인 콘텐츠 숨기기
      if (mainContent) mainContent.style.display = "none";

      // 사용자 정보 초기화
      if (userInfo) userInfo.innerHTML = "";
    }
  }

  // 로그인 버튼 이벤트 리스너 - Firebase 호스팅으로 리다이렉트
  if (signInButton) {
    signInButton.addEventListener("click", function () {
      console.log("로그인 버튼 클릭됨 - Firebase 호스팅으로 리다이렉트");

      // 버튼 비활성화 및 로딩 상태 표시
      signInButton.disabled = true;
      signInButton.innerHTML = `
        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
        로그인 페이지로 이동 중...
      `;

      // Firebase 호스팅 사이트로 새 탭 열기
      chrome.tabs.create(
        {
          url: "https://bookmarkhub-5ea6c.web.app/?source=extension&action=login",
          active: true,
        },
        (tab) => {
          console.log("로그인 페이지가 새 탭에서 열렸습니다:", tab.id);

          // 팝업 닫기
          setTimeout(() => {
            window.close();
          }, 1000);
        }
      );
    });
  }

  // 로그아웃 버튼 이벤트 리스너
  if (signOutButton) {
    signOutButton.addEventListener("click", function () {
      console.log("Sign out button clicked");

      // 버튼 비활성화 및 로딩 상태 표시
      signOutButton.disabled = true;
      signOutButton.textContent = "로그아웃 중...";

      chrome.runtime.sendMessage({ action: "signOut" }, function (response) {
        // 버튼 상태 복원
        signOutButton.disabled = false;
        signOutButton.textContent = "로그아웃";

        if (chrome.runtime.lastError) {
          console.error(
            "Runtime error during signOut:",
            chrome.runtime.lastError
          );
          showToast("로그아웃 중 연결 오류가 발생했습니다.", "error");
          return;
        }

        if (response && response.success) {
          console.log("로그아웃 성공");
          user = null;

          // 컬렉션 초기화
          collections = [];

          // UI를 로그아웃 상태로 업데이트
          updateUI(null);

          // 빠른 실행 모드 비활성화
          if (quickModeCheckbox) {
            quickModeCheckbox.checked = false;
            isQuickMode = false;
            chrome.storage.local.set({ quickMode: false });
          }

          showToast("로그아웃되었습니다.", "success");
        } else if (response && response.error) {
          console.error("로그아웃 실패:", response.error);
          showToast("로그아웃에 실패했습니다: " + response.error, "error");
        } else {
          console.error("로그아웃 응답이 올바르지 않습니다:", response);
          showToast("로그아웃에 실패했습니다.", "error");
        }
      });
    });
  }

  // 빠른 실행 모드 체크박스 이벤트 리스너
  if (quickModeCheckbox) {
    quickModeCheckbox.addEventListener("change", toggleQuickMode);
  }

  // Firebase 호스팅에서 온 로그인 성공 메시지 처리
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
      if (message.action === "loginSuccessFromHosting" && message.user) {
        console.log(
          "Firebase 호스팅에서 로그인 성공 메시지 수신:",
          message.user
        );
        user = message.user;
        updateUI(user);
        showToast("Firebase 호스팅에서 로그인되었습니다!", "success");
      }
    } catch (error) {
      console.error("Error handling message from background:", error);
    }
  });

  // 페이지 로드 시 로그인 상태 확인
  function checkLoginStatus() {
    chrome.storage.local.get(["user"], function (result) {
      if (result.user) {
        console.log("저장된 사용자 정보 발견:", result.user);
        user = result.user;
        updateUI(user);
      } else {
        console.log("저장된 사용자 정보 없음");
        updateUI(null);
      }
    });
  }

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
      if (quickModeCheckbox) {
        quickModeCheckbox.checked = isQuickMode;
      }
      updateQuickModeUI(false); // 초기화 시에는 토스트 메시지 표시하지 않음
    }
  });

  // 초기 로그인 상태 확인
  checkLoginStatus();

  // 현재 탭 정보 가져오기
  getCurrentTab().then((tab) => {
    currentTab = tab;
    if (currentPageUrl) {
      console.log("tab.url", tab.url);
      currentPageUrl.textContent = tab.url;
    }
  });

  // 북마크 저장 버튼 클릭 이벤트
  if (saveBookmarkButton) {
    saveBookmarkButton.addEventListener("click", async function () {
      if (!user) {
        showToast("로그인이 필요합니다.", "error");
        return;
      }
      console.log("user", user);

      try {
        // 버튼 비활성화 및 로딩 상태 표시
        saveBookmarkButton.disabled = true;
        saveBookmarkButton.textContent = "저장 중...";

        const url = currentTab ? currentTab.url : "";
        const title = currentTab ? currentTab.title : "";
        const memo = memoInput ? memoInput.value.trim() : "";
        const collection = collectionSelect ? collectionSelect.value : "";
        const tags = tagInput
          ? tagInput.value
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [];

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
              if (memoInput) memoInput.value = "";
              if (tagInput) tagInput.value = "";
              if (collectionSelect) collectionSelect.selectedIndex = 0;
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
  }

  // 태그 렌더링 함수
  function renderTags() {
    if (!tagList) return;

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
  if (tagInput) {
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
  }
});

console.log("load popup.js");
