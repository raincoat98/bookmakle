#!/bin/bash

# 통합 Firebase 서버 실행 스크립트
# 사용법: ./serve.sh [프로젝트] [포트번호]
# 프로젝트: signin-popup (기본값), dashboard (미지원)

set -e  # 에러 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 함수 정의
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 배너 출력
echo -e "${BLUE}"
echo "🔥 통합 Firebase 서버 스크립트"
echo "============================="
echo -e "${NC}"

# 프로젝트 및 포트 파라미터 처리
PROJECT="${1:-signin-popup}"
PORT="${2:-5000}"

# 첫 번째 파라미터가 숫자면 포트로 간주
if [[ "$1" =~ ^[0-9]+$ ]]; then
    PROJECT="signin-popup"
    PORT="$1"
fi

log_info "실행 대상: $PROJECT"
log_info "사용할 포트: $PORT"

# 루트 디렉토리 저장
ROOT_DIR=$(pwd)

# 포트 사용 중인지 확인하는 함수
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "포트 $port가 이미 사용 중입니다!"
        
        # 사용 중인 프로세스 정보 표시
        PROCESS_INFO=$(lsof -Pi :$port -sTCP:LISTEN)
        echo -e "${YELLOW}현재 사용 중인 프로세스:${NC}"
        echo "$PROCESS_INFO"
        
        # 사용자에게 선택 옵션 제공
        echo ""
        echo "다음 중 선택하세요:"
        echo "1. 다른 포트 사용"
        echo "2. 기존 프로세스 종료 후 계속"
        echo "3. 종료"
        
        read -p "선택 (1-3): " -n 1 -r
        echo
        
        case $REPLY in
            1)
                # 사용 가능한 포트 찾기
                NEW_PORT=$((port + 1))
                while lsof -Pi :$NEW_PORT -sTCP:LISTEN -t >/dev/null 2>&1; do
                    NEW_PORT=$((NEW_PORT + 1))
                done
                PORT=$NEW_PORT
                log_info "새로운 포트로 변경: $PORT"
                ;;
            2)
                # 기존 프로세스 종료
                PID=$(lsof -ti :$port)
                if [ ! -z "$PID" ]; then
                    kill $PID
                    log_success "포트 $port의 프로세스를 종료했습니다"
                    sleep 1
                fi
                ;;
            3)
                log_info "스크립트를 종료합니다"
                exit 0
                ;;
            *)
                log_error "잘못된 선택입니다"
                exit 1
                ;;
        esac
    fi
}

# SignIn Popup Firebase 서버 함수
serve_signin_popup() {
    log_info "📱 SignIn Popup Firebase 서버 시작..."
    
    if [ ! -d "signin-popup" ]; then
        log_error "signin-popup 디렉토리가 없습니다!"
        return 1
    fi
    
    cd signin-popup
    
    # Firebase 프로젝트 확인
    if [ ! -f ".firebaserc" ]; then
        log_error "Firebase 프로젝트가 초기화되지 않았습니다!"
        log_info "다음 명령어로 초기화하세요: firebase init hosting"
        cd "$ROOT_DIR"
        return 1
    fi
    
    PROJECT_ID=$(cat .firebaserc | grep -o '"default": "[^"]*"' | cut -d'"' -f4)
    log_info "Firebase 프로젝트: $PROJECT_ID"
    
    # Firebase CLI 설치 확인
    if ! command -v firebase &> /dev/null; then
        log_warning "Firebase CLI가 설치되지 않았습니다. 설치 중..."
        npm install -g firebase-tools
        log_success "Firebase CLI 설치 완료"
    fi
    
    # 필수 파일 확인
    REQUIRED_FILES=("index.html" "signInWithPopup.js" "firebase.json")
    for file in "${REQUIRED_FILES[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "필수 파일이 없습니다: $file"
            cd "$ROOT_DIR"
            return 1
        fi
    done
    
    # 포트 확인
    check_port $PORT
    
    # Firebase 서버 시작
    log_success "Firebase 로컬 서버를 시작합니다..."
    echo ""
    echo -e "${GREEN}🌐 서버 URL: ${BLUE}http://localhost:$PORT${NC}"
    echo -e "${GREEN}📁 서빙 디렉토리: ${BLUE}$(pwd)${NC}"
    echo -e "${GREEN}🔥 Firebase 프로젝트: ${BLUE}$PROJECT_ID${NC}"
    echo ""
    echo -e "${YELLOW}서버를 중지하려면 Ctrl+C를 누르세요${NC}"
    echo ""
    
    # 브라우저 자동 열기 옵션
    if command -v open &> /dev/null; then
        read -p "브라우저에서 자동으로 열까요? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            sleep 2 && open "http://localhost:$PORT" &
            log_success "브라우저에서 사이트를 열었습니다"
        fi
    fi
    
    # Firebase 로컬 서버 시작
    firebase serve --only hosting --port $PORT
}

# 북마크 허브 대시보드 Firebase 서버 함수 (미지원 안내)
serve_dashboard() {
    log_warning "📊 북마크 허브 대시보드는 Firebase 서버를 지원하지 않습니다"
    echo ""
    echo -e "${YELLOW}북마크 허브 대시보드 개발 서버를 실행하려면:${NC}"
    echo "• ./dev.sh dashboard"
    echo "• cd bookmarkhub-dashboard && npm run dev"
    echo ""
    echo -e "${YELLOW}북마크 허브 대시보드를 Firebase Hosting에 배포하려면:${NC}"
    echo "• ./build.sh dashboard (빌드 먼저)"
    echo "• Firebase 콘솔에서 새 호스팅 사이트 설정"
    echo ""
    return 1
}

# 메인 서버 로직
case $PROJECT in
    "signin-popup")
        serve_signin_popup
        ;;
    "dashboard")
        serve_dashboard
        ;;
    "my-extension")
        log_warning "🧩 Chrome Extension은 Firebase 서버를 사용하지 않습니다"
        echo ""
        echo -e "${YELLOW}Chrome Extension 개발을 위해서는:${NC}"
        echo "• ./dev.sh my-extension (개발 환경 안내)"
        echo "• Chrome에서 chrome://extensions/ 접속"
        echo "• 개발자 모드 활성화 후 디렉토리 로드"
        echo ""
        exit 1
        ;;
    *)
        log_error "알 수 없는 프로젝트: $PROJECT"
        log_info "사용 가능한 프로젝트: signin-popup"
        log_info "다른 프로젝트는 ./dev.sh [프로젝트]를 사용하세요"
        exit 1
        ;;
esac

cd "$ROOT_DIR"
