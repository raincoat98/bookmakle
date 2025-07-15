import React, { useMemo } from "react";
import type { Bookmark, Collection } from "../types";
import { SortableBookmarkCard } from "./SortableBookmarkCard";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { BookOpen } from "lucide-react";

interface BookmarkListProps {
  bookmarks: Bookmark[];
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onReorder: (newBookmarks: Bookmark[]) => void;
  collections?: Collection[];
  searchTerm: string;
  viewMode: "grid" | "list";
}

export const BookmarkList: React.FC<BookmarkListProps> = ({
  bookmarks,
  onEdit,
  onDelete,
  onToggleFavorite,
  onReorder,
  collections = [],
  searchTerm,
  viewMode,
}) => {
  // 필터링된 북마크
  const filteredBookmarks = useMemo(() => {
    let filtered = bookmarks;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (bookmark) =>
          bookmark.title.toLowerCase().includes(term) ||
          bookmark.url.toLowerCase().includes(term) ||
          (bookmark.description &&
            bookmark.description.toLowerCase().includes(term))
      );
    }
    return filtered;
  }, [bookmarks, searchTerm]);

  // 드래그 앤 드롭 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1, // 드래그 시작 거리를 최소로 설정
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 드래그 종료 핸들러
  const handleDragEnd = (event: DragEndEvent) => {
    console.log("Drag end event:", event); // 디버깅 로그
    const { active, over } = event;

    if (!over) {
      console.log("No drop target found"); // 드롭 타겟이 없는 경우
      return;
    }

    if (active.id !== over.id) {
      const oldIndex = filteredBookmarks.findIndex(
        (item) => item.id === active.id
      );
      const newIndex = filteredBookmarks.findIndex(
        (item) => item.id === over.id
      );

      console.log("Moving from index", oldIndex, "to", newIndex); // 디버깅 로그
      console.log("Active bookmark:", filteredBookmarks[oldIndex]?.title); // 이동하는 북마크
      console.log("Over bookmark:", filteredBookmarks[newIndex]?.title); // 대상 북마크

      const newBookmarks = arrayMove(filteredBookmarks, oldIndex, newIndex);
      console.log("New bookmarks array length:", newBookmarks.length); // 새로운 배열 길이

      // 부모 컴포넌트에 알림
      onReorder(newBookmarks);
    } else {
      console.log("Same position, no reorder needed"); // 같은 위치인 경우
    }
  };

  // 순서 변경 함수들
  const handleMoveUp = (bookmark: Bookmark) => {
    const currentIndex = filteredBookmarks.findIndex(
      (b) => b.id === bookmark.id
    );
    if (currentIndex > 0) {
      const newOrder = arrayMove(
        filteredBookmarks,
        currentIndex,
        currentIndex - 1
      );
      onReorder(newOrder);
    }
  };

  const handleMoveDown = (bookmark: Bookmark) => {
    const currentIndex = filteredBookmarks.findIndex(
      (b) => b.id === bookmark.id
    );
    if (currentIndex < filteredBookmarks.length - 1) {
      const newOrder = arrayMove(
        filteredBookmarks,
        currentIndex,
        currentIndex + 1
      );
      onReorder(newOrder);
    }
  };

  return (
    <div className="space-y-6">
      {/* 북마크 그리드/리스트 */}
      {filteredBookmarks.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          onDragStart={(event) => {
            console.log("Drag start event:", event); // 디버깅 로그
          }}
          onDragOver={(event) => {
            console.log("Drag over event:", event); // 디버깅 로그
          }}
        >
          <SortableContext
            items={filteredBookmarks.map((item) => item.id)}
            strategy={
              viewMode === "grid"
                ? rectSortingStrategy
                : verticalListSortingStrategy
            }
          >
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              }
            >
              {filteredBookmarks.map((bookmark, idx) => (
                <SortableBookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onRefreshFavicon={async () => {}}
                  faviconLoading={false}
                  collections={collections}
                  onToggleFavorite={onToggleFavorite}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                  isFirst={idx === 0}
                  isLast={idx === filteredBookmarks.length - 1}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="card-glass p-12 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-brand-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-soft">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            북마크가 없습니다
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm
              ? "검색 결과가 없습니다. 다른 검색어를 시도해보세요."
              : "첫 번째 북마크를 추가해보세요!"}
          </p>
        </div>
      )}
    </div>
  );
};
