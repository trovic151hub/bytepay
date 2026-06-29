import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/useToast";
import {
  ChevronRight, Camera, Shield, Copy, CheckCircle,
  Info, Trash2, ArrowLeft, X, Check,
} from "lucide-react";
import { LogoIcon } from "@/components/LogoLoader";
import { RiUser3Line, RiShieldCheckLine } from "react-icons/ri";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

const cs = (label) => () =>
  toast({ title: "Coming Soon", description: `${label} is coming soon.` });

// ── Row ───────────────────────────────────────────────────────────────────────
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

// ── Generic edit bottom sheet ─────────────────────────────────────────────────
function EditFieldSheet({ open, onClose, label, firestoreKey, currentValue, uid, inputType = "text", placeholder }) {
  const [val, setVal] = useState(currentValue ?? "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!val.trim()) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", uid), { [firestoreKey]: val.trim() });
      toast({ title: "Updated", description: `${label} has been saved.` });
      onClose();
    } catch {
      toast({ title: "Error", description: "Failed to save. Try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto z-50 bg-white dark:bg-card rounded-t-3xl px-6 pt-5 pb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-foreground">Edit {label}</h2>
              <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">{label}</label>
            <input
              type={inputType}
              placeholder={placeholder ?? `Enter ${label.toLowerCase()}`}
              value={val}
              onChange={(e) => setVal(e.target.value)}
              autoFocus
              className="w-full border border-border rounded-xl px-4 py-3.5 text-sm bg-secondary/30 dark:bg-secondary/10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleSave}
              disabled={loading || !val.trim()}
              className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-2xl mt-4 disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Full Name sheet (two fields) ──────────────────────────────────────────────
function EditNameSheet({ open, onClose, uid, firstName, lastName }) {
  const [first, setFirst] = useState(firstName ?? "");
  const [last, setLast] = useState(lastName ?? "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!first.trim() || !last.trim()) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", uid), {
        firstName: first.trim(),
        lastName: last.trim(),
      });
      toast({ title: "Updated", description: "Your name has been saved." });
      onClose();
    } catch {
      toast({ title: "Error", description: "Failed to save. Try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto z-50 bg-white dark:bg-card rounded-t-3xl px-6 pt-5 pb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-foreground">Edit Full Name</h2>
              <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">First Name</label>
                <input
                  placeholder="First name"
                  value={first}
                  onChange={(e) => setFirst(e.target.value)}
                  autoFocus
                  className="w-full border border-border rounded-xl px-4 py-3.5 text-sm bg-secondary/30 dark:bg-secondary/10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Last Name</label>
                <input
                  placeholder="Last name"
                  value={last}
                  onChange={(e) => setLast(e.target.value)}
                  className="w-full border border-border rounded-xl px-4 py-3.5 text-sm bg-secondary/30 dark:bg-secondary/10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={loading || !first.trim() || !last.trim()}
              className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-2xl mt-5 disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Gender select sheet ───────────────────────────────────────────────────────
const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];

function GenderSheet({ open, onClose, uid, current }) {
  const [selected, setSelected] = useState(current ?? "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", uid), { gender: selected });
      toast({ title: "Updated", description: "Gender has been saved." });
      onClose();
    } catch {
      toast({ title: "Error", description: "Failed to save." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto z-50 bg-white dark:bg-card rounded-t-3xl px-6 pt-5 pb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-foreground">Select Gender</h2>
              <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="divide-y divide-border/40">
              {GENDERS.map((g) => (
                <button key={g} onClick={() => setSelected(g)}
                  className="w-full flex items-center justify-between py-4 text-sm font-medium text-foreground">
                  {g}
                  {selected === g && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
            <button
              onClick={handleSave}
              disabled={loading || !selected}
              className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-2xl mt-5 disabled:opacity-50"
            >
              {loading ? "Saving…" : "Confirm"}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, userData } = useAuth();
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  // which sheet is open
  const [sheet, setSheet] = useState(null); // null | field key string

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

  const lastLogin = new Date()
    .toLocaleString("sv-SE", { hour12: false })
    .replace("T", " ")
    .slice(0, 19)
    .replace(/-/g, "/");

  const uid = user?.uid;

  return (
    <div className="min-h-screen bg-[#F4F2FA] dark:bg-background">
      <div className="max-w-[430px] mx-auto">
        <header className="sticky top-0 z-40 bg-[#F4F2FA] dark:bg-background px-4 pt-6 pb-3">
          <button onClick={() => window.history.back()} className="flex items-center gap-2 text-foreground">
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
                    <LogoIcon size="xs" />
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
                  Hi, {(userData?.nickname ?? userData?.firstName)?.toUpperCase() ?? "USER"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Last login: {lastLogin}</p>
                {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
              </div>
              {userData?.profileImg && (
                <button onClick={handleRemovePhoto} className="text-xs text-red-500 flex items-center gap-1 shrink-0">
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
              showChevron={false}
            />
            <Row
              label="Email"
              value={userData?.email ?? "—"}
              valueIcon={<Shield className="h-3.5 w-3.5 text-green-500 shrink-0" />}
              showChevron={false}
            />
            <Row
              label="Nick Name"
              value={userData?.nickname ?? userData?.firstName?.toLowerCase() ?? "—"}
              onClick={() => setSheet("nickname")}
            />
          </div>

          {/* KYC & Personal info */}
          <div className="bg-white dark:bg-card rounded-2xl px-4 shadow-sm">
            <Row
              label="KYC Level"
              valueIcon={<KycBadge />}
              onClick={cs("KYC Upgrade")}
            />
            <Row
              label="Full Name"
              labelIcon={<Info className="h-3.5 w-3.5 text-muted-foreground" />}
              value={fullName || "—"}
              onClick={() => setSheet("fullname")}
            />
            <Row
              label="Gender"
              value={userData?.gender ?? "—"}
              onClick={() => setSheet("gender")}
            />
            <Row
              label="Date of Birth"
              value={userData?.dateOfBirth ?? "—"}
              onClick={() => setSheet("dob")}
            />
            <Row
              label="Mobile Number"
              value={userData?.phoneNumber ?? "—"}
              onClick={() => setSheet("phone")}
            />
            <Row
              label="Address"
              value={userData?.address || "—"}
              onClick={() => setSheet("address")}
            />
            <Row
              label="Occupation"
              value={userData?.occupation || "—"}
              onClick={() => setSheet("occupation")}
            />
          </div>

          {/* Management */}
          <div className="bg-white dark:bg-card rounded-2xl px-4 shadow-sm">
            <Row label="Management of Accounts" badge onClick={cs("Account Management")} />
          </div>

          {/* Friends */}
          <div className="bg-white dark:bg-card rounded-2xl px-4 shadow-sm">
            <div
              onClick={cs("Friends")}
              className="flex items-center justify-between py-4 cursor-pointer active:bg-secondary/40"
            >
              <div>
                <p className="text-sm font-medium text-foreground">Friends</p>
                <p className="text-xs text-muted-foreground mt-0.5">Manage relationship, get benefits.</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </div>

        </div>
      </div>

      {/* Nick Name */}
      <EditFieldSheet
        open={sheet === "nickname"}
        onClose={() => setSheet(null)}
        label="Nick Name"
        firestoreKey="nickname"
        currentValue={userData?.nickname ?? userData?.firstName ?? ""}
        uid={uid}
        placeholder="Enter nick name"
      />

      {/* Full Name */}
      <EditNameSheet
        open={sheet === "fullname"}
        onClose={() => setSheet(null)}
        uid={uid}
        firstName={userData?.firstName ?? ""}
        lastName={userData?.lastName ?? ""}
      />

      {/* Gender */}
      <GenderSheet
        open={sheet === "gender"}
        onClose={() => setSheet(null)}
        uid={uid}
        current={userData?.gender ?? ""}
      />

      {/* Date of Birth */}
      <EditFieldSheet
        open={sheet === "dob"}
        onClose={() => setSheet(null)}
        label="Date of Birth"
        firestoreKey="dateOfBirth"
        currentValue={userData?.dateOfBirth ?? ""}
        uid={uid}
        inputType="date"
      />

      {/* Phone */}
      <EditFieldSheet
        open={sheet === "phone"}
        onClose={() => setSheet(null)}
        label="Mobile Number"
        firestoreKey="phoneNumber"
        currentValue={userData?.phoneNumber ?? ""}
        uid={uid}
        inputType="tel"
        placeholder="e.g. 08012345678"
      />

      {/* Address */}
      <EditFieldSheet
        open={sheet === "address"}
        onClose={() => setSheet(null)}
        label="Address"
        firestoreKey="address"
        currentValue={userData?.address ?? ""}
        uid={uid}
        placeholder="Enter your home address"
      />

      {/* Occupation */}
      <EditFieldSheet
        open={sheet === "occupation"}
        onClose={() => setSheet(null)}
        label="Occupation"
        firestoreKey="occupation"
        currentValue={userData?.occupation ?? ""}
        uid={uid}
        placeholder="e.g. Software Engineer"
      />
    </div>
  );
}
