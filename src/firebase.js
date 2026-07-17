import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSy...............................",
  authDomain: "lekol-la.firebaseapp.com",
  projectId: "lekol-la",
  storageBucket: "lekol-la.appspot.com",
  messagingSenderId: "..............",
  appId: "1:..............:web:................"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
