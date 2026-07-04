import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = {
  apiKey: "AIzaSyAqSxxH5LhsKSV2NPDzQFOSHn_rQNv588k",
  authDomain: "url-sorting.firebaseapp.com",
  databaseURL: "https://url-sorting-default-rtdb.firebaseio.com",
  projectId: "url-sorting",
  storageBucket: "url-sorting.firebasestorage.app",
  messagingSenderId: "576779796443",
  appId: "1:576779796443:web:ff98b5b55049f7b7e0f1fe"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function scan() {
  const usersRef = collection(db, "users");
  const snapshot = await getDocs(usersRef);
  console.log(`Found ${snapshot.size} users.`);
  
  for (const userDoc of snapshot.docs) {
    const data = userDoc.data();
    console.log(`User: ${userDoc.id}`);
    console.log(`- Root products length: ${data.products?.length || 0}`);
    
    const subRef = collection(db, "users", userDoc.id, "products");
    const subSnap = await getDocs(subRef);
    console.log(`- Subcollection 'products' length: ${subSnap.size}`);
    
    // Maybe they saved to 'products' at the root?
  }
  process.exit(0);
}
scan();
