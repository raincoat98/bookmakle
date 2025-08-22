# Firebase Chrome 확장 프로그램 인증 설정 가이드

## 1. Firebase 콘솔 설정

### 1.1 승인된 도메인 추가

1. [Firebase 콘솔](https://console.firebase.google.com/)에 접속
2. 프로젝트 선택: `bookmarkhub-5ea6c`
3. 왼쪽 메뉴에서 **Authentication** 클릭
4. **Settings** 탭 클릭
5. **Authorized domains** 섹션에서 **Add domain** 클릭
6. Chrome 확장 프로그램 ID를 다음 형식으로 추가:
   ```
   chrome-extension://YOUR_EXTENSION_ID
   ```

### 1.2 Chrome 확장 프로그램 ID 확인 방법

#### 개발 모드에서:

1. Chrome에서 `chrome://extensions/` 접속
2. 개발자 모드 활성화
3. 확장 프로그램 로드 후 생성된 ID 복사
4. 또는 확장 프로그램 카드에서 **Details** 클릭하여 ID 확인

#### 프로덕션 배포 시:

1. Chrome Web Store에 업로드 후 받은 확장 프로그램 ID 사용

### 1.3 Google 로그인 제공업체 설정

1. Firebase 콘솔 > Authentication > Sign-in method
2. **Google** 제공업체 클릭
3. **Enable** 활성화
4. **Project support email** 설정
5. **Save** 클릭

## 2. 환경 변수 설정

### 2.1 Firebase 호스팅 환경 변수

`firebase/.env` 파일에 다음 변수들이 설정되어 있는지 확인:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 2.2 환경 변수 확인 방법

1. Firebase 콘솔 > Project settings
2. **General** 탭에서 **Your apps** 섹션
3. 웹 앱 설정에서 환경 변수 값들 확인

## 3. 보안 규칙 설정

### 3.1 Firestore 보안 규칙

`firebase/firestore.rules` 파일이 올바르게 설정되어 있는지 확인:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 인증 확인
    function isAuthenticated() {
      return request.auth != null;
    }

    // 사용자 본인 확인
    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    // 북마크 규칙
    match /bookmarks/{bookmarkId} {
      allow read, write: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
    }

    // 컬렉션 규칙
    match /collections/{collectionId} {
      allow read, write: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
    }

    // 사용자 프로필 규칙
    match /users/{userId} {
      allow read, write: if isAuthenticated() && isOwner(userId);
    }
  }
}
```

## 4. 테스트 및 디버깅

### 4.1 인증 테스트

1. Chrome 확장 프로그램 로드
2. 확장 프로그램 아이콘 클릭
3. **로그인 하기** 버튼 클릭
4. Google 로그인 팝업 확인
5. 로그인 성공 후 사용자 정보 표시 확인

### 4.2 오류 디버깅

#### 일반적인 오류들:

1. **"이 도메인에서 인증이 허용되지 않습니다"**

   - Firebase 콘솔에서 승인된 도메인에 확장 프로그램 ID 추가 확인

2. **"Google 로그인이 비활성화되어 있습니다"**

   - Firebase 콘솔에서 Google 제공업체 활성화 확인

3. **"팝업이 차단되었습니다"**

   - 브라우저 팝업 차단 설정 확인
   - 확장 프로그램 권한 확인

4. **"네트워크 연결을 확인해주세요"**
   - 인터넷 연결 상태 확인
   - Firebase 프로젝트 설정 확인

### 4.3 개발자 도구 디버깅

1. 확장 프로그램 팝업에서 F12 개발자 도구 열기
2. Console 탭에서 오류 메시지 확인
3. Network 탭에서 Firebase API 호출 상태 확인

## 5. 배포 시 주의사항

### 5.1 프로덕션 환경

1. Firebase 프로젝트가 프로덕션 모드인지 확인
2. 환경 변수가 올바르게 설정되었는지 확인
3. 보안 규칙이 적절히 설정되었는지 확인

### 5.2 Chrome Web Store 배포

1. 확장 프로그램 패키징
2. Chrome Web Store에 업로드
3. 승인 후 받은 확장 프로그램 ID로 Firebase 설정 업데이트

## 6. 성능 최적화

### 6.1 인증 성능

1. Offscreen document 재사용
2. 인증 상태 캐싱
3. 불필요한 API 호출 최소화

### 6.2 오류 처리

1. 자동 재시도 로직
2. 사용자 친화적인 오류 메시지
3. 네트워크 오류 대응

## 7. 보안 고려사항

### 7.1 인증 보안

1. HTTPS 통신 강제
2. Origin 검증
3. 토큰 만료 처리

### 7.2 데이터 보안

1. 사용자별 데이터 격리
2. 민감한 정보 암호화
3. 접근 권한 검증

## 8. 모니터링 및 로깅

### 8.1 Firebase Analytics

1. 사용자 인증 이벤트 추적
2. 오류 발생 패턴 분석
3. 성능 메트릭 수집

### 8.2 로그 분석

1. 콘솔 로그 정리
2. 오류 로그 수집
3. 사용자 피드백 수집

---

이 가이드를 따라 설정하면 Chrome 확장 프로그램에서 Firebase 인증이 안정적으로 작동할 것입니다.
