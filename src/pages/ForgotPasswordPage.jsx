import { useState } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebase";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { RiHeadphoneLine } from "react-icons/ri";
import Logo from "@/components/Logo";

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err) {
      setError(err.code === "auth/user-not-found" ? "No account found with this email." : "Failed to send reset email. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-background flex flex-col">
      <div className="max-w-[430px] w-full mx-auto flex flex-col flex-1">
        <header className="px-4 py-4 flex items-center justify-between">
          <button onClick={() => setLocation("/login")} className="text-foreground" data-testid="btn-back">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <RiHeadphoneLine className="h-6 w-6 text-foreground" />
        </header>

        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center flex-1 px-6 mt-16 text-center"
            >
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-1">Check your inbox</h2>
              <p className="text-sm text-muted-foreground mb-8">
                We've sent a password reset link to <span className="font-semibold text-foreground">{email}</span>
              </p>
              <button
                onClick={() => setLocation("/login")}
                className="w-full py-4 rounded-2xl text-base font-bold text-white bg-primary"
                data-testid="button-back-to-login"
              >
                Back to Log in
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="flex flex-col flex-1 px-6"
            >
              <div className="flex flex-col items-center mt-10 mb-10">
                <Logo size="lg" />
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Enter your email and we'll send you a reset link
                </p>
              </div>

              <input
                type="email"
                placeholder="Please enter Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-secondary rounded-2xl px-4 py-4 text-sm placeholder:text-muted-foreground outline-none text-foreground"
                data-testid="input-email"
              />

              {error && (
                <p className="text-red-500 text-sm mt-3" data-testid="text-error">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full mt-4 py-4 rounded-2xl text-base font-bold text-white bg-primary disabled:bg-primary/30 disabled:cursor-not-allowed transition-colors"
                data-testid="button-submit"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

              <div className="flex-1" />

              <p className="text-center text-sm text-muted-foreground pb-6">
                Remember your password?{" "}
                <Link href="/login" className="text-primary font-semibold" data-testid="link-back-login">
                  Log in
                </Link>
              </p>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-center pb-6 text-[10px] text-muted-foreground text-center px-6">
          Demo app for portfolio purposes — not a licensed financial institution
        </div>
      </div>
    </div>
  );
}
