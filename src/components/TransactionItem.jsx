import { ArrowUpRight, ArrowDownLeft, Zap, Phone, Wifi, Gamepad2 } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const iconMap = {
  airtime: Phone,
  data: Wifi,
  electricity: Zap,
  betting: Gamepad2,
  credit: ArrowDownLeft,
  debit: ArrowUpRight,
};

function getTxIcon(description = "", type) {
  const desc = description.toLowerCase();
  if (desc.includes("airtime")) return iconMap.airtime;
  if (desc.includes("data")) return iconMap.data;
  if (desc.includes("electricity") || desc.includes("power")) return iconMap.electricity;
  if (desc.includes("betting") || desc.includes("bet")) return iconMap.betting;
  return type === "credit" ? iconMap.credit : iconMap.debit;
}

export default function TransactionItem({ transaction }) {
  const { amount, type, status, description, date } = transaction;
  const isCredit = type === "credit";
  const Icon = getTxIcon(description, type);

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0" data-testid={`tx-item-${transaction.id}`}>
      <div className={cn(
        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
        isCredit ? "bg-green-100" : "bg-red-100"
      )}>
        <Icon className={cn("h-5 w-5", isCredit ? "text-green-600" : "text-red-500")} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{description || (isCredit ? "Money Received" : "Payment")}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(date)}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={cn("text-sm font-semibold", isCredit ? "text-green-600" : "text-red-500")}>
          {isCredit ? "+" : "-"}{formatCurrency(amount)}
        </p>
        <Badge variant={status === "success" ? "success" : "destructive"} className="text-[10px] mt-0.5">
          {status}
        </Badge>
      </div>
    </div>
  );
}
