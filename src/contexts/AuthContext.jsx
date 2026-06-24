import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  // Lets a page suppress PublicRoute's auto-redirect while it's mid-flow
  // (e.g. signup briefly authenticates before signing back out).
  const [authBusy, setAuthBusy] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setUserData(null);
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const unsubData = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setUserData({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    });
    return () => unsubData();
  }, [user]);

  const value = useMemo(
    () => ({ user, userData, loading, authBusy, setAuthBusy }),
    [user, userData, loading, authBusy]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
