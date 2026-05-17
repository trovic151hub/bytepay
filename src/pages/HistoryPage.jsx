import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";
import PageHeader from "@/components/PageHeader";
import TransactionItem from "@/components/TransactionItem";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = ["All", "Credit", "Debit"];

function groupByDate(txns) {
  const groups = {};
  txns.forEach((tx) => {
    const d = tx.date?.toDate ? tx.date.toDate() : new Date();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    let label;
    if (d.toDateString() === today.toDateString()) label = "Today";
    else if (d.toDateString() === yesterday.toDateString()) label = "Yesterday";
    else label = d.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
    if (!groups[label]) groups[label] = [];
    groups[label].push(tx);
  });
  return groups;
}

export default function HistoryPage() {
  const { userData } = useAuth();
  const [tab, setTab] = useState("All");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.uid) return;
    const q = query(collection(db, "users", userData.uid, "transactions"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [userData?.uid]);

  const filtered = transactions.filter((tx) => tab === "All" ? true : tx.type === tab.toLowerCase());
  const grouped = groupByDate(filtered);

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <div className="max-w-[430px] mx-auto">
        <PageHeader title="Transaction History" back={false} />

        <div className="px-4 py-4 pb-24 space-y-4">
          {/* Filter tabs */}
          <div className="bg-white rounded-2xl p-1.5 flex gap-1">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={cn("flex-1 py-2 rounded-xl text-sm font-medium transition-all", tab === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                data-testid={`tab-${t.toLowerCase()}`}>
                {t}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center mx-auto mb-3">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground">No transactions</p>
              <p className="text-sm text-muted-foreground mt-1">Your transaction history will appear here</p>
            </div>
          ) : (
            Object.entries(grouped).map(([date, txns]) => (
              <motion.div key={date} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{date}</p>
                {txns.map((tx) => <TransactionItem key={tx.id} transaction={tx} />)}
              </motion.div>
            ))
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
