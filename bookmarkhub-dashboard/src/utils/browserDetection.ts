/**
 * 브라우저 호환성 감지 유틸리티
 * 구글 로그인이 제한될 수 있는 브라우저들을 감지합니다.
 */

export interface BrowserInfo {
  name: string;
  isCompatible: boolean;
  isInAppBrowser: boolean;
  userAgent: string;
}

export function detectBrowser(): BrowserInfo {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // 카카오톡 인앱 브라우저 감지
  const isKakaoTalk = userAgent.includes('kakaotalk');
  
  // 네이버 앱 브라우저 감지
  const isNaverApp = userAgent.includes('naver') || userAgent.includes('whale');
  
  // 라인 앱 브라우저 감지
  const isLineApp = userAgent.includes('line');
  
  // 페이스북 인앱 브라우저 감지
  const isFacebookApp = userAgent.includes('fbav') || userAgent.includes('fban');
  
  // 인스타그램 인앱 브라우저 감지
  const isInstagramApp = userAgent.includes('instagram');
  
  // 기타 인앱 브라우저 감지 패턴
  const isInAppBrowser = isKakaoTalk || isNaverApp || isLineApp || isFacebookApp || isInstagramApp ||
                        userAgent.includes('wv') || // WebView 감지
                        userAgent.includes('version') && userAgent.includes('mobile');

  // 브라우저 이름 결정
  let browserName = '알 수 없는 브라우저';
  if (isKakaoTalk) browserName = '카카오톡';
  else if (isNaverApp) browserName = '네이버 앱';
  else if (isLineApp) browserName = '라인';
  else if (isFacebookApp) browserName = '페이스북';
  else if (isInstagramApp) browserName = '인스타그램';
  else if (userAgent.includes('chrome')) browserName = 'Chrome';
  else if (userAgent.includes('safari')) browserName = 'Safari';
  else if (userAgent.includes('firefox')) browserName = 'Firefox';
  else if (userAgent.includes('edge')) browserName = 'Edge';

  // 호환성 판단 - 인앱 브라우저는 대부분 구글 로그인에 제한이 있음
  const isCompatible = !isInAppBrowser;

  return {
    name: browserName,
    isCompatible,
    isInAppBrowser,
    userAgent: navigator.userAgent
  };
}

export function getRecommendedBrowsers(): string[] {
  return ['Chrome', 'Safari', 'Firefox', 'Edge'];
}

export function getBrowserCompatibilityMessage(browserInfo: BrowserInfo): string {
  if (browserInfo.isCompatible) {
    return '';
  }

  if (browserInfo.isInAppBrowser) {
    return `${browserInfo.name}에서는 구글 로그인이 제한될 수 있습니다. 더 나은 경험을 위해 일반 브라우저(Chrome, Safari 등)에서 접속해주세요.`;
  }

  return '현재 브라우저에서는 구글 로그인이 제한될 수 있습니다. Chrome, Safari, Firefox, Edge 등의 브라우저를 사용해주세요.';
}
