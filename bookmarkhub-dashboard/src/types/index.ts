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
  collection: string | null;
  order: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookmarkFormData {
  title: string;
  url: string;
  description: string;
  collection: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  icon: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionFormData {
  name: string;
  description?: string;
  icon: string;
}

// 기존 하드코딩된 컬렉션 타입은 호환성을 위해 유지
export type LegacyCollection = "all" | "default" | "work" | "personal";
