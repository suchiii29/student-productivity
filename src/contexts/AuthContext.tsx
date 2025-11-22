// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, getAuth, User, signOut as firebaseSignOut } from "firebase/auth";
import { app } from "@/firebase";

interface AuthContextType {
  user: User | null;
  uid: string | null;
  isLoggedIn: boolean;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  uid: null,
  isLoggedIn: false,
  loading: true,
  logout: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const auth = getAuth(app);
  const [user, setUser] = useState<User | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setUid(currentUser?.uid ?? null);
      setLoading(false);
    });
    return () => unsub();
  }, [auth]);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        uid,
        isLoggedIn: !!user,
        loading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);