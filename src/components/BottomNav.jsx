import { useLocation, Link } from "wouter";
import {
  RiHomeLine, RiHomeFill,
  RiBankCardLine, RiBankCardFill,
  RiLineChartLine, RiLineChartFill,
  RiGiftLine, RiGiftFill,
  RiUserLine, RiUserFill,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/dashboard",    label: "Home",   IconOff: RiHomeLine,       IconOn: RiHomeFill },
  { path: "/wealth",       label: "Loan",   IconOff: RiBankCardLine,   IconOn: RiBankCardFill },
  { path: "/savings",      label: "Wealth", IconOff: RiLineChartLine,  IconOn: RiLineChartFill },
  { path: "/reward",       label: "Reward", IconOff: RiGiftLine,       IconOn: RiGiftFill },
  { path: "/me",           label: "Me",     IconOff: RiUserLine,       IconOn: RiUserFill },
];

export default function BottomNav() {
  const [location] = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-card border-t border-border z-50">
      <div className="max-w-[430px] mx-auto flex items-center justify-around px-1 h-16" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {navItems.map(({ path, label, IconOff, IconOn }) => {
          const active = location === path || (path !== "/dashboard" && location.startsWith(path));
          const Icon = active ? IconOn : IconOff;
          return (
            <Link
              key={path} href={path}
              className="flex flex-col items-center gap-1 flex-1 py-2"
              data-testid={`nav-${label.toLowerCase()}`}
            >
              {active ? (
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <Icon className="text-primary-foreground text-lg" />
                </div>
              ) : (
                <Icon className="text-muted-foreground text-[22px]" />
              )}
              <span className={cn(
                "text-[10px] font-semibold",
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
