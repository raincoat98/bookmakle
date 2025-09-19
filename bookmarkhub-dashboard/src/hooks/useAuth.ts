import { createContext, useContext, useState, useEffect } from "react";
import type { User as FirebaseUser } from "firebase/auth";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  auth,
  googleProvider,
  db,
  loginWithGoogle,
  loginWithEmail as fbLoginWithEmail,
  signupWithEmail,
  logout as fbLogout,
} from "../firebase";
import { AuthCtx } from "../contexts/AuthContext";
import type { User, FirestoreUser } from "../types";

export const useAuth = () => {
  const authState = useContext(AuthCtx);

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

  // Convert Firebase User to our User type
  const user: User | null = authState.user
    ? {
        uid: authState.user.uid,
        displayName: authState.user.displayName,
        email: authState.user.email,
        photoURL: authState.user.photoURL,
        emailVerified: authState.user.emailVerified,
      }
    : null;

  return {
    user,
    loading: authState.loading,
    login,
    loginWithEmail: loginWithEmailHandler,
    signup,
    logout,
  };
};
