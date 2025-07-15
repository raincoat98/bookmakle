import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Folder,
  FileText,
  Sparkles,
  Heart,
  Globe,
  Plus,
  FolderPlus,
  Edit,
  Trash2,
} from "lucide-react";
import type { Bookmark, Collection } from "../types";
import bibleVerses from "../data/bibleVerses.json";
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
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

interface CollectionDistributionProps {
  bookmarks: Bookmark[];
  collections: Collection[];
}

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
}

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
const SortableFavoriteBookmark: React.FC<{
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
}> = ({ bookmark, onEdit, onDelete, onToggleFavorite }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: bookmark.id,
    transition: {
      duration: 150,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleFaviconClick = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group cursor-move animate-slide-up select-none ${
        isDragging ? "opacity-50 z-50" : ""
      }`}
      title={`${bookmark.title} - 드래그하여 순서 변경`}
    >
      <div className="relative bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm rounded-2xl shadow-soft border border-white/30 dark:border-gray-600/30 p-4 hover:shadow-soft-lg transition-all duration-300 hover:scale-105">
        <div className="flex flex-col items-center space-y-3">
          <div className="relative">
            {bookmark.favicon ? (
              <img
                src={bookmark.favicon}
                alt={bookmark.title}
                className="w-8 h-8 rounded-lg shadow-sm hover:scale-110 transition-transform cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFaviconClick(bookmark.url);
                }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div
                className="w-8 h-8 bg-gradient-to-r from-brand-500 to-accent-500 rounded-lg shadow-sm flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFaviconClick(bookmark.url);
                }}
              >
                <Globe className="w-4 h-4 text-white" />
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(bookmark.id, false);
              }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-soft"
              title="즐겨찾기 해제"
            >
              <Heart className="w-3 h-3 fill-current" />
            </button>
          </div>

          <div className="text-center space-y-1">
            <p className="text-xs font-medium text-gray-900 dark:text-white truncate w-full">
              {bookmark.title}
            </p>
            <div className="flex space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(bookmark);
                }}
                className="p-1 text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 rounded-lg transition-colors duration-200 hover:bg-white/50 dark:hover:bg-gray-600/50"
                title="편집"
              >
                <Edit className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(bookmark.id);
                }}
                className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors duration-200 hover:bg-white/50 dark:hover:bg-gray-600/50"
                title="삭제"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FavoriteBookmarks: React.FC<FavoriteBookmarksProps> = ({
  bookmarks,
  onEdit,
  onDelete,
  onToggleFavorite,
  onReorder,
}) => {
  const initialFavoriteBookmarks = bookmarks
    .filter((b) => b.isFavorite)
    .slice(0, 8);
  const [favoriteBookmarks, setFavoriteBookmarks] = useState(
    initialFavoriteBookmarks
  );

  // bookmarks prop이 변경되면 로컬 상태 업데이트
  useEffect(() => {
    const newFavoriteBookmarks = bookmarks
      .filter((b) => b.isFavorite)
      .slice(0, 8);
    setFavoriteBookmarks(newFavoriteBookmarks);
  }, [bookmarks]);

  // 드래그 앤 드롭 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1, // 바로 드래그 시작
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 드래그 종료 핸들러
  const handleDragEnd = (event: DragEndEvent) => {
    console.log("Dashboard drag end event:", event); // 디버깅 로그
    const { active, over } = event;

    if (!over) {
      console.log("No drop target found"); // 드롭 타겟이 없는 경우
      return;
    }

    if (active.id !== over.id) {
      const oldIndex = favoriteBookmarks.findIndex(
        (item) => item.id === active.id
      );
      const newIndex = favoriteBookmarks.findIndex(
        (item) => item.id === over.id
      );

      console.log("Moving from index", oldIndex, "to", newIndex); // 디버깅 로그
      console.log("Active bookmark:", favoriteBookmarks[oldIndex]?.title); // 이동하는 북마크
      console.log("Over bookmark:", favoriteBookmarks[newIndex]?.title); // 대상 북마크

      const newBookmarks = arrayMove(favoriteBookmarks, oldIndex, newIndex);
      console.log("New bookmarks array length:", newBookmarks.length); // 새로운 배열 길이
      console.log(
        "New bookmarks order:",
        newBookmarks.map((b) => ({ id: b.id, title: b.title }))
      ); // 새로운 순서

      // 로컬 상태 즉시 업데이트
      setFavoriteBookmarks(newBookmarks);

      // 부모 컴포넌트에 알림
      if (onReorder) {
        console.log("Calling onReorder with new bookmarks"); // 디버깅 로그
        onReorder(newBookmarks);
      } else {
        console.log("onReorder is not provided"); // 디버깅 로그
      }
    } else {
      console.log("Same position, no reorder needed"); // 같은 위치인 경우
    }
  };

  return (
    <div className="card-glass p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
        <Heart className="w-5 h-5 text-red-500 mr-3" />
        즐겨찾기 북마크
      </h3>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={favoriteBookmarks.map((bookmark) => bookmark.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {favoriteBookmarks.length > 0 ? (
              favoriteBookmarks.map((bookmark) => (
                <SortableFavoriteBookmark
                  key={bookmark.id}
                  bookmark={bookmark}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleFavorite={onToggleFavorite}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <Heart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  즐겨찾기한 북마크가 없습니다
                </p>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

const CollectionDistribution: React.FC<CollectionDistributionProps> = ({
  bookmarks,
  collections,
}) => {
  const collectionStats = collections.map((collection) => {
    const count = bookmarks.filter(
      (b) => b.collection === collection.id
    ).length;
    return { ...collection, count };
  });

  const totalBookmarks = bookmarks.length;
  const unassignedCount = bookmarks.filter((b) => !b.collection).length;

  return (
    <div className="card-glass p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        컬렉션별 분포
      </h3>
      <div className="space-y-4">
        {collectionStats.map((collection) => {
          const percentage =
            totalBookmarks > 0 ? (collection.count / totalBookmarks) * 100 : 0;
          return (
            <div key={collection.id} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-900 dark:text-white">
                  {collection.name}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {collection.count}개 ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
        {unassignedCount > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-900 dark:text-white">
                미분류
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                {unassignedCount}개 (
                {((unassignedCount / totalBookmarks) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gray-400 to-gray-500 rounded-full transition-all duration-500"
                style={{
                  width: `${(unassignedCount / totalBookmarks) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

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

// 통합 시계 위젯 (시계, 명언, 날씨 포함)
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
    <div className="space-y-4 mb-6">
      {/* 첫 번째 행: 시계와 날씨 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* 시계 */}
        <div className="lg:col-span-2 card-glass p-4 flex flex-col items-center justify-center text-center">
          <div className="text-3xl font-bold gradient-text tracking-wider mb-1">
            {timeStr}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {dateStr}
          </div>
        </div>

        {/* 날씨 */}
        <div className="lg:col-span-3">
          <WeatherWidget />
        </div>
      </div>

      {/* 두 번째 행: 오늘의 성경말씀 */}
      <div>
        <BibleVerseWidget />
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
}) => {
  const totalBookmarks = bookmarks.length;
  const totalCollections = collections.length;
  const unassignedBookmarks = bookmarks.filter((b) => !b.collection).length;
  const recentBookmarks = bookmarks
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* 시계 위젯 */}
      <ClockWidget />

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6">
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
          title="미분류 북마크"
          value={unassignedBookmarks}
          icon={<FileText className="w-6 h-6" />}
          color="bg-gradient-to-r from-gray-500 to-gray-600 text-white"
          description="컬렉션 없는 북마크"
        />
        <StatsCard
          title="최근 추가"
          value={recentBookmarks.length}
          icon={<Sparkles className="w-6 h-6" />}
          color="bg-gradient-to-r from-green-500 to-green-600 text-white"
          description="최근 5개 북마크"
        />
      </div>

      {/* 위젯 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FavoriteBookmarks
          bookmarks={bookmarks}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
          onReorder={onReorder}
        />
        <CollectionDistribution
          bookmarks={bookmarks}
          collections={collections}
        />
      </div>

      {/* 빠른 작업 */}
      <QuickActions
        onAddBookmark={onAddBookmark}
        onAddCollection={onAddCollection}
      />
    </div>
  );
};

// 날씨 데이터 타입 정의
interface WeatherData {
  city: string;
  temperature: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
}

// 날씨 위젯 컴포넌트
const WeatherWidget: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // OpenWeather API 키 (환경변수에서 가져옴)
  const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
  const DEFAULT_CITY = "Seoul"; // 기본 도시

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);

        // API 키가 설정되지 않은 경우
        if (!API_KEY) {
          setError("API 키가 설정되지 않았습니다");
          return;
        }

        // 사용자 위치 가져오기 시도
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              enableHighAccuracy: true,
            });
          }
        ).catch(() => null);

        let url: string;
        if (position) {
          // 위치 기반 날씨 조회
          const { latitude, longitude } = position.coords;
          url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric&lang=kr`;
        } else {
          // 기본 도시로 날씨 조회
          url = `https://api.openweathermap.org/data/2.5/weather?q=${DEFAULT_CITY}&appid=${API_KEY}&units=metric&lang=kr`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`날씨 API 오류: ${response.status}`);
        }

        const data = await response.json();

        setWeather({
          city: data.name,
          temperature: Math.round(data.main.temp),
          description: data.weather[0].description,
          icon: data.weather[0].icon,
          humidity: data.main.humidity,
          windSpeed: Math.round(data.wind.speed * 3.6), // m/s를 km/h로 변환
          feelsLike: Math.round(data.main.feels_like),
        });
      } catch (err) {
        console.error("날씨 데이터 가져오기 실패:", err);
        setError(
          err instanceof Error ? err.message : "날씨 정보를 가져올 수 없습니다"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  const getWeatherIconUrl = (iconCode: string) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };

  // 날씨 상태에 따른 배경 스타일
  const getWeatherBackground = (iconCode: string) => {
    const weatherType = iconCode.substring(0, 2);
    const isDay = iconCode.endsWith("d");

    switch (weatherType) {
      case "01": // 맑음
        return isDay
          ? "bg-gradient-to-br from-blue-400 via-blue-500 to-yellow-400"
          : "bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900";
      case "02": // 약간 구름
      case "03": // 구름 많음
        return isDay
          ? "bg-gradient-to-br from-blue-300 via-gray-400 to-blue-400"
          : "bg-gradient-to-br from-gray-800 via-blue-900 to-gray-900";
      case "04": // 구름 많음
        return "bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600";
      case "09": // 소나기
      case "10": // 비
        return "bg-gradient-to-br from-gray-600 via-blue-800 to-gray-900";
      case "11": // 번개
        return "bg-gradient-to-br from-gray-900 via-purple-900 to-gray-800";
      case "13": // 눈
        return "bg-gradient-to-br from-blue-100 via-white to-blue-200";
      case "50": // 안개
        return "bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500";
      default:
        return "bg-gradient-to-br from-blue-400 to-blue-600";
    }
  };

  // 날씨 상태에 따른 애니메이션 클래스
  const getWeatherAnimation = (iconCode: string) => {
    const weatherType = iconCode.substring(0, 2);

    switch (weatherType) {
      case "01": // 맑음
        return "animate-pulse";
      case "09": // 소나기
      case "10": // 비
        return "animate-bounce";
      case "11": // 번개
        return "animate-pulse";
      case "13": // 눈
        return "animate-pulse";
      default:
        return "";
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-soft">
      {/* 동적 배경 */}
      {weather && (
        <div
          className={`absolute inset-0 ${getWeatherBackground(
            weather.icon
          )} opacity-90`}
        />
      )}

      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-sm" />

      {/* 컨텐츠 */}
      <div className="relative z-10 p-4">
        <h3 className="text-md font-semibold text-white mb-3 drop-shadow-lg">
          날씨
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-200 text-sm mb-2 drop-shadow">{error}</p>
            <p className="text-xs text-white/80 drop-shadow">
              OpenWeather API 키를 설정해주세요
            </p>
          </div>
        ) : weather ? (
          <div className="space-y-3">
            {/* 메인 날씨 정보 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`${getWeatherAnimation(weather.icon)}`}>
                  <img
                    src={getWeatherIconUrl(weather.icon)}
                    alt={weather.description}
                    className="w-12 h-12 drop-shadow-lg"
                  />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white drop-shadow-lg">
                    {weather.temperature}°C
                  </p>
                  <p className="text-xs text-white/90 capitalize drop-shadow">
                    {weather.description}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white drop-shadow-lg">
                  {weather.city}
                </p>
                <p className="text-xs text-white/80 drop-shadow">
                  체감 {weather.feelsLike}°C
                </p>
              </div>
            </div>

            {/* 상세 정보 */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/30">
              <div className="text-center">
                <p className="text-xs text-white/80 mb-1 drop-shadow">습도</p>
                <p className="text-sm font-semibold text-white drop-shadow">
                  {weather.humidity}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-white/80 mb-1 drop-shadow">풍속</p>
                <p className="text-sm font-semibold text-white drop-shadow">
                  {weather.windSpeed} km/h
                </p>
              </div>
            </div>

            {/* 장식적 요소들 */}
            <div className="absolute top-3 right-3 opacity-20">
              {weather.icon.includes("01") && (
                <div className="w-12 h-12 bg-yellow-300 rounded-full animate-pulse" />
              )}
              {weather.icon.includes("09") ||
                (weather.icon.includes("10") && (
                  <div className="flex space-x-1">
                    <div
                      className="w-0.5 h-4 bg-blue-300 rounded-full animate-bounce"
                      style={{ animationDelay: "0s" }}
                    />
                    <div
                      className="w-0.5 h-3 bg-blue-300 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="w-0.5 h-5 bg-blue-300 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                ))}
              {weather.icon.includes("13") && (
                <div className="grid grid-cols-3 gap-0.5">
                  {[...Array(9)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 h-1 bg-white rounded-full animate-pulse"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-white/80 drop-shadow">
              날씨 정보를 불러올 수 없습니다
            </p>
          </div>
        )}
      </div>
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
    <div className="card-glass p-4">
      <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3 text-center">
        오늘의 성경말씀
      </h3>
      <div className="text-center space-y-2">
        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
          "{currentVerse.verse}"
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          {currentVerse.reference}
        </p>
      </div>
    </div>
  );
};
