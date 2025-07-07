# Firebase Hosting 설정

## 사전 준비

1. **Node.js 업그레이드** (필수)

   ```bash
   # Node.js 20.0.0 이상으로 업그레이드
   # nvm 사용 시:
   nvm install 20
   nvm use 20
   ```

2. **Firebase 프로젝트 생성**
   - [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
   - Hosting 서비스 활성화

## 설정

1. **프로젝트 ID 설정**

   ```bash
   # .firebaserc 파일에서 프로젝트 ID 변경
   # "your-firebase-project-id"를 실제 프로젝트 ID로 변경
   ```

2. **Firebase CLI 로그인**

   ```bash
   npx firebase login
   ```

3. **프로젝트 초기화**
   ```bash
   npx firebase use --add
   ```

## 사용 방법

### 로컬 서버 실행

```bash
npm run serve
```

### 배포

```bash
# Hosting만 배포
npm run deploy:hosting

# 전체 배포
npm run deploy
```

## 파일 구조

```
firebase/
├── public/           # 호스팅될 파일들
│   ├── index.html
│   └── signInWithPopup.js
├── firebase.json     # Firebase 설정
├── .firebaserc       # 프로젝트 설정
└── package.json      # 스크립트 및 의존성
```

## 주의사항

- Node.js 20.0.0 이상이 필요합니다
- Firebase 프로젝트가 생성되어 있어야 합니다
- .firebaserc 파일의 프로젝트 ID를 실제 ID로 변경해야 합니다
