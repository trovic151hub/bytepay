import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";
import PageHeader from "@/components/PageHeader";
import { Clock, Download, ChevronDown, SlidersHorizontal } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

const STATUS_FILTER = ["All Status", "Success", "Pending", "Failed"];
const CAT_FILTER = ["All Categories", "Transfer", "Airtime", "Data", "Bills"];

function groupByMonth(txns) {
  const groups = {};
  txns.forEach((tx) => {
    const d = tx.date?.toDate ? tx.date.toDate() : new Date();
    const key = d.toLocaleDateString("en-NG", { month: "long", year: "numeric" });
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  });
  return groups;
}

function TxIcon({ type, description }) {
  const desc = (description ?? "").toLowerCase();
  if (desc.includes("airtime")) return <span className="text-lg">📞</span>;
  if (desc.includes("data")) return <span className="text-lg">📶</span>;
  if (desc.includes("electricity") || desc.includes("bill")) return <span className="text-lg">⚡</span>;
  if (type === "credit") return <span className="text-lg">⬇️</span>;
  return <span className="text-lg">🏦</span>;
}

export default function HistoryPage() {
  const { userData } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [catFilter, setCatFilter] = useState("All Categories");

  useEffect(() => {
    if (!userData?.uid) return;
    const q = query(collection(db, "users", userData.uid, "transactions"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [userData?.uid]);

  const filtered = transactions.filter((tx) => {
    if (statusFilter !== "All Status" && tx.status !== statusFilter.toLowerCase()) return false;
    if (catFilter === "Airtime" && !tx.description?.toLowerCase().includes("airtime")) return false;
    if (catFilter === "Data" && !tx.description?.toLowerCase().includes("data")) return false;
    if (catFilter === "Transfer" && !tx.description?.toLowerCase().includes("sent") && !tx.description?.toLowerCase().includes("received")) return false;
    if (catFilter === "Bills" && !tx.description?.toLowerCase().includes("electricity")) return false;
    return true;
  });

  const grouped = groupByMonth(filtered);

  return (
    <div className="min-h-screen bg-[#F4F2FA] dark:bg-background">
      <div className="max-w-[430px] mx-auto">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <PageHeader title="Transaction History" back={false} className="flex-1" />
          <button className="flex items-center gap-1 text-xs text-primary font-semibold">
            <Download className="h-3.5 w-3.5" /> Download
          </button>
        </div>

        <div className="px-4 pb-24 space-y-3">

          {/* Filters */}
          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-between bg-white dark:bg-card rounded-xl px-3 py-2.5 text-sm text-foreground border border-border shadow-sm">
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">{catFilter}</span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button className="flex-1 flex items-center justify-between bg-white dark:bg-card rounded-xl px-3 py-2.5 text-sm text-foreground border border-border shadow-sm">
              <span className="text-xs font-medium">{statusFilter}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-16 w-16 rounded-full bg-white dark:bg-card flex items-center justify-center mx-auto mb-3">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground">No transactions</p>
              <p className="text-sm text-muted-foreground mt-1">Your history will appear here</p>
            </div>
          ) : (
            Object.entries(grouped).map(([month, txns]) => {
              const totalIn = txns.filter((t) => t.type === "credit").reduce((s, t) => s + (t.amount ?? 0), 0);
              const totalOut = txns.filter((t) => t.type === "debit").reduce((s, t) => s + (t.amount ?? 0), 0);

              return (
                <motion.div key={month} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  {/* Month header */}
                  <div className="flex items-center justify-between mb-2 px-1">
                    <button className="flex items-center gap-1 text-sm font-bold text-foreground">
                      {month} <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <div className="flex gap-3 text-xs">
                      <span className="text-muted-foreground">In <span className="font-bold text-green-600">₦{totalIn.toLocaleString()}.00</span></span>
                      <span className="text-muted-foreground">Out <span className="font-bold text-foreground">₦{totalOut.toLocaleString()}.00</span></span>
                    </div>
                  </div>

                  {/* Transactions */}
                  <div className="bg-white dark:bg-card rounded-2xl overflow-hidden shadow-sm">
                    {txns.map((tx, i) => {
                      const d = tx.date?.toDate ? tx.date.toDate() : new Date();
                      const dateStr = d.toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" });
                      const timeStr = d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", hour12: true });

                      return (
                        <div key={tx.id} className={cn("flex items-center gap-3 px-4 py-3.5", i < txns.length - 1 && "border-b border-border/60")}>
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <TxIcon type={tx.type} description={tx.description} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {tx.description?.length > 30 ? tx.description.slice(0, 28) + "..." : tx.description}
                            </p>
                            <p className="text-xs text-muted-foreground">{dateStr} {timeStr}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={cn("text-sm font-bold", tx.type === "credit" ? "text-green-600" : "text-foreground")}>
                              {tx.type === "credit" ? "+" : "-"}{formatCurrency(tx.amount ?? 0)}
                            </p>
                            {tx.type === "credit" && (
                              <p className="text-[10px] text-green-500 font-medium">Successful</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
