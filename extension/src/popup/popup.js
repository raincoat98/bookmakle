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

  let user = null;
  let currentTab = null;

  // 현재 탭 정보 가져오기
  async function getCurrentTab() {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    return tab;
  }

  // 로그인 상태 UI 토글
  function updateUI(currentUser) {
    if (currentUser) {
      userInfo.textContent = `${currentUser.email} 님, 환영합니다!`;
      signInButton.style.display = "none";
      loginNotice.style.display = "none";
      saveBookmarkButton.disabled = false;
      signOutButton.style.display = "flex";
    } else {
      userInfo.textContent = "";
      signInButton.style.display = "flex";
      loginNotice.style.display = "flex";
      saveBookmarkButton.disabled = true;
      signOutButton.style.display = "none";
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

  // 태그 추천 버튼 클릭 시 태그 입력란에 추가
  tagBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const tag = btn.getAttribute("data-tag");
      let tags = tagInput.value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (!tags.includes(tag)) {
        tags.push(tag);
        tagInput.value = tags.join(", ");
      }
    });
  });

  // toast 메시지 함수
  function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.remove("hidden");
    toast.classList.add("opacity-100");
    setTimeout(() => {
      toast.classList.add("hidden");
      toast.classList.remove("opacity-100");
    }, 2000);
  }

  // 북마크 저장 버튼 클릭
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
        collection: collection,
        tags: tags,
        createdAt: new Date().toISOString(),
      };

      // background.js에 북마크 저장 요청 전송
      chrome.runtime.sendMessage(
        {
          action: "saveBookmark",
          bookmark: bookmarkData,
        },
        function (response) {
          // 버튼 상태 복원
          saveBookmarkButton.disabled = false;
          saveBookmarkButton.textContent = "북마크 저장";

          if (chrome.runtime.lastError) {
            console.error("Runtime error:", chrome.runtime.lastError);
            showToast(
              "오류가 발생했습니다: " +
                (chrome.runtime.lastError.message || "알 수 없는 오류")
            );
            return;
          }

          if (!response) {
            console.error("No response received from background");
            showToast("서버 응답을 받지 못했습니다.");
            return;
          }

          if (response.error) {
            console.error("Bookmark save error:", response.error);
            showToast("저장 실패: " + response.error);
          } else {
            console.log("Bookmark saved successfully:", response);
            showToast("북마크가 저장되었습니다!");

            // 입력 필드 초기화
            memoInput.value = "";
            tagInput.value = "";
          }
        }
      );
    } catch (error) {
      console.error("Error saving bookmark:", error);
      saveBookmarkButton.disabled = false;
      saveBookmarkButton.textContent = "북마크 저장";
      showToast("저장 중 오류가 발생했습니다.");
    }
  });

  // 초기화: 로그인 상태, 탭 정보 표시
  chrome.storage.local.get(["user"], async function (result) {
    user = result.user;
    updateUI(user);
    currentTab = await getCurrentTab();
    if (currentTab) {
      currentPageUrl.textContent = currentTab.url;
    }
  });
});
