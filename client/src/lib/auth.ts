import { getAuth, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut } from "firebase/auth";

const provider = new GoogleAuthProvider();
const auth = getAuth();

export function login() {
  signInWithRedirect(auth, provider);
}

export function logout() {
  return signOut(auth);
}

export function handleRedirect() {
  return getRedirectResult(auth)
    .then((result) => {
      if (result) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;
        const user = result.user;
        console.log('User signed in:', user);
        return { user, token };
      }
      return null;
    })
    .catch((error) => {
      console.error('Sign-in error:', error);
      const errorCode = error.code;
      const errorMessage = error.message;
      const email = error.customData?.email;
      const credential = GoogleAuthProvider.credentialFromError(error);
      throw error;
    });
}
