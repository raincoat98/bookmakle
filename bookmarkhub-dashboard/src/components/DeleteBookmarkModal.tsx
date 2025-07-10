import type { Bookmark } from "../types";

interface DeleteBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  bookmark: Bookmark | null;
  isDeleting: boolean;
}

export const DeleteBookmarkModal = ({
  isOpen,
  onClose,
  onDelete,
  bookmark,
  isDeleting,
}: DeleteBookmarkModalProps) => {
  if (!isOpen || !bookmark) return null;

  const handleDelete = () => {
    onDelete(bookmark.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          북마크 삭제
        </h3>
        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300 mb-3">
            다음 북마크를 삭제하시겠습니까?
          </p>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              {bookmark.title}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 break-all">
              {bookmark.url}
            </p>
            {bookmark.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {bookmark.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            disabled={isDeleting}
          >
            취소
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
            disabled={isDeleting}
          >
            {isDeleting ? "삭제 중..." : "삭제"}
          </button>
        </div>
      </div>
    </div>
  );
};
