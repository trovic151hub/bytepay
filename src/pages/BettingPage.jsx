import { useState } from "react";
import { motion } from "framer-motion";
import { doc, updateDoc, addDoc, collection, serverTimestamp, increment } from "firebase/firestore";
import bcrypt from "bcryptjs";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import PageHeader from "@/components/PageHeader";
import PinModal from "@/components/PinModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

const PLATFORMS = ["Bet9ja", "SportyBet", "1xBet", "BetKing", "NairaBet", "MerryBet", "AccessBet"];
const AMOUNTS = [500, 1000, 2000, 5000, 10000];

export default function BettingPage() {
  const { user, userData } = useAuth();
  const [, setLocation] = useLocation();
  const [platform, setPlatform] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [formError, setFormError] = useState("");

  const validate = () => {
    if (!platform) { setFormError("Select a betting platform."); return false; }
    if (!customerId.trim()) { setFormError("Enter your customer/user ID."); return false; }
    const amt = parseFloat(amount);
    if (!amt || amt < 100) { setFormError("Minimum top-up is ₦100."); return false; }
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
      await addDoc(collection(db, "users", user.uid, "transactions"), {
        amount: amt, type: "debit", status: "success",
        description: `${platform} top-up for ID: ${customerId}`,
        date: serverTimestamp(),
      });
      setPinOpen(false); setStatus("success");
    } catch { throw new Error("Top-up failed. Try again."); }
    finally { setPinLoading(false); }
  };

  if (status === "success") return (
    <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center px-6">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="text-center max-w-[400px] w-full">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"><CheckCircle className="h-10 w-10 text-green-600" /></div>
        <h2 className="text-2xl font-bold mb-1">Top-up Successful</h2>
        <p className="text-muted-foreground mb-1">{formatCurrency(parseFloat(amount))} credited to</p>
        <p className="text-lg font-semibold mb-1">{platform}</p>
        <p className="text-sm text-muted-foreground mb-6">ID: {customerId}</p>
        <Button className="w-full mb-3" onClick={() => setLocation("/dashboard")} data-testid="button-back-home">Back to Home</Button>
        <Button variant="outline" className="w-full" onClick={() => { setStatus(null); setAmount(""); }} data-testid="button-top-up-again">Top Up Again</Button>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <div className="w-full max-w-[430px] mx-auto">
        <PageHeader title="Betting Top-Up" />
        <div className="px-4 py-4 space-y-4">
          <div className="bg-white rounded-2xl p-4 space-y-4">
            <div className="space-y-2">
              <Label>Betting Platform</Label>
              <div className="grid grid-cols-2 gap-2">
                {PLATFORMS.map((p) => (
                  <button key={p} onClick={() => setPlatform(p)}
                    className={cn("py-3 rounded-xl border-2 text-sm font-semibold transition-all", platform === p ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:border-primary/50")}
                    data-testid={`platform-${p.toLowerCase().replace(/\s/g, "-")}`}>{p}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Customer / User ID</Label>
              <Input placeholder="Enter your betting user ID" value={customerId} onChange={(e) => setCustomerId(e.target.value)} data-testid="input-customer-id" />
            </div>
            <div className="space-y-1.5">
              <Label>Amount</Label>
              <Input type="number" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} data-testid="input-amount" />
              <div className="flex flex-wrap gap-2 mt-1">
                {AMOUNTS.map(a => (
                  <button key={a} onClick={() => setAmount(String(a))} className={cn("text-xs px-3 py-1 rounded-full border transition-colors", amount === String(a) ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary")} data-testid={`quick-amount-${a}`}>₦{a.toLocaleString()}</button>
                ))}
              </div>
            </div>
          </div>
          {formError && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-xl flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" />{formError}</p>}
          <Button className="w-full" size="lg" onClick={() => { if (validate()) setPinOpen(true); }} data-testid="button-continue">Top Up</Button>
        </div>
      </div>
      <PinModal isOpen={pinOpen} onClose={() => setPinOpen(false)} onConfirm={handlePinConfirm} loading={pinLoading} />
    </div>
  );
}
