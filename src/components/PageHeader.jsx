import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PageHeader({ title, back = true, backTo, right, className }) {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    if (backTo) setLocation(backTo);
    else window.history.back();
  };

  return (
    <header className={cn("sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-border", className)}>
      <div className="flex items-center h-20 px-4 max-w-[430px] mx-auto gap-3">
        {back && (
          <button
            onClick={handleBack}
            data-testid="btn-back"
            className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-secondary transition-colors -ml-1"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
        )}
        <h1 className="flex-1 text-base font-semibold text-foreground">{title}</h1>
        {right && <div>{right}</div>}
      </div>
    </header>
  );
}
