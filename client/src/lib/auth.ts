import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";

const provider = new GoogleAuthProvider();
const auth = getAuth();

export async function login() {
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
  return signOut(auth);
}

export function handleRedirect() {
  // Not needed for popup authentication, but keeping for compatibility
  return Promise.resolve(null);
}
