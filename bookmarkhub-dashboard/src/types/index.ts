export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  description?: string;
  favicon?: string;
  collection: string | null;
  order: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[]; // 태그 필드 추가
}

export interface BookmarkFormData {
  title: string;
  url: string;
  description: string;
  favicon?: string;
  collection: string;
  tags: string[]; // 태그 필드 추가
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  icon: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  parentId: string | null; // 하위 컬렉션 지원
}

export interface CollectionFormData {
  name: string;
  description?: string;
  icon: string;
  parentId: string | null; // 하위 컬렉션 지원
}

// 기존 하드코딩된 컬렉션 타입은 호환성을 위해 유지
export type LegacyCollection = "all" | "default" | "work" | "personal";
