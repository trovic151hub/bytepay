import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp, increment } from "firebase/firestore";
import bcrypt from "bcryptjs";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import PageHeader from "@/components/PageHeader";
import PinModal from "@/components/PinModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle, AlertCircle, Search } from "lucide-react";
import { useLocation } from "wouter";

const AMOUNTS = [500, 1000, 2000, 5000, 10000];

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

  const searchRecipient = async (val) => {
    if (val.length !== 10) { setRecipient(null); return; }
    setSearching(true);
    try {
      const q = query(collection(db, "users"), where("accountNumber", "==", val));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        setRecipient({ id: d.id, ...d.data() });
      } else setRecipient(null);
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

  const handleContinue = () => { if (validate()) setPinOpen(true); };

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
      setPinOpen(false);
      setStatus("success");
    } catch {
      throw new Error("Transfer failed. Please try again.");
    } finally { setPinLoading(false); }
  };

  if (status === "success") {
    return (
      <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center">
        <div className="max-w-[430px] w-full px-6 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-1">Transfer Successful</h2>
            <p className="text-muted-foreground mb-1">You sent</p>
            <p className="text-3xl font-bold mb-1">{formatCurrency(parseFloat(amount))}</p>
            <p className="text-sm text-muted-foreground mb-6">to {recipient?.firstName} {recipient?.lastName}</p>
            <Button className="w-full mb-3" onClick={() => setLocation("/dashboard")} data-testid="button-back-home">Back to Home</Button>
            <Button variant="outline" className="w-full" onClick={() => { setStatus(null); setAccNum(""); setRecipient(null); setAmount(""); }} data-testid="button-new-transfer">New Transfer</Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <div className="max-w-[430px] mx-auto">
        <PageHeader title="Send to BytePay" />
        <div className="px-4 py-4 space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-2xl px-4 py-3 flex justify-between">
            <span className="text-sm text-purple-700">Available balance</span>
            <span className="text-sm font-bold text-purple-800">{formatCurrency(userData?.accountBalance ?? 0)}</span>
          </div>
          <div className="bg-white rounded-2xl p-4 space-y-4">
            <div className="space-y-1.5">
              <Label>BytePay Account Number</Label>
              <div className="relative">
                <Input placeholder="10-digit account number" value={accNum} onChange={handleAccChange} inputMode="numeric" maxLength={10} className="pr-10" data-testid="input-account-number" />
                {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />}
                {!searching && accNum.length === 10 && <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
              </div>
              <AnimatePresence>
                {recipient && <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-semibold text-green-600 flex items-center gap-1" data-testid="text-recipient-name"><CheckCircle className="h-3 w-3" />{recipient.firstName} {recipient.lastName}</motion.p>}
                {accNum.length === 10 && !recipient && !searching && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-500">Account not found on BytePay</motion.p>}
              </AnimatePresence>
            </div>
            <div className="space-y-1.5">
              <Label>Amount</Label>
              <Input type="number" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} min="1" data-testid="input-amount" />
              <div className="flex flex-wrap gap-2 mt-1">
                {AMOUNTS.map(a => (
                  <button key={a} onClick={() => setAmount(String(a))} className="text-xs px-3 py-1 rounded-full border border-border hover:border-primary hover:text-primary transition-colors" data-testid={`quick-amount-${a}`}>
                    ₦{a.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {formError && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-xl flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" />{formError}</p>}
          <Button className="w-full" size="lg" onClick={handleContinue} data-testid="button-continue">Continue</Button>
        </div>
      </div>
      <PinModal isOpen={pinOpen} onClose={() => setPinOpen(false)} onConfirm={handlePinConfirm} loading={pinLoading} />
    </div>
  );
}
