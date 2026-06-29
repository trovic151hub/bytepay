import { useState } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import bcrypt from "bcryptjs";
import { auth, db } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ChevronDown, Gift, X } from "lucide-react";
import { RiHeadphoneLine } from "react-icons/ri";
import Logo from "@/components/Logo";
import NumericKeypad from "@/components/NumericKeypad";
import { LogoIcon } from "@/components/LogoLoader";
import { generateAccountNumber } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export default function SignUpPage() {
  const [, setLocation] = useLocation();
  const { setAuthBusy } = useAuth();
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "", password: "", pin: "", referralCode: "" });
  const [showReferral, setShowReferral] = useState(false);
  const [pinSheetOpen, setPinSheetOpen] = useState(false);
  const [passSheetOpen, setPassSheetOpen] = useState(false);
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
      try {
        await setDoc(doc(db, "phoneIndex", phone), { email });
      } catch { /* phone-number login won't resolve for this account yet */ }

      // Public account-number index for BytePay peer-to-peer lookup
      const accountNumber = generateAccountNumber(phone);
      try {
        await setDoc(doc(db, "accountIndex", accountNumber), {
          uid: user.uid,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
        });
      } catch { /* BytePay lookup won't work until rules are deployed */ }
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

            {/* Password — opens keypad sheet */}
            <button
              type="button"
              onClick={() => setPassSheetOpen(true)}
              className="w-full bg-secondary border-0 rounded-2xl h-14 px-4 flex items-center justify-between"
              data-testid="input-password"
            >
              <span className={cn("text-sm", form.password ? "text-foreground" : "text-muted-foreground")}>
                {form.password ? "Password set" : "Set Payment Password (6 digits)"}
              </span>
              <div className="flex gap-1.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={cn("h-2 w-2 rounded-full", i < form.password.length ? "bg-primary" : "bg-muted-foreground/30")} />
                ))}
              </div>
            </button>

            {/* Transaction PIN — opens keypad sheet */}
            <button
              type="button"
              onClick={() => setPinSheetOpen(true)}
              className="w-full bg-secondary border-0 rounded-2xl h-14 px-4 flex items-center justify-between"
              data-testid="input-pin"
            >
              <span className={cn("text-sm", form.pin ? "text-foreground" : "text-muted-foreground")}>
                {form.pin ? "Transaction PIN set" : "Set Transaction PIN (6 digits)"}
              </span>
              <div className="flex gap-1.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={cn("h-2 w-2 rounded-full", i < form.pin.length ? "bg-primary" : "bg-muted-foreground/30")} />
                ))}
              </div>
            </button>

            <div className="relative">
              <div className="absolute -top-3 right-2 bg-orange-100 text-orange-600 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 z-10">
                <Gift className="h-3 w-3" /> Get ₦100 Airtime for Free
              </div>
              <Button type="submit" className="w-full mt-3" size="lg" disabled={loading} data-testid="button-submit">
                {loading ? <span className="flex items-center gap-2"><LogoIcon size="xs" />Creating account...</span> : "Sign up"}
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

      {/* Password keypad sheet */}
      <AnimatePresence>
        {passSheetOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40" onClick={() => setPassSheetOpen(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto z-50 bg-white dark:bg-card rounded-t-3xl px-6 pt-5 pb-8">
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-border" />
              <div className="flex items-center justify-between mt-2 mb-4">
                <h2 className="text-base font-bold text-foreground">Set Payment Password</h2>
                <button onClick={() => setPassSheetOpen(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
              </div>
              <p className="text-center text-sm text-muted-foreground mb-5">
                Used to log in to your BytePay account
              </p>
              <div className="flex justify-center gap-3 mb-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: form.password.length === i ? 1.25 : 1 }}
                    className={cn(
                      "w-4 h-4 rounded-full border-2 transition-colors",
                      i < form.password.length ? "bg-primary border-primary" : "bg-transparent border-muted-foreground/40"
                    )}
                  />
                ))}
              </div>
              <div className="mt-5">
                <NumericKeypad
                  onKey={(k) => {
                    if (k === "del") {
                      setForm((f) => ({ ...f, password: f.password.slice(0, -1) }));
                    } else if (form.password.length < 6) {
                      const next = form.password + k;
                      setForm((f) => ({ ...f, password: next }));
                      if (next.length === 6) setTimeout(() => setPassSheetOpen(false), 300);
                    }
                  }}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* PIN entry sheet */}
      <AnimatePresence>
        {pinSheetOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40" onClick={() => setPinSheetOpen(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto z-50 bg-white dark:bg-card rounded-t-3xl px-6 pt-5 pb-8">

              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-border" />

              <div className="flex items-center justify-between mt-2 mb-4">
                <h2 className="text-base font-bold text-foreground">Set Transaction PIN</h2>
                <button onClick={() => setPinSheetOpen(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
              </div>

              <p className="text-center text-sm text-muted-foreground mb-5">
                This PIN is used to authorize all transactions
              </p>

              <div className="flex justify-center gap-3 mb-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: form.pin.length === i ? 1.25 : 1 }}
                    className={cn(
                      "w-4 h-4 rounded-full border-2 transition-colors",
                      i < form.pin.length ? "bg-primary border-primary" : "bg-transparent border-muted-foreground/40"
                    )}
                  />
                ))}
              </div>

              <div className="mt-5">
                <NumericKeypad
                  onKey={(k) => {
                    if (k === "del") {
                      setForm((f) => ({ ...f, pin: f.pin.slice(0, -1) }));
                    } else if (form.pin.length < 6) {
                      const next = form.pin + k;
                      setForm((f) => ({ ...f, pin: next }));
                      if (next.length === 6) setTimeout(() => setPinSheetOpen(false), 300);
                    }
                  }}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
