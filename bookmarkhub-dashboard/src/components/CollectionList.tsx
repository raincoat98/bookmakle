import type { Collection } from "../types";

interface CollectionListProps {
  selectedCollection: Collection;
  onCollectionChange: (collection: Collection) => void;
}

const collections = [
  { id: "all" as Collection, name: "전체", icon: "📚" },
  { id: "default" as Collection, name: "기본", icon: "📌" },
  { id: "work" as Collection, name: "Work", icon: "💼" },
  { id: "personal" as Collection, name: "Personal", icon: "🏠" },
];

export const CollectionList = ({
  selectedCollection,
  onCollectionChange,
}: CollectionListProps) => {
  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        컬렉션
      </h2>

      <nav className="space-y-1">
        {collections.map((collection) => (
          <button
            key={collection.id}
            onClick={() => onCollectionChange(collection.id)}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
              selectedCollection === collection.id
                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <span className="text-lg">{collection.icon}</span>
            <span className="font-medium">{collection.name}</span>
          </button>
        ))}
      </nav>

      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button className="w-full flex items-center justify-center space-x-2 btn-primary py-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <span>새 컬렉션</span>
        </button>
      </div>
    </div>
  );
};
