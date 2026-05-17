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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { User, Mail, Phone, CreditCard, LogOut, ChevronRight, Shield, Copy, CheckCircle, Camera, Trash2, Sun, Moon, Upload } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

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

  const initials = userData ? `${userData.firstName?.[0] ?? ""}${userData.lastName?.[0] ?? ""}`.toUpperCase() : "?";

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
      () => { setUploadError("Upload failed. Try again."); setUploadProgress(null); },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        await updateDoc(doc(db, "users", user.uid), { profileImg: url });
        setUploadProgress(null);
      }
    );
  };

  const handleRemovePhoto = async () => {
    try {
      const storageRef = ref(storage, `profileImages/${user.uid}`);
      await deleteObject(storageRef).catch(() => {});
      await updateDoc(doc(db, "users", user.uid), { profileImg: "" });
    } catch { setUploadError("Could not remove photo."); }
  };

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
    <div className="min-h-screen bg-background">
      <div className="max-w-[430px] mx-auto">
        <PageHeader title="My Profile" back={false} />

        <div className="px-4 pt-4 pb-24 space-y-4">
          {/* Avatar + Photo Upload */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-2xl p-5 flex flex-col items-center text-center border border-border">
            <div className="relative mb-3">
              {userData?.profileImg ? (
                <img src={userData.profileImg} alt="avatar" className="h-24 w-24 rounded-full object-cover ring-4 ring-primary/20" data-testid="img-profile" />
              ) : (
                <div className="h-24 w-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold">{initials}</div>
              )}
              {uploadProgress !== null && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{uploadProgress}%</span>
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
                data-testid="btn-upload-photo"
                disabled={uploadProgress !== null}
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
              data-testid="input-photo"
            />

            <h2 className="text-lg font-bold text-foreground" data-testid="text-full-name">{userData?.firstName} {userData?.lastName}</h2>
            <p className="text-sm text-muted-foreground mt-0.5" data-testid="text-profile-email">{userData?.email}</p>

            {uploadError && <p className="text-xs text-red-500 mt-2">{uploadError}</p>}

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadProgress !== null}
                className="flex items-center gap-1.5 text-xs text-primary font-medium bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
                data-testid="btn-change-photo"
              >
                <Upload className="h-3 w-3" />
                {userData?.profileImg ? "Change Photo" : "Upload Photo"}
              </button>
              {userData?.profileImg && (
                <button
                  onClick={handleRemovePhoto}
                  className="flex items-center gap-1.5 text-xs text-red-500 font-medium bg-red-50 dark:bg-red-950/30 px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors"
                  data-testid="btn-remove-photo"
                >
                  <Trash2 className="h-3 w-3" />
                  Remove
                </button>
              )}
            </div>

            {uploadProgress !== null && (
              <div className="w-full mt-3">
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Uploading... {uploadProgress}%</p>
              </div>
            )}
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

          {/* Appearance */}
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Appearance</p>
              <div className="flex items-center gap-3 py-2">
                <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center">
                  {isDark ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
                </div>
                <span className="flex-1 text-sm font-medium text-foreground">{isDark ? "Dark Mode" : "Light Mode"}</span>
                <button
                  onClick={toggleTheme}
                  data-testid="btn-toggle-theme"
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors",
                    isDark ? "bg-primary" : "bg-secondary border border-border"
                  )}
                >
                  <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform", isDark ? "translate-x-5" : "translate-x-0.5")} />
                </button>
              </div>
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
