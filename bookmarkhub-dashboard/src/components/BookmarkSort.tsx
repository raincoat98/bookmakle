import React from "react";
import { ChevronDown, ArrowUpDown } from "lucide-react";
import type { SortOption } from "../types";

interface BookmarkSortProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const sortOptions: SortOption[] = [
  { field: "order", direction: "asc", label: "사용자 순서" },
  { field: "title", direction: "asc", label: "제목 (A-Z)" },
  { field: "title", direction: "desc", label: "제목 (Z-A)" },
  { field: "url", direction: "asc", label: "URL (A-Z)" },
  { field: "url", direction: "desc", label: "URL (Z-A)" },
  { field: "createdAt", direction: "desc", label: "최신순" },
  { field: "createdAt", direction: "asc", label: "오래된순" },
  { field: "updatedAt", direction: "desc", label: "최근 수정순" },
  { field: "updatedAt", direction: "asc", label: "오래된 수정순" },
  { field: "isFavorite", direction: "desc", label: "즐겨찾기 우선" },
];

export const BookmarkSort: React.FC<BookmarkSortProps> = ({
  currentSort,
  onSortChange,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSortChange = (option: SortOption) => {
    onSortChange(option);
    setIsOpen(false);
  };

  const currentLabel =
    sortOptions.find(
      (option) =>
        option.field === currentSort.field &&
        option.direction === currentSort.direction
    )?.label || "정렬";

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        <ArrowUpDown className="w-4 h-4" />
        <span>{currentLabel}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          {/* 백드롭 */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* 드롭다운 메뉴 */}
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-20">
            <div className="py-1">
              {sortOptions.map((option) => (
                <button
                  key={`${option.field}-${option.direction}`}
                  onClick={() => handleSortChange(option)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    currentSort.field === option.field &&
                    currentSort.direction === option.direction
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
