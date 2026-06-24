import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { ChevronRight, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { RiShieldCheckLine } from "react-icons/ri";
import { useLocation } from "wouter";
import { useBalanceVisibility } from "@/hooks/useBalanceVisibility";

const HIDDEN = "•••••";

function AssetRow({ label, value, show, last = false }) {
  return (
    <div className={`flex items-center justify-between py-3.5 px-4 ${!last ? "border-b border-border/40" : ""}`}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-sm text-foreground font-medium">
          {show ? formatCurrency(value) : `₦ ${HIDDEN}`}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    </div>
  );
}

export default function AssetsPage() {
  const { userData } = useAuth();
  const [, setLocation] = useLocation();
  const [show, toggleBalance] = useBalanceVisibility();

  const balance = userData?.accountBalance ?? 0;
  const currentMonth = new Date().toLocaleString("en-US", { month: "long" });
  const expiryDate = "2026/06/30";

  return (
    <div className="min-h-screen bg-[#F4F2FA] dark:bg-background">
      <div className="max-w-[430px] mx-auto">

        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#F4F2FA] dark:bg-background px-4 pt-6 pb-3">
          <button onClick={() => setLocation("/dashboard")} className="flex items-center gap-2 text-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-lg font-semibold">Total Assets</span>
          </button>
        </header>

        <div className="px-4 pb-8 space-y-3">

          {/* Security Guaranteed banner */}
          <div className="bg-green-50 dark:bg-green-950/30 rounded-xl px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RiShieldCheckLine className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700 font-medium">Security Guaranteed</span>
            </div>
            <ChevronRight className="h-4 w-4 text-green-600" />
          </div>

          {/* Total Assets card */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-card rounded-2xl p-5 shadow-sm text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-sm text-muted-foreground">Total Assets</span>
              <button onClick={toggleBalance} className="text-muted-foreground">
                {show ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-4xl font-bold text-foreground mb-3" data-testid="text-total-assets">
              {show ? formatCurrency(balance) : `₦ ${HIDDEN}`}
            </p>
            <div className="inline-flex items-center gap-1 bg-secondary rounded-full px-4 py-1.5">
              <span className="text-xs text-muted-foreground">Yesterday's Earnings :</span>
              <span className="text-xs font-semibold text-primary">{show ? "₦0" : `₦${HIDDEN}`}</span>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            </div>
          </motion.div>

          {/* Month Earnings row */}
          <div className="bg-white dark:bg-card rounded-2xl px-4 py-3.5 shadow-sm flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{currentMonth} Earnings</span>
            <div className="flex items-center gap-1">
              <span className="text-sm text-foreground font-medium">
                {show ? formatCurrency(0) : `₦ ${HIDDEN}`}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>

          {/* Available Balance section */}
          <div>
            <p className="text-base font-bold text-foreground mb-2 px-1">Available Balance</p>
            <div className="bg-white dark:bg-card rounded-2xl shadow-sm overflow-hidden">
              <AssetRow label="Balance" value={balance} show={show} />
              <AssetRow label="CashBox" value={0} show={show} last />
            </div>
          </div>

          {/* Savings section */}
          <div>
            <p className="text-base font-bold text-foreground mb-2 px-1">Savings</p>
            <div className="bg-white dark:bg-card rounded-2xl shadow-sm overflow-hidden">
              <AssetRow label="Target Savings" value={0} show={show} />
              <AssetRow label="Spend & Save" value={0} show={show} />
              <AssetRow label="Fixed Savings" value={0} show={show} />
              <AssetRow label="SafeBox" value={0} show={show} last />
            </div>
          </div>

          {/* BytePoints */}
          <div className="bg-white dark:bg-card rounded-2xl px-4 py-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-foreground">BytePoints</span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-foreground">
                  {show ? formatCurrency(0) : `₦ ${HIDDEN}`}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-xs text-orange-500 mt-1">Your 0 BytePoint will expire on {expiryDate}</p>
          </div>

          {/* Insurance */}
          <div className="bg-white dark:bg-card rounded-2xl px-4 py-3.5 shadow-sm flex items-center justify-between">
            <span className="text-base font-bold text-foreground">Insurance</span>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">
                {show ? "0 Policies Active" : HIDDEN}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
