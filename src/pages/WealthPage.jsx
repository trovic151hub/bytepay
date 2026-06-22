import { useState } from "react";
import { motion } from "framer-motion";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Star, CheckCircle, Calendar, Send, Zap, Award, ChevronRight } from "lucide-react";

const TASKS = [
  { id: "transfer", icon: Send, label: "Transfer to a bank account", points: 50, desc: "Make at least one bank transfer" },
  { id: "airtime", icon: Zap, label: "Buy airtime", points: 20, desc: "Purchase airtime for any network" },
  { id: "electricity", icon: Zap, label: "Pay electricity bill", points: 30, desc: "Pay any DISCO electricity bill" },
  { id: "profile", icon: Award, label: "Complete your profile", points: 25, desc: "Add a profile photo" },
];

export default function WealthPage() {
  const { user, userData } = useAuth();
  const [claimed, setClaimed] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);

  const points = userData?.bytePoints ?? 0;
  const lastClaim = userData?.lastCheckIn?.toDate ? userData.lastCheckIn.toDate() : null;
  const today = new Date().toDateString();
  const alreadyClaimed = lastClaim?.toDateString() === today;

  const handleCheckIn = async () => {
    if (alreadyClaimed || claimLoading) return;
    setClaimLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        bytePoints: increment(10),
        lastCheckIn: new Date(),
      });
      setClaimed(true);
    } finally { setClaimLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <div className="max-w-[430px] mx-auto">
        <PageHeader title="Rewards" back={false} />
        <div className="px-4 pt-4 pb-24 space-y-4">
          {/* Points balance */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-amber-200 text-xs">BytePoints Balance</p>
                  <p className="text-3xl font-bold" data-testid="text-points">{points}</p>
                </div>
              </div>
              <Badge className="bg-white/20 text-white border-0">Tier: Bronze</Badge>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <div className="flex justify-between text-xs text-white/80 mb-1">
                <span>Progress to Silver</span><span>{points}/500 pts</span>
              </div>
              <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all" style={{ width: `${Math.min((points / 500) * 100, 100)}%` }} />
              </div>
            </div>
          </motion.div>

          {/* Daily Check-in */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Daily Check-In</p>
                  <p className="text-xs text-muted-foreground">Earn 10 BytePoints every day</p>
                </div>
                <Badge variant="success">+10 pts</Badge>
              </div>
              <Button
                className="w-full"
                disabled={alreadyClaimed || claimed || claimLoading}
                onClick={handleCheckIn}
                variant={alreadyClaimed || claimed ? "outline" : "default"}
                data-testid="button-check-in"
              >
                {claimLoading ? (
                  <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Claiming...</span>
                ) : alreadyClaimed || claimed ? (
                  <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Already claimed today</span>
                ) : "Claim Daily Points"}
              </Button>
            </CardContent>
          </Card>

          {/* Tasks */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Earn More Points</p>
            <div className="space-y-2">
              {TASKS.map(({ id, icon: Icon, label, points: pts, desc }) => (
                <motion.div key={id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl p-4 flex items-center gap-3" data-testid={`task-${id}`}>
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-bold text-amber-600">+{pts} pts</p>
                    <ChevronRight className="h-4 w-4 text-muted-foreground mt-0.5 ml-auto" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Coupons */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Coupons</p>
            <div className="bg-white rounded-2xl p-6 text-center">
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-2">
                <Gift className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No coupons yet</p>
              <p className="text-xs text-muted-foreground mt-1">Complete tasks to earn coupons and discounts</p>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
