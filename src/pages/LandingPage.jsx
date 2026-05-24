import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import {
  Shield, Send, Plus, Phone, Wifi, Zap, Gamepad2, PiggyBank, TrendingUp,
  ArrowRight, Star, Lock, Eye, EyeOff, ChevronRight, Sun, Moon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: Send, label: "Send Money", desc: "Transfer to any bank instantly", color: "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400" },
  { icon: Plus, label: "Add Money", desc: "Fund your wallet easily", color: "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400" },
  { icon: Phone, label: "Buy Airtime", desc: "All networks supported", color: "bg-red-100 text-red-500 dark:bg-red-900/40 dark:text-red-400" },
  { icon: Wifi, label: "Data Bundles", desc: "Best data deals always", color: "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400" },
  { icon: Zap, label: "Pay Bills", desc: "Electricity & utilities", color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400" },
  { icon: Gamepad2, label: "Betting", desc: "Top up all platforms", color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400" },
  { icon: PiggyBank, label: "Save & Earn", desc: "Up to 21% per annum", color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400" },
  { icon: TrendingUp, label: "Investments", desc: "Grow your wealth", color: "bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400" },
];

const REVIEWS = [
  { name: "Adaeze O.", stars: 5, text: "BytePay makes sending money so easy! No charges, instant transfers." },
  { name: "Tunde B.", stars: 5, text: "The savings feature is amazing. I'm earning 21% on my savings. Can't beat that." },
  { name: "Chioma E.", stars: 5, text: "Finally a fintech app that just works. Airtime top-up in 5 seconds." },
];

function GuestRestrictedButton({ children, className }) {
  const [, setLocation] = useLocation();
  return (
    <button
      onClick={() => setLocation("/login")}
      className={cn("flex flex-col items-center gap-2 cursor-pointer", className)}
    >
      {children}
    </button>
  );
}

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme, isDark } = useTheme();
  const [showBalance, setShowBalance] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-[430px] mx-auto relative">

        {/* Sticky header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-base font-bold text-foreground">BytePay</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="h-8 w-8 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              data-testid="btn-theme-toggle"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link href="/login">
              <Button size="sm" variant="outline" data-testid="btn-signin">Sign In</Button>
            </Link>
          </div>
        </header>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-800 px-6 pt-8 pb-10 text-white"
        >
          <Badge className="bg-white/20 text-white border-0 mb-4">🇳🇬 Nigeria's Smartest Fintech</Badge>
          <h1 className="text-3xl font-bold leading-tight mb-3">
            Banking Made<br />
            <span className="text-purple-200">Fast & Simple</span>
          </h1>
          <p className="text-purple-200 text-sm mb-6 leading-relaxed">
            Send money, pay bills, earn rewards, and save with up to 21% interest — all in one app.
          </p>

          {/* Mock balance card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 mb-5 border border-white/20"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-purple-200 text-xs">Available Balance</p>
              <button onClick={() => setShowBalance(b => !b)} className="text-purple-200">
                {showBalance ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="text-2xl font-bold text-white mb-3">
              {showBalance ? "₦0.00" : "₦ • • • • • •"}
            </p>
            <div className="flex items-center justify-between text-xs text-purple-200">
              <span>Sign in to see your balance</span>
              <Lock className="h-3.5 w-3.5" />
            </div>
          </motion.div>

          {/* Quick action chips */}
          <div className="flex gap-2 flex-wrap">
            {[
              { label: "Send Money", icon: Send },
              { label: "Airtime", icon: Phone },
              { label: "Savings", icon: PiggyBank },
            ].map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => setLocation("/login")}
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors px-3 py-1.5 rounded-full text-xs text-white font-medium"
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* CTA buttons */}
        <div className="px-4 py-5 flex gap-3">
          <Button className="flex-1" size="lg" onClick={() => setLocation("/signup")} data-testid="btn-create-account">
            Create Free Account
          </Button>
          <Button variant="outline" size="lg" onClick={() => setLocation("/login")} className="flex-1" data-testid="btn-sign-in-alt">
            Sign In
          </Button>
        </div>

        {/* Features grid */}
        <div className="px-4 pb-5">
          <p className="text-sm font-semibold text-foreground mb-3">Everything you need</p>
          <div className="grid grid-cols-4 gap-3">
            {FEATURES.map(({ icon: Icon, label, desc, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
              >
                <GuestRestrictedButton>
                  <div className={`h-12 w-12 rounded-2xl ${color} flex items-center justify-center shadow-sm`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-medium text-foreground text-center leading-tight">{label}</span>
                </GuestRestrictedButton>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Restricted preview banner */}
        <div className="mx-4 mb-5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-start gap-3">
          <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Sign in to unlock all features</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Create a free account to start sending money, paying bills, and earning rewards.</p>
            <button onClick={() => setLocation("/signup")} className="flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300 mt-2 hover:underline" data-testid="btn-get-started">
              Get started for free <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mx-4 mb-5 bg-white dark:bg-card rounded-2xl p-4 grid grid-cols-3 gap-4 border border-border">
          {[
            { value: "2M+", label: "Users" },
            { value: "₦50B+", label: "Transferred" },
            { value: "21%", label: "Savings Rate" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Reviews */}
        <div className="px-4 pb-5">
          <p className="text-sm font-semibold text-foreground mb-3">What users say</p>
          <div className="space-y-3">
            {REVIEWS.map(({ name, stars, text }) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-card rounded-2xl p-4 border border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-foreground">{name}</p>
                  <div className="flex gap-0.5">
                    {Array.from({ length: stars }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">"{text}"</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="px-4 pb-10">
          <div className="bg-gradient-to-br from-violet-700 to-indigo-700 rounded-2xl p-6 text-center">
            <h3 className="text-white font-bold text-lg mb-1">Ready to get started?</h3>
            <p className="text-purple-200 text-sm mb-4">Join millions of Nigerians banking smarter</p>
            <Button
              size="lg"
              className="w-full bg-white text-violet-700 hover:bg-purple-50 font-bold"
              onClick={() => setLocation("/signup")}
              data-testid="btn-join-now"
            >
              Join BytePay — It's Free <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
