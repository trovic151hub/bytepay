import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Shield, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
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
    <div className="min-h-screen bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">BytePay</h1>
          </div>

          <div className="bg-white rounded-3xl p-7 shadow-2xl">
            {sent ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Check your inbox</h2>
                <p className="text-muted-foreground text-sm mb-6">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
                <Link href="/login">
                  <Button className="w-full" data-testid="button-back-to-login">Back to Sign In</Button>
                </Link>
              </motion.div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-foreground mb-1">Reset password</h2>
                <p className="text-muted-foreground text-sm mb-6">Enter your email and we'll send a reset link</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email address</Label>
                    <div className="relative">
                      <Input id="email" type="email" placeholder="you@example.com" value={email}
                        onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
                        className="pl-11" data-testid="input-email" />
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-xl" data-testid="text-error">{error}</p>}
                  <Button type="submit" className="w-full" size="lg" disabled={loading} data-testid="button-submit">
                    {loading ? <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Sending...</span> : "Send Reset Link"}
                  </Button>
                </form>
                <p className="text-center text-sm text-muted-foreground mt-5">
                  <Link href="/login" className="text-primary font-semibold hover:underline" data-testid="link-back-login">Back to Sign In</Link>
                </p>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
