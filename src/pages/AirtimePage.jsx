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

const NETWORKS = [
  { name: "MTN", color: "bg-yellow-400 text-yellow-900", border: "border-yellow-400" },
  { name: "Airtel", color: "bg-red-500 text-white", border: "border-red-500" },
  { name: "Glo", color: "bg-green-600 text-white", border: "border-green-600" },
  { name: "9mobile", color: "bg-emerald-400 text-white", border: "border-emerald-400" },
];
const AMOUNTS = [50, 100, 200, 500, 1000, 2000];

export default function AirtimePage() {
  const { user, userData } = useAuth();
  const [, setLocation] = useLocation();
  const [network, setNetwork] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [formError, setFormError] = useState("");

  const validate = () => {
    if (!network) { setFormError("Select a network."); return false; }
    if (phone.length < 10) { setFormError("Enter a valid phone number."); return false; }
    const amt = parseFloat(amount);
    if (!amt || amt < 50) { setFormError("Minimum airtime is ₦50."); return false; }
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
        description: `${network} airtime for ${phone}`,
        date: serverTimestamp(),
      });
      setPinOpen(false); setStatus("success");
    } catch { throw new Error("Purchase failed. Try again."); }
    finally { setPinLoading(false); }
  };

  if (status === "success") return (
    <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center px-6">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="text-center max-w-[400px] w-full">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"><CheckCircle className="h-10 w-10 text-green-600" /></div>
        <h2 className="text-2xl font-bold mb-1">Airtime Purchased</h2>
        <p className="text-muted-foreground mb-1">{formatCurrency(parseFloat(amount))} sent to</p>
        <p className="text-lg font-semibold mb-6">{phone} ({network})</p>
        <Button className="w-full mb-3" onClick={() => setLocation("/dashboard")} data-testid="button-back-home">Back to Home</Button>
        <Button variant="outline" className="w-full" onClick={() => { setStatus(null); setAmount(""); setPhone(""); }} data-testid="button-buy-again">Buy Again</Button>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <div className="max-w-[430px] mx-auto">
        <PageHeader title="Buy Airtime" />
        <div className="px-4 py-4 space-y-4">
          <div className="bg-white rounded-2xl p-4 space-y-4">
            <div className="space-y-2">
              <Label>Select Network</Label>
              <div className="grid grid-cols-4 gap-2">
                {NETWORKS.map(({ name, color, border }) => (
                  <button key={name} onClick={() => setNetwork(name)}
                    className={cn("py-2.5 rounded-xl text-xs font-bold border-2 transition-all", network === name ? `${color} ${border}` : "border-border text-foreground hover:border-primary")}
                    data-testid={`network-${name.toLowerCase()}`}>{name}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Phone Number</Label>
              <Input type="tel" placeholder="08012345678" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))} data-testid="input-phone" />
            </div>
            <div className="space-y-1.5">
              <Label>Amount</Label>
              <Input type="number" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} data-testid="input-amount" />
              <div className="grid grid-cols-3 gap-2 mt-1">
                {AMOUNTS.map(a => (
                  <button key={a} onClick={() => setAmount(String(a))} className={cn("py-2 rounded-xl border text-sm font-medium transition-all", amount === String(a) ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:border-primary")} data-testid={`quick-amount-${a}`}>₦{a}</button>
                ))}
              </div>
            </div>
          </div>
          {formError && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-xl flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" />{formError}</p>}
          <Button className="w-full" size="lg" onClick={() => { if (validate()) setPinOpen(true); }} data-testid="button-continue">Buy Airtime</Button>
        </div>
      </div>
      <PinModal isOpen={pinOpen} onClose={() => setPinOpen(false)} onConfirm={handlePinConfirm} loading={pinLoading} />
    </div>
  );
}
