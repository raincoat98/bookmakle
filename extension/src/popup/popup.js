document.addEventListener("DOMContentLoaded", function () {
  const signInButton = document.getElementById("signInButton");
  const signOutButton = document.getElementById("signOutButton");
  const userInfo = document.getElementById("userInfo");
  let user = null;

  // 번역된 메시지 가져오기
  function getMessage(key) {
    return chrome.i18n.getMessage(key) || key;
  }

  // Update UI based on user authentication state
  function updateUI(currentUser) {
    if (currentUser) {
      userInfo.textContent = `${getMessage("loggedIn")}: ${currentUser.email}`;
      userInfo.style.color = "#2d3748";
      signInButton.style.display = "none";
      signOutButton.style.display = "block";
      user = currentUser;
    } else {
      userInfo.textContent = getMessage("notLoggedIn");
      userInfo.style.color = "#4a5568";
      signInButton.style.display = "block";
      signOutButton.style.display = "none";
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
