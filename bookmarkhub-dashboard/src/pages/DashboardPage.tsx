import React, { useState } from "react";
import { DashboardOverview } from "../components/DashboardWidgets";
import { useAuth } from "../hooks/useAuth";
import { useBookmarks } from "../hooks/useBookmarks";
import { useCollections } from "../hooks/useCollections";
import type { Bookmark, BookmarkFormData } from "../types";
import toast from "react-hot-toast";
import { AddBookmarkModal } from "../components/AddBookmarkModal";
import { EditBookmarkModal } from "../components/EditBookmarkModal";
import { DeleteBookmarkModal } from "../components/DeleteBookmarkModal";
import { AddCollectionModal } from "../components/AddCollectionModal";
import { Drawer } from "../components/Drawer";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const {
    bookmarks,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    toggleFavorite,
    reorderBookmarks,
  } = useBookmarks(user?.uid || "", "all");
  const { collections, addCollection } = useCollections(user?.uid || "");

  // 모달 상태
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [deleteBookmarkModal, setDeleteBookmarkModal] = useState<{
    isOpen: boolean;
    bookmark: Bookmark | null;
  }>({ isOpen: false, bookmark: null });
  const [isDeletingBookmark, setIsDeletingBookmark] = useState(false);
  const [isAddCollectionModalOpen, setIsAddCollectionModalOpen] =
    useState(false);

  // 북마크 추가
  const handleAddBookmark = async (data: BookmarkFormData) => {
    try {
      await addBookmark({ ...data, isFavorite: data.isFavorite || false });
      setIsAddModalOpen(false);
      toast.success("북마크가 추가되었습니다.");
    } catch {
      toast.error("북마크 추가 중 오류가 발생했습니다.");
    }
  };

  // 북마크 수정
  const handleUpdateBookmark = async (id: string, data: BookmarkFormData) => {
    try {
      await updateBookmark(id, {
        ...data,
        isFavorite: data.isFavorite || false,
      });
      setEditingBookmark(null);
      toast.success("북마크가 수정되었습니다.");
    } catch {
      toast.error("북마크 수정 중 오류가 발생했습니다.");
    }
  };

  // 북마크 삭제
  const handleDeleteBookmark = async (id: string) => {
    setIsDeletingBookmark(true);
    try {
      await deleteBookmark(id);
      setDeleteBookmarkModal({ isOpen: false, bookmark: null });
      toast.success("북마크가 삭제되었습니다.");
    } catch {
      toast.error("북마크 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeletingBookmark(false);
    }
  };

  // 즐겨찾기 토글
  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    try {
      await toggleFavorite(id, isFavorite);
      toast.success(
        isFavorite
          ? "즐겨찾기에 추가되었습니다."
          : "즐겨찾기에서 제거되었습니다."
      );
    } catch {
      toast.error("즐겨찾기 상태 변경 중 오류가 발생했습니다.");
    }
  };

  // 북마크 편집 모달 열기
  const handleEdit = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
  };

  // 북마크 삭제 모달 열기
  const handleDelete = (bookmark: Bookmark) => {
    setDeleteBookmarkModal({ isOpen: true, bookmark });
  };

  // 컬렉션 추가
  const handleAddCollection = async (
    name: string,
    description: string,
    icon: string,
    parentId?: string | null
  ) => {
    try {
      await addCollection({
        name,
        description,
        icon,
        parentId: parentId ?? null,
      });
      setIsAddCollectionModalOpen(false);
      toast.success("컬렉션이 추가되었습니다.");
    } catch {
      toast.error("컬렉션 추가 중 오류가 발생했습니다.");
    }
  };

  // 북마크 순서 변경
  const handleReorderBookmarks = async (newFavoriteBookmarks: Bookmark[]) => {
    console.log(
      "Dashboard handleReorderBookmarks called with:",
      newFavoriteBookmarks.length,
      "favorite bookmarks"
    ); // 디버깅 로그

    try {
      // 전체 북마크 배열에서 즐겨찾기 북마크들의 순서를 업데이트
      const updatedBookmarks = [...bookmarks];

      // 즐겨찾기 북마크들을 맨 앞으로 이동하고 순서 설정
      newFavoriteBookmarks.forEach((favoriteBookmark, index) => {
        const bookmarkIndex = updatedBookmarks.findIndex(
          (b) => b.id === favoriteBookmark.id
        );
        if (bookmarkIndex !== -1) {
          // 즐겨찾기 북마크를 맨 앞으로 이동 (order: 0부터 시작)
          updatedBookmarks[bookmarkIndex] = {
            ...updatedBookmarks[bookmarkIndex],
            order: index,
          };
        }
      });

      // 즐겨찾기가 아닌 북마크들의 order를 뒤로 설정
      const nonFavoriteBookmarks = updatedBookmarks.filter(
        (b) => !b.isFavorite
      );
      nonFavoriteBookmarks.forEach((bookmark, index) => {
        const bookmarkIndex = updatedBookmarks.findIndex(
          (b) => b.id === bookmark.id
        );
        if (bookmarkIndex !== -1) {
          updatedBookmarks[bookmarkIndex] = {
            ...updatedBookmarks[bookmarkIndex],
            order: newFavoriteBookmarks.length + index,
          };
        }
      });

      console.log(
        "Updated bookmarks:",
        updatedBookmarks.map((b) => ({
          id: b.id,
          title: b.title,
          order: b.order,
          isFavorite: b.isFavorite,
        }))
      ); // 디버깅 로그

      // Firestore에 순서 업데이트
      await reorderBookmarks(updatedBookmarks);

      console.log("Dashboard bookmarks reordered successfully"); // 디버깅 로그
      toast.success("북마크 순서가 변경되었습니다.");
    } catch (error) {
      console.error("Error reordering bookmarks:", error);
      toast.error("북마크 순서 변경 중 오류가 발생했습니다.");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            로그인이 필요합니다
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            북마크를 관리하려면 먼저 로그인해주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Drawer>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="p-4 lg:p-6">
          <DashboardOverview
            bookmarks={bookmarks}
            collections={collections}
            onEdit={handleEdit}
            onDelete={(id: string) => {
              const bookmark = bookmarks.find((b) => b.id === id);
              if (bookmark) {
                handleDelete(bookmark);
              }
            }}
            onAddBookmark={() => setIsAddModalOpen(true)}
            onAddCollection={() => setIsAddCollectionModalOpen(true)}
            onToggleFavorite={handleToggleFavorite}
            onReorder={handleReorderBookmarks}
            userId={user?.uid || ""}
          />
        </div>
        <AddBookmarkModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddBookmark}
          collections={collections}
        />
        <EditBookmarkModal
          isOpen={!!editingBookmark}
          onClose={() => setEditingBookmark(null)}
          onUpdate={handleUpdateBookmark}
          bookmark={editingBookmark}
          collections={collections}
        />
        <DeleteBookmarkModal
          isOpen={deleteBookmarkModal.isOpen}
          onClose={() =>
            setDeleteBookmarkModal({ isOpen: false, bookmark: null })
          }
          onDelete={() =>
            deleteBookmarkModal.bookmark &&
            handleDeleteBookmark(deleteBookmarkModal.bookmark.id)
          }
          bookmark={deleteBookmarkModal.bookmark}
          isDeleting={isDeletingBookmark}
        />
        <AddCollectionModal
          isOpen={isAddCollectionModalOpen}
          onClose={() => setIsAddCollectionModalOpen(false)}
          onAdd={handleAddCollection}
        />
      </div>
    </Drawer>
  );
};
