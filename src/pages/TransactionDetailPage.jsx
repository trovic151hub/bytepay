import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Headphones, Copy, Check, ChevronRight, FileText, MessageCircle } from "lucide-react";
import { RiCheckboxCircleFill, RiCloseCircleFill, RiTimeLine } from "react-icons/ri";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

function BPayBadge() {
  return (
    <div className="flex items-center justify-center gap-1.5 mb-3">
      <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center">
        <span className="text-white text-[11px] font-black">B</span>
      </div>
      <span className="text-sm font-bold text-foreground">Pay</span>
    </div>
  );
}

function TimelineStep({ label, sub, time, state, isFirst, isLast }) {
  return (
    <div className="flex flex-col items-center flex-1 min-w-0">
      {/* connector + dot row */}
      <div className="flex items-center w-full">
        <div className={cn("flex-1 h-0.5", isFirst ? "invisible" : state === "done" ? "bg-green-500" : "bg-gray-200")} />
        {state === "done" ? (
          <div className="h-7 w-7 rounded-full bg-green-500 flex items-center justify-center shrink-0">
            <Check className="h-4 w-4 text-white stroke-[3]" />
          </div>
        ) : state === "pending" ? (
          <div className="h-7 w-7 rounded-full border-2 border-yellow-400 bg-white flex items-center justify-center shrink-0">
            <RiTimeLine className="text-yellow-400 text-sm" />
          </div>
        ) : (
          <div className="h-7 w-7 rounded-full border-2 border-gray-200 bg-white shrink-0" />
        )}
        <div className={cn("flex-1 h-0.5", isLast ? "invisible" : state === "done" ? "bg-green-500" : "bg-gray-200")} />
      </div>
      <p className="text-[11px] font-medium text-foreground text-center mt-1.5 leading-tight">{label}</p>
      {sub && <p className="text-[11px] text-foreground text-center leading-tight">{sub}</p>}
      {time && <p className="text-[10px] text-muted-foreground text-center mt-0.5">{time}</p>}
    </div>
  );
}

function DetailRow({ label, children, noBorder }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 py-3.5 px-5", !noBorder && "border-b border-border/40")}>
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  );
}

function parseRecipient(tx) {
  const desc = tx.description ?? "";
  if (desc.includes(" - ")) return desc.split(" - ").slice(1).join(" - ").toUpperCase();
  return desc;
}

function formatStepTime(d) {
  const m  = d.getMonth() + 1;
  const day = d.getDate();
  const hh  = String(d.getHours()).padStart(2, "0");
  const mm  = String(d.getMinutes()).padStart(2, "0");
  const ampm = d.getHours() >= 12 ? "PM" : "AM";
  return `${m}-${day} ${hh}:${mm} ${ampm}`;
}

export default function TransactionDetailPage() {
  const [, setLocation] = useLocation();
  const [, params]      = useRoute("/transaction/:id");
  const { userData }    = useAuth();
  const [tx, setTx]           = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);

  const txId = params?.id;

  useEffect(() => {
    if (!userData?.uid || !txId) return;
    getDoc(doc(db, "users", userData.uid, "transactions", txId)).then((snap) => {
      if (snap.exists()) setTx({ id: snap.id, ...snap.data() });
      setLoading(false);
    });
  }, [userData?.uid, txId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F2FA] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="min-h-screen bg-[#F4F2FA] flex flex-col items-center justify-center gap-3">
        <p className="text-foreground font-semibold">Transaction not found</p>
        <button onClick={() => setLocation("/history")} className="text-primary text-sm font-medium">
          ← Back to history
        </button>
      </div>
    );
  }

  const d         = tx.date?.toDate ? tx.date.toDate() : new Date();
  const isCredit  = tx.type === "credit";
  const isSuccess  = !tx.status || tx.status === "success";
  const isDeclined = tx.status === "declined";
  const isFailed   = tx.status === "failed" || isDeclined;
  const isPending  = tx.status === "pending";

  const amount    = (tx.amount ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2 });
  const recipient = parseRecipient(tx);
  const stepTime  = formatStepTime(d);

  // derive a numeric-looking session ID from the Firestore doc ID
  const sessionId = txId
    .replace(/[^a-zA-Z0-9]/g, "")
    .split("")
    .map((c) => c.charCodeAt(0).toString().slice(-1))
    .join("")
    .slice(0, 28)
    .padEnd(28, "0");

  const completionTime = `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")},${d.toLocaleDateString("en-NG",{ month:"short", day:"numeric", year:"numeric" })}`;

  const step1State = isSuccess || isPending ? "done"    : "idle";
  const step2State = isSuccess || isPending ? "done"    : "idle";
  const step3State = isSuccess              ? "done"    : isPending ? "pending" : "idle";

  const steps = isCredit
    ? [
        { label: "Payment",   sub: "received"     },
        { label: "Credited",  sub: "to account"   },
        { label: "Completed", sub: ""              },
      ]
    : [
        { label: "Payment",   sub: "successful"   },
        { label: "Submitted", sub: "to bank"      },
        { label: "Received",  sub: "by bank"      },
      ];
  const stepStates = [step1State, step2State, step3State];

  const copySession = () => {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F4F2FA] dark:bg-background">
      <div className="max-w-[430px] mx-auto pb-24">

        {/* Header */}
        <div className="sticky top-0 z-40 bg-[#F4F2FA] dark:bg-background px-4 pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setLocation("/history")}
              className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-white">
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <h1 className="text-base font-bold text-foreground">Transaction detail</h1>
          </div>
          <button className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-white">
            <Headphones className="h-5 w-5 text-foreground" />
          </button>
        </div>

        <div className="px-4 space-y-3">

          {/* ── Main card ── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-card rounded-2xl p-5 shadow-sm">

            <BPayBadge />

            <p className="text-center text-sm text-muted-foreground mb-1">
              {isCredit ? "From" : "To"} {recipient}
            </p>
            <p className="text-center text-4xl font-black text-foreground mb-3">
              ₦{amount}
            </p>

            {/* Status badge */}
            <div className="flex justify-center mb-5">
              {isSuccess ? (
                <div className="flex items-center gap-1.5 bg-green-50 text-green-600 text-sm font-semibold px-4 py-1.5 rounded-full">
                  <RiCheckboxCircleFill className="text-base" />
                  Successful
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              ) : isFailed ? (
                <div className="flex items-center gap-1.5 bg-red-50 text-red-500 text-sm font-semibold px-4 py-1.5 rounded-full">
                  <RiCloseCircleFill className="text-base" />
                  {isDeclined ? "Declined" : "Failed"}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-yellow-50 text-yellow-600 text-sm font-semibold px-4 py-1.5 rounded-full">
                  <RiTimeLine className="text-base" />
                  Pending
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="flex items-start justify-between mb-5 px-1">
              {steps.map((s, i) => (
                <TimelineStep
                  key={i}
                  label={s.label}
                  sub={s.sub}
                  time={stepTime}
                  state={stepStates[i]}
                  isFirst={i === 0}
                  isLast={i === steps.length - 1}
                />
              ))}
            </div>

            {/* Info box */}
            <div className="bg-gray-50 dark:bg-secondary/50 rounded-xl px-4 py-3">
              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                {isCredit
                  ? "This credit has been successfully processed and reflected in your BytePay account balance."
                  : "The transfer has been successfully paid and submitted to the recipient bank. Kindly note the actual credited time is subject to the bank."}
              </p>
            </div>
          </motion.div>

          {/* ── Amount breakdown ── */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white dark:bg-card rounded-2xl overflow-hidden shadow-sm">

            <DetailRow label="Transfer Amount">
              <span className="text-sm font-semibold text-foreground">₦{amount}</span>
            </DetailRow>

            <DetailRow label="Fee">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">₦0.00</span>
                <span className="text-xs text-muted-foreground line-through">₦9.00</span>
              </div>
            </DetailRow>

            <DetailRow label="Payment Amount" noBorder>
              <span className="text-sm font-bold text-foreground">₦{amount}</span>
            </DetailRow>
          </motion.div>

          {/* ── Recipient + Session ID ── */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-white dark:bg-card rounded-2xl overflow-hidden shadow-sm">

            <DetailRow label="Recipient">
              <p className="text-sm font-bold text-foreground">{recipient || tx.description}</p>
              <p className="text-xs text-muted-foreground mt-0.5">BytePay MFB</p>
            </DetailRow>

            <DetailRow label="Session ID" noBorder>
              <div className="flex items-start gap-2 justify-end">
                <p className="text-sm font-semibold text-foreground break-all max-w-[170px] text-right">
                  {sessionId}
                </p>
                <button onClick={copySession} className="shrink-0 mt-0.5 text-muted-foreground hover:text-primary">
                  {copied
                    ? <Check className="h-4 w-4 text-green-500" />
                    : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </DetailRow>
          </motion.div>

          {/* ── Session ID usage note ── */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-100 dark:bg-secondary/50 rounded-2xl px-4 py-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              If the recipient account is not credited within 5 minutes, please use the Session ID to{" "}
              <span className="text-primary font-medium">contact the recipient bank.</span>{" "}
              <span className="text-primary">📞</span>
            </p>
          </motion.div>

          {/* ── Completion time ── */}
          <div className="flex items-center justify-between px-1 py-1">
            <span className="text-sm text-muted-foreground">Completion Time</span>
            <span className="text-sm font-semibold text-foreground">{completionTime}</span>
          </div>

        </div>
      </div>

      {/* ── Bottom action bar ── */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-white dark:bg-card border-t border-border/40 flex"
        style={{paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
        <button className="flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold text-primary">
          <FileText className="h-5 w-5" />
          View Receipt
        </button>
        <div className="w-px bg-border/40 my-3" />
        <button className="flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold text-primary">
          <MessageCircle className="h-5 w-5" />
          Report a Dispute
        </button>
      </div>
    </div>
  );
}
