// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCqiE4ygZVswlNzitykD96AxIn3fITrPD8",
  authDomain: "joia-hub-controller.firebaseapp.com",
  projectId: "joia-hub-controller",
  storageBucket: "joia-hub-controller.firebasestorage.app",
  messagingSenderId: "479667035284",
  appId: "1:479667035284:web:e8980021fff613b5d0e881"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);