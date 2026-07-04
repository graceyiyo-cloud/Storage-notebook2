import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAqSxxH5LhsKSV2NPDzQFOSHn_rQNv588k",
  authDomain: "url-sorting.firebaseapp.com",
  projectId: "url-sorting",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  try {
    const snap = await getDocs(collection(db, "users", "ZVslfAb97Qe3CdlWstO89ATw19y1", "products"));
    console.log("Success! Users:", snap.size);
    snap.forEach(d => {
        console.log(d.id, d.data().name);
    });
  } catch (e) {
    console.log("Failed:", e.message);
  }
  process.exit(0);
}
test();
