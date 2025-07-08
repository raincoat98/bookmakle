import { useState } from "react";
import type { Collection } from "../types";

interface CollectionListProps {
  collections: Collection[];
  loading: boolean;
  selectedCollection: string;
  onCollectionChange: (collectionId: string) => void;
  onAddCollection: (name: string, icon: string) => Promise<void>;
}

export const CollectionList = ({
  collections,
  loading,
  selectedCollection,
  onCollectionChange,
  onAddCollection,
}: CollectionListProps) => {
  const [isAddingCollection, setIsAddingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionIcon, setNewCollectionIcon] = useState("📁");

  const handleAddCollection = async () => {
    if (!newCollectionName.trim()) return;

    try {
      await onAddCollection(newCollectionName.trim(), newCollectionIcon);
      setNewCollectionName("");
      setNewCollectionIcon("📁");
      setIsAddingCollection(false);
    } catch (error) {
      console.error("Error adding collection:", error);
      alert("컬렉션 추가 중 오류가 발생했습니다.");
    }
  };

  const iconOptions = [
    "📁",
    "📚",
    "📌",
    "💼",
    "🏠",
    "🎯",
    "⭐",
    "🔥",
    "💡",
    "🎨",
    "🎵",
    "🎮",
    "📱",
    "💻",
    "🌐",
    "📖",
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        컬렉션
      </h2>

      <nav className="space-y-1">
        {/* 전체 북마크 */}
        <button
          onClick={() => onCollectionChange("all")}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
            selectedCollection === "all"
              ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          <span className="text-lg">📚</span>
          <span className="font-medium">전체</span>
        </button>

        {/* 컬렉션 없음 */}
        <button
          onClick={() => onCollectionChange("none")}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
            selectedCollection === "none"
              ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          <span className="text-lg">📄</span>
          <span className="font-medium">컬렉션 없음</span>
        </button>

        {collections.length === 0 && (
          <div className="text-gray-500 dark:text-gray-400">
            컬렉션이 없습니다.
          </div>
        )}

        {/* 사용자 컬렉션들 */}
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          collections.map((collection) => (
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
          ))
        )}
      </nav>

      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        {isAddingCollection ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                아이콘
              </label>
              <div className="grid grid-cols-8 gap-1">
                {iconOptions.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setNewCollectionIcon(icon)}
                    className={`p-2 rounded text-lg ${
                      newCollectionIcon === icon
                        ? "bg-blue-100 dark:bg-blue-900"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="컬렉션 이름"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === "Enter" && handleAddCollection()}
            />
            <div className="flex space-x-2">
              <button
                onClick={handleAddCollection}
                className="flex-1 btn-primary py-2 text-sm"
              >
                추가
              </button>
              <button
                onClick={() => {
                  setIsAddingCollection(false);
                  setNewCollectionName("");
                  setNewCollectionIcon("📁");
                }}
                className="flex-1 btn-secondary py-2 text-sm"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingCollection(true)}
            className="w-full flex items-center justify-center space-x-2 btn-primary py-2"
          >
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
        )}
      </div>
    </div>
  );
};
