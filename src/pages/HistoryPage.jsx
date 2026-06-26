import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, ChevronDown, Download } from "lucide-react";
import {
  RiPhoneLine, RiWifiLine, RiFlashlightLine, RiSendPlaneLine,
  RiArrowDownLine, RiBankLine, RiHistoryLine, RiBarChartBoxLine,
} from "react-icons/ri";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

const CAT_OPTIONS  = ["All Categories", "Transfer", "Airtime", "Data", "Bills", "Credit"];
const STATUS_OPTIONS = ["All Status", "Success", "Pending", "Failed", "Declined"];
const MONTH_NAMES  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const FULL_MONTHS  = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const YEARS        = ["2024","2025","2026","2027"];

const ITEM_H = 52; // px per picker row

function txMeta(tx) {
  const desc = (tx.description ?? "").toLowerCase();
  if (desc.includes("airtime"))                               return { Icon: RiPhoneLine,     bg: "bg-green-500" };
  if (desc.includes("data"))                                  return { Icon: RiWifiLine,       bg: "bg-blue-400" };
  if (desc.includes("electricity") || desc.includes("bill"))  return { Icon: RiFlashlightLine, bg: "bg-yellow-500" };
  if (tx.type === "credit")                                   return { Icon: RiArrowDownLine,  bg: "bg-sky-500" };
  if (desc.includes("send") || desc.includes("transfer") || desc.includes("pos")) return { Icon: RiSendPlaneLine, bg: "bg-primary" };
  return { Icon: RiBankLine, bg: "bg-primary" };
}

function formatAmount(tx) {
  const abs = (tx.amount ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2 });
  return tx.type === "credit" ? `+${abs}` : `-${abs}`;
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

/* ── Scroll-snap column ─────────────────────────────── */
function PickerColumn({ items, selected, onChange }) {
  const ref = useRef(null);
  const VISIBLE = 5;
  const PAD = Math.floor(VISIBLE / 2); // 2 padding items top & bottom

  // Scroll to selected on open / change
  useEffect(() => {
    const idx = items.indexOf(selected);
    if (ref.current && idx >= 0) {
      ref.current.scrollTop = idx * ITEM_H;
    }
  }, [selected, items]);

  const onScroll = () => {
    if (!ref.current) return;
    const idx = Math.round(ref.current.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    if (items[clamped] !== selected) onChange(items[clamped]);
  };

  return (
    <div className="relative flex-1 overflow-hidden" style={{ height: ITEM_H * VISIBLE }}>
      {/* selection highlight band */}
      <div
        className="absolute left-0 right-0 z-10 pointer-events-none rounded-xl bg-secondary/60"
        style={{ top: ITEM_H * PAD, height: ITEM_H }}
      />
      {/* fade top */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none h-16 bg-gradient-to-b from-white dark:from-card to-transparent" />
      {/* fade bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none h-16 bg-gradient-to-t from-white dark:from-card to-transparent" />

      <div
        ref={ref}
        onScroll={onScroll}
        className="h-full overflow-y-scroll"
        style={{ scrollSnapType: "y mandatory", scrollbarWidth: "none" }}
      >
        {/* top padding */}
        {Array.from({ length: PAD }).map((_, i) => (
          <div key={`pt${i}`} style={{ height: ITEM_H, scrollSnapAlign: "start" }} />
        ))}

        {items.map((item) => {
          const isSelected = item === selected;
          return (
            <div
              key={item}
              style={{ height: ITEM_H, scrollSnapAlign: "start" }}
              className={cn(
                "flex items-center justify-center text-base transition-all select-none cursor-pointer",
                isSelected
                  ? "font-extrabold text-foreground text-xl"
                  : "text-muted-foreground/60 font-normal text-sm"
              )}
              onClick={() => {
                onChange(item);
                const idx = items.indexOf(item);
                if (ref.current) ref.current.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
              }}
            >
              {item}
            </div>
          );
        })}

        {/* bottom padding */}
        {Array.from({ length: PAD }).map((_, i) => (
          <div key={`pb${i}`} style={{ height: ITEM_H, scrollSnapAlign: "start" }} />
        ))}
      </div>
    </div>
  );
}

/* ── Month-picker bottom sheet ──────────────────────── */
function MonthPicker({ open, onClose, onConfirm, initialMonth, initialYear }) {
  const [month, setMonth] = useState(initialMonth);
  const [year,  setYear]  = useState(initialYear);

  useEffect(() => { if (open) { setMonth(initialMonth); setYear(initialYear); } }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* backdrop */}
          <motion.div
            key="picker-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
          />
          {/* sheet */}
          <motion.div
            key="picker-sheet"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto z-50 bg-white dark:bg-card rounded-t-3xl"
            style={{paddingBottom:"calc(env(safe-area-inset-bottom,0px) + 1.5rem)"}}
          >
            {/* title */}
            <div className="py-5 text-center">
              <p className="text-base font-bold text-foreground">
                {month} {year}
              </p>
            </div>

            {/* two-column picker */}
            <div className="flex px-4 gap-2">
              <PickerColumn items={MONTH_NAMES} selected={month} onChange={setMonth} />
              <PickerColumn items={YEARS}       selected={year}  onChange={setYear}  />
            </div>

            {/* Cancel / Confirm */}
            <div className="flex items-center mt-4 border-t border-border/40">
              <button onClick={onClose}
                className="flex-1 py-4 text-sm font-semibold text-muted-foreground">
                Cancel
              </button>
              <div className="w-px h-8 bg-border/40" />
              <button onClick={() => { onConfirm(month, year); onClose(); }}
                className="flex-1 py-4 text-sm font-bold text-primary">
                Confirm
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Filter button ──────────────────────────────────── */
function FilterButton({ label, value, isOpen, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-1.5 py-3 text-sm transition-colors",
        value !== label ? "text-primary font-semibold" : "text-muted-foreground"
      )}
    >
      {value} <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")} />
    </button>
  );
}

/* ── Main page ──────────────────────────────────────── */
export default function HistoryPage() {
  const { userData }  = useAuth();
  const [, setLocation] = useLocation();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [catFilter, setCatFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [openFilter,   setOpenFilter]   = useState(null);
  const [pickerOpen,   setPickerOpen]   = useState(false);

  const now = new Date();
  const [selMonth, setSelMonth] = useState(MONTH_NAMES[now.getMonth()]);
  const [selYear,  setSelYear]  = useState(String(now.getFullYear()));

  const headerRef = useRef(null);
  const [headerH, setHeaderH] = useState(0);

  // Measure sticky header height after render / image load
  useEffect(() => {
    const measure = () => {
      if (headerRef.current) setHeaderH(headerRef.current.offsetHeight);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Lock body scroll when dropdown or picker is open
  useEffect(() => {
    document.body.style.overflow = (openFilter || pickerOpen) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [openFilter, pickerOpen]);

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
    const desc = (tx.description ?? "").toLowerCase();
    if (catFilter === "Airtime"  && !desc.includes("airtime"))                               return false;
    if (catFilter === "Data"     && !desc.includes("data"))                                  return false;
    if (catFilter === "Transfer" && !desc.includes("send") && !desc.includes("transfer"))    return false;
    if (catFilter === "Bills"    && !desc.includes("electricity") && !desc.includes("bill")) return false;
    if (catFilter === "Credit"   && tx.type !== "credit")                                    return false;
    if (statusFilter !== "All Status" && tx.status !== statusFilter.toLowerCase())           return false;
    const d = tx.date?.toDate ? tx.date.toDate() : new Date();
    if (MONTH_NAMES[d.getMonth()] !== selMonth)   return false;
    if (String(d.getFullYear())   !== selYear)     return false;
    return true;
  });

  const mIn  = filtered.filter(t => t.type === "credit").reduce((s, t) => s + (t.amount ?? 0), 0);
  const mOut = filtered.filter(t => t.type !== "credit").reduce((s, t) => s + (t.amount ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#F4F2FA] dark:bg-background">
      <div className="max-w-[430px] mx-auto">

        {/* ── Sticky top block ── */}
        <div ref={headerRef} className="sticky top-0 z-50 bg-white dark:bg-card">

          {/* Title row */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setLocation("/dashboard")}
                className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-secondary -ml-1">
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </button>
              <h1 className="text-base font-bold text-foreground">Transaction History</h1>
            </div>
            <button className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Download className="h-4 w-4" /> Download
            </button>
          </div>

          {/* ATM Card banner */}
          <div className="mb-3">
            <img
              src="/atm-banner.png"
              alt="FREE ATM Card"
              className="w-full h-auto block"
              onLoad={() => { if (headerRef.current) setHeaderH(headerRef.current.offsetHeight); }}
            />
          </div>

          {/* Filters */}
          <div className="relative border-t border-border/40">
            <div className="flex items-center">
              <FilterButton label="All Categories" value={catFilter}
                isOpen={openFilter === "cat"}
                onClick={() => setOpenFilter(o => o === "cat" ? null : "cat")} />
              <div className="w-px h-5 bg-border/60 shrink-0" />
              <FilterButton label="All Status" value={statusFilter}
                isOpen={openFilter === "status"}
                onClick={() => setOpenFilter(o => o === "status" ? null : "status")} />
            </div>

            <AnimatePresence>
              {openFilter && (
                <>
                  <motion.div key="filter-backdrop"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40" onClick={() => setOpenFilter(null)} />
                  <motion.div key="filter-dropdown"
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 bg-white dark:bg-card shadow-xl z-50 overflow-hidden border-t border-border/40"
                  >
                    {(openFilter === "cat" ? CAT_OPTIONS : STATUS_OPTIONS).map((opt) => {
                      const current = openFilter === "cat" ? catFilter : statusFilter;
                      return (
                        <button key={opt}
                          onClick={() => { openFilter === "cat" ? setCatFilter(opt) : setStatusFilter(opt); setOpenFilter(null); }}
                          className={cn("w-full text-left px-5 py-3.5 text-sm border-b border-border/30 last:border-0 hover:bg-secondary",
                            opt === current ? "font-bold text-primary bg-primary/5" : "text-foreground"
                          )}>
                          {opt}
                        </button>
                      );
                    })}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>{/* end sticky top block */}

        {/* ── Content ── */}
        <div className="pb-24">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <>
              {/* Month header — always visible so user can always change the date */}
              <div
                className="sticky z-40 bg-white dark:bg-card px-4 pt-4 pb-2 flex items-start justify-between"
                style={{ top: headerH }}
              >
                <div>
                  <button
                    onClick={() => setPickerOpen(true)}
                    className="flex items-center gap-1"
                  >
                    <span className="text-xl font-extrabold text-foreground">{selMonth}</span>
                    <svg width="10" height="7" viewBox="0 0 10 7" className="mt-0.5">
                      <path d="M5 7L0 0h10z" fill="currentColor" className="text-foreground" />
                    </svg>
                  </button>
                  <p className="text-xs text-muted-foreground mt-1">
                    In{" "}
                    <span className="font-bold text-foreground">
                      ₦{mIn.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                    </span>
                    {"    "}Out{" "}
                    <span className="font-bold text-foreground">
                      ₦{mOut.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                    </span>
                  </p>
                </div>
                <button className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mt-1">
                  <RiBarChartBoxLine className="h-3.5 w-3.5" />
                  Monthly Overview
                </button>
              </div>

              {/* Transaction list or empty state */}
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4">
                  <div className="h-16 w-16 rounded-full bg-white dark:bg-card flex items-center justify-center mb-3 shadow-sm">
                    <RiHistoryLine className="text-muted-foreground text-3xl" />
                  </div>
                  <p className="font-semibold text-foreground">No transactions found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {catFilter !== "All Categories" || statusFilter !== "All Status"
                      ? "Try adjusting your filters"
                      : `No activity in ${selMonth} ${selYear}`}
                  </p>
                </div>
              ) : (
                <div className="bg-white dark:bg-card">
                  {filtered.map((tx, i) => {
                    const d = tx.date?.toDate ? tx.date.toDate() : new Date();
                    const dateStr = d.toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" });
                    const timeStr = d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", hour12: true });
                    const { Icon, bg } = txMeta(tx);

                    return (
                      <motion.div key={tx.id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => setLocation(`/transaction/${tx.id}`)}
                        className="flex items-center gap-3 px-4 py-4 cursor-pointer active:bg-gray-50"
                      >
                        <div className={cn("h-12 w-12 rounded-full flex items-center justify-center shrink-0", bg)}>
                          <Icon className="text-2xl text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{tx.description}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{dateStr} {timeStr}</p>
                        </div>
                        <p className="text-xl font-bold text-foreground shrink-0 ml-2">
                          {formatAmount(tx)}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Month picker bottom sheet */}
      <MonthPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={(m, y) => { setSelMonth(m); setSelYear(y); }}
        initialMonth={selMonth}
        initialYear={selYear}
      />
    </div>
  );
}
