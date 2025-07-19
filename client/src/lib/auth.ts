import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";

const provider = new GoogleAuthProvider();
const auth = getAuth();

export async function login() {
  // In development mode, create a demo user if Firebase is not configured
  if (import.meta.env.DEV && !import.meta.env.VITE_FIREBASE_API_KEY) {
    const demoUser = {
      uid: 'demo-user-12345',
      email: 'demo@biobuddy.dev',
      displayName: 'Demo User',
      photoURL: 'https://ui-avatars.com/api/?name=Demo+User&background=0ea5e9&color=fff'
    };
    localStorage.setItem('demo_user', JSON.stringify(demoUser));
    window.location.reload();
    return { user: demoUser, token: 'demo-token' };
  }

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    const user = result.user;
    console.log('User signed in:', user);
    return { user, token };
  } catch (error) {
    console.error('Sign-in error:', error);
    // Handle specific errors
    if (error.code === 'auth/popup-blocked') {
      alert('Please allow popups for this site to sign in with Google.');
    } else if (error.code === 'auth/unauthorized-domain') {
      alert('This domain is not authorized for Google sign-in. Please contact support.');
    }
    throw error;
  }
}

export function logout() {
  // Clear demo user if it exists
  if (localStorage.getItem('demo_user')) {
    localStorage.removeItem('demo_user');
    window.location.reload();
    return Promise.resolve();
  }
  
  return signOut(auth);
}

export function handleRedirect() {
  // Not needed for popup authentication, but keeping for compatibility
  return Promise.resolve(null);
}
