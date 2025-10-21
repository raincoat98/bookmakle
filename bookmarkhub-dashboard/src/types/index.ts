// Firebase User는 firebase/auth에서 import하여 사용
// 이 인터페이스는 더 이상 사용하지 않음 (호환성을 위해 유지)
export interface AppUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  provider?: string;
}

// Firestore에 저장되는 사용자 데이터 타입
export interface FirestoreUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt: any; // serverTimestamp
  updatedAt: any; // serverTimestamp
  provider: string;
  isActive?: boolean; // 사용자 활성화 상태
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
  isFavorite: boolean; // 즐겨찾기 필드 추가
}

export interface BookmarkFormData {
  title: string;
  url: string;
  description?: string;
  favicon?: string;
  collection: string;
  tags: string[]; // 태그 필드 추가
  isFavorite: boolean; // 즐겨찾기 필드 추가
  order?: number; // 순서 필드 추가
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
  isPinned?: boolean; // 핀 기능 추가
}

export interface CollectionFormData {
  name: string;
  description?: string;
  icon: string;
  parentId: string | null; // 하위 컬렉션 지원
  isPinned?: boolean; // 핀 기능 추가
}

// 기존 하드코딩된 컬렉션 타입은 호환성을 위해 유지
export type LegacyCollection = "all" | "default" | "work" | "personal";

// 정렬 관련 타입 추가
export type SortField =
  | "title"
  | "url"
  | "createdAt"
  | "updatedAt"
  | "isFavorite"
  | "order";
export type SortDirection = "asc" | "desc";

export interface SortOption {
  field: SortField;
  direction: SortDirection;
  label: string;
}

// 관리자 관련 타입
export interface AdminUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  createdAt: Date;
  bookmarkCount: number;
  collectionCount: number;
  lastLoginAt?: Date;
  isActive: boolean; // 사용자 활성화 상태
}
