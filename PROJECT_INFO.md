# 📚 북마크 허브 (Bookmark Hub)

**통합 북마크 관리 시스템**

Firebase를 기반으로 한 완전한 북마크 관리 솔루션으로, Chrome Extension, 웹 대시보드, 그리고 인증 시스템이 seamless하게 연동되는 통합 플랫폼입니다.

## 🎯 프로젝트 개요

북마크 허브는 현대적인 웹 사용자들이 필요로 하는 완전한 북마크 관리 경험을 제공하는 통합 솔루션입니다:

- **🧩 Chrome Extension**: Manifest V3 기반 북마크 관리 확장 프로그램
- **📊 웹 대시보드**: React + TypeScript 기반 완전한 북마크 관리 대시보드
- **🔐 Auth Popup**: Chrome Extension용 독립 인증 페이지
- **🚀 통합 배포 시스템**: Firebase Hosting 자동 배포

## 🏗 아키텍처

```
북마크 허브/
├── 🧩 Chrome Extension (my-extension/)
│   ├── 북마크 추가/관리 Popup UI
│   ├── Background Service Worker
│   ├── Offscreen Document
│   └── 웹 대시보드와의 실시간 동기화
│
├── 📊 웹 대시보드 (bookmarkhub-dashboard/)
│   ├── 북마크 관리 시스템
│   ├── 컬렉션 기반 분류
│   ├── 드래그 앤 드롭 인터페이스
│   ├── 위젯 시스템 (날씨, 명언 등)
│   ├── Firebase Auth Integration
│   ├── Extension Bridge Component
│   └── 반응형 UI Components
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

- Chrome Extension ↔ 웹 대시보드 양방향 통신
- 실시간 북마크 동기화 (Firestore)
- 통합 인증 상태 관리 (Chrome Storage)
- 자동 로그인 상태 동기화

### 📚 **완전한 북마크 관리**

- 직관적인 북마크 추가/편집/삭제
- 컬렉션 기반 카테고리 분류
- 드래그 앤 드롭으로 쉬운 정리
- 검색 및 필터링 기능
- 자동 파비콘 수집

### 🔒 **Enterprise-Grade Security**

- Firebase Authentication 기반
- Manifest V3 보안 정책 준수
- CSP (Content Security Policy) 적용
- 사용자별 데이터 격리

### 🚀 **Developer Experience**

- 원클릭 배포 시스템
- 통합 개발 서버
- 자동 빌드 & 패키징
- 핫 리로딩 지원

### 📱 **Modern Tech Stack**

- React 19 + TypeScript
- Vite Build System
- Firebase 12.x + Firestore
- Chrome Extension Manifest V3
- Tailwind CSS + Framer Motion

## 🎨 브랜딩

**로고 컨셉**: 📚 + 🔗 (Book + Link)
**컬러 스킴**: Brand Blue (#3B82F6) + Accent Orange (#F59E0B)
**태그라인**: "북마크를 한 곳에서 관리하고, 어디서나 접근하세요"

## 📦 패키지 정보

- **이름**: `bookmark-hub`
- **버전**: `1.0.0`
- **라이선스**: MIT
- **키워드**: bookmark, bookmark-manager, firebase, chrome-extension, react, dashboard
