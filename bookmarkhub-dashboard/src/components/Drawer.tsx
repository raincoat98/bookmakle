import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useDrawer } from "../contexts/DrawerContext";
import { Home, BookOpen, Settings, X } from "lucide-react";
import { CollectionList } from "./CollectionList";
import type { Collection } from "../types";

interface DrawerProps {
  children: React.ReactNode;
  // CollectionList 관련 props 추가
  collections?: Collection[];
  collectionsLoading?: boolean;
  selectedCollection?: string;
  onCollectionChange?: (collectionId: string) => void;
  onDeleteCollectionRequest?: (
    collectionId: string,
    collectionName: string
  ) => void;
  onEditCollection?: (collection: Collection) => void;
  onOpenAddCollectionModal?: () => void;
  onOpenAddSubCollectionModal?: (parentId: string) => void;
}

export const Drawer: React.FC<DrawerProps> = ({
  children,
  collections = [],
  collectionsLoading = false,
  selectedCollection = "all",
  onCollectionChange = () => {},
  onDeleteCollectionRequest = () => {},
  onEditCollection = () => {},
  onOpenAddCollectionModal = () => {},
  onOpenAddSubCollectionModal = () => {},
}) => {
  const { isDrawerOpen, setIsDrawerOpen } = useDrawer();
  const location = useLocation();

  const navigation = [
    {
      name: "대시보드",
      href: "/",
      icon: Home,
      current: location.pathname === "/",
    },
    {
      name: "북마크",
      href: "/bookmarks",
      icon: BookOpen,
      current: location.pathname === "/bookmarks",
    },
    {
      name: "설정",
      href: "/settings",
      icon: Settings,
      current: location.pathname === "/settings",
    },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* 모바일 오버레이 */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 lg:w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-r border-white/30 dark:border-gray-700/30 shadow-glass">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 lg:p-6 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center space-x-2 lg:space-x-3">
              <div className="w-7 h-7 lg:w-8 lg:h-8 bg-gradient-to-r from-brand-500 to-accent-500 rounded-xl flex items-center justify-center shadow-soft">
                <BookOpen className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
              </div>
              <h1 className="text-lg lg:text-xl font-bold gradient-text">
                북마크 허브
              </h1>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-xl transition-all duration-200 hover:scale-110 hover:bg-white/50 dark:hover:bg-gray-700/50 backdrop-blur-sm lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 네비게이션 */}
          <nav className="p-3 lg:p-4 space-y-1 lg:space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsDrawerOpen(false)}
                  className={`group flex items-center space-x-2 lg:space-x-3 px-3 py-2 lg:px-4 lg:py-3 rounded-xl lg:rounded-2xl text-sm font-medium transition-all duration-200 hover:scale-105 ${
                    item.current
                      ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-soft"
                      : "text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50 backdrop-blur-sm"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 lg:w-5 lg:h-5 ${
                      item.current
                        ? "text-white"
                        : "text-gray-400 group-hover:text-brand-500 dark:group-hover:text-brand-400"
                    }`}
                  />
                  <span className="text-sm lg:text-base">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* CollectionList - 북마크 페이지에서만 표시 */}
          {location.pathname === "/bookmarks" && (
            <div className="flex-1 overflow-hidden">
              <CollectionList
                collections={collections}
                loading={collectionsLoading}
                selectedCollection={selectedCollection}
                onCollectionChange={onCollectionChange}
                onDeleteCollectionRequest={onDeleteCollectionRequest}
                onEditCollection={onEditCollection}
                onOpenAddCollectionModal={onOpenAddCollectionModal}
                onOpenAddSubCollectionModal={onOpenAddSubCollectionModal}
              />
            </div>
          )}

          {/* 푸터 */}
          <div className="p-3 lg:p-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              © 2024 북마크 허브
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 모바일 헤더 */}
        <div className="lg:hidden p-3 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-xl transition-all duration-200 hover:scale-110 hover:bg-white/50 dark:hover:bg-gray-700/50 backdrop-blur-sm"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* 콘텐츠 영역 */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
};
