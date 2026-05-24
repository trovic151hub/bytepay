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
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle, AlertCircle, Copy } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

const DISCOS = ["EKEDC (Eko)", "IKEDC (Ikeja)", "AEDC (Abuja)", "EEDC (Enugu)", "PHED (Port Harcourt)", "IBEDC (Ibadan)", "JEDC (Jos)", "KEDCO (Kano)"];
const AMOUNTS = [1000, 2000, 5000, 10000, 20000];

function genToken() {
  return Array.from({ length: 5 }, () => Math.floor(1000 + Math.random() * 9000)).join("-");
}

export default function ElectricityPage() {
  const { user, userData } = useAuth();
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({ disco: "", meter: "", type: "Prepaid", amount: "" });
  const [token, setToken] = useState("");
  const [copied, setCopied] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [formError, setFormError] = useState("");

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    if (!form.disco) { setFormError("Select a DISCO."); return false; }
    if (form.meter.length < 11) { setFormError("Enter a valid meter number."); return false; }
    const amt = parseFloat(form.amount);
    if (!amt || amt < 1000) { setFormError("Minimum electricity payment is ₦1,000."); return false; }
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
        description: `${form.disco} electricity for meter ${form.meter}`,
        date: serverTimestamp(),
      });
      if (form.type === "Prepaid") setToken(genToken());
      setPinOpen(false); setStatus("success");
    } catch { throw new Error("Payment failed. Try again."); }
    finally { setPinLoading(false); }
  };

  if (status === "success") return (
    <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center px-6">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="text-center max-w-[400px] w-full">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"><CheckCircle className="h-10 w-10 text-green-600" /></div>
        <h2 className="text-2xl font-bold mb-1">Payment Successful</h2>
        <p className="text-muted-foreground mb-3">{formatCurrency(parseFloat(form.amount))} paid to {form.disco}</p>
        {token && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
            <p className="text-xs text-green-700 mb-1">Your Token</p>
            <p className="text-xl font-bold text-green-800 font-mono tracking-widest" data-testid="text-token">{token}</p>
            <button onClick={() => { navigator.clipboard.writeText(token); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="flex items-center gap-1.5 mx-auto mt-2 text-xs text-green-700 hover:text-green-900" data-testid="btn-copy-token">
              {copied ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copied!" : "Copy token"}
            </button>
          </div>
        )}
        <Button className="w-full mb-3" onClick={() => setLocation("/dashboard")} data-testid="button-back-home">Back to Home</Button>
        <Button variant="outline" className="w-full" onClick={() => { setStatus(null); setToken(""); }} data-testid="button-pay-again">Make Another Payment</Button>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <div className="w-full max-w-[430px] mx-auto">
        <PageHeader title="Pay Electricity" />
        <div className="px-4 py-4 space-y-4">
          <div className="bg-white rounded-2xl p-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Distribution Company (DISCO)</Label>
              <Select value={form.disco} onChange={set("disco")} data-testid="select-disco">
                <option value="">Select DISCO</option>
                {DISCOS.map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Meter Number</Label>
              <Input placeholder="11-digit meter number" value={form.meter} onChange={(e) => setForm(f => ({ ...f, meter: e.target.value.replace(/\D/g, "").slice(0, 13) }))} inputMode="numeric" data-testid="input-meter" />
            </div>
            <div className="space-y-2">
              <Label>Meter Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {["Prepaid", "Postpaid"].map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                    className={cn("py-3 rounded-xl border-2 text-sm font-semibold transition-all", form.type === t ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground")}
                    data-testid={`meter-type-${t.toLowerCase()}`}>{t}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Amount</Label>
              <Input type="number" placeholder="Min. ₦1,000" value={form.amount} onChange={set("amount")} data-testid="input-amount" />
              <div className="flex flex-wrap gap-2 mt-1">
                {AMOUNTS.map(a => (
                  <button key={a} onClick={() => setForm(f => ({ ...f, amount: String(a) }))} className={cn("text-xs px-3 py-1 rounded-full border transition-colors", form.amount === String(a) ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary")} data-testid={`quick-amount-${a}`}>₦{a.toLocaleString()}</button>
                ))}
              </div>
            </div>
          </div>
          {formError && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-xl flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" />{formError}</p>}
          <Button className="w-full" size="lg" onClick={() => { if (validate()) setPinOpen(true); }} data-testid="button-continue">Pay Now</Button>
        </div>
      </div>
      <PinModal isOpen={pinOpen} onClose={() => setPinOpen(false)} onConfirm={handlePinConfirm} loading={pinLoading} />
    </div>
  );
}
