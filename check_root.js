import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAqSxxH5LhsKSV2NPDzQFOSHn_rQNv588k",
  authDomain: "url-sorting.firebaseapp.com",
  projectId: "url-sorting",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function test() {
  try {
    // We can't easily sign in as the user since it's a Google sign in.
    // Let's just output this info... wait, how did the app read it?
    // The app reads it because the user is logged in.
  } catch (e) {
  }
}
