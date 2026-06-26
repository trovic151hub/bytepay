import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc,
  serverTimestamp, increment, orderBy, limit, onSnapshot,
  writeBatch, runTransaction
} from "firebase/firestore";
import bcrypt from "bcryptjs";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import PinModal from "@/components/PinModal";
import { formatCurrency } from "@/lib/utils";
import { lookupNuban } from "@/lib/nuban";
import {
  Check, CheckCircle, AlertCircle, Loader2, MoreVertical,
  ChevronRight, Search, ArrowLeft, Activity, X, ShieldCheck,
  Share2, Heart, Tv, Gift, Smartphone, CreditCard
} from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

/* ── Banks ───────────────────────────────────────────── */
const BANKS = [
  "Access Bank","Citibank Nigeria","Ecobank Nigeria","Fidelity Bank",
  "First Bank of Nigeria","FCMB","GTBank","Heritage Bank","Jaiz Bank",
  "Keystone Bank","Kuda Bank","Moniepoint MFB","OPay","Palmpay",
  "Polaris Bank","Providus Bank","Stanbic IBTC Bank","Standard Chartered",
  "Sterling Bank","Suntrust Bank","UBA","Union Bank","Unity Bank",
  "VFD Microfinance Bank","Wema Bank","Zenith Bank",
];

const BANK_BG = {
  GTBank:"bg-orange-500", Moniepoint:"bg-blue-600", OPay:"bg-green-500",
  Opay:"bg-green-500", Access:"bg-orange-600", Zenith:"bg-red-600",
  "First Bank":"bg-blue-800", UBA:"bg-red-700", Kuda:"bg-purple-600",
  Palmpay:"bg-green-600", Wema:"bg-purple-500", Stanbic:"bg-blue-500",
  Sterling:"bg-red-500", Fidelity:"bg-emerald-700", Union:"bg-indigo-600",
  Polaris:"bg-cyan-600", FCMB:"bg-orange-400", Heritage:"bg-teal-600",
  Jaiz:"bg-green-700", Keystone:"bg-gray-600", Providus:"bg-violet-500",
  VFD:"bg-blue-700", BytePay:"bg-violet-600",
};

function bankBg(bank = "") {
  for (const [k, v] of Object.entries(BANK_BG))
    if (bank.toLowerCase().includes(k.toLowerCase())) return v;
  return "bg-gray-400";
}
function bankInitials(bank = "") {
  const w = bank.trim().split(/\s+/);
  return (w.length === 1 ? w[0].slice(0,2) : w.map(x => x[0]).join("").slice(0,2)).toUpperCase();
}

/* Format raw digits → "905 338 0773" */
function fmtAcc(digits) {
  const d = digits.slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)} ${d.slice(3)}`;
  return `${d.slice(0,3)} ${d.slice(3,6)} ${d.slice(6)}`;
}

function formatTxDate(tx) {
  const d = tx.date?.toDate ? tx.date.toDate() : new Date();
  return `Last transfer on  ${d.toLocaleDateString("en-NG",{month:"short",day:"numeric",year:"numeric"})}`;
}
function getContactFromTx(tx) {
  if (tx.recipientName) return {name:tx.recipientName,bank:tx.recipientBank??"",account:tx.recipientAccount??"",isBytepay:!!tx.isBytepay,tx};
  const m=(tx.description??"").match(/to (.+?) [—–-] (.+)/i);
  if(m) return {name:m[1].trim(),bank:m[2].replace(/\(bytepay\)/i,"").trim(),account:"",isBytepay:/bytepay/i.test(tx.description),tx};
  const m2=(tx.description??"").match(/^send - (.+)/i);
  if(m2) return {name:m2[1].trim(),bank:"",account:"",isBytepay:!!tx.isBytepay,tx};
  return null;
}

const AMOUNTS = [500,1000,2000,5000,10000,20000];

/* ── Bank picker sheet ───────────────────────────────── */
function BankPicker({ open, onClose, onSelect }) {
  const [search, setSearch] = useState("");
  const inputRef = useRef(null);
  useEffect(() => { if (open) { setSearch(""); setTimeout(() => inputRef.current?.focus(), 300); } }, [open]);
  const filtered = BANKS.filter(b => b.toLowerCase().includes(search.toLowerCase()));

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="bp-back" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 bg-black/40" onClick={onClose}/>
          <motion.div key="bp-sheet"
            initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}}
            transition={{type:"spring",damping:28,stiffness:300}}
            className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto z-50 bg-white dark:bg-card rounded-t-3xl flex flex-col"
            style={{maxHeight:"80vh",paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
            <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
              <h3 className="text-base font-bold text-foreground">Select Bank</h3>
              <button onClick={onClose} className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                <X className="h-4 w-4 text-muted-foreground"/>
              </button>
            </div>
            <div className="px-4 pb-3 shrink-0">
              <div className="flex items-center gap-2 bg-secondary/60 rounded-xl px-3 py-2.5">
                <Search className="h-4 w-4 text-muted-foreground shrink-0"/>
                <input ref={inputRef} value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Search banks..."
                  className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground/60"/>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 pb-8">
              {filtered.length === 0
                ? <p className="text-center text-sm text-muted-foreground py-10">No banks found</p>
                : filtered.map((bank,i) => (
                  <button key={bank} onClick={() => { onSelect(bank); onClose(); }}
                    className={cn("w-full flex items-center gap-3 px-5 py-3.5 hover:bg-secondary/40 text-left transition-colors",
                      i < filtered.length-1 && "border-b border-border/30")}>
                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold",bankBg(bank))}>
                      {bankInitials(bank)}
                    </div>
                    <span className="text-sm font-medium text-foreground">{bank}</span>
                  </button>
                ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Contact row ─────────────────────────────────────── */
function ContactRow({ contact, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/40 transition-colors text-left">
      <div className={cn("h-11 w-11 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold",
        contact.isBytepay ? "bg-primary" : bankBg(contact.bank))}>
        {contact.isBytepay ? "B" : bankInitials(contact.bank)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{contact.name}</p>
        <p className="text-xs text-muted-foreground">{[contact.account && fmtAcc(contact.account), contact.bank].filter(Boolean).join("  ")}</p>
        <p className="text-[11px] text-muted-foreground/70">{formatTxDate(contact.tx)}</p>
      </div>
    </button>
  );
}

/* ── Confirmation bottom sheet ───────────────────────── */
function ConfirmSheet({ open, onClose, onConfirm, amount, recipientName, bank, account, balance, isBytepay }) {
  const fmt = (v) => Number(v||0).toLocaleString("en-NG", {minimumFractionDigits:2});
  const fmtAcc = (d="") => {
    if (d.length<=3) return d;
    if (d.length<=6) return `${d.slice(0,3)} ${d.slice(3)}`;
    return `${d.slice(0,3)} ${d.slice(3,6)} ${d.slice(6)}`;
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="cs-back" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 bg-black/40" onClick={onClose}/>
          <motion.div key="cs-sheet"
            initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}}
            transition={{type:"spring",damping:28,stiffness:300}}
            className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto z-50 bg-white dark:bg-card rounded-t-3xl"
            style={{paddingBottom:"calc(env(safe-area-inset-bottom,0px) + 1.5rem)"}}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-2">
              <div className="w-8"/>
              <p className="text-sm font-semibold text-foreground">for money transfer</p>
              <button onClick={onClose} className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                <X className="h-4 w-4 text-muted-foreground"/>
              </button>
            </div>

            {/* Big amount */}
            <p className="text-center text-3xl font-extrabold text-primary mt-2 mb-5">
              ₦{fmt(amount)}
            </p>

            {/* Detail rows */}
            <div className="mx-4 border border-border/40 rounded-2xl overflow-hidden mb-3">
              {[
                { label:"Amount",       right: <span className="text-sm font-semibold text-foreground">₦{fmt(amount)}</span> },
                { label:"Fee",          right: isBytepay
                    ? <span className="text-sm font-bold text-green-600">FREE</span>
                    : <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                        <span className="text-muted-foreground/50 line-through text-xs">₦10.00</span>
                        ₦0.00
                      </span>
                },
                { label:"Account",      right: <span className="text-sm font-semibold text-foreground">{fmtAcc(account)}</span> },
                { label:"Account Name", right: <span className="text-sm font-bold text-foreground uppercase">{recipientName}</span> },
                ...(!isBytepay ? [{ label:"Bank", right: <span className="text-sm font-semibold text-foreground">{bank}</span> }] : []),
              ].map(({ label, right }, i, arr) => (
                <div key={label} className={cn("flex items-center justify-between px-4 py-3",
                  i < arr.length-1 && "border-b border-border/30")}>
                  <span className="text-sm text-muted-foreground">{label}</span>
                  {right}
                </div>
              ))}
            </div>

            {/* Payment method */}
            <div className="mx-4 mb-3">
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-sm font-bold text-foreground">Payment Method</span>
                <span className="text-sm text-muted-foreground flex items-center gap-0.5">... <ChevronRight className="h-4 w-4"/></span>
              </div>
              <div className="border border-border/40 rounded-2xl flex items-center gap-3 px-4 py-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary text-base font-extrabold">₿</span>
                </div>
                <span className="flex-1 text-sm font-semibold text-foreground">Balance(₦{fmt(balance)})</span>
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0"/>
              </div>
            </div>

            {/* Confirm button */}
            <div className="px-4 mt-2">
              <button onClick={onConfirm}
                className="w-full py-4 rounded-full bg-primary text-white font-bold text-sm">
                Confirm to Pay
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Success screen ──────────────────────────────────── */
const REWARDS = [
  { Icon: Tv,          title:"₦200 TV Coupon",          sub:"Available for TV Recharge",             cta:"Claim" },
  { Icon: Gift,        title:"₦1000 Trial Cash",         sub:"Claim your FREE bonus, expire today!",  cta:"Go"    },
  { Icon: Smartphone,  title:"Airtime Top-up Plan",      sub:"Always Stay Online",                    cta:"Go"    },
  { Icon: CreditCard,  title:"₦800 OFF on Virtual Card", sub:"Use on Google Play and 40k+ merchants", cta:"Go"    },
];

function SuccessScreen({ amount, onHome }) {
  const fmt = (v) => Number(v||0).toLocaleString("en-NG", {minimumFractionDigits:2});
  return (
    <div className="min-h-screen bg-white dark:bg-background overflow-y-auto">
      <div className="max-w-[430px] mx-auto pb-10">

        {/* Top bar */}
        <div className="flex justify-end px-5 pt-5 pb-2">
          <button onClick={onHome} className="text-sm font-semibold text-foreground">Complete</button>
        </div>

        {/* Checkmark + amount */}
        <div className="flex flex-col items-center px-5 pt-4 pb-5">
          <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",stiffness:220,damping:14}}
            className="mb-4">
            <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="h-8 w-8 text-white stroke-[3]"/>
            </div>
          </motion.div>
          <p className="text-lg font-bold text-foreground mb-1">Successful</p>
          <p className="text-3xl font-extrabold text-foreground mb-2">₦ {fmt(amount)}</p>
          <p className="text-xs text-muted-foreground text-center">Kindly note the actual credit time subject to the bank.</p>
        </div>

        {/* INSTANT banner */}
        <div className="mx-4 mb-4 flex items-center gap-2 bg-secondary/50 rounded-xl px-3 py-2.5">
          <span className="bg-primary text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shrink-0 tracking-wide">INSTANT</span>
          <span className="text-xs text-foreground">Your transfer took only 1.8s to complete</span>
        </div>

        {/* Action buttons */}
        <div className="mx-4 flex gap-3 mb-5">
          <button className="flex-1 flex items-center justify-center gap-2 border-2 border-primary text-primary text-sm font-semibold py-3 rounded-full">
            <Share2 className="h-4 w-4"/>
            Share Receipt
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 border-2 border-primary text-primary text-sm font-semibold py-3 rounded-full">
            <Heart className="h-4 w-4"/>
            Add to Favorite
          </button>
        </div>

        {/* Rewards card */}
        <div className="mx-4 bg-[#F0EEFF] dark:bg-primary/10 rounded-2xl p-4 mb-4">
          <p className="text-sm font-extrabold text-foreground mb-3">Get Your Rewards!</p>
          <div className="space-y-3">
            {REWARDS.map(({ Icon, title, sub, cta }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground leading-tight">{title}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{sub}</p>
                </div>
                <button className="shrink-0 bg-primary text-white text-xs font-bold px-4 py-2 rounded-full">
                  {cta}
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-1.5 mt-4">
            <div className="h-1.5 w-5 rounded-full bg-primary"/>
            <div className="h-1.5 w-3 rounded-full bg-primary/30"/>
          </div>
        </div>

        {/* You're All Set banner */}
        <div className="mx-4 rounded-2xl overflow-hidden" style={{background:"linear-gradient(135deg,#7C3AED 0%,#A855F7 100%)"}}>
          <div className="px-5 py-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-white text-base font-extrabold leading-tight mb-0.5">You're All Set</p>
              <p className="text-yellow-300 text-xs font-semibold leading-tight mb-3">Your Credit Limit Remains<br/>Available Anytime</p>
              <button className="bg-white/20 border border-white/40 text-white text-xs font-bold px-4 py-2 rounded-full">
                View Credit
              </button>
            </div>
            {/* Coin stack illustration */}
            <div className="flex flex-col items-center gap-0.5 shrink-0 opacity-90">
              <div className="h-8 w-8 rounded-full bg-yellow-400 border-2 border-yellow-300 shadow flex items-center justify-center">
                <span className="text-yellow-800 text-xs font-black">₦</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-yellow-400 border-2 border-yellow-300 shadow -mt-3 flex items-center justify-center">
                <span className="text-yellow-800 text-xs font-black">₦</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-yellow-400 border-2 border-yellow-300 shadow -mt-3 flex items-center justify-center">
                <span className="text-yellow-800 text-xs font-black">₦</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────── */
export default function TransferBankPage() {
  const { user, userData } = useAuth();
  const [location, setLocation] = useLocation();

  const [activeTab, setActiveTab]   = useState(location.includes("bytepay") ? "bytepay" : "bank");
  const [contactTab, setContactTab] = useState("Recent");

  /* ── Bank tab ── */
  const [bankAccNum, setBankAccNum]         = useState("");   // raw digits
  const [selectedBank, setSelectedBank]     = useState(null);
  const [resolvedName, setResolvedName]     = useState("");
  const [resolving, setResolving]           = useState(false);
  const [bankAmount, setBankAmount]         = useState("");   // raw string built by numpad
  const [bankNote, setBankNote]             = useState("");
  const [bankPickerOpen, setBankPickerOpen] = useState(false);
  const [bankStep, setBankStep]             = useState("account"); // "account" | "amount"
  const [showSuggestions, setShowSuggestions] = useState(false);

  /* ── BytePay tab ── */
  const [bpAccNum, setBpAccNum]       = useState("");
  const [bpRecipient, setBpRecipient] = useState(null);
  const [bpSearching, setBpSearching] = useState(false);
  const [bpAmount, setBpAmount]       = useState("");

  /* ── Shared ── */
  const [confirmOpen, setConfirmOpen]     = useState(false);
  const [bpConfirmOpen, setBpConfirmOpen] = useState(false);
  const [pinOpen, setPinOpen]         = useState(false);
  const [pinLoading, setPinLoading]   = useState(false);
  const [formError, setFormError]     = useState("");
  const [status, setStatus]           = useState(null);
  const [recentTxns, setRecentTxns]   = useState([]);

  useEffect(() => {
    document.body.style.overflow = bankPickerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [bankPickerOpen]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db,"users",user.uid,"transactions"), orderBy("date","desc"), limit(30));
    const unsub = onSnapshot(q, snap => setRecentTxns(snap.docs.map(d=>({id:d.id,...d.data()}))));
    return () => unsub();
  }, [user?.uid]);

  /* Resolve name when 10-digit acc + bank both set */
  useEffect(() => {
    if (bankAccNum.length !== 10 || !selectedBank) { setResolvedName(""); return; }
    setResolving(true); setResolvedName("");
    const t = setTimeout(() => {
      const r = lookupNuban(bankAccNum);
      setResolvedName(r ? r.name : "");
      setResolving(false);
    }, 1000);
    return () => clearTimeout(t);
  }, [bankAccNum, selectedBank]);

  /* Contact lists */
  const recentContacts = (() => {
    const seen = new Set(); const out = [];
    for (const tx of recentTxns) {
      if (tx.type !== "debit") continue;
      const c = getContactFromTx(tx);
      if (!c || c.isBytepay || seen.has(c.name)) continue;
      seen.add(c.name); out.push(c);
    }
    return out;
  })();

  const bytepayContacts = (() => {
    const seen = new Set(); const out = [];
    for (const tx of recentTxns) {
      if (tx.type !== "debit") continue;
      const c = getContactFromTx(tx);
      if (!c || !c.isBytepay || seen.has(c.name)) continue;
      seen.add(c.name); out.push(c);
    }
    return out;
  })();

  /* Suggestions: recent contacts whose account starts with typed digits */
  const suggestions = bankAccNum.length > 0
    ? recentContacts.filter(c => c.account && c.account.replace(/\s/g,"").startsWith(bankAccNum))
    : [];

  const switchTab = (tab) => {
    setActiveTab(tab); setFormError("");
    if (tab === "bytepay") setContactTab("BytePay Contacts");
    else setContactTab("Recent");
    setLocation(tab === "bytepay" ? "/transfer/bytepay" : "/transfer/bank");
  };

  /* ── Bank handlers ── */
  const handleBankAccChange = (e) => {
    const raw = e.target.value.replace(/\D/g,"").slice(0,10);
    setBankAccNum(raw);
    setResolvedName(""); setSelectedBank(null); setFormError("");
    setShowSuggestions(true);
  };

  const clearBankAcc = () => {
    setBankAccNum(""); setSelectedBank(null); setResolvedName("");
    setBankAmount(""); setBankStep("account"); setFormError("");
    setShowSuggestions(false);
  };

  const pickSuggestion = (c) => {
    setBankAccNum(c.account.replace(/\s/g,""));
    setSelectedBank(c.bank);
    setResolvedName(c.name);
    setShowSuggestions(false);
    setFormError("");
  };

  const fillBankContact = (c) => {
    setBankAccNum(c.account.replace(/\s/g,"") || "");
    setSelectedBank(c.bank || null);
    setResolvedName(c.name);
    setBankAmount(""); setBankStep("account"); setFormError("");
  };

  const validateBank = () => {
    if (!resolvedName) { setFormError("Verify the account first."); return false; }
    const amt = parseFloat(bankAmount);
    if (!amt || amt < 1) { setFormError("Enter a valid amount."); return false; }
    if (amt > (userData?.accountBalance ?? 0)) { setFormError("Insufficient balance."); return false; }
    setFormError(""); return true;
  };

  /* ── BytePay handlers ── */
  const searchBytepay = async (val) => {
    if (val.length !== 10) { setBpRecipient(null); return; }
    setBpSearching(true);
    try {
      const snap = await getDoc(doc(db, "accountIndex", val));
      setBpRecipient(snap.exists() ? { id: snap.data().uid, ...snap.data() } : null);
    } finally { setBpSearching(false); }
  };

  const handleBpAccChange = (e) => {
    const val = e.target.value.replace(/\D/g,"").slice(0,10);
    setBpAccNum(val); searchBytepay(val);
  };

  const fillBpContact = (c) => { setBpAccNum(c.account); searchBytepay(c.account); setBpAmount(""); };

  /* ── Numpad handler (bank amount step) ── */
  const handleNumpad = (key) => {
    if (key === "⌫") { setBankAmount(prev => prev.slice(0,-1)); return; }
    if (key === ".") { if (bankAmount.includes(".")) return; setBankAmount(prev => prev + "."); return; }
    if (key === "00") { if (!bankAmount || bankAmount === "0") return; setBankAmount(prev => prev + "00"); return; }
    if (bankAmount === "0" && key !== ".") { setBankAmount(key); return; }
    setBankAmount(prev => prev + key);
  };

  const fmtDisplay = (val) => {
    if (!val) return "";
    const [int, dec] = val.split(".");
    const formatted = Number(int || 0).toLocaleString("en-NG");
    return dec !== undefined ? `${formatted}.${dec}` : formatted;
  };

  const validateBytepay = () => {
    if (!bpRecipient) { setFormError("Enter a valid BytePay account number."); return false; }
    if (bpRecipient.uid === user.uid) { setFormError("You cannot transfer to yourself."); return false; }
    const amt = parseFloat(bpAmount);
    if (!amt || amt < 1) { setFormError("Enter a valid amount."); return false; }
    if (amt > (userData?.accountBalance ?? 0)) { setFormError("Insufficient balance."); return false; }
    setFormError(""); return true;
  };

  /* ── PIN confirm ── */
  const handlePinConfirm = async (pin) => {
    const match = await bcrypt.compare(pin, userData.transactionPin);
    if (!match) throw new Error("Incorrect PIN. Try again.");
    setPinLoading(true);
    try {
      if (activeTab === "bank") {
        const amt = parseFloat(bankAmount);
        const baseRecord = {
          amount: amt, type: "debit",
          description: `Send - ${resolvedName}`,
          recipientName: resolvedName, recipientBank: selectedBank,
          recipientAccount: bankAccNum, isBytepay: false,
          date: serverTimestamp(),
        };
        try {
          const batch = writeBatch(db);
          batch.update(doc(db, "users", user.uid), { accountBalance: increment(-amt) });
          batch.set(doc(collection(db, "users", user.uid, "transactions")), {
            ...baseRecord, status: "success",
          });
          await batch.commit();
        } catch {
          await addDoc(collection(db, "users", user.uid, "transactions"), {
            ...baseRecord, status: "failed",
          }).catch(() => {});
          throw new Error("Transfer failed. Please try again.");
        }
      } else {
        const amt = parseFloat(bpAmount);
        const name = `${bpRecipient.firstName} ${bpRecipient.lastName}`;
        const senderName = `${userData.firstName} ${userData.lastName}`;
        const baseRecord = {
          amount: amt, type: "debit",
          description: `Send - ${name}`,
          recipientName: name, recipientBank: "BytePay",
          recipientAccount: bpAccNum, isBytepay: true,
          date: serverTimestamp(),
        };

        // Step 1: verify balance — write "declined" if insufficient
        try {
          await runTransaction(db, async (tx) => {
            const snap = await tx.get(doc(db, "users", user.uid));
            if ((snap.data()?.accountBalance ?? 0) < amt)
              throw new Error("Insufficient balance.");
          });
        } catch (err) {
          const isDeclined = err.message === "Insufficient balance.";
          await addDoc(collection(db, "users", user.uid, "transactions"), {
            ...baseRecord, status: isDeclined ? "declined" : "failed",
          }).catch(() => {});
          throw new Error(
            isDeclined
              ? "Transaction declined — insufficient balance."
              : "Transfer failed. Please try again."
          );
        }

        // Step 2: atomic batch — write "failed" if commit errors
        try {
          const batch = writeBatch(db);
          batch.update(doc(db, "users", user.uid), { accountBalance: increment(-amt) });
          batch.update(doc(db, "users", bpRecipient.id), { accountBalance: increment(amt) });
          batch.set(doc(collection(db, "users", user.uid, "transactions")), {
            ...baseRecord, status: "success",
          });
          batch.set(doc(collection(db, "users", bpRecipient.id, "transactions")), {
            amount: amt, type: "credit", status: "success",
            description: `Send - ${senderName}`,
            senderName, senderAccount: userData.accountNumber,
            date: serverTimestamp(),
          });
          await batch.commit();
        } catch {
          await addDoc(collection(db, "users", user.uid, "transactions"), {
            ...baseRecord, status: "failed",
          }).catch(() => {});
          throw new Error("Transfer failed. Please try again.");
        }
      }
      setPinOpen(false); setStatus("success");
    } finally {
      setPinLoading(false);
    }
  };

  const resetAll = () => {
    setBankAccNum(""); setSelectedBank(null); setResolvedName(""); setBankAmount(""); setBankNote(""); setBankStep("account");
    setBpAccNum(""); setBpRecipient(null); setBpAmount("");
    setFormError(""); setStatus(null);
  };

  if (status === "success") {
    return (
      <SuccessScreen
        amount={activeTab==="bytepay" ? bpAmount : bankAmount}
        onHome={() => setLocation("/dashboard")}
      />
    );
  }

  const contactsToShow = contactTab === "BytePay Contacts" ? bytepayContacts : recentContacts;

  /* ════ Amount entry page (full-screen, PalmPay style) ════ */
  if (activeTab === "bank" && bankStep === "amount") {
    const NUMPAD_ROWS = [
      ["1","2","3","⌫"],
      ["4","5","6"],         // Next spans col 4 rows 2-3
      ["7","8","9"],
      ["00","0","."],
    ];
    return (
      <div className="min-h-screen bg-[#F4F2FA] dark:bg-background flex flex-col">
        <div className="max-w-[430px] w-full mx-auto flex flex-col flex-1">

          {/* Header */}
          <header className="px-4 pt-5 pb-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <button onClick={() => setBankStep("account")}
                className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-white -ml-1">
                <ArrowLeft className="h-5 w-5 text-foreground"/>
              </button>
              <h1 className="text-base font-bold text-foreground">Transfer to Bank</h1>
            </div>
          </header>

          {/* Recipient row */}
          <div className="px-4 flex items-center gap-3 mb-3 shrink-0">
            <div className={cn("h-11 w-11 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold", bankBg(selectedBank ?? ""))}>
              {bankInitials(selectedBank ?? "")}
            </div>
            <div>
              <p className="text-sm font-extrabold text-foreground uppercase tracking-wide">{resolvedName}</p>
              <p className="text-xs text-muted-foreground">{selectedBank}({bankAccNum})</p>
            </div>
          </div>

          {/* Amount card */}
          <div className="mx-4 bg-white dark:bg-card rounded-2xl px-4 py-4 mb-3 shadow-sm shrink-0">
            <p className="text-xs text-muted-foreground font-medium mb-2">Amount</p>
            <div className="flex items-center gap-1 mb-3">
              <span className={cn("text-xl font-semibold", bankAmount ? "text-foreground" : "text-muted-foreground/40")}>₦</span>
              <input
                type="text" inputMode="decimal" autoFocus
                placeholder="10.00 - 5,000,000.00"
                value={bankAmount}
                onChange={e => {
                  const v = e.target.value.replace(/[^0-9.]/g,"");
                  if ((v.match(/\./g)||[]).length <= 1) setBankAmount(v);
                }}
                className="flex-1 bg-transparent text-xl font-semibold text-foreground placeholder:text-muted-foreground/40 outline-none"
              />
            </div>
            {/* Preset amounts */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[500,1000,2000,5000,9999,10000].map(a => (
                <button key={a} onClick={() => setBankAmount(String(a))}
                  className={cn("text-sm py-2 rounded-lg border transition-colors",
                    bankAmount===String(a) ? "border-primary bg-primary/10 text-primary font-bold" : "border-border text-foreground")}>
                  {a.toLocaleString()}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Balance: ₦ {(userData?.accountBalance ?? 0).toLocaleString("en-NG",{minimumFractionDigits:2})}, CashBox: ₦ 0.00
            </p>
          </div>

          {/* Note card */}
          <div className="mx-4 bg-white dark:bg-card rounded-2xl px-4 py-3 shadow-sm shrink-0">
            <p className="text-xs text-muted-foreground font-medium mb-1">Note</p>
            <input
              type="text"
              placeholder="What's this for? (Optional)"
              value={bankNote}
              onChange={e => setBankNote(e.target.value)}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none py-1"
            />
          </div>

          <div className="h-28"/>{/* spacer so content doesn't hide behind fixed bar */}

        </div>

        {/* Fixed bottom Next button */}
        <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto px-4 pt-3 bg-[#F4F2FA] dark:bg-background"
          style={{paddingBottom:"calc(env(safe-area-inset-bottom,0px) + 1.5rem)"}}>
          {formError && (
            <p className="text-center text-xs text-red-500 flex items-center justify-center gap-1 mb-2">
              <AlertCircle className="h-3 w-3"/>{formError}
            </p>
          )}
          <button
            onClick={() => { if (validateBank()) setConfirmOpen(true); }}
            className={cn("w-full py-4 rounded-full font-bold text-white text-sm transition-colors",
              bankAmount ? "bg-primary" : "bg-primary/30")}>
            Next
          </button>
        </div>

        <ConfirmSheet
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => { setConfirmOpen(false); setPinOpen(true); }}
          amount={bankAmount}
          recipientName={resolvedName}
          bank={selectedBank ?? ""}
          account={bankAccNum}
          balance={userData?.accountBalance ?? 0}
        />
        <PinModal isOpen={pinOpen} onClose={() => setPinOpen(false)} onConfirm={handlePinConfirm} loading={pinLoading}/>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F2FA] dark:bg-background">
      <div className="max-w-[430px] mx-auto">

        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#F4F2FA] dark:bg-background px-4 pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (activeTab === "bank" && bankStep === "amount") { setBankStep("account"); return; }
                setLocation("/dashboard");
              }}
              className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-white -ml-1">
              <ArrowLeft className="h-5 w-5 text-foreground"/>
            </button>
            <h1 className="text-base font-bold text-foreground">Transfer to Bank</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-white">
              <Activity className="h-5 w-5 text-foreground"/>
            </button>
            <button className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-white">
              <MoreVertical className="h-4 w-4 text-foreground"/>
            </button>
          </div>
        </header>

        <div className="px-4 pb-10 space-y-3">

          {/* ── Main card ── */}
          <div className="bg-white dark:bg-card rounded-2xl shadow-sm overflow-hidden">

            {/* Tabs */}
            <div className="flex border-b border-border/60">
              {[{id:"bank",label:"To Other Bank"},{id:"bytepay",label:"To BytePay"}].map(t => (
                <button key={t.id} onClick={() => switchTab(t.id)}
                  className={cn("flex-1 py-3.5 text-sm font-semibold border-b-2 -mb-px transition-colors",
                    activeTab===t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground")}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ════ To Other Bank — Step 1: account ════ */}
            {activeTab === "bank" && bankStep === "account" && (
              <div className="pb-5">
                <div className="px-5 pt-6">

                  {/* Account number input */}
                  <div className="relative flex items-center mb-1">
                    <input
                      type="text" inputMode="numeric"
                      placeholder="Enter 10-digit Account No."
                      value={fmtAcc(bankAccNum)}
                      onChange={handleBankAccChange}
                      onFocus={() => setShowSuggestions(true)}
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none py-4 pr-8"
                    />
                    {bankAccNum && (
                      <button onClick={clearBankAcc} className="absolute right-0 h-7 w-7 rounded-full bg-secondary/80 flex items-center justify-center">
                        <X className="h-3.5 w-3.5 text-muted-foreground"/>
                      </button>
                    )}
                  </div>
                  <div className="h-px bg-border/60"/>

                  {/* Suggestions dropdown */}
                  <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                      <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}}
                        className="mt-1 mb-2 bg-white dark:bg-card border border-border/60 rounded-xl overflow-hidden shadow-md">
                        {suggestions.map((c,i) => (
                          <button key={i} onClick={() => pickSuggestion(c)}
                            className={cn("w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 text-left transition-colors",
                              i < suggestions.length-1 && "border-b border-border/30")}>
                            <div className={cn("h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold", bankBg(c.bank))}>
                              {bankInitials(c.bank)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                              <p className="text-xs text-muted-foreground">{fmtAcc(c.account)}  {c.bank}</p>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Select Bank row */}
                  <button onClick={() => setBankPickerOpen(true)}
                    className="w-full flex items-center gap-3 py-4">
                    {selectedBank ? (
                      <>
                        <div className={cn("h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold", bankBg(selectedBank))}>
                          {bankInitials(selectedBank)}
                        </div>
                        <span className="flex-1 text-sm font-semibold text-foreground text-left">{selectedBank}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/60 shrink-0"/>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm text-muted-foreground/50 text-left">Select Bank</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/60 shrink-0"/>
                      </>
                    )}
                  </button>
                  <div className="h-px bg-border/60"/>

                  {/* Verified name badge — below the bank HR */}
                  <AnimatePresence>
                    {resolvedName && (
                      <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                        className="mt-3 mb-1 flex items-center gap-2 bg-green-50 dark:bg-green-950/20 border border-green-100 rounded-xl px-3 py-2.5">
                        <ShieldCheck className="h-4 w-4 text-green-600 shrink-0"/>
                        <p className="text-sm font-bold text-green-800 dark:text-green-300">{resolvedName}</p>
                      </motion.div>
                    )}
                    {resolving && (
                      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                        className="mt-3 mb-1 flex items-center gap-2 px-1">
                        <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0"/>
                        <p className="text-sm text-muted-foreground">Verifying account…</p>
                      </motion.div>
                    )}
                    {bankAccNum.length===10 && selectedBank && !resolvedName && !resolving && (
                      <motion.p initial={{opacity:0}} animate={{opacity:1}}
                        className="mt-3 mb-1 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3"/> Could not verify account.
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {!resolvedName && <div className="h-8"/>}

                  <button
                    onClick={() => { if (resolvedName) { setFormError(""); setBankStep("amount"); } else { setFormError("Please enter account number and select bank."); } }}
                    className={cn("w-full py-4 rounded-full font-bold text-white text-sm transition-colors mt-5 mb-3",
                      resolvedName ? "bg-primary" : "bg-primary/30")}>
                    Next
                  </button>
                  <div className="flex items-center justify-center gap-1.5 pb-1">
                    <span className="text-xs font-extrabold text-primary">INSTANT</span>
                    <span className="text-xs text-muted-foreground">| Seamless transfers without delay</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground"/>
                  </div>
                </div>
              </div>
            )}

            {/* ════ To BytePay ════ */}
            {activeTab === "bytepay" && (
              <div className="pb-5">
                <div className="bg-green-50 dark:bg-green-950/20 flex items-center justify-center gap-2 py-3">
                  <span className="text-sm font-extrabold text-green-600">FREE</span>
                  <span className="text-sm text-green-700 dark:text-green-400">No Transfer Fee</span>
                </div>
                <div className="px-5 pt-4">
                  {/* Account input */}
                  <div className="relative mb-1">
                    <input type="text" inputMode="numeric" maxLength={13}
                      placeholder="Enter 10-digit Account No. or Phone No."
                      value={fmtAcc(bpAccNum)} onChange={handleBpAccChange}
                      className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none py-4 pr-8"/>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2">
                      {bpSearching
                        ? <Loader2 className="h-4 w-4 animate-spin text-primary"/>
                        : bpAccNum && <button onClick={() => { setBpAccNum(""); setBpRecipient(null); setBpAmount(""); }}>
                            <X className="h-4 w-4 text-muted-foreground"/>
                          </button>}
                    </div>
                  </div>
                  <div className="h-px bg-border/60 mb-4"/>

                  {/* Recipient resolved */}
                  <AnimatePresence>
                    {bpRecipient && (
                      <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                        className="flex items-center gap-3 mb-4">
                        <div className="h-11 w-11 rounded-full bg-primary flex items-center justify-center shrink-0 text-white text-base font-bold">
                          {`${bpRecipient.firstName?.[0]??''}${bpRecipient.lastName?.[0]??''}`.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{bpRecipient.firstName} {bpRecipient.lastName}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <ShieldCheck className="h-3 w-3 text-green-600"/>
                            <span className="text-xs text-green-600 font-medium">BytePay verified</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    {bpAccNum.length===10 && !bpRecipient && !bpSearching && (
                      <motion.p initial={{opacity:0}} animate={{opacity:1}}
                        className="text-xs text-red-500 flex items-center gap-1 mb-3">
                        <AlertCircle className="h-3 w-3"/> Account not found on BytePay
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Amount + presets */}
                  <AnimatePresence>
                    {bpRecipient && (
                      <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} className="overflow-hidden">
                        <input
                          type="text" inputMode="decimal"
                          placeholder="Enter Amount (₦)"
                          value={bpAmount}
                          onChange={e => {
                            const v = e.target.value.replace(/[^0-9.]/g,"");
                            if ((v.match(/\./g)||[]).length <= 1) setBpAmount(v);
                          }}
                          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none py-4"/>
                        <div className="h-px bg-border/60 mb-3"/>
                        <div className="grid grid-cols-3 gap-2 mb-1">
                          {AMOUNTS.map(a => (
                            <button key={a} onClick={() => setBpAmount(String(a))}
                              className={cn("text-xs py-2.5 rounded-xl border transition-colors",
                                bpAmount===String(a) ? "border-primary bg-primary/10 text-primary font-bold" : "border-border text-foreground")}>
                              ₦{a.toLocaleString()}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Balance: ₦{(userData?.accountBalance??0).toLocaleString("en-NG",{minimumFractionDigits:2})}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!bpRecipient && <div className="h-6"/>}

                  <button onClick={() => { if (validateBytepay()) setBpConfirmOpen(true); }}
                    className={cn("w-full py-4 rounded-full font-bold text-white text-sm transition-colors mt-4 mb-3",
                      bpRecipient && bpAmount ? "bg-primary" : "bg-primary/30")}>
                    Next
                  </button>
                  <div className="flex items-center justify-center gap-1.5 pb-1">
                    <span className="text-xs font-extrabold text-primary">INSTANT</span>
                    <span className="text-xs text-muted-foreground">| Seamless transfers without delay</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground"/>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error (account step only) */}
          {formError && bankStep === "account" && (
            <p className="text-red-500 text-sm bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-xl flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0"/>{formError}
            </p>
          )}

          {/* Success rate monitor — bank tab only */}
          {activeTab === "bank" && bankStep === "account" && (
            <button className="w-full bg-white dark:bg-card rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary"/>
              </div>
              <span className="flex-1 text-sm font-semibold text-foreground text-left">Bank transfer success rate monitor</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground"/>
            </button>
          )}

          {/* Contacts — bank account step or BytePay tab */}
          {(activeTab === "bytepay" || bankStep === "account") && (
            <div className="bg-white dark:bg-card rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center border-b border-border/60 px-4 pt-1">
                {["Recent","Favorites","BytePay Contacts"].map(t => (
                  <button key={t} onClick={() => setContactTab(t)}
                    className={cn("py-2.5 mr-4 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap",
                      contactTab===t ? "border-primary text-primary" : "border-transparent text-muted-foreground")}>
                    {t}
                  </button>
                ))}
                <button className="ml-auto pb-2"><Search className="h-4 w-4 text-muted-foreground"/></button>
              </div>
              {contactsToShow.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <p className="text-sm font-semibold text-foreground">No contacts yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {contactTab==="BytePay Contacts" ? "BytePay users you send to will appear here" : "People you send money to will appear here"}
                  </p>
                </div>
              ) : contactsToShow.map((c,i) => (
                <div key={i} className={i < contactsToShow.length-1 ? "border-b border-border/40" : ""}>
                  <ContactRow contact={c}
                    onClick={() => {
                      if (c.isBytepay) { switchTab("bytepay"); fillBpContact(c); }
                      else { switchTab("bank"); fillBankContact(c); }
                    }}/>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BankPicker open={bankPickerOpen} onClose={() => setBankPickerOpen(false)} onSelect={setSelectedBank}/>

      {/* BytePay confirm sheet */}
      <ConfirmSheet
        open={bpConfirmOpen}
        onClose={() => setBpConfirmOpen(false)}
        onConfirm={() => { setBpConfirmOpen(false); setPinOpen(true); }}
        amount={bpAmount}
        recipientName={bpRecipient ? `${bpRecipient.firstName} ${bpRecipient.lastName}` : ""}
        bank="BytePay"
        account={bpAccNum}
        balance={userData?.accountBalance ?? 0}
        isBytepay
      />

      <PinModal isOpen={pinOpen} onClose={() => setPinOpen(false)} onConfirm={handlePinConfirm} loading={pinLoading}/>
    </div>
  );
}
