import { useState, useEffect } from "react";

export type WidgetId =
  | "clock"
  | "stats"
  | "favorite-bookmarks"
  | "collection-distribution"
  | "quick-actions";

export interface WidgetConfig {
  id: WidgetId;
  title: string;
  enabled: boolean;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "clock", title: "시계", enabled: true },
  { id: "stats", title: "통계", enabled: true },
  { id: "favorite-bookmarks", title: "즐겨찾기 북마크", enabled: true },
  { id: "collection-distribution", title: "컬렉션 분포", enabled: true },
  { id: "quick-actions", title: "빠른 작업", enabled: true },
];

export const useWidgetOrder = (userId: string) => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [isEditMode, setIsEditMode] = useState(false);

  // 로컬 스토리지 키
  const storageKey = `widget-order-${userId}`;

  // 위젯 순서 로드
  useEffect(() => {
    if (!userId) return;

    try {
      const savedOrder = localStorage.getItem(storageKey);
      if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder);
        setWidgets(parsedOrder);
      }
    } catch (error) {
      console.error("위젯 순서 로드 실패:", error);
    }
  }, [userId, storageKey]);

  // 위젯 순서 저장
  const saveWidgetOrder = (newWidgets: WidgetConfig[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(newWidgets));
      setWidgets(newWidgets);
    } catch (error) {
      console.error("위젯 순서 저장 실패:", error);
    }
  };

  // 위젯 순서 변경
  const reorderWidgets = (newWidgets: WidgetConfig[]) => {
    saveWidgetOrder(newWidgets);
  };

  // 위젯 활성화/비활성화
  const toggleWidget = (widgetId: WidgetId) => {
    const newWidgets = widgets.map((widget) =>
      widget.id === widgetId ? { ...widget, enabled: !widget.enabled } : widget
    );
    saveWidgetOrder(newWidgets);
  };

  // 위젯 순서 초기화
  const resetWidgetOrder = () => {
    saveWidgetOrder(DEFAULT_WIDGETS);
  };

  return {
    widgets,
    isEditMode,
    setIsEditMode,
    reorderWidgets,
    toggleWidget,
    resetWidgetOrder,
  };
};
