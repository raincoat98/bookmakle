// DOM 요소들 가져오기
const $btn = document.getElementById("login");
const $user = document.getElementById("user");
const $mainContent = document.getElementById("mainContent");
const $loginGuide = document.getElementById("loginGuide");
const $currentPageUrl = document.getElementById("currentPageUrl");
const $quickModeCheckbox = document.getElementById("quickModeCheckbox");
const $saveBookmarkButton = document.getElementById("saveBookmarkButton");
const $collectionSelect = document.getElementById("collectionSelect");
const $collectionDropdown = document.getElementById("collectionDropdown");
const $collectionDropdownOptions = document.getElementById(
  "collectionDropdownOptions"
);
const $collectionSelectedText = document.getElementById(
  "collectionSelectedText"
);
const $collectionSearchInput = document.getElementById("collectionSearchInput");
const $collectionOptionsContainer = document.getElementById(
  "collectionOptionsContainer"
);
const $refreshCollectionBtn = document.getElementById("refreshCollectionBtn");
const $addCollectionBtn = document.getElementById("addCollectionBtn");
const $addCollectionModal = document.getElementById("addCollectionModal");
const $collectionNameInput = document.getElementById("collectionNameInput");
const $collectionIconInput = document.getElementById("collectionIconInput");
const $cancelCollectionBtn = document.getElementById("cancelCollectionBtn");
const $confirmCollectionBtn = document.getElementById("confirmCollectionBtn");
const $memoInput = document.getElementById("memoInput");
const $tagInput = document.getElementById("tagInput");
const $tagList = document.getElementById("tagList");
const $themeToggle = document.getElementById("themeToggle");
const $themeIcon = document.getElementById("themeIcon");

// 로그인 버튼 클릭 이벤트
$btn.addEventListener("click", async () => {
  // signin-popup 페이지로 리다이렉트하여 로그인 처리
  const loginUrl = `https://bookmarkhub-5ea6c-sign.web.app?source=extension&extensionId=${chrome.runtime.id}`;
  chrome.tabs.create({ url: loginUrl });

  // 팝업 창 닫기
  window.close();
});

// 로그인 UI 표시
function showLoginUI() {
  $user.innerHTML = "";
  $btn.classList.remove("hidden");
  if ($mainContent) $mainContent.classList.add("hidden");
  if ($loginGuide) $loginGuide.classList.remove("hidden");
}

// 로그인 후 UI 표시
function showMainContent() {
  $btn.classList.add("hidden");
  if ($mainContent) $mainContent.classList.remove("hidden");
  if ($loginGuide) $loginGuide.classList.add("hidden");

  // 현재 페이지 URL 가져오기
  getCurrentPageUrl();

  // 빠른 실행 모드 상태 로드
  loadQuickModeState();

  // 컬렉션 데이터 로드 (팝업 열릴 때마다 새로고침)
  loadCollections(true);
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
async function loadCollections(forceRefresh = false) {
  try {
    // 사용자 정보 가져오기
    const authResult = await chrome.runtime.sendMessage({
      type: "GET_AUTH_STATE",
    });

    if (!authResult?.user?.uid) {
      console.error("사용자 정보가 없습니다");
      return;
    }

    // forceRefresh가 아니면 캐시된 컬렉션 확인
    if (!forceRefresh) {
      const cachedResult = await chrome.storage.local.get([
        "cachedCollections",
      ]);

      if (
        cachedResult?.cachedCollections &&
        cachedResult.cachedCollections.length > 0
      ) {
        console.log(
          "캐시된 컬렉션 사용:",
          cachedResult.cachedCollections.length
        );
        renderCollections(cachedResult.cachedCollections);
        return;
      }
    }

    // 캐시가 없거나 강제 새로고침이면 서버에서 가져오기
    console.log(
      "🔍 [popup] 컬렉션 데이터 요청 중... userId:",
      authResult.user.uid
    );
    const result = await chrome.runtime.sendMessage({
      type: "GET_COLLECTIONS",
      userId: authResult.user.uid,
    });

    console.log("컬렉션 데이터 응답:", result);

    if (result?.type === "COLLECTIONS_ERROR") {
      console.error("컬렉션 로드 실패:", result.message);
      showToast("컬렉션 로드 실패", "error");
      return;
    }

    if (result?.type === "COLLECTIONS_DATA" && result.collections) {
      // Storage에 캐시 저장
      chrome.storage.local.set({ cachedCollections: result.collections });
      renderCollections(result.collections);
      if (forceRefresh) {
        // forceRefresh 플래그가 있지만 토스트는 별도로 처리
        console.log("컬렉션이 새로고침되었습니다");
      }
    }
  } catch (error) {
    console.error("컬렉션 로드 중 에러:", error);
    showToast("컬렉션 로드 중 오류 발생", "error");
  }
}

// 전역 변수로 컬렉션 목록 저장
let allCollections = [];

// 컬렉션을 커스텀 드롭다운에 렌더링
function renderCollections(collections) {
  if (
    !$collectionDropdown ||
    !$collectionOptionsContainer ||
    !$collectionSelectedText
  )
    return;

  // 전역 변수에 컬렉션 저장
  allCollections = collections;

  // 현재 선택된 값 저장
  const currentValue = $collectionSelect.value;

  // 기존 옵션들 제거 (기본 옵션 제외)
  $collectionOptionsContainer.innerHTML = `
    <div class="collection-option py-2 px-3 hover:bg-gray-100 cursor-pointer" data-value="">
      <div class="flex items-center">
        <span class="text-gray-500">📄</span>
        <span class="ml-2 text-sm">컬렉션 없음</span>
      </div>
    </div>
  `;

  // 컬렉션 옵션들 추가
  collections.forEach((collection) => {
    const optionDiv = createCollectionOption(collection);
    $collectionOptionsContainer.appendChild(optionDiv);
  });

  // 이전에 선택된 값이 여전히 존재하면 다시 선택, 없으면 "컬렉션 없음"으로 설정
  if (currentValue) {
    const optionExists = collections.some((col) => col.id === currentValue);
    if (optionExists) {
      $collectionSelect.value = currentValue;
      const selectedCollection = collections.find(
        (col) => col.id === currentValue
      );
      if (selectedCollection) {
        const iconDisplay =
          selectedCollection.icon && selectedCollection.icon.match(/^[A-Z]/)
            ? renderLucideIcon(selectedCollection.icon, "w-4 h-4")
            : `<span class="text-gray-500">${
                selectedCollection.icon || "📁"
              }</span>`;
        $collectionSelectedText.innerHTML = `${iconDisplay} <span class="ml-2">${selectedCollection.name}</span>`;
      }
      console.log(`이전 선택 유지: ${currentValue}`);
    } else {
      $collectionSelect.value = "";
      $collectionSelectedText.innerHTML = `<span class="text-gray-500">📄</span> <span class="ml-2">컬렉션 없음</span>`;
      console.log(
        `삭제된 컬렉션 감지 - "컬렉션 없음"으로 변경: ${currentValue}`
      );
    }
  } else {
    // 이전 값이 없으면 "컬렉션 없음"으로 설정
    $collectionSelect.value = "";
    $collectionSelectedText.innerHTML = `<span class="text-gray-500">📄</span> <span class="ml-2">컬렉션 없음</span>`;
  }

  console.log(`${collections.length}개의 컬렉션이 로드되었습니다`);
}

// 컬렉션 옵션 요소 생성 (재사용 가능한 함수)
function createCollectionOption(collection) {
  const optionDiv = document.createElement("div");
  optionDiv.className =
    "collection-option py-2 px-3 hover:bg-gray-100 cursor-pointer";
  optionDiv.setAttribute("data-value", collection.id);
  optionDiv.setAttribute("data-name", collection.name.toLowerCase());

  // Lucide 아이콘 SVG 렌더링
  let iconDisplay = "";
  if (collection.icon) {
    // Lucide 아이콘 이름인지 확인 (대문자로 시작하는 경우)
    if (collection.icon.match(/^[A-Z]/)) {
      iconDisplay = renderLucideIcon(collection.icon, "w-4 h-4");
    } else {
      // 이모지나 기타 아이콘
      iconDisplay = `<span class="text-gray-500">${collection.icon}</span>`;
    }
  } else {
    iconDisplay = renderLucideIcon("Folder", "w-4 h-4");
  }

  optionDiv.innerHTML = `
    <div class="flex items-center">
      ${iconDisplay}
      <span class="ml-2 text-sm">${collection.name}</span>
    </div>
  `;

  return optionDiv;
}

// 컬렉션 검색 필터링
function filterCollections(searchTerm) {
  if (!$collectionOptionsContainer) return;

  const lowerSearchTerm = searchTerm.toLowerCase().trim();

  // 검색어가 없으면 모든 컬렉션 표시
  if (!lowerSearchTerm) {
    renderCollections(allCollections);
    return;
  }

  // 검색어로 필터링
  const filteredCollections = allCollections.filter((collection) =>
    collection.name.toLowerCase().includes(lowerSearchTerm)
  );

  // 필터링된 컬렉션 렌더링
  $collectionOptionsContainer.innerHTML = `
    <div class="collection-option py-2 px-3 hover:bg-gray-100 cursor-pointer" data-value="">
      <div class="flex items-center">
        <span class="text-gray-500">📄</span>
        <span class="ml-2 text-sm">컬렉션 없음</span>
      </div>
    </div>
  `;

  if (filteredCollections.length === 0) {
    // 검색 결과가 없을 때
    const noResultDiv = document.createElement("div");
    noResultDiv.className = "py-3 px-3 text-center text-sm text-gray-500";
    noResultDiv.textContent = "검색 결과가 없습니다";
    $collectionOptionsContainer.appendChild(noResultDiv);
  } else {
    // 필터링된 컬렉션 표시
    filteredCollections.forEach((collection) => {
      const optionDiv = createCollectionOption(collection);
      $collectionOptionsContainer.appendChild(optionDiv);
    });
  }
}

// 커스텀 드롭다운 이벤트 처리
if ($collectionDropdown) {
  // 드롭다운 토글
  $collectionDropdown.addEventListener("click", (e) => {
    e.stopPropagation();
    const wasHidden = $collectionDropdownOptions.classList.contains("hidden");
    $collectionDropdownOptions.classList.toggle("hidden");

    // 드롭다운이 열릴 때 검색 필드 초기화 및 포커스
    if (wasHidden && $collectionSearchInput) {
      $collectionSearchInput.value = "";
      filterCollections("");
      setTimeout(() => {
        $collectionSearchInput.focus();
      }, 100);
    }
  });

  // 옵션 선택 (이벤트 위임 사용)
  if ($collectionOptionsContainer) {
    $collectionOptionsContainer.addEventListener("click", (e) => {
      const option = e.target.closest(".collection-option");
      if (option) {
        const value = option.getAttribute("data-value");
        $collectionSelect.value = value;

        // 선택된 텍스트 업데이트
        const iconElement = option.querySelector("svg, span");
        const nameElement = option.querySelector("span:last-child");

        if (iconElement && nameElement) {
          $collectionSelectedText.innerHTML = `
            ${iconElement.outerHTML}
            <span class="ml-2">${nameElement.textContent}</span>
          `;
        }

        // 드롭다운 닫기
        $collectionDropdownOptions.classList.add("hidden");
      }
    });
  }

  // 외부 클릭시 드롭다운 닫기
  document.addEventListener("click", (e) => {
    if (
      !$collectionDropdown.contains(e.target) &&
      !$collectionDropdownOptions.contains(e.target)
    ) {
      $collectionDropdownOptions.classList.add("hidden");
    }
  });
}

// 컬렉션 검색 입력 이벤트
if ($collectionSearchInput) {
  $collectionSearchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value;
    filterCollections(searchTerm);
  });

  // 검색 필드 클릭 시 이벤트 전파 중지 (드롭다운이 닫히지 않도록)
  $collectionSearchInput.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // 검색 필드에서 Enter 키 누르면 첫 번째 결과 선택
  $collectionSearchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const firstOption =
        $collectionOptionsContainer.querySelector(".collection-option");
      if (firstOption) {
        firstOption.click();
      }
    }
  });
}

// 컬렉션 새로고침 버튼 이벤트
if ($refreshCollectionBtn) {
  $refreshCollectionBtn.addEventListener("click", async () => {
    try {
      // 버튼 비활성화 및 로딩 표시
      $refreshCollectionBtn.disabled = true;
      const svg = $refreshCollectionBtn.querySelector("svg");
      if (svg) {
        svg.classList.add("animate-spin");
      }

      // 강제 새로고침
      await loadCollections(true);
      // 수동 새로고침 시에만 토스트 표시
      showToast("컬렉션이 새로고침되었습니다", "success");
    } catch (error) {
      console.error("컬렉션 새로고침 실패:", error);
      showToast("새로고침 실패", "error");
    } finally {
      // 버튼 활성화
      $refreshCollectionBtn.disabled = false;
      const svg = $refreshCollectionBtn.querySelector("svg");
      if (svg) {
        svg.classList.remove("animate-spin");
      }
    }
  });
}

// 컬렉션 추가 버튼 이벤트
if ($addCollectionBtn) {
  $addCollectionBtn.addEventListener("click", () => {
    // 모달 열기
    if ($addCollectionModal) {
      $addCollectionModal.classList.remove("hidden");
      // 이름 입력 필드에 포커스
      setTimeout(() => {
        if ($collectionNameInput) {
          $collectionNameInput.focus();
        }
      }, 100);
    }
  });
}

// 모달 취소 버튼 이벤트
if ($cancelCollectionBtn) {
  $cancelCollectionBtn.addEventListener("click", () => {
    closeCollectionModal();
  });
}

// 모달 배경 클릭시 닫기
if ($addCollectionModal) {
  $addCollectionModal.addEventListener("click", (e) => {
    if (e.target === $addCollectionModal) {
      closeCollectionModal();
    }
  });
}

// 컬렉션 추가 확인 버튼 이벤트
if ($confirmCollectionBtn) {
  $confirmCollectionBtn.addEventListener("click", async () => {
    try {
      const collectionName = $collectionNameInput?.value?.trim();
      const collectionIcon = $collectionIconInput?.value?.trim() || "📁";

      if (!collectionName) {
        showToast("컬렉션 이름을 입력해주세요", "error");
        return;
      }

      // 사용자 정보 확인
      const authResult = await chrome.runtime.sendMessage({
        type: "GET_AUTH_STATE",
      });

      if (!authResult?.user?.uid) {
        showToast("로그인이 필요합니다", "error");
        return;
      }

      // 버튼 비활성화
      $confirmCollectionBtn.disabled = true;
      $confirmCollectionBtn.textContent = "추가 중...";

      // 컬렉션 생성 요청
      const result = await chrome.runtime.sendMessage({
        type: "CREATE_COLLECTION",
        userId: authResult.user.uid,
        collectionData: {
          name: collectionName,
          icon: collectionIcon,
        },
      });

      if (result?.type === "COLLECTION_CREATED") {
        showToast(`✓ "${collectionName}" 컬렉션이 생성되었습니다!`, "success");
        // 컬렉션 목록 새로고침
        await loadCollections(true);
        // 새로 생성된 컬렉션 자동 선택
        if (result.collectionId && $collectionSelect) {
          $collectionSelect.value = result.collectionId;
        }
        // 모달 닫기
        closeCollectionModal();
      } else if (result?.type === "COLLECTION_CREATE_ERROR") {
        showToast(`❌ 생성 실패: ${result.message}`, "error");
      } else {
        showToast("❌ 컬렉션 생성 중 오류가 발생했습니다", "error");
      }
    } catch (error) {
      console.error("컬렉션 추가 중 에러:", error);
      showToast("컬렉션 추가 실패", "error");
    } finally {
      // 버튼 활성화
      $confirmCollectionBtn.disabled = false;
      $confirmCollectionBtn.textContent = "추가";
    }
  });
}

// 모달 닫기 함수
function closeCollectionModal() {
  if ($addCollectionModal) {
    $addCollectionModal.classList.add("hidden");
  }
  // 입력 필드 초기화
  if ($collectionNameInput) {
    $collectionNameInput.value = "";
  }
  if ($collectionIconInput) {
    $collectionIconInput.value = "📁";
  }
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
      const selectedCollectionId = $collectionSelect?.value;
      console.log(
        "선택된 컬렉션 ID:",
        selectedCollectionId,
        "타입:",
        typeof selectedCollectionId
      );

      const finalCollectionId =
        selectedCollectionId && selectedCollectionId.trim() !== ""
          ? selectedCollectionId
          : null;
      console.log("최종 컬렉션 ID:", finalCollectionId);

      // 컬렉션이 선택된 경우에만 유효성 검증
      if (finalCollectionId) {
        const cachedResult = await chrome.storage.local.get([
          "cachedCollections",
        ]);
        const collections = cachedResult.cachedCollections || [];
        const collectionExists = collections.some(
          (col) => col.id === finalCollectionId
        );

        if (!collectionExists) {
          showToast(
            "❌ 선택한 컬렉션이 존재하지 않습니다. 컬렉션을 새로고침합니다.",
            "error"
          );
          // 컬렉션 새로고침
          await loadCollections(true);
          // 버튼 활성화
          $saveBookmarkButton.disabled = false;
          $saveBookmarkButton.textContent = "북마크 저장";
          return;
        }
      }

      const bookmarkData = {
        userId: authResult.user.uid,
        title: window.currentPageData.title,
        url: window.currentPageData.url,
        description: $memoInput?.value || "",
        collection: finalCollectionId,
        tags: tags,
        favicon: window.currentPageData.favIconUrl || "",
        isFavorite: false,
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

        // 컬렉션 관련 오류인 경우 자동으로 새로고침
        if (
          result.message &&
          (result.message.includes("컬렉션") ||
            result.message.includes("collection") ||
            result.code === "not-found")
        ) {
          console.log("컬렉션 오류 감지 - 자동 새로고침 실행");
          setTimeout(() => {
            loadCollections(true);
          }, 1000);
        }
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

// 다국어 지원 함수
function initializeI18n() {
  // 개인정보 보호 정책 텍스트 설정
  const privacyPolicyElement = document.getElementById("privacyPolicyText");
  const contactElement = document.getElementById("contactText");

  if (privacyPolicyElement && chrome.i18n) {
    privacyPolicyElement.textContent =
      chrome.i18n.getMessage("privacyPolicyText") ||
      privacyPolicyElement.textContent;
  }

  if (contactElement && chrome.i18n) {
    contactElement.textContent =
      chrome.i18n.getMessage("contactText") || contactElement.textContent;
  }
}

// 다크모드 관련 함수들
let currentTheme = "light";

// 테마 초기화 (최적화)
let isInitializing = false; // 중복 초기화 방지

async function initializeTheme() {
  if (isInitializing) return; // 이미 초기화 중이면 무시
  isInitializing = true;

  try {
    // 저장된 테마 설정 불러오기
    const result = await chrome.storage.local.get(["theme"]);
    const savedTheme = result.theme || "light";

    // 시스템 다크모드 설정 확인
    if (savedTheme === "auto") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      currentTheme = prefersDark ? "dark" : "light";
    } else {
      currentTheme = savedTheme;
    }

    applyTheme(currentTheme);
    updateThemeIcon();
  } catch (error) {
    console.error("테마 초기화 실패:", error);
    applyTheme("light");
  } finally {
    isInitializing = false; // 초기화 완료
  }
}

// 테마 적용
function applyTheme(theme) {
  const body = document.body;
  const html = document.documentElement;

  if (theme === "dark") {
    body.setAttribute("data-theme", "dark");
    html.setAttribute("data-theme", "dark");
  } else {
    body.removeAttribute("data-theme");
    html.removeAttribute("data-theme");
  }

  currentTheme = theme;
}

// 테마 아이콘 업데이트
function updateThemeIcon() {
  if (!$themeIcon) return;

  if (currentTheme === "dark") {
    // 라이트 모드 아이콘 (태양)
    $themeIcon.innerHTML = `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    `;
  } else {
    // 다크 모드 아이콘 (달)
    $themeIcon.innerHTML = `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    `;
  }
}

// 테마 토글 (최적화)
let isToggling = false; // 중복 토글 방지

async function toggleTheme() {
  if (isToggling) return; // 이미 토글 중이면 무시
  isToggling = true;

  try {
    const newTheme = currentTheme === "light" ? "dark" : "light";
    applyTheme(newTheme);
    updateThemeIcon();

    // 테마 설정 저장
    await chrome.storage.local.set({ theme: newTheme });
    console.log(`테마가 ${newTheme}로 변경되었습니다`);
  } catch (error) {
    console.error("테마 설정 저장 실패:", error);
  } finally {
    isToggling = false; // 토글 완료
  }
}

// 테마 토글 버튼 이벤트
if ($themeToggle) {
  $themeToggle.addEventListener("click", toggleTheme);
}

// 시스템 다크모드 설정 변경 감지 (최적화)
if (window.matchMedia) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  let isProcessing = false; // 중복 처리 방지

  mediaQuery.addEventListener("change", (e) => {
    if (isProcessing) return; // 이미 처리 중이면 무시
    isProcessing = true;

    // 자동 모드일 때만 시스템 설정에 따라 변경
    chrome.storage.local
      .get(["theme"])
      .then((result) => {
        if (result.theme === "auto") {
          const newTheme = e.matches ? "dark" : "light";
          applyTheme(newTheme);
          updateThemeIcon();
        }
        isProcessing = false; // 처리 완료
      })
      .catch(() => {
        isProcessing = false; // 에러 시에도 플래그 리셋
      });
  });
}

// 페이지 로드시 사용자 상태 확인 및 다국어 초기화
initializeI18n();
initializeTheme();
refreshUser();

// Lucide 아이콘 렌더링 함수
function renderLucideIcon(iconName, size = "w-4 h-4") {
  // Lucide 라이브러리가 로드되었는지 확인
  if (typeof lucide !== "undefined") {
    try {
      // Lucide 공식 API 사용: createElement 함수
      if (lucide.createElement && lucide[iconName]) {
        const iconSvg = lucide.createElement(lucide[iconName], {
          class: size,
          "stroke-width": 2,
        });
        return iconSvg.outerHTML;
      }

      // 대안: data-lucide 속성을 사용한 방법
      if (lucide.createIcons) {
        // 임시 요소 생성
        const tempElement = document.createElement("i");
        tempElement.setAttribute("data-lucide", iconName.toLowerCase());
        tempElement.className = size;

        // Lucide로 아이콘 생성
        lucide.createIcons();

        // SVG 요소 추출
        const svgElement = tempElement.querySelector("svg");
        if (svgElement) {
          svgElement.className = size;
          return svgElement.outerHTML;
        }
      }

      console.log(`Lucide 아이콘을 찾을 수 없음: ${iconName}`);
    } catch (error) {
      console.log(`Lucide 아이콘 생성 실패: ${iconName}`, error);
    }
  }

  // Lucide 라이브러리가 없으면 수동 SVG 제공
  const iconMap = {
    RefreshCw: `<svg class="${size}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>`,
    Plus: `<svg class="${size}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>`,
    Folder: `<svg class="${size}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>`,
    Heart: `<svg class="${size}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>`,
    Star: `<svg class="${size}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>`,
    Bookmark: `<svg class="${size}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>`,
    Home: `<svg class="${size}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>`,
    Laptop: `<svg class="${size}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>`,
    ShoppingBag: `<svg class="${size}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>`,
    Smile: `<svg class="${size}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    Orange: `<svg class="${size}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>`,
  };

  return iconMap[iconName] || `<span class="text-gray-500">${iconName}</span>`;
}

// Lucide 아이콘 초기화
function initializeLucideIcons() {
  if (typeof lucide !== "undefined") {
    console.log("Lucide 라이브러리 로드 완료 - 아이콘 초기화");
    console.log("Lucide 객체:", lucide);
    console.log("사용 가능한 메서드:", Object.keys(lucide));

    // Lucide 아이콘 초기화
    if (lucide.createIcons) {
      lucide.createIcons();
      console.log("Lucide 아이콘 초기화 완료");
    }
  } else {
    console.log("Lucide 라이브러리 로드 대기 중...");
    setTimeout(initializeLucideIcons, 100);
  }
}

// DOM 로드 완료 후 Lucide 아이콘 초기화
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeLucideIcons);
} else {
  initializeLucideIcons();
}

// 버그 등록하기 버튼 이벤트 리스너
const $bugReportButton = document.getElementById("bugReportButton");
if ($bugReportButton) {
  $bugReportButton.addEventListener("click", () => {
    const bugReportUrl =
      "https://github.com/raincoat98/bookmakle/issues?q=sort%3Aupdated-desc+is%3Aissue+is%3Aopen";
    chrome.tabs.create({ url: bugReportUrl });
  });
}

// 후원하기 버튼 (비활성화 상태)
const $sponsorButton = document.getElementById("sponsorButton");
if ($sponsorButton) {
  $sponsorButton.addEventListener("click", (e) => {
    e.preventDefault();
    // 현재 비활성화 상태이므로 아무 동작하지 않음
    console.log("후원 링크 준비 중입니다.");
  });
}
