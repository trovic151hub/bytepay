import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { forwardRef } from "react";

const Select = forwardRef(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        "flex h-12 w-full appearance-none rounded-xl border border-input bg-background px-4 py-2 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
  </div>
));
Select.displayName = "Select";

export { Select };
