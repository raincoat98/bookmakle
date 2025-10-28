// 브라우저 알림 관련 유틸리티 함수들

export interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

/**
 * 브라우저 알림 권한 상태를 확인합니다
 */
export const getNotificationPermission = (): NotificationPermission => {
  if (!("Notification" in window)) {
    return { granted: false, denied: false, default: false };
  }

  const permission = Notification.permission;
  return {
    granted: permission === "granted",
    denied: permission === "denied",
    default: permission === "default",
  };
};

/**
 * 브라우저 알림 권한을 요청합니다
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.warn("이 브라우저는 알림을 지원하지 않습니다.");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    console.warn("알림 권한이 거부되었습니다.");
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
};

/**
 * 브라우저 알림을 표시합니다
 */
export const showBrowserNotification = (
  title: string,
  options?: NotificationOptions
): Notification | null => {
  if (!("Notification" in window)) {
    console.warn("이 브라우저는 알림을 지원하지 않습니다.");
    return null;
  }

  if (Notification.permission !== "granted") {
    console.warn("알림 권한이 없습니다.");
    return null;
  }

  const defaultOptions: NotificationOptions = {
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: "bookmarkhub-notification",
    requireInteraction: false,
    silent: false,
    ...options,
  };

  try {
    const notification = new Notification(title, defaultOptions);

    // 알림 클릭 시 포커스
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // 자동으로 닫기 (5초 후)
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  } catch (error) {
    console.error("알림 표시 중 오류:", error);
    return null;
  }
};

/**
 * 북마크 관련 알림을 표시합니다
 */
export const showBookmarkNotification = (
  type: "added" | "updated" | "deleted",
  bookmarkTitle: string
): Notification | null => {
  const messages = {
    added: {
      title: "새 북마크 추가됨",
      body: `"${bookmarkTitle}" 북마크가 추가되었습니다.`,
      icon: "/icons/bookmark-added.png",
    },
    updated: {
      title: "북마크 수정됨",
      body: `"${bookmarkTitle}" 북마크가 수정되었습니다.`,
      icon: "/icons/bookmark-updated.png",
    },
    deleted: {
      title: "북마크 삭제됨",
      body: `"${bookmarkTitle}" 북마크가 삭제되었습니다.`,
      icon: "/icons/bookmark-deleted.png",
    },
  };

  const message = messages[type];
  return showBrowserNotification(message.title, {
    body: message.body,
    icon: message.icon,
  });
};

/**
 * 테스트 알림을 표시합니다
 */
export const showTestNotification = (): Notification | null => {
  return showBrowserNotification("테스트 알림", {
    body: "브라우저 알림이 정상적으로 작동합니다!",
    icon: "/favicon.ico",
  });
};
