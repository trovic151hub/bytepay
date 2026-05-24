import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { doc, updateDoc, collection, addDoc, serverTimestamp, increment, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import bcrypt from "bcryptjs";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import PinModal from "@/components/PinModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { lookupNuban } from "@/lib/nuban";
import { CheckCircle, AlertCircle, Loader2, MoreVertical, ChevronRight, TrendingUp, Search, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

const AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000];

const BANK_COLORS = {
  "GTBank": "bg-orange-500", "GTCO": "bg-orange-500",
  "Moniepoint": "bg-blue-600", "OPay": "bg-green-500",
  "Access Bank": "bg-orange-600", "Access": "bg-orange-600",
  "Zenith Bank": "bg-red-600", "Zenith": "bg-red-600",
  "First Bank": "bg-blue-800", "UBA": "bg-red-700",
  "Kuda": "bg-purple-600", "PalmPay": "bg-green-600",
  "Wema Bank": "bg-purple-500", "Stanbic": "bg-blue-500",
  "Sterling": "bg-red-500", "Fidelity": "bg-emerald-700",
  "Union Bank": "bg-indigo-600", "Polaris": "bg-cyan-600",
  "BytePay": "bg-violet-600",
};

function bankColor(bank) {
  if (!bank) return "bg-gray-400";
  for (const [key, val] of Object.entries(BANK_COLORS)) {
    if (bank.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return "bg-gray-500";
}

function bankShort(bank) {
  if (!bank) return "?";
  const words = bank.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase();
  return words.map(w => w[0]).join("").slice(0, 4).toUpperCase();
}

function parseRecipientFromDesc(desc) {
  if (!desc) return null;
  const match = desc.match(/sent .+ to (.+?) [—-] (.+)/i);
  if (!match) return null;
  return { name: match[1].trim(), bank: match[2].trim() };
}

function formatTxDate(tx) {
  const d = tx.date?.toDate ? tx.date.toDate() : new Date();
  return `Last transfer on ${d.toLocaleDateString("en-NG", { month: "long", day: "numeric", year: "numeric" })}`;
}

export default function TransferBankPage() {
  const { user, userData } = useAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState("To Other Bank");
  const [recentTab, setRecentTab] = useState("Recent");
  const [form, setForm] = useState({ accountNumber: "", bank: "", amount: "", narration: "" });
  const [recipientName, setRecipientName] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [step, setStep] = useState("form");
  const [pinOpen, setPinOpen] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [formError, setFormError] = useState("");
  const [recentTxns, setRecentTxns] = useState([]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "users", user.uid, "transactions"),
      orderBy("date", "desc"),
      limit(20)
    );
    const unsub = onSnapshot(q, (snap) => {
      setRecentTxns(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user?.uid]);

  const recentContacts = (() => {
    const seen = new Set();
    const result = [];
    for (const tx of recentTxns) {
      if (tx.type !== "debit") continue;
      const parsed = parseRecipientFromDesc(tx.description ?? "");
      if (!parsed) continue;
      const key = parsed.name;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ ...parsed, date: tx });
    }
    return result;
  })();

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
    setForm(f => ({ ...f, accountNumber: "", bank: contact.bank }));
    setRecipientName(contact.name);
  };

  const validate = () => {
    if (form.accountNumber.length !== 10 && !recipientName) { setFormError("Enter a valid 10-digit account number."); return false; }
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
          <button className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold mb-3"
            onClick={() => setLocation("/dashboard")}>Back to Home</button>
          <button className="w-full bg-secondary text-foreground py-3.5 rounded-xl font-bold border border-border"
            onClick={() => { setStatus(null); setForm({ accountNumber: "", bank: "", amount: "", narration: "" }); setRecipientName(""); }}>
            New Transfer
          </button>
        </motion.div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F2FA] dark:bg-background">
      <div className="w-full max-w-[430px] mx-auto">

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
            <div className="flex items-center gap-2">
              <button className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </button>
              <button className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center">
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
          {/* Shared underline tabs */}
          <div className="flex border-b border-border px-4">
            {["To Other Bank", "To BytePay"].map((t) => (
              <button key={t}
                onClick={() => { setTab(t); if (t === "To BytePay") setLocation("/transfer/bytepay"); }}
                className={cn(
                  "py-3.5 px-2 mr-6 text-sm font-semibold border-b-2 -mb-px transition-colors",
                  tab === t
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}>
                {t}
              </button>
            ))}
          </div>
        </header>

        <div className="pb-8">

          {/* Main form card — full bleed white */}
          <div className="bg-white dark:bg-card shadow-sm">

            {/* Form fields */}
            <div className="px-4 pt-5 pb-4 space-y-4">
              <div className="space-y-3">
                <div className="relative">
                  <Input
                    placeholder="Enter 10-digit Account No."
                    value={form.accountNumber} onChange={handleAccChange}
                    inputMode="numeric" maxLength={10}
                    className="h-12 text-base border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 bg-transparent"
                    data-testid="input-account-number"
                  />
                  {lookingUp
                    ? <Loader2 className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
                    : null}
                </div>

                <AnimatePresence>
                  {recipientName && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl px-3 py-2">
                      <p className="text-xs text-green-600">Account verified</p>
                      <p className="text-sm font-bold text-green-800 dark:text-green-300" data-testid="text-recipient-name">{recipientName}</p>
                    </motion.div>
                  )}
                  {lookingUp && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin" /> Verifying account...
                    </motion.p>
                  )}
                </AnimatePresence>

                <div className={cn(
                  "flex items-center h-12 border-b border-border text-sm",
                  form.bank ? "text-foreground font-semibold" : "text-muted-foreground"
                )} data-testid="text-detected-bank">
                  <span className="flex-1">{form.bank || "Select Bank"}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
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
                              form.amount === String(a) ? "border-primary bg-primary/10 text-primary font-bold" : "border-border text-foreground hover:border-primary")}>
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
                className={cn("w-full py-3.5 rounded-2xl font-bold text-sm transition-colors",
                  form.accountNumber.length === 10 && recipientName
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/30 text-primary-foreground/80")}
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

          <div className="px-4 pt-3 space-y-3">

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
              <div className="flex items-center gap-1 px-4 pt-3 pb-0 border-b border-border">
                {["Recent", "Favorites", "BytePay Contacts"].map((t) => (
                  <button key={t}
                    onClick={() => setRecentTab(t)}
                    className={cn(
                      "py-2.5 px-2 mr-3 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap",
                      recentTab === t
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}>
                    {t}
                  </button>
                ))}
                <button className="ml-auto pb-2"><Search className="h-4 w-4 text-muted-foreground" /></button>
              </div>

              {recentContacts.length === 0 ? (
                <div className="text-center py-10">
                  <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">No recent transfers</p>
                  <p className="text-xs text-muted-foreground mt-1">People you send money to will appear here</p>
                </div>
              ) : (
                recentContacts.map((c, i) => (
                  <button key={i} onClick={() => fillRecent(c)}
                    className={cn("w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/40 transition-colors text-left",
                      i < recentContacts.length - 1 && "border-b border-border/60")}>
                    <div className={`h-10 w-10 rounded-full ${bankColor(c.bank)} flex items-center justify-center text-white text-[11px] font-black shrink-0`}>
                      {bankShort(c.bank)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.bank}</p>
                      <p className="text-[10px] text-muted-foreground/70">{formatTxDate(c.date)}</p>
                    </div>
                  </button>
                ))
              )}
            </div>

          </div>
        </div>
      </div>
      <PinModal isOpen={pinOpen} onClose={() => setPinOpen(false)} onConfirm={handlePinConfirm} loading={pinLoading} />
    </div>
  );
}
