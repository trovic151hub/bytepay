import { useState } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import bcrypt from "bcryptjs";
import { auth, db } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Shield, ChevronLeft } from "lucide-react";
import { generateAccountNumber } from "@/lib/utils";

export default function SignUpPage() {
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "", password: "", pin: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.pin.length !== 6 || !/^\d{6}$/.test(form.pin)) {
      setError("Transaction PIN must be exactly 6 digits.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);
      const hashedPin = await bcrypt.hash(form.pin, 10);
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phone.trim(),
        accountNumber: generateAccountNumber(form.phone.trim()),
        transactionPin: hashedPin,
        accountBalance: 0,
        profileImg: "",
        createdAt: serverTimestamp(),
      });
      setLocation("/dashboard");
    } catch (err) {
      const msg = {
        "auth/email-already-in-use": "This email is already registered.",
        "auth/weak-password": "Password is too weak. Use at least 6 characters.",
        "auth/invalid-email": "Invalid email address.",
      }[err.code] || "Sign up failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm mb-3">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">BytePay</h1>
          </div>

          <div className="bg-white rounded-3xl p-7 shadow-2xl">
            <h2 className="text-xl font-bold text-foreground mb-1">Create account</h2>
            <p className="text-muted-foreground text-sm mb-5">Join BytePay in seconds</p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" placeholder="John" value={form.firstName} onChange={set("firstName")} required data-testid="input-first-name" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" placeholder="Doe" value={form.lastName} onChange={set("lastName")} required data-testid="input-last-name" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone number</Label>
                <Input id="phone" type="tel" placeholder="08012345678" value={form.phone} onChange={set("phone")} required data-testid="input-phone" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} required autoComplete="email" data-testid="input-email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPass ? "text" : "password"} placeholder="Min. 6 characters"
                    value={form.password} onChange={set("password")} required autoComplete="new-password"
                    className="pr-11" data-testid="input-password" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" data-testid="btn-toggle-password">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pin">Transaction PIN (6 digits)</Label>
                <Input id="pin" type="password" placeholder="6-digit PIN" maxLength={6} inputMode="numeric"
                  value={form.pin} onChange={set("pin")} required data-testid="input-pin" />
                <p className="text-xs text-muted-foreground">Used to authorize transactions</p>
              </div>

              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-xl" data-testid="text-error">
                  {error}
                </motion.p>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading} data-testid="button-submit">
                {loading ? <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Creating account...</span> : "Create Account"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-5">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline" data-testid="link-login">Sign in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
