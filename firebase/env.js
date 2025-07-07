// Firebase 환경 변수 설정
export const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "",
  authDomain:
    process.env.FIREBASE_AUTH_DOMAIN ||
    "extension--auth-firebase.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "extension--auth-firebase",
  storageBucket:
    process.env.FIREBASE_STORAGE_BUCKET ||
    "extension--auth-firebase.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.FIREBASE_APP_ID || "",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "",
};

// 환경 변수 로드 함수
export function loadEnvironmentVariables() {
  // URL 파라미터에서 환경 변수 로드
  const urlParams = new URLSearchParams(window.location.search);

  return {
    apiKey: urlParams.get("apiKey") || firebaseConfig.apiKey,
    authDomain: urlParams.get("authDomain") || firebaseConfig.authDomain,
    projectId: urlParams.get("projectId") || firebaseConfig.projectId,
    storageBucket:
      urlParams.get("storageBucket") || firebaseConfig.storageBucket,
    messagingSenderId:
      urlParams.get("messagingSenderId") || firebaseConfig.messagingSenderId,
    appId: urlParams.get("appId") || firebaseConfig.appId,
    measurementId:
      urlParams.get("measurementId") || firebaseConfig.measurementId,
  };
}
