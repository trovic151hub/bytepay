import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle, Building2, Info } from "lucide-react";

export default function AddMoneyPage() {
  const { userData } = useAuth();
  const [copied, setCopied] = useState(null);

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const details = [
    { label: "Bank Name", value: "BytePay MFB", key: "bank" },
    { label: "Account Number", value: userData?.accountNumber ?? "—", key: "acc" },
    { label: "Account Name", value: `${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`.trim() || "—", key: "name" },
  ];

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <div className="max-w-[430px] mx-auto">
        <PageHeader title="Add Money" />

        <div className="px-4 py-4 space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white text-center">
            <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <h2 className="font-bold text-lg">Fund Your Wallet</h2>
            <p className="text-blue-200 text-sm mt-1">Transfer to your dedicated BytePay account below</p>
          </motion.div>

          <Card>
            <CardContent className="pt-4 space-y-3">
              {details.map(({ label, value, key }) => (
                <div key={key} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-foreground" data-testid={`text-${key}`}>{value}</p>
                  </div>
                  <button onClick={() => copy(value, key)} className="p-2 rounded-xl hover:bg-secondary transition-colors" data-testid={`btn-copy-${key}`}>
                    {copied === key ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
            <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">How it works</p>
              <ul className="text-xs text-blue-700 mt-1 space-y-1">
                <li>1. Copy your account number above</li>
                <li>2. Transfer from any Nigerian bank app</li>
                <li>3. Your BytePay balance updates instantly</li>
              </ul>
            </div>
          </div>

          <Button className="w-full" onClick={() => copy(userData?.accountNumber ?? "", "acc")} variant="outline" data-testid="button-copy-all">
            {copied === "acc" ? <><CheckCircle className="h-4 w-4 mr-2 text-green-500" />Copied!</> : <><Copy className="h-4 w-4 mr-2" />Copy Account Number</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
