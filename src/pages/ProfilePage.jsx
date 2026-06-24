import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronRight, Camera, Shield, Copy, CheckCircle, Info, Trash2, ArrowLeft } from "lucide-react";
import { RiUser3Line, RiShieldCheckLine } from "react-icons/ri";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

function Row({ label, labelIcon, value, valueIcon, onClick, showChevron = true, badge }) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      className={cn(
        "w-full flex items-center justify-between py-4 border-b border-border/40 last:border-0 -mx-4 px-4 transition-colors",
        onClick && "cursor-pointer active:bg-secondary/40"
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {labelIcon}
      </div>
      <div className="flex items-center gap-1.5">
        {badge && <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />}
        {valueIcon}
        {value && <span className="text-sm text-muted-foreground truncate max-w-[180px]">{value}</span>}
        {showChevron && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
      </div>
    </div>
  );
}

function KycBadge() {
  return (
    <div className="flex items-center gap-1 bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full">
      <RiShieldCheckLine className="h-3.5 w-3.5" />
      Tier 3
    </div>
  );
}

export default function ProfilePage() {
  const { user, userData } = useAuth();
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  const fullName = `${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`.trim().toUpperCase();

  const copyAccNum = () => {
    navigator.clipboard.writeText(userData?.accountNumber ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setUploadError("Please select an image file."); return; }
    setUploadError("");
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = async () => {
        const MAX = 300;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg", 0.8);
        try {
          await updateDoc(doc(db, "users", user.uid), { profileImg: base64 });
        } catch { setUploadError("Failed to save photo."); }
        finally { setUploading(false); }
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    try {
      await updateDoc(doc(db, "users", user.uid), { profileImg: "" });
    } catch { setUploadError("Could not remove photo."); }
  };

  const formatAcc = (acc) => {
    if (!acc || acc.length < 10) return acc ?? "—";
    return `${acc.slice(0, 3)} ${acc.slice(3, 6)} ${acc.slice(6)}`;
  };

  const lastLogin = new Date().toLocaleString("sv-SE", { hour12: false }).replace("T", " ").slice(0, 19).replace(/-/g, "/");

  return (
    <div className="min-h-screen bg-[#F4F2FA] dark:bg-background">
      <div className="max-w-[430px] mx-auto">
        <header className="sticky top-0 z-40 bg-[#F4F2FA] dark:bg-background px-4 pt-6 pb-3">
          <button onClick={() => setLocation("/dashboard")} className="flex items-center gap-2 text-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-lg font-semibold">My Profile</span>
          </button>
        </header>

        <div className="px-4 pt-3 pb-8 space-y-3">

          {/* Avatar card */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-card rounded-2xl p-4 shadow-sm">

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />

            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                {userData?.profileImg ? (
                  <img src={userData.profileImg} alt="avatar" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-violet-200 dark:bg-violet-900 flex items-center justify-center">
                    <RiUser3Line className="text-3xl text-white" />
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow"
                >
                  <Camera className="h-3 w-3" />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-base">
                  Hi, {userData?.firstName?.toUpperCase() ?? "USER"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Last login: {lastLogin}</p>
                {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
              </div>

              {userData?.profileImg && (
                <button onClick={handleRemovePhoto}
                  className="text-xs text-red-500 flex items-center gap-1 shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

          </motion.div>

          {/* Account info */}
          <div className="bg-white dark:bg-card rounded-2xl px-4 shadow-sm">
            <Row
              label="Account Number"
              value={formatAcc(userData?.accountNumber)}
              valueIcon={
                <button onClick={copyAccNum} className="text-muted-foreground hover:text-primary">
                  {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
              }
            />
            <Row
              label="Email"
              value={userData?.email ?? "—"}
              valueIcon={<Shield className="h-3.5 w-3.5 text-green-500 shrink-0" />}
            />
            <Row
              label="Nick Name"
              value={userData?.firstName?.toLowerCase() ?? "—"}
            />
          </div>

          {/* KYC & Personal info */}
          <div className="bg-white dark:bg-card rounded-2xl px-4 shadow-sm">
            <Row
              label="KYC Level"
              valueIcon={<KycBadge />}
            />
            <Row
              label="Full Name"
              labelIcon={<Info className="h-3.5 w-3.5 text-muted-foreground" />}
              value={fullName || "—"}
            />
            <Row label="Gender" value="—" />
            <Row label="Date of Birth" value="—" />
            <Row label="Mobile Number" value={userData?.phoneNumber ?? "—"} />
            <Row label="Address" value="" />
            <Row label="Occupation" value="" />
          </div>

          {/* Management */}
          <div className="bg-white dark:bg-card rounded-2xl px-4 shadow-sm">
            <Row label="Management of Accounts" badge={true} />
          </div>

          {/* Friends */}
          <div className="bg-white dark:bg-card rounded-2xl px-4 shadow-sm">
            <div className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-medium text-foreground">Friends</p>
                <p className="text-xs text-muted-foreground mt-0.5">Manage relationship, get benefits.</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}
