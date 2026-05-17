import { cn } from "@/lib/utils";

export default function LoadingSpinner({ className, size = "default" }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className={cn(
        "animate-spin rounded-full border-b-2 border-primary",
        size === "sm" ? "h-4 w-4" : size === "lg" ? "h-10 w-10" : "h-7 w-7"
      )} />
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  );
}
