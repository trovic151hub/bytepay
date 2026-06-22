import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import PageHeader from "@/components/PageHeader";
import { Copy, CheckCircle, ChevronRight, Share2, Building2, CreditCard, ArrowDownLeft, Phone } from "lucide-react";

const OPTIONS = [
  { icon: "💵", label: "Cash Deposit", sub: "Fund your account with nearby agents" },
  { icon: "💳", label: "Top-up with Card/Account", sub: "Add money from your bank card/account" },
  { icon: "⬇️", label: "Receive Money", sub: "Share your account and ask for transfer" },
  { icon: "#️⃣", label: "USSD", sub: "Use your other bank's USSD code" },
];

function formatAccDisplay(acc) {
  if (!acc || acc.length < 10) return acc ?? "—";
  return `${acc.slice(0, 3)} ${acc.slice(3, 6)} ${acc.slice(6)}`;
}

export default function AddMoneyPage() {
  const { userData } = useAuth();
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
        <PageHeader title="Add Money" right={
          <button className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-xl">
            FAQ
          </button>
        } />

        <div className="px-4 py-4 space-y-3">

          {/* Bank Transfer Card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-card rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground text-sm">Via Bank Transfer</p>
                <p className="text-xs text-muted-foreground">FREE Instant bank funding within 10s</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="pt-3">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs text-muted-foreground">BytePay Account Number</p>
                <span className="flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                  <span>③</span> Tier 3
                  <ChevronRight className="h-2.5 w-2.5" />
                </span>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <p className="text-3xl font-black text-foreground tracking-wider" data-testid="text-account-number">
                  {formatAccDisplay(userData?.accountNumber)}
                </p>
                <button onClick={copy} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" data-testid="btn-copy-account">
                  {copied ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5 text-muted-foreground" />}
                </button>
              </div>

              <button onClick={share}
                className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm"
                data-testid="btn-share-account">
                <Share2 className="h-4 w-4" />
                Share Account
              </button>
            </div>
          </motion.div>

          {/* OR divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Other options */}
          <div className="bg-white dark:bg-card rounded-2xl overflow-hidden shadow-sm">
            {OPTIONS.map(({ icon, label, sub }, i) => (
              <motion.div key={label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <button className="w-full flex items-center gap-4 px-4 py-4 hover:bg-secondary/50 transition-colors border-b border-border last:border-0">
                  <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center text-lg shrink-0">
                    {icon}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
