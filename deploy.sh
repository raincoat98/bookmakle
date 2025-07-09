#!/bin/bash

# BookmarkHub 전체 배포 스크립트
echo "🚀 BookmarkHub 배포 시작..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 에러 처리 함수
handle_error() {
    echo -e "${RED}❌ 배포 중 오류가 발생했습니다: $1${NC}"
    exit 1
}

# 성공 메시지 함수
success_msg() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 정보 메시지 함수
info_msg() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 경고 메시지 함수
warn_msg() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Extension 빌드
info_msg "Extension 빌드 중..."
cd extension || handle_error "extension 디렉토리를 찾을 수 없습니다"

if npm run build:extension; then
    success_msg "Extension 빌드 완료"
    echo -e "${GREEN}📁 Extension 위치: ~/Documents/chromeExtension/${NC}"
else
    handle_error "Extension 빌드 실패"
fi

# 2. Dashboard 빌드
info_msg "Dashboard 빌드 중..."
cd ../bookmarkhub-dashboard || handle_error "bookmarkhub-dashboard 디렉토리를 찾을 수 없습니다"

if npm run build:firebase; then
    success_msg "Dashboard 빌드 완료"
else
    handle_error "Dashboard 빌드 실패"
fi

# 3. Firebase 디렉토리로 이동
cd ../firebase || handle_error "firebase 디렉토리를 찾을 수 없습니다"

# 4. Firebase 프로젝트 확인
info_msg "Firebase 프로젝트 확인 중..."
if ! npx firebase-tools@13.0.0 projects:list | grep -q "bookmarkhub-5ea6c"; then
    handle_error "Firebase 프로젝트 'bookmarkhub-5ea6c'를 찾을 수 없습니다"
fi

# 5. 프로젝트 활성화
info_msg "Firebase 프로젝트 활성화 중..."
if npx firebase-tools@13.0.0 use default; then
    success_msg "Firebase 프로젝트 활성화 완료"
else
    handle_error "Firebase 프로젝트 활성화 실패"
fi

# 6. Dashboard 배포
info_msg "Dashboard 배포 중..."
if npx firebase-tools@13.0.0 deploy --only hosting:dashboard; then
    success_msg "Dashboard 배포 완료"
    echo -e "${GREEN}🌐 Dashboard URL: https://bookmarkhub-5ea6c-dashboard.web.app${NC}"
else
    handle_error "Dashboard 배포 실패"
fi

# 7. Webapp 배포 (선택사항)
read -p "Webapp도 배포하시겠습니까? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    info_msg "Webapp 배포 중..."
    if npx firebase-tools@13.0.0 deploy --only hosting:webapp; then
        success_msg "Webapp 배포 완료"
        echo -e "${GREEN}🌐 Webapp URL: https://bookmarkhub-5ea6c.web.app${NC}"
    else
        warn_msg "Webapp 배포 실패"
    fi
fi

# 8. 완료 메시지
echo
success_msg "배포가 완료되었습니다!"
echo -e "${BLUE}📋 배포된 서비스:${NC}"
echo -e "  • Extension: ${GREEN}~/Documents/chromeExtension/${NC}"
echo -e "  • Dashboard: ${GREEN}https://bookmarkhub-5ea6c-dashboard.web.app${NC}"
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "  • Webapp: ${GREEN}https://bookmarkhub-5ea6c.web.app${NC}"
fi
echo
info_msg "Firebase Console: https://console.firebase.google.com/project/bookmarkhub-5ea6c/overview" 

