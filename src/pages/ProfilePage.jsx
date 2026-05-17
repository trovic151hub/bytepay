import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { signOut } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import bcrypt from "bcryptjs";
import { auth, db, storage } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import BottomNav from "@/components/BottomNav";
import PageHeader from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronRight, Camera, LogOut, Shield, Copy, CheckCircle, Sun, Moon, Trash2, Upload } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

function Row({ label, value, action, onClick, showChevron = true, badge }) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      className="w-full flex items-center justify-between py-3.5 border-b border-border/60 last:border-0 hover:bg-secondary/30 -mx-4 px-4 transition-colors cursor-default"
      style={onClick ? { cursor: "pointer" } : undefined}
    >
      <span className="text-sm text-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        {badge && <span className="text-[10px] bg-red-500 h-2 w-2 rounded-full" />}
        {value && <span className="text-sm text-muted-foreground truncate max-w-[180px]">{value}</span>}
        {action}
        {showChevron && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, userData } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);
  const [changingPin, setChangingPin] = useState(false);
  const [pinForm, setPinForm] = useState({ current: "", next: "", confirm: "" });
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  const fullName = `${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`.trim();

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
    if (!/^\d{6}$/.test(pinForm.next)) { setPinError("New PIN must be 6 digits."); return; }
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
    } catch { setPinError("Failed to update PIN."); }
    finally { setPinLoading(false); }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setUploadError("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadError("Image must be under 5MB."); return; }
    setUploadError("");
    setUploadProgress(0);
    const storageRef = ref(storage, `profileImages/${user.uid}`);
    const task = uploadBytesResumable(storageRef, file);
    task.on("state_changed",
      (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      () => { setUploadError("Upload failed."); setUploadProgress(null); },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        await updateDoc(doc(db, "users", user.uid), { profileImg: url });
        setUploadProgress(null);
      }
    );
  };

  const handleRemovePhoto = async () => {
    try {
      await deleteObject(ref(storage, `profileImages/${user.uid}`)).catch(() => {});
      await updateDoc(doc(db, "users", user.uid), { profileImg: "" });
    } catch { setUploadError("Could not remove photo."); }
  };

  const formatAcc = (acc) => {
    if (!acc || acc.length < 10) return acc ?? "—";
    return `${acc.slice(0, 3)} ${acc.slice(3, 6)} ${acc.slice(6)}`;
  };

  const initials = userData ? `${userData.firstName?.[0] ?? ""}${userData.lastName?.[0] ?? ""}`.toUpperCase() : "?";

  const lastLogin = new Date().toISOString().slice(0, 10).replace(/-/g, "/") + " 15:05:52";

  return (
    <div className="min-h-screen bg-[#F4F2FA] dark:bg-background">
      <div className="max-w-[430px] mx-auto">
        <PageHeader title="My Profile" back={true} backTo="/me" />

        <div className="px-4 pt-3 pb-28 space-y-3">

          {/* Avatar card */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-card rounded-2xl p-4 shadow-sm">

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} data-testid="input-photo" />

            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                {userData?.profileImg ? (
                  <img src={userData.profileImg} alt="avatar" className="h-16 w-16 rounded-full object-cover" data-testid="img-profile" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">{initials}</div>
                )}
                {uploadProgress !== null && (
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{uploadProgress}%</span>
                  </div>
                )}
                <button onClick={() => fileInputRef.current?.click()}
                  disabled={uploadProgress !== null}
                  className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow"
                  data-testid="btn-upload-photo">
                  <Camera className="h-3 w-3" />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-base" data-testid="text-full-name">
                  Hi, {userData?.firstName?.toUpperCase() ?? "USER"}
                </p>
                <p className="text-xs text-muted-foreground">Last login: {lastLogin}</p>
                {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
              </div>

              {userData?.profileImg && (
                <button onClick={handleRemovePhoto}
                  className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                  data-testid="btn-remove-photo">
                  <Trash2 className="h-3 w-3" /> Remove
                </button>
              )}
            </div>

            {uploadProgress !== null && (
              <div className="mt-3">
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
          </motion.div>

          {/* Account details */}
          <div className="bg-white dark:bg-card rounded-2xl px-4 shadow-sm">
            <Row label="Account Number" value={formatAcc(userData?.accountNumber)}
              action={<button onClick={copyAccNum} className="text-muted-foreground hover:text-primary" data-testid="btn-copy-account">
                {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </button>}
              showChevron={false}
            />
            <Row label="Email" value={userData?.email ?? "—"} />
            <Row label="Nick Name" value={userData?.firstName?.toLowerCase() ?? "—"} />
          </div>

          {/* KYC & Personal info */}
          <div className="bg-white dark:bg-card rounded-2xl px-4 shadow-sm">
            <Row label="KYC Levels" value="Tier 3" />
            <Row label="Full Name" value={fullName || "—"} />
            <Row label="Gender" value="—" />
            <Row label="Date of Birth" value="—" />
            <Row label="Mobile Number" value={userData?.phoneNumber ?? "—"} />
            <Row label="Address" />
            <Row label="Occupation" />
          </div>

          {/* Management */}
          <div className="bg-white dark:bg-card rounded-2xl px-4 shadow-sm">
            <Row label="Management of Accounts" badge={true} />
          </div>

          {/* Appearance / Dark mode */}
          <div className="bg-white dark:bg-card rounded-2xl px-4 shadow-sm">
            <div className="flex items-center justify-between py-3.5">
              <div className="flex items-center gap-2">
                {isDark ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
                <span className="text-sm text-foreground">Dark Mode</span>
              </div>
              <button onClick={toggleTheme} data-testid="btn-toggle-theme"
                className={cn("relative h-6 w-11 rounded-full transition-colors", isDark ? "bg-primary" : "bg-secondary border border-border")}>
                <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", isDark ? "translate-x-5" : "translate-x-0.5")} />
              </button>
            </div>
          </div>

          {/* Security — Change PIN */}
          <div className="bg-white dark:bg-card rounded-2xl px-4 shadow-sm">
            <button onClick={() => setChangingPin(!changingPin)}
              className="w-full flex items-center justify-between py-3.5 -mx-0 transition-colors"
              data-testid="btn-change-pin">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Change Transaction PIN</span>
              </div>
              <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", changingPin && "rotate-90")} />
            </button>

            {changingPin && (
              <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                onSubmit={handleChangePin} className="space-y-3 pb-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Current PIN</Label>
                  <Input type="password" inputMode="numeric" maxLength={6} placeholder="••••••"
                    value={pinForm.current} onChange={(e) => setPinForm(f => ({ ...f, current: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">New PIN (6 digits)</Label>
                  <Input type="password" inputMode="numeric" maxLength={6} placeholder="••••••"
                    value={pinForm.next} onChange={(e) => setPinForm(f => ({ ...f, next: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Confirm New PIN</Label>
                  <Input type="password" inputMode="numeric" maxLength={6} placeholder="••••••"
                    value={pinForm.confirm} onChange={(e) => setPinForm(f => ({ ...f, confirm: e.target.value }))} />
                </div>
                {pinError && <p className="text-xs text-red-500">{pinError}</p>}
                {pinSuccess && <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" />PIN updated successfully</p>}
                <button type="submit" disabled={pinLoading}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-xl text-sm font-bold disabled:opacity-50">
                  {pinLoading ? "Updating..." : "Update PIN"}
                </button>
              </motion.form>
            )}
          </div>

          {/* Sign out */}
          <button onClick={handleSignOut}
            className="w-full bg-white dark:bg-card rounded-2xl px-4 py-4 flex items-center gap-3 shadow-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            data-testid="btn-sign-out">
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-semibold">Sign Out</span>
          </button>

        </div>
      </div>
      <BottomNav />
    </div>
  );
}
