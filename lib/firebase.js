import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAfsR917SEiNM0dYwfCTCSQRQQuUyKPDNA",
  authDomain: "ascendant-cache-480105-s7.firebaseapp.com",
  projectId: "ascendant-cache-480105-s7",
  storageBucket: "ascendant-cache-480105-s7.firebasestorage.app",
  messagingSenderId: "778400916118",
  appId: "1:778400916118:web:4e6fe99caf69e98d3a98b7",
};

// Initialize Firebase (Server-side friendly)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };
