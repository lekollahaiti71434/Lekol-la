import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB44LKYeYxkAfY8gFeSWiqc_if8smanS0k",
  authDomain: "lekol-la.firebaseapp.com",
  projectId: "lekol-la",
  storageBucket: "lekol-la.firebasestorage.app",
  messagingSenderId: "460888704859",
  appId: "1:460888704859:web:aaf5da7222d99c868afc7e"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
