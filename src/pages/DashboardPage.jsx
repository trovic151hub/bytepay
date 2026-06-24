import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import BottomNav from "@/components/BottomNav";
import { formatCurrency } from "@/lib/utils";
import {
  Eye, EyeOff, ChevronRight, ArrowUpRight, ArrowDownLeft, PartyPopper,
  Gift, TrendingUp, Smartphone, CreditCard,
} from "lucide-react";
import {
  RiPhoneLine, RiArrowUpDownLine, RiFootballLine, RiFlashlightLine,
  RiGift2Line, RiShieldCheckLine, RiBookmarkLine, RiApps2Line,
  RiBankLine, RiUser3Line, RiSafeLine, RiBankCardLine,
  RiBellLine, RiHeadphoneLine, RiCheckboxCircleFill, RiArrowRightSLine,
  RiCoinLine,
} from "react-icons/ri";
import Logo from "@/components/Logo";
import { useBalanceVisibility } from "@/hooks/useBalanceVisibility";

const QUICK_ACTIONS = [
  { label: "To Bank",    Icon: RiBankLine,    path: "/transfer/bank",    badge: "0 Fee" },
  { label: "To BytePay", Icon: RiUser3Line,   path: "/transfer/bytepay" },
  { label: "Savings",    Icon: RiSafeLine,    path: "/savings" },
  { label: "ATM Card",   Icon: RiBankCardLine, path: "/assets" },
];

const SERVICES = [
  { label: "Airtime",      path: "/airtime",    Icon: RiPhoneLine,        bg: "bg-blue-500" },
  { label: "Data",         path: "/data",       Icon: RiArrowUpDownLine,  bg: "bg-green-500" },
  { label: "Betting",      path: "/betting",    Icon: RiFootballLine,     bg: "bg-emerald-600" },
  { label: "Electricity",  path: "/electricity",Icon: RiFlashlightLine,   bg: "bg-teal-500" },
  { label: "Refer & Earn", path: "/reward",     Icon: RiGift2Line,        bg: "bg-violet-600" },
  { label: "Insurance",    path: "/dashboard",  Icon: RiShieldCheckLine,  bg: "bg-sky-500", tag: "FREE" },
  { label: "Loan",         path: "/wealth",     Icon: RiBookmarkLine,     bg: "bg-teal-600" },
  { label: "More",         path: "/dashboard",  Icon: RiApps2Line,        bg: "bg-violet-500" },
];

const BANNERS = [
  { Icon: RiCoinLine,         iconBg: "bg-gradient-to-br from-amber-400 to-orange-500", title: "Daily Cash Ready!",     sub: "Turn on CashBox Auto-Save & earn",      cta: "Claim" },
  { Icon: RiPhoneLine,        iconBg: "bg-gradient-to-br from-blue-400 to-indigo-500",  title: "₦100 Free Airtime",     sub: "Always Stay Online",                    cta: "GO" },
  { Icon: RiGift2Line,        iconBg: "bg-gradient-to-br from-rose-400 to-pink-500",    title: "Get ₦1,500 Bonus",      sub: "Refer a friend and earn instantly",     cta: "Invite" },
  { Icon: RiShieldCheckLine,  iconBg: "bg-gradient-to-br from-emerald-400 to-teal-500", title: "Zero transfer fees",    sub: "Send to any BytePay user free",         cta: "Send" },
  { Icon: RiSafeLine,         iconBg: "bg-gradient-to-br from-violet-400 to-purple-500",title: "Earn up to 25% p.a.",   sub: "Lock savings with Mega Monday",         cta: "Save" },
];

const WEALTH_PRODUCTS = [
  { label: "Mega Monday", desc: "8-Day Fixed Savings", yieldLabel: "Annual Yield", rate: "25.00%", cta: "Save Now", hot: true },
  { label: "CashBox",     desc: "Your Available Balance, Earning for You Daily!", yieldLabel: "Maximum Annual Yield", rate: "20.00%", cta: "₦1 to Start", hot: false },
];

const PROMO_SLIDES = [
  {
    bg: "bg-gradient-to-br from-violet-600 to-purple-800",
    content: (
      <>
        <span className="absolute top-0 left-1/2 -translate-x-1/2 bg-yellow-400 text-violet-900 text-[11px] font-extrabold px-4 py-1 rounded-b-xl">Airtime</span>
        <div className="flex items-center gap-3 pt-6 h-full">
          <Gift className="h-9 w-9 text-yellow-200 shrink-0" />
          <p className="flex-1 text-sm font-extrabold text-white leading-snug">
            Save Up to <span className="line-through decoration-2">₦400</span> on Airtime Recharge
          </p>
          <div className="h-11 w-11 rounded-full bg-yellow-400 flex items-center justify-center shrink-0">
            <span className="text-violet-900 font-extrabold text-[11px]">GO</span>
          </div>
        </div>
      </>
    ),
  },
  {
    bg: "bg-gradient-to-br from-blue-50 to-indigo-100",
    content: (
      <div className="flex items-center justify-between h-full gap-3">
        <div>
          <p className="text-xs font-semibold text-indigo-900">Your Asset Challenge Starts Here</p>
          <p className="text-xl font-extrabold text-indigo-950 mt-0.5">₦800 Cash</p>
          <div className="bg-yellow-400 text-indigo-900 text-xs font-bold px-4 py-1.5 rounded-full inline-block mt-1.5">Claim Now</div>
        </div>
        <TrendingUp className="h-12 w-12 text-indigo-300 shrink-0" />
      </div>
    ),
  },
  {
    bg: "bg-gradient-to-br from-violet-600 to-purple-800",
    content: (
      <>
        <span className="absolute top-0 left-1/2 -translate-x-1/2 bg-yellow-400 text-violet-900 text-[11px] font-extrabold px-4 py-1 rounded-b-xl">Airtime</span>
        <div className="flex items-center gap-3 pt-6 h-full">
          <Gift className="h-9 w-9 text-yellow-200 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-extrabold text-white leading-snug">Get ₦100 FREE Airtime</p>
            <p className="text-xs font-semibold text-yellow-300">Always Stay Online</p>
          </div>
          <div className="h-11 w-11 rounded-full bg-yellow-400 flex items-center justify-center shrink-0">
            <span className="text-violet-900 font-extrabold text-[11px]">GO</span>
          </div>
        </div>
      </>
    ),
  },
  {
    bg: "bg-gradient-to-br from-green-600 to-green-800",
    content: (
      <>
        <span className="absolute top-0 right-3 bg-green-900 text-white text-[9px] font-bold italic px-3 py-1 rounded-b-lg">ROAD TO THE TROPHY</span>
        <div className="flex items-center justify-between h-full gap-3 pt-5">
          <div>
            <p className="text-xl font-extrabold text-white leading-tight">₦10,000,000</p>
            <p className="text-xs font-semibold text-green-100">to be Won!</p>
            <div className="bg-yellow-400 text-green-900 text-xs font-bold px-4 py-1.5 rounded-full inline-block mt-1.5">Start Your Bet</div>
          </div>
          <RiFootballLine className="text-5xl text-white/80 shrink-0" />
        </div>
      </>
    ),
  },
  {
    bg: "bg-gradient-to-br from-yellow-300 to-amber-400",
    content: (
      <div className="flex items-center justify-between h-full gap-3">
        <div>
          <p className="text-xs text-foreground/80 leading-snug">
            Every Share <span className="font-extrabold text-foreground">Earn Up To</span>{" "}
            <span className="font-extrabold text-base text-foreground">₦2,500</span>
          </p>
          <p className="text-sm font-bold text-foreground mt-0.5">Both Sides Grab Cash!</p>
          <div className="bg-foreground text-background text-xs font-bold px-4 py-1.5 rounded-full inline-block mt-1.5">Share</div>
        </div>
        <PartyPopper className="h-12 w-12 text-foreground/40 shrink-0" />
      </div>
    ),
  },
  {
    bg: "bg-gradient-to-br from-violet-600 to-purple-900",
    content: (
      <div className="flex items-center justify-between h-full gap-3">
        <div>
          <p className="text-xs font-semibold text-white/90">Your Credit limit is ready:</p>
          <p className="text-xl font-extrabold text-white mt-0.5">₦ ****</p>
          <p className="text-xs font-bold text-yellow-300 mt-1.5">Check Now &gt;</p>
        </div>
        <Smartphone className="h-12 w-12 text-white/40 shrink-0" />
      </div>
    ),
  },
  {
    bg: "bg-gradient-to-br from-violet-700 to-purple-900",
    content: (
      <>
        <span className="absolute top-2 right-3 bg-yellow-400 text-violet-900 text-[9px] font-bold px-2.5 py-1 rounded-full rotate-3">Get A Business Loan</span>
        <div className="flex items-center justify-between h-full gap-3">
          <div>
            <p className="text-sm font-extrabold text-white leading-snug">Stand a Chance to Get an iPhone!</p>
            <p className="text-[11px] text-white/80 mt-0.5">Unlock Low Rates, Big Amounts</p>
            <div className="bg-yellow-400 text-violet-900 text-xs font-bold px-4 py-1.5 rounded-full inline-block mt-1.5">Go Now</div>
          </div>
          <Smartphone className="h-11 w-11 text-white/40 shrink-0" />
        </div>
      </>
    ),
  },
  {
    bg: "bg-gradient-to-br from-yellow-50 to-lime-100",
    content: (
      <>
        <span className="absolute top-0 right-6 bg-orange-300 text-orange-900 text-[9px] font-bold italic px-3 py-1 rounded-b-lg">Special Gift</span>
        <div className="flex items-center justify-between h-full gap-3 pt-4">
          <div>
            <p className="text-base font-extrabold text-foreground">₦300 Off Data</p>
            <p className="text-xs italic text-muted-foreground">Stay connected</p>
            <div className="bg-orange-400 text-white text-xs font-bold px-4 py-1.5 rounded-full inline-block mt-1.5">GO</div>
          </div>
          <Gift className="h-11 w-11 text-orange-300 shrink-0" />
        </div>
      </>
    ),
  },
  {
    bg: "bg-gradient-to-br from-violet-700 to-indigo-950",
    content: (
      <>
        <span className="absolute bottom-1.5 right-3 bg-yellow-400 text-violet-900 text-[8px] font-bold px-2 py-0.5 rounded-full">40K+ Merchants Accepted</span>
        <div className="flex items-center justify-between h-full gap-3">
          <div>
            <p className="text-xs font-semibold text-white/80">Virtual Card</p>
            <p className="text-lg font-extrabold text-lime-400">Only ₦199 TODAY</p>
            <div className="bg-yellow-400 text-violet-900 text-xs font-bold px-4 py-1.5 rounded-full inline-block mt-1.5">Grab Yours</div>
          </div>
          <CreditCard className="h-11 w-11 text-white/40 shrink-0" />
        </div>
      </>
    ),
  },
];

function formatAccountDisplay(acc) {
  if (!acc || acc.length < 10) return acc ?? "—";
  return `${acc.slice(0, 3)}-${acc.slice(3, 6)}-${acc.slice(6)}`;
}

export default function DashboardPage() {
  const { userData } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [showBalance, toggleBalance] = useBalanceVisibility();
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(true);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [promoIdx, setPromoIdx] = useState(0);

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

  useEffect(() => {
    const t = setInterval(() => setPromoIdx((i) => (i + 1) % PROMO_SLIDES.length), 4500);
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
              <div className="h-11 w-11 rounded-full bg-violet-200 dark:bg-violet-900 flex items-center justify-center">
                <RiUser3Line className="text-2xl text-white" />
              </div>
            )}
            <p className="text-base font-bold text-foreground leading-tight">
              Hi, {userData?.firstName?.toUpperCase() ?? "USER"}
            </p>
          </Link>
          <div className="flex items-center gap-4">
            <button className="h-6 w-6 flex items-center justify-center text-foreground" data-testid="btn-headphones">
              <RiHeadphoneLine className="h-5 w-5" />
            </button>
            <button className="relative h-6 w-6 flex items-center justify-center text-foreground" data-testid="btn-notifications">
              <RiBellLine className="h-5 w-5" />
              <span className="absolute -top-2 -right-2.5 bg-red-500 text-white text-[9px] font-bold leading-none px-1 py-0.5 rounded-full">
                99+
              </span>
            </button>
          </div>
        </header>

        <div className="px-4 pb-28 pt-3 space-y-3">

          {/* Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl shadow-sm overflow-hidden"
          >
            <div
              className="bg-violet-100 dark:bg-violet-950/40 p-4 cursor-pointer"
              onClick={() => setLocation("/assets")}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <RiCheckboxCircleFill className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground font-medium">Available Balance</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleBalance(); }}
                    data-testid="btn-toggle-balance"
                  >
                    {showBalance
                      ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                      : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                </div>
                <Link href="/history" onClick={(e) => e.stopPropagation()} className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-primary" data-testid="link-history">
                  Transact...n History <RiArrowRightSLine className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="flex items-end justify-between">
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
                <Link href="/add-money" onClick={(e) => e.stopPropagation()} data-testid="link-add-money">
                  <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold">
                    Add Money
                  </div>
                </Link>
              </div>
            </div>

            <Link href="/assets" className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-card" data-testid="link-assets-account">
              <Logo size="sm" showWordmark={false} />
              <span className="text-xs text-muted-foreground">Account Number</span>
              <span className="text-sm font-bold text-foreground ml-auto" data-testid="text-account-number">
                {formatAccountDisplay(userData?.accountNumber)}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
          </motion.div>

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-2.5">
            {QUICK_ACTIONS.map(({ label, Icon, path, badge }, i) => (
              <motion.button
                key={path}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => setLocation(path)}
                className="relative bg-white dark:bg-card rounded-2xl shadow-sm pt-3 pb-3 flex flex-col items-center gap-1.5 overflow-hidden"
                data-testid={`action-${label.replace(/\s+/g, "-").toLowerCase()}`}
              >
                {badge && (
                  <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[8px] font-bold leading-none px-1.5 py-1 rounded-sm rounded-tl-md">
                    {badge}
                  </span>
                )}
                <Icon className="text-3xl text-primary" />
                <span className="text-[11px] font-medium text-foreground text-center leading-tight">{label}</span>
              </motion.button>
            ))}
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
              {SERVICES.map(({ label, path, Icon, bg, tag }, i) => (
                <motion.button
                  key={label}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setLocation(path)}
                  className="relative flex flex-col items-center gap-1.5"
                  data-testid={`service-${label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {tag && (
                    <span className="absolute -top-1 right-2 bg-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                      {tag}
                    </span>
                  )}
                  <div className={`h-12 w-12 rounded-2xl ${bg} flex items-center justify-center`}>
                    <Icon className="text-2xl text-white" />
                  </div>
                  <span className="text-[11px] text-foreground font-medium text-center leading-tight">{label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Promo Banner */}
          <div className="bg-white dark:bg-card rounded-2xl shadow-sm overflow-hidden">
            <div className="relative h-[76px] overflow-hidden">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.div
                  key={bannerIdx}
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="absolute inset-0 p-4 flex items-center gap-3"
                >
                  {(() => {
                    const { Icon, iconBg, title, sub, cta } = BANNERS[bannerIdx];
                    return (
                      <>
                        <div className={`h-11 w-11 rounded-full ${iconBg} flex items-center justify-center shrink-0`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground">{title}</p>
                          <p className="text-xs text-primary truncate underline">{sub}</p>
                        </div>
                        <button className="shrink-0 border border-primary text-primary text-xs font-semibold px-4 py-1.5 rounded-full">
                          {cta}
                        </button>
                      </>
                    );
                  })()}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex justify-center gap-1.5 pb-2.5">
              {BANNERS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setBannerIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${i === bannerIdx ? "w-5 bg-primary" : "w-1.5 bg-border"}`}
                />
              ))}
            </div>
          </div>

          {/* Wealth Products */}
          <div className="bg-white dark:bg-card rounded-2xl p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              {WEALTH_PRODUCTS.map(({ label, desc, yieldLabel, rate, cta, hot }) => (
                <div key={label} className="relative bg-secondary dark:bg-secondary rounded-2xl p-4 overflow-hidden">
                  {hot && (
                    <span className="absolute top-2.5 -right-7 w-28 rotate-45 bg-orange-500 text-white text-[9px] font-bold text-center py-0.5">
                      HOT
                    </span>
                  )}
                  <p className="font-bold text-primary text-base">{label}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">{desc}</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">{rate}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{yieldLabel}</p>
                  <button className="w-full mt-3 bg-primary text-primary-foreground text-sm font-semibold py-2.5 rounded-full">
                    {cta}
                  </button>
                </div>
              ))}
            </div>
            <Link href="/wealth" className="flex items-center justify-center gap-1 text-sm text-muted-foreground mt-3 hover:text-primary">
              More Wealth Product <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Promo Carousel */}
          <div className="rounded-2xl shadow-sm overflow-hidden">
            <div className="relative h-[104px] overflow-hidden">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.div
                  key={promoIdx}
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className={`absolute inset-0 p-4 ${PROMO_SLIDES[promoIdx].bg}`}
                >
                  {PROMO_SLIDES[promoIdx].content}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex justify-center gap-1.5 py-2.5 bg-white dark:bg-card">
              {PROMO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPromoIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${i === promoIdx ? "w-5 bg-primary" : "w-1.5 bg-border"}`}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
      <BottomNav />
    </div>
  );
}
