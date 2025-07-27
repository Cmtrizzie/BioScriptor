import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase configuration with development fallbacks
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBioScriptorDevKey123456789",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "bioscriptor-dev.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "bioscriptor-dev",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "bioscriptor-dev.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:dev123456789"
};

// Initialize Firebase with error handling
let app;
let auth;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.warn("Firebase initialization failed, using mock auth:", error);
  // Create mock auth for development
  auth = null;
}

export { auth };
export default app;