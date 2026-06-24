import { useState } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import bcrypt from "bcryptjs";
import { auth, db } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, ArrowLeft, ChevronDown, Gift } from "lucide-react";
import { RiHeadphoneLine } from "react-icons/ri";
import Logo from "@/components/Logo";
import { generateAccountNumber } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export default function SignUpPage() {
  const [, setLocation] = useLocation();
  const { setAuthBusy } = useAuth();
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "", password: "", pin: "", referralCode: "" });
  const [showPass, setShowPass] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!agreed) {
      setError("Please agree to the Terms & Conditions and Privacy Policy.");
      return;
    }
    if (form.pin.length !== 6 || !/^\d{6}$/.test(form.pin)) {
      setError("Transaction PIN must be exactly 6 digits.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setAuthBusy(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);
      const hashedPin = await bcrypt.hash(form.pin, 10);
      const phone = form.phone.trim();
      const email = form.email.trim();
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email,
        phoneNumber: phone,
        accountNumber: generateAccountNumber(phone),
        transactionPin: hashedPin,
        referralCode: form.referralCode.trim(),
        accountBalance: 0,
        profileImg: "",
        createdAt: serverTimestamp(),
      });
      // Minimal public index so phone-number login can resolve to an email
      // without exposing the rest of the profile (see firestore.rules).
      // Non-blocking: if the phoneIndex rules aren't deployed yet, the
      // account itself was already created successfully above.
      try {
        await setDoc(doc(db, "phoneIndex", phone), { email });
      } catch {
        // phone-number login just won't resolve for this account yet
      }
      // createUserWithEmailAndPassword auto-signs the user in; sign back out
      // so they land on the login screen and authenticate with their new
      // credentials rather than being silently auto-logged-in.
      await signOut(auth);
      setLocation("/login");
    } catch (err) {
      const msg = {
        "auth/email-already-in-use": "This email is already registered.",
        "auth/weak-password": "Password is too weak. Use at least 6 characters.",
        "auth/invalid-email": "Invalid email address.",
      }[err.code] || "Sign up failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
      setAuthBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-background flex flex-col">
      <div className="max-w-[430px] w-full mx-auto flex flex-col flex-1">
        <header className="px-4 py-4 flex items-center justify-between">
          <button onClick={() => setLocation("/")} className="text-foreground" data-testid="btn-back">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <RiHeadphoneLine className="h-6 w-6 text-foreground" />
        </header>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="px-6 flex flex-col flex-1">
          <div className="flex flex-col items-center mt-4 mb-8">
            <Logo size="lg" />
            <p className="text-sm text-muted-foreground mt-2">The Smarter Way to Bank</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="First name" value={form.firstName} onChange={set("firstName")} required
                className="bg-secondary border-0 rounded-2xl h-14" data-testid="input-first-name" />
              <Input placeholder="Last name" value={form.lastName} onChange={set("lastName")} required
                className="bg-secondary border-0 rounded-2xl h-14" data-testid="input-last-name" />
            </div>

            <div className="flex items-center bg-secondary rounded-2xl h-14 px-4 gap-2">
              <span className="text-base">🇳🇬</span>
              <span className="text-sm text-muted-foreground">+234</span>
              <input
                type="tel" placeholder="Please enter Phone Number" value={form.phone} onChange={set("phone")} required
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground text-foreground"
                data-testid="input-phone"
              />
            </div>

            <Input type="email" placeholder="Email address" value={form.email} onChange={set("email")} required
              autoComplete="email" className="bg-secondary border-0 rounded-2xl h-14" data-testid="input-email" />

            <div className="relative">
              <Input type={showPass ? "text" : "password"} placeholder="Password (min. 6 characters)"
                value={form.password} onChange={set("password")} required autoComplete="new-password"
                className="bg-secondary border-0 rounded-2xl h-14 pr-11" data-testid="input-password" />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" data-testid="btn-toggle-password">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Input type="password" placeholder="Transaction PIN (6 digits)" maxLength={6} inputMode="numeric"
              value={form.pin} onChange={set("pin")} required
              className="bg-secondary border-0 rounded-2xl h-14" data-testid="input-pin" />

            <div className="relative">
              <div className="absolute -top-3 right-2 bg-orange-100 text-orange-600 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 z-10">
                <Gift className="h-3 w-3" /> Get ₦100 Airtime for Free
              </div>
              <Button type="submit" className="w-full mt-3" size="lg" disabled={loading} data-testid="button-submit">
                {loading ? <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Creating account...</span> : "Sign up"}
              </Button>
            </div>

            <button
              type="button"
              onClick={() => setShowReferral((v) => !v)}
              className="flex items-center gap-1 text-sm text-muted-foreground mx-auto"
              data-testid="btn-toggle-referral"
            >
              Invitation Code <ChevronDown className={`h-4 w-4 transition-transform ${showReferral ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {showReferral && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  <Input placeholder="Enter invitation code (optional)" value={form.referralCode} onChange={set("referralCode")}
                    className="bg-secondary border-0 rounded-2xl h-14" data-testid="input-referral" />
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm text-center" data-testid="text-error">
                {error}
              </motion.p>
            )}
          </form>

          <div className="flex-1" />

          <p className="text-center text-sm text-muted-foreground pb-2">
            Already have a BytePay account?{" "}
            <Link href="/login" className="text-primary font-semibold" data-testid="link-login">Log in</Link>
          </p>

          <label className="flex items-start gap-2 text-xs text-muted-foreground pb-4 pt-2">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5" data-testid="checkbox-terms" />
            I have read, understood, and agreed to{" "}
            <span className="underline">Terms &amp; Conditions</span> and{" "}
            <span className="underline">Privacy Policy</span>
          </label>

          <p className="text-center text-[10px] text-muted-foreground pb-6">
            Demo app for portfolio purposes — not a licensed financial institution
          </p>
        </motion.div>
      </div>
    </div>
  );
}
