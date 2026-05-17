import { useLocation, Link } from "wouter";
import { Home, TrendingUp, Gift, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/dashboard", label: "Home", icon: Home },
  { path: "/wealth", label: "Loan", icon: TrendingUp },
  { path: "/savings", label: "Wealth", icon: null, emoji: "📈" },
  { path: "/history", label: "Reward", icon: Gift },
  { path: "/profile", label: "Me", icon: User },
];

export default function BottomNav() {
  const [location] = useLocation();
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white dark:bg-card border-t border-border z-50">
      <div className="flex items-center justify-around px-1 h-16">
        {navItems.map(({ path, icon: Icon, label, emoji }) => {
          const active = location === path || (path !== "/dashboard" && location.startsWith(path));
          return (
            <Link key={path} href={path}
              className="flex flex-col items-center gap-1 px-3 py-1 relative min-w-0 flex-1"
              data-testid={`nav-${label.toLowerCase()}`}>
              {active ? (
                <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center">
                  {emoji
                    ? <span className="text-base">{emoji}</span>
                    : <Icon className="h-4.5 w-4.5 text-primary-foreground" style={{ height: "18px", width: "18px" }} />}
                </div>
              ) : (
                <div className="h-9 w-9 flex items-center justify-center">
                  {emoji
                    ? <span className="text-xl text-muted-foreground opacity-60">{emoji}</span>
                    : <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />}
                </div>
              )}
              <span className={cn(
                "text-[10px] font-semibold transition-colors truncate",
                active ? "text-primary" : "text-muted-foreground"
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
