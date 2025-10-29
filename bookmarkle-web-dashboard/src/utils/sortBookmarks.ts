import type { Bookmark, SortOption } from "../types";

export const sortBookmarks = (
  bookmarks: Bookmark[],
  sortOption: SortOption
): Bookmark[] => {
  const { field, direction } = sortOption;

  return [...bookmarks].sort((a, b) => {
    let comparison = 0;

    switch (field) {
      case "title":
        comparison = a.title.localeCompare(b.title, "ko");
        break;
      case "url":
        comparison = a.url.localeCompare(b.url);
        break;
      case "createdAt":
        comparison =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case "updatedAt":
        comparison =
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
      case "isFavorite":
        // 즐겨찾기가 우선, 그 다음에 제목으로 정렬
        if (a.isFavorite !== b.isFavorite) {
          comparison = a.isFavorite ? -1 : 1;
        } else {
          comparison = a.title.localeCompare(b.title, "ko");
        }
        break;
      case "order":
        // 사용자 정의 순서로 정렬 (order 값이 다르면 order로 정렬)
        if (a.order !== undefined && b.order !== undefined) {
          if (a.order !== b.order) {
            comparison = a.order - b.order;
          } else {
            // order가 같은 경우 생성일 기준으로 정렬 (최신순)
            comparison =
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
        } else {
          // order가 없는 경우 생성일 기준으로 정렬 (최신순)
          comparison =
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        break;
      default:
        comparison = 0;
    }

    return direction === "asc" ? comparison : -comparison;
  });
};
