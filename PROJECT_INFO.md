# 🔥 FireAuth Suite

**통합 Firebase Authentication 보일러플레이트**

Firebase Authentication을 활용한 완전한 인증 시스템으로, Chrome Extension, React 웹앱, 그리고 SignIn Popup이 seamless하게 연동되는 통합 솔루션입니다.

## 🎯 프로젝트 개요

FireAuth Suite는 현대적인 웹 개발에서 필요한 모든 인증 시나리오를 커버하는 종합 보일러플레이트입니다:

- **🧩 Chrome Extension**: Manifest V3 기반 브라우저 확장 프로그램
- **⚛️ React Web App**: Vite + TypeScript 기반 모던 웹 애플리케이션
- **🔐 Auth Popup**: Chrome Extension용 독립 인증 페이지
- **🚀 통합 배포 시스템**: Firebase Hosting 자동 배포

## 🏗 아키텍처

```
FireAuth Suite/
├── 🧩 Chrome Extension (my-extension/)
│   ├── Popup UI
│   ├── Background Service Worker
│   ├── Offscreen Document
│   └── External Communication
│
├── ⚛️ React Web App (my-app/)
│   ├── Firebase Auth Integration
│   ├── Extension Bridge Component
│   ├── Protected Routes
│   └── Modern UI Components
│
├── 🔐 Auth Popup (signin-popup/)
│   ├── Firebase Auth Popup
│   ├── PostMessage Communication
│   └── Lightweight HTML/JS
│
└── 🛠 DevOps Tools
    ├── 통합 배포 스크립트
    ├── 개발 서버 관리
    └── 빌드 자동화
```

## 🌟 핵심 특징

### ✨ **Seamless Integration**

- Chrome Extension ↔ React App 양방향 통신
- 통합 인증 상태 관리 (Chrome Storage)
- 자동 로그인 상태 동기화

### 🔒 **Enterprise-Grade Security**

- Firebase Authentication 기반
- Manifest V3 보안 정책 준수
- CSP (Content Security Policy) 적용

### 🚀 **Developer Experience**

- 원클릭 배포 시스템
- 통합 개발 서버
- 자동 빌드 & 패키징

### 📱 **Modern Tech Stack**

- React 19 + TypeScript
- Vite Build System
- Firebase 12.x
- Chrome Extension Manifest V3

## 🎨 브랜딩

**로고 컨셉**: 🔥 + 🔐 (Fire + Lock)
**컬러 스킴**: Firebase Orange (#FF5722) + Auth Blue (#2196F3)
**태그라인**: "Authentication Made Simple, Integration Made Seamless"

## 📦 패키지 정보

- **이름**: `fireauth-suite`
- **버전**: `1.0.0`
- **라이선스**: MIT
- **키워드**: firebase, authentication, chrome-extension, react, boilerplate
