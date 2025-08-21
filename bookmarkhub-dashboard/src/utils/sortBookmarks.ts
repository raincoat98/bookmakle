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
        // order가 0이 아닌 경우에만 order로 정렬, 그렇지 않으면 생성일 기준
        if (
          a.order !== undefined &&
          b.order !== undefined &&
          a.order !== 0 &&
          b.order !== 0
        ) {
          comparison = a.order - b.order;
        } else {
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
