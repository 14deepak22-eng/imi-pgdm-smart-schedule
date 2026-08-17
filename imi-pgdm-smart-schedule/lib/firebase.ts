import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD7Vge0DIYJTN2FpWBH4IhdHWA-AI8F6Bw",
  authDomain: "imi-pgdm-review.firebaseapp.com",
  projectId: "imi-pgdm-review",
  storageBucket: "imi-pgdm-review.firebasestorage.app",
  messagingSenderId: "872703183462",
  appId: "1:872703183462:web:e2d10cc8ba0d6903bc3ba7",
  measurementId: "G-W9DNPVLYC7",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
