// 다국어 지원을 위한 번역 데이터
const translations = {
  ko: {
    title: "북마클 - 로그인",
    browserWarning: "브라우저 호환성 안내",
    browserCompatibility: "브라우저 호환성 안내",
    recommendedBrowsers: "권장 브라우저:",
    browserTip: "💡 팁:",
    browserTipContent:
      '현재 앱에서 "브라우저에서 열기" 또는 "외부 브라우저로 열기" 옵션을 찾아보세요.',
    authStatus: "로그아웃",
    loggedIn: "로그인됨",
    loggedOut: "로그아웃",
    welcome: "북마클에 오신 것을 환영합니다!",
    description: "북마크를 스마트하게 관리하세요",
    loginWithGoogle: "Google로 로그인",
    dashboard: "대시보드로 가기",
    logout: "로그아웃",
    closeTab: "탭 닫기",
    email: "이메일",
    password: "비밀번호",
    loginWithEmail: "이메일로 로그인",
    signUp: "회원가입",
    korean: "한국어",
    english: "English",
    japanese: "日本語",
    or: "또는",
    emailPlaceholder: "이메일을 입력하세요",
    passwordPlaceholder: "비밀번호를 입력하세요",
    noAccountSignup: "계정이 없으신가요? 회원가입",
    alreadyHaveAccount: "이미 계정이 있으신가요? 로그인",
    appName: "북마클",
    appDescription: "북마크를 스마트하게 관리하세요",
    displayName: "사용자명",
    displayNamePlaceholder: "사용자명을 입력하세요",
    confirmPassword: "비밀번호 확인",
    confirmPasswordPlaceholder: "비밀번호를 다시 입력하세요",
    signupPasswordPlaceholder: "비밀번호를 입력하세요 (최소 6자)",
    debugLogs: "디버그 로그",
    viewLogs: "보기",
    clearLogs: "로그 지우기",
  },
  en: {
    title: "Bookmarkle - Login",
    browserWarning: "Browser Compatibility Notice",
    browserCompatibility: "Browser Compatibility Notice",
    recommendedBrowsers: "Recommended browsers:",
    browserTip: "💡 Tip:",
    browserTipContent:
      'Look for "Open in Browser" or "Open in External Browser" options in the current app.',
    authStatus: "Logged Out",
    loggedIn: "Logged In",
    loggedOut: "Logged Out",
    welcome: "Welcome to Bookmarkle!",
    description: "Manage your bookmarks smartly",
    loginWithGoogle: "Login with Google",
    dashboard: "Go to Dashboard",
    logout: "Logout",
    closeTab: "Close Tab",
    email: "Email",
    password: "Password",
    loginWithEmail: "Login with Email",
    signUp: "Sign Up",
    korean: "한국어",
    english: "English",
    japanese: "日本語",
    or: "or",
    emailPlaceholder: "Enter your email",
    passwordPlaceholder: "Enter your password",
    noAccountSignup: "Don't have an account? Sign Up",
    alreadyHaveAccount: "Already have an account? Login",
    appName: "Bookmarkle",
    appDescription: "Manage your bookmarks smartly",
    displayName: "Display Name",
    displayNamePlaceholder: "Enter your display name",
    confirmPassword: "Confirm Password",
    confirmPasswordPlaceholder: "Enter your password again",
    signupPasswordPlaceholder: "Enter your password (minimum 6 characters)",
    debugLogs: "Debug Logs",
    viewLogs: "View",
    clearLogs: "Clear Logs",
  },
  ja: {
    title: "ブックマークル - ログイン",
    browserWarning: "ブラウザ互換性について",
    browserCompatibility: "ブラウザ互換性について",
    recommendedBrowsers: "推奨ブラウザ：",
    browserTip: "💡 ヒント：",
    browserTipContent:
      "現在のアプリで「ブラウザで開く」または「外部ブラウザで開く」オプションを探してください。",
    authStatus: "ログアウト",
    loggedIn: "ログイン済み",
    loggedOut: "ログアウト",
    welcome: "ブックマークルへようこそ！",
    description: "ブックマークをスマートに管理しましょう",
    loginWithGoogle: "Googleでログイン",
    dashboard: "ダッシュボードへ",
    logout: "ログアウト",
    closeTab: "タブを閉じる",
    email: "メール",
    password: "パスワード",
    loginWithEmail: "メールでログイン",
    signUp: "サインアップ",
    korean: "한국어",
    english: "English",
    japanese: "日本語",
    or: "または",
    emailPlaceholder: "メールアドレスを入力してください",
    passwordPlaceholder: "パスワードを入力してください",
    noAccountSignup: "アカウントをお持ちでない方は？サインアップ",
    alreadyHaveAccount: "すでにアカウントをお持ちの方は？ログイン",
    appName: "ブックマークル",
    appDescription: "ブックマークをスマートに管理しましょう",
    displayName: "表示名",
    displayNamePlaceholder: "表示名を入力してください",
    confirmPassword: "パスワード確認",
    confirmPasswordPlaceholder: "パスワードを再入力してください",
    signupPasswordPlaceholder: "パスワードを入力してください（最低6文字）",
    debugLogs: "デバッグログ",
    viewLogs: "表示",
    clearLogs: "ログをクリア",
  },
};

// 현재 언어 설정 (기본값: 한국어)
let currentLanguage = "ko";

// 언어 변경 함수
function changeLanguage(lang) {
  if (translations[lang]) {
    currentLanguage = lang;
    localStorage.setItem("bookmarkle_language", lang);
    updateUI();
  }
}

// UI 업데이트 함수
function updateUI() {
  const t = translations[currentLanguage];

  // 페이지 제목 업데이트
  document.title = t.title;

  // data-i18n 속성을 가진 모든 요소 업데이트
  const elementsWithI18n = document.querySelectorAll("[data-i18n]");
  elementsWithI18n.forEach((element) => {
    const key = element.dataset.i18n;
    if (t[key]) {
      // 아이콘이 있는 경우 아이콘을 유지하고 텍스트만 업데이트
      const icon = element.querySelector("i[data-lucide]");
      if (icon) {
        const iconHtml = icon.outerHTML;
        element.innerHTML = iconHtml + " " + t[key];
      } else {
        element.textContent = t[key];
      }
    }
  });

  // data-i18n-placeholder 속성을 가진 모든 요소 업데이트
  const elementsWithPlaceholder = document.querySelectorAll(
    "[data-i18n-placeholder]"
  );
  elementsWithPlaceholder.forEach((element) => {
    const key = element.dataset.i18nPlaceholder;
    if (t[key]) {
      element.placeholder = t[key];
    }
  });

  // 특별한 처리가 필요한 요소들 (data-i18n으로 처리되지 않는 것들)
  const browserWarningContent = document.getElementById(
    "browserWarningContent"
  );
  if (browserWarningContent) {
    browserWarningContent.textContent = t.browserCompatibility;
  }

  const recommendedBrowsersText = document.querySelector(
    ".browser-warning-content strong"
  );
  if (recommendedBrowsersText) {
    recommendedBrowsersText.textContent = t.recommendedBrowsers;
  }

  const browserTipElement = document.getElementById("browserWarningTip");
  if (browserTipElement) {
    browserTipElement.innerHTML = `<strong>${t.browserTip}</strong> ${t.browserTipContent}`;
  }

  // 언어 선택 버튼 업데이트
  const languageButtons = document.querySelectorAll(".language-btn");
  languageButtons.forEach((btn) => {
    const lang = btn.dataset.lang;
    if (lang === "ko") btn.textContent = t.korean;
    if (lang === "en") btn.textContent = t.english;
    if (lang === "ja") btn.textContent = t.japanese;

    // 활성 상태 업데이트
    if (lang === currentLanguage) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // Lucide 아이콘 다시 렌더링
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

// 페이지 로드 시 언어 설정 복원
document.addEventListener("DOMContentLoaded", function () {
  const savedLanguage = localStorage.getItem("bookmarkle_language");
  if (savedLanguage && translations[savedLanguage]) {
    currentLanguage = savedLanguage;
  }
  updateUI();
});

// 전역 함수로 노출
window.changeLanguage = changeLanguage;
window.updateUI = updateUI;
window.translations = translations;
