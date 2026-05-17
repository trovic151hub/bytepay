import { useState } from "react";
import { motion } from "framer-motion";
import { doc, updateDoc, addDoc, collection, serverTimestamp, increment } from "firebase/firestore";
import bcrypt from "bcryptjs";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import PageHeader from "@/components/PageHeader";
import PinModal from "@/components/PinModal";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle, AlertCircle, ChevronDown, User } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

const NETWORKS = [
  { name: "MTN", bg: "bg-yellow-400", text: "text-yellow-900", short: "MTN" },
  { name: "Airtel", bg: "bg-red-500", text: "text-white", short: "AIR" },
  { name: "Glo", bg: "bg-green-600", text: "text-white", short: "GLO" },
  { name: "9mobile", bg: "bg-emerald-500", text: "text-white", short: "9MB" },
];

const AMOUNTS = [
  { top: 50, pay: 25 }, { top: 100, pay: 50 }, { top: 200, pay: 100 },
  { top: 500, pay: 250 }, { top: 1000, pay: 639 }, { top: 2000, pay: 1639 },
  { top: 120, pay: 60 }, { top: 320, pay: 160 }, { top: 520, pay: 260 },
  { top: 820, pay: 459 }, { top: 1020, pay: 659 }, { top: 1220, pay: 859 },
];

export default function AirtimePage() {
  const { user, userData } = useAuth();
  const [, setLocation] = useLocation();
  const [network, setNetwork] = useState(NETWORKS[2]);
  const [phone, setPhone] = useState(userData?.phoneNumber ?? "");
  const [selected, setSelected] = useState(null);
  const [customAmount, setCustomAmount] = useState("");
  const [showNetworkPicker, setShowNetworkPicker] = useState(false);
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
    <div className="min-h-screen bg-[#F4F2FA] dark:bg-background flex items-center justify-center px-6">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="text-center max-w-[400px] w-full">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-1">Airtime Purchased!</h2>
        <p className="text-muted-foreground mb-1">
          {selected ? `₦${selected.top}` : formatCurrency(finalAmount)} sent to
        </p>
        <p className="text-lg font-semibold mb-6">{phone} ({network.name})</p>
        <button className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold mb-3" onClick={() => setLocation("/dashboard")} data-testid="button-back-home">Back to Home</button>
        <button className="w-full bg-secondary text-foreground py-3.5 rounded-xl font-bold border border-border" onClick={() => { setStatus(null); setSelected(null); setCustomAmount(""); }} data-testid="button-buy-again">Buy Again</button>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F2FA] dark:bg-background">
      <div className="max-w-[430px] mx-auto">
        <PageHeader title="Airtime" />

        <div className="px-4 py-3 space-y-3">
          <div className="bg-white dark:bg-card rounded-2xl p-4 shadow-sm">

            {/* Network + Phone Row */}
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <button onClick={() => setShowNetworkPicker(!showNetworkPicker)}
                  className={`h-12 w-12 rounded-full ${network.bg} flex items-center justify-center gap-1`}>
                  <span className={`text-xs font-black ${network.text}`}>{network.short}</span>
                  <ChevronDown className={`h-3 w-3 ${network.text}`} />
                </button>
                {showNetworkPicker && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    className="absolute top-14 left-0 z-50 bg-white dark:bg-card rounded-xl shadow-xl border border-border overflow-hidden w-36">
                    {NETWORKS.map((n) => (
                      <button key={n.name} onClick={() => { setNetwork(n); setShowNetworkPicker(false); }}
                        className={cn("w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium hover:bg-secondary transition-colors", network.name === n.name && "bg-secondary")}>
                        <div className={`h-6 w-6 rounded-full ${n.bg} flex items-center justify-center`}>
                          <span className={`text-[9px] font-black ${n.text}`}>{n.short}</span>
                        </div>
                        {n.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              <div className="flex-1">
                <Input
                  type="tel" value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  className="text-base font-bold border-0 bg-transparent p-0 h-auto focus-visible:ring-0 shadow-none"
                  placeholder="Enter phone number"
                  data-testid="input-phone"
                />
              </div>

              <button className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </button>
            </div>

            {/* Cashback note */}
            <p className="text-xs text-muted-foreground mb-3">
              Enjoy up to 4%, maximum ₦60 Cashback on your first 2 {network.name} top-ups daily.
            </p>

            <p className="text-sm font-semibold text-foreground mb-2">Top up Airtime</p>

            {/* Amount Grid */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {AMOUNTS.map((a) => (
                <button key={a.top} onClick={() => { setSelected(a); setCustomAmount(""); }}
                  className={cn(
                    "p-3 rounded-xl border-2 text-left transition-all",
                    selected?.top === a.top
                      ? "border-primary bg-primary/8"
                      : "border-border hover:border-primary/40 bg-secondary/30"
                  )}
                  data-testid={`amount-${a.top}`}>
                  <p className={cn("text-sm font-bold", selected?.top === a.top ? "text-primary" : "text-foreground")}>
                    ₦{a.top.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Pay ₦{a.pay.toLocaleString()}</p>
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="flex items-center gap-2 border border-border rounded-xl px-3 py-2">
              <span className="text-primary font-bold text-sm">₦</span>
              <input
                type="number" placeholder="50-50,000" value={customAmount}
                onChange={(e) => { setCustomAmount(e.target.value); setSelected(null); }}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                data-testid="input-custom-amount"
              />
              <button
                onClick={() => { if (validate()) setPinOpen(true); }}
                className={cn("px-4 py-1.5 rounded-lg text-sm font-bold transition-colors",
                  finalAmount > 0 ? "bg-primary text-primary-foreground" : "bg-primary/30 text-primary-foreground/60")}
                data-testid="button-pay">
                Pay
              </button>
            </div>
          </div>

          {formError && (
            <p className="text-red-500 text-sm bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-xl flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />{formError}
            </p>
          )}

          {/* Airtime services */}
          <div className="bg-white dark:bg-card rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-foreground mb-3">Airtime services</p>
            <button className="w-full flex items-center gap-3 hover:bg-secondary/50 rounded-xl p-2 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">🔄</div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-foreground">Airtime Top-up Plan（Auto Top-up）</p>
                <p className="text-xs text-muted-foreground">Always Stay Online</p>
              </div>
              <span className="text-muted-foreground">›</span>
            </button>
          </div>
        </div>
      </div>
      <PinModal isOpen={pinOpen} onClose={() => setPinOpen(false)} onConfirm={handlePinConfirm} loading={pinLoading} />
    </div>
  );
}
