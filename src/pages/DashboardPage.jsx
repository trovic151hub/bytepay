import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";
import TransactionItem from "@/components/TransactionItem";
import { formatCurrency } from "@/lib/utils";
import { Eye, EyeOff, Bell, Headphones, ChevronRight, Send, ArrowDownLeft, Plus, CreditCard, Phone, Wifi, Zap, Gamepad2, PiggyBank, TrendingUp, Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Badge } from "@/components/ui/badge";

const QUICK_ACTIONS = [
  { label: "Send to Bank", icon: Send, path: "/transfer/bank", color: "bg-blue-100 text-blue-600" },
  { label: "Send to BytePay", icon: ArrowDownLeft, path: "/transfer/bytepay", color: "bg-purple-100 text-purple-600" },
  { label: "Add Money", icon: Plus, path: "/add-money", color: "bg-green-100 text-green-600" },
  { label: "Pay Bills", icon: CreditCard, path: "/airtime", color: "bg-orange-100 text-orange-600" },
];

const SERVICES = [
  { label: "Airtime", icon: Phone, path: "/airtime", color: "bg-red-100 text-red-500" },
  { label: "Data", icon: Wifi, path: "/data", color: "bg-blue-100 text-blue-500" },
  { label: "Electricity", icon: Zap, path: "/electricity", color: "bg-yellow-100 text-yellow-600" },
  { label: "Betting", icon: Gamepad2, path: "/betting", color: "bg-green-100 text-green-600" },
  { label: "Savings", icon: PiggyBank, path: "/savings", color: "bg-indigo-100 text-indigo-600" },
  { label: "Invest", icon: TrendingUp, path: "/assets", color: "bg-teal-100 text-teal-600" },
];

const BANNERS = [
  { bg: "from-blue-600 to-indigo-700", title: "Earn up to 21% p.a.", sub: "Open a BytePay CashBox today", badge: "New" },
  { bg: "from-purple-600 to-pink-600", title: "Send money for free", sub: "Zero fees on BytePay transfers", badge: "Free" },
  { bg: "from-emerald-500 to-teal-600", title: "Daily rewards await", sub: "Check in daily to earn BytePoints", badge: "Rewards" },
];

export default function DashboardPage() {
  const { userData } = useAuth();
  const [, setLocation] = useLocation();
  const [showBalance, setShowBalance] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(true);
  const [bannerIdx, setBannerIdx] = useState(0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    if (!userData?.uid) return;
    const q = query(collection(db, "users", userData.uid, "transactions"), orderBy("date", "desc"), limit(5));
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

  const { isDark, toggleTheme } = useTheme();
  const initials = userData ? `${userData.firstName?.[0] ?? ""}${userData.lastName?.[0] ?? ""}`.toUpperCase() : "?";

  return (
    <div className="min-h-screen bg-background dark:bg-background">
      <div className="max-w-[430px] mx-auto">

        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm px-4 py-3 flex items-center justify-between border-b border-border">
          <Link href="/profile" className="flex items-center gap-2.5" data-testid="link-profile">
            {userData?.profileImg ? (
              <img src={userData.profileImg} alt="avatar" className="h-9 w-9 rounded-full object-cover ring-2 ring-primary/20" />
            ) : (
              <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">{initials}</div>
            )}
            <div>
              <p className="text-xs text-muted-foreground leading-none">{greeting}</p>
              <p className="text-sm font-semibold text-foreground leading-snug">{userData?.firstName ?? "User"}</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center" data-testid="btn-toggle-theme" aria-label="Toggle dark mode">
              {isDark ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
            </button>
            <button className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center" data-testid="btn-headphones"><Headphones className="h-4 w-4 text-muted-foreground" /></button>
            <button className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center relative" data-testid="btn-notifications">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>
          </div>
        </header>

        <div className="px-4 pb-24 pt-4 space-y-5">

          {/* Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-blue-200 text-xs font-medium">Available Balance</span>
                  <button onClick={() => setShowBalance(!showBalance)} data-testid="btn-toggle-balance">
                    {showBalance ? <EyeOff className="h-3.5 w-3.5 text-blue-200" /> : <Eye className="h-3.5 w-3.5 text-blue-200" />}
                  </button>
                </div>
                <AnimatePresence mode="wait">
                  <motion.p key={showBalance ? "show" : "hide"} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    className="text-3xl font-bold tracking-tight" data-testid="text-balance">
                    {showBalance ? formatCurrency(userData?.accountBalance ?? 0) : "₦ • • • • • •"}
                  </motion.p>
                </AnimatePresence>
              </div>
              <Link href="/assets" className="flex items-center gap-1 text-blue-200 text-xs hover:text-white transition-colors" data-testid="link-assets">
                My Assets <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-white/20">
              <div>
                <p className="text-blue-200 text-xs mb-0.5">Account No.</p>
                <p className="text-white font-semibold text-sm" data-testid="text-account-number">{userData?.accountNumber ?? "—"}</p>
              </div>
              <Link href="/add-money" data-testid="link-add-money">
                <div className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors px-3 py-1.5 rounded-xl text-sm text-white font-medium">
                  <Plus className="h-3.5 w-3.5" /> Add Money
                </div>
              </Link>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-3">
            {QUICK_ACTIONS.map(({ label, icon: Icon, path, color }, i) => (
              <motion.button key={path} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => setLocation(path)}
                className="flex flex-col items-center gap-2" data-testid={`action-${label.replace(/\s+/g, "-").toLowerCase()}`}>
                <div className={`h-12 w-12 rounded-2xl ${color} flex items-center justify-center shadow-sm`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-foreground text-center leading-tight">{label}</span>
              </motion.button>
            ))}
          </div>

          {/* Promo Banner */}
          <div className="overflow-hidden rounded-2xl">
            <AnimatePresence mode="wait">
              <motion.div key={bannerIdx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className={`bg-gradient-to-r ${BANNERS[bannerIdx].bg} p-4 flex items-center justify-between`}>
                <div>
                  <Badge className="bg-white/20 text-white border-0 mb-1 text-xs">{BANNERS[bannerIdx].badge}</Badge>
                  <p className="text-white font-bold text-base">{BANNERS[bannerIdx].title}</p>
                  <p className="text-white/80 text-xs mt-0.5">{BANNERS[bannerIdx].sub}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="flex justify-center gap-1.5 py-2 bg-white">
              {BANNERS.map((_, i) => (
                <button key={i} onClick={() => setBannerIdx(i)} className={`h-1.5 rounded-full transition-all ${i === bannerIdx ? "w-5 bg-primary" : "w-1.5 bg-border"}`} />
              ))}
            </div>
          </div>

          {/* Services */}
          <div className="bg-white rounded-2xl p-4">
            <p className="text-sm font-semibold text-foreground mb-3">Services</p>
            <div className="grid grid-cols-3 gap-3">
              {SERVICES.map(({ label, icon: Icon, path, color }, i) => (
                <motion.button key={path} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  onClick={() => setLocation(path)}
                  className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-secondary transition-colors"
                  data-testid={`service-${label.toLowerCase()}`}>
                  <div className={`h-11 w-11 rounded-2xl ${color} flex items-center justify-center`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs text-foreground font-medium">{label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">Recent Transactions</p>
              <Link href="/history" className="text-xs text-primary font-medium hover:underline" data-testid="link-view-all">View all</Link>
            </div>
            {txLoading ? (
              <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-2">
                  <CreditCard className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No transactions yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Make your first transfer to get started</p>
              </div>
            ) : (
              <div>{transactions.map((tx) => <TransactionItem key={tx.id} transaction={tx} />)}</div>
            )}
          </div>

        </div>
      </div>
      <BottomNav />
    </div>
  );
}
