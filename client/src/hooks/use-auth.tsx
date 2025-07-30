import { useState, useEffect } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { login as firebaseLogin, logout as firebaseLogout, handleRedirect } from "@/lib/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In development mode, auto-create demo user if Firebase is not configured
    if (import.meta.env.DEV && !import.meta.env.VITE_FIREBASE_API_KEY) {
      try {
        let demoUser = localStorage.getItem('demo_user');
        if (!demoUser) {
          const newDemoUser = {
            uid: 'demo-user-12345',
            email: 'demo@biobuddy.dev',
            displayName: 'Demo User',
            photoURL: 'https://ui-avatars.com/api/?name=Demo+User&background=0ea5e9&color=fff'
          };
          localStorage.setItem('demo_user', JSON.stringify(newDemoUser));
          demoUser = JSON.stringify(newDemoUser);
        }

        const parsedUser = JSON.parse(demoUser);
        setUser({
          uid: parsedUser.uid,
          email: parsedUser.email,
          displayName: parsedUser.displayName,
          photoURL: parsedUser.photoURL,
        } as User);
        setLoading(false);
        return;
      } catch (error) {
        console.error('Demo user creation failed:', error);
        setLoading(false);
        return;
      }
    }

    // Check for existing demo user
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

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await getOrCreateUser(firebaseUser);
          // Check if user is admin
          if (userData.email === 'admin@bioscriptor.com' || userData.tier === 'admin') {
            userData.isAdmin = true;
          }
          setUser(userData);
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
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