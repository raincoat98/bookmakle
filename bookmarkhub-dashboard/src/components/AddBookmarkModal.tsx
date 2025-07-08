import { useState } from "react";
import type { BookmarkFormData, Collection } from "../types";

interface AddBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (bookmarkData: BookmarkFormData) => Promise<void>;
  collections: Collection[];
}

export const AddBookmarkModal = ({
  isOpen,
  onClose,
  onAdd,
  collections,
}: AddBookmarkModalProps) => {
  const [formData, setFormData] = useState<BookmarkFormData>({
    title: "",
    url: "",
    description: "",
    collection: collections.length > 0 ? collections[0].id : "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.url) return;

    setLoading(true);
    try {
      await onAdd(formData);
      setFormData({
        title: "",
        url: "",
        description: "",
        collection: collections.length > 0 ? collections[0].id : "",
      });
      onClose();
    } catch (error) {
      console.error("Error adding bookmark:", error);
      alert("북마크 추가 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 컬렉션이 변경될 때 formData 업데이트
  const updateFormDataCollection = (collectionId: string) => {
    setFormData({
      ...formData,
      collection: collectionId,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">
              새 북마크 추가
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-4 lg:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              제목 *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="북마크 제목을 입력하세요"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL *
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="북마크에 대한 설명을 입력하세요 (선택사항)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              컬렉션
            </label>
            <select
              value={formData.collection}
              onChange={(e) => updateFormDataCollection(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.icon} {collection.name}
                </option>
              ))}
            </select>
          </div>

          {/* 버튼 영역 */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary py-3 font-medium"
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary py-3 font-medium"
              disabled={loading || !formData.title || !formData.url}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>추가 중...</span>
                </div>
              ) : (
                "추가"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
