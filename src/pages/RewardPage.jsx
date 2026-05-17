import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";
import { ChevronRight, CheckCircle } from "lucide-react";
import {
  RiCoinLine, RiGift2Line, RiUserAddLine, RiShieldCheckLine,
  RiSmartphoneLine, RiMoneyDollarCircleLine, RiTrophyLine,
  RiCheckboxCircleLine, RiLockLine, RiFireLine, RiArrowRightSLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

const TASKS = [
  { Icon: RiShieldCheckLine, bg: "bg-green-100", color: "text-green-600", label: "Complete KYC Verification", points: 500, done: true },
  { Icon: RiSmartphoneLine, bg: "bg-violet-100", color: "text-violet-600", label: "Buy Airtime or Data", points: 50, done: false },
  { Icon: RiMoneyDollarCircleLine, bg: "bg-amber-100", color: "text-amber-600", label: "Send Money to a Bank", points: 100, done: false },
  { Icon: RiUserAddLine, bg: "bg-blue-100", color: "text-blue-600", label: "Refer a Friend", points: 1000, done: false },
  { Icon: RiGift2Line, bg: "bg-pink-100", color: "text-pink-600", label: "Daily Check-in (5-day streak)", points: 25, done: false },
  { Icon: RiMoneyDollarCircleLine, bg: "bg-indigo-100", color: "text-indigo-600", label: "Save ₦5,000 or more", points: 200, done: false },
];

const REWARDS = [
  { Icon: RiSmartphoneLine, label: "₦200 Airtime", points: 500, bg: "bg-red-100", color: "text-red-500" },
  { Icon: RiWifi, label: "1GB Data", points: 750, bg: "bg-green-100", color: "text-green-600" },
  { Icon: RiGift2Line, label: "₦1,000 Cashback", points: 2000, bg: "bg-violet-100", color: "text-violet-600" },
  { Icon: RiTrophyLine, label: "₦5,000 Transfer Fee Waiver", points: 5000, bg: "bg-amber-100", color: "text-amber-600" },
];

function RiWifi(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M1.39 8.56A16.005 16.005 0 0 1 12 4.5c4.13 0 7.9 1.57 10.71 4.14l-1.43 1.43A13.98 13.98 0 0 0 12 6.5c-3.6 0-6.87 1.36-9.38 3.59L1.39 8.56zm3.95 3.95A10.005 10.005 0 0 1 12 9.5a9.98 9.98 0 0 1 6.89 2.74l-1.42 1.42A8.003 8.003 0 0 0 12 11.5c-2.07 0-3.95.79-5.35 2.08l-1.31-1.07zm3.95 3.94A5.005 5.005 0 0 1 12 14.5c1.32 0 2.52.51 3.41 1.34l-1.41 1.41A3.001 3.001 0 0 0 12 16.5a2.99 2.99 0 0 0-1.94.73l-1.76-1.78zM12 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
    </svg>
  );
}

export default function RewardPage() {
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState("Earn");
  const TABS = ["Earn", "Redeem", "History"];

  const totalPoints = 500;
  const level = "Silver";
  const nextLevel = "Gold";
  const progress = 35;

  return (
    <div className="min-h-screen bg-[#F4F2FA] dark:bg-background">
      <div className="max-w-[430px] mx-auto">

        {/* Points hero card */}
        <div className="bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-800 px-4 pt-12 pb-6 text-white">
          <p className="text-purple-200 text-xs font-medium mb-1">BytePoints Balance</p>
          <div className="flex items-end gap-2 mb-3">
            <p className="text-5xl font-black">{totalPoints.toLocaleString()}</p>
            <div className="flex items-center gap-1 pb-1">
              <RiCoinLine className="text-yellow-300 text-xl" />
              <span className="text-purple-200 text-sm">pts</span>
            </div>
          </div>

          {/* Level progress */}
          <div className="bg-white/15 rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <RiTrophyLine className="text-yellow-300 text-base" />
                <span className="text-white text-xs font-bold">{level} Member</span>
              </div>
              <span className="text-purple-200 text-xs">{progress}% to {nextLevel}</span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-yellow-300 to-amber-400 rounded-full"
              />
            </div>
            <p className="text-purple-200 text-[10px] mt-1.5">Earn {5000 - totalPoints} more points to reach {nextLevel}</p>
          </div>
        </div>

        {/* Streak */}
        <div className="mx-4 -mt-3 bg-white dark:bg-card rounded-2xl p-3.5 shadow-sm flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center">
              <RiFireLine className="text-orange-500 text-xl" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">3-day streak!</p>
              <p className="text-xs text-muted-foreground">Check in daily to earn bonus points</p>
            </div>
          </div>
          <button className="bg-primary text-primary-foreground text-xs font-bold px-3 py-2 rounded-xl">
            Check In
          </button>
        </div>

        <div className="px-4 pb-24 space-y-3">

          {/* Tabs */}
          <div className="bg-white dark:bg-card rounded-2xl p-1.5 flex shadow-sm">
            {TABS.map((t) => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={cn("flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all",
                  activeTab === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                {t}
              </button>
            ))}
          </div>

          {activeTab === "Earn" && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase px-1">How to earn</p>
              <div className="bg-white dark:bg-card rounded-2xl overflow-hidden shadow-sm">
                {TASKS.map((task, i) => (
                  <div key={i} className={cn("flex items-center gap-3 px-4 py-3.5", i < TASKS.length - 1 && "border-b border-border/60")}>
                    <div className={`h-10 w-10 rounded-full ${task.bg} flex items-center justify-center shrink-0`}>
                      <task.Icon className={`text-xl ${task.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{task.label}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <RiCoinLine className="text-yellow-500 text-sm" />
                        <p className="text-xs text-muted-foreground font-medium">+{task.points} pts</p>
                      </div>
                    </div>
                    {task.done
                      ? <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                      : <RiArrowRightSLine className="text-muted-foreground text-xl shrink-0" />
                    }
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "Redeem" && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase px-1">Available rewards</p>
              <div className="grid grid-cols-2 gap-3">
                {REWARDS.map((r, i) => (
                  <motion.button key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      "bg-white dark:bg-card rounded-2xl p-4 text-left shadow-sm",
                      totalPoints < r.points && "opacity-60"
                    )}>
                    <div className={`h-12 w-12 rounded-2xl ${r.bg} flex items-center justify-center mb-3`}>
                      <r.Icon className={`text-2xl ${r.color}`} />
                    </div>
                    <p className="text-sm font-bold text-foreground">{r.label}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <RiCoinLine className="text-yellow-500 text-sm" />
                      <p className="text-xs text-muted-foreground font-medium">{r.points.toLocaleString()} pts</p>
                    </div>
                    {totalPoints < r.points ? (
                      <div className="flex items-center gap-1 mt-2">
                        <RiLockLine className="text-muted-foreground text-sm" />
                        <p className="text-[10px] text-muted-foreground">Need {(r.points - totalPoints).toLocaleString()} more</p>
                      </div>
                    ) : (
                      <button className="mt-2 w-full bg-primary text-primary-foreground text-xs font-bold py-1.5 rounded-lg">
                        Redeem
                      </button>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "History" && (
            <div className="bg-white dark:bg-card rounded-2xl shadow-sm overflow-hidden">
              {[
                { label: "KYC Verification Bonus", pts: 500, date: "May 15, 2026", type: "earn" },
                { label: "Daily Check-in Bonus", pts: 25, date: "May 14, 2026", type: "earn" },
                { label: "Daily Check-in Bonus", pts: 25, date: "May 13, 2026", type: "earn" },
              ].map((item, i) => (
                <div key={i} className={cn("flex items-center gap-3 px-4 py-3.5", i < 2 && "border-b border-border/60")}>
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <RiCoinLine className="text-yellow-500 text-xl" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                  </div>
                  <p className="text-sm font-bold text-green-600">+{item.pts} pts</p>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
      <BottomNav />
    </div>
  );
}
