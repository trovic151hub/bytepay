import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { doc, updateDoc, collection, addDoc, serverTimestamp, increment } from "firebase/firestore";
import bcrypt from "bcryptjs";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import PageHeader from "@/components/PageHeader";
import PinModal from "@/components/PinModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

const BANKS = ["Access Bank","Citibank","Ecobank","Fidelity Bank","First Bank","FCMB","GTBank","Heritage Bank","Keystone Bank","Polaris Bank","Stanbic IBTC","Sterling Bank","UBA","Union Bank","Unity Bank","Wema Bank","Zenith Bank"];
const AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000];

export default function TransferBankPage() {
  const { user, userData } = useAuth();
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({ accountNumber: "", bank: "", amount: "", narration: "" });
  const [recipientName, setRecipientName] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [formError, setFormError] = useState("");

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleAccChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
    setForm(f => ({ ...f, accountNumber: val }));
    if (val.length === 10) {
      const names = ["John Adebayo", "Fatima Sule", "Chukwuemeka Obi", "Ngozi Williams", "Taiwo Afolabi", "Kemi Oduya"];
      setRecipientName(names[Math.floor(Math.random() * names.length)]);
    } else setRecipientName("");
  };

  const validate = () => {
    if (form.accountNumber.length !== 10) { setFormError("Enter a valid 10-digit account number."); return false; }
    if (!form.bank) { setFormError("Please select a bank."); return false; }
    const amt = parseFloat(form.amount);
    if (!amt || amt < 1) { setFormError("Enter a valid amount."); return false; }
    if (amt > (userData?.accountBalance ?? 0)) { setFormError("Insufficient balance."); return false; }
    setFormError("");
    return true;
  };

  const handleContinue = () => { if (validate()) setPinOpen(true); };

  const handlePinConfirm = async (pin) => {
    const match = await bcrypt.compare(pin, userData.transactionPin);
    if (!match) throw new Error("Incorrect PIN. Try again.");
    setPinLoading(true);
    const amt = parseFloat(form.amount);
    try {
      await updateDoc(doc(db, "users", user.uid), { accountBalance: increment(-amt) });
      await addDoc(collection(db, "users", user.uid, "transactions"), {
        amount: amt, type: "debit", status: "success",
        description: `Sent ${formatCurrency(amt)} to ${recipientName || form.accountNumber} (${form.bank})`,
        date: serverTimestamp(),
      });
      setPinOpen(false);
      setStatus("success");
    } catch {
      throw new Error("Transfer failed. Please try again.");
    } finally {
      setPinLoading(false);
    }
  };

  if (status === "success") {
    return (
      <div className="min-h-screen bg-[#f5f6fa]">
        <div className="max-w-[430px] mx-auto flex flex-col items-center justify-center min-h-screen px-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="text-center">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-1">Transfer Successful</h2>
            <p className="text-muted-foreground mb-1">You sent</p>
            <p className="text-3xl font-bold text-foreground mb-1">{formatCurrency(parseFloat(form.amount))}</p>
            <p className="text-sm text-muted-foreground mb-6">to {recipientName || form.accountNumber} — {form.bank}</p>
            <Button className="w-full mb-3" onClick={() => setLocation("/dashboard")} data-testid="button-back-home">Back to Home</Button>
            <Button variant="outline" className="w-full" onClick={() => { setStatus(null); setForm({ accountNumber: "", bank: "", amount: "", narration: "" }); setRecipientName(""); }} data-testid="button-new-transfer">New Transfer</Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <div className="max-w-[430px] mx-auto">
        <PageHeader title="Send to Bank" />
        <div className="px-4 py-4 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-blue-700">Available balance</span>
            <span className="text-sm font-bold text-blue-800" data-testid="text-available-balance">{formatCurrency(userData?.accountBalance ?? 0)}</span>
          </div>

          <div className="bg-white rounded-2xl p-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Account Number</Label>
              <Input placeholder="10-digit account number" value={form.accountNumber} onChange={handleAccChange} inputMode="numeric" maxLength={10} data-testid="input-account-number" />
              <AnimatePresence>{recipientName && <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-semibold text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" />{recipientName}</motion.p>}</AnimatePresence>
            </div>
            <div className="space-y-1.5">
              <Label>Bank</Label>
              <Select value={form.bank} onChange={set("bank")} data-testid="select-bank">
                <option value="">Select bank</option>
                {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Amount</Label>
              <Input type="number" placeholder="Enter amount" value={form.amount} onChange={set("amount")} min="1" data-testid="input-amount" />
              <div className="flex flex-wrap gap-2 mt-1">
                {AMOUNTS.map(a => (
                  <button key={a} onClick={() => setForm(f => ({ ...f, amount: String(a) }))} className="text-xs px-3 py-1 rounded-full border border-border hover:border-primary hover:text-primary transition-colors" data-testid={`quick-amount-${a}`}>
                    ₦{a.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Narration <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input placeholder="What's it for?" value={form.narration} onChange={set("narration")} data-testid="input-narration" />
            </div>
          </div>

          {formError && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-xl flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" />{formError}</motion.p>}

          <Button className="w-full" size="lg" onClick={handleContinue} data-testid="button-continue">Continue</Button>
        </div>
      </div>
      <PinModal isOpen={pinOpen} onClose={() => setPinOpen(false)} onConfirm={handlePinConfirm} loading={pinLoading} />
    </div>
  );
}
