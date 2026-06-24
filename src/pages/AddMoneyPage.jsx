import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  Copy, CheckCircle, ChevronRight, Share2,
  HelpCircle, ArrowLeft,
} from "lucide-react";
import {
  RiBankLine, RiBankCardLine, RiArrowDownLine, RiPhoneLine,
  RiShieldCheckLine,
} from "react-icons/ri";
import { MdOutlineAccountBalance } from "react-icons/md";
import { useLocation } from "wouter";

function formatAcc(acc) {
  if (!acc || acc.length < 10) return acc ?? "—";
  return `${acc.slice(0, 3)} ${acc.slice(3, 6)} ${acc.slice(6)}`;
}

const OPTIONS = [
  {
    Icon: RiBankCardLine,
    label: "Cash Deposit",
    sub: "Fund your account with nearby agents",
  },
  {
    Icon: MdOutlineAccountBalance,
    label: "Top-up with Card/Account",
    sub: "Add money from your bank card/account",
    path: "/topup",
  },
  {
    Icon: RiArrowDownLine,
    label: "Receive Money",
    sub: "Share your account and ask for transfer",
  },
  {
    Icon: RiPhoneLine,
    label: "USSD",
    sub: "Use your other bank's USSD code",
  },
];

export default function AddMoneyPage() {
  const { userData } = useAuth();
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(userData?.accountNumber ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = () => {
    const name = `${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`.trim();
    const text = `My BytePay account:\nName: ${name}\nBank: BytePay MFB\nAccount: ${userData?.accountNumber ?? ""}`;
    if (navigator.share) navigator.share({ text });
    else { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div className="min-h-screen bg-[#F4F2FA] dark:bg-background">
      <div className="max-w-[430px] mx-auto">

        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#F4F2FA] dark:bg-background px-4 pt-6 pb-3 flex items-center justify-between">
          <button onClick={() => setLocation("/dashboard")} className="flex items-center gap-2 text-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-lg font-semibold">Add Money</span>
          </button>
          <button className="text-foreground">
            <HelpCircle className="h-5 w-5" />
          </button>
        </header>

        <div className="px-4 pb-8 space-y-3">

          {/* Bank Transfer + Account Card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-card rounded-2xl shadow-sm overflow-hidden">

            {/* Bank Transfer row */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-border/40">
              <div className="h-11 w-11 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                <RiBankLine className="text-xl text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground text-sm">Bank Transfer</p>
                <p className="text-xs text-muted-foreground">FREE Instant bank funding within 10s</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>

            {/* Account Number */}
            <div className="px-4 pt-4 pb-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-muted-foreground">BytePay Account Number</span>
                <div className="flex items-center gap-1 bg-primary/10 text-primary text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  <RiShieldCheckLine className="h-3 w-3" />
                  Tier 3
                  <ChevronRight className="h-3 w-3" />
                </div>
              </div>

              <p className="text-3xl font-black text-foreground tracking-wider mb-5" data-testid="text-account-number">
                {formatAcc(userData?.accountNumber)}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={copy}
                  className="flex items-center justify-center gap-2 bg-violet-100 dark:bg-violet-900/30 text-primary font-bold py-3.5 rounded-2xl text-sm"
                  data-testid="btn-copy-number"
                >
                  {copied
                    ? <><CheckCircle className="h-4 w-4" /> Copied!</>
                    : <><Copy className="h-4 w-4" /> Copy Number</>}
                </button>
                <button
                  onClick={share}
                  className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3.5 rounded-2xl text-sm"
                  data-testid="btn-share-account"
                >
                  <Share2 className="h-4 w-4" />
                  Share Account
                </button>
              </div>
            </div>
          </motion.div>

          {/* OR divider */}
          <p className="text-center text-sm text-muted-foreground font-medium">OR</p>

          {/* Other options — each in its own card */}
          {OPTIONS.map(({ Icon, label, sub, path }, i) => (
            <motion.button
              key={label}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => path && setLocation(path)}
              className="w-full bg-white dark:bg-card rounded-2xl shadow-sm px-4 py-4 flex items-center gap-4"
            >
              <div className="h-11 w-11 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                <Icon className="text-xl text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </motion.button>
          ))}

        </div>
      </div>
    </div>
  );
}
