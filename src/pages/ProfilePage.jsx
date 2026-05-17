import { useState } from "react";
import { motion } from "framer-motion";
import { signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import bcrypt from "bcryptjs";
import { auth, db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { User, Mail, Phone, CreditCard, LogOut, ChevronRight, Shield, Lock, Copy, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { user, userData } = useAuth();
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);
  const [changingPin, setChangingPin] = useState(false);
  const [pinForm, setPinForm] = useState({ current: "", next: "", confirm: "" });
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);

  const initials = userData ? `${userData.firstName?.[0] ?? ""}${userData.lastName?.[0] ?? ""}`.toUpperCase() : "?";

  const copyAccNum = () => {
    navigator.clipboard.writeText(userData?.accountNumber ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setLocation("/login");
  };

  const handleChangePin = async (e) => {
    e.preventDefault();
    setPinError("");
    if (pinForm.next.length !== 6 || !/^\d{6}$/.test(pinForm.next)) { setPinError("New PIN must be 6 digits."); return; }
    if (pinForm.next !== pinForm.confirm) { setPinError("PINs do not match."); return; }
    setPinLoading(true);
    try {
      const match = await bcrypt.compare(pinForm.current, userData.transactionPin);
      if (!match) { setPinError("Current PIN is incorrect."); return; }
      const hashed = await bcrypt.hash(pinForm.next, 10);
      await updateDoc(doc(db, "users", user.uid), { transactionPin: hashed });
      setPinSuccess(true);
      setPinForm({ current: "", next: "", confirm: "" });
      setTimeout(() => { setPinSuccess(false); setChangingPin(false); }, 2000);
    } catch {
      setPinError("Failed to update PIN. Please try again.");
    } finally {
      setPinLoading(false);
    }
  };

  const InfoRow = ({ icon: Icon, label, value, action }) => (
    <div className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0">
      <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground truncate" data-testid={`text-${label.toLowerCase().replace(/\s/g, "-")}`}>{value}</p>
      </div>
      {action && action}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <div className="max-w-[430px] mx-auto">
        <PageHeader title="My Profile" back={false} />

        <div className="px-4 pt-4 pb-24 space-y-4">
          {/* Avatar */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-5 flex flex-col items-center text-center">
            <div className="relative mb-3">
              {userData?.profileImg ? (
                <img src={userData.profileImg} alt="avatar" className="h-20 w-20 rounded-full object-cover ring-4 ring-primary/20" />
              ) : (
                <div className="h-20 w-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">{initials}</div>
              )}
            </div>
            <h2 className="text-lg font-bold text-foreground" data-testid="text-full-name">{userData?.firstName} {userData?.lastName}</h2>
            <p className="text-sm text-muted-foreground mt-0.5" data-testid="text-profile-email">{userData?.email}</p>
          </motion.div>

          {/* Account Info */}
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Account Details</p>
              <InfoRow icon={User} label="Full Name" value={`${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`} />
              <InfoRow icon={Mail} label="Email" value={userData?.email ?? "—"} />
              <InfoRow icon={Phone} label="Phone" value={userData?.phoneNumber ?? "—"} />
              <InfoRow icon={CreditCard} label="Account Number" value={userData?.accountNumber ?? "—"}
                action={
                  <button onClick={copyAccNum} className="shrink-0 text-muted-foreground hover:text-primary transition-colors" data-testid="btn-copy-account">
                    {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                }
              />
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Security</p>
              <button onClick={() => setChangingPin(!changingPin)} className="w-full flex items-center gap-3 py-3" data-testid="btn-change-pin">
                <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="flex-1 text-sm font-medium text-foreground text-left">Change Transaction PIN</span>
                <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", changingPin && "rotate-90")} />
              </button>

              {changingPin && (
                <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} onSubmit={handleChangePin} className="space-y-3 pt-2 pb-1">
                  <div className="space-y-1.5"><Label>Current PIN</Label>
                    <Input type="password" inputMode="numeric" maxLength={6} placeholder="6-digit PIN" value={pinForm.current} onChange={(e) => setPinForm(f => ({ ...f, current: e.target.value }))} data-testid="input-current-pin" />
                  </div>
                  <div className="space-y-1.5"><Label>New PIN</Label>
                    <Input type="password" inputMode="numeric" maxLength={6} placeholder="New 6-digit PIN" value={pinForm.next} onChange={(e) => setPinForm(f => ({ ...f, next: e.target.value }))} data-testid="input-new-pin" />
                  </div>
                  <div className="space-y-1.5"><Label>Confirm New PIN</Label>
                    <Input type="password" inputMode="numeric" maxLength={6} placeholder="Confirm new PIN" value={pinForm.confirm} onChange={(e) => setPinForm(f => ({ ...f, confirm: e.target.value }))} data-testid="input-confirm-pin" />
                  </div>
                  {pinError && <p className="text-red-500 text-xs">{pinError}</p>}
                  {pinSuccess && <p className="text-green-600 text-xs font-medium">PIN updated successfully!</p>}
                  <Button type="submit" className="w-full" size="sm" disabled={pinLoading} data-testid="button-update-pin">
                    {pinLoading ? "Updating..." : "Update PIN"}
                  </Button>
                </motion.form>
              )}
            </CardContent>
          </Card>

          {/* Sign Out */}
          <Button variant="outline" className="w-full border-red-200 text-red-500 hover:bg-red-50" onClick={handleSignOut} data-testid="button-sign-out">
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
