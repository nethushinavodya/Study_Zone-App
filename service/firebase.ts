import { initializeApp } from "firebase/app";
import { Platform } from "react-native";

import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDJ19daty780_z7OFKNETHAaWwvYOPakMY",
  authDomain: "study-zone-e45e2.firebaseapp.com",
  projectId: "study-zone-e45e2",
  storageBucket: "study-zone-e45e2.firebasestorage.app",
  messagingSenderId: "348651320035",
  appId: "1:348651320035:web:613c020e9dbca918170bd6",
  measurementId: "G-RE61H087SF",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

if (Platform.OS === "web") {
  setPersistence(auth, browserLocalPersistence).catch(() => {
    // Ignore; auth still works without persistence.
  });
}

export const db = getFirestore(app);
export const storage = getStorage(app);
