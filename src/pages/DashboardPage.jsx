import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import BottomNav from "@/components/BottomNav";
import { formatCurrency } from "@/lib/utils";
import { Eye, EyeOff, ChevronRight, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import {
  RiPhoneLine, RiWifiLine, RiGamepadLine, RiFlashlightLine,
  RiGift2Line, RiShieldCheckLine, RiMoneyDollarCircleLine, RiMoreLine,
  RiBankLine, RiSendPlaneLine, RiSafeLine, RiAddCircleLine,
  RiBellLine, RiHeadphoneLine, RiShieldLine, RiArrowRightSLine,
  RiSunLine, RiMoonLine,
} from "react-icons/ri";

const QUICK_ACTIONS = [
  { label: "To Bank",    Icon: RiBankLine,       path: "/transfer/bank",    bg: "bg-violet-100 dark:bg-violet-900/40",  iconColor: "text-violet-600 dark:text-violet-300" },
  { label: "To BytePay", Icon: RiSendPlaneLine,  path: "/transfer/bytepay", bg: "bg-purple-100 dark:bg-purple-900/40",  iconColor: "text-purple-600 dark:text-purple-300" },
  { label: "Savings",    Icon: RiSafeLine,       path: "/savings",          bg: "bg-pink-100 dark:bg-pink-900/40",      iconColor: "text-pink-600 dark:text-pink-300" },
  { label: "Add Money",  Icon: RiAddCircleLine,  path: "/add-money",        bg: "bg-indigo-100 dark:bg-indigo-900/40",  iconColor: "text-indigo-600 dark:text-indigo-300" },
];

const SERVICES = [
  { label: "Airtime",      path: "/airtime",    Icon: RiPhoneLine,              bg: "bg-red-100 dark:bg-red-900/30",     iconColor: "text-red-500" },
  { label: "Data",         path: "/data",       Icon: RiWifiLine,               bg: "bg-green-100 dark:bg-green-900/30", iconColor: "text-green-600" },
  { label: "Betting",      path: "/betting",    Icon: RiGamepadLine,            bg: "bg-emerald-100 dark:bg-emerald-900/30", iconColor: "text-emerald-600" },
  { label: "Electricity",  path: "/electricity",Icon: RiFlashlightLine,         bg: "bg-yellow-100 dark:bg-yellow-900/30", iconColor: "text-yellow-600" },
  { label: "Refer & Earn", path: "/dashboard",  Icon: RiGift2Line,              bg: "bg-rose-100 dark:bg-rose-900/30",   iconColor: "text-rose-500" },
  { label: "Insurance",    path: "/dashboard",  Icon: RiShieldCheckLine,        bg: "bg-cyan-100 dark:bg-cyan-900/30",   iconColor: "text-cyan-600" },
  { label: "Loan",         path: "/wealth",     Icon: RiMoneyDollarCircleLine,  bg: "bg-amber-100 dark:bg-amber-900/30", iconColor: "text-amber-600" },
  { label: "More",         path: "/dashboard",  Icon: RiMoreLine,               bg: "bg-gray-100 dark:bg-gray-800/40",   iconColor: "text-gray-500" },
];

const BANNERS = [
  { bg: "from-violet-600 to-purple-700", title: "Earn up to 21% p.a.", sub: "Open a BytePay CashBox today", badge: "New" },
  { bg: "from-purple-600 to-pink-600",   title: "Zero transfer fees",  sub: "Send to any BytePay user free", badge: "Free" },
  { bg: "from-indigo-500 to-violet-600", title: "Daily rewards await", sub: "Check in daily to earn BytePoints", badge: "Rewards" },
];

function formatAccountDisplay(acc) {
  if (!acc || acc.length < 10) return acc ?? "—";
  return `${acc.slice(0, 3)}-${acc.slice(3, 6)}-${acc.slice(6)}`;
}

export default function DashboardPage() {
  const { userData } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [showBalance, setShowBalance] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(true);
  const [bannerIdx, setBannerIdx] = useState(0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const initials = userData
    ? `${userData.firstName?.[0] ?? ""}${userData.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";

  useEffect(() => {
    if (!userData?.uid) return;
    const q = query(
      collection(db, "users", userData.uid, "transactions"),
      orderBy("date", "desc"),
      limit(5)
    );
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setTxLoading(false);
    });
    return () => unsub();
  }, [userData?.uid]);

  useEffect(() => {
    const t = setInterval(() => setBannerIdx((i) => (i + 1) % BANNERS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const lastTx = transactions[0];

  return (
    <div className="min-h-screen bg-[#F4F2FA] dark:bg-background">
      <div className="max-w-[430px] mx-auto">

        {/* Header */}
        <header className="sticky top-0 z-50 bg-white dark:bg-card px-4 py-3 flex items-center justify-between shadow-sm">
          <Link href="/profile" className="flex items-center gap-2.5" data-testid="link-profile">
            {userData?.profileImg ? (
              <img src={userData.profileImg} alt="avatar" className="h-11 w-11 rounded-full object-cover" />
            ) : (
              <div className="h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-base font-bold">
                {initials}
              </div>
            )}
            <div>
              <p className="text-[11px] text-muted-foreground">{greeting},</p>
              <p className="text-base font-bold text-foreground leading-tight">
                Hi, {userData?.firstName?.toUpperCase() ?? "USER"}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <button className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center" data-testid="btn-headphones">
              <RiHeadphoneLine className="h-4 w-4 text-muted-foreground" />
            </button>
            <button className="relative h-9 w-9 rounded-full bg-secondary flex items-center justify-center" data-testid="btn-notifications">
              <RiBellLine className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </header>

        <div className="px-4 pb-28 pt-3 space-y-3">

          {/* Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-card rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <RiShieldLine className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground font-medium">Available Balance</span>
                <button onClick={() => setShowBalance(!showBalance)} data-testid="btn-toggle-balance">
                  {showBalance
                    ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                    : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>
              </div>
              <Link href="/history" className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-primary" data-testid="link-history">
                Transact...n History <RiArrowRightSLine className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="flex items-end justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={showBalance ? "show" : "hide"}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-3xl font-bold text-foreground"
                    data-testid="text-balance"
                  >
                    {showBalance ? formatCurrency(userData?.accountBalance ?? 0) : "₦ •••••"}
                  </motion.p>
                </AnimatePresence>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <Link href="/add-money" data-testid="link-add-money">
                <div className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold">
                  Add Money
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-2 py-2 border-t border-border">
              <div className="h-5 w-5 rounded-full bg-primary/15 flex items-center justify-center">
                <span className="text-[9px] font-bold text-primary">₦</span>
              </div>
              <span className="text-xs text-muted-foreground">Account Number</span>
              <span className="text-sm font-bold text-foreground ml-auto" data-testid="text-account-number">
                {formatAccountDisplay(userData?.accountNumber)}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </motion.div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-card rounded-2xl p-4 shadow-sm">
            <div className="grid grid-cols-4 gap-2">
              {QUICK_ACTIONS.map(({ label, Icon, path, bg, iconColor }, i) => (
                <motion.button
                  key={path}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => setLocation(path)}
                  className="flex flex-col items-center gap-1.5"
                  data-testid={`action-${label.replace(/\s+/g, "-").toLowerCase()}`}
                >
                  <div className={`h-14 w-14 rounded-2xl ${bg} flex items-center justify-center`}>
                    <Icon className={`text-2xl ${iconColor}`} />
                  </div>
                  <span className="text-[11px] font-medium text-foreground text-center leading-tight">{label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Last Transaction */}
          {!txLoading && lastTx && (
            <div className="bg-white dark:bg-card rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${lastTx.type === "credit" ? "bg-green-100" : "bg-violet-100"}`}>
                  {lastTx.type === "credit"
                    ? <ArrowDownLeft className="h-5 w-5 text-green-600" />
                    : <ArrowUpRight className="h-5 w-5 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{lastTx.description}</p>
                  <p className="text-xs text-muted-foreground">{lastTx.status === "success" ? "✓ Success" : lastTx.status}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${lastTx.type === "credit" ? "text-green-600" : "text-foreground"}`}>
                    {lastTx.type === "credit" ? "+" : "-"}{formatCurrency(lastTx.amount)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {lastTx.date?.toDate
                      ? lastTx.date.toDate().toLocaleDateString("en-NG", { month: "short", day: "numeric" })
                      : ""}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Services */}
          <div className="bg-white dark:bg-card rounded-2xl p-4 shadow-sm">
            <div className="grid grid-cols-4 gap-3">
              {SERVICES.map(({ label, path, Icon, bg, iconColor }, i) => (
                <motion.button
                  key={label}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setLocation(path)}
                  className="flex flex-col items-center gap-1.5"
                  data-testid={`service-${label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div className={`h-12 w-12 rounded-2xl ${bg} flex items-center justify-center`}>
                    <Icon className={`text-2xl ${iconColor}`} />
                  </div>
                  <span className="text-[11px] text-foreground font-medium text-center leading-tight">{label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Promo Banner */}
          <div className="rounded-2xl overflow-hidden shadow-sm">
            <AnimatePresence mode="wait">
              <motion.div
                key={bannerIdx}
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3 }}
                className={`bg-gradient-to-r ${BANNERS[bannerIdx].bg} p-4 flex items-center justify-between min-h-[80px]`}
              >
                <div>
                  <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold uppercase">
                    {BANNERS[bannerIdx].badge}
                  </span>
                  <p className="text-white font-bold text-base mt-1">{BANNERS[bannerIdx].title}</p>
                  <p className="text-white/80 text-xs">{BANNERS[bannerIdx].sub}</p>
                </div>
                <div className="h-14 w-14 rounded-full bg-white/15 flex items-center justify-center">
                  <RiGift2Line className="text-white text-3xl" />
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="flex justify-center gap-1.5 py-2 bg-white dark:bg-card">
              {BANNERS.map((_, i) => (
                <button
                  key={i} onClick={() => setBannerIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${i === bannerIdx ? "w-5 bg-primary" : "w-1.5 bg-border"}`}
                />
              ))}
            </div>
          </div>

          {/* CashBox + Target Savings */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/savings" className="bg-white dark:bg-card rounded-2xl p-4 shadow-sm block">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-orange-500 uppercase">NEW</span>
              </div>
              <p className="font-bold text-foreground text-sm">Target Savings</p>
              <p className="text-xs text-muted-foreground mt-0.5">Save Big for Little Dreams</p>
              <p className="text-2xl font-bold text-primary mt-2">₦30,000</p>
            </Link>
            <Link href="/savings" className="bg-white dark:bg-card rounded-2xl p-4 shadow-sm block">
              <p className="font-bold text-foreground text-sm">CashBox</p>
              <p className="text-xs text-muted-foreground mt-0.5">Your Available Balance, Earning for You Daily!</p>
              <p className="text-2xl font-bold text-primary mt-2">20.00%</p>
            </Link>
          </div>

        </div>
      </div>
      <BottomNav />
    </div>
  );
}
