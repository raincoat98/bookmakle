import type { Bookmark, Collection } from "../types";

interface BookmarkCardProps {
  bookmark: Bookmark;
  collections: Collection[];
  onDelete: (id: string) => void;
}

export const BookmarkCard = ({
  bookmark,
  collections,
  onDelete,
}: BookmarkCardProps) => {
  const handleDelete = () => {
    if (confirm("이 북마크를 삭제하시겠습니까?")) {
      onDelete(bookmark.id);
    }
  };

  // 컬렉션 ID로 컬렉션 이름 찾기
  const getCollectionName = (collectionId: string) => {
    const collection = collections.find((c) => c.id === collectionId);
    return collection ? collection.name : collectionId;
  };

  return (
    <div className="card p-4 hover:shadow-lg transition-shadow duration-200">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {bookmark.title}
          </h3>
          <p className="text-sm text-blue-600 dark:text-blue-400 truncate">
            {bookmark.url}
          </p>
        </div>
        <button
          onClick={handleDelete}
          className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
          title="삭제"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      {bookmark.description && (
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
          {bookmark.description}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        {bookmark.collection && (
          <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {getCollectionName(bookmark.collection)}
          </span>
        )}
        <span>{bookmark.createdAt.toLocaleDateString()}</span>
      </div>

      <div className="mt-3">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary text-sm w-full text-center"
        >
          방문하기
        </a>
      </div>
    </div>
  );
};
