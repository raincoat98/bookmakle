import { BookmarkCard } from "./BookmarkCard";
import type { Bookmark, Collection } from "../types";

interface BookmarkListProps {
  bookmarks: Bookmark[];
  collections: Collection[];
  loading: boolean;
  onDelete: (id: string) => void;
}

export const BookmarkList = ({
  bookmarks,
  collections,
  loading,
  onDelete,
}: BookmarkListProps) => {
  if (loading) {
    return (
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            북마크가 없습니다
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            첫 번째 북마크를 추가해보세요!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bookmarks.map((bookmark) => (
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            collections={collections}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};
