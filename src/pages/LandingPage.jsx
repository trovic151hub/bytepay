import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { User, ChevronRight } from "lucide-react";
import {
  RiPhoneLine, RiArrowUpDownLine, RiTvLine, RiFlashlightLine,
  RiGift2Line, RiShieldCheckLine, RiCoupon3Line, RiApps2Line,
  RiBankLine, RiUser3Line, RiSafeLine, RiBankCardLine,
  RiBellLine, RiHeadphoneLine,
} from "react-icons/ri";
import BottomNav from "@/components/BottomNav";

const QUICK_ACTIONS = [
  { label: "To Bank",    Icon: RiBankLine,    badge: "0 Fee" },
  { label: "To BytePay", Icon: RiUser3Line },
  { label: "Savings",    Icon: RiSafeLine },
  { label: "ATM Card",   Icon: RiBankCardLine },
];

const SERVICES = [
  { label: "Airtime",      Icon: RiPhoneLine,        bg: "bg-blue-500",   tag: "FREE" },
  { label: "Data",         Icon: RiArrowUpDownLine,  bg: "bg-green-500" },
  { label: "TV",           Icon: RiTvLine,           bg: "bg-sky-500" },
  { label: "Electricity",  Icon: RiFlashlightLine,   bg: "bg-teal-500" },
  { label: "Refer & Earn", Icon: RiGift2Line,        bg: "bg-violet-600" },
  { label: "Insurance",    Icon: RiShieldCheckLine,  bg: "bg-sky-600" },
  { label: "CashBox",      Icon: RiCoupon3Line,      bg: "bg-violet-500" },
  { label: "More",         Icon: RiApps2Line,        bg: "bg-violet-500" },
];

const WEALTH_PRODUCTS = [
  { label: "Mega Monday", desc: "8-Day Fixed Savings", yieldLabel: "Annual Yield", rate: "25.00%", cta: "Save Now", hot: true },
  { label: "CashBox",     desc: "Your Available Balance, Earning for You Daily!", yieldLabel: "Maximum Annual Yield", rate: "20.00%", cta: "₦1 to Start", hot: false },
];

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const goLogin = () => setLocation("/login");

  return (
    <div className="min-h-screen bg-[#F4F2FA] dark:bg-background">
      <div className="max-w-[430px] mx-auto">

        {/* Header */}
        <header className="sticky top-0 z-50 bg-white dark:bg-card px-4 py-3 flex items-center justify-between shadow-sm">
          <button onClick={goLogin} className="flex items-center gap-2.5" data-testid="link-signup-login">
            <div className="h-11 w-11 rounded-full bg-secondary flex items-center justify-center">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-base font-bold text-foreground leading-tight">Sign Up/Login</p>
          </button>
          <div className="flex items-center gap-4">
            <button onClick={goLogin} className="h-6 w-6 flex items-center justify-center text-foreground" data-testid="btn-headphones">
              <RiHeadphoneLine className="h-5 w-5" />
            </button>
            <button onClick={goLogin} className="h-6 w-6 flex items-center justify-center text-foreground" data-testid="btn-notifications">
              <RiBellLine className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="px-4 pb-28 pt-3 space-y-3">

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-2.5">
            {QUICK_ACTIONS.map(({ label, Icon, badge }, i) => (
              <motion.button
                key={label}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={goLogin}
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

          {/* Services */}
          <div className="bg-white dark:bg-card rounded-2xl p-4 shadow-sm">
            <div className="grid grid-cols-4 gap-3">
              {SERVICES.map(({ label, Icon, bg, tag }, i) => (
                <motion.button
                  key={label}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={goLogin}
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

          {/* Wealth Products */}
          <div className="bg-white dark:bg-card rounded-2xl p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              {WEALTH_PRODUCTS.map(({ label, desc, yieldLabel, rate, cta, hot }) => (
                <button key={label} onClick={goLogin} className="relative bg-secondary dark:bg-secondary rounded-2xl p-4 overflow-hidden text-left">
                  {hot && (
                    <span className="absolute top-2.5 -right-7 w-28 rotate-45 bg-orange-500 text-white text-[9px] font-bold text-center py-0.5">
                      HOT
                    </span>
                  )}
                  <p className="font-bold text-primary text-base">{label}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">{desc}</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">{rate}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{yieldLabel}</p>
                  <div className="w-full mt-3 bg-primary text-primary-foreground text-sm font-semibold py-2.5 rounded-full text-center">
                    {cta}
                  </div>
                </button>
              ))}
            </div>
            <button onClick={goLogin} className="flex items-center justify-center gap-1 text-sm text-muted-foreground mt-3 hover:text-primary w-full">
              More Wealth Product <ChevronRight className="h-4 w-4" />
            </button>
          </div>

        </div>
      </div>
      <BottomNav />
    </div>
  );
}
