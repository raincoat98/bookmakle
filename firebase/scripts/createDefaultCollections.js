import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// Firebase 설정
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 기본 컬렉션 데이터
const defaultCollections = [
  {
    name: "업무",
    icon: "💼",
    description: "업무 관련 북마크",
  },
  {
    name: "개인",
    icon: "🏠",
    description: "개인 관련 북마크",
  },
  {
    name: "학습",
    icon: "📚",
    description: "학습 관련 북마크",
  },
  {
    name: "즐겨찾기",
    icon: "⭐",
    description: "자주 사용하는 북마크",
  },
  {
    name: "개발",
    icon: "💻",
    description: "개발 관련 북마크",
  },
  {
    name: "디자인",
    icon: "🎨",
    description: "디자인 관련 북마크",
  },
];

// 기본 컬렉션 생성 함수
async function createDefaultCollections(userId) {
  try {
    console.log("기본 컬렉션 생성 시작...");

    for (const collectionData of defaultCollections) {
      const docRef = await addDoc(collection(db, "collections"), {
        name: collectionData.name,
        icon: collectionData.icon,
        description: collectionData.description,
        userId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log(
        `컬렉션 생성 완료: ${collectionData.name} (ID: ${docRef.id})`
      );
    }

    console.log("모든 기본 컬렉션 생성 완료!");
  } catch (error) {
    console.error("컬렉션 생성 중 오류:", error);
    throw error;
  }
}

// 전역 함수로 노출 (브라우저에서 호출 가능)
window.createDefaultCollections = createDefaultCollections;

console.log("기본 컬렉션 생성 스크립트 로드 완료");
console.log("사용법: createDefaultCollections('사용자ID')");
