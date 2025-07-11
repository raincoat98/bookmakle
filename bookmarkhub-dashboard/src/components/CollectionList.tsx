import { useState, useEffect, useRef } from "react";
import type { Collection } from "../types";
import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";

interface CollectionListProps {
  collections: Collection[];
  loading: boolean;
  selectedCollection: string;
  onCollectionChange: (collectionId: string) => void;
  onAddCollection: (
    name: string,
    description: string,
    icon: string,
    parentId?: string
  ) => Promise<void>;
  onDeleteCollection: (collectionId: string) => Promise<void>;
}

export const CollectionList = ({
  collections,
  loading,
  selectedCollection,
  onCollectionChange,
  onAddCollection,
  onDeleteCollection,
}: CollectionListProps) => {
  const [isAddingCollection, setIsAddingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [newCollectionIcon, setNewCollectionIcon] = useState("📁");
  const [newCollectionParentId, setNewCollectionParentId] = useState<
    string | null
  >(null);
  const [deletingCollectionId, setDeletingCollectionId] = useState<
    string | null
  >(null);
  const [isCollectionSubmitting, setIsCollectionSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [targetCollectionId, setTargetCollectionId] = useState<string | null>(
    null
  );
  const [targetCollectionName, setTargetCollectionName] = useState<string>("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSubEmojiPicker, setShowSubEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const subEmojiPickerRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
      if (
        subEmojiPickerRef.current &&
        !subEmojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowSubEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 오픈된(열린) 컬렉션 id 목록
  const [openIds, setOpenIds] = useState<string[]>([]);

  // 상태 및 핸들러 추가
  const allIds = collections.map((col) => col.id);
  const handleOpenAll = () => setOpenIds(allIds);
  const handleCloseAll = () => setOpenIds([]);

  // 하위 컬렉션 존재 여부
  const hasChildren = (id: string) =>
    collections.some((col) => col.parentId === id);

  // 토글 핸들러
  const handleToggle = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((openId) => openId !== id) : [...prev, id]
    );
  };

  // 하위 컬렉션 추가 모달 상태
  const [isAddSubModalOpen, setIsAddSubModalOpen] = useState(false);
  const [subParentId, setSubParentId] = useState<string | null>(null);

  const handleAddCollection = async () => {
    if (!newCollectionName.trim() || isCollectionSubmitting) return;
    setIsCollectionSubmitting(true);
    try {
      await onAddCollection(
        newCollectionName.trim(),
        newCollectionDescription.trim(),
        newCollectionIcon,
        newCollectionParentId ?? undefined
      );
      setNewCollectionName("");
      setNewCollectionDescription("");
      setNewCollectionIcon("📁");
      setNewCollectionParentId(null);
      setIsAddingCollection(false);
      toast.success("컬렉션이 추가되었습니다!");
    } catch (error) {
      console.error("Error adding collection:", error);
      toast.error("컬렉션 추가 중 오류가 발생했습니다.");
      alert("컬렉션 추가 중 오류가 발생했습니다.");
    } finally {
      setIsCollectionSubmitting(false);
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    setDeletingCollectionId(collectionId);
    await onDeleteCollection(collectionId);
    setDeletingCollectionId(null);
    setShowDeleteModal(false);
    setTargetCollectionId(null);
    setTargetCollectionName("");
  };

  const openDeleteModal = (collectionId: string, collectionName: string) => {
    setTargetCollectionId(collectionId);
    setTargetCollectionName(collectionName);
    setShowDeleteModal(true);
  };
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setTargetCollectionId(null);
    setTargetCollectionName("");
  };

  // 우클릭 컨텍스트 메뉴 이벤트
  const handleCollectionContextMenu = (
    e: React.MouseEvent,
    collectionId: string
  ) => {
    e.preventDefault();
    setSubParentId(collectionId);
    setIsAddSubModalOpen(true);
  };

  // parentId의 깊이 계산 함수
  function getCollectionDepth(id: string | null): number {
    let depth = 0;
    let current = collections.find((col) => col.id === id);
    while (current && current.parentId) {
      depth++;
      const parent = collections.find((col) => col.id === current!.parentId);
      if (!parent) break;
      current = parent;
    }
    return depth;
  }

  // 하위 컬렉션 추가 핸들러
  const handleAddSubCollection = async (
    name: string,
    description: string,
    icon: string
  ) => {
    // parentId의 깊이가 2 이상이면 추가 불가
    if (getCollectionDepth(subParentId) >= 2) {
      toast.error("2단계 이상 하위 컬렉션은 추가할 수 없습니다.");
      setIsAddSubModalOpen(false);
      setSubParentId(null);
      return;
    }
    await onAddCollection(name, description, icon, subParentId ?? undefined);
    setIsAddSubModalOpen(false);
    setSubParentId(null);
  };

  const handleEmojiSelect = (emojiObject: { emoji: string }) => {
    setNewCollectionIcon(emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const handleSubEmojiSelect = (emojiObject: { emoji: string }) => {
    setNewCollectionIcon(emojiObject.emoji);
    setShowSubEmojiPicker(false);
  };

  // 트리 구조로 컬렉션을 렌더링하는 재귀 함수
  function renderCollectionTree(
    parentId: string | null,
    depth: number = 0
  ): React.JSX.Element[] {
    if (depth > 2) return [];
    const filteredCollections = collections.filter(
      (col) => col.parentId === parentId
    );
    return filteredCollections.flatMap((collection, index) => {
      const children = renderCollectionTree(collection.id, depth + 1);
      const isOpen = openIds.includes(collection.id);
      const hasChild = hasChildren(collection.id);
      const isLastChild = index === filteredCollections.length - 1;
      const nodes = [
        <div
          key={collection.id}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 cursor-pointer relative tree-item border-l-4 ${
            selectedCollection === collection.id
              ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-500 dark:border-blue-400"
              : depth === 1
              ? "tree-depth-1 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              : depth === 2
              ? "tree-depth-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-transparent"
          }`}
          style={{
            paddingLeft: `${depth * 12 + 8}px`,
          }}
          onContextMenu={
            depth < 2
              ? (e) => handleCollectionContextMenu(e, collection.id)
              : undefined
          }
          onClick={() => {
            if (hasChild) {
              handleToggle(collection.id);
              if (!isOpen) return;
            }
            onCollectionChange(collection.id);
          }}
        >
          {/* 트리 라인 표시 */}
          {depth > 0 && (
            <div className="tree-line">
              <div className="tree-line-horizontal"></div>
            </div>
          )}

          {/* 하위 컬렉션 연결선 - 마지막 자식이 아닌 경우에만 표시 */}
          {depth > 0 && !isLastChild && (
            <div className="tree-line-vertical"></div>
          )}

          {/* 트리 아이콘 영역 - 고정된 공간 할당 */}
          <div className="w-4 h-4 flex items-center justify-center">
            {hasChild && (
              <span
                className="tree-toggle"
                style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle(collection.id);
                }}
              >
                ▶
              </span>
            )}
            {!hasChild && depth > 0 && <span className="tree-leaf">└</span>}
          </div>
          <span className="text-lg">{collection.icon}</span>
          <div className="flex-1 min-w-0">
            <span className="font-medium truncate block text-left">
              {collection.name}
            </span>
            {collection.description && collection.description.trim() !== "" && (
              <span className="block text-xs text-gray-500 dark:text-gray-400 text-left truncate mt-0.5">
                {collection.description}
              </span>
            )}
          </div>
          {/* 삭제 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              openDeleteModal(collection.id, collection.name);
            }}
            className="ml-2 p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            disabled={deletingCollectionId === collection.id}
            title="삭제"
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>,
      ];
      if (hasChild && isOpen) nodes.push(...children);
      return nodes;
    });
  }

  return (
    <div className="w-full h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          컬렉션
        </h2>
        <button
          onClick={
            openIds.length === allIds.length ? handleCloseAll : handleOpenAll
          }
          className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          {openIds.length === allIds.length ? "전체 닫기" : "전체 열기"}
        </button>
      </div>

      {/* 컬렉션 목록 */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
        <nav className="space-y-2">
          {/* 전체 북마크 */}
          <button
            onClick={() => onCollectionChange("all")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
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
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
              selectedCollection === "none"
                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <span className="text-lg">📄</span>
            <span className="font-medium">컬렉션 없음</span>
          </button>

          {collections.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>컬렉션이 없습니다.</p>
              <p className="text-sm mt-1">새 컬렉션을 만들어보세요!</p>
            </div>
          )}

          {/* 트리 구조 컬렉션 렌더링 */}
          {!loading && renderCollectionTree(null, 0)}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          )}
        </nav>
      </div>

      {/* 새 컬렉션 추가 섹션 */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {isAddingCollection ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                아이콘 선택
              </label>
              <div className="relative" ref={emojiPickerRef}>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="flex items-center justify-center w-10 h-10 rounded-lg text-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {newCollectionIcon}
                </button>
                {showEmojiPicker && (
                  <div className="absolute z-10 bottom-full mb-2">
                    <EmojiPicker
                      onEmojiClick={handleEmojiSelect}
                      width={300}
                      height={400}
                    />
                  </div>
                )}
              </div>
            </div>
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="컬렉션 이름을 입력하세요"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === "Enter" && handleAddCollection()}
              autoFocus
            />
            <input
              type="text"
              value={newCollectionDescription}
              onChange={(e) => setNewCollectionDescription(e.target.value)}
              placeholder="컬렉션 설명을 입력하세요 (선택 사항)"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === "Enter" && handleAddCollection()}
            />
            <div className="flex space-x-2">
              <button
                onClick={handleAddCollection}
                className="flex-1 btn-primary py-3 text-sm font-medium"
                disabled={isCollectionSubmitting || !newCollectionName.trim()}
              >
                {isCollectionSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-4 w-4 mr-2"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    추가 중...
                  </span>
                ) : (
                  "추가"
                )}
              </button>
              <button
                onClick={() => {
                  setIsAddingCollection(false);
                  setNewCollectionName("");
                  setNewCollectionDescription("");
                  setNewCollectionIcon("📁");
                }}
                className="flex-1 btn-secondary py-3 text-sm font-medium"
                disabled={isCollectionSubmitting}
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingCollection(true)}
            className="w-full flex items-center justify-center space-x-2 btn-primary py-3 font-medium"
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span>새 컬렉션</span>
          </button>
        )}
      </div>

      {/* 하위 컬렉션 추가 모달 */}
      {isAddSubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-xs">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              하위 컬렉션 추가
            </h3>
            <input
              type="text"
              placeholder="컬렉션 이름을 입력하세요"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
              autoFocus
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" &&
                handleAddSubCollection(
                  newCollectionName,
                  newCollectionDescription,
                  newCollectionIcon
                )
              }
            />
            <input
              type="text"
              placeholder="컬렉션 설명을 입력하세요 (선택 사항)"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
              value={newCollectionDescription}
              onChange={(e) => setNewCollectionDescription(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" &&
                handleAddSubCollection(
                  newCollectionName,
                  newCollectionDescription,
                  newCollectionIcon
                )
              }
            />
            <div className="relative mb-4" ref={subEmojiPickerRef}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                아이콘 선택
              </label>
              <button
                type="button"
                onClick={() => setShowSubEmojiPicker(!showSubEmojiPicker)}
                className="flex items-center justify-center w-10 h-10 rounded-lg text-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {newCollectionIcon}
              </button>
              {showSubEmojiPicker && (
                <div className="absolute z-20 bottom-full mb-2">
                  <EmojiPicker
                    onEmojiClick={handleSubEmojiSelect}
                    width={300}
                    height={400}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsAddSubModalOpen(false)}
                className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                취소
              </button>
              <button
                onClick={() =>
                  handleAddSubCollection(
                    newCollectionName,
                    newCollectionDescription,
                    newCollectionIcon
                  )
                }
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                disabled={!newCollectionName.trim()}
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-xs">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              컬렉션 삭제
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              <span className="font-bold">{targetCollectionName}</span> 컬렉션을
              삭제하시겠습니까?
              <br />이 컬렉션에 속한 북마크들은 컬렉션에서 제거됩니다.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                취소
              </button>
              <button
                onClick={() =>
                  targetCollectionId &&
                  handleDeleteCollection(targetCollectionId)
                }
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                disabled={deletingCollectionId === targetCollectionId}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
