import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Use development placeholders if environment variables are not available
const isDevelopment = import.meta.env.DEV;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || (isDevelopment ? "biobuddy-dev" : "");
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || (isDevelopment ? "AIzaSyDevelopmentPlaceholderKey123456789" : "");
const appId = import.meta.env.VITE_FIREBASE_APP_ID || (isDevelopment ? "1:123456789:web:placeholder123456789" : "");

const firebaseConfig = {
  apiKey,
  authDomain: `${projectId}.firebaseapp.com`,
  projectId,
  storageBucket: `${projectId}.firebasestorage.app`,
  appId,
};

let app: any = null;
let auth: any = null;

try {
  if (apiKey && projectId && appId) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  } else {
    console.warn("Firebase not initialized: Missing environment variables");
    // Create mock auth for development
    auth = {
      currentUser: null,
      onAuthStateChanged: () => () => {},
      signInWithPopup: () => Promise.reject(new Error("Firebase not configured")),
      signOut: () => Promise.resolve(),
    };
  }
} catch (error) {
  console.warn("Firebase initialization failed:", error);
  // Create mock auth for development
  auth = {
    currentUser: null,
    onAuthStateChanged: () => () => {},
    signInWithPopup: () => Promise.reject(new Error("Firebase not configured")),
    signOut: () => Promise.resolve(),
  };
}

export { auth };
export default app;
