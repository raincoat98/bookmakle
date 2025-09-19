# 🚀 FireAuth Suite - 시작하기

이 가이드는 FireAuth Suite를 사용하여 새로운 프로젝트를 시작하는 방법을 설명합니다.

## 📋 사전 요구사항

- **Node.js** 18+
- **npm** 또는 **yarn**
- **Firebase CLI** (`npm install -g firebase-tools`)
- **Chrome Browser** (Extension 개발용)

## 🔧 초기 설정

### 1. Firebase 프로젝트 생성

```bash
# Firebase 콘솔에서 새 프로젝트 생성
# https://console.firebase.google.com/

# Authentication 활성화
# - Sign-in method에서 Google 활성화
# - 승인된 도메인에 localhost 추가
```

### 2. 환경변수 설정 (자동화)

#### 🚀 **간편한 방법: 자동 설정 스크립트 사용**

```bash
# 환경변수 설정 스크립트 실행
./setup-env.sh

# Firebase 설정 정보 입력 (스크립트가 안내)
# - API Key
# - Auth Domain
# - Project ID
# - App ID
# - Messaging Sender ID
```

#### 📝 **수동 설정 방법**

##### React 앱 환경변수 (`my-app/.env.local`)

```bash
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
```

##### SignIn Popup 설정 (`signin-popup/config.js`)

```javascript
export const firebaseConfig = {
  apiKey: "your_api_key_here",
  authDomain: "your_project.firebaseapp.com",
  projectId: "your_project_id",
  appId: "your_app_id",
  messagingSenderId: "your_sender_id",
};
```

##### Chrome Extension 설정 (`my-extension/firebase-config.js`)

```javascript
export const firebaseConfig = {
  apiKey: "your_api_key_here",
  authDomain: "your_project.firebaseapp.com",
  projectId: "your_project_id",
  appId: "your_app_id",
  messagingSenderId: "your_sender_id",
};
```

### 3. Firebase Hosting 사이트 생성

```bash
# 메인 웹앱용 사이트 (기본)
firebase hosting:sites:create YOUR_PROJECT_ID

# SignIn Popup용 별도 사이트
firebase hosting:sites:create YOUR_PROJECT_ID-sign
```

> **참고**: `./setup-env.sh` 스크립트를 사용했다면 Firebase 프로젝트 설정 파일들이 자동으로 업데이트됩니다.

## 🏃‍♂️ 빠른 시작

### 개발 환경 실행

```bash
# 모든 개발 서버 실행 (병렬)
npm run dev:all

# 개별 실행
npm run dev:app      # React 앱 (포트 3000)
npm run dev:signin   # SignIn Popup (포트 8000)
npm run serve        # Firebase 로컬 서버 (포트 5000)
```

### Chrome Extension 개발

```bash
# 1. Chrome에서 chrome://extensions/ 접속
# 2. 개발자 모드 활성화
# 3. "압축해제된 확장 프로그램을 로드합니다" 클릭
# 4. my-extension 폴더 선택
```

### 배포

```bash
# 전체 배포
npm run deploy

# 개별 배포
npm run deploy:app        # React 앱
npm run deploy:signin     # SignIn Popup
npm run deploy:extension  # Chrome Extension (ZIP 생성)
```

## 🎯 커스터마이징

### 브랜딩 변경

1. **프로젝트명**: `package.json`의 `name` 필드 수정
2. **Extension명**: `my-extension/manifest.json`의 `name` 필드 수정
3. **아이콘**: `my-extension/` 디렉토리에 16x16, 32x32, 128x128 PNG 파일 추가
4. **색상**: CSS 변수 또는 인라인 스타일 수정

### 기능 확장

#### React 앱에 새 페이지 추가

```tsx
// src/pages/Dashboard.tsx
import { useAuth } from "../hooks/useAuth";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.displayName}!</p>
    </div>
  );
}
```

#### Extension에 새 기능 추가

```javascript
// my-extension/background.js
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "NEW_FEATURE") {
    // 새로운 기능 구현
    sendResponse({ success: true });
  }
});
```

## 🔍 문제 해결

### 일반적인 문제들

#### Firebase 설정 오류

```bash
# Firebase CLI 로그인 확인
firebase login

# 프로젝트 설정 확인
firebase projects:list
```

#### Chrome Extension 로드 실패

- `manifest.json` 문법 확인
- 권한 설정 확인
- 개발자 도구에서 에러 로그 확인

#### CORS 에러

- Firebase Hosting 도메인이 Firebase 프로젝트의 승인된 도메인에 추가되었는지 확인
- `manifest.json`의 `host_permissions` 확인

### 디버깅

```bash
# 로그 확인
# - Extension: chrome://extensions/ → Service Worker 클릭
# - React 앱: 브라우저 개발자 도구
# - SignIn Popup: https://YOUR_PROJECT_ID-sign.web.app 직접 접속
```

## 📚 추가 리소스

- [Firebase Authentication 문서](https://firebase.google.com/docs/auth)
- [Chrome Extension 개발 가이드](https://developer.chrome.com/docs/extensions/)
- [React 공식 문서](https://react.dev/)
- [Vite 문서](https://vitejs.dev/)

## 🤝 기여하기

이슈 리포트, 기능 제안, 풀 리퀘스트를 환영합니다!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.
