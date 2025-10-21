# 관리자 페이지 가이드

## 개요

북마클(Bookmarkle) 관리자 페이지는 전체 사용자를 관리하고 통계를 확인할 수 있는 대시보드입니다.

## 관리자 설정

### 1. 환경 변수 설정

관리자 계정을 설정하려면 다음 환경 변수를 `.env` 파일에 추가하세요:

```env
VITE_ADMIN_EMAIL=your-admin-email@example.com
```

여러 명의 관리자를 추가하려면 `firebase.ts` 파일의 `ADMIN_EMAILS` 배열을 수정하세요:

```typescript
const ADMIN_EMAILS = [
  "admin1@bookmarkle.com",
  "admin2@bookmarkle.com",
  import.meta.env.VITE_ADMIN_EMAIL || "admin@bookmarkle.com",
];
```

### 2. 관리자 권한 확인

관리자는 두 가지 방식으로 확인됩니다:

1. **이메일 기반** (기본값): 환경 변수 또는 하드코딩된 이메일 목록으로 확인
2. **Firestore 기반** (선택사항): Firestore의 `admins` 컬렉션에 문서를 추가하여 관리자 권한 부여

#### Firestore 기반 관리자 설정 방법

Firebase Console에서 다음과 같이 설정:

```
Collection: admins
Document ID: [사용자의 uid]
Fields: (빈 문서 또는 추가 정보)
```

## 관리자 페이지 기능

### 1. 대시보드 접근

- 관리자로 로그인하면 헤더에 방패(🛡️) 아이콘이 표시됩니다
- 방패 아이콘을 클릭하거나 `/admin` 경로로 이동하면 관리자 대시보드에 접근할 수 있습니다
- 관리자가 아닌 사용자가 `/admin` 경로로 접근하면 자동으로 대시보드로 리디렉션됩니다

### 2. 통계 카드

관리자 대시보드 상단에는 다음 통계가 표시됩니다:

- **전체 사용자**: 등록된 총 사용자 수
- **총 북마크**: 모든 사용자의 북마크 총합
- **총 컬렉션**: 모든 사용자의 컬렉션 총합

### 3. 사용자 목록

사용자 테이블에서 다음 정보를 확인할 수 있습니다:

| 컬럼 | 설명 |
|------|------|
| 사용자 | 사용자 이름 및 UID (앞 8자리) |
| 이메일 | 사용자 이메일 주소 |
| 북마크 | 해당 사용자의 북마크 개수 |
| 컬렉션 | 해당 사용자의 컬렉션 개수 |
| 가입일 | 사용자가 가입한 날짜 |
| 작업 | 상세보기 버튼 |

### 4. 검색 기능

- 상단 검색 바를 사용하여 이메일 또는 이름으로 사용자를 검색할 수 있습니다
- 검색은 실시간으로 필터링됩니다

### 5. 사용자 상세 정보

"상세보기" 버튼을 클릭하면 모달이 열리며 다음 정보를 확인할 수 있습니다:

- 사용자 ID (전체)
- 이름
- 이메일
- 북마크 수
- 컬렉션 수
- 가입일 (시간 포함)
- 마지막 로그인 (설정된 경우)

## 보안 고려사항

### 1. 클라이언트 사이드 검증

현재 구현은 클라이언트 사이드에서 관리자 권한을 검증합니다. 프로덕션 환경에서는 추가 보안 조치를 고려하세요:

- Firebase Custom Claims 사용
- Cloud Functions를 통한 서버 사이드 검증
- Firestore Security Rules 설정

### 2. Firestore Security Rules 예시

관리자 페이지에서 사용하는 데이터에 대한 Security Rules 예시:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 문서는 모든 인증된 사용자가 읽을 수 있음 (관리자용)
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
      
      // 사용자의 북마크 및 컬렉션
      match /bookmarks/{bookmarkId} {
        allow read: if request.auth != null;
        allow write: if request.auth.uid == userId;
      }
      
      match /collections/{collectionId} {
        allow read: if request.auth != null;
        allow write: if request.auth.uid == userId;
      }
    }
    
    // 관리자 컬렉션은 관리자만 읽을 수 있음
    match /admins/{adminId} {
      allow read: if request.auth != null && request.auth.uid == adminId;
      allow write: if false; // Firebase Console에서만 수정 가능
    }
  }
}
```

## 트러블슈팅

### 관리자 메뉴가 보이지 않는 경우

1. `.env` 파일에 `VITE_ADMIN_EMAIL`이 올바르게 설정되었는지 확인
2. 로그인한 이메일이 환경 변수의 이메일과 일치하는지 확인
3. 개발 서버를 재시작 (`npm run dev`)
4. 브라우저 캐시를 삭제하고 새로고침

### 사용자 목록이 로드되지 않는 경우

1. Firebase Console에서 Firestore가 활성화되었는지 확인
2. Firestore Security Rules가 올바르게 설정되었는지 확인
3. 브라우저 콘솔에서 오류 메시지 확인
4. 네트워크 탭에서 Firestore 요청이 성공하는지 확인

### "관리자 대시보드" 접근이 거부되는 경우

1. 관리자 권한이 올바르게 설정되었는지 확인
2. `firebase.ts`의 `isAdmin()` 함수가 올바르게 작동하는지 확인
3. 로그아웃 후 다시 로그인

## 향후 개선 사항

- [ ] 사용자 활동 로그 추가
- [ ] 사용자 계정 활성화/비활성화 기능
- [ ] 사용자의 북마크 상세 조회 기능
- [ ] 통계 그래프 및 차트 추가
- [ ] 사용자 검색 필터 고급화 (날짜 범위, 북마크 수 등)
- [ ] 관리자 활동 로그
- [ ] 이메일 알림 기능
- [ ] CSV 내보내기 기능

## 문의

기능 개선 제안이나 버그 리포트는 GitHub Issues를 통해 제출해주세요.

