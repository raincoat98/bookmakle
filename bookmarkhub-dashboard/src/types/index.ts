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
  collection: string;
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

export type Collection = "all" | "default" | "work" | "personal";
