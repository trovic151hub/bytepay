import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PiggyBank, Lock, TrendingUp, Zap, Target, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";

const PRODUCTS = [
  {
    id: "target", icon: Target, color: "bg-violet-100 text-violet-600", gradientFrom: "from-violet-500", gradientTo: "to-violet-600",
    name: "Target Savings", rate: "10% p.a.", badge: "Flexible",
    desc: "Save towards a specific goal. Set your target and watch your money grow.",
    features: ["No lock-in period", "Earn 10% interest per annum", "Withdraw anytime"],
  },
  {
    id: "fixed", icon: Lock, color: "bg-purple-100 text-purple-600", gradientFrom: "from-purple-500", gradientTo: "to-indigo-600",
    name: "Fixed Savings", rate: "15% p.a.", badge: "Popular",
    desc: "Lock your funds for a fixed period and earn higher interest.",
    features: ["Lock for 30-365 days", "Earn up to 15% interest", "Guaranteed returns"],
  },
  {
    id: "spend", icon: Zap, color: "bg-green-100 text-green-600", gradientFrom: "from-green-500", gradientTo: "to-emerald-600",
    name: "Spend & Save", rate: "8% p.a.", badge: "Automatic",
    desc: "A small percentage of every transaction is automatically saved.",
    features: ["Automated savings", "Earn 8% interest", "Never miss saving again"],
  },
  {
    id: "cashbox", icon: TrendingUp, color: "bg-orange-100 text-orange-600", gradientFrom: "from-orange-500", gradientTo: "to-amber-500",
    name: "CashBox / SmartEarn", rate: "21% p.a.", badge: "Highest Rate",
    desc: "Our highest yield product. Lock your funds for maximum returns.",
    features: ["Up to 21% p.a. returns", "Monthly interest payout", "Min. ₦10,000"],
  },
];

export default function SavingsPage() {
  const { userData } = useAuth();
  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <div className="w-full max-w-[430px] mx-auto">
        <PageHeader title="Savings" back={true} />
        <div className="px-4 pt-4 pb-24 space-y-4">
          {/* Summary Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center"><PiggyBank className="h-5 w-5 text-white" /></div>
              <div>
                <p className="text-indigo-200 text-xs">Total Savings Balance</p>
                <p className="text-2xl font-bold">₦0.00</p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 bg-white/10 rounded-xl p-3">
                <p className="text-white/70 text-xs mb-0.5">Active Plans</p>
                <p className="text-white font-bold text-lg">0</p>
              </div>
              <div className="flex-1 bg-white/10 rounded-xl p-3">
                <p className="text-white/70 text-xs mb-0.5">Interest Earned</p>
                <p className="text-white font-bold text-lg">₦0.00</p>
              </div>
            </div>
          </motion.div>

          <p className="text-sm font-semibold text-foreground">Choose a Savings Plan</p>

          {PRODUCTS.map(({ id, icon: Icon, color, gradientFrom, gradientTo, name, rate, badge, desc, features }, i) => (
            <motion.div key={id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <Card className="overflow-hidden">
                <div className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} p-4 flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{name}</p>
                      <p className="text-white/80 text-xs">{rate}</p>
                    </div>
                  </div>
                  <Badge className="bg-white/20 text-white border-0 text-xs">{badge}</Badge>
                </div>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground mb-3">{desc}</p>
                  <ul className="space-y-1.5 mb-4">
                    {features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-foreground">
                        <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                          <Shield className="h-2.5 w-2.5 text-green-600" />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant="outline" data-testid={`btn-start-${id}`}>
                    Start Saving — Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
