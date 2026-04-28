import { initializeApp, getApps, getApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

// These are the credentials for the B2B Tech Pack Creator database.
// This is completely isolated from the primary WOVN consumer database.
const techPackFirebaseConfig = {
  apiKey: "AIzaSyDbBphUQ9uTG9A9Np5-9A5770Kk3EHYP40",
  authDomain: "tech-pack-creator-6c930.firebaseapp.com",
  projectId: "tech-pack-creator-6c930",
  storageBucket: "tech-pack-creator-6c930.firebasestorage.app",
  messagingSenderId: "973526414669",
  appId: "1:973526414669:web:b25ad855525bed68603304"
};

// Initialize the secondary Firebase app with a specific name "techPackApp"
// to avoid conflicting with the default Firebase app.
export const techPackApp = !getApps().some(app => app.name === 'techPackApp') 
  ? initializeApp(techPackFirebaseConfig, 'techPackApp') 
  : getApp('techPackApp');

import { getAuth } from "firebase/auth";

// Get references to Firebase services for the Tech Pack database
export const techPackAuth = getAuth(techPackApp);
export const techPackStorage = getStorage(techPackApp);
export const techPackDb = getFirestore(techPackApp);
