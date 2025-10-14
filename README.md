# 📚 북마크 허브 (Bookmark Hub)

**통합 북마크 관리 시스템**

북마크를 한 곳에서 관리하고, Chrome Extension과 웹 대시보드를 통해 어디서나 접근하세요

[![Firebase](https://img.shields.io/badge/Firebase-12.x-orange?logo=firebase)](https://firebase.google.com/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Chrome Extension](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-green?logo=googlechrome)](https://developer.chrome.com/docs/extensions/mv3/)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📁 프로젝트 구조

```
📚 북마크 허브/
├── 🧩 my-extension/         # Chrome Extension (Manifest V3)
│   ├── popup.html/js       # Extension Popup UI
│   ├── background.js       # Service Worker
│   ├── offscreen.js        # Offscreen Document
│   └── manifest.json       # Extension Configuration
│
├── 📊 bookmarkhub-dashboard/ # 북마크 허브 웹 대시보드
│   ├── src/
│   │   ├── components/     # UI Components (북마크 관리, 인증 등)
│   │   ├── hooks/         # Custom Hooks (useAuth, useBookmarks 등)
│   │   ├── contexts/      # React Contexts (AuthContext, ThemeContext)
│   │   ├── pages/         # 페이지 컴포넌트 (대시보드, 북마크, 설정)
│   │   └── utils/         # 유틸리티 함수들
│   ├── dist/             # Build Output
│   └── firebase.json     # Firebase Hosting Config
│
├── 🔐 signin-popup/         # Standalone Auth Popup
│   ├── index.html        # Popup Interface
│   ├── signInWithPopup.js # Firebase Auth Logic
│   └── firebase.json     # Hosting Configuration
│
├── 🛠 DevOps/
│   ├── deploy.sh         # 통합 배포 스크립트
│   ├── dev.sh           # 개발 서버 스크립트
│   ├── build.sh         # 빌드 스크립트
│   └── serve.sh         # Firebase 로컬 서버
│
└── 📚 Documentation/
    ├── README.md        # 메인 문서
    ├── PROJECT_INFO.md  # 프로젝트 상세 정보
    └── package.json     # 프로젝트 메타데이터
```

## ✨ 주요 기능

### 📚 **북마크 관리**

- **북마크 추가/편집/삭제** - 직관적인 북마크 관리
- **컬렉션 기반 분류** - 카테고리별로 북마크 정리
- **드래그 앤 드롭** - 쉬운 순서 변경 및 분류
- **검색 및 필터링** - 빠른 북마크 찾기
- **아이콘 자동 감지** - 웹사이트 파비콘 자동 수집
- **실시간 동기화** - 모든 기기에서 동일한 북마크

### 🔐 **Firebase Authentication**

- **Google OAuth 로그인** - 간편한 소셜 로그인
- **이메일/패스워드 로그인** - 전통적인 로그인 방식
- **회원가입** - 이메일 기반 계정 생성 및 프로필 설정
- **비밀번호 재설정** - 이메일을 통한 비밀번호 복구
- **자동 세션 관리** - 브라우저 재시작 시에도 로그인 상태 유지
- **실시간 인증 상태** - 로그인/로그아웃 상태 자동 감지

### 🧩 **Chrome Extension (Manifest V3)**

- **원클릭 북마크 추가** - 현재 페이지를 바로 북마크
- **빠른 북마크 접근** - 팝업에서 북마크 검색 및 접근
- **Extension ↔ 웹 대시보드 동기화** - 실시간 데이터 동기화
- **Offscreen Document 기반 Firebase Auth** - 안전한 인증 처리

### 📊 **웹 대시보드**

- **반응형 UI** - 모바일, 태블릿, 데스크톱 지원
- **다크/라이트 테마** - 사용자 선호에 맞는 테마
- **위젯 시스템** - 날씨, 명언 등 다양한 위젯
- **자동 백업** - 주기적인 북마크 데이터 백업
- **내보내기/가져오기** - JSON 형태로 데이터 관리

### 🔐 **Standalone Auth Popup**

- Chrome Extension 전용 인증 팝업
- PostMessage 기반 통신
- Firebase Hosting 배포

## 🚀 빠른 시작

### 📦 전체 프로젝트 관리

```bash
# 모든 프로젝트 빌드
npm run build
./build.sh all

# 모든 프로젝트 배포
npm run deploy
./deploy.sh all "업데이트 메시지"

# 모든 프로젝트 개발 서버 실행 (병렬)
npm run dev:all
./dev.sh all
```

### 📱 개별 프로젝트 관리

#### SignIn Popup

```bash
# 개발 서버
npm run dev:signin
./dev.sh signin-popup 8000

# Firebase 서버
npm run serve
./serve.sh signin-popup 5000

# 빌드 & 배포
npm run build:signin
npm run deploy:signin
```

#### 북마크 허브 대시보드 (bookmarkhub-dashboard)

```bash
# 개발 서버
npm run dev:dashboard
./dev.sh dashboard 3000

# 빌드
npm run build:dashboard
./build.sh dashboard
```

#### Chrome Extension (my-extension)

```bash
# 개발 환경 안내
npm run dev:extension
./dev.sh my-extension

# 빌드 & 패키징
npm run build:extension
./build.sh my-extension
```

## 📋 사용 가능한 스크립트

### 🔧 통합 스크립트

| 스크립트      | 설명           | 사용법                            |
| ------------- | -------------- | --------------------------------- |
| `./deploy.sh` | 통합 배포      | `./deploy.sh [프로젝트] [메시지]` |
| `./dev.sh`    | 통합 개발 서버 | `./dev.sh [프로젝트] [포트]`      |
| `./build.sh`  | 통합 빌드      | `./build.sh [프로젝트]`           |
| `./serve.sh`  | Firebase 서버  | `./serve.sh [프로젝트] [포트]`    |

### 📋 NPM 스크립트

| 명령어                     | 설명                           |
| -------------------------- | ------------------------------ |
| `npm run build`            | 모든 프로젝트 빌드             |
| `npm run deploy`           | 모든 프로젝트 배포             |
| `npm run dev:all`          | 모든 프로젝트 개발 서버 (병렬) |
| `npm run dev:signin`       | SignIn Popup 개발 서버         |
| `npm run dev:dashboard`    | 북마크 허브 대시보드 개발 서버 |
| `npm run dev:extension`    | Extension 개발 환경            |
| `npm run build:signin`     | SignIn Popup 빌드              |
| `npm run build:dashboard`  | 북마크 허브 대시보드 빌드      |
| `npm run build:extension`  | Extension 빌드 & 패키징        |
| `npm run deploy:signin`    | SignIn Popup 배포              |
| `npm run deploy:dashboard` | 북마크 허브 대시보드 배포      |
| `npm run deploy:extension` | Extension 패키징               |

## 🔧 각 프로젝트별 상세 정보

### 1. SignIn Popup (`signin-popup/`)

- Firebase Authentication용 팝업 구현
- Chrome Extension에서 사용
- 배포 URL: https://bookmarkhub-5ea6c.web.app

### 2. 북마크 허브 대시보드 (`bookmarkhub-dashboard/`)

- React + TypeScript + Vite 기반 웹 대시보드
- Firebase Authentication 및 Firestore 통합
- 북마크 관리, 컬렉션 시스템, 위젯 등 완전한 기능

### 3. Chrome Extension (`my-extension/`)

- Manifest V3
- Firebase 통합
- Offscreen Document 사용

## 🛠 개발 팁

1. **루트에서 배포**: `./deploy.sh`로 signin-popup 배포
2. **개별 프로젝트**: 각 디렉토리에서 개별적으로 작업
3. **통합 관리**: 루트 레벨에서 공통 작업 수행

## 🔑 Firebase 프로젝트

- **프로젝트 ID**: `bookmarkhub-5ea6c`
- **콘솔**: https://console.firebase.google.com/project/bookmarkhub-5ea6c/overview
