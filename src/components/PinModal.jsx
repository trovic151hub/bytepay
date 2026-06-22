import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Delete } from "lucide-react";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

export default function PinModal({ isOpen, onClose, onConfirm, loading, title = "Enter Transaction PIN" }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleKey = (k) => {
    if (k === "del") {
      setPin((p) => p.slice(0, -1));
      setError("");
    } else if (k === "") {
      return;
    } else if (pin.length < 6) {
      const next = pin + k;
      setPin(next);
      setError("");
      if (next.length === 6) {
        setTimeout(() => {
          onConfirm(next).catch((e) => {
            setError(e.message || "Incorrect PIN. Try again.");
            setPin("");
          });
        }, 150);
      }
    }
  };

  const handleClose = () => {
    setPin("");
    setError("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="relative w-full max-w-[430px] bg-white rounded-t-3xl pt-6 pb-8 px-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-border" />
            <button onClick={handleClose} className="absolute top-5 right-5 p-1 rounded-full hover:bg-secondary">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>

            <h2 className="text-center font-semibold text-foreground mb-1">{title}</h2>
            <p className="text-center text-sm text-muted-foreground mb-6">Enter your 6-digit transaction PIN</p>

            <div className="flex justify-center gap-3 mb-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ scale: pin.length === i ? 1.2 : 1 }}
                  className={cn(
                    "w-4 h-4 rounded-full border-2 transition-colors",
                    i < pin.length ? "bg-primary border-primary" : "bg-transparent border-muted-foreground/40"
                  )}
                />
              ))}
            </div>

            {error && (
              <p className="text-center text-xs text-red-500 mb-2 min-h-[1rem]">{error}</p>
            )}

            {loading && (
              <div className="flex justify-center my-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 mt-4">
              {KEYS.map((k, i) => (
                <button
                  key={i}
                  onClick={() => !loading && handleKey(k)}
                  disabled={loading || k === ""}
                  className={cn(
                    "h-14 rounded-2xl text-xl font-semibold transition-all active:scale-95",
                    k === "" ? "pointer-events-none" : "bg-secondary hover:bg-secondary/70 active:bg-secondary/50",
                    k === "del" && "text-foreground"
                  )}
                  data-testid={k === "del" ? "pin-delete" : k !== "" ? `pin-key-${k}` : undefined}
                >
                  {k === "del" ? <Delete className="h-5 w-5 mx-auto" /> : k}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
