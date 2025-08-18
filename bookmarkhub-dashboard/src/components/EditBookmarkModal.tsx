import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import type { Bookmark, BookmarkFormData, Collection } from "../types";
import { getFaviconUrl, findFaviconFromWebsite } from "../utils/favicon";

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
    isFavorite: false,
  });
  const [loading, setLoading] = useState(false);
  const [faviconLoading, setFaviconLoading] = useState(false);

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
        isFavorite: bookmark.isFavorite || false,
      });
    }
  }, [bookmark, collections]);

  // URL이 변경될 때 파비콘 자동 가져오기
  useEffect(() => {
    const fetchFavicon = async () => {
      if (formData.url && formData.url !== bookmark?.url) {
        setFaviconLoading(true);
        try {
          const defaultFavicon = getFaviconUrl(formData.url);
          setFormData((prev) => ({ ...prev, favicon: defaultFavicon }));

          const actualFavicon = await findFaviconFromWebsite(formData.url);
          setFormData((prev) => ({ ...prev, favicon: actualFavicon }));
        } catch (error) {
          console.error("파비콘 가져오기 실패:", error);
        } finally {
          setFaviconLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(fetchFavicon, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData.url, bookmark?.url]);

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

  if (!isOpen || !bookmark) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 래퍼 */}
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* 모달 컨테이너 */}
        <div className="relative w-full max-w-md animate-slide-up">
          <div className="card-glass max-h-[90vh] overflow-hidden flex flex-col">
            {/* 헤더 - 고정 */}
            <div className="flex items-center justify-between p-6 sm:p-8 pb-4 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-10 border-b border-white/20 dark:border-gray-700/30">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                북마크 수정
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-xl transition-all duration-200 hover:scale-110 hover:bg-white/50 dark:hover:bg-gray-700/50 backdrop-blur-sm"
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

            {/* 폼 - 스크롤 가능 */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 pt-4">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 제목 입력 */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    제목 *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="북마크 제목"
                    className="w-full px-4 py-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/30 dark:border-gray-600/30 rounded-2xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    required
                  />
                </div>

                {/* URL 입력 */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    URL *
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/30 dark:border-gray-600/30 rounded-2xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    required
                  />
                </div>

                {/* 파비콘 미리보기 */}
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    {formData.favicon ? (
                      <img
                        src={formData.favicon}
                        alt="파비콘"
                        className="w-6 h-6 rounded"
                        onError={(e) => {
                          e.currentTarget.src = "/favicon.svg";
                        }}
                      />
                    ) : (
                      <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                      </div>
                    )}
                    {faviconLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-brand-500"></div>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {faviconLoading
                      ? "파비콘 가져오는 중..."
                      : "파비콘 미리보기"}
                  </span>
                </div>

                {/* 설명 입력 */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    설명 (선택사항)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="북마크에 대한 설명을 입력하세요"
                    rows={3}
                    className="w-full px-4 py-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/30 dark:border-gray-600/30 rounded-2xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                  />
                </div>

                {/* 컬렉션 선택 */}
                {collections.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      컬렉션 (선택사항)
                    </label>
                    <select
                      value={formData.collection}
                      onChange={(e) =>
                        setFormData({ ...formData, collection: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/30 dark:border-gray-600/30 rounded-2xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all duration-200 text-gray-900 dark:text-white"
                    >
                      <option value="">컬렉션 선택 안함</option>
                      {collections.map((collection) => (
                        <option key={collection.id} value={collection.id}>
                          {collection.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 태그 입력 */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    태그 (선택사항)
                  </label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
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
                        className="flex-1 px-3 py-2 text-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/30 dark:border-gray-600/30 rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        placeholder="태그를 입력 후 엔터"
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="px-3 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all duration-200"
                      >
                        추가
                      </button>
                    </div>
                  </div>
                </div>

                {/* 버튼 그룹 */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-105 backdrop-blur-sm"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={
                      loading || !formData.title.trim() || !formData.url.trim()
                    }
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-2xl font-medium hover:from-brand-600 hover:to-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 backdrop-blur-sm flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="spinner w-4 h-4"></div>
                        <span>수정 중...</span>
                      </>
                    ) : (
                      "수정"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
