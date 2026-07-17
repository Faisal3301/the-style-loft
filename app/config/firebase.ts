import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCS6jREA8_J9-sL8DVQFECCggkiec73xXc",
  authDomain: "stitch-style-app.firebaseapp.com",
  projectId: "stitch-style-app",
  storageBucket: "stitch-style-app.firebasestorage.app",
  messagingSenderId: "85285253957",
  appId: "1:85285253957:web:954d5f6a37e3353b1b442c"
};

// Next.js client/server side crash se bachne ke liye check
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };