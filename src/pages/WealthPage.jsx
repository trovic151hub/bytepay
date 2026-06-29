import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { ArrowLeft as BackIcon } from "lucide-react";
import { toast } from "@/hooks/useToast";
import {
  RiPhoneLine, RiWifiLine, RiFlashlightLine, RiTvLine,
  RiGift2Line, RiGlobalLine, RiBankLine, RiBankCardLine,
  RiSafeLine, RiLineChartLine, RiSaveLine, RiBarChartBoxLine,
  RiRefreshLine, RiLockLine, RiShieldLine, RiStockLine,
  RiCoinLine, RiSendPlaneLine, RiQrCodeLine, RiCurrencyLine,
  RiStoreLine, RiUserAddLine, RiPrinterLine, RiBriefcaseLine,
  RiSmartphoneLine, RiBusLine, RiWaterFlashLine, RiGovernmentLine,
  RiHotelLine, RiTruckLine, RiRidingLine,
  RiArrowUpDownLine, RiArrowRightSLine,
} from "react-icons/ri";

const cs = (label) => () => toast({ title: "Coming Soon", description: `${label} is coming soon.` });

const SECTIONS = [
  {
    title: "Recommend",
    items: [
      { Icon: RiArrowUpDownLine, label: "Withdraw",           bg: "bg-violet-100 dark:bg-violet-900/30", color: "text-violet-600", action: cs("Withdraw") },
      { Icon: RiBriefcaseLine,   label: "My Business Hub",    bg: "bg-blue-100 dark:bg-blue-900/30",   color: "text-blue-600",   action: cs("Business Hub") },
      { Icon: RiSmartphoneLine,  label: "Mobile Installment", bg: "bg-green-100 dark:bg-green-900/30", color: "text-green-600",  action: cs("Mobile Installment") },
    ],
  },
  {
    title: "Wealth",
    items: [
      { Icon: RiSafeLine,        label: "CashBox",        bg: "bg-violet-100 dark:bg-violet-900/30",  color: "text-violet-600",  route: "/savings" },
      { Icon: RiLineChartLine,   label: "SmartEarn",      bg: "bg-blue-100 dark:bg-blue-900/30",    color: "text-blue-600",    action: cs("SmartEarn") },
      { Icon: RiLockLine,        label: "Fixed Savings",  bg: "bg-purple-100 dark:bg-purple-900/30", color: "text-purple-600",  route: "/savings" },
      { Icon: RiBarChartBoxLine, label: "Target Savings", bg: "bg-green-100 dark:bg-green-900/30",  color: "text-green-600",   route: "/savings" },
      { Icon: RiShieldLine,      label: "Insurance",      bg: "bg-teal-100 dark:bg-teal-900/30",    color: "text-teal-600",    action: cs("Insurance") },
      { Icon: RiSaveLine,        label: "SafeBox",        bg: "bg-amber-100 dark:bg-amber-900/30",  color: "text-amber-600",   route: "/savings" },
      { Icon: RiRefreshLine,     label: "Spend&Save",     bg: "bg-pink-100 dark:bg-pink-900/30",    color: "text-pink-600",    route: "/savings" },
      { Icon: RiStockLine,       label: "Mutual Funds",   bg: "bg-indigo-100 dark:bg-indigo-900/30",color: "text-indigo-600",  action: cs("Mutual Funds") },
      { Icon: RiCoinLine,        label: "Trial Cash",     bg: "bg-orange-100 dark:bg-orange-900/30",color: "text-orange-600",  action: cs("Trial Cash") },
    ],
  },
  {
    title: "Bill Payments",
    items: [
      { Icon: RiPhoneLine,      label: "Airtime",             bg: "bg-red-100 dark:bg-red-900/30",     color: "text-red-500",     route: "/airtime" },
      { Icon: RiWifiLine,       label: "Data",                bg: "bg-green-100 dark:bg-green-900/30", color: "text-green-600",   route: "/data" },
      { Icon: RiFlashlightLine, label: "Electricity",         bg: "bg-yellow-100 dark:bg-yellow-900/30",color: "text-yellow-600", route: "/electricity" },
      { Icon: RiTvLine,         label: "TV",                  bg: "bg-blue-100 dark:bg-blue-900/30",   color: "text-blue-600",    action: cs("TV Subscription") },
      { Icon: RiGift2Line,      label: "Gift Card",           bg: "bg-pink-100 dark:bg-pink-900/30",   color: "text-pink-600",    action: cs("Gift Card") },
      { Icon: RiGlobalLine,     label: "Internet",            bg: "bg-indigo-100 dark:bg-indigo-900/30",color: "text-indigo-600", action: cs("Internet") },
      { Icon: RiCurrencyLine,   label: "WAEC",                bg: "bg-violet-100 dark:bg-violet-900/30",color: "text-violet-600", action: cs("WAEC") },
      { Icon: RiBarChartBoxLine,label: "Education",           bg: "bg-teal-100 dark:bg-teal-900/30",   color: "text-teal-600",    action: cs("Education") },
      { Icon: RiBankCardLine,   label: "Cowry Card",          bg: "bg-blue-100 dark:bg-blue-900/30",   color: "text-blue-600",    action: cs("Cowry Card") },
      { Icon: RiBusLine,        label: "Transport",           bg: "bg-purple-100 dark:bg-purple-900/30",color: "text-purple-600", action: cs("Transport") },
      { Icon: RiWaterFlashLine, label: "Water",               bg: "bg-cyan-100 dark:bg-cyan-900/30",   color: "text-cyan-600",    action: cs("Water") },
      { Icon: RiGovernmentLine, label: "Government Payments", bg: "bg-gray-100 dark:bg-gray-800/40",   color: "text-gray-600",    action: cs("Government Payments") },
      { Icon: RiHotelLine,      label: "Travel&Hotel",        bg: "bg-rose-100 dark:bg-rose-900/30",   color: "text-rose-600",    action: cs("Travel & Hotel") },
      { Icon: RiTruckLine,      label: "Transport&Toll",      bg: "bg-amber-100 dark:bg-amber-900/30", color: "text-amber-600",   action: cs("Transport & Toll") },
      { Icon: RiRidingLine,     label: "KekePay",             bg: "bg-green-100 dark:bg-green-900/30", color: "text-green-600",   action: cs("KekePay") },
    ],
  },
  {
    title: "Transfer",
    items: [
      { Icon: RiSendPlaneLine, label: "To BytePay", bg: "bg-violet-100 dark:bg-violet-900/30", color: "text-violet-600", route: "/transfer/bytepay" },
      { Icon: RiBankLine,      label: "To Bank",    bg: "bg-blue-100 dark:bg-blue-900/30",   color: "text-blue-600",   route: "/transfer/bank" },
      { Icon: RiQrCodeLine,    label: "QR Code",    bg: "bg-green-100 dark:bg-green-900/30", color: "text-green-600",  action: cs("QR Code") },
      { Icon: RiCurrencyLine,  label: "Pay Me",     bg: "bg-amber-100 dark:bg-amber-900/30", color: "text-amber-600",  action: cs("Pay Me") },
      { Icon: RiStoreLine,     label: "Pay Shop",   bg: "bg-teal-100 dark:bg-teal-900/30",   color: "text-teal-600",   action: cs("Pay Shop") },
    ],
  },
  {
    title: "Rewards",
    items: [
      { Icon: RiUserAddLine, label: "Refer & Earn", bg: "bg-violet-100 dark:bg-violet-900/30", color: "text-violet-600", action: cs("Refer & Earn") },
    ],
  },
  {
    title: "Other",
    items: [
      { Icon: RiBankCardLine, label: "ATM Card",       bg: "bg-purple-100 dark:bg-purple-900/30", color: "text-purple-600", route: "/atm-card" },
      { Icon: RiPrinterLine,  label: "My POS Receipt", bg: "bg-gray-100 dark:bg-gray-800/40",    color: "text-gray-600",   action: cs("POS Receipt") },
    ],
  },
];

export default function WealthPage() {
  const [, setLocation] = useLocation();

  const handleItem = (item) => {
    if (item.route) setLocation(item.route);
    else if (item.action) item.action();
  };

  return (
    <div className="min-h-screen bg-[#F4F2FA] dark:bg-background">
      <div className="max-w-[430px] mx-auto">

        <header className="sticky top-0 z-40 bg-white dark:bg-card px-4 py-4 flex items-center gap-3 shadow-sm">
          <button onClick={() => window.history.back()} className="text-foreground">
            <BackIcon className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold text-foreground">My Service</h1>
        </header>

        <div className="px-4 pt-3 pb-28 space-y-3">
          {SECTIONS.map(({ title, items }) => (
            <motion.div key={title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-card rounded-2xl p-4 shadow-sm">
              <p className="text-sm font-bold text-foreground mb-3">{title}</p>
              <div className="grid grid-cols-4 gap-3">
                {items.map((item) => (
                  <button key={item.label} onClick={() => handleItem(item)}
                    className="flex flex-col items-center gap-1.5">
                    <div className={`h-12 w-12 rounded-2xl ${item.bg} flex items-center justify-center`}>
                      <item.Icon className={`text-2xl ${item.color}`} />
                    </div>
                    <span className="text-[10px] font-medium text-foreground text-center leading-tight">{item.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}
