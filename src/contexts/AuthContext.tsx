import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, getAuth } from "firebase/auth";
import { app } from "@/firebase";

interface AuthContextType {
  user: any;
  uid: string | null;
  isLoggedIn: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  uid: null,
  isLoggedIn: false,
  loading: true,
});

export const AuthProvider = ({ children }) => {
  const auth = getAuth(app);
  const [user, setUser] = useState<any>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setUid(currentUser?.uid ?? null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        uid,
        isLoggedIn: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
