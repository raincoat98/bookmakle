import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA-biD6_Gy0sGWoy2qmcB-sXuW5strHApc",
  authDomain: "bookmarkhub-5ea6c.firebaseapp.com",
  projectId: "bookmarkhub-5ea6c",
  storageBucket: "bookmarkhub-5ea6c.firebasestorage.app",
  messagingSenderId: "798364806000",
  appId: "1:798364806000:web:1234567890abcdef",
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Auth 및 Firestore 인스턴스
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
