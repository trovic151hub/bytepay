import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import BottomNav from "@/components/BottomNav";
import { formatCurrency } from "@/lib/utils";
import { Eye, EyeOff, ChevronRight } from "lucide-react";
import {
  RiQrScanLine, RiSettings3Line, RiShieldCheckLine,
  RiArrowRightSLine, RiPhoneLine, RiWifiLine, RiFlashlightLine,
  RiSendPlaneLine, RiBankLine, RiArrowDownLine,
  RiBriefcaseLine, RiPhoneFindLine, RiLock2Line,
  RiMoonLine, RiSunLine, RiBankCard2Line, RiSafeLine,
} from "react-icons/ri";

function txIcon(tx) {
  const desc = (tx.description ?? "").toLowerCase();
  if (desc.includes("airtime")) return { Icon: RiPhoneLine, bg: "bg-red-100 dark:bg-red-900/30", color: "text-red-500" };
  if (desc.includes("data")) return { Icon: RiWifiLine, bg: "bg-green-100 dark:bg-green-900/30", color: "text-green-600" };
  if (desc.includes("electricity") || desc.includes("bill")) return { Icon: RiFlashlightLine, bg: "bg-yellow-100 dark:bg-yellow-900/30", color: "text-yellow-600" };
  if (tx.type === "credit") return { Icon: RiArrowDownLine, bg: "bg-green-100 dark:bg-green-900/30", color: "text-green-600" };
  if (desc.includes("bytepay")) return { Icon: RiSendPlaneLine, bg: "bg-violet-100 dark:bg-violet-900/30", color: "text-violet-600" };
  return { Icon: RiBankLine, bg: "bg-purple-100 dark:bg-purple-900/30", color: "text-purple-600" };
}

function formatTxDate(tx) {
  const d = tx.date?.toDate ? tx.date.toDate() : new Date();
  return d.toLocaleDateString("en-NG", { month: "short", day: "numeric" }) + ", " +
    d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export default function MePage() {
  const { userData } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [showAssets, setShowAssets] = useState(true);
  const [transactions, setTransactions] = useState([]);

  const initials = userData
    ? `${userData.firstName?.[0] ?? ""}${userData.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";

  useEffect(() => {
    if (!userData?.uid) return;
    const q = query(
      collection(db, "users", userData.uid, "transactions"),
      orderBy("date", "desc"),
      limit(2)
    );
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [userData?.uid]);

  const MENU = [
    { icon: RiBriefcaseLine, label: "My Business Hub", sub: "Receive money for your business now!", arrow: true, bg: "bg-violet-100 dark:bg-violet-900/30", color: "text-violet-600" },
    { icon: RiPhoneFindLine, label: "USSD Service", sub: null, arrow: true, bg: "bg-purple-100 dark:bg-purple-900/30", color: "text-purple-600" },
    { icon: RiLock2Line, label: "Security Center", sub: null, arrow: false, bg: "bg-indigo-100 dark:bg-indigo-900/30", color: "text-indigo-600" },
    { icon: isDark ? RiSunLine : RiMoonLine, label: "Dark Mode", sub: null, toggle: true, bg: "bg-gray-100 dark:bg-gray-800/40", color: "text-gray-500 dark:text-gray-300" },
    { icon: RiBankCard2Line, label: "Banks And Cards", sub: null, arrow: true, bg: "bg-pink-100 dark:bg-pink-900/30", color: "text-pink-500" },
  ];

  return (
    <div className="min-h-screen bg-[#F4F2FA] dark:bg-background">
      <div className="max-w-[430px] mx-auto">

        {/* Header */}
        <header className="sticky top-0 z-50 bg-white dark:bg-card px-4 py-3 flex items-center justify-between shadow-sm">
          <Link href="/profile" className="flex items-center gap-2.5">
            {userData?.profileImg ? (
              <img src={userData.profileImg} alt="avatar" className="h-11 w-11 rounded-full object-cover" />
            ) : (
              <div className="h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-base font-bold">
                {initials}
              </div>
            )}
            <div>
              <p className="text-base font-bold text-foreground leading-tight">
                Hi, {userData?.firstName?.toUpperCase() ?? "USER"}
              </p>
              <div className="flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-full w-fit mt-0.5">
                <RiShieldCheckLine className="text-primary text-xs" />
                <span className="text-[11px] font-semibold text-primary">Tier 3</span>
                <RiArrowRightSLine className="text-primary text-xs" />
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <button className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
              <RiQrScanLine className="text-muted-foreground text-lg" />
            </button>
            <button className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
              <RiSettings3Line className="text-muted-foreground text-lg" />
            </button>
          </div>
        </header>

        <div className="px-4 pt-3 pb-28 space-y-3">

          {/* Total Assets */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-card rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm text-muted-foreground font-medium">Total Assets</span>
                  <button onClick={() => setShowAssets(!showAssets)}>
                    {showAssets
                      ? <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold text-foreground">
                    {showAssets ? formatCurrency(userData?.accountBalance ?? 0) : "₦ •••••"}
                  </p>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground font-medium mb-1">Yesterday's Earnings</p>
                <div className="flex items-center gap-1 justify-end">
                  <p className="text-2xl font-bold text-foreground">₦0</p>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Transaction History preview */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-white dark:bg-card rounded-2xl shadow-sm overflow-hidden">
            <Link href="/history">
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <p className="text-sm font-bold text-foreground">Transaction History</p>
                <RiArrowRightSLine className="text-muted-foreground text-lg" />
              </div>
            </Link>
            {transactions.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4 pb-4">No transactions yet</p>
            ) : (
              <div className="divide-y divide-border/50">
                {transactions.map((tx) => {
                  const { Icon, bg, color } = txIcon(tx);
                  return (
                    <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                      <div className={`h-9 w-9 rounded-full ${bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`text-base ${color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{tx.description ?? "Transaction"}</p>
                        <p className="text-xs text-muted-foreground">{formatTxDate(tx)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-bold ${tx.type === "credit" ? "text-green-600" : "text-foreground"}`}>
                          {tx.type === "credit" ? "+" : "-"}{formatCurrency(tx.amount ?? 0)}
                        </p>
                        <p className={`text-[10px] font-medium ${
                          tx.status === "Failed" ? "text-red-500"
                          : tx.status === "Pending" ? "text-yellow-500"
                          : "text-green-500"
                        }`}>{tx.status ?? "Successful"}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Quick Access */}
          <div>
            <p className="text-base font-bold text-foreground mb-2 px-1">Quick Access</p>
            <div className="grid grid-cols-2 gap-3">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                className="bg-white dark:bg-card rounded-2xl p-4 shadow-sm cursor-pointer active:scale-95 transition-transform">
                <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-2">
                  <RiSafeLine className="text-violet-600 dark:text-violet-300 text-xl" />
                </div>
                <p className="text-sm font-bold text-foreground">CashBox</p>
                <p className="text-xs text-muted-foreground mt-0.5">Available balance with daily interest</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }}
                className="bg-white dark:bg-card rounded-2xl p-4 shadow-sm cursor-pointer active:scale-95 transition-transform">
                <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-2">
                  <RiBankCard2Line className="text-purple-600 dark:text-purple-300 text-xl" />
                </div>
                <p className="text-sm font-bold text-foreground">ATM Card</p>
                <p className="text-xs text-muted-foreground mt-0.5">Cash out easily and spend freely</p>
              </motion.div>
            </div>
          </div>

          {/* Menu list */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            className="bg-white dark:bg-card rounded-2xl shadow-sm overflow-hidden divide-y divide-border/50">
            {MENU.map(({ icon: Icon, label, sub, arrow, toggle, bg, color }) => (
              <div
                key={label}
                onClick={toggle ? toggleTheme : undefined}
                className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-secondary/30 transition-colors"
              >
                <div className={`h-9 w-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`text-lg ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
                </div>
                {toggle ? (
                  <div className={`w-11 h-6 rounded-full flex items-center px-1 transition-colors ${isDark ? "bg-primary" : "bg-gray-200"}`}>
                    <div className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${isDark ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                ) : arrow ? (
                  <RiArrowRightSLine className="text-muted-foreground text-lg shrink-0" />
                ) : null}
              </div>
            ))}
          </motion.div>

        </div>

        <BottomNav />
      </div>
    </div>
  );
}
