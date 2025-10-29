import React from "react";
import { useTranslation } from "../../../node_modules/react-i18next";
import { BookOpen, Folder, FileText, Sparkles } from "lucide-react";
import type { Bookmark, Collection } from "../../types";

interface StatsSettingsProps {
  bookmarks: Bookmark[];
  collections: Collection[];
}

export const StatsSettings: React.FC<StatsSettingsProps> = ({
  bookmarks,
  collections,
}) => {
  const { t } = useTranslation();

  const totalBookmarks = bookmarks.length;
  const totalCollections = collections.length;
  const unassignedBookmarks = bookmarks.filter((b) => !b.collection).length;
  const favoriteBookmarks = bookmarks.filter((b) => b.isFavorite).length;

  const StatsCard = ({
    title,
    value,
    icon,
    color,
    description,
  }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    description?: string;
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {value.toLocaleString()}
          </p>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${color}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t("settings.bookmarkStatistics")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title={t("settings.totalBookmarks")}
            value={totalBookmarks}
            icon={<BookOpen className="w-6 h-6" />}
            color="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
            description={t("settings.totalBookmarksDescription")}
          />
          <StatsCard
            title={t("collections.title")}
            value={totalCollections}
            icon={<Folder className="w-6 h-6" />}
            color="bg-gradient-to-r from-purple-500 to-purple-600 text-white"
            description={t("settings.totalCollectionsDescription")}
          />
          <StatsCard
            title={t("settings.favorites")}
            value={favoriteBookmarks}
            icon={<Sparkles className="w-6 h-6" />}
            color="bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
            description={t("settings.favoritesDescription")}
          />
          <StatsCard
            title={t("settings.unassigned")}
            value={unassignedBookmarks}
            icon={<FileText className="w-6 h-6" />}
            color="bg-gradient-to-r from-gray-500 to-gray-600 text-white"
            description={t("settings.unassignedDescription")}
          />
        </div>
      </div>

      {/* 추가 통계 정보 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t("settings.detailedAnalysis")}
        </h3>
        <div className="space-y-4">
          {collections.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                {t("settings.bookmarkDistributionByCollection")}
              </h4>
              <div className="space-y-2">
                {collections.map((collection) => {
                  const count = bookmarks.filter(
                    (b) => b.collection === collection.id
                  ).length;
                  const percentage =
                    totalBookmarks > 0 ? (count / totalBookmarks) * 100 : 0;

                  return (
                    <div
                      key={collection.id}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {collection.name}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-500 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[2rem]">
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {unassignedBookmarks > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {t("settings.unassigned")}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gray-500 rounded-full transition-all duration-300"
                          style={{
                            width: `${
                              totalBookmarks > 0
                                ? (unassignedBookmarks / totalBookmarks) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[2rem]">
                        {unassignedBookmarks}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
