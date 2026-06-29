import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { doc, updateDoc, addDoc, collection, serverTimestamp, increment } from "firebase/firestore";
import bcrypt from "bcryptjs";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import PageHeader from "@/components/PageHeader";
import PinModal from "@/components/PinModal";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle, AlertCircle, ChevronDown, User } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

const NETWORKS = [
  { name: "MTN", bg: "bg-yellow-400", text: "text-yellow-900", short: "MTN" },
  { name: "Airtel", bg: "bg-red-500", text: "text-white", short: "AIR" },
  { name: "Glo", bg: "bg-green-600", text: "text-white", short: "GLO" },
  { name: "9mobile", bg: "bg-emerald-500", text: "text-white", short: "9MB" },
];

const TABS = ["Best Offers", "Daily", "Weekly", "Monthly", "Social"];

const BUNDLES = {
  "Best Offers": [
    { size: "9GB", unit: "GB", days: "7 DAYS", price: 2000, cashback: "₦30 Cashback", highlight: true },
    { size: "1GB", unit: "GB", days: "7 DAYS", price: 350, label: "Best Price" },
    { size: "3GB", unit: "GB", days: "7 DAYS", price: 1000, label: "Best Price" },
    { size: "1GB", unit: "GB", days: "3 DAYS", price: 300, label: "Best Price" },
    { size: "200MB", unit: "MB", days: "14 days", price: 150, label: "Best Price" },
    { size: "500MB", unit: "MB", days: "30 days", price: 250, label: "Best Price" },
    { size: "1GB", unit: "GB", days: "30 days", price: 480, label: "Best Price" },
    { size: "2GB", unit: "GB", days: "30 days", price: 950, label: "Best Price" },
    { size: "6GB", unit: "GB", days: "30 days", price: 2800, label: "Best Price" },
    { size: "45MB", unit: "MB", days: "1 DAY", price: 50, label: "Best Price" },
    { size: "125MB", unit: "MB", days: "1 DAY", price: 100, label: "Best Price" },
    { size: "3.7GB", unit: "GB", days: "7 DAYS", price: 1000, label: "Best Price" },
  ],
  "Daily": [
    { size: "45MB", unit: "MB", days: "1 day", price: 50, label: "Best Price" },
    { size: "125MB", unit: "MB", days: "1 day", price: 100, label: "Best Price" },
    { size: "350MB", unit: "MB", days: "1 day", price: 150, label: "Best Price" },
    { size: "750MB", unit: "MB", days: "1 day", price: 200, label: "Best Price" },
    { size: "1.5GB", unit: "GB", days: "1 day", price: 300, label: "Best Price" },
    { size: "3GB", unit: "GB", days: "1 day", price: 500, label: "Best Price" },
  ],
  "Weekly": [
    { size: "1GB", unit: "GB", days: "7 days", price: 350, label: "Best Price" },
    { size: "3GB", unit: "GB", days: "7 days", price: 1000, label: "Best Price" },
    { size: "3.7GB", unit: "GB", days: "7 days", price: 1000, label: "Best Price" },
    { size: "5GB", unit: "GB", days: "7 days", price: 1500, label: "Best Price" },
    { size: "9GB", unit: "GB", days: "7 days", price: 2000, cashback: "₦30 Cashback", highlight: true },
    { size: "15GB", unit: "GB", days: "7 days", price: 3000, label: "Best Price" },
  ],
  "Monthly": [
    { size: "500MB", unit: "MB", days: "30 days", price: 250, label: "Best Price" },
    { size: "1GB", unit: "GB", days: "30 days", price: 480, label: "Best Price" },
    { size: "2GB", unit: "GB", days: "30 days", price: 950, label: "Best Price" },
    { size: "5GB", unit: "GB", days: "30 days", price: 1800, label: "Best Price" },
    { size: "6GB", unit: "GB", days: "30 days", price: 2800, label: "Best Price" },
    { size: "10GB", unit: "GB", days: "30 days", price: 3500, label: "Best Price" },
  ],
  "Social": [
    { size: "WhatsApp", unit: "", days: "30 days", price: 200, label: "Best Price" },
    { size: "Twitter", unit: "", days: "30 days", price: 200, label: "Best Price" },
    { size: "Facebook", unit: "", days: "30 days", price: 200, label: "Best Price" },
    { size: "TikTok", unit: "", days: "30 days", price: 300, label: "Best Price" },
    { size: "Instagram", unit: "", days: "30 days", price: 300, label: "Best Price" },
    { size: "All Social", unit: "", days: "30 days", price: 500, label: "Best Price" },
  ],
};

export default function DataPage() {
  const { user, userData } = useAuth();
  const [, setLocation] = useLocation();
  const [network, setNetwork] = useState(NETWORKS[2]);
  const [phone, setPhone] = useState(userData?.phoneNumber ?? "");
  const [tab, setTab] = useState("Best Offers");
  const [bundle, setBundle] = useState(null);
  const [showNetworkPicker, setShowNetworkPicker] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [formError, setFormError] = useState("");

  const validate = () => {
    if (phone.length < 10) { setFormError("Enter a valid phone number."); return false; }
    if (!bundle) { setFormError("Select a data bundle."); return false; }
    if (bundle.price > (userData?.accountBalance ?? 0)) { setFormError("Insufficient balance."); return false; }
    setFormError(""); return true;
  };

  const handlePinConfirm = async (pin) => {
    const match = await bcrypt.compare(pin, userData.transactionPin);
    if (!match) throw new Error("Incorrect PIN. Try again.");
    setPinLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { accountBalance: increment(-bundle.price) });
      await addDoc(collection(db, "users", user.uid, "transactions"), {
        amount: bundle.price, type: "debit", status: "success",
        description: `${network.name} ${bundle.size} data for ${phone}`,
        date: serverTimestamp(),
      });
      setPinOpen(false); setStatus("success");
    } catch { throw new Error("Purchase failed. Try again."); }
    finally { setPinLoading(false); }
  };

  if (status === "success") return (
    <div className="min-h-screen bg-[#F4F2FA] dark:bg-background flex items-center justify-center px-6">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="text-center max-w-[400px] w-full">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-1">Data Activated!</h2>
        <p className="text-muted-foreground mb-1">{bundle?.size} {network.name} data for</p>
        <p className="text-lg font-semibold mb-6">{phone}</p>
        <button className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold mb-3" onClick={() => setLocation("/dashboard")} data-testid="button-back-home">Back to Home</button>
        <button className="w-full bg-secondary text-foreground py-3.5 rounded-xl font-bold border border-border" onClick={() => { setStatus(null); setBundle(null); }} data-testid="button-buy-again">Buy Again</button>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F2FA] dark:bg-background">
      <div className="max-w-[430px] mx-auto">
        <PageHeader title="Data" />

        <div className="px-4 py-3 space-y-3">

          {/* Promo Banner */}
          <div className="bg-white dark:bg-card rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 flex items-center gap-3">
              <div>
                <p className="text-white font-black text-lg italic">Flex your Data<br />with Airtel</p>
                <p className="text-white/80 text-xs mt-1">Enjoy Flexi & MiFi Bundles At Hot Prices</p>
              </div>
              <div className="ml-auto flex items-center justify-center h-12 w-12 rounded-full bg-white/20 text-2xl">📡</div>
            </div>
            <div className="flex gap-1 p-2 justify-center">
              <span className="h-1.5 w-5 rounded-full bg-primary" />
              <span className="h-1.5 w-1.5 rounded-full bg-border" />
              <span className="h-1.5 w-1.5 rounded-full bg-border" />
            </div>
          </div>

          {/* Network + Phone */}
          <div className="bg-white dark:bg-card rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <button onClick={() => setShowNetworkPicker(!showNetworkPicker)}
                  className={`h-12 w-12 rounded-full ${network.bg} flex items-center justify-center gap-0.5`}>
                  <span className={`text-xs font-black ${network.text}`}>{network.short}</span>
                  <ChevronDown className={`h-3 w-3 ${network.text}`} />
                </button>
                {showNetworkPicker && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    className="absolute top-14 left-0 z-50 bg-white dark:bg-card rounded-xl shadow-xl border border-border overflow-hidden w-36">
                    {NETWORKS.map((n) => (
                      <button key={n.name} onClick={() => { setNetwork(n); setShowNetworkPicker(false); }}
                        className={cn("w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium hover:bg-secondary transition-colors", network.name === n.name && "bg-secondary")}>
                        <div className={`h-6 w-6 rounded-full ${n.bg} flex items-center justify-center`}>
                          <span className={`text-[9px] font-black ${n.text}`}>{n.short}</span>
                        </div>
                        {n.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
              <Input type="tel" value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                className="flex-1 text-base font-bold" placeholder="Enter phone number"
                data-testid="input-phone" />
              <button className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-primary" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enjoy up to 2% Cashback, with a maximum of ₦30, on your first two {network.name} bundle recharges daily.
            </p>
          </div>

          {/* Tabs */}
          <div className="bg-white dark:bg-card rounded-2xl shadow-sm overflow-hidden">
            <div className="flex border-b border-border px-4 pt-2 gap-4 overflow-x-auto scrollbar-hide">
              {TABS.map((t) => (
                <button key={t} onClick={() => { setTab(t); setBundle(null); }}
                  className={cn(
                    "pb-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                    tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  )}>
                  {t}
                </button>
              ))}
            </div>

            <div className="p-4">
              <AnimatePresence mode="wait">
                <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="grid grid-cols-3 gap-2">
                  {(BUNDLES[tab] ?? []).map((b, i) => (
                    <button key={i} onClick={() => setBundle(b)}
                      className={cn(
                        "p-3 rounded-xl border-2 text-left transition-all",
                        bundle === b ? "border-primary bg-primary/8" : "border-border hover:border-primary/40"
                      )}
                      data-testid={`bundle-${b.size}-${b.days}`}>
                      <p className="text-[10px] text-muted-foreground uppercase font-medium">{b.days}</p>
                      <p className={cn("text-xl font-black mt-0.5", bundle === b ? "text-primary" : "text-foreground")}>
                        {b.size}
                        <span className="text-xs font-normal ml-0.5">{b.unit}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">₦{b.price.toLocaleString()}</p>
                      {b.highlight ? (
                        <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-md font-bold mt-1 inline-block">
                          Buy Again
                        </span>
                      ) : (
                        <span className="text-[9px] text-muted-foreground mt-1 inline-block">Best Price</span>
                      )}
                    </button>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {formError && (
            <p className="text-red-500 text-sm bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-xl flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />{formError}
            </p>
          )}

          {bundle && (
            <button className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold text-sm"
              onClick={() => { if (validate()) setPinOpen(true); }}
              data-testid="button-continue">
              Buy {bundle.size} for {formatCurrency(bundle.price)}
            </button>
          )}

          {/* More Services */}
          <div className="bg-white dark:bg-card rounded-2xl shadow-sm overflow-hidden">
            <p className="text-sm font-semibold text-foreground px-4 pt-4 pb-2">More Services</p>
            {[
              { emoji: "📶", label: "Top up Data Bundle with *861", sub: "If network is unavailable" },
              { emoji: "#️⃣", label: "Short Code Enquiry", sub: "SIM card basic information inquiry" },
              { emoji: "🔄", label: "Data Auto-Renew", sub: "Always stay online!" },
            ].map(({ emoji, label, sub }, i, arr) => (
              <button key={label} className={cn("w-full flex items-center gap-3 hover:bg-secondary/50 px-4 py-3 transition-colors text-left", i < arr.length - 1 && "border-b border-border/40")}>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl shrink-0">{emoji}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
                <span className="text-muted-foreground text-lg shrink-0">›</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <PinModal isOpen={pinOpen} onClose={() => setPinOpen(false)} onConfirm={handlePinConfirm} loading={pinLoading} />
    </div>
  );
}
