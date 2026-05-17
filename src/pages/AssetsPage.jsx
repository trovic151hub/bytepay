import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import PageHeader from "@/components/PageHeader";
import { formatCurrency } from "@/lib/utils";
import { Wallet, PiggyBank, TrendingUp, Shield, ChevronRight } from "lucide-react";
import { Link } from "wouter";

export default function AssetsPage() {
  const { userData } = useAuth();
  const balance = userData?.accountBalance ?? 0;
  const total = balance;

  const assets = [
    { icon: Wallet, label: "Available Balance", value: balance, color: "bg-blue-100 text-blue-600", path: "/dashboard" },
    { icon: PiggyBank, label: "Savings", value: 0, color: "bg-purple-100 text-purple-600", path: "/savings" },
    { icon: TrendingUp, label: "Investments", value: 0, color: "bg-green-100 text-green-600", path: "/savings" },
    { icon: Shield, label: "Insurance", value: 0, color: "bg-orange-100 text-orange-600", path: "/savings" },
  ];

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <div className="max-w-[430px] mx-auto">
        <PageHeader title="Total Assets" />
        <div className="px-4 py-4 space-y-4">
          {/* Total */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white text-center">
            <p className="text-blue-200 text-sm mb-1">Total Net Worth</p>
            <p className="text-4xl font-bold mb-1" data-testid="text-total-assets">{formatCurrency(total)}</p>
            <p className="text-blue-200 text-xs">Across all BytePay products</p>
          </motion.div>

          {/* Breakdown */}
          <div className="bg-white rounded-2xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Asset Breakdown</p>
            <div className="space-y-1">
              {assets.map(({ icon: Icon, label, value, color, path }, i) => (
                <motion.div key={label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                  <Link href={path} className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0 hover:bg-secondary/50 -mx-1 px-1 rounded-xl transition-colors" data-testid={`asset-${label.toLowerCase().replace(/\s/g, "-")}`}>
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{value > 0 ? "Active" : "No active plans"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(value)}</p>
                      <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto mt-0.5" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Allocation visual */}
          <div className="bg-white rounded-2xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Portfolio Allocation</p>
            <div className="h-3 rounded-full bg-secondary overflow-hidden mb-3">
              <div className="h-full bg-primary rounded-full" style={{ width: "100%" }} />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">Wallet balance — 100%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
