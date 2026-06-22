import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ToastContainer({ toasts, dismiss }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-full max-w-[400px] px-4 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-2xl px-4 py-3 shadow-lg backdrop-blur-sm",
              t.variant === "destructive"
                ? "bg-red-50 border border-red-200 text-red-800"
                : "bg-white border border-border text-foreground"
            )}
          >
            {t.variant === "destructive" ? (
              <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              {t.title && <p className="font-semibold text-sm">{t.title}</p>}
              {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="shrink-0 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
