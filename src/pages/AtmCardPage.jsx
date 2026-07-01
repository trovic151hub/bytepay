import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Headphones, MoreVertical } from "lucide-react";
import { toast } from "@/hooks/useToast";
import { RiShoppingBag2Line, RiHandCoinLine, RiThumbUpLine } from "react-icons/ri";

const cs = () => toast({ title: "Coming Soon", description: "ATM card applications are launching soon." });

function DoodleArt() {
  return (
    <svg viewBox="0 0 340 214" fill="none" xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 w-full h-full pointer-events-none">
      {/* Squiggly lines */}
      <path d="M30 100 Q50 80 70 100 Q90 120 110 100 Q130 80 150 100" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.85"/>
      <path d="M160 140 Q180 120 200 140 Q220 160 240 140 Q260 120 280 140" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.75"/>
      <path d="M200 60 Q215 45 230 60 Q245 75 260 60" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8"/>
      {/* Gold hearts */}
      <path d="M130 170 C130 170 110 155 110 143 C110 135 117 129 125 133 C128 134 130 137 130 140 C130 137 133 134 136 133 C144 129 150 135 150 143 C150 155 130 170 130 170Z" stroke="#FFD600" strokeWidth="2.5" fill="none" opacity="0.95"/>
      <path d="M175 185 C175 185 160 173 160 164 C160 158 165 153 171 156 C173 157 175 159 175 162 C175 159 177 157 179 156 C185 153 190 158 190 164 C190 173 175 185 175 185Z" stroke="#FFD600" strokeWidth="2" fill="none" opacity="0.85"/>
      {/* Crown */}
      <path d="M55 55 L60 40 L70 52 L80 36 L90 52 L100 40 L105 55Z" stroke="white" strokeWidth="2.5" fill="none" opacity="0.8"/>
      {/* Stars / dots */}
      <circle cx="290" cy="80" r="3.5" fill="white" opacity="0.9"/>
      <circle cx="300" cy="92" r="2" fill="white" opacity="0.6"/>
      <circle cx="40" cy="170" r="2.5" fill="white" opacity="0.7"/>
      <circle cx="120" cy="55" r="2" fill="white" opacity="0.6"/>
      {/* Small swirl top-right */}
      <path d="M290 45 Q300 35 310 45 Q320 55 310 65" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7"/>

      {/* Coloured accent shapes */}
      {/* Pink/magenta triangle top-right */}
      <polygon points="255,18 272,48 238,48" fill="#FF3DAA" opacity="0.95"/>
      {/* Smaller pink triangle */}
      <polygon points="308,130 320,150 296,150" fill="#FF6BB5" opacity="0.8"/>
      {/* Yellow diamond */}
      <rect x="298" y="52" width="16" height="16" rx="2" fill="#FFD600" transform="rotate(45 306 60)" opacity="0.95"/>
      {/* Green triangle left */}
      <polygon points="18,42 36,70 0,70" fill="#00E5A0" opacity="0.9"/>
      {/* Teal/cyan right-bottom */}
      <polygon points="318,168 334,150 334,186" fill="#00D9F5" opacity="0.85"/>
      {/* Small magenta bottom-left */}
      <polygon points="88,178 102,160 116,178" fill="#FF3DAA" opacity="0.7"/>
      {/* Yellow small diamond bottom */}
      <rect x="210" y="175" width="12" height="12" rx="1.5" fill="#FFD600" transform="rotate(45 216 181)" opacity="0.8"/>
    </svg>
  );
}

const CARDS = [
  { id: 1, label: "Verve Classic",   gradient: "from-violet-600 via-purple-700 to-indigo-800", doodle: true },
  { id: 2, label: "Gold Edition",    gradient: "from-amber-800 via-yellow-700 to-amber-500",   doodle: false },
  { id: 3, label: "Azure Card",      gradient: "from-cyan-400 via-blue-500 to-indigo-600",     doodle: false },
  { id: 4, label: "Midnight Black",  gradient: "from-gray-900 via-gray-800 to-zinc-900",       doodle: false },
];

const BENEFITS = [
  {
    Icon: RiShoppingBag2Line,
    title: "Balance & FlexiPay Flexibility",
    desc: "Transact seamlessly with both your Balance and FlexiPay accounts.",
  },
  {
    Icon: RiHandCoinLine,
    title: "High Credit, Low Interest",
    desc: "Access up to ₦100,000 in FlexiPay credit, with daily interest as low as 0.5%.",
  },
  {
    Icon: RiThumbUpLine,
    title: "No Maintenance Fee",
    desc: "No maintenance fees for a hassle-free experience.",
  },
];

export default function AtmCardPage() {
  const [active, setActive] = useState(0);
  const card = CARDS[active];

  return (
    <div className="min-h-screen bg-[#EEEDF8] dark:bg-background">
      <div className="max-w-[430px] mx-auto">

        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#EEEDF8] dark:bg-background px-4 py-4 flex items-center gap-3">
          <button onClick={() => window.history.back()} className="text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="flex-1 text-base font-bold text-foreground">BytePay ATM Cards</h1>
          <button className="mr-2"><Headphones className="h-5 w-5 text-foreground" /></button>
          <button><MoreVertical className="h-5 w-5 text-foreground" /></button>
        </header>

        {/* Card hero area */}
        <div className="px-6 pt-6 pb-5">
          <motion.div
            key={active}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.22 }}
            className={`relative bg-gradient-to-br ${card.gradient} rounded-2xl shadow-2xl overflow-hidden`}
            style={{ aspectRatio: "1.586 / 1" }}
          >
            {card.doodle && <DoodleArt />}

            <div className="absolute inset-0 p-5 flex flex-col justify-between">
              {/* Top row: brand + NFC */}
              <div className="flex items-center justify-between">
                <span className="text-white font-black text-base tracking-wide">BytePay</span>
                <span className="text-white text-base opacity-80 tracking-tighter">)))</span>
              </div>

              {/* Chip */}
              <div className="h-9 w-12 rounded-md bg-yellow-400/90 flex items-center justify-center self-start">
                <div className="grid grid-cols-2 gap-0.5 p-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-2 w-2 bg-yellow-700/50 rounded-sm" />
                  ))}
                </div>
              </div>

              {/* Bottom row: holder + Verve */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-white/60 text-[9px] uppercase tracking-wider">Card Holder</p>
                  <p className="text-white text-sm font-bold">BYTEPAY USER</p>
                </div>
                {/* Verve pill */}
                <div className="flex items-center gap-1 bg-white rounded-lg px-2 py-1 shadow">
                  <div className="h-5 w-5 rounded-full bg-red-600 flex items-center justify-center shrink-0">
                    <span className="text-white font-black text-[10px] leading-none">V</span>
                  </div>
                  <span className="text-gray-800 font-black text-xs leading-none">erve</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* White pill label */}
          <div className="flex justify-center mt-4">
            <div className="bg-white dark:bg-card px-6 py-2 rounded-full shadow-md">
              <span className="text-sm font-semibold text-foreground">{card.label} Card</span>
            </div>
          </div>
        </div>

        {/* White panel */}
        <div className="bg-white dark:bg-card rounded-t-3xl px-4 pt-5 pb-28 space-y-5">

          {/* Thumbnails */}
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
            {CARDS.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setActive(i)}
                className={`shrink-0 w-[82px] h-12 rounded-xl bg-gradient-to-br ${c.gradient} transition-all duration-200 ${
                  i === active
                    ? "ring-2 ring-primary ring-offset-2 opacity-100"
                    : "opacity-50 hover:opacity-70"
                }`}
              />
            ))}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <p className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
              Get Your First Debit &amp; Flexi Card
            </p>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Benefits */}
          <div className="space-y-5">
            {BENEFITS.map(({ Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-xl bg-secondary dark:bg-secondary/60 flex items-center justify-center shrink-0">
                  <Icon className="text-xl text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 pt-1">
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] text-muted-foreground font-medium">Licensed by CBN as MMO</p>
              <span>🇳🇬</span>
            </div>
            <div className="w-px h-5 bg-border" />
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] text-muted-foreground font-medium">Deposits Insured by</p>
              <span className="text-xs font-black text-foreground border-l-2 border-foreground pl-1 leading-none">NDIC</span>
            </div>
          </div>
        </div>

        {/* Apply Now */}
        <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto px-4 pb-6 pt-3 bg-gradient-to-t from-white dark:from-background">
          <button
            onClick={cs}
            className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold text-base shadow-lg"
          >
            Apply Now
          </button>
        </div>

      </div>
    </div>
  );
}
