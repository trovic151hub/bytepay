import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft } from "lucide-react";
import LogoLoader from "@/components/LogoLoader";
import { RiArrowDownLine } from "react-icons/ri";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";

function ClipboardIllustration() {
  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      <div className="absolute inset-0 rounded-full bg-gray-100/80" />
      <span className="absolute top-8 left-10 h-2 w-2 rounded-full bg-gray-200" />
      <span className="absolute top-12 right-10 h-1.5 w-1.5 rounded-full bg-gray-200" />
      <span className="absolute bottom-10 left-8 h-2 w-2 rounded-full bg-gray-200" />
      <span className="absolute bottom-8 right-12 h-1.5 w-1.5 rounded-full bg-gray-200" />
      <span className="absolute top-14 left-6 h-0.5 w-5 rounded-full bg-gray-300 -rotate-45" />
      <span className="absolute top-10 left-10 h-0.5 w-4 rounded-full bg-gray-300 rotate-90" />
      <span className="absolute bottom-14 right-6 h-0.5 w-5 rounded-full bg-gray-300 rotate-45" />
      <div className="relative z-10 w-32 h-40 bg-gray-200 rounded-2xl flex flex-col items-center pt-3 px-3 shadow-sm">
        <div className="absolute -top-3 w-14 h-5 bg-gray-300 rounded-lg" />
        <div className="mt-6 w-full space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gray-300 shrink-0" />
              <div className="flex-1 h-3 rounded-full bg-gray-300" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FundHistoryPage() {
  const { userData } = useAuth();
  const [, setLocation] = useLocation();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.uid) return;
    const q = query(
      collection(db, "users", userData.uid, "transactions"),
      orderBy("date", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTransactions(all.filter((tx) => tx.type === "credit"));
      setLoading(false);
    });
    return () => unsub();
  }, [userData?.uid]);

  return (
    <div className="min-h-screen bg-[#F4F2FA] dark:bg-background flex flex-col">
      <div className="max-w-[430px] w-full mx-auto flex flex-col flex-1">

        {/* Header */}
        <header className="bg-white dark:bg-card px-4 py-4 flex items-center gap-3 shadow-sm">
          <button onClick={() => setLocation("/topup")} className="text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold text-foreground">Fund History</h1>
        </header>

        <div className="flex-1 px-4 pt-4 pb-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <LogoLoader />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full pt-10">
              <ClipboardIllustration />
              <p className="text-sm text-muted-foreground mt-4">No History</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-card rounded-2xl overflow-hidden shadow-sm">
              {transactions.map((tx, i) => {
                const d = tx.date?.toDate ? tx.date.toDate() : new Date();
                const dateStr = d.toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" });
                const timeStr = d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", hour12: true });

                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`flex items-center gap-3 px-4 py-3.5 ${i < transactions.length - 1 ? "border-b border-border/50" : ""}`}
                  >
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                      <RiArrowDownLine className="text-lg text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{tx.description}</p>
                      <p className="text-[11px] text-muted-foreground">{dateStr} · {timeStr}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-green-600">+{formatCurrency(tx.amount ?? 0)}</p>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Success
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
