import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp, increment, orderBy, limit, onSnapshot } from "firebase/firestore";
import bcrypt from "bcryptjs";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import PinModal from "@/components/PinModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle, AlertCircle, Loader2, Search, ChevronRight, MoreVertical, Users, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

const AMOUNTS = [500, 1000, 2000, 5000, 10000];

const RECENT_CONTACTS = [
  { name: "Adenike Abidemi Oke", account: "9550330717", badge: "Agent", avatar: "A" },
  { name: "STELLA CHINONYE OKECHUKWU", account: "8133934713", lastTransfer: "Apr 17, 2026", avatar: "S" },
  { name: "NKIRUKA CHINYERE IHENACHO", account: "8036106237", lastTransfer: "Mar 19, 2026", avatar: "N" },
];

export default function TransferBytepayPage() {
  const { user, userData } = useAuth();
  const [, setLocation] = useLocation();
  const [accNum, setAccNum] = useState("");
  const [recipient, setRecipient] = useState(null);
  const [searching, setSearching] = useState(false);
  const [amount, setAmount] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [formError, setFormError] = useState("");
  const [recentTxns, setRecentTxns] = useState([]);
  const [txIdx, setTxIdx] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "users", user.uid, "transactions"), orderBy("date", "desc"), limit(3));
    const unsub = onSnapshot(q, (snap) => {
      setRecentTxns(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    if (recentTxns.length < 2) return;
    const t = setInterval(() => setTxIdx((i) => (i + 1) % recentTxns.length), 3000);
    return () => clearInterval(t);
  }, [recentTxns.length]);

  const searchRecipient = async (val) => {
    if (val.length !== 10) { setRecipient(null); return; }
    setSearching(true);
    try {
      const q = query(collection(db, "users"), where("accountNumber", "==", val));
      const snap = await getDocs(q);
      setRecipient(!snap.empty ? { id: snap.docs[0].id, ...snap.docs[0].data() } : null);
    } finally { setSearching(false); }
  };

  const handleAccChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
    setAccNum(val);
    searchRecipient(val);
  };

  const validate = () => {
    if (!recipient) { setFormError("Enter a valid BytePay account number."); return false; }
    if (recipient.uid === user.uid) { setFormError("You cannot transfer to yourself."); return false; }
    const amt = parseFloat(amount);
    if (!amt || amt < 1) { setFormError("Enter a valid amount."); return false; }
    if (amt > (userData?.accountBalance ?? 0)) { setFormError("Insufficient balance."); return false; }
    setFormError(""); return true;
  };

  const handlePinConfirm = async (pin) => {
    const match = await bcrypt.compare(pin, userData.transactionPin);
    if (!match) throw new Error("Incorrect PIN. Try again.");
    setPinLoading(true);
    const amt = parseFloat(amount);
    try {
      await updateDoc(doc(db, "users", user.uid), { accountBalance: increment(-amt) });
      await updateDoc(doc(db, "users", recipient.id), { accountBalance: increment(amt) });
      await addDoc(collection(db, "users", user.uid, "transactions"), {
        amount: amt, type: "debit", status: "success",
        description: `Sent ${formatCurrency(amt)} to ${recipient.firstName} ${recipient.lastName} (BytePay)`,
        date: serverTimestamp(),
      });
      await addDoc(collection(db, "users", recipient.id, "transactions"), {
        amount: amt, type: "credit", status: "success",
        description: `Received ${formatCurrency(amt)} from ${userData.firstName} ${userData.lastName} (BytePay)`,
        date: serverTimestamp(),
      });
      setPinOpen(false); setStatus("success");
    } catch { throw new Error("Transfer failed. Please try again."); }
    finally { setPinLoading(false); }
  };

  if (status === "success") return (
    <div className="min-h-screen bg-[#F4F2FA] dark:bg-background flex items-center justify-center">
      <div className="max-w-[430px] w-full px-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
          <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-1">Transfer Successful</h2>
          <p className="text-muted-foreground mb-1">You sent</p>
          <p className="text-3xl font-bold mb-1">{formatCurrency(parseFloat(amount))}</p>
          <p className="text-sm text-muted-foreground mb-6">to {recipient?.firstName} {recipient?.lastName}</p>
          <button className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold mb-3" onClick={() => setLocation("/dashboard")} data-testid="button-back-home">Back to Home</button>
          <button className="w-full bg-secondary text-foreground py-3.5 rounded-xl font-bold border border-border" onClick={() => { setStatus(null); setAccNum(""); setRecipient(null); setAmount(""); }} data-testid="button-new-transfer">New Transfer</button>
        </motion.div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F2FA] dark:bg-background">
      <div className="max-w-[430px] mx-auto">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white dark:bg-card shadow-sm">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => setLocation("/dashboard")}
                className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-secondary transition-colors -ml-1">
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </button>
              <h1 className="text-base font-semibold text-foreground">Transfer to Bank</h1>
            </div>
            <button className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center">
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          {/* Shared underline tabs */}
          <div className="flex border-b border-border px-4">
            {["To Other Bank", "To BytePay"].map((t) => (
              <button key={t}
                onClick={() => { if (t === "To Other Bank") setLocation("/transfer/bank"); }}
                className={cn(
                  "py-3.5 px-2 mr-6 text-sm font-semibold border-b-2 -mb-px transition-colors",
                  t === "To BytePay"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}>
                {t}
              </button>
            ))}
          </div>
        </header>

        {/* Form — full-bleed white section */}
        <div className="bg-white dark:bg-card shadow-sm">
          <div className="px-4 pt-5 pb-4 space-y-3">

            <div className="relative">
              <Input
                placeholder="Enter 10-digit Account No. or Phone No."
                value={accNum} onChange={handleAccChange}
                inputMode="numeric" maxLength={10}
                className="h-12 text-base border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 bg-transparent"
                data-testid="input-account-number"
              />
              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                {searching
                  ? <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  : <Users className="h-4 w-4 text-muted-foreground" />}
              </div>
            </div>

            <AnimatePresence>
              {recipient && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl px-3 py-2">
                  <p className="text-xs text-green-600 dark:text-green-400">Account found</p>
                  <p className="text-sm font-bold text-green-800 dark:text-green-300" data-testid="text-recipient-name">
                    {recipient.firstName} {recipient.lastName}
                  </p>
                </motion.div>
              )}
              {accNum.length === 10 && !recipient && !searching && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Account not found on BytePay
                </motion.p>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {recipient && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Amount (₦)</Label>
                    <Input type="number" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} min="1" data-testid="input-amount" />
                    <div className="flex flex-wrap gap-2 mt-1">
                      {AMOUNTS.map(a => (
                        <button key={a} onClick={() => setAmount(String(a))}
                          className={cn("text-xs px-3 py-1.5 rounded-full border transition-colors",
                            amount === String(a) ? "border-primary bg-primary/10 text-primary font-bold" : "border-border text-foreground hover:border-primary")}
                          data-testid={`quick-amount-${a}`}>
                          ₦{a.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => { if (validate()) setPinOpen(true); }}
              className={cn("w-full py-3.5 rounded-2xl font-bold text-sm transition-colors",
                recipient ? "bg-primary text-primary-foreground" : "bg-primary/30 text-primary-foreground/80")}
              data-testid="button-continue">
              Next
            </button>

            <div className="flex items-center gap-1.5 justify-center pb-1">
              <span className="text-xs font-bold text-primary">INSTANT</span>
              <span className="text-xs text-muted-foreground">| Seamless transfers without delay</span>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="px-4 pt-3 pb-8 space-y-3">

          {formError && (
            <p className="text-red-500 text-sm bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-xl flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />{formError}
            </p>
          )}

          {/* See who is using BytePay */}
          <button className="w-full bg-white dark:bg-card rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <span className="flex-1 text-sm font-medium text-foreground text-left">See who is using BytePay</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Recent BytePay contacts */}
          <div className="bg-white dark:bg-card rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-1 px-4 pt-3 pb-0 border-b border-border">
              {["Recent", "Favorites", "Local Contacts"].map((t) => (
                <button key={t}
                  className={cn(
                    "py-2.5 px-2 mr-3 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap",
                    t === "Recent"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}>
                  {t}
                </button>
              ))}
              <button className="ml-auto pb-2"><Search className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div className="text-center py-10">
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">No recent transfers</p>
              <p className="text-xs text-muted-foreground mt-1">BytePay users you send to will appear here</p>
            </div>
          </div>

        </div>
      </div>
      <PinModal isOpen={pinOpen} onClose={() => setPinOpen(false)} onConfirm={handlePinConfirm} loading={pinLoading} />
    </div>
  );
}
