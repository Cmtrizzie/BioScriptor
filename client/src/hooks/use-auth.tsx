import { useState, useEffect } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { login as firebaseLogin, logout as firebaseLogout, handleRedirect } from "@/lib/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for demo user first (development mode)
    const demoUser = localStorage.getItem('demo_user');
    if (demoUser && import.meta.env.DEV) {
      const parsedUser = JSON.parse(demoUser);
      setUser({
        uid: parsedUser.uid,
        email: parsedUser.email,
        displayName: parsedUser.displayName,
        photoURL: parsedUser.photoURL,
      } as User);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      await firebaseLogin();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = async () => {
    try {
      // Clear demo user if it exists
      if (localStorage.getItem('demo_user')) {
        localStorage.removeItem('demo_user');
        window.location.reload();
        return;
      }
      
      await firebaseLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    user,
    loading,
    login,
    logout,
    handleRedirect,
  };
}
