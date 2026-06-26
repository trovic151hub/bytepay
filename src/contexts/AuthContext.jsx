import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

// Derives a 10-digit account number from any Nigerian phone format
function deriveAccountNumber(phone) {
  if (!phone) return null;
  let p = phone.replace(/[\s\-\(\)]/g, "");
  if (p.startsWith("+234"))                      p = p.slice(4);   // +2349151702497
  else if (p.startsWith("234") && p.length >= 13) p = p.slice(3);  // 2349151702497
  else if (p.startsWith("0"))                     p = p.slice(1);   // 09151702497
  return p.length === 10 ? p : null;
}

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
        const data = snap.data();
        setUserData({ id: snap.id, ...data });

        // Backfill accountNumber for accounts missing the field or with wrong format
        const accountNumber = data.accountNumber?.length === 10
          ? data.accountNumber
          : deriveAccountNumber(data.phoneNumber);

        if (accountNumber && data.accountNumber !== accountNumber) {
          updateDoc(userRef, { accountNumber }).catch(() => {});
        }

        // Backfill accountIndex so BytePay lookup works for existing accounts
        if (accountNumber && data.firstName) {
          setDoc(doc(db, "accountIndex", accountNumber), {
            uid: snap.id,
            firstName: data.firstName,
            lastName: data.lastName ?? "",
          }).catch(() => {});
        }
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
