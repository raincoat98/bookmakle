// URL에서 도메인 추출
export const getDomainFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return "";
  }
};

// 파비콘 URL 생성 (Google 파비콘 서비스)
export const getFaviconUrl = (url: string): string => {
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

// 웹사이트에서 파비콘 찾기
export const findFaviconFromWebsite = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const html = await response.text();

    // HTML에서 파비콘 링크 찾기
    const faviconMatch = html.match(
      /<link[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*href=["']([^"']+)["']/i
    );

    if (faviconMatch) {
      let faviconUrl = faviconMatch[1];

      // 상대 URL을 절대 URL로 변환
      if (faviconUrl.startsWith("/")) {
        const urlObj = new URL(url);
        faviconUrl = `${urlObj.protocol}//${urlObj.hostname}${faviconUrl}`;
      } else if (!faviconUrl.startsWith("http")) {
        const urlObj = new URL(url);
        faviconUrl = `${urlObj.protocol}//${urlObj.hostname}/${faviconUrl}`;
      }

      return faviconUrl;
    }
  } catch (error) {
    console.error("웹사이트에서 파비콘 찾기 실패:", error);
  }

  // 기본 파비콘 URL 반환
  return getFaviconUrl(url);
};

// 파비콘 재가져오기 (여러 방법 시도)
export const refreshFavicon = async (url: string): Promise<string> => {
  console.log("파비콘 재가져오기 시작:", url);

  try {
    // 1. 웹사이트에서 직접 파비콘 찾기
    const websiteFavicon = await findFaviconFromWebsite(url);
    if (websiteFavicon && websiteFavicon !== getFaviconUrl(url)) {
      console.log("웹사이트에서 파비콘 찾음:", websiteFavicon);
      return websiteFavicon;
    }

    // 2. Google 파비콘 서비스 사용
    const googleFavicon = getFaviconUrl(url);
    console.log("Google 파비콘 서비스 사용:", googleFavicon);
    return googleFavicon;
  } catch (error) {
    console.error("파비콘 재가져오기 실패:", error);
    // 3. 기본 파비콘 URL 반환
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

// 파비콘 상태 확인
export const checkFaviconStatus = async (
  faviconUrl: string
): Promise<{ valid: boolean; error?: string }> => {
  try {
    const response = await fetch(faviconUrl, { method: "HEAD" });
    return { valid: response.ok };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
