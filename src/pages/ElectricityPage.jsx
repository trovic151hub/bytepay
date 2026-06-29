import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { doc, updateDoc, addDoc, collection, serverTimestamp, increment } from "firebase/firestore";
import bcrypt from "bcryptjs";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import PageHeader from "@/components/PageHeader";
import PinModal from "@/components/PinModal";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle, AlertCircle, Copy, ChevronDown, Users, X } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

const DISCOS = [
  { name: "Ikeja Electric",           short: "IKEDC",  bg: "#E31837" },
  { name: "Ibadan Electricity",       short: "IBEDC",  bg: "#DAA520" },
  { name: "Abuja Electricity",        short: "AEDC",   bg: "#003087" },
  { name: "Eko Electricity",          short: "EKEDC",  bg: "#009933" },
  { name: "Port Harcourt Electricity",short: "PHED",   bg: "#006B3C" },
  { name: "Aba Power",                short: "APL",    bg: "#1A237E" },
  { name: "Enugu Electricity",        short: "EEDC",   bg: "#B71C1C" },
  { name: "Jos Electricity",          short: "JEDC",   bg: "#0277BD" },
  { name: "Kano Electricity",         short: "KEDCO",  bg: "#2E7D32" },
  { name: "Kaduna Electricity",       short: "KAEDCO", bg: "#1565C0" },
  { name: "Benin Electricity",        short: "BEDC",   bg: "#1B5E20" },
];

const AMOUNTS = [
  { value: 600,   pay: 397   },
  { value: 1000,  pay: 797   },
  { value: 2000,  pay: 1797  },
  { value: 3000,  pay: 2797  },
  { value: 5000,  pay: 4797  },
  { value: 50000, pay: 49797 },
];

function genToken() {
  return Array.from({ length: 5 }, () => Math.floor(1000 + Math.random() * 9000)).join("-");
}

export default function ElectricityPage() {
  const { user, userData } = useAuth();
  const [, setLocation] = useLocation();
  const [disco, setDisco] = useState(DISCOS[0]);
  const [paymentType, setPaymentType] = useState("Prepaid");
  const [meter, setMeter] = useState("");
  const [saveBeneficiary, setSaveBeneficiary] = useState(true);
  const [selectedAmt, setSelectedAmt] = useState(null);
  const [customAmt, setCustomAmt] = useState("");
  const [billerOpen, setBillerOpen] = useState(false);
  const [payItemOpen, setPayItemOpen] = useState(false);
  const [token, setToken] = useState("");
  const [copied, setCopied] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [formError, setFormError] = useState("");

  const payAmt = selectedAmt?.pay ?? (parseFloat(customAmt) || 0);
  const elecAmt = selectedAmt?.value ?? (parseFloat(customAmt) || 0);

  const validate = () => {
    if (!meter || meter.length < 11) { setFormError("Enter a valid meter/account number."); return false; }
    if (!payAmt || payAmt < 397) { setFormError("Select or enter a valid amount."); return false; }
    if (payAmt > (userData?.accountBalance ?? 0)) { setFormError("Insufficient balance."); return false; }
    setFormError(""); return true;
  };

  const handlePinConfirm = async (pin) => {
    const match = await bcrypt.compare(pin, userData.transactionPin);
    if (!match) throw new Error("Incorrect PIN. Try again.");
    setPinLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { accountBalance: increment(-payAmt) });
      await addDoc(collection(db, "users", user.uid, "transactions"), {
        amount: payAmt, type: "debit", status: "success",
        description: `${disco.name} electricity for meter ${meter}`,
        date: serverTimestamp(),
      });
      if (paymentType === "Prepaid") setToken(genToken());
      setPinOpen(false); setStatus("success");
    } catch { throw new Error("Payment failed. Try again."); }
    finally { setPinLoading(false); }
  };

  if (status === "success") return (
    <div className="min-h-screen bg-[#F4F2FA] dark:bg-background flex items-center justify-center px-6">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="text-center max-w-[400px] w-full">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-1">Payment Successful</h2>
        <p className="text-muted-foreground mb-3">{formatCurrency(payAmt)} paid to {disco.name}</p>
        {token && (
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 rounded-2xl p-4 mb-6">
            <p className="text-xs text-green-700 mb-1">Your Electricity Token</p>
            <p className="text-xl font-bold text-green-800 font-mono tracking-widest">{token}</p>
            <button onClick={() => { navigator.clipboard.writeText(token); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="flex items-center gap-1.5 mx-auto mt-2 text-xs text-green-700 hover:text-green-900">
              {copied ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy token"}
            </button>
          </div>
        )}
        <button className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold mb-3" onClick={() => setLocation("/dashboard")}>Back to Home</button>
        <button className="w-full bg-secondary text-foreground py-3.5 rounded-xl font-bold border border-border" onClick={() => { setStatus(null); setToken(""); setSelectedAmt(null); setCustomAmt(""); }}>Make Another Payment</button>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F2FA] dark:bg-background">
      <div className="max-w-[430px] mx-auto">
        <PageHeader title="Electricity" right={<span className="text-2xl">🧾</span>} />

        <div className="px-4 py-3 space-y-3 pb-10">

          {/* Biller selector */}
          <button onClick={() => setBillerOpen(true)}
            className="w-full bg-white dark:bg-card rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0"
              style={{ backgroundColor: disco.bg }}>{disco.short.slice(0, 2)}</div>
            <span className="flex-1 text-left text-sm font-semibold text-foreground">{disco.name}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Payment item selector */}
          <button onClick={() => setPayItemOpen(true)}
            className="w-full bg-white dark:bg-card rounded-2xl px-4 shadow-sm">
            <div className="flex items-center py-3">
              <div className="flex-1 text-left">
                <p className="text-xs text-muted-foreground">Payment Item</p>
                <p className="text-lg font-bold text-foreground">{paymentType}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>

          {/* Meter/Account + Save Beneficiary */}
          <div className="bg-white dark:bg-card rounded-2xl px-4 py-3 shadow-sm space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Meter / Account Number</p>
              <div className="flex items-center gap-2">
                <input
                  type="text" inputMode="numeric" placeholder="Enter Meter / Account Number"
                  value={meter}
                  onChange={(e) => setMeter(e.target.value.replace(/\D/g, "").slice(0, 13))}
                  className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
                />
                <Users className="h-5 w-5 text-primary shrink-0" />
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-border/40 pt-3">
              <p className="text-sm text-muted-foreground">Save to Beneficiaries</p>
              <button onClick={() => setSaveBeneficiary(v => !v)}
                className={cn("w-12 h-6 rounded-full flex items-center px-1 transition-colors", saveBeneficiary ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600")}>
                <div className={cn("h-4 w-4 rounded-full bg-white shadow transition-transform", saveBeneficiary ? "translate-x-6" : "translate-x-0")} />
              </button>
            </div>
          </div>

          {/* Coupon */}
          <div className="bg-white dark:bg-card rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
            <span className="text-xl">🎫</span>
            <div className="flex-1">
              <span className="text-primary font-bold text-sm">₦50 </span>
              <span className="text-sm text-muted-foreground">Electricity Coupon</span>
            </div>
            <button className="text-primary font-bold text-sm">Claim</button>
          </div>

          {/* Cash prize banner */}
          <div className="bg-gradient-to-r from-green-700 to-green-600 rounded-2xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              <p className="text-white font-black text-sm">₦10,000,000 Cash Prize</p>
            </div>
            <button className="bg-yellow-400 text-yellow-900 font-black text-xs px-3 py-1.5 rounded-full">GO</button>
          </div>

          {/* Amount grid */}
          <div className="bg-white dark:bg-card rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-foreground mb-3">Select Amount</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {AMOUNTS.map((a) => (
                <button key={a.value} onClick={() => { setSelectedAmt(a); setCustomAmt(""); }}
                  className={cn("p-3 rounded-xl border-2 text-left transition-all",
                    selectedAmt?.value === a.value ? "border-primary bg-primary/8" : "border-border hover:border-primary/40 bg-secondary/20")}>
                  <p className={cn("text-sm font-bold", selectedAmt?.value === a.value ? "text-primary" : "text-foreground")}>
                    ₦{a.value.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-primary line-through-none">Pay ₦{a.pay.toLocaleString()}</p>
                </button>
              ))}
            </div>

            {/* Custom input */}
            <div className="flex items-center gap-2 border border-border rounded-xl px-3 py-2">
              <span className="text-primary font-bold text-sm">₦</span>
              <input
                type="number" placeholder="Enter Amount" value={customAmt}
                onChange={(e) => { setCustomAmt(e.target.value); setSelectedAmt(null); }}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              <button
                onClick={() => { if (validate()) setPinOpen(true); }}
                className={cn("px-4 py-1.5 rounded-lg text-sm font-bold transition-colors",
                  payAmt > 0 ? "bg-primary text-primary-foreground" : "bg-primary/30 text-primary-foreground/60")}>
                Pay
              </button>
            </div>
          </div>

          {formError && (
            <p className="text-red-500 text-sm bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-xl flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />{formError}
            </p>
          )}

          {selectedAmt && (
            <button className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold text-sm"
              onClick={() => { if (validate()) setPinOpen(true); }}>
              Pay ₦{selectedAmt.pay.toLocaleString()} for ₦{selectedAmt.value.toLocaleString()} electricity
            </button>
          )}
        </div>
      </div>

      {/* Biller modal */}
      <AnimatePresence>
        {billerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40" onClick={() => setBillerOpen(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30 }}
              className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-white dark:bg-card rounded-t-3xl z-50 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between px-4 py-4 border-b border-border sticky top-0 bg-white dark:bg-card">
                <p className="text-base font-bold text-foreground">Select Biller</p>
                <button onClick={() => setBillerOpen(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
              </div>
              <div className="px-4 py-2 pb-8">
                {DISCOS.map((d) => (
                  <button key={d.name} onClick={() => { setDisco(d); setBillerOpen(false); }}
                    className="w-full flex items-center gap-3 py-4 border-b border-border/40 last:border-0">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0"
                      style={{ backgroundColor: d.bg }}>{d.short.slice(0, 2)}</div>
                    <span className="flex-1 text-left text-sm font-semibold text-foreground">{d.name}</span>
                    <span className="text-[10px] font-bold text-white bg-green-500 px-2 py-0.5 rounded-full">1% Cashback</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Payment item modal */}
      <AnimatePresence>
        {payItemOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40" onClick={() => setPayItemOpen(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30 }}
              className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-white dark:bg-card rounded-t-3xl z-50">
              <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                <p className="text-base font-bold text-foreground">Select payment item</p>
                <button onClick={() => setPayItemOpen(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
              </div>
              <div className="px-4 py-2 pb-10">
                {["Prepaid", "Postpaid"].map((t) => (
                  <button key={t} onClick={() => { setPaymentType(t); setPayItemOpen(false); }}
                    className="w-full text-left py-4 text-base font-semibold text-foreground border-b border-border/40 last:border-0">
                    {t}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <PinModal isOpen={pinOpen} onClose={() => setPinOpen(false)} onConfirm={handlePinConfirm} loading={pinLoading} />
    </div>
  );
}
