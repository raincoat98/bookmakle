import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Briefcase, List } from "lucide-react";
import { CollectionList } from "./CollectionList";
import type { Collection } from "../types";

interface DrawerProps {
  isOpen: boolean;
  isClosing: boolean;
  onClose: () => void;
  collections: Collection[];
  selectedCollection: string;
  onCollectionChange: (id: string) => void;
  onAddCollection: (
    name: string,
    description: string,
    icon: string,
    parentId?: string | null
  ) => Promise<void>;
  onDeleteCollectionRequest: (id: string, name: string) => void;
  onEditCollection: (collection: Collection) => void;
  defaultPage?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  isClosing,
  onClose,
  collections,
  selectedCollection,
  onCollectionChange,
  onAddCollection,
  onDeleteCollectionRequest,
  onEditCollection,
  defaultPage = "dashboard",
}) => {
  const location = useLocation();

  if (!isOpen && !isClosing) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* 큰 배경 - 클릭 시 사이드바 닫기 */}
      <div
        className={`absolute inset-0 bg-black bg-opacity-30 ${
          isClosing ? "animate-fade-out-simple" : "animate-fade-in-simple"
        }`}
        onClick={onClose}
      />

      {/* 사이드바 */}
      <div
        className={`absolute left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transform transition-all duration-300 ease-in-out shadow-xl ${
          isClosing
            ? "translate-x-[-100%] opacity-0"
            : "translate-x-0 opacity-100 animate-slide-in-left"
        }`}
      >
        <div className="flex sm:hidden flex-col gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
          <Link
            to="/dashboard"
            className={`px-3 py-2 rounded font-medium text-sm flex items-center gap-2 transition-colors ${
              location.pathname === "/dashboard" ||
              (location.pathname === "/" && defaultPage === "dashboard")
                ? "bg-brand-600 text-white shadow"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-brand-100 dark:hover:bg-brand-900"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            대시보드
          </Link>
          <Link
            to="/bookmarks"
            className={`px-3 py-2 rounded font-medium text-sm flex items-center gap-2 transition-colors ${
              location.pathname === "/bookmarks" ||
              (location.pathname === "/" && defaultPage === "bookmarks")
                ? "bg-brand-600 text-white shadow"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-brand-100 dark:hover:bg-brand-900"
            }`}
          >
            <List className="w-4 h-4" />
            북마크
          </Link>
        </div>
        <CollectionList
          collections={collections}
          loading={false}
          selectedCollection={selectedCollection}
          onCollectionChange={(id) => {
            onCollectionChange(id);
            onClose();
          }}
          onAddCollection={onAddCollection}
          onDeleteCollectionRequest={onDeleteCollectionRequest}
          onEditCollection={onEditCollection}
        />
      </div>
    </div>
  );
};
