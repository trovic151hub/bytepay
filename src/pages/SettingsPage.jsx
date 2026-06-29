import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { signOut } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import bcrypt from "bcryptjs";
import { auth, db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "@/hooks/useToast";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ChevronRight, X, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import NumericKeypad from "@/components/NumericKeypad";
import { LogoIcon } from "@/components/LogoLoader";

// ── helpers ──────────────────────────────────────────────────────────────────
const cs = (label) => () =>
  toast({ title: "Coming Soon", description: `${label} is coming soon.` });

// ── sub-components ────────────────────────────────────────────────────────────
function SettingsGroup({ title, children }) {
  return (
    <div className="space-y-0">
      {title && <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-1">{title}</p>}
      <div className="bg-white dark:bg-card rounded-2xl overflow-hidden shadow-sm divide-y divide-border/30">
        {children}
      </div>
    </div>
  );
}

function SettingsRow({ label, value, toggle, toggleValue, onToggle, onClick, danger }) {
  return (
    <div
      onClick={toggle ? undefined : onClick}
      className={cn(
        "flex items-center justify-between px-5 py-4",
        !toggle && onClick && "cursor-pointer active:bg-secondary/30",
        danger && "text-red-500"
      )}
    >
      <span className={cn("text-sm font-medium", danger ? "text-red-500" : "text-foreground")}>{label}</span>
      {toggle ? (
        <button
          onClick={onToggle}
          className={cn(
            "w-11 h-6 rounded-full flex items-center px-0.5 transition-colors shrink-0",
            toggleValue ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"
          )}
        >
          <div className={cn(
            "h-5 w-5 rounded-full bg-white shadow transition-transform",
            toggleValue ? "translate-x-5" : "translate-x-0"
          )} />
        </button>
      ) : (
        <div className="flex items-center gap-1 text-muted-foreground">
          {value && <span className="text-sm">{value}</span>}
          <ChevronRight className={cn("h-4 w-4 shrink-0", danger && "text-red-400")} />
        </div>
      )}
    </div>
  );
}

// ── Change PIN sheet ──────────────────────────────────────────────────────────
function ChangePinSheet({ open, onClose }) {
  const { user, userData } = useAuth();
  const [step, setStep] = useState(1);
  const [pins, setPins] = useState(["", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) { setStep(1); setPins(["", "", ""]); setError(""); setLoading(false); }
  }, [open]);

  useEffect(() => { setError(""); }, [step]);

  const handleClose = () => onClose();

  const pinVal = pins[step - 1];

  const handleKey = async (k) => {
    if (loading) return;
    setError("");

    if (k === "del") {
      setPins((prev) => { const n = [...prev]; n[step - 1] = n[step - 1].slice(0, -1); return n; });
      return;
    }

    if (pinVal.length >= 6) return;
    const next = pinVal + k;
    const nextPins = [...pins]; nextPins[step - 1] = next;
    setPins(nextPins);

    // Auto-advance / verify when digit 6 is entered
    if (next.length === 6) {
      if (step === 1) {
        if (!userData?.transactionPin) { setError("No PIN found. Contact support."); return; }
        setLoading(true);
        try {
          const ok = await bcrypt.compare(next, userData.transactionPin);
          if (!ok) { setError("Incorrect PIN. Try again."); setPins((p) => { const n=[...p]; n[0]=""; return n; }); return; }
          setStep(2);
        } catch { setError("Verification failed. Try again."); }
        finally { setLoading(false); }

      } else if (step === 2) {
        if (next === pins[0]) {
          setError("New PIN must differ from current PIN.");
          setPins((p) => { const n=[...p]; n[1]=""; return n; });
          return;
        }
        setStep(3);

      } else {
        if (next !== nextPins[1]) {
          setError("PINs don't match. Try again.");
          setPins((p) => { const n=[...p]; n[2]=""; return n; });
          return;
        }
        setLoading(true);
        try {
          const hash = await bcrypt.hash(nextPins[1], 10);
          await updateDoc(doc(db, "users", user.uid), { transactionPin: hash });
          toast({ title: "PIN Changed", description: "Your transaction PIN has been updated." });
          handleClose();
        } catch { setError("Failed to save. Try again."); }
        finally { setLoading(false); }
      }
    }
  };

  const stepLabel = ["Enter Current PIN", "Enter New PIN", "Confirm New PIN"][step - 1];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40" onClick={handleClose} />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto z-50 bg-white dark:bg-card rounded-t-3xl px-6 pt-5 pb-8">

            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-border" />

            <div className="flex items-center justify-between mt-2 mb-5">
              <h2 className="text-base font-bold text-foreground">Change Transaction PIN</h2>
              <button onClick={handleClose}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>

            {/* Step progress */}
            <div className="flex gap-2 mb-5">
              {[1, 2, 3].map((s) => (
                <div key={s} className={cn("flex-1 h-1 rounded-full transition-colors", step >= s ? "bg-primary" : "bg-gray-200 dark:bg-gray-700")} />
              ))}
            </div>

            <p className="text-center text-sm font-semibold text-foreground mb-5">{stepLabel}</p>

            {/* Dots */}
            <div className="flex justify-center gap-3 mb-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ scale: pinVal.length === i ? 1.25 : 1 }}
                  className={cn(
                    "w-4 h-4 rounded-full border-2 transition-colors",
                    i < pinVal.length ? "bg-primary border-primary" : "bg-transparent border-muted-foreground/40"
                  )}
                />
              ))}
            </div>

            {loading && (
              <div className="flex justify-center my-3">
                <LogoIcon size="sm" />
              </div>
            )}
            {error && <p className="text-center text-xs text-red-500 my-2">{error}</p>}

            <div className="mt-4">
              <NumericKeypad onKey={handleKey} disabled={loading} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── About modal ───────────────────────────────────────────────────────────────
function AboutModal({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto z-50 bg-white dark:bg-card rounded-t-3xl px-6 pt-5 pb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-foreground">About BytePay</h2>
              <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>

            <div className="flex flex-col items-center py-4 gap-3">
              <div className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center">
                <Shield className="h-10 w-10 text-primary-foreground" />
              </div>
              <p className="text-2xl font-black text-foreground">BytePay</p>
              <p className="text-sm text-muted-foreground">Version 1.0.0</p>
            </div>

            <div className="bg-secondary/30 rounded-2xl divide-y divide-border/40 mt-2">
              {[
                { label: "Platform", value: "Web (PWA)" },
                { label: "Licensed by", value: "CBN as MMO" },
                { label: "Deposit insurance", value: "NDIC protected" },
                { label: "Support", value: "support@bytepay.ng" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-semibold text-foreground">{value}</span>
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-muted-foreground mt-6">
              © {new Date().getFullYear()} BytePay. All rights reserved.
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Close account confirm ─────────────────────────────────────────────────────
function CloseAccountModal({ open, onClose }) {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);

  const handleClose = async () => {
    setLoading(true);
    await signOut(auth);
    setLocation("/login");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div className="bg-white dark:bg-card rounded-3xl p-6 w-full max-w-[340px] shadow-2xl">
              <div className="text-center mb-5">
                <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                  <X className="h-7 w-7 text-red-500" />
                </div>
                <h2 className="text-base font-bold text-foreground">Close Account?</h2>
                <p className="text-sm text-muted-foreground mt-1.5">
                  This will log you out. To permanently close your account please contact support.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={onClose}
                  className="flex-1 bg-secondary text-foreground font-semibold py-3 rounded-2xl text-sm">
                  Cancel
                </button>
                <button onClick={handleClose} disabled={loading}
                  className="flex-1 bg-red-500 text-white font-semibold py-3 rounded-2xl text-sm disabled:opacity-60">
                  {loading ? "Signing out…" : "Proceed"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const [speakerOn, setSpeakerOn] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-[#F4F2FA] dark:bg-background">
      <div className="max-w-[430px] mx-auto">

        <header className="sticky top-0 z-40 bg-[#F4F2FA] dark:bg-background px-4 pt-5 pb-3 flex items-center gap-3">
          <button onClick={() => window.history.back()}
            className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-white -ml-1">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-base font-bold text-foreground">Settings</h1>
        </header>

        <div className="px-4 pb-10 space-y-4">

          <SettingsGroup title="Account">
            <SettingsRow label="Login Settings" value="Profile" onClick={() => setLocation("/profile")} />
            <SettingsRow label="Payment Settings" value="Change PIN" onClick={() => setPinOpen(true)} />
            <SettingsRow label="Security Questions" onClick={cs("Security Questions")} />
          </SettingsGroup>

          <SettingsGroup title="Appearance">
            <SettingsRow
              label="Dark Mode"
              toggle
              toggleValue={isDark}
              onToggle={toggleTheme}
            />
          </SettingsGroup>

          <SettingsGroup title="Notifications">
            <SettingsRow label="SMS Alert Subscribe" onClick={cs("SMS Alerts")} />
            <SettingsRow label="Email Notification Settings" onClick={cs("Email Notifications")} />
            <SettingsRow label="Sound Alerts" toggle toggleValue={speakerOn} onToggle={() => setSpeakerOn((v) => !v)} />
          </SettingsGroup>

          <SettingsGroup title="Info">
            <SettingsRow label="About BytePay" onClick={() => setAboutOpen(true)} />
          </SettingsGroup>

          <SettingsGroup title="Danger Zone">
            <SettingsRow label="Close BytePay Account" onClick={() => setCloseOpen(true)} danger />
          </SettingsGroup>

          <button
            onClick={handleLogout}
            className="w-full bg-primary/10 dark:bg-primary/20 text-primary font-bold py-4 rounded-2xl text-sm"
          >
            Log Out
          </button>

        </div>
      </div>

      <ChangePinSheet open={pinOpen} onClose={() => setPinOpen(false)} />
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <CloseAccountModal open={closeOpen} onClose={() => setCloseOpen(false)} />
    </div>
  );
}
