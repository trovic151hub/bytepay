import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const SIZES = {
  xs:  "h-4 w-4",
  sm:  "h-8 w-8",
  md:  "h-12 w-12",
  lg:  "h-16 w-16",
};

// Reusable animated logo icon — no wordmark, just the two diamonds pulsing
export function LogoIcon({ size = "md", className }) {
  return (
    <motion.div
      className={cn("relative shrink-0", SIZES[size] ?? SIZES.md, className)}
      animate={{ scale: [1, 1.08, 1] }}
      transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
    >
      <div className="absolute inset-0 translate-x-[14%] translate-y-[14%] rotate-45 rounded-[30%] bg-gradient-to-br from-violet-300 to-purple-400 opacity-70" />
      <div className="absolute inset-0 -translate-x-[6%] -translate-y-[6%] rotate-45 rounded-[30%] bg-gradient-to-br from-violet-600 to-purple-800 shadow-sm" />
    </motion.div>
  );
}

// Full-page loading overlay
export default function LogoLoader({ className }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <LogoIcon size="md" />
    </div>
  );
}
