import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { doc, updateDoc, addDoc, collection, serverTimestamp, increment } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { RiBankCardLine } from "react-icons/ri";
import { formatCurrency } from "@/lib/utils";

const PRESETS = [200, 1000, 2000, 3000, 5000, 9999];

export default function TopupPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleInput = (e) => {
    setError("");
    const v = e.target.value.replace(/\D/g, "");
    setAmount(v);
  };

  const canSubmit = Number(amount) >= 100 && Number(amount) <= 50000;

  const handleAddMoney = async () => {
    if (!canSubmit || loading) return;
    setError("");
    setLoading(true);
    try {
      const amt = Number(amount);
      await updateDoc(doc(db, "users", user.uid), {
        accountBalance: increment(amt),
      });
      await addDoc(collection(db, "users", user.uid, "transactions"), {
        type: "credit",
        amount: amt,
        description: "Top-up via Card/Account",
        status: "success",
        date: serverTimestamp(),
      });
      setSuccess(true);
      setTimeout(() => setLocation("/dashboard"), 1800);
    } catch {
      setError("Failed to add money. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F2FA] dark:bg-background">
      <div className="max-w-[430px] mx-auto">

        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#F4F2FA] dark:bg-background px-4 pt-6 pb-3 flex items-center justify-between">
          <button onClick={() => setLocation("/add-money")} className="flex items-center gap-2 text-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-base font-semibold">Top-up with Card/Account</span>
          </button>
          <button onClick={() => setLocation("/fund-history")} className="text-primary text-sm font-semibold">History</button>
        </header>

        <div className="px-4 pb-8 space-y-4">

          {/* Fund Method */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Fund Method</p>
            <div className="bg-white dark:bg-card rounded-2xl shadow-sm px-4 py-5 flex items-center justify-center gap-2 cursor-pointer">
              <RiBankCardLine className="text-xl text-primary" />
              <span className="text-sm font-semibold text-primary">Add Bank Card/Account</span>
            </div>
          </div>

          {/* Amount */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Enter or select amount</p>
            <div className="bg-white dark:bg-card rounded-2xl shadow-sm p-4">

              {/* Input row */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg font-bold text-foreground shrink-0">₦</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter 100~50,000"
                  value={amount}
                  onChange={handleInput}
                  disabled={loading || success}
                  className="flex-1 bg-transparent outline-none text-base text-foreground placeholder:text-muted-foreground/60"
                />
                <button
                  onClick={handleAddMoney}
                  disabled={!canSubmit || loading || success}
                  className="shrink-0 text-sm font-semibold px-4 py-2 rounded-xl transition-colors
                    disabled:bg-primary/20 disabled:text-primary/60
                    enabled:bg-primary enabled:text-primary-foreground"
                >
                  {loading ? (
                    <span className="flex items-center gap-1.5">
                      <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Wait...
                    </span>
                  ) : "Add Money"}
                </button>
              </div>

              {/* Preset amounts */}
              <div className="grid grid-cols-3 gap-2.5">
                {PRESETS.map((val) => (
                  <button
                    key={val}
                    onClick={() => { setError(""); setAmount(String(val)); }}
                    disabled={loading || success}
                    className={`py-3 rounded-xl text-sm font-semibold border transition-colors ${
                      Number(amount) === val
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-secondary/50 text-foreground"
                    }`}
                  >
                    ₦{val.toLocaleString()}
                  </button>
                ))}
              </div>

              {error && (
                <p className="text-xs text-red-500 mt-3 text-center">{error}</p>
              )}
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-muted-foreground">
            For amount above ₦9,999,{" "}
            <button onClick={() => setLocation("/add-money")} className="text-primary font-medium">
              use bank transfer now &gt;
            </button>
          </p>

        </div>
      </div>

      {/* Success overlay */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-card rounded-3xl p-8 mx-6 flex flex-col items-center gap-3 shadow-xl"
            >
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-9 w-9 text-green-600" />
              </div>
              <p className="text-lg font-bold text-foreground">Money Added!</p>
              <p className="text-sm text-muted-foreground text-center">
                {formatCurrency(Number(amount))} has been added to your BytePay account.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
