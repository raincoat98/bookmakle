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

1. **환경변수 설정**

   ```bash
   # config.env 파일을 생성하고 Firebase 설정값을 입력
   cp env.example config.env

   # config.env 파일을 편집하여 실제 Firebase 설정값 입력
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

2. **프로젝트 ID 설정**

   ```bash
   # .firebaserc 파일에서 프로젝트 ID 변경
   # "your-firebase-project-id"를 실제 프로젝트 ID로 변경
   ```

3. **Firebase CLI 로그인**

   ```bash
   npx firebase login
   ```

4. **프로젝트 초기화**
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
├── package.json      # 스크립트 및 의존성
├── config.env        # 환경변수 (Git에 포함되지 않음)
├── env.example       # 환경변수 예시
└── vite.config.js    # Vite 설정
```

## 주의사항

- Node.js 20.0.0 이상이 필요합니다
- Firebase 프로젝트가 생성되어 있어야 합니다
- .firebaserc 파일의 프로젝트 ID를 실제 ID로 변경해야 합니다
- config.env 파일에 실제 Firebase 설정값을 입력해야 합니다
- config.env 파일은 Git에 포함되지 않으므로 각 개발자가 개별적으로 설정해야 합니다
