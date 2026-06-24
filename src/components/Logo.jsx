import { cn } from "@/lib/utils";

const SIZES = {
  sm: { icon: "h-6 w-6", text: "text-sm" },
  default: { icon: "h-9 w-9", text: "text-xl" },
  lg: { icon: "h-16 w-16", text: "text-3xl" },
};

export default function Logo({ size = "default", showWordmark = true, className }) {
  const { icon, text } = SIZES[size] ?? SIZES.default;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("relative shrink-0", icon)}>
        <div className="absolute inset-0 translate-x-[14%] translate-y-[14%] rotate-45 rounded-[30%] bg-gradient-to-br from-violet-300 to-purple-400 opacity-70" />
        <div className="absolute inset-0 -translate-x-[6%] -translate-y-[6%] rotate-45 rounded-[30%] bg-gradient-to-br from-violet-600 to-purple-800 shadow-sm" />
      </div>
      {showWordmark && (
        <span className={cn("font-extrabold tracking-tight text-foreground", text)}>
          Byte<span className="text-primary">Pay</span>
        </span>
      )}
    </div>
  );
}
