import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAqSxxH5LhsKSV2NPDzQFOSHn_rQNv588k",
  authDomain: "url-sorting.firebaseapp.com",
  databaseURL: "https://url-sorting-default-rtdb.firebaseio.com",
  projectId: "url-sorting",
  storageBucket: "url-sorting.firebasestorage.app",
  messagingSenderId: "576779796443",
  appId: "1:576779796443:web:ff98b5b55049f7b7e0f1fe",
  measurementId: "G-0L44SJTSLQ"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize default Firestore
export const db = getFirestore(app);

export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const signInWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Login failed:", error);
    alert(`登入失敗，請嘗試在新分頁中開啟應用程式。\n錯誤訊息：${error instanceof Error ? error.message : String(error)}`);
  }
};
export const logOut = () => signOut(auth);
