import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadString } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDZrfhFTCc0rdLrFoFQ_Pd29wmW0uz4If4",
  authDomain: "project-d8904b8a-1715-4363-9d7.firebaseapp.com",
  projectId: "project-d8904b8a-1715-4363-9d7",
  storageBucket: "project-d8904b8a-1715-4363-9d7.firebasestorage.app",
  messagingSenderId: "969183701633",
  appId: "1:969183701633:web:a71255a8ca047e7aae7b80",
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const storageRef = ref(storage, 'test.txt');

uploadString(storageRef, 'hello world').then((snapshot) => {
  console.log('Uploaded a raw string!');
}).catch((error) => {
  console.error('Upload failed:', error);
});
