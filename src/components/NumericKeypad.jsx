import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

export default function NumericKeypad({ onKey, disabled }) {
  return (
    <div className="grid grid-cols-3 gap-y-2 gap-x-3">
      {KEYS.map((k, i) => (
        <button
          key={i}
          type="button"
          onClick={() => k && !disabled && onKey(k)}
          disabled={disabled || !k}
          className={cn(
            "h-14 rounded-2xl text-xl font-semibold transition-all select-none",
            !k
              ? "pointer-events-none"
              : "bg-secondary dark:bg-secondary/60 active:scale-95 active:bg-secondary/60"
          )}
        >
          {k === "del" ? <Delete className="h-5 w-5 mx-auto" /> : k}
        </button>
      ))}
    </div>
  );
}
