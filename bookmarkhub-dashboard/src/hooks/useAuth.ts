import { useContext, useState, useEffect } from "react";
import type { User as FirebaseUser } from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import {
  db,
  loginWithGoogle,
  loginWithEmail as fbLoginWithEmail,
  signupWithEmail,
  logout as fbLogout,
} from "../firebase";
import { AuthCtx } from "../contexts/AuthContext";
import type { FirestoreUser } from "../types";

export const useAuth = () => {
  const authState = useContext(AuthCtx);
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [isActiveLoading, setIsActiveLoading] = useState(false);

  // 사용자 활성화 상태 확인
  const checkUserStatus = async (uid: string) => {
    try {
      setIsActiveLoading(true);
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const active = userData.isActive !== false; // 기본값은 true
        setIsActive(active);
        return active;
      }
      return true; // 문서가 없으면 기본적으로 활성화
    } catch (error) {
      console.error("사용자 상태 확인 실패:", error);
      return true; // 에러 시 기본적으로 활성화
    } finally {
      setIsActiveLoading(false);
    }
  };

  // 사용자 변경 시 상태 확인
  useEffect(() => {
    if (authState.user) {
      checkUserStatus(authState.user.uid);
    } else {
      setIsActive(null);
    }
  }, [authState.user]);

  // Firestore에 사용자 데이터 저장
  const saveUserToFirestore = async (firebaseUser: FirebaseUser) => {
    try {
      const userData: FirestoreUser = {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        provider: firebaseUser.providerData[0]?.providerId || "email",
      };

      await setDoc(doc(db, "users", firebaseUser.uid), userData, {
        merge: true,
      });
      console.log(
        "사용자 데이터가 Firestore에 저장되었습니다:",
        firebaseUser.uid
      );
    } catch (error) {
      console.error("Firestore에 사용자 데이터 저장 실패:", error);
    }
  };

  const login = async () => {
    try {
      const result = await loginWithGoogle();
      // Google 로그인 시에도 사용자 데이터 저장
      if (result.user) {
        await saveUserToFirestore(result.user);
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const loginWithEmailHandler = async (email: string, password: string) => {
    try {
      const result = await fbLoginWithEmail(email, password);
      // 이메일 로그인 시에도 사용자 데이터 업데이트
      if (result.user) {
        await saveUserToFirestore(result.user);
      }
    } catch (error) {
      console.error("Email login error:", error);
      throw error;
    }
  };

  const signup = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    try {
      const userCredential = await signupWithEmail(
        email,
        password,
        displayName
      );

      // Firestore에 사용자 데이터 저장
      if (userCredential.user) {
        await saveUserToFirestore(userCredential.user);
      }
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fbLogout();
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  return {
    user: authState.user, // Firebase User 그대로 반환
    loading: authState.loading,
    isActive, // 사용자 활성화 상태
    isActiveLoading, // 활성화 상태 로딩
    checkUserStatus, // 상태 확인 함수
    login,
    loginWithEmail: loginWithEmailHandler,
    signup,
    logout,
  };
};
