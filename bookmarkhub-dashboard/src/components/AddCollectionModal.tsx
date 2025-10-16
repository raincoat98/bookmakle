import { useState } from "react";
import { IconPicker } from "./IconPicker";
import * as LucideIcons from "lucide-react";

interface AddCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (
    name: string,
    description: string,
    icon: string,
    parentId?: string | null,
    isPinned?: boolean
  ) => Promise<void>;
  parentId?: string | null;
}

export const AddCollectionModal = ({
  isOpen,
  onClose,
  onAdd,
  parentId = null,
}: AddCollectionModalProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("Folder");
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onAdd(name.trim(), description.trim(), icon, parentId, isPinned);
      setName("");
      setDescription("");
      setIcon("Folder");
      setIsPinned(false);
      setShowIconPicker(false);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleIconSelect = (iconName: string) => {
    setIcon(iconName);
  };

  // 현재 선택된 아이콘 컴포넌트 렌더링
  const renderSelectedIcon = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IconComponent = (LucideIcons as any)[icon];
    if (!IconComponent) return <LucideIcons.Folder className="w-6 h-6" />;
    return <IconComponent className="w-6 h-6" />;
  };

  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {parentId ? "하위 컬렉션 추가" : "컬렉션 추가"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                이름 *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="컬렉션 이름을 입력하세요"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                아이콘
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowIconPicker(true)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-gray-700 dark:text-gray-300">
                      {renderSelectedIcon()}
                    </div>
                    <span>{icon}</span>
                  </div>
                  <span className="text-gray-500">선택</span>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                설명
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="컬렉션에 대한 설명을 입력하세요 (선택사항)"
              />
            </div>

            {/* 고정하기 옵션 */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isPinned"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 rounded focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label
                htmlFor="isPinned"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2"
              >
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  PIN
                </span>
                <span>고정하기 (기본 탭으로 설정)</span>
              </label>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                disabled={loading}
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="px-4 py-2 rounded bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "추가 중..." : "추가"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 아이콘 피커 */}
      <IconPicker
        selectedIcon={icon}
        onSelect={handleIconSelect}
        isOpen={showIconPicker}
        onClose={() => setShowIconPicker(false)}
      />
    </>
  );
};
