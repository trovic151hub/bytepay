import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { MoreVertical, ChevronRight, ArrowRight } from "lucide-react";
import {
  RiSendPlaneLine, RiBankCardLine, RiBriefcaseLine,
  RiArrowRightSLine, RiCoinLine,
} from "react-icons/ri";
import { toast } from "@/hooks/useToast";

const cs = () => toast({ title: "Coming Soon", description: "This feature is coming soon." });

const TASKS = [
  {
    Icon: RiSendPlaneLine, bg: "bg-blue-100 dark:bg-blue-900/30", color: "text-blue-600",
    label: "Transfer to Bank", sub: "Transaction Amount ≥ ₦3000", progress: "0/1",
  },
  {
    Icon: RiCoinLine, bg: "bg-violet-100 dark:bg-violet-900/30", color: "text-violet-600",
    label: "Standard your pocket n...", sub: "Fast cash for your daily runz", progress: "0/1",
  },
  {
    Icon: RiBriefcaseLine, bg: "bg-indigo-100 dark:bg-indigo-900/30", color: "text-indigo-600",
    label: "Active My Biz Hub", sub: "₦100+ via Biz Account for i...", progress: "0/8",
    badge: "Win iPhone 16 Pro",
  },
  {
    Icon: RiBankCardLine, bg: "bg-purple-100 dark:bg-purple-900/30", color: "text-purple-600",
    label: "Apply ATM Card", sub: "Lowest to ₦499", progress: "Once",
  },
];

function useCountdown() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

export default function RewardPage() {
  const { userData } = useAuth();
  const countdown = useCountdown();

  return (
    <div className="min-h-screen bg-[#F4F2FA] dark:bg-background">
      <div className="max-w-[430px] mx-auto">

        {/* Header */}
        <header className="px-4 pt-12 pb-4 flex items-center justify-between">
          <h1 className="text-2xl font-black text-foreground">Reward</h1>
          <button onClick={cs}><MoreVertical className="h-5 w-5 text-foreground" /></button>
        </header>

        <div className="px-4 pb-28 space-y-3">

          {/* Cashback + Coupons */}
          <div className="flex gap-3">
            <button onClick={cs} className="flex-1 bg-white dark:bg-card rounded-2xl p-4 shadow-sm text-left">
              <p className="text-xs text-muted-foreground mb-1">Cashback</p>
              <div className="flex items-center gap-1">
                <span className="text-lg">🪙</span>
                <p className="text-lg font-black text-foreground">₦0.00</p>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
            <button onClick={cs} className="flex-1 bg-white dark:bg-card rounded-2xl p-4 shadow-sm text-left">
              <p className="text-xs text-muted-foreground mb-1">Coupons</p>
              <div className="flex items-center gap-1">
                <span className="text-lg">🎫</span>
                <p className="text-lg font-black text-foreground">0</p>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
          </div>

          {/* Daily Tasks */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-card rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
              <p className="text-sm font-bold text-foreground">Daily Tasks</p>
              <p className="text-sm font-mono font-bold text-primary">{countdown}</p>
            </div>
            <div className="divide-y divide-border/40">
              {TASKS.map(({ Icon, bg, color, label, sub, progress, badge }) => (
                <div key={label} className="flex items-center gap-3 px-4 py-3.5">
                  <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`text-xl ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {badge && (
                      <span className="text-[9px] font-bold text-white bg-green-500 px-1.5 py-0.5 rounded-sm inline-block mb-0.5">
                        {badge}
                      </span>
                    )}
                    <p className="text-sm font-semibold text-foreground truncate">{label}</p>
                    <p className="text-xs text-primary truncate">{sub} ({progress})</p>
                  </div>
                  <button onClick={cs}
                    className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full shrink-0">
                    Go
                  </button>
                </div>
              ))}
            </div>
            <button onClick={cs} className="w-full flex items-center justify-center gap-1 py-3 text-xs text-muted-foreground border-t border-border/40">
              <span>···</span>
              <RiArrowRightSLine className="text-base" />
            </button>
          </motion.div>

          {/* Promo banner */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="flex gap-3">
            <button onClick={cs} className="flex-1 bg-white dark:bg-card rounded-2xl p-4 shadow-sm flex items-center gap-2">
              <span className="text-2xl">😴</span>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">ready :</p>
              </div>
              <button className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full shrink-0">
                Check Now
              </button>
            </button>
            <button onClick={cs} className="flex-1 bg-gradient-to-br from-green-700 to-green-600 rounded-2xl p-4 shadow-sm">
              <p className="text-white font-black text-xs leading-tight">ROAD TO</p>
              <p className="text-white font-black text-lg leading-tight">₦10M<br/>to be Won!</p>
              <div className="bg-yellow-400 text-yellow-900 font-black text-xs px-3 py-1 rounded-full w-fit mt-2">GO</div>
            </button>
          </motion.div>

          {/* BytePoints legacy section */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            className="bg-white dark:bg-card rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-foreground">BytePoints</p>
              <button onClick={cs} className="flex items-center gap-0.5 text-primary text-xs font-semibold">
                History <RiArrowRightSLine />
              </button>
            </div>
            <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl p-4 text-white">
              <p className="text-purple-200 text-xs mb-1">My Points</p>
              <p className="text-3xl font-black">{userData?.bytePoints ?? 0}</p>
              <div className="flex items-center gap-1 mt-2">
                <RiCoinLine className="text-yellow-300 text-lg" />
                <p className="text-purple-200 text-xs">BytePoints balance</p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
