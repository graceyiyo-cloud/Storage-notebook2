import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, collectionGroup } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAqSxxH5LhsKSV2NPDzQFOSHn_rQNv588k",
  authDomain: "url-sorting.firebaseapp.com",
  projectId: "url-sorting",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  try {
    const snap = await getDocs(collectionGroup(db, "products"));
    console.log("Products count:", snap.size);
    snap.forEach(d => {
        console.log(d.id, d.data().name, d.ref.path);
    });
  } catch (e) {
    console.log("Failed products:", e.message);
  }

  try {
    const items = await getDocs(collectionGroup(db, "items"));
    console.log("Items count:", items.size);
    items.forEach(d => {
        console.log(d.id, d.data().name, d.ref.path);
    });
  } catch(e) {}
  
  process.exit(0);
}
test();
