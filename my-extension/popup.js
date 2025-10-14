// DOM 요소들 가져오기
const $btn = document.getElementById("login");
const $user = document.getElementById("user");
const $mainContent = document.getElementById("mainContent");
const $loginGuide = document.getElementById("loginGuide");
const $signOutButton = document.getElementById("signOutButton");
const $currentPageUrl = document.getElementById("currentPageUrl");
const $quickModeCheckbox = document.getElementById("quickModeCheckbox");
const $saveBookmarkButton = document.getElementById("saveBookmarkButton");
const $collectionSelect = document.getElementById("collectionSelect");
const $memoInput = document.getElementById("memoInput");
const $tagInput = document.getElementById("tagInput");
const $tagList = document.getElementById("tagList");

// 로그인 버튼 클릭 이벤트
$btn.addEventListener("click", async () => {
  // signin-popup 페이지로 리다이렉트하여 로그인 처리
  const loginUrl = `https://bookmarkhub-5ea6c-sign.web.app?source=extension&extensionId=${chrome.runtime.id}`;
  chrome.tabs.create({ url: loginUrl });

  // 팝업 창 닫기
  window.close();
});

// 새로운 로그아웃 버튼 클릭 이벤트
if ($signOutButton) {
  console.log("로그아웃 버튼 이벤트 리스너 등록됨");
  $signOutButton.addEventListener("click", async () => {
    console.log("로그아웃 버튼 클릭됨");

    // 로그아웃 버튼 로딩 상태로 변경
    const originalText = $signOutButton.innerHTML;
    $signOutButton.disabled = true;
    $signOutButton.innerHTML = `
      <div class="animate-spin rounded-full" style="width: 12px; height: 12px; border: 2px solid transparent; border-top: 2px solid white; margin-right: 6px;"></div>
      로그아웃 중...
    `;

    try {
      console.log("로그아웃 메시지 전송 중...");
      const result = await chrome.runtime.sendMessage({ type: "LOGOUT" });
      console.log("로그아웃 결과:", result);
      if (result?.error) {
        console.error("Storage API 에러:", result.error);
        return;
      }
      if (result?.success) {
        console.log("로그아웃 성공, UI 업데이트");
        // 사용자 상태를 다시 확인하여 UI 업데이트
        await refreshUser();
      }
    } catch (error) {
      console.error("로그아웃 실패:", error);
      // 에러 발생 시에도 UI를 로그인 상태로 변경
      showLoginUI();
    } finally {
      // 로그아웃 버튼 원래 상태로 복원
      $signOutButton.disabled = false;
      $signOutButton.innerHTML = originalText;
    }
  });
} else {
  console.error("로그아웃 버튼을 찾을 수 없음");
}

// 로그인 UI 표시
function showLoginUI() {
  $user.innerHTML = "";
  $btn.classList.remove("hidden");
  if ($mainContent) $mainContent.classList.add("hidden");
  if ($loginGuide) $loginGuide.classList.remove("hidden");
  if ($signOutButton) $signOutButton.classList.add("hidden");
}

// 로그인 후 UI 표시
function showMainContent() {
  $btn.classList.add("hidden");
  if ($mainContent) $mainContent.classList.remove("hidden");
  if ($loginGuide) $loginGuide.classList.add("hidden");
  if ($signOutButton) $signOutButton.classList.remove("hidden");

  // 현재 페이지 URL 가져오기
  getCurrentPageUrl();

  // 빠른 실행 모드 상태 로드
  loadQuickModeState();

  // 컬렉션 데이터 로드
  loadCollections();
}

// 사용자 인증 상태 확인
async function refreshUser() {
  try {
    const result = await chrome.runtime.sendMessage({ type: "GET_AUTH_STATE" });
    if (result?.error) {
      console.error("Storage API 에러:", result.error);
      return;
    }
    if (result?.user) {
      renderUser(result.user);
    } else {
      showLoginUI();
    }
  } catch (error) {
    console.error("인증 상태 확인 에러:", error);
    showLoginUI();
  }
}

// 사용자 정보 렌더링
function renderUser(user) {
  // 사용자 정보 표시
  $user.innerHTML = `
    <div class="flex items-center">
      <img src="${user.photoURL || ""}" 
           class="w-6 h-6 rounded-full mr-2" 
           onerror="this.style.display='none'">
      <span class="text-sm font-medium text-gray-700">
        ${user.displayName || user.email}
      </span>
    </div>`;

  // 메인 콘텐츠 표시
  showMainContent();
}

// 현재 페이지 URL 가져오기
async function getCurrentPageUrl() {
  try {
    // 현재 활성 탭 정보 가져오기
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab && tab.url && $currentPageUrl) {
      // URL 표시 (최대 50자로 제한)
      const displayUrl =
        tab.url.length > 50 ? tab.url.substring(0, 47) + "..." : tab.url;
      $currentPageUrl.textContent = displayUrl;
      $currentPageUrl.title = tab.url; // 전체 URL을 툴팁으로 표시

      // 전역 변수로 저장 (나중에 북마크 저장시 사용)
      window.currentPageData = {
        url: tab.url,
        title: tab.title || tab.url,
        favIconUrl: tab.favIconUrl,
      };
    }
  } catch (error) {
    console.error("현재 페이지 URL 가져오기 실패:", error);
    if ($currentPageUrl) {
      $currentPageUrl.textContent = "URL을 가져올 수 없습니다";
    }
  }
}

// 빠른 실행 모드 상태 로드
async function loadQuickModeState() {
  try {
    const result = await chrome.storage.local.get(["quickMode"]);
    const isQuickMode = result.quickMode || false;
    if ($quickModeCheckbox) {
      $quickModeCheckbox.checked = isQuickMode;
    }
  } catch (error) {
    console.error("빠른 실행 모드 상태 로드 실패:", error);
  }
}

// 빠른 실행 모드 체크박스 이벤트
if ($quickModeCheckbox) {
  $quickModeCheckbox.addEventListener("change", async (e) => {
    try {
      const isChecked = e.target.checked;
      await chrome.storage.local.set({ quickMode: isChecked });
      console.log(`빠른 실행 모드 ${isChecked ? "활성화" : "비활성화"}`);
    } catch (error) {
      console.error("빠른 실행 모드 설정 실패:", error);
      // 실패시 체크박스 상태 되돌리기
      e.target.checked = !e.target.checked;
    }
  });
}

// 컬렉션 데이터 로드
async function loadCollections() {
  try {
    // 사용자 정보 가져오기
    const authResult = await chrome.runtime.sendMessage({
      type: "GET_AUTH_STATE",
    });

    if (!authResult?.user?.uid) {
      console.error("사용자 정보가 없습니다");
      return;
    }

    // 먼저 캐시된 컬렉션 확인
    const cachedResult = await chrome.storage.local.get(["cachedCollections"]);

    if (
      cachedResult?.cachedCollections &&
      cachedResult.cachedCollections.length > 0
    ) {
      console.log("캐시된 컬렉션 사용:", cachedResult.cachedCollections.length);
      renderCollections(cachedResult.cachedCollections);
      return;
    }

    // 캐시가 없으면 서버에서 가져오기
    console.log("컬렉션 데이터 요청 중...");
    const result = await chrome.runtime.sendMessage({
      type: "GET_COLLECTIONS",
      userId: authResult.user.uid,
    });

    console.log("컬렉션 데이터 응답:", result);

    if (result?.type === "COLLECTIONS_ERROR") {
      console.error("컬렉션 로드 실패:", result.message);
      return;
    }

    if (result?.type === "COLLECTIONS_DATA" && result.collections) {
      // Storage에 캐시 저장
      chrome.storage.local.set({ cachedCollections: result.collections });
      renderCollections(result.collections);
    }
  } catch (error) {
    console.error("컬렉션 로드 중 에러:", error);
  }
}

// 컬렉션을 선택 박스에 렌더링
function renderCollections(collections) {
  const $collectionSelect = document.getElementById("collectionSelect");
  if (!$collectionSelect) return;

  // 기존 옵션들 제거 (기본 옵션 제외)
  $collectionSelect.innerHTML = '<option value="">📄 컬렉션 없음</option>';

  // 컬렉션 옵션들 추가
  collections.forEach((collection) => {
    const option = document.createElement("option");
    option.value = collection.id;
    option.textContent = `${collection.icon || "📁"} ${collection.name}`;
    $collectionSelect.appendChild(option);
  });

  console.log(`${collections.length}개의 컬렉션이 로드되었습니다`);
}

// 태그 관리
let tags = [];

// 태그 입력 이벤트
if ($tagInput) {
  $tagInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tagText = $tagInput.value.trim();
      if (tagText && !tags.includes(tagText)) {
        tags.push(tagText);
        renderTags();
        $tagInput.value = "";
      }
    }
  });
}

// 태그 렌더링
function renderTags() {
  if (!$tagList) return;

  $tagList.innerHTML = "";
  tags.forEach((tag, index) => {
    const tagElement = document.createElement("span");
    tagElement.className =
      "inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs";
    tagElement.innerHTML = `
      ${tag}
      <button class="ml-1 text-indigo-500 hover:text-indigo-700" data-index="${index}">×</button>
    `;

    // 태그 삭제 버튼 이벤트
    const deleteBtn = tagElement.querySelector("button");
    deleteBtn.addEventListener("click", () => {
      tags.splice(index, 1);
      renderTags();
    });

    $tagList.appendChild(tagElement);
  });
}

// 북마크 저장 버튼 이벤트
if ($saveBookmarkButton) {
  $saveBookmarkButton.addEventListener("click", async () => {
    try {
      // 사용자 정보 가져오기
      const authResult = await chrome.runtime.sendMessage({
        type: "GET_AUTH_STATE",
      });

      if (!authResult?.user?.uid) {
        showToast("로그인이 필요합니다", "error");
        return;
      }

      // 현재 페이지 데이터 확인
      if (!window.currentPageData) {
        showToast("페이지 정보를 가져올 수 없습니다", "error");
        return;
      }

      // 버튼 비활성화 및 로딩 표시
      $saveBookmarkButton.disabled = true;
      $saveBookmarkButton.textContent = "저장 중...";

      // 북마크 데이터 준비
      const bookmarkData = {
        userId: authResult.user.uid,
        title: window.currentPageData.title,
        url: window.currentPageData.url,
        description: $memoInput?.value || "",
        collectionId: $collectionSelect?.value || null,
        tags: tags,
        favIconUrl: window.currentPageData.favIconUrl || "",
        order: Date.now(), // 임시로 타임스탬프 사용
      };

      // 북마크 저장 요청
      console.log("북마크 저장 요청:", bookmarkData);
      const result = await chrome.runtime.sendMessage({
        type: "SAVE_BOOKMARK",
        bookmarkData: bookmarkData,
      });

      console.log("북마크 저장 응답:", result);

      if (result?.type === "BOOKMARK_SAVED") {
        // 버튼에 성공 표시
        $saveBookmarkButton.textContent = "✓ 저장 완료!";
        $saveBookmarkButton.style.background =
          "linear-gradient(135deg, #10b981 0%, #059669 100%)";

        // Toast 메시지 표시
        showToast("✓ 북마크가 성공적으로 저장되었습니다!", "success");

        // 입력 필드 초기화
        if ($memoInput) $memoInput.value = "";
        if ($tagInput) $tagInput.value = "";
        tags = [];
        renderTags();
        if ($collectionSelect) $collectionSelect.value = "";

        // 1초 후 버튼 원래대로
        setTimeout(() => {
          if ($saveBookmarkButton) {
            $saveBookmarkButton.style.background = "";
          }
        }, 1500);
      } else if (result?.type === "BOOKMARK_SAVE_ERROR") {
        showToast(`❌ 저장 실패: ${result.message}`, "error");
      } else {
        showToast("❌ 북마크 저장 중 오류가 발생했습니다", "error");
      }
    } catch (error) {
      console.error("북마크 저장 중 에러:", error);
      showToast("북마크 저장에 실패했습니다", "error");
    } finally {
      // 버튼 활성화
      if ($saveBookmarkButton) {
        $saveBookmarkButton.disabled = false;
        $saveBookmarkButton.textContent = "북마크 저장";
      }
    }
  });
}

// 토스트 메시지 표시
function showToast(message, type = "success") {
  const $toast = document.getElementById("toast");
  if (!$toast) return;

  // 아이콘 추가
  const icon = type === "success" ? "✓" : "✕";
  $toast.textContent = message;

  $toast.className = `fixed top-4 right-4 z-50 min-w-[200px] max-w-[300px] text-white text-sm rounded-lg px-4 py-3 shadow-xl border-l-4 ${
    type === "success"
      ? "bg-green-600 border-green-400"
      : "bg-red-600 border-red-800"
  }`;
  $toast.classList.remove("hidden");
  $toast.classList.add("show");

  // 더 긴 표시 시간 (성공 메시지는 4초, 에러는 5초)
  const duration = type === "success" ? 4000 : 5000;

  setTimeout(() => {
    $toast.classList.remove("show");
    setTimeout(() => {
      $toast.classList.add("hidden");
    }, 300);
  }, duration);
}

// 페이지 로드시 사용자 상태 확인
refreshUser();
