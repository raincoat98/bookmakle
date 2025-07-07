document.addEventListener("DOMContentLoaded", function () {
  const signInButton = document.getElementById("signInButton");
  const signOutButton = document.getElementById("signOutButton");
  const saveBookmarkButton = document.getElementById("saveBookmarkButton");
  const bookmarkSection = document.getElementById("bookmarkSection");
  const saveBookmarkConfirmButton = document.getElementById(
    "saveBookmarkConfirmButton"
  );
  const currentPageTitle = document.getElementById("currentPageTitle");
  const currentPageUrl = document.getElementById("currentPageUrl");
  const currentPageLabel = document.getElementById("currentPageLabel");
  const bookmarkTitle = document.getElementById("bookmarkTitle");
  const bookmarkDescription = document.getElementById("bookmarkDescription");
  const userInfo = document.getElementById("userInfo");
  let user = null;
  let currentTab = null;

  // 번역된 메시지 가져오기
  function getMessage(key) {
    return chrome.i18n.getMessage(key) || key;
  }

  // 현재 활성 탭 정보 가져오기
  async function getCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      currentTab = tab;
      return tab;
    } catch (error) {
      console.error("Error getting current tab:", error);
      return null;
    }
  }

  // 현재 페이지 정보 표시
  function displayCurrentPageInfo(tab) {
    if (tab) {
      currentPageTitle.textContent = tab.title || "제목 없음";
      currentPageUrl.textContent = tab.url || "URL 없음";
      bookmarkTitle.value = tab.title || "";
    }
  }

  // Update UI based on user authentication state
  function updateUI(currentUser) {
    if (currentUser) {
      userInfo.textContent = `${getMessage("loggedIn")}: ${currentUser.email}`;
      userInfo.style.color = "#2d3748";
      signInButton.style.display = "none";
      signOutButton.style.display = "block";
      saveBookmarkButton.style.display = "block";
      user = currentUser;
    } else {
      userInfo.textContent = getMessage("notLoggedIn");
      userInfo.style.color = "#4a5568";
      signInButton.style.display = "block";
      signOutButton.style.display = "none";
      saveBookmarkButton.style.display = "none";
      bookmarkSection.style.display = "none";
      user = null;
    }
    console.log("UI updated with user:", currentUser);
  }

  // 오류 메시지 표시 함수
  function showError(message) {
    console.error("Showing error:", message);
    userInfo.textContent = `${getMessage("error")}: ${message}`;
    userInfo.style.color = "#e53e3e";
    userInfo.style.fontWeight = "500";
    // 3초 후 원래 상태로 복원
    setTimeout(() => {
      userInfo.style.color = "";
      userInfo.style.fontWeight = "";
      updateUI(user);
    }, 3000);
  }

  // 성공 메시지 표시 함수
  function showSuccess(message) {
    console.log("Showing success:", message);
    userInfo.textContent = message;
    userInfo.style.color = "#38a169";
    userInfo.style.fontWeight = "500";
    // 2초 후 원래 상태로 복원
    setTimeout(() => {
      userInfo.style.color = "";
      userInfo.style.fontWeight = "";
      updateUI(user);
    }, 2000);
  }

  // 버튼 텍스트 설정
  signInButton.textContent = getMessage("login");
  signOutButton.textContent = getMessage("logout");
  saveBookmarkButton.textContent = getMessage("saveBookmark");
  saveBookmarkConfirmButton.textContent = getMessage("saveBookmarkConfirm");

  // HTML 요소 텍스트 설정
  currentPageLabel.textContent = getMessage("currentPageInfo");
  bookmarkTitle.placeholder = getMessage("saveBookmarkTitle");
  bookmarkDescription.placeholder = getMessage("saveBookmarkDescription");

  // Fetch the user state from Chrome storage
  chrome.storage.local.get(["user"], function (result) {
    console.log("Retrieved user from storage:", result.user);
    updateUI(result.user);
  });

  // Sign-in button click handler
  signInButton.addEventListener("click", function () {
    console.log("Sign-in button clicked");

    // 버튼 비활성화
    signInButton.disabled = true;
    signInButton.textContent = getMessage("loggingIn");

    // background.js에 인증 요청 전송
    chrome.runtime.sendMessage({ action: "signIn" }, function (response) {
      console.log("Popup received response from background:", response);

      // 버튼 상태 복원
      signInButton.disabled = false;
      signInButton.textContent = getMessage("login");

      // 응답 처리 개선
      if (chrome.runtime.lastError) {
        console.error("Runtime error:", chrome.runtime.lastError);
        showError(
          chrome.runtime.lastError.message || getMessage("unknownError")
        );
        return;
      }

      if (!response) {
        console.error("No response received from background");
        showError(getMessage("unknownError"));
        return;
      }

      if (response.error) {
        console.error("Authentication error:", response.error);
        showError(response.error);
      } else if (response.user) {
        console.log("Authentication successful:", response.user);
        // 사용자 정보를 storage에 저장
        chrome.storage.local.set({ user: response.user }, () => {
          if (chrome.runtime.lastError) {
            console.error(
              "Error saving user to storage:",
              chrome.runtime.lastError
            );
          } else {
            console.log("User saved to storage successfully");
          }
        });
        updateUI(response.user);
        showSuccess(getMessage("loginSuccess"));
      } else {
        console.error("Invalid response format:", response);
        showError(getMessage("unknownError"));
      }
    });
  });

  // Sign-out button click handler
  signOutButton.addEventListener("click", function () {
    console.log("Sign-out button clicked");
    logoutUser();
  });

  // 북마크 저장 버튼 클릭 핸들러
  saveBookmarkButton.addEventListener("click", async function () {
    console.log("Save bookmark button clicked");

    if (!user) {
      showError("로그인이 필요합니다.");
      return;
    }

    const tab = await getCurrentTab();
    if (!tab) {
      showError("현재 페이지 정보를 가져올 수 없습니다.");
      return;
    }

    displayCurrentPageInfo(tab);
    bookmarkSection.style.display = "block";
  });

  // 북마크 저장 확인 버튼 클릭 핸들러
  saveBookmarkConfirmButton.addEventListener("click", async function () {
    console.log("Save bookmark confirm button clicked");

    if (!user || !currentTab) {
      showError("사용자 정보 또는 페이지 정보가 없습니다.");
      return;
    }

    const title = bookmarkTitle.value.trim();
    const description = bookmarkDescription.value.trim();

    if (!title) {
      showError(getMessage("bookmarkTitleRequired"));
      return;
    }

    // 버튼 비활성화
    saveBookmarkConfirmButton.disabled = true;
    saveBookmarkConfirmButton.textContent = getMessage("savingBookmark");

    try {
      const bookmarkData = {
        title: title,
        description: description,
        url: currentTab.url,
        pageTitle: currentTab.title,
        userId: user.uid,
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
          saveBookmarkConfirmButton.disabled = false;
          saveBookmarkConfirmButton.textContent = getMessage(
            "saveBookmarkConfirm"
          );

          if (chrome.runtime.lastError) {
            console.error("Runtime error:", chrome.runtime.lastError);
            showError(
              chrome.runtime.lastError.message ||
                "알 수 없는 오류가 발생했습니다."
            );
            return;
          }

          if (!response) {
            console.error("No response received from background");
            showError("서버 응답을 받지 못했습니다.");
            return;
          }

          if (response.error) {
            console.error("Bookmark save error:", response.error);
            showError(response.error);
          } else {
            console.log("Bookmark saved successfully:", response);
            showSuccess(getMessage("bookmarkSaveSuccess"));

            // 입력 필드 초기화
            bookmarkTitle.value = "";
            bookmarkDescription.value = "";
            bookmarkSection.style.display = "none";
          }
        }
      );
    } catch (error) {
      console.error("Error saving bookmark:", error);
      saveBookmarkConfirmButton.disabled = false;
      saveBookmarkConfirmButton.textContent = getMessage("saveBookmarkConfirm");
      showError(getMessage("bookmarkSaveError"));
    }
  });

  function logoutUser() {
    chrome.runtime.sendMessage({ action: "signOut" }, function (response) {
      console.log("Logout response:", response);

      if (chrome.runtime.lastError) {
        console.error("Logout runtime error:", chrome.runtime.lastError);
      }

      chrome.storage.local.remove("user", () => {
        if (chrome.runtime.lastError) {
          console.error(
            "Error removing user from storage:",
            chrome.runtime.lastError
          );
        } else {
          console.log("User removed from storage successfully");
        }
      });
      updateUI(null);
      showSuccess(getMessage("logoutSuccess"));
    });
  }
});
