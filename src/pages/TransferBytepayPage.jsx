import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp, increment, orderBy, limit, onSnapshot } from "firebase/firestore";
import bcrypt from "bcryptjs";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import PageHeader from "@/components/PageHeader";
import PinModal from "@/components/PinModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle, AlertCircle, Loader2, Search, ChevronRight, MoreVertical, Users } from "lucide-react";
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
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <PageHeader title="Transfer to BytePay" />
          <button className="h-9 w-9 rounded-xl bg-white dark:bg-card border border-border flex items-center justify-center">
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="px-4 pb-8 space-y-3">

          {/* Cycling last transactions */}
          {recentTxns.length > 0 && (
            <div className="bg-white dark:bg-card rounded-2xl px-4 py-3 shadow-sm overflow-hidden">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-2">Recent Activity</p>
              <AnimatePresence mode="wait">
                {(() => {
                  const tx = recentTxns[txIdx];
                  const d = tx.date?.toDate ? tx.date.toDate() : new Date();
                  return (
                    <motion.div key={tx.id}
                      initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${tx.type === "credit" ? "bg-green-100" : "bg-violet-100"}`}>
                        <span className="text-sm">{tx.type === "credit" ? "⬇" : "⬆"}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{tx.description}</p>
                        <p className="text-[11px] text-muted-foreground">{d.toLocaleDateString("en-NG", { month: "short", day: "numeric" })}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${tx.type === "credit" ? "text-green-600" : "text-foreground"}`}>
                          {tx.type === "credit" ? "+" : "-"}{formatCurrency(tx.amount ?? 0)}
                        </p>
                        <div className="flex items-center gap-1 justify-end mt-0.5">
                          {recentTxns.map((_, i) => (
                            <span key={i} className={`h-1 rounded-full transition-all ${i === txIdx ? "w-3 bg-primary" : "w-1 bg-border"}`} />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </div>
          )}

          {/* Input card */}
          <div className="bg-white dark:bg-card rounded-2xl p-4 shadow-sm space-y-3">
            <div className="relative">
              <Input
                placeholder="Enter 10-digit Account No. or Phone No."
                value={accNum} onChange={handleAccChange}
                inputMode="numeric" maxLength={10}
                className="pr-10 text-base"
                data-testid="input-account-number"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
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
              className={cn("w-full py-3.5 rounded-xl font-bold text-sm transition-colors",
                recipient ? "bg-primary text-primary-foreground" : "bg-primary/30 text-primary-foreground/70")}
              data-testid="button-continue">
              Next
            </button>
          </div>

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

          {/* Recent contacts */}
          <div className="bg-white dark:bg-card rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-4 px-4 pt-3 pb-1 border-b border-border">
              {["Recent", "Favorites", "Local Contacts"].map((t) => (
                <button key={t} className={cn("pb-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap",
                  t === "Recent" ? "border-primary text-primary" : "border-transparent text-muted-foreground")}>
                  {t}
                </button>
              ))}
              <button className="ml-auto"><Search className="h-4 w-4 text-muted-foreground" /></button>
            </div>

            {RECENT_CONTACTS.map((c, i) => (
              <div key={i} className={cn("flex items-center gap-3 px-4 py-3.5", i < RECENT_CONTACTS.length - 1 && "border-b border-border/60")}>
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
                  {c.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                    {c.badge && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold shrink-0">{c.badge}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{c.account}</p>
                  {c.lastTransfer && <p className="text-[10px] text-muted-foreground/70">Last transfer on {c.lastTransfer}</p>}
                </div>
              </div>
            ))}

            <button className="w-full py-3 text-center text-sm text-primary font-medium border-t border-border">
              View All &gt;
            </button>
          </div>

        </div>
      </div>
      <PinModal isOpen={pinOpen} onClose={() => setPinOpen(false)} onConfirm={handlePinConfirm} loading={pinLoading} />
    </div>
  );
}
