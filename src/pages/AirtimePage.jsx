import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { doc, updateDoc, addDoc, collection, serverTimestamp, increment } from "firebase/firestore";
import bcrypt from "bcryptjs";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import PinModal from "@/components/PinModal";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle, AlertCircle, ChevronDown, ChevronRight, ArrowLeft, FileText, User, Ticket } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

const NETWORKS = [
  { name: "MTN",      logo: "/networks/mtn.svg" },
  { name: "Airtel",   logo: "/networks/airtel.svg" },
  { name: "GLO",      logo: "/networks/glo.svg" },
  { name: "T2 Mobile", logo: "/networks/t2mobile.svg" },
  { name: "Smile",    logo: "/networks/smile.svg" },
];

const AMOUNTS = [
  { top: 50,   pay: 25  }, { top: 100,  pay: 50   }, { top: 200,  pay: 100  },
  { top: 500,  pay: 267 }, { top: 1000, pay: 767  }, { top: 2000, pay: 1767 },
  { top: 120,  pay: 60  }, { top: 320,  pay: 160  }, { top: 520,  pay: 287  },
  { top: 820,  pay: 587 }, { top: 1020, pay: 787  }, { top: 1220, pay: 987  },
];

export default function AirtimePage() {
  const { user, userData } = useAuth();
  const [, setLocation] = useLocation();
  const [network, setNetwork] = useState(NETWORKS[2]);
  const [phone, setPhone] = useState(userData?.phoneNumber ?? "");
  const [selected, setSelected] = useState(null);
  const [customAmount, setCustomAmount] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [formError, setFormError] = useState("");

  const finalAmount = selected ? selected.pay : (parseFloat(customAmount) || 0);

  const validate = () => {
    if (phone.length < 10) { setFormError("Enter a valid phone number."); return false; }
    if (!finalAmount || finalAmount < 25) { setFormError("Select or enter an amount (min ₦25)."); return false; }
    if (finalAmount > (userData?.accountBalance ?? 0)) { setFormError("Insufficient balance."); return false; }
    setFormError(""); return true;
  };

  const handlePinConfirm = async (pin) => {
    const match = await bcrypt.compare(pin, userData.transactionPin);
    if (!match) throw new Error("Incorrect PIN. Try again.");
    setPinLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { accountBalance: increment(-finalAmount) });
      await addDoc(collection(db, "users", user.uid, "transactions"), {
        amount: finalAmount, type: "debit", status: "success",
        description: `${network.name} airtime ₦${selected?.top ?? finalAmount} for ${phone}`,
        date: serverTimestamp(),
      });
      setPinOpen(false); setStatus("success");
    } catch { throw new Error("Purchase failed. Try again."); }
    finally { setPinLoading(false); }
  };

  if (status === "success") return (
    <div className="min-h-screen bg-white dark:bg-background flex items-center justify-center px-6">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="text-center max-w-[400px] w-full">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-1">Airtime Purchased!</h2>
        <p className="text-muted-foreground mb-1">
          {selected ? `₦${selected.top}` : formatCurrency(finalAmount)} sent to
        </p>
        <p className="text-lg font-semibold mb-6">{phone} ({network.name})</p>
        <button className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold mb-3" onClick={() => setLocation("/dashboard")}>Back to Home</button>
        <button className="w-full bg-secondary text-foreground py-3.5 rounded-xl font-bold border border-border" onClick={() => { setStatus(null); setSelected(null); setCustomAmount(""); }}>Buy Again</button>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <div className="max-w-[430px] mx-auto">

        {/* Header */}
        <header className="px-4 py-4 flex items-center justify-between">
          <button onClick={() => window.history.back()} className="text-foreground">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Airtime</h1>
          <button className="text-foreground">
            <FileText className="h-5 w-5" />
          </button>
        </header>

        <div className="px-4 space-y-3 pb-10">

          {/* Promo banner */}
          <div className="rounded-2xl bg-[#DCE8FF] dark:bg-primary/10 overflow-hidden">
            <p className="text-center text-primary font-bold text-[11px] tracking-widest pt-2.5 uppercase">AIRTIME</p>
            <div className="flex items-center px-3 pb-3 pt-1 gap-2">
              {/* Left graphic */}
              <div className="relative w-20 h-16 shrink-0">
                <div className="absolute bottom-0 left-1 bg-violet-600 rounded-xl w-14 h-11 flex items-center justify-center shadow-md"
                  style={{ transform: "rotate(-10deg)" }}>
                  <span className="text-yellow-300 font-black text-sm">₦100</span>
                </div>
                <span className="absolute top-0 right-0 text-xl">🪙</span>
                <span className="absolute top-3 right-5 text-base">🪙</span>
              </div>
              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-primary font-black text-sm leading-tight">Get ₦100 FREE Airtime</p>
                <p className="text-primary font-semibold text-xs mt-0.5">Always Stay Online</p>
              </div>
              {/* GO */}
              <button className="h-12 w-12 rounded-full bg-yellow-400 flex items-center justify-center shrink-0 shadow-md">
                <span className="font-black text-sm text-gray-900">GO</span>
              </button>
            </div>
          </div>

          {/* Cashback row */}
          <div className="flex items-center gap-2 bg-secondary/40 dark:bg-secondary/20 rounded-xl px-3 py-2">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Ticket className="h-4 w-4 text-primary" />
            </div>
            <span className="text-primary font-bold text-sm">₦100</span>
            <div className="flex-1" />
            <button className="flex items-center gap-0.5 text-muted-foreground text-xs font-medium">
              (1) <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Main card */}
          <div className="bg-white dark:bg-card rounded-2xl p-4 shadow-sm border border-border/30 relative">

            {/* Network + Phone */}
            <div className="flex items-center gap-3 mb-3">
              {/* Network selector */}
              <div className="relative">
                <button
                  onClick={() => setShowPicker(!showPicker)}
                  className="flex items-center gap-1"
                >
                  <img src={network.logo} alt={network.name} className="h-10 w-10 rounded-full object-cover" />
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>

                {/* Dropdown */}
                <AnimatePresence>
                  {showPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-14 left-0 z-50 bg-white dark:bg-card rounded-2xl shadow-xl border border-border/30 overflow-hidden w-48"
                    >
                      {NETWORKS.map((n) => (
                        <button
                          key={n.name}
                          onClick={() => { setNetwork(n); setShowPicker(false); }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors text-foreground border-b border-border/30 last:border-0",
                            network.name === n.name ? "bg-secondary/50" : "hover:bg-secondary/30"
                          )}
                        >
                          <img src={n.logo} alt={n.name} className="h-9 w-9 rounded-full object-cover shrink-0" />
                          {n.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Phone input */}
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                className="flex-1 text-xl font-bold bg-transparent outline-none text-foreground placeholder:text-muted-foreground/40"
                placeholder="Phone number"
              />

              <button className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-primary" />
              </button>
            </div>

            {/* Cashback note */}
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              Enjoy up to 4%, maximum ₦60 Cashback on your first 2 {network.name} top-ups daily.
            </p>

            <p className="text-sm font-semibold text-foreground mb-2">Top up Airtime</p>

            {/* Amount grid */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {AMOUNTS.map((a) => (
                <button
                  key={a.top}
                  onClick={() => { setSelected(a); setCustomAmount(""); }}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all",
                    selected?.top === a.top
                      ? "border-primary bg-primary/5"
                      : "border-border/40 bg-secondary/20 hover:border-primary/40"
                  )}
                >
                  <p className={cn("text-sm font-bold", selected?.top === a.top ? "text-primary" : "text-foreground")}>
                    ₦{a.top.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Pay ₦{a.pay.toLocaleString()}</p>
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="flex items-center gap-2 border border-border/40 rounded-full px-4 py-3 bg-secondary/20">
              <span className="text-muted-foreground font-bold text-sm">₦</span>
              <input
                type="number"
                placeholder="50-50,000"
                value={customAmount}
                onChange={(e) => { setCustomAmount(e.target.value); setSelected(null); }}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
              />
              <button
                onClick={() => { if (validate()) setPinOpen(true); }}
                className={cn(
                  "px-5 py-1.5 rounded-full text-sm font-bold transition-colors",
                  finalAmount > 0
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/20 text-primary/40"
                )}
              >
                Pay
              </button>
            </div>

            {formError && (
              <p className="text-red-500 text-xs mt-2 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />{formError}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Overlay to close picker */}
      {showPicker && (
        <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
      )}

      <PinModal isOpen={pinOpen} onClose={() => setPinOpen(false)} onConfirm={handlePinConfirm} loading={pinLoading} />
    </div>
  );
}
