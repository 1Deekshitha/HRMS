// src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 🔽 Replace this config with the one from your Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCccFlbi_kk6T4SymnoqLlfw8J-LL1N6VU",
  authDomain: "hrms-ai-hackathon.firebaseapp.com",
  projectId: "hrms-ai-hackathon",
  storageBucket: "hrms-ai-hackathon.firebasestorage.app",
  messagingSenderId: "724571766801",
  appId: "1:724571766801:web:b2aff0f4d80de38c4bb1b0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
