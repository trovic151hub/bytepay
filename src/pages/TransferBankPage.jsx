import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { doc, updateDoc, collection, addDoc, serverTimestamp, increment, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import bcrypt from "bcryptjs";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import PinModal from "@/components/PinModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { lookupNuban } from "@/lib/nuban";
import { CheckCircle, AlertCircle, Loader2, MoreVertical, ChevronRight, TrendingUp, Search, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

const AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000];

const RECENT_CONTACTS = [
  { name: "OGEDENGBE VICTOR JAMIU", account: "0616361491", bank: "GTBank", bankColor: "bg-orange-500", bankShort: "GTCO" },
  { name: "Omnipay- FATIMAH BINTU FOLAKE SA...", account: "6066437810", bank: "Moniepoint", bankColor: "bg-blue-600", bankShort: "M" },
  { name: "VICTOR JAMIU OGEDENGBE", account: "9151702497", bank: "OPay", bankColor: "bg-green-500", bankShort: "OPay" },
  { name: "GUOL IPAJAH", account: "5012345678", bank: "Access Bank", bankColor: "bg-orange-600", bankShort: "ACC" },
];

export default function TransferBankPage() {
  const { user, userData } = useAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState("To Other Bank");
  const [form, setForm] = useState({ accountNumber: "", bank: "", amount: "", narration: "" });
  const [recipientName, setRecipientName] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [step, setStep] = useState("form");
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

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleAccChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
    setForm(f => ({ ...f, accountNumber: val, bank: "" }));
    setRecipientName("");
    if (val.length === 10) {
      setLookingUp(true);
      setTimeout(() => {
        const result = lookupNuban(val);
        if (result) {
          setRecipientName(result.name);
          setForm(f => ({ ...f, bank: result.bank }));
        }
        setLookingUp(false);
      }, 900);
    }
  };

  const fillRecent = (contact) => {
    setForm(f => ({ ...f, accountNumber: contact.account, bank: contact.bank }));
    setRecipientName(contact.name);
  };

  const validate = () => {
    if (form.accountNumber.length !== 10) { setFormError("Enter a valid 10-digit account number."); return false; }
    if (!recipientName) { setFormError("Wait for account verification."); return false; }
    const amt = parseFloat(form.amount);
    if (!amt || amt < 1) { setFormError("Enter a valid amount."); return false; }
    if (amt > (userData?.accountBalance ?? 0)) { setFormError("Insufficient balance."); return false; }
    setFormError(""); return true;
  };

  const handlePinConfirm = async (pin) => {
    const match = await bcrypt.compare(pin, userData.transactionPin);
    if (!match) throw new Error("Incorrect PIN. Try again.");
    setPinLoading(true);
    const amt = parseFloat(form.amount);
    try {
      await updateDoc(doc(db, "users", user.uid), { accountBalance: increment(-amt) });
      await addDoc(collection(db, "users", user.uid, "transactions"), {
        amount: amt, type: "debit", status: "success",
        description: `Sent ${formatCurrency(amt)} to ${recipientName} — ${form.bank}`,
        date: serverTimestamp(),
      });
      setPinOpen(false); setStatus("success");
    } catch { throw new Error("Transfer failed. Try again."); }
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
          <p className="text-3xl font-bold mb-1">{formatCurrency(parseFloat(form.amount))}</p>
          <p className="text-sm text-muted-foreground mb-6">to {recipientName} — {form.bank}</p>
          <button className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold mb-3" onClick={() => setLocation("/dashboard")} data-testid="button-back-home">Back to Home</button>
          <button className="w-full bg-secondary text-foreground py-3.5 rounded-xl font-bold border border-border" onClick={() => { setStatus(null); setForm({ accountNumber: "", bank: "", amount: "", narration: "" }); setRecipientName(""); }} data-testid="button-new-transfer">New Transfer</button>
        </motion.div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F2FA] dark:bg-background">
      <div className="max-w-[430px] mx-auto">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white dark:bg-card shadow-sm px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setLocation("/dashboard")}
              className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-secondary transition-colors -ml-1">
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <h1 className="text-base font-semibold text-foreground">Transfer to Bank</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </button>
            <button className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center">
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </header>

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

          {/* Tab switch */}
          <div className="bg-white dark:bg-card rounded-2xl p-1.5 flex shadow-sm">
            {["To Other Bank", "To BytePay"].map((t) => (
              <button key={t} onClick={() => { setTab(t); if (t === "To BytePay") setLocation("/transfer/bytepay"); }}
                className={cn("flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all",
                  tab === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                {t}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="bg-white dark:bg-card rounded-2xl p-4 shadow-sm space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Input
                  placeholder="Enter 10-digit Account No."
                  value={form.accountNumber} onChange={handleAccChange}
                  inputMode="numeric" maxLength={10}
                  className="pr-10 text-base"
                  data-testid="input-account-number"
                />
                {lookingUp
                  ? <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
                  : <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
              </div>

              <AnimatePresence>
                {recipientName && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl px-3 py-2">
                    <p className="text-xs text-green-600 dark:text-green-400">Account verified</p>
                    <p className="text-sm font-bold text-green-800 dark:text-green-300" data-testid="text-recipient-name">{recipientName}</p>
                  </motion.div>
                )}
                {lookingUp && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" /> Verifying account...
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className={cn(
              "flex items-center px-4 h-12 rounded-xl border text-sm transition-colors",
              form.bank ? "border-border bg-secondary text-foreground font-semibold" : "border-border bg-secondary text-muted-foreground"
            )} data-testid="text-detected-bank">
              {form.bank || "Select Bank"}
              <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
            </div>

            <AnimatePresence>
              {recipientName && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Amount (₦)</Label>
                    <Input type="number" placeholder="Enter amount" value={form.amount} onChange={set("amount")} min="1" data-testid="input-amount" />
                    <div className="flex flex-wrap gap-2 mt-1">
                      {AMOUNTS.map(a => (
                        <button key={a} onClick={() => setForm(f => ({ ...f, amount: String(a) }))}
                          className={cn("text-xs px-3 py-1.5 rounded-full border transition-colors",
                            form.amount === String(a) ? "border-primary bg-primary/10 text-primary font-bold" : "border-border text-foreground hover:border-primary")}
                          data-testid={`quick-amount-${a}`}>
                          ₦{a.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Narration (optional)</Label>
                    <Input placeholder="What's it for?" value={form.narration} onChange={set("narration")} data-testid="input-narration" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => { if (validate()) setPinOpen(true); }}
              className={cn("w-full py-3.5 rounded-xl font-bold text-sm transition-colors",
                form.accountNumber.length === 10 && recipientName
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/30 text-primary-foreground/70")}
              data-testid="button-continue">
              Next
            </button>

            <div className="flex items-center gap-1.5 justify-center">
              <span className="text-xs font-bold text-primary">INSTANT</span>
              <span className="text-xs text-muted-foreground">| Seamless transfers without delay</span>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            </div>
          </div>

          {formError && (
            <p className="text-red-500 text-sm bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-xl flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />{formError}
            </p>
          )}

          {/* Success rate monitor */}
          <button className="w-full bg-white dark:bg-card rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <span className="flex-1 text-sm font-medium text-foreground text-left">Bank transfer success rate monitor</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Recent contacts */}
          <div className="bg-white dark:bg-card rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-4 px-4 pt-3 pb-1 border-b border-border">
              {["Recent", "Favorites", "BytePay Contacts"].map((t) => (
                <button key={t} className={cn("pb-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap",
                  t === "Recent" ? "border-primary text-primary" : "border-transparent text-muted-foreground")}>
                  {t}
                </button>
              ))}
              <button className="ml-auto"><Search className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            {RECENT_CONTACTS.map((c, i) => (
              <button key={i} onClick={() => fillRecent(c)}
                className={cn("w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/40 transition-colors", i < RECENT_CONTACTS.length - 1 && "border-b border-border/60")}>
                <div className={`h-10 w-10 rounded-full ${c.bankColor} flex items-center justify-center text-white text-xs font-black shrink-0`}>
                  {c.bankShort.slice(0, 3)}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.account} · {c.bank}</p>
                  <p className="text-[10px] text-muted-foreground/70">Last transfer on May 16, 2026</p>
                </div>
              </button>
            ))}
          </div>

        </div>
      </div>
      <PinModal isOpen={pinOpen} onClose={() => setPinOpen(false)} onConfirm={handlePinConfirm} loading={pinLoading} />
    </div>
  );
}
