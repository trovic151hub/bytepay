import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";
import PageHeader from "@/components/PageHeader";
import { Download, ChevronDown, X } from "lucide-react";
import {
  RiPhoneLine, RiWifiLine, RiFlashlightLine, RiSendPlaneLine,
  RiArrowDownLine, RiBankLine, RiMoreLine, RiHistoryLine,
} from "react-icons/ri";
import { cn, formatCurrency } from "@/lib/utils";

const YEARS = ["All Years", "2026", "2025", "2024"];
const STATUS_OPTIONS = ["All Status", "Success", "Pending", "Failed"];
const CAT_OPTIONS = ["All Categories", "Transfer", "Airtime", "Data", "Bills", "Credit"];

function txIcon(tx) {
  const desc = (tx.description ?? "").toLowerCase();
  if (desc.includes("airtime")) return { Icon: RiPhoneLine, bg: "bg-red-100 dark:bg-red-900/30", color: "text-red-500" };
  if (desc.includes("data")) return { Icon: RiWifiLine, bg: "bg-green-100 dark:bg-green-900/30", color: "text-green-600" };
  if (desc.includes("electricity") || desc.includes("bill")) return { Icon: RiFlashlightLine, bg: "bg-yellow-100 dark:bg-yellow-900/30", color: "text-yellow-600" };
  if (tx.type === "credit") return { Icon: RiArrowDownLine, bg: "bg-green-100 dark:bg-green-900/30", color: "text-green-600" };
  if (desc.includes("bytepay")) return { Icon: RiSendPlaneLine, bg: "bg-violet-100 dark:bg-violet-900/30", color: "text-violet-600" };
  return { Icon: RiBankLine, bg: "bg-purple-100 dark:bg-purple-900/30", color: "text-purple-600" };
}

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

function Dropdown({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return (
    <div className="relative flex-1" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium border shadow-sm transition-colors",
          value !== label
            ? "bg-primary/10 border-primary text-primary"
            : "bg-white dark:bg-card border-border text-foreground"
        )}
      >
        <span className="truncate">{value}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 ml-1 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.13 }}
            className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden"
          >
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-secondary",
                  opt === value ? "font-bold text-primary bg-primary/5" : "text-foreground"
                )}
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HistoryPage() {
  const { userData } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [catFilter, setCatFilter] = useState("All Categories");
  const [yearFilter, setYearFilter] = useState("All Years");

  useEffect(() => {
    if (!userData?.uid) return;
    const q = query(collection(db, "users", userData.uid, "transactions"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [userData?.uid]);

  const activeFilters = [
    statusFilter !== "All Status" && statusFilter,
    catFilter !== "All Categories" && catFilter,
    yearFilter !== "All Years" && yearFilter,
  ].filter(Boolean);

  const filtered = transactions.filter((tx) => {
    const desc = (tx.description ?? "").toLowerCase();
    if (statusFilter !== "All Status" && tx.status !== statusFilter.toLowerCase()) return false;
    if (catFilter === "Airtime" && !desc.includes("airtime")) return false;
    if (catFilter === "Data" && !desc.includes("data")) return false;
    if (catFilter === "Transfer" && !desc.includes("sent") && !desc.includes("received")) return false;
    if (catFilter === "Bills" && !desc.includes("electricity") && !desc.includes("bill")) return false;
    if (catFilter === "Credit" && tx.type !== "credit") return false;
    if (yearFilter !== "All Years") {
      const d = tx.date?.toDate ? tx.date.toDate() : new Date();
      if (String(d.getFullYear()) !== yearFilter) return false;
    }
    return true;
  });

  const grouped = groupByMonth(filtered);

  const totalIn = filtered.filter((t) => t.type === "credit").reduce((s, t) => s + (t.amount ?? 0), 0);
  const totalOut = filtered.filter((t) => t.type === "debit").reduce((s, t) => s + (t.amount ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#F4F2FA] dark:bg-background">
      <div className="max-w-[430px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <PageHeader title="Transaction History" back={false} />
          <button className="flex items-center gap-1.5 text-xs text-primary font-semibold bg-primary/10 px-3 py-2 rounded-xl">
            <Download className="h-3.5 w-3.5" /> Download
          </button>
        </div>

        <div className="px-4 pb-24 space-y-3">

          {/* Summary strip */}
          <div className="bg-white dark:bg-card rounded-2xl px-4 py-3 shadow-sm flex items-center justify-between">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Money In</p>
              <p className="text-sm font-bold text-green-600">+{formatCurrency(totalIn)}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Money Out</p>
              <p className="text-sm font-bold text-foreground">-{formatCurrency(totalOut)}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Transactions</p>
              <p className="text-sm font-bold text-foreground">{filtered.length}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <Dropdown label="All Categories" value={catFilter} options={CAT_OPTIONS} onChange={setCatFilter} />
            <Dropdown label="All Status" value={statusFilter} options={STATUS_OPTIONS} onChange={setStatusFilter} />
            <Dropdown label="All Years" value={yearFilter} options={YEARS} onChange={setYearFilter} />
          </div>

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((f) => (
                <button key={f}
                  onClick={() => {
                    if (STATUS_OPTIONS.includes(f)) setStatusFilter("All Status");
                    else if (CAT_OPTIONS.includes(f)) setCatFilter("All Categories");
                    else setYearFilter("All Years");
                  }}
                  className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full"
                >
                  {f} <X className="h-3 w-3" />
                </button>
              ))}
              <button
                onClick={() => { setStatusFilter("All Status"); setCatFilter("All Categories"); setYearFilter("All Years"); }}
                className="text-xs text-muted-foreground px-2 py-1.5 rounded-full hover:bg-secondary"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Body */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-16 w-16 rounded-full bg-white dark:bg-card flex items-center justify-center mx-auto mb-3">
                <RiHistoryLine className="text-muted-foreground text-3xl" />
              </div>
              <p className="font-semibold text-foreground">No transactions found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {activeFilters.length > 0 ? "Try adjusting your filters" : "Your history will appear here"}
              </p>
            </div>
          ) : (
            Object.entries(grouped).map(([month, txns]) => {
              const mIn = txns.filter((t) => t.type === "credit").reduce((s, t) => s + (t.amount ?? 0), 0);
              const mOut = txns.filter((t) => t.type === "debit").reduce((s, t) => s + (t.amount ?? 0), 0);

              return (
                <motion.div key={month} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  {/* Month header */}
                  <div className="flex items-center justify-between mb-2 px-1">
                    <p className="text-sm font-bold text-foreground">{month}</p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground">
                        In <span className="font-bold text-green-600">+{formatCurrency(mIn)}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Out <span className="font-bold text-foreground">-{formatCurrency(mOut)}</span>
                      </span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-card rounded-2xl overflow-hidden shadow-sm">
                    {txns.map((tx, i) => {
                      const d = tx.date?.toDate ? tx.date.toDate() : new Date();
                      const dateStr = d.toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" });
                      const timeStr = d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", hour12: true });
                      const { Icon, bg, color } = txIcon(tx);

                      return (
                        <div
                          key={tx.id}
                          className={cn("flex items-center gap-3 px-4 py-3.5", i < txns.length - 1 && "border-b border-border/60")}
                        >
                          <div className={`h-10 w-10 rounded-full ${bg} flex items-center justify-center shrink-0`}>
                            <Icon className={`text-lg ${color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {tx.description?.length > 32 ? tx.description.slice(0, 30) + "…" : tx.description}
                            </p>
                            <p className="text-[11px] text-muted-foreground">{dateStr} · {timeStr}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={cn("text-sm font-bold", tx.type === "credit" ? "text-green-600" : "text-foreground")}>
                              {tx.type === "credit" ? "+" : "-"}{formatCurrency(tx.amount ?? 0)}
                            </p>
                            <span className={cn(
                              "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                              tx.status === "success" || !tx.status
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : tx.status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-600"
                            )}>
                              {tx.status === "success" || !tx.status ? "Success" : tx.status}
                            </span>
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
