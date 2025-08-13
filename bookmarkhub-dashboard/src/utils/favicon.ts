// URL에서 도메인 추출
export const getDomainFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return "";
  }
};

// URL이 이미지 URL인지 확인
export const isImageUrl = (url: string): boolean => {
  const imageExtensions = [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".ico",
    ".webp",
  ];
  const lowerUrl = url.toLowerCase();

  // 이미지 확장자로 끝나는지 확인
  if (imageExtensions.some((ext) => lowerUrl.endsWith(ext))) {
    return true;
  }

  // 이미지 관련 경로 패턴 확인
  const imagePatterns = [
    "/favicon",
    "/icon",
    "/logo",
    "/image",
    "/img",
    "gstatic.com/mobilesdk",
    "firebase_28dp.png",
  ];

  return imagePatterns.some((pattern) => lowerUrl.includes(pattern));
};

// 파비콘 URL 생성 (Google 파비콘 서비스 또는 직접 이미지 URL)
export const getFaviconUrl = (url: string): string => {
  // URL이 이미 이미지 URL인지 확인
  if (isImageUrl(url)) {
    return url;
  }

  const domain = getDomainFromUrl(url);
  if (!domain) return "";

  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
};

// 파비콘 URL 검증
export const validateFaviconUrl = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    if (response.ok) {
      return url;
    }
  } catch (error) {
    console.error("파비콘 URL 검증 실패:", error);
  }

  // 기본 파비콘 URL 반환
  return getFaviconUrl(url);
};

// 웹사이트에서 파비콘 찾기 (CORS 우회)
export const findFaviconFromWebsite = async (url: string): Promise<string> => {
  try {
    // CORS 정책으로 인해 직접 접근이 불가능하므로
    // Google 파비콘 서비스를 우선적으로 사용
    const domain = getDomainFromUrl(url);
    if (!domain) return getFaviconUrl(url);

    // 여러 파비콘 서비스 시도
    const faviconServices = [
      `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
      `https://favicon.ico/${domain}`,
      `https://icon.horse/icon/${domain}`,
    ];

    // 첫 번째 서비스 (Google)를 기본으로 사용
    return faviconServices[0];
  } catch (error) {
    console.error("파비콘 서비스 접근 실패:", error);
    return getFaviconUrl(url);
  }
};

// 파비콘 재가져오기 (안정적인 방법)
export const refreshFavicon = async (url: string): Promise<string> => {
  console.log("파비콘 재가져오기 시작:", url);

  try {
    // URL이 이미 이미지 URL인지 확인
    if (isImageUrl(url)) {
      console.log("직접 이미지 URL 사용:", url);
      const status = await checkFaviconStatus(url);
      if (status.valid) {
        return url;
      }
    }

    // Google 파비콘 서비스를 우선적으로 사용 (가장 안정적)
    const googleFavicon = getFaviconUrl(url);
    console.log("Google 파비콘 서비스 사용:", googleFavicon);

    // 파비콘 유효성 검사
    const status = await checkFaviconStatus(googleFavicon);
    if (status.valid) {
      return googleFavicon;
    }

    // Google 파비콘이 실패하면 다른 서비스 시도
    const domain = getDomainFromUrl(url);
    if (domain) {
      const alternativeServices = [
        `https://favicon.ico/${domain}`,
        `https://icon.horse/icon/${domain}`,
      ];

      for (const serviceUrl of alternativeServices) {
        try {
          const status = await checkFaviconStatus(serviceUrl);
          if (status.valid) {
            console.log("대체 파비콘 서비스 사용:", serviceUrl);
            return serviceUrl;
          }
        } catch (error) {
          console.warn("대체 파비콘 서비스 실패:", serviceUrl, error);
        }
      }
    }

    // 모든 서비스가 실패하면 기본 Google 파비콘 반환
    return googleFavicon;
  } catch (error) {
    console.error("파비콘 재가져오기 실패:", error);
    // 최종적으로 기본 파비콘 URL 반환
    return getFaviconUrl(url);
  }
};

// 파비콘 미리보기 URL 생성
export const getFaviconPreviewUrl = (url: string): string => {
  const domain = getDomainFromUrl(url);
  if (!domain) return "";

  // 더 큰 크기로 미리보기
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
};

// 파비콘 상태 확인 (타임아웃 포함)
export const checkFaviconStatus = async (
  faviconUrl: string
): Promise<{ valid: boolean; error?: string }> => {
  try {
    // 타임아웃 설정 (5초)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    await fetch(faviconUrl, {
      method: "HEAD",
      signal: controller.signal,
      mode: "no-cors", // CORS 정책 우회
    });

    clearTimeout(timeoutId);

    // no-cors 모드에서는 응답이 있다면 유효하다고 간주
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
