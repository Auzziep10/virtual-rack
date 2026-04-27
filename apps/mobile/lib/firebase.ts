import { initializeApp, getApps, getApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCvf0LN7I44_wmtqqCJWM0glwOhck3tZy4",
  authDomain: "virtual-rack.firebaseapp.com",
  projectId: "virtual-rack",
  storageBucket: "virtual-rack.firebasestorage.app",
  messagingSenderId: "852766073677",
  appId: "1:852766073677:web:d8b20f385633a9e272cd04",
  measurementId: "G-5GS5EC9JV6"
};

// Initialize Firebase only if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Get references to Firebase services
export const storage = getStorage(app);
export const db = getFirestore(app);
