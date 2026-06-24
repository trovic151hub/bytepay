import { useState, useRef, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import { ArrowLeft, User } from "lucide-react";
import { RiHeadphoneLine } from "react-icons/ri";
import Logo from "@/components/Logo";

function maskIdentifier(value) {
  if (!value) return "";
  if (value.includes("@")) {
    const [user, domain] = value.split("@");
    return `${user.slice(0, 2)}***@${domain ?? ""}`;
  }
  const digits = value.replace(/\D/g, "");
  if (digits.length >= 7) return `${digits.slice(0, 3)} **** ${digits.slice(-4)}`;
  return value;
}

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState("identifier");
  const [identifier, setIdentifier] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const pinInputRef = useRef(null);

  useEffect(() => {
    if (step === "password") pinInputRef.current?.focus();
  }, [step]);

  const handleIdentifierSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const value = identifier.trim();
    if (!value) return;
    setLoading(true);
    try {
      if (value.includes("@")) {
        setLoginEmail(value);
      } else {
        const snap = await getDoc(doc(db, "phoneIndex", value));
        if (!snap.exists()) {
          setError("No account found with that phone number.");
          setLoading(false);
          return;
        }
        setLoginEmail(snap.data().email);
      }
      setStep("password");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!password) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail, password);
      setLocation("/dashboard");
    } catch (err) {
      const msg = {
        "auth/user-not-found": "No account found.",
        "auth/wrong-password": "Incorrect password.",
        "auth/invalid-credential": "Incorrect password.",
        "auth/too-many-requests": "Too many attempts. Please try again later.",
      }[err.code] || "Login failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-background flex flex-col">
      <div className="max-w-[430px] w-full mx-auto flex flex-col flex-1">
        <header className="px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => (step === "password" ? setStep("identifier") : setLocation("/"))}
            className="text-foreground"
            data-testid="btn-back"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <RiHeadphoneLine className="h-6 w-6 text-foreground" />
        </header>

        <AnimatePresence mode="wait">
          {step === "identifier" ? (
            <motion.form
              key="identifier"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              onSubmit={handleIdentifierSubmit}
              className="flex flex-col flex-1 px-6"
            >
              <div className="flex flex-col items-center mt-10 mb-10">
                <Logo size="lg" />
                <p className="text-sm text-muted-foreground mt-2">The Smarter Way to Bank</p>
              </div>

              <input
                type="text"
                placeholder="Please enter Phone Number/Email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-secondary rounded-2xl px-4 py-4 text-sm placeholder:text-muted-foreground outline-none text-foreground"
                data-testid="input-identifier"
              />

              {error && (
                <p className="text-red-500 text-sm mt-3" data-testid="text-error">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !identifier.trim()}
                className="w-full mt-4 py-4 rounded-2xl text-base font-bold text-white bg-primary disabled:bg-primary/30 disabled:cursor-not-allowed transition-colors"
                data-testid="button-continue"
              >
                {loading ? "Please wait..." : "Log in"}
              </button>

              <div className="flex-1" />

              <p className="text-center text-sm text-muted-foreground pb-6">
                Don't have a BytePay account?{" "}
                <Link href="/signup" className="text-primary font-semibold" data-testid="link-signup">
                  Click here to sign up
                </Link>
              </p>
            </motion.form>
          ) : (
            <motion.form
              key="password"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              onSubmit={handlePasswordSubmit}
              className="flex flex-col flex-1 px-6"
            >
              <div className="flex flex-col items-center mt-10 mb-2">
                <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-3">
                  <User className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-base font-bold text-foreground">{maskIdentifier(identifier)}</p>
                <p className="text-sm text-muted-foreground mt-1">Enter Password to login</p>
              </div>

              <div className="relative mt-6">
                <input
                  ref={pinInputRef}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="absolute inset-0 opacity-0"
                  data-testid="input-password"
                  autoFocus
                />
                <div className="grid grid-cols-6 gap-2 pointer-events-none">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className={`aspect-square rounded-xl flex items-center justify-center text-lg font-bold ${
                        password.length > i ? "bg-secondary text-foreground" : "bg-secondary/60"
                      }`}
                    >
                      {password.length > i ? "•" : ""}
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-sm mt-3 text-center" data-testid="text-error">{error}</p>
              )}

              <div className="flex-1" />

              <Link href="/forgot-password" className="text-center text-sm text-primary font-semibold pb-6" data-testid="link-forgot-password">
                Forgot Password
              </Link>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-center gap-2 pb-6 text-[10px] text-muted-foreground text-center px-6">
          Demo app for portfolio purposes — not a licensed financial institution
        </div>
      </div>
    </div>
  );
}
