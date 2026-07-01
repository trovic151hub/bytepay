import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowLeft, ChevronRight, MoreVertical, CheckCircle, CreditCard } from "lucide-react";
import { toast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import {
  RiSafe2Line, RiLightbulbLine, RiFocus3Line, RiSafe3Line,
  RiCoinLine, RiLockLine, RiArrowRightSLine,
} from "react-icons/ri";

const FLEXIBLE = [
  {
    Icon: RiSafe2Line,
    name: "CashBox",
    desc: "Available balance earns daily interest, up to 20% p.a.",
  },
  {
    Icon: RiLightbulbLine,
    name: "SmartEarn",
    desc: "15.18% p.a. with safety & 24/7 access",
  },
];

const SMART = [
  {
    Icon: RiFocus3Line,
    name: "Target Savings",
    desc: "Save daily, weekly or monthly to your goal",
  },
  {
    Icon: RiSafe3Line,
    name: "Fixed Savings",
    desc: "Save for a fixed term and earn more",
  },
  {
    Icon: RiCoinLine,
    name: "Spend & Save",
    desc: "Save a little every time you spend",
  },
  {
    Icon: RiLockLine,
    name: "SafeBox",
    desc: "Set free withdrawal days for disciplined saving",
  },
];

const FUNDS = [
  { rank: 1, name: "ARM MONEY MARKET FUND", ret: "+17.21%", rankColor: "text-amber-500" },
  { rank: 2, name: "ARM ETHICAL FUND",       ret: "+79.56%", rankColor: "text-gray-400" },
  { rank: 3, name: "ARM FIXED INCOME FUND",  ret: "+15.46%", rankColor: "text-amber-700" },
];

const FUND_TABS = ["Most Held", "Hot Weekly Purchases", "Weekly Return Ranking"];

const cs = (label) => () => toast({ title: "Coming Soon", description: `${label} is coming soon.` });

function SavingsCard({ Icon, name, desc, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="bg-white dark:bg-card rounded-2xl p-4 shadow-sm cursor-pointer active:scale-95 transition-transform flex flex-col"
    >
      <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center mb-3 shrink-0">
        <Icon className="text-xl text-primary" />
      </div>
      <p className="text-sm font-bold text-foreground">{name}</p>
      <p className="text-xs text-muted-foreground mt-1 mb-4 flex-1 leading-relaxed">{desc}</p>
      <button className="flex items-center gap-0.5 text-primary text-xs font-semibold">
        Save Now <RiArrowRightSLine className="text-sm" />
      </button>
    </motion.div>
  );
}

export default function SavingsPage() {
  const [fundTab, setFundTab] = useState("Most Held");

  return (
    <div className="min-h-screen bg-[#F0EFFA] dark:bg-background">
      <div className="max-w-[430px] mx-auto">

        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#F0EFFA] dark:bg-background px-4 pt-10 pb-3 flex items-center justify-between">
          <button onClick={() => window.history.back()} className="text-foreground">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <button onClick={cs("Options")}><MoreVertical className="h-5 w-5 text-foreground" /></button>
        </header>

        <div className="px-4 pb-28 space-y-5">

          {/* CashBox hero */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-card rounded-2xl p-5 pt-11 shadow-sm relative overflow-hidden">

            {/* Pill — card's overflow-hidden clips the left corners to give a tab effect */}
            <span className="absolute top-1 left-1 text-primary font-bold text-sm px-4 py-1 rounded-tl-lg rounded-br-lg bg-primary/5">
              CashBox
            </span>

            {/* Subtitle */}
            <p className="text-xs text-muted-foreground text-right mb-2">Your available balance with Interest!</p>

            {/* Rate */}
            <p className="text-5xl font-black text-green-500 text-center mt-2">20.00%</p>
            <p className="text-sm text-muted-foreground text-center mt-1 mb-5">Maximum Annual Yield</p>

            {/* Save button */}
            <button
              onClick={cs("CashBox Saving")}
              className="w-full bg-primary text-primary-foreground py-4 rounded-full font-bold text-base mb-5"
            >
              Save
            </button>

            {/* Feature row */}
            <div className="flex divide-x divide-border/50">
              <div className="flex-1 flex items-center gap-2.5 pr-4">
                <CheckCircle className="h-7 w-7 text-foreground shrink-0" strokeWidth={1.5} />
                <div>
                  <p className="text-xs font-bold text-foreground">Transfer & Pay</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">Pay like your BytePay Balance</p>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2.5 pl-4">
                <CreditCard className="h-7 w-7 text-foreground shrink-0" strokeWidth={1.5} />
                <div>
                  <p className="text-xs font-bold text-foreground">24/7 Access</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">Withdraw Anytime</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Flexible Savings */}
          <div>
            <p className="text-base font-bold text-foreground mb-3 px-1">Flexible Savings</p>
            <div className="grid grid-cols-2 gap-3">
              {FLEXIBLE.map((item) => (
                <SavingsCard key={item.name} {...item} onClick={cs(item.name)} />
              ))}
            </div>
          </div>

          {/* Smart Savings */}
          <div>
            <p className="text-base font-bold text-foreground mb-3 px-1">Smart Savings</p>
            <div className="grid grid-cols-2 gap-3">
              {SMART.map((item) => (
                <SavingsCard key={item.name} {...item} onClick={cs(item.name)} />
              ))}
            </div>
          </div>

          {/* Top Mutual Funds */}
          <div className="bg-white dark:bg-card rounded-3xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <p className="text-sm font-bold text-foreground">Top Mutual Funds</p>
              <button onClick={cs("Mutual Funds")} className="flex items-center gap-0.5 text-primary text-xs font-semibold">
                More <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
              {FUND_TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setFundTab(t)}
                  className={cn(
                    "whitespace-nowrap text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-colors shrink-0",
                    fundTab === t
                      ? "border-primary text-primary bg-primary/5"
                      : "border-border text-muted-foreground"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Fund rows */}
            <div className="divide-y divide-border/40">
              {FUNDS.map(({ rank, name, ret, rankColor }) => (
                <div key={name} className="flex items-center gap-3 px-4 py-4">
                  <span className={cn("text-base font-black w-5 shrink-0", rankColor)}>{rank}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground leading-tight">{name}</p>
                    <p className="text-xs text-green-600 font-semibold mt-0.5">{ret} 1Y Return</p>
                  </div>
                  <button
                    onClick={cs("Mutual Funds")}
                    className="bg-primary text-primary-foreground text-xs font-bold px-5 py-2 rounded-full shrink-0"
                  >
                    Invest
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
