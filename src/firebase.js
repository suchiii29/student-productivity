import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC19sFlIqqr-SciAwOV2P4qb6Rg6GncXsg",
  authDomain: "student-94fba.firebaseapp.com",
  projectId: "student-94fba",
  storageBucket: "student-94fba.appspot.com",
  messagingSenderId: "495358150854",
  appId: "1:495358150854:web:73a98a11c6913ac8f9efc7",

  // ✅ REQUIRED FOR REALTIME DATABASE (you forgot this)
  databaseURL: "https://student-94fba-default-rtdb.firebaseio.com"
};

export const app = initializeApp(firebaseConfig);


export const db = getDatabase(app);

// ✅ Correct Firestore instance
export const firestore = getFirestore(app);

// ✅ Correct Auth instance
export const auth = getAuth(app);
