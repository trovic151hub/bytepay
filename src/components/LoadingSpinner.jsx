import LogoLoader, { LogoIcon } from "./LogoLoader";
import { cn } from "@/lib/utils";

export default function LoadingSpinner({ className, size = "default" }) {
  const s = size === "sm" ? "xs" : size === "lg" ? "md" : "sm";
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <LogoIcon size={s} />
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <LogoLoader />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  );
}
