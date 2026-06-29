import { AnimatePresence, motion } from "framer-motion";
import { useToaster } from "@/hooks/useToast";

export default function Toaster() {
  const toasts = useToaster();
  return (
    <div className="fixed top-4 left-0 right-0 max-w-[430px] mx-auto px-4 z-[300] pointer-events-none flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            className="bg-gray-900 dark:bg-gray-800 text-white px-4 py-3 rounded-2xl shadow-lg pointer-events-auto"
          >
            {t.title && <p className="text-sm font-semibold">{t.title}</p>}
            {t.description && <p className="text-xs text-gray-300 mt-0.5">{t.description}</p>}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
