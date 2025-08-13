import { useState, useEffect } from "react";
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
import { auth, googleProvider, db } from "../firebase";
import type { User, FirestoreUser } from "../types";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          const userData: User = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
          };
          setUser(userData);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

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
      const result = await signInWithPopup(auth, googleProvider);
      // Google 로그인 시에도 사용자 데이터 저장
      if (result.user) {
        await saveUserToFirestore(result.user);
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
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
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // 사용자 프로필 업데이트
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: displayName,
        });

        // Firestore에 사용자 데이터 저장
        await saveUserToFirestore(userCredential.user);
      }
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  return {
    user,
    loading,
    login,
    loginWithEmail,
    signup,
    logout,
  };
};
