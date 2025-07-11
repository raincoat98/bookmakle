import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

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

export async function getUserDefaultPage(uid: string): Promise<string> {
  const db = getFirestore();
  const settingsRef = doc(db, "users", uid, "settings", "main");
  const snap = await getDoc(settingsRef);
  if (snap.exists() && snap.data().defaultPage) {
    return snap.data().defaultPage;
  }
  return "dashboard";
}

export async function setUserDefaultPage(
  uid: string,
  value: string
): Promise<void> {
  const db = getFirestore();
  const settingsRef = doc(db, "users", uid, "settings", "main");
  await setDoc(settingsRef, { defaultPage: value }, { merge: true });
}

export default app;
