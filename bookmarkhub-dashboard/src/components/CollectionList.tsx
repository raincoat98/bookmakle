import { useState } from "react";
import type { Collection } from "../types";
import { renderCollectionIcon } from "../utils/iconRenderer";

interface CollectionListProps {
  collections: Collection[];
  loading: boolean;
  selectedCollection: string;
  onCollectionChange: (collectionId: string) => void;
  onDeleteCollectionRequest: (
    collectionId: string,
    collectionName: string
  ) => void;
  onEditCollection: (collection: Collection) => void;
  onOpenAddCollectionModal: () => void;
  onOpenAddSubCollectionModal: (parentId: string) => void;
  collapsed?: boolean;
}

export const CollectionList = ({
  collections,
  loading,
  selectedCollection,
  onCollectionChange,
  onDeleteCollectionRequest,
  onEditCollection,
  onOpenAddCollectionModal,
  onOpenAddSubCollectionModal,
  collapsed = false,
}: CollectionListProps) => {
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

  // 우클릭 컨텍스트 메뉴 이벤트
  const handleCollectionContextMenu = (
    e: React.MouseEvent,
    collectionId: string
  ) => {
    e.preventDefault();
    onOpenAddSubCollectionModal(collectionId);
  };

  // 트리 구조로 컬렉션을 렌더링하는 재귀 함수
  function renderCollectionTree(
    parentId: string | null,
    depth: number = 0
  ): React.JSX.Element[] {
    if (depth > 2) return [];
    const filteredCollections = collections
      .filter((col) => col.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name));
    return filteredCollections.flatMap((collection, index) => {
      const children = renderCollectionTree(collection.id, depth + 1);
      const isOpen = openIds.includes(collection.id);
      const hasChild = hasChildren(collection.id);
      const isLastChild = index === filteredCollections.length - 1;
      const nodes = [
        <div
          key={collection.id}
          className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-left transition-colors duration-200 cursor-pointer relative tree-item border-l-4 ${
            selectedCollection === collection.id
              ? "bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 border-brand-500 dark:border-brand-400"
              : depth === 1
              ? "tree-depth-1 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              : depth === 2
              ? "tree-depth-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-transparent"
          }`}
          style={{
            paddingLeft: `${depth * 8 + 6}px`,
          }}
          onContextMenu={
            depth < 2
              ? (e) => handleCollectionContextMenu(e, collection.id)
              : undefined
          }
          onClick={() => {
            if (hasChild) {
              handleToggle(collection.id);
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
          <div className="w-3 h-3 flex items-center justify-center">
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

          <div className="flex items-center space-x-2">
            {renderCollectionIcon(collection.icon, "w-5 h-5")}
            {collection.isPinned && (
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                title="고정된 컬렉션"
              >
                PIN
              </span>
            )}
          </div>

          <div className="flex-1">
            {!collapsed && (
              <span
                className="font-medium block text-left"
                style={{ wordBreak: "break-all", whiteSpace: "normal" }}
              >
                {collection.name}
              </span>
            )}
            {!collapsed &&
              collection.description &&
              collection.description.trim() !== "" && (
                <span
                  className="block text-xs text-gray-500 dark:text-gray-400 text-left mt-0.5"
                  style={{ wordBreak: "break-all", whiteSpace: "normal" }}
                >
                  {collection.description}
                </span>
              )}
          </div>

          {/* 액션 버튼들 */}
          {!collapsed && (
            <div className="flex items-center space-x-1 ml-2">
              {/* 수정 버튼 */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                  onEditCollection(collection);
                }}
                className="p-1 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                title="수정"
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>

              {/* 삭제 버튼 */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                  onDeleteCollectionRequest(collection.id, collection.name);
                }}
                className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
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
            </div>
          )}
        </div>,
      ];
      if (hasChild && isOpen) nodes.push(...children);
      return nodes;
    });
  }

  // 축소 모드에서는 간단한 아이콘 리스트만 표시
  if (collapsed) {
    return (
      <div className="w-full h-full flex flex-col">
        {/* 축소된 컬렉션 목록 */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* 전체 북마크 */}
          <button
            onClick={() => onCollectionChange("all")}
            className={`w-full flex items-center justify-center p-3 rounded-lg transition-colors duration-200 ${
              selectedCollection === "all"
                ? "bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
            title="전체"
          >
            <span className="text-lg">📚</span>
          </button>

          {/* 컬렉션 없음 */}
          <button
            onClick={() => onCollectionChange("none")}
            className={`w-full flex items-center justify-center p-3 rounded-lg transition-colors duration-200 ${
              selectedCollection === "none"
                ? "bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
            title="컬렉션 없음"
          >
            <span className="text-lg">📄</span>
          </button>

          {/* 최상위 컬렉션들만 표시 */}
          {collections
            .filter((col) => !col.parentId)
            .sort((a, b) => {
              // 핀된 컬렉션이 먼저 오도록 정렬
              if (a.isPinned && !b.isPinned) return -1;
              if (!a.isPinned && b.isPinned) return 1;
              return a.name.localeCompare(b.name);
            })
            .map((collection) => (
              <div key={collection.id} className="relative">
                <button
                  onClick={() => onCollectionChange(collection.id)}
                  className={`w-full flex items-center justify-center p-3 rounded-lg transition-colors duration-200 ${
                    selectedCollection === collection.id
                      ? "bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  title={collection.name}
                >
                  {renderCollectionIcon(collection.icon, "w-5 h-5")}
                </button>
                {collection.isPinned && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center px-1 py-0.5 rounded-full text-xs font-bold bg-yellow-400 text-yellow-900 border border-yellow-500">
                    P
                  </span>
                )}
              </div>
            ))}
        </div>

        {/* 새 컬렉션 추가 버튼 */}
        <div className="p-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onOpenAddCollectionModal}
            className="w-full flex items-center justify-center p-3 btn-primary rounded-lg"
            title="새 컬렉션"
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
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* 헤더 */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          컬렉션
        </h2>
        <button
          onClick={
            openIds.length === allIds.length ? handleCloseAll : handleOpenAll
          }
          className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold"
        >
          {openIds.length === allIds.length ? "전체 닫기" : "전체 열기"}
        </button>
      </div>

      {/* 컬렉션 목록 */}
      <div className="flex-1 overflow-y-auto p-3 scrollbar-hide">
        <nav className="space-y-1">
          {/* 전체 북마크 */}
          <button
            onClick={() => onCollectionChange("all")}
            className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-left transition-colors duration-200 ${
              selectedCollection === "all"
                ? "bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <span className="text-lg">📚</span>
            <span className="font-medium">전체</span>
          </button>

          {/* 컬렉션 없음 */}
          <button
            onClick={() => onCollectionChange("none")}
            className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-left transition-colors duration-200 ${
              selectedCollection === "none"
                ? "bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300"
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
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500"></div>
            </div>
          )}
        </nav>
      </div>

      {/* 새 컬렉션 추가 버튼 */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onOpenAddCollectionModal}
          className="w-full flex items-center justify-center space-x-2 btn-primary py-2 font-medium"
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
      </div>
    </div>
  );
};
