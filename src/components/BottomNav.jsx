import { useLocation, Link } from "wouter";
import { Home, Clock, PiggyBank, Gift, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const navItems = [
  { path: "/dashboard", icon: Home, label: "Home" },
  { path: "/history", icon: Clock, label: "History" },
  { path: "/savings", icon: PiggyBank, label: "Savings" },
  { path: "/wealth", icon: Gift, label: "Rewards" },
  { path: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  const [location] = useLocation();
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-border z-50 pb-safe">
      <div className="flex items-center justify-around px-2 h-16">
        {navItems.map(({ path, icon: Icon, label }) => {
          const active = location === path || (path !== "/dashboard" && location.startsWith(path));
          return (
            <Link key={path} href={path} className="flex flex-col items-center gap-0.5 px-3 py-1 relative" data-testid={`nav-${label.toLowerCase()}`}>
              {active && (
                <motion.div
                  layoutId="navIndicator"
                  className="absolute -top-px left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full"
                />
              )}
              <Icon className={cn("h-5 w-5 transition-colors", active ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-[10px] font-medium transition-colors", active ? "text-primary" : "text-muted-foreground")}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
