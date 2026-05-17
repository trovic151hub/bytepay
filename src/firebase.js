import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBuvswQZQuVSr3q5gRtFtax07kj5SDrHuU",
  authDomain: "testing-firebase-d7f88.firebaseapp.com",
  projectId: "testing-firebase-d7f88",
  storageBucket: "testing-firebase-d7f88.appspot.com",
  messagingSenderId: "339099724691",
  appId: "1:339099724691:web:83ead43e1d41d2e131d666",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
