import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { firebaseConfig } from "./config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// 부모(= offscreen 문서) 오리진
const PARENT_ORIGIN = document.location.ancestorOrigins?.[0] || "*";

function send(result) {
  // 부모(offscreen)로 결과 전달 → background → popup
  console.log("Sending result to parent:", result);
  window.parent.postMessage(JSON.stringify(result), PARENT_ORIGIN);
}

window.addEventListener("message", async (ev) => {
  console.log("Received message:", ev.data);
  if (ev.data?.initAuth) {
    console.log("Starting Firebase Auth...");
    try {
      const userCredential = await signInWithPopup(auth, provider);
      console.log("Auth successful:", userCredential.user);
      send({
        user: toSafeUser(userCredential.user),
        userCredential: { user: toSafeUser(userCredential.user) },
      });
    } catch (e) {
      console.error("Auth error:", e);
      send({
        name: e.name || "FirebaseError",
        code: e.code,
        message: e.message,
      });
    }
  }
});

// 페이지 로드 완료 시 알림
console.log("SignIn popup page loaded, ready to receive messages");

function toSafeUser(user) {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}
