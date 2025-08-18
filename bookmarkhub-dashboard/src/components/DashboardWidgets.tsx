import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Folder,
  FileText,
  Sparkles,
  Globe,
  Plus,
  FolderPlus,
  Edit,
  Trash2,
  Move,
  Settings,
  RotateCcw,
  Eye,
  EyeOff,
} from "lucide-react";
import type { Bookmark, Collection } from "../types";
import bibleVerses from "../data/bibleVerses.json";
import { WeatherWidget } from "./WeatherWidget";
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
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useWidgetOrder } from "../hooks/useWidgetOrder";
import type { WidgetId, WidgetConfig } from "../hooks/useWidgetOrder";

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  description?: string;
}

interface FavoriteBookmarksProps {
  bookmarks: Bookmark[];
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onReorder?: (newBookmarks: Bookmark[]) => void;
}

// CollectionDistributionProps 인터페이스 제거 (더 이상 사용하지 않음)

interface QuickActionsProps {
  onAddBookmark: () => void;
  onAddCollection: () => void;
}

interface DashboardOverviewProps {
  bookmarks: Bookmark[];
  collections: Collection[];
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onAddBookmark: () => void;
  onAddCollection: () => void;
  onReorder?: (newBookmarks: Bookmark[]) => void;
  userId: string;
}

// 정렬 가능한 위젯 컴포넌트
const SortableWidget: React.FC<{
  id: WidgetId;
  children: React.ReactNode;
  isEditMode: boolean;
  enabled: boolean;
  onToggle: () => void;
}> = ({ id, children, isEditMode, enabled, onToggle }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: id,
    disabled: !isEditMode,
    transition: {
      duration: 150,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!enabled) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? "opacity-50 z-50" : ""} ${
        isEditMode ? "cursor-move" : ""
      }`}
      {...attributes}
      {...listeners}
    >
      {isEditMode && (
        <div className="absolute top-2 right-2 z-10 flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="p-1 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title={enabled ? "위젯 숨기기" : "위젯 보이기"}
          >
            {enabled ? (
              <EyeOff className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>
          <div className="p-1 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <Move className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </div>
        </div>
      )}
      <div
        className={`${
          isEditMode
            ? "border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg p-2"
            : ""
        }`}
      >
        {children}
      </div>
    </div>
  );
};

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  color,
  description,
}) => {
  return (
    <>
      {/* 모바일 뱃지 스타일 (sm 미만) */}
      <div className="sm:hidden">
        <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-200 min-h-[80px]">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${color} shadow-lg mb-2`}
          >
            <div className="scale-75">{icon}</div>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">
              {value.toLocaleString()}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">
              {title}
            </p>
          </div>
        </div>
      </div>

      {/* 데스크톱 카드 스타일 (sm 이상) */}
      <div className="hidden sm:block card-glass p-6 hover-lift">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <p className="text-3xl font-bold gradient-text">
              {value.toLocaleString()}
            </p>
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl backdrop-blur-sm ${color}`}
          >
            {icon}
          </div>
        </div>
      </div>
    </>
  );
};

// 정렬 가능한 즐겨찾기 북마크 카드 컴포넌트
// 북마크 리스트 숨김으로 인해 사용하지 않음
// const SortableFavoriteBookmark: React.FC<{
//   bookmark: Bookmark;
//   onEdit: (bookmark: Bookmark) => void;
//   onDelete: (id: string) => void;
//   onToggleFavorite: (id: string, isFavorite: boolean) => void;
// }> = ({ bookmark, onEdit, onDelete, onToggleFavorite }) => {
//   const {
//     attributes,
//     listeners,
//     setNodeRef,
//     transform,
//     transition,
//     isDragging,
//   } = useSortable({
//     id: bookmark.id,
//     transition: {
//       duration: 150,
//       easing: "cubic-bezier(0.25, 1, 0.5, 1)",
//     },
//   });

//   const style = {
//     transform: CSS.Transform.toString(transform),
//     transition,
//   };

//   const handleFaviconClick = (url: string) => {
//     window.open(url, "_blank");
//   };

//   return (
//     <div
//       ref={setNodeRef}
//       style={style}
//       {...attributes}
//       {...listeners}
//       className={`group cursor-move animate-slide-up select-none ${
//         isDragging ? "opacity-50 z-50" : ""
//       }`}
//       title={`${bookmark.title} - 드래그하여 순서 변경`}
//     >
//       <div className="relative bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm rounded-2xl shadow-soft border border-white/30 dark:border-gray-600/30 p-4 hover:shadow-soft-lg transition-all duration-300 hover:scale-105">
//         <div className="flex flex-col items-center space-y-3">
//           <div className="relative">
//             {bookmark.favicon ? (
//               <img
//                 src={bookmark.favicon}
//                 alt={bookmark.title}
//                 className="w-8 h-8 rounded-lg shadow-sm hover:scale-110 transition-transform cursor-pointer"
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   handleFaviconClick(bookmark.url);
//                 }}
//                 onError={(e) => {
//                   e.currentTarget.style.display = "none";
//                 }}
//               />
//             ) : (
//               <div
//                 className="w-8 h-8 bg-gradient-to-r from-brand-500 to-accent-500 rounded-lg shadow-sm flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   handleFaviconClick(bookmark.url);
//                 }}
//               >
//                 <Globe className="w-4 h-4 text-white" />
//               </div>
//             )}

//             <button
//               onClick={(e) => {
//                 e.stopPropagation();
//                 onToggleFavorite(bookmark.id, false);
//               }}
//               className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-soft"
//               title="즐겨찾기 해제"
//             >
//               <Heart className="w-3 h-3 fill-current" />
//             </button>
//           </div>

//           <div className="text-center space-y-1">
//             <p className="text-xs font-medium text-gray-900 dark:text-white truncate w-full">
//               {bookmark.title}
//             </p>
//             <div className="flex space-x-1">
//               <button
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   onEdit(bookmark);
//                 }}
//                 className="p-1 text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 rounded-lg transition-colors duration-200 hover:bg-white/50 dark:hover:bg-gray-600/50"
//                 title="편집"
//               >
//                 <Edit className="w-3 h-3" />
//               </button>
//               <button
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   onDelete(bookmark.id);
//                 }}
//                 className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors duration-200 hover:bg-white/50 dark:hover:bg-gray-600/50"
//                 title="삭제"
//               >
//                 <Trash2 className="w-3 h-3" />
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// 북마크 리스트 숨김으로 인해 사용하지 않음
// const FavoriteBookmarks: React.FC<FavoriteBookmarksProps> = ({
//   bookmarks,
//   onEdit,
//   onDelete,
//   onToggleFavorite,
//   onReorder,
// }) => {
//   const initialFavoriteBookmarks = bookmarks
//     .filter((b) => b.isFavorite)
//     .slice(0, 8);
//   const [favoriteBookmarks, setFavoriteBookmarks] = useState(
//     initialFavoriteBookmarks
//   );

//   // bookmarks prop이 변경되면 로컬 상태 업데이트
//   useEffect(() => {
//     const newFavoriteBookmarks = bookmarks
//       .filter((b) => b.isFavorite)
//       .slice(0, 8);
//     setFavoriteBookmarks(newFavoriteBookmarks);
//   }, [bookmarks]);

//   // 드래그 앤 드롭 센서 설정
//   const sensors = useSensors(
//     useSensor(PointerSensor, {
//       activationConstraint: {
//         distance: 1, // 바로 드래그 시작
//       },
//     }),
//     useSensor(KeyboardSensor, {
//       coordinateGetter: sortableKeyboardCoordinates,
//     })
//   );

//   // 드래그 종료 핸들러
//   const handleDragEnd = (event: DragEndEvent) => {
//     console.log("Dashboard drag end event:", event); // 디버깅 로그
//     const { active, over } = event;

//     if (!over) {
//       console.log("No drop target found"); // 드롭 타겟이 없는 경우
//       return;
//     }

//     if (active.id !== over.id) {
//       const oldIndex = favoriteBookmarks.findIndex(
//         (item) => item.id === active.id
//       );
//       const newIndex = favoriteBookmarks.findIndex(
//         (item) => item.id === over.id
//       );

//       console.log("Moving from index", oldIndex, "to", newIndex); // 디버깅 로그
//       console.log("Active bookmark:", favoriteBookmarks[oldIndex]?.title); // 이동하는 북마크
//       console.log("Over bookmark:", favoriteBookmarks[newIndex]?.title); // 대상 북마크

//       const newBookmarks = arrayMove(favoriteBookmarks, oldIndex, newIndex);
//       console.log("New bookmarks array length:", newBookmarks.length); // 새로운 배열 길이
//       console.log(
//         "New bookmarks order:",
//         newBookmarks.map((b) => ({ id: b.id, title: b.title }))
//       ); // 새로운 순서

//       // 로컬 상태 즉시 업데이트
//       setFavoriteBookmarks(newBookmarks);

//       // 부모 컴포넌트에 알림
//       if (onReorder) {
//         console.log("Calling onReorder with new bookmarks"); // 디버깅 로그
//         onReorder(newBookmarks);
//       } else {
//         console.log("onReorder is not provided"); // 디버깅 로그
//       }
//     } else {
//       console.log("Same position, no reorder needed"); // 같은 위치인 경우
//     }
//   };

//   return (
//     <div className="card-glass p-6">
//       <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
//         <Heart className="w-5 h-5 text-red-500 mr-3" />
//         즐겨찾기 북마크
//       </h3>
//       <DndContext
//         sensors={sensors}
//         collisionDetection={closestCenter}
//         onDragEnd={handleDragEnd}
//       >
//         <SortableContext
//           items={favoriteBookmarks.map((bookmark) => bookmark.id)}
//           strategy={rectSortingStrategy}
//         >
//           <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
//             {favoriteBookmarks.length > 0 ? (
//               favoriteBookmarks.map((bookmark) => (
//                 <SortableFavoriteBookmark
//                   key={bookmark.id}
//                   bookmark={bookmark}
//                   onEdit={onEdit}
//                   onDelete={onDelete}
//                   onToggleFavorite={onToggleFavorite}
//                 />
//               ))
//             ) : (
//               <div className="col-span-full text-center py-8">
//                 <Heart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
//                 <p className="text-gray-500 dark:text-gray-400 text-sm">
//                   즐겨찾기한 북마크가 없습니다
//                 </p>
//               </div>
//             )}
//           </div>
//         </SortableContext>
//       </DndContext>
//     </div>
//   );
// };

// CollectionDistribution 컴포넌트 제거 (더 이상 사용하지 않음)

const QuickActions: React.FC<QuickActionsProps> = ({
  onAddBookmark,
  onAddCollection,
}) => {
  return (
    <div className="card-glass p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        빠른 작업
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={onAddBookmark}
          className="flex items-center space-x-4 p-4 rounded-2xl border border-white/30 dark:border-gray-600/30 hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-300 hover:scale-105 backdrop-blur-sm"
        >
          <div className="w-12 h-12 bg-gradient-to-r from-brand-500 to-brand-600 rounded-xl flex items-center justify-center shadow-soft">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900 dark:text-white">
              북마크 추가
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              새 북마크를 추가하세요
            </p>
          </div>
        </button>
        <button
          onClick={onAddCollection}
          className="flex items-center space-x-4 p-4 rounded-2xl border border-white/30 dark:border-gray-600/30 hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-300 hover:scale-105 backdrop-blur-sm"
        >
          <div className="w-12 h-12 bg-gradient-to-r from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-soft">
            <FolderPlus className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900 dark:text-white">
              컬렉션 추가
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              새 컬렉션을 생성하세요
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};

// 즐겨찾기 북마크 위젯 (기존)
const FavoriteBookmarks: React.FC<FavoriteBookmarksProps> = ({
  bookmarks,
  onEdit,
  onDelete,
  onToggleFavorite,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onReorder,
}) => {
  const favoriteBookmarks = bookmarks.filter((b) => b.isFavorite).slice(0, 6);

  const getCollectionName = (collectionId: string | null) => {
    if (!collectionId) return "미분류";
    // collections는 props로 전달되지 않으므로 임시로 "미분류" 반환
    return "미분류";
  };

  return (
    <div className="card-glass p-6 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
        <Sparkles className="w-5 h-5 text-yellow-500 mr-3" />
        즐겨찾기 북마크
      </h3>
      <div className="space-y-3 flex-1 flex flex-col">
        {favoriteBookmarks.length > 0 ? (
          <div className="space-y-3 flex-1">
            {favoriteBookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="group flex items-center justify-between p-3 rounded-xl border border-white/30 dark:border-gray-600/30 hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-300"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                      {bookmark.title}
                    </h4>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{getCollectionName(bookmark.collection)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onToggleFavorite(bookmark.id, false)}
                    className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-colors"
                    title="즐겨찾기 해제"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onEdit(bookmark)}
                    className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 transition-colors"
                    title="편집"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(bookmark.id)}
                    className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 flex-1 flex flex-col items-center justify-center">
            <Sparkles className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              즐겨찾기한 북마크가 없습니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// 즐겨찾기 북마크 아이콘 그리드 위젯 (새로운)
const FavoriteBookmarksIconGrid: React.FC<FavoriteBookmarksProps> = ({
  bookmarks,
  onEdit,
  onDelete,
  onToggleFavorite,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onReorder,
}) => {
  const favoriteBookmarks = bookmarks.filter((b) => b.isFavorite).slice(0, 12);

  const handleFaviconClick = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <div className="card-glass p-6 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
        <Sparkles className="w-5 h-5 text-yellow-500 mr-3" />
        즐겨찾기 북마크
      </h3>
      <div className="flex-1">
        {favoriteBookmarks.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {favoriteBookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="group relative flex flex-col items-center p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-300"
              >
                {/* 파비콘 */}
                <div
                  className="w-12 h-12 rounded-xl shadow-sm hover:scale-110 transition-transform cursor-pointer mb-2 relative overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600"
                  onClick={() => handleFaviconClick(bookmark.url)}
                >
                  {bookmark.favicon ? (
                    <img
                      src={bookmark.favicon}
                      alt={bookmark.title}
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextElementSibling?.classList.remove(
                          "hidden"
                        );
                      }}
                    />
                  ) : null}
                  <div
                    className={`${
                      bookmark.favicon ? "hidden" : ""
                    } w-full h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-xl flex items-center justify-center`}
                  >
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* 제목 */}
                <p
                  className="text-xs font-medium text-gray-900 dark:text-white text-center truncate w-full max-w-[60px]"
                  title={bookmark.title}
                >
                  {bookmark.title}
                </p>

                {/* 호버 시 액션 버튼들 */}
                <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(bookmark.id, false);
                    }}
                    className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-md text-xs"
                    title="즐겨찾기 해제"
                  >
                    <Sparkles className="w-3 h-3" />
                  </button>
                </div>

                {/* 하단 액션 버튼들 */}
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(bookmark);
                    }}
                    className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 shadow-md"
                    title="편집"
                  >
                    <Edit className="w-2.5 h-2.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(bookmark.id);
                    }}
                    className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-md"
                    title="삭제"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 flex-1 flex flex-col items-center justify-center">
            <Sparkles className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              즐겨찾기한 북마크가 없습니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// 최근 추가 북마크 위젯 (기존)
const RecentBookmarks: React.FC<{
  bookmarks: Bookmark[];
  collections: Collection[];
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
}> = ({ bookmarks, collections, onEdit, onDelete }) => {
  const recentBookmarks = bookmarks
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  const getCollectionName = (collectionId: string | null) => {
    if (!collectionId) return "미분류";
    const collection = collections.find((c) => c.id === collectionId);
    return collection?.name || "미분류";
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "오늘";
    } else if (diffDays === 1) {
      return "어제";
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString("ko-KR", {
        month: "short",
        day: "numeric",
      });
    }
  };

  return (
    <div className="card-glass p-6 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
        <Sparkles className="w-5 h-5 text-blue-500 mr-3" />
        최근 추가 북마크
      </h3>
      <div className="space-y-3 flex-1 flex flex-col">
        {recentBookmarks.length > 0 ? (
          <div className="space-y-3 flex-1">
            {recentBookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="group flex items-center justify-between p-3 rounded-xl border border-white/30 dark:border-gray-600/30 hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-300"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                      {bookmark.title}
                    </h4>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{getCollectionName(bookmark.collection)}</span>
                      <span>•</span>
                      <span>{formatDate(bookmark.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(bookmark)}
                    className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 transition-colors"
                    title="편집"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(bookmark.id)}
                    className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 flex-1 flex flex-col items-center justify-center">
            <Sparkles className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              최근 추가된 북마크가 없습니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// 최근 추가 북마크 아이콘 그리드 위젯 (새로운)
const RecentBookmarksIconGrid: React.FC<{
  bookmarks: Bookmark[];
  collections: Collection[];
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
}> = ({ bookmarks, collections, onEdit, onDelete }) => {
  const recentBookmarks = bookmarks
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  const handleFaviconClick = (url: string) => {
    window.open(url, "_blank");
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "오늘";
    } else if (diffDays === 1) {
      return "어제";
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString("ko-KR", {
        month: "short",
        day: "numeric",
      });
    }
  };

  return (
    <div className="card-glass p-6 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
        <Globe className="w-5 h-5 text-blue-500 mr-3" />
        최근 추가 북마크
      </h3>
      <div className="flex-1">
        {recentBookmarks.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
            {recentBookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="group relative flex flex-col items-center p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-300"
              >
                {/* 파비콘 */}
                <div
                  className="w-12 h-12 rounded-xl shadow-sm hover:scale-110 transition-transform cursor-pointer mb-2 relative overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600"
                  onClick={() => handleFaviconClick(bookmark.url)}
                >
                  {bookmark.favicon ? (
                    <img
                      src={bookmark.favicon}
                      alt={bookmark.title}
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextElementSibling?.classList.remove(
                          "hidden"
                        );
                      }}
                    />
                  ) : null}
                  <div
                    className={`${
                      bookmark.favicon ? "hidden" : ""
                    } w-full h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center`}
                  >
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* 제목 */}
                <p
                  className="text-xs font-medium text-gray-900 dark:text-white text-center truncate w-full max-w-[60px]"
                  title={bookmark.title}
                >
                  {bookmark.title}
                </p>

                {/* 날짜 */}
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                  {formatDate(bookmark.createdAt)}
                </p>

                {/* 호버 시 액션 버튼들 */}
                <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(bookmark);
                      }}
                      className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 shadow-md"
                      title="편집"
                    >
                      <Edit className="w-2.5 h-2.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(bookmark.id);
                      }}
                      className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-md"
                      title="삭제"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 flex-1 flex flex-col items-center justify-center">
            <Globe className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              최근 추가된 북마크가 없습니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// 통계 위젯 컴포넌트
const StatsWidget: React.FC<{
  bookmarks: Bookmark[];
  collections: Collection[];
}> = ({ bookmarks, collections }) => {
  const totalBookmarks = bookmarks.length;
  const totalCollections = collections.length;
  const unassignedBookmarks = bookmarks.filter((b) => !b.collection).length;
  const favoriteBookmarks = bookmarks.filter((b) => b.isFavorite).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      <StatsCard
        title="전체 북마크"
        value={totalBookmarks}
        icon={<BookOpen className="w-6 h-6" />}
        color="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
        description="총 북마크 수"
      />
      <StatsCard
        title="컬렉션"
        value={totalCollections}
        icon={<Folder className="w-6 h-6" />}
        color="bg-gradient-to-r from-purple-500 to-purple-600 text-white"
        description="총 컬렉션 수"
      />
      <StatsCard
        title="즐겨찾기"
        value={favoriteBookmarks}
        icon={<Sparkles className="w-6 h-6" />}
        color="bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
        description="즐겨찾기 북마크"
      />
      <StatsCard
        title="미분류"
        value={unassignedBookmarks}
        icon={<FileText className="w-6 h-6" />}
        color="bg-gradient-to-r from-gray-500 to-gray-600 text-white"
        description="컬렉션 없는 북마크"
      />
    </div>
  );
};

// 시계 위젯 (시계와 날씨만 포함)
export const ClockWidget: React.FC = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const dateStr = now.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
      {/* 시계 */}
      <div className="sm:col-span-2 card-glass p-4 flex flex-col items-center justify-center text-center">
        <div className="text-2xl sm:text-3xl font-bold gradient-text tracking-wider mb-1">
          {timeStr}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {dateStr}
        </div>
      </div>

      {/* 날씨 */}
      <div className="sm:col-span-3">
        <WeatherWidget />
      </div>
    </div>
  );
};

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  bookmarks,
  collections,
  onEdit,
  onDelete,
  onToggleFavorite,
  onAddBookmark,
  onAddCollection,
  onReorder,
  userId,
}) => {
  const {
    widgets,
    isEditMode,
    setIsEditMode,
    reorderWidgets,
    toggleWidget,
    resetWidgetOrder,
  } = useWidgetOrder(userId);

  // 그룹 순서 관련 코드 제거 (더 이상 사용하지 않음)

  // 드래그 앤 드롭 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 위젯 드래그 종료 핸들러
  const handleWidgetDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    if (active.id !== over.id) {
      const oldIndex = widgets.findIndex((item) => item.id === active.id);
      const newIndex = widgets.findIndex((item) => item.id === over.id);
      const newWidgets = arrayMove(widgets, oldIndex, newIndex);
      reorderWidgets(newWidgets);
    }
  };

  // 위젯 렌더링 함수
  const renderWidget = (widget: WidgetConfig) => {
    const { id } = widget;

    switch (id) {
      case "clock":
        return <ClockWidget />;
      case "stats":
        return <StatsWidget bookmarks={bookmarks} collections={collections} />;
      case "favorite-bookmarks":
        return (
          <FavoriteBookmarks
            bookmarks={bookmarks}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleFavorite={onToggleFavorite}
            onReorder={onReorder}
          />
        );
      case "collection-distribution":
        // 컬렉션별 분포 위젯 제거
        return null;
      case "recent-bookmarks":
        return (
          <RecentBookmarks
            bookmarks={bookmarks}
            collections={collections}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        );
      case "quick-actions":
        return (
          <QuickActions
            onAddBookmark={onAddBookmark}
            onAddCollection={onAddCollection}
          />
        );
      case "bible-verse":
        // 사이드바에서는 성경 말씀 위젯을 표시하지 않음 (메인 영역에서만 표시)
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* 위젯 편집 컨트롤 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          대시보드
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
              isEditMode
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>{isEditMode ? "편집 완료" : "위젯 편집"}</span>
          </button>
          {isEditMode && (
            <button
              onClick={resetWidgetOrder}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center space-x-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>초기화</span>
            </button>
          )}
        </div>
      </div>

      {/* 메인 레이아웃 - 한 줄 표시 */}
      <div className="space-y-6 lg:space-y-8">
        {/* 시계/날씨 위젯 */}
        {widgets.find((w) => w.id === "clock")?.enabled && (
          <div className="relative">
            {isEditMode && (
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => toggleWidget("clock")}
                  className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  title="시계 숨기기"
                >
                  <EyeOff className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            )}
            <ClockWidget />
          </div>
        )}

        {/* 성경 말씀 위젯 */}
        {widgets.find((w) => w.id === "bible-verse")?.enabled && (
          <div className="relative">
            {isEditMode && (
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => toggleWidget("bible-verse")}
                  className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  title="성경말씀 숨기기"
                >
                  <EyeOff className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            )}
            <BibleVerseWidget />
          </div>
        )}

        {/* 즐겨찾기 & 최근 북마크 위젯 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* 즐겨찾기 북마크 위젯 */}
          {widgets.find((w) => w.id === "favorite-bookmarks")?.enabled && (
            <div className="relative">
              {isEditMode && (
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={() => toggleWidget("favorite-bookmarks")}
                    className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    title="즐겨찾기 북마크 숨기기"
                  >
                    <EyeOff className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              )}
              <FavoriteBookmarksIconGrid
                bookmarks={bookmarks}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleFavorite={onToggleFavorite}
                onReorder={onReorder}
              />
            </div>
          )}

          {/* 최근 북마크 위젯 */}
          {widgets.find((w) => w.id === "recent-bookmarks")?.enabled && (
            <div className="relative">
              {isEditMode && (
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={() => toggleWidget("recent-bookmarks")}
                    className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    title="최근 북마크 숨기기"
                  >
                    <EyeOff className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              )}
              <RecentBookmarksIconGrid
                bookmarks={bookmarks}
                collections={collections}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          )}
        </div>

        {/* 기타 위젯들 */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleWidgetDragEnd}
        >
          <SortableContext
            items={widgets
              .filter(
                (widget) =>
                  widget.id !== "bible-verse" &&
                  widget.id !== "clock" &&
                  widget.id !== "stats" &&
                  widget.id !== "favorite-bookmarks" &&
                  widget.id !== "recent-bookmarks" &&
                  widget.enabled
              )
              .map((widget) => widget.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-6 lg:space-y-8">
              {widgets
                .filter(
                  (widget) =>
                    widget.id !== "bible-verse" &&
                    widget.id !== "clock" &&
                    widget.id !== "stats" &&
                    widget.id !== "favorite-bookmarks" &&
                    widget.id !== "recent-bookmarks" &&
                    widget.enabled
                )
                .map((widget) => (
                  <SortableWidget
                    key={widget.id}
                    id={widget.id}
                    enabled={widget.enabled}
                    isEditMode={isEditMode}
                    onToggle={() => toggleWidget(widget.id)}
                  >
                    {renderWidget(widget)}
                  </SortableWidget>
                ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* 편집 모드 도움말 */}
      {isEditMode && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
            <Settings className="w-5 h-5" />
            <h3 className="font-medium">위젯 편집 모드</h3>
          </div>
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
            위젯을 드래그하여 순서를 변경하고, 눈 모양 아이콘을 클릭하여 위젯을
            숨기거나 표시할 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
};

// 성경 구절 위젯 컴포넌트
const BibleVerseWidget: React.FC = () => {
  const [currentVerse, setCurrentVerse] = useState(() => {
    const randomIndex = Math.floor(Math.random() * bibleVerses.length);
    return bibleVerses[randomIndex];
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * bibleVerses.length);
      setCurrentVerse(bibleVerses[randomIndex]);
    }, 30000); // 30초마다 변경

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900/90 via-purple-900/90 to-indigo-900/90 backdrop-blur-xl border border-white/20 shadow-2xl min-h-[400px] flex items-center">
      {/* 배경 패턴 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.05)_0%,transparent_50%)]"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[radial-gradient(circle,rgba(255,255,255,0.03)_0%,transparent_70%)]"></div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="relative p-8 md:p-12 text-center w-full">
        <div className="mb-8">
          <div className="inline-flex items-center space-x-2 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 shadow-lg">
            <BookOpen className="w-5 h-5 text-white/80" />
            <span className="text-white/80 text-sm font-medium">
              오늘의 성경말씀
            </span>
          </div>
        </div>

        <div className="space-y-8">
          <div className="relative">
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
            <p className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-light text-white leading-relaxed tracking-wide px-4">
              "{currentVerse.verse}"
            </p>
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
          </div>

          <div className="pt-6">
            <p className="text-base md:text-lg text-white/70 font-medium tracking-wide">
              {currentVerse.reference}
            </p>
          </div>
        </div>

        {/* 장식 요소 */}
        <div className="absolute top-8 right-8 w-24 h-24 bg-white/5 rounded-full backdrop-blur-sm border border-white/10"></div>
        <div className="absolute bottom-8 left-8 w-20 h-20 bg-white/5 rounded-full backdrop-blur-sm border border-white/10"></div>
        <div className="absolute top-1/4 left-8 w-12 h-12 bg-white/3 rounded-full backdrop-blur-sm"></div>
        <div className="absolute bottom-1/4 right-12 w-16 h-16 bg-white/3 rounded-full backdrop-blur-sm"></div>
      </div>
    </div>
  );
};
