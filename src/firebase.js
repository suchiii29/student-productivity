// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC19sFlIqqr-SciAwOV2P4qb6Rg6GncXsg",
  authDomain: "student-94fba.firebaseapp.com",
  projectId: "student-94fba",
  storageBucket: "student-94fba.appspot.com",
  messagingSenderId: "495358150854",
  appId: "1:495358150854:web:73a98a11c6913ac8f9efc7"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Export database as 'db' so imports match
export const db = getDatabase(app);

// Export auth
export const auth = getAuth(app);

