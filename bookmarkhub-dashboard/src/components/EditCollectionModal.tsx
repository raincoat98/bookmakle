import { useState, useEffect, useRef } from "react";
import type { Collection, CollectionFormData } from "../types";
import EmojiPicker from "emoji-picker-react";

interface EditCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (
    collectionId: string,
    collectionData: CollectionFormData
  ) => Promise<void>;
  collection: Collection | null;
  collections: Collection[];
}

// 하위 컬렉션 id 재귀적으로 구하는 함수
function getDescendantIds(
  collections: Collection[],
  targetId: string
): string[] {
  let result: string[] = [];
  for (const col of collections) {
    if (col.parentId === targetId) {
      result.push(col.id);
      result = result.concat(getDescendantIds(collections, col.id));
    }
  }
  return result;
}

export const EditCollectionModal = ({
  isOpen,
  onClose,
  onUpdate,
  collection,
  collections,
}: EditCollectionModalProps) => {
  const [formData, setFormData] = useState<CollectionFormData>({
    name: "",
    description: "",
    icon: "📁",
    parentId: null,
  });
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // 컬렉션 데이터가 변경될 때 폼 데이터 업데이트
  useEffect(() => {
    if (collection) {
      setFormData({
        name: collection.name,
        description: collection.description || "",
        icon: collection.icon,
        parentId: collection.parentId,
      });
    }
  }, [collection]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collection || !formData.name.trim()) return;

    setLoading(true);
    try {
      await onUpdate(collection.id, formData);
      onClose();
    } catch (error) {
      console.error("Error updating collection:", error);
      alert("컬렉션 수정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmojiSelect = (emojiObject: { emoji: string }) => {
    setFormData({ ...formData, icon: emojiObject.emoji });
    setShowEmojiPicker(false);
  };

  // 자기 자신 및 하위 컬렉션을 부모 선택지에서 제외
  const descendantIds = collection?.id
    ? getDescendantIds(collections, collection.id)
    : [];
  console.log("collection.id", collection?.id);
  console.log("descendantIds", descendantIds);
  const availableParents = collections.filter(
    (col) => col.id !== collection?.id && !descendantIds.includes(col.id)
  );
  console.log(
    "availableParents",
    availableParents.map((c) => c.id)
  );

  if (!isOpen || !collection) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          컬렉션 수정
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              이름 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="컬렉션 이름을 입력하세요"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              아이콘
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
              >
                <span className="text-2xl">{formData.icon}</span>
                <span className="text-gray-500">선택</span>
              </button>
              {showEmojiPicker && (
                <div
                  ref={emojiPickerRef}
                  className="absolute z-10 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg"
                >
                  <EmojiPicker onEmojiClick={handleEmojiSelect} />
                </div>
              )}
            </div>
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
              placeholder="컬렉션에 대한 설명을 입력하세요 (선택사항)"
            />
          </div>

          {/* 상위 컬렉션 선택: 최상위 컬렉션이면 아예 렌더링하지 않음 */}
          {collection?.parentId !== null && availableParents.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                상위 컬렉션
              </label>
              <select
                value={formData.parentId || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    parentId: e.target.value || null,
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">최상위 컬렉션</option>
                {availableParents.map((parentCollection) => (
                  <option key={parentCollection.id} value={parentCollection.id}>
                    {parentCollection.icon} {parentCollection.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "수정 중..." : "수정"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
