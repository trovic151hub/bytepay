import { motion } from "framer-motion";
import { ArrowLeft, Headphones, MoreVertical, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/useToast";

const CARD_DESIGNS = [
  { id: 1, gradient: "from-violet-600 via-purple-700 to-indigo-800", label: "Verve Classic" },
  { id: 2, gradient: "from-amber-700 via-yellow-600 to-amber-500",   label: "Gold Edition" },
  { id: 3, gradient: "from-cyan-500 via-blue-500 to-indigo-500",     label: "Azure Card" },
  { id: 4, gradient: "from-gray-800 via-gray-700 to-gray-900",       label: "Midnight Black" },
];

const BENEFITS = [
  {
    emoji: "💰",
    title: "Balance & FlexiPay Flexibility",
    desc: "Transact seamlessly with both your Balance and FlexiPay accounts.",
  },
  {
    emoji: "🏦",
    title: "High Credit, Low Interest",
    desc: "Access up to ₦100,000 in FlexiPay credit, with daily interest as low as 0.5%.",
  },
  {
    emoji: "👍",
    title: "No Maintenance Fee",
    desc: "No maintenance fees for a hassle-free experience.",
  },
];

const cs = () => toast({ title: "Coming Soon", description: "ATM card applications are launching soon." });

export default function AtmCardPage() {
  return (
    <div className="min-h-screen bg-[#F4F2FA] dark:bg-background">
      <div className="max-w-[430px] mx-auto">

        {/* Header */}
        <header className="sticky top-0 z-40 bg-white dark:bg-card px-4 py-4 flex items-center gap-3 shadow-sm">
          <button onClick={() => window.history.back()} className="text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="flex-1 text-base font-bold text-foreground">BytePay ATM Cards</h1>
          <button className="mr-1"><Headphones className="h-5 w-5 text-foreground" /></button>
          <button><MoreVertical className="h-5 w-5 text-foreground" /></button>
        </header>

        <div className="px-4 pt-4 pb-28 space-y-4">

          {/* Main card display */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="relative">
            <div className={`bg-gradient-to-br ${CARD_DESIGNS[0].gradient} rounded-2xl p-5 shadow-xl mx-4`}
              style={{ aspectRatio: "1.586 / 1" }}>
              <div className="flex items-start justify-between mb-4">
                <div className="text-white font-black text-base tracking-wide">BytePay</div>
                <div className="h-8 w-12 bg-white/20 rounded-md" />
              </div>
              <div className="flex items-center gap-1 mb-6">
                <div className="h-6 w-8 rounded bg-yellow-400/80 flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-0.5 p-0.5">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-1.5 w-1.5 bg-yellow-700/60 rounded-sm" />
                    ))}
                  </div>
                </div>
                <span className="text-white/80 text-xs ml-2">◄ ●●●● ●●●● ●●●● ●●●● ►</span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-white/60 text-[10px]">CARD HOLDER</p>
                  <p className="text-white text-sm font-bold">BYTEPAY USER</p>
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-[10px]">EXPIRES</p>
                  <p className="text-white text-sm font-bold">12/28</p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex">
                    <div className="h-8 w-8 rounded-full bg-red-500 opacity-90" />
                    <div className="h-8 w-8 rounded-full bg-yellow-400 opacity-90 -ml-4" />
                  </div>
                  <span className="text-white text-[9px] font-bold mt-0.5">VERVE</span>
                </div>
              </div>
            </div>
            <p className="text-center text-sm font-semibold text-foreground mt-2">Verve Classic Card</p>
          </motion.div>

          {/* Card thumbnails */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {CARD_DESIGNS.map((c, i) => (
              <div key={c.id}
                className={`shrink-0 w-20 h-12 rounded-xl bg-gradient-to-br ${c.gradient} ${i === 0 ? "ring-2 ring-primary ring-offset-2" : "opacity-60"} cursor-pointer`} />
            ))}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <p className="text-xs font-semibold text-muted-foreground">Get Your First Debit & Flexi Card</p>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Benefits */}
          <div className="bg-white dark:bg-card rounded-2xl p-4 shadow-sm space-y-4">
            {BENEFITS.map(({ emoji, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl shrink-0">
                  {emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 py-2">
            <div className="flex items-center gap-1.5">
              <span className="text-base">🇳🇬</span>
              <p className="text-[10px] text-muted-foreground font-medium">Licensed by CBN as MMO</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base">🛡️</span>
              <p className="text-[10px] text-muted-foreground font-medium">Deposits Insured by NDIC</p>
            </div>
          </div>
        </div>

        {/* Apply Now CTA */}
        <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto px-4 pb-6 bg-gradient-to-t from-[#F4F2FA] dark:from-background pt-4">
          <button onClick={cs}
            className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold text-base shadow-lg">
            Apply Now
          </button>
        </div>

      </div>
    </div>
  );
}
