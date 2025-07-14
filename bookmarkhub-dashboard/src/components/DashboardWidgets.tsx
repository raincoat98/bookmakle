import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Bookmark, Collection } from "../types";
import {
  Heart,
  Edit,
  Trash2,
  Plus,
  FolderPlus,
  BookOpen,
  Folder,
  FileText,
  Sparkles,
  Globe,
  Settings,
} from "lucide-react";
import { BibleVerseWidget } from "./QuoteWidget";
import { WeatherWidget } from "./WeatherWidget";

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  description?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  color,
  description,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value.toLocaleString()}
          </p>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${color}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

// 즐겨찾기 북마크 위젯 컴포넌트
interface FavoriteBookmarksProps {
  bookmarks: Bookmark[];
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onReorder: (newBookmarks: Bookmark[]) => void;
}

const FavoriteBookmarks: React.FC<FavoriteBookmarksProps> = ({
  bookmarks,
  onToggleFavorite,
  onReorder,
}) => {
  const [favoriteBookmarks, setFavoriteBookmarks] = useState<Bookmark[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // 즐겨찾기된 북마크만 필터링
  useEffect(() => {
    const favorites = bookmarks
      .filter((bookmark) => bookmark.isFavorite)
      .sort((a, b) => a.order - b.order);
    setFavoriteBookmarks(favorites);
  }, [bookmarks]);

  // 드래그 시작
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  // 드래그 오버
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  // 드롭
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newBookmarks = [...favoriteBookmarks];
    const draggedBookmark = newBookmarks[draggedIndex];
    newBookmarks.splice(draggedIndex, 1);
    newBookmarks.splice(dropIndex, 0, draggedBookmark);

    // order 값 업데이트
    const updatedBookmarks = newBookmarks.map((bookmark, index) => ({
      ...bookmark,
      order: index,
    }));

    setFavoriteBookmarks(updatedBookmarks);
    onReorder(updatedBookmarks);
    setDraggedIndex(null);
  };

  // 파비콘 클릭 시 사이트로 이동
  const handleFaviconClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <Heart className="w-5 h-5 text-red-500 mr-2" />
        즐겨찾기 북마크
      </h3>
      <div className="flex flex-wrap gap-3">
        {favoriteBookmarks.length > 0 ? (
          favoriteBookmarks.map((bookmark, index) => (
            <div
              key={bookmark.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className={`group cursor-move ${
                draggedIndex === index ? "opacity-50" : ""
              }`}
              title={bookmark.title}
            >
              {/* 파비콘 카드 */}
              <div className="relative bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-3 hover:shadow-md transition-all duration-200 hover:scale-105">
                <div className="flex flex-col items-center space-y-2">
                  {/* 파비콘 - 클릭 시 사이트로 이동 */}
                  <div className="relative">
                    {bookmark.favicon ? (
                      <img
                        src={bookmark.favicon}
                        alt={bookmark.title}
                        className="w-6 h-6 rounded shadow-sm hover:scale-100 transition-transform cursor-pointer"
                        onClick={() => handleFaviconClick(bookmark.url)}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div
                        className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded shadow-sm flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                        onClick={() => handleFaviconClick(bookmark.url)}
                      >
                        <Globe className="w-6 h-6 text-gray-400" />
                      </div>
                    )}

                    {/* 즐겨찾기 해제 버튼 - 호버 시에만 표시 */}
                    <button
                      onClick={() => onToggleFavorite(bookmark.id, false)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm"
                      title="즐겨찾기 해제"
                    >
                      <Heart className="w-3 h-3 fill-current" />
                    </button>
                  </div>

                  {/* 제목 (짧게 표시) */}
                  <div className="text-center max-w-20">
                    <p className="text-xs text-gray-700 dark:text-gray-300 truncate font-medium">
                      {bookmark.title}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4 w-full">
            즐겨찾기된 북마크가 없습니다.
          </p>
        )}
      </div>
    </div>
  );
};

interface RecentBookmarksProps {
  bookmarks: Bookmark[];
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
}

const RecentBookmarks: React.FC<RecentBookmarksProps> = ({
  bookmarks,
  onEdit,
  onDelete,
  onToggleFavorite,
}) => {
  const navigate = useNavigate();
  const recentBookmarks = bookmarks
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        최근 추가된 북마크
      </h3>
      <div className="space-y-3">
        {recentBookmarks.length > 0 ? (
          recentBookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex-shrink-0">
                {bookmark.favicon ? (
                  <img
                    src={bookmark.favicon}
                    alt="파비콘"
                    className="w-6 h-6 rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                    <Globe className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 truncate block"
                  title={bookmark.title}
                >
                  {bookmark.title}
                </a>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {new Date(bookmark.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() =>
                    onToggleFavorite(bookmark.id, !bookmark.isFavorite)
                  }
                  className={`p-1 rounded transition-colors ${
                    bookmark.isFavorite
                      ? "text-red-500 hover:text-red-600"
                      : "text-gray-400 hover:text-red-500"
                  }`}
                  title={
                    bookmark.isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"
                  }
                >
                  <Heart
                    className={`w-4 h-4 ${
                      bookmark.isFavorite ? "fill-current" : ""
                    }`}
                  />
                </button>
                <button
                  onClick={() => onEdit(bookmark)}
                  className="p-1 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 rounded"
                  title="편집"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(bookmark)}
                  className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate(`/bookmarks?bookmark=${bookmark.id}`)}
                  className="p-1 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 rounded"
                  title="북마크 페이지에서 보기"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            최근 추가된 북마크가 없습니다.
          </p>
        )}
      </div>
    </div>
  );
};

interface CollectionDistributionProps {
  bookmarks: Bookmark[];
  collections: Collection[];
}

const CollectionDistribution: React.FC<CollectionDistributionProps> = ({
  bookmarks,
  collections,
}) => {
  const collectionStats = collections.map((collection) => {
    const count = bookmarks.filter(
      (bookmark) => bookmark.collection === collection.id
    ).length;
    return { ...collection, count };
  });

  const totalBookmarks = bookmarks.length;
  const unassignedCount = bookmarks.filter(
    (bookmark) => !bookmark.collection
  ).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        컬렉션별 분포
      </h3>
      <div className="space-y-3">
        {unassignedCount > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                컬렉션 없음
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gray-400 dark:bg-gray-500 h-2 rounded-full"
                  style={{
                    width: `${(unassignedCount / totalBookmarks) * 100}%`,
                  }}
                />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">
                {unassignedCount}
              </span>
            </div>
          </div>
        )}
        {collectionStats
          .filter((collection) => collection.count > 0)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
          .map((collection) => (
            <div
              key={collection.id}
              className="flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{collection.icon}</span>
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-32">
                  {collection.name}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-brand-500 h-2 rounded-full"
                    style={{
                      width: `${(collection.count / totalBookmarks) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">
                  {collection.count}
                </span>
              </div>
            </div>
          ))}
        {collectionStats.filter((collection) => collection.count > 0).length ===
          0 && (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            컬렉션이 없습니다.
          </p>
        )}
      </div>
    </div>
  );
};

interface QuickActionsProps {
  onAddBookmark: () => void;
  onAddCollection: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onAddBookmark,
  onAddCollection,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        빠른 작업
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={onAddBookmark}
          className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900 rounded-lg flex items-center justify-center">
            <Plus className="w-5 h-5 text-brand-600 dark:text-brand-400" />
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
          className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
            <FolderPlus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
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

interface DashboardOverviewProps {
  bookmarks: Bookmark[];
  collections: Collection[];
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
  onAddBookmark: () => void;
  onAddCollection: () => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onReorderFavorites: (newBookmarks: Bookmark[]) => void;
}

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 시계 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center">
          <div className="text-3xl font-bold text-brand-600 dark:text-brand-400 tracking-widest mb-1">
            {timeStr}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
            {dateStr}
          </div>
        </div>

        {/* 날씨 */}
        <div className="lg:col-span-2">
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
  onAddBookmark,
  onAddCollection,
  onToggleFavorite,
  onReorderFavorites,
}) => {
  const totalBookmarks = bookmarks.length;
  const totalCollections = collections.length;
  const unassignedBookmarks = bookmarks.filter(
    (bookmark) => !bookmark.collection
  ).length;
  const recentBookmarks = bookmarks
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 시계 위젯 */}
      <ClockWidget />

      {/* 즐겨찾기 북마크 - 시계 바로 아래로 이동 */}
      <FavoriteBookmarks
        bookmarks={bookmarks}
        onToggleFavorite={onToggleFavorite}
        onReorder={onReorderFavorites}
      />

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="전체 북마크"
          value={totalBookmarks}
          icon={<BookOpen className="w-6 h-6" />}
          color="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
          description="총 북마크 수"
        />
        <StatsCard
          title="컬렉션"
          value={totalCollections}
          icon={<Folder className="w-6 h-6" />}
          color="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400"
          description="총 컬렉션 수"
        />
        <StatsCard
          title="미분류 북마크"
          value={unassignedBookmarks}
          icon={<FileText className="w-6 h-6" />}
          color="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
          description="컬렉션 없는 북마크"
        />
        <StatsCard
          title="최근 추가"
          value={recentBookmarks.length}
          icon={<Sparkles className="w-6 h-6" />}
          color="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400"
          description="최근 5개 북마크"
        />
      </div>
      {/* 위젯 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentBookmarks
          bookmarks={bookmarks}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
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
