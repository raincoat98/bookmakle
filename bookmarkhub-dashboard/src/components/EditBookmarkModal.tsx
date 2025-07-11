import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import type { Bookmark, BookmarkFormData, Collection } from "../types";
import {
  getFaviconUrl,
  findFaviconFromWebsite,
  refreshFavicon,
  getFaviconPreviewUrl,
} from "../utils/favicon";

interface EditBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, bookmarkData: BookmarkFormData) => Promise<void>;
  bookmark: Bookmark | null;
  collections: Collection[];
}

export const EditBookmarkModal = ({
  isOpen,
  onClose,
  onUpdate,
  bookmark,
  collections,
}: EditBookmarkModalProps) => {
  const [tagInput, setTagInput] = useState("");
  const [formData, setFormData] = useState<BookmarkFormData>({
    title: "",
    url: "",
    description: "",
    favicon: "",
    collection: "",
    tags: [],
    isFavorite: false, // 즐겨찾기 필드 추가
  });
  const [loading, setLoading] = useState(false);
  const [faviconLoading, setFaviconLoading] = useState(false);
  // faviconStatus, setFaviconStatus 등 상태 제거
  const [showFaviconPreview, setShowFaviconPreview] = useState(false);

  // 북마크 데이터가 변경될 때 폼 데이터 업데이트
  useEffect(() => {
    if (bookmark) {
      setFormData({
        title: bookmark.title,
        url: bookmark.url,
        description: bookmark.description || "",
        favicon: bookmark.favicon || "",
        collection: bookmark.collection || collections[0]?.id || "",
        tags: bookmark.tags || [],
        isFavorite: bookmark.isFavorite || false, // 즐겨찾기 필드 추가
      });
    }
  }, [bookmark, collections]);

  // URL이 변경될 때 파비콘 자동 가져오기
  useEffect(() => {
    const fetchFavicon = async () => {
      if (formData.url && formData.url !== bookmark?.url) {
        setFaviconLoading(true);
        try {
          // 먼저 기본 파비콘 URL 생성
          const defaultFavicon = getFaviconUrl(formData.url);
          setFormData((prev) => ({ ...prev, favicon: defaultFavicon }));

          // 웹사이트에서 실제 파비콘 찾기 시도
          const actualFavicon = await findFaviconFromWebsite(formData.url);
          setFormData((prev) => ({ ...prev, favicon: actualFavicon }));
        } catch (error) {
          console.error("파비콘 가져오기 실패:", error);
        } finally {
          setFaviconLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(fetchFavicon, 1000); // 1초 후 실행
    return () => clearTimeout(timeoutId);
  }, [formData.url, bookmark?.url]);

  // 파비콘 상태 확인
  useEffect(() => {
    const checkStatus = async () => {
      if (formData.favicon) {
        // setFaviconStatus(status); // 상태 제거
      } else {
        // setFaviconStatus(null); // 상태 제거
      }
    };

    checkStatus();
  }, [formData.favicon]);

  // 태그 추가 함수
  const handleAddTag = () => {
    const value = tagInput.trim();
    if (value && !formData.tags.includes(value)) {
      setFormData({ ...formData, tags: [...formData.tags, value] });
    }
    setTagInput("");
  };
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const nativeEvent = e.nativeEvent as unknown as { isComposing?: boolean };
    const isComposing =
      typeof nativeEvent.isComposing === "boolean"
        ? nativeEvent.isComposing
        : false;
    if (e.key === "Enter" && !isComposing) {
      e.preventDefault();
      handleAddTag();
    }
  };
  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookmark || !formData.title || !formData.url) return;

    setLoading(true);
    try {
      await onUpdate(bookmark.id, formData);
      onClose();
    } catch (error) {
      console.error("Error updating bookmark:", error);
      toast.error("북마크 수정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshFavicon = async () => {
    if (!formData.url) return;

    setFaviconLoading(true);
    try {
      const newFavicon = await refreshFavicon(formData.url);
      setFormData((prev) => ({ ...prev, favicon: newFavicon }));
    } catch (error) {
      console.error("파비콘 재가져오기 실패:", error);
      toast.error("파비콘 재가져오기에 실패했습니다.");
    } finally {
      setFaviconLoading(false);
    }
  };

  const handleFaviconUrlChange = (newUrl: string) => {
    setFormData((prev) => ({ ...prev, favicon: newUrl }));
  };

  const handleApplyFavicon = async () => {
    if (!formData.favicon) return;

    setFaviconLoading(true);
    try {
      // 완전히 삭제: const status = await checkFaviconStatus(formData.favicon);
    } catch (error) {
      console.error("파비콘 URL 검증 실패:", error);
    } finally {
      setFaviconLoading(false);
    }
  };

  if (!isOpen || !bookmark) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">
              북마크 수정
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
        <form
          onSubmit={handleSubmit}
          className="p-4 lg:p-6 space-y-4 flex-1 overflow-y-auto min-h-0"
        >
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
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
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
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="https://example.com"
              required
            />
          </div>

          {/* 파비콘 미리보기 및 수정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              파비콘
            </label>
            <div className="space-y-3">
              {/* 파비콘 미리보기 */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="relative">
                  {formData.favicon ? (
                    <img
                      src={formData.favicon}
                      alt="파비콘"
                      className="w-8 h-8 rounded"
                      onError={(e) => {
                        e.currentTarget.src = "/favicon.svg";
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </div>
                  )}
                  {faviconLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-500"></div>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  {/* 파비콘 오류/상태 메시지 UI 모두 제거 */}
                </div>
              </div>

              {/* 파비콘 URL 입력 */}
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={formData.favicon}
                    onChange={(e) => handleFaviconUrlChange(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    placeholder="파비콘 URL"
                  />
                  <button
                    type="button"
                    onClick={handleApplyFavicon}
                    className="px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                    disabled={!formData.favicon || faviconLoading}
                  >
                    {faviconLoading ? "확인 중..." : "적용하기"}
                  </button>
                </div>

                {/* 파비콘 액션 버튼들 */}
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleRefreshFavicon}
                    className="flex-1 px-3 py-2 text-sm bg-brand-500 text-white rounded hover:bg-brand-600 disabled:opacity-50"
                    disabled={faviconLoading || !formData.url}
                  >
                    {faviconLoading ? "가져오는 중..." : "재가져오기"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowFaviconPreview(!showFaviconPreview)}
                    className="px-3 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    {showFaviconPreview ? "미리보기 닫기" : "미리보기"}
                  </button>
                </div>
              </div>

              {/* 파비콘 미리보기 */}
              {showFaviconPreview && formData.url && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    파비콘 미리보기
                  </h4>
                  <div className="flex items-center space-x-3">
                    <img
                      src={getFaviconPreviewUrl(formData.url)}
                      alt="파비콘 미리보기"
                      className="w-12 h-12 rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      <p>도메인: {new URL(formData.url).hostname}</p>
                      <p>미리보기 크기: 64x64</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 태그 입력 UI */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              태그
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                >
                  {tag}
                  <button
                    type="button"
                    className="ml-1 text-xs"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="태그를 입력 후 엔터 또는 쉼표"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                추가
              </button>
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
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="북마크에 대한 설명을 입력하세요 (선택사항)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              컬렉션
            </label>
            <select
              value={formData.collection}
              onChange={(e) =>
                setFormData({ ...formData, collection: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="">선택없음</option>
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
                  <span>수정 중...</span>
                </div>
              ) : (
                "수정"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
