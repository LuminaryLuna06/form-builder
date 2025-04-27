// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCTWIsLkwNI6NuR-fTumQOZkqoxEhHligE",
  authDomain: "form-builder-ad9aa.firebaseapp.com",
  projectId: "form-builder-ad9aa",
  storageBucket: "form-builder-ad9aa.firebasestorage.app",
  messagingSenderId: "488989330655",
  appId: "1:488989330655:web:adaba4703ce32a24212d6a",
  measurementId: "G-HTLB43YTWK",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
