import { motion } from "framer-motion";
import Logo from "./Logo";

export default function SplashScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-background select-none">

      <div className="flex flex-col items-center gap-4 flex-1 justify-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}
        >
          <Logo size="lg" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="text-sm text-muted-foreground"
        >
          The Smarter Way to Bank
        </motion.p>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="pb-16 text-[10px] text-muted-foreground text-center px-8"
      >
        © {new Date().getFullYear()} BytePay · Licensed as MMO by CBN · Deposits Insured by NDIC
      </motion.p>

    </div>
  );
}
