import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

export function formatDate(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function generateAccountNumber(phoneNumber) {
  if (!phoneNumber) return "";
  let p = phoneNumber.replace(/[\s\-\(\)]/g, "");
  if (p.startsWith("+234"))                      p = p.slice(4);
  else if (p.startsWith("234") && p.length >= 13) p = p.slice(3);
  else if (p.startsWith("0"))                     p = p.slice(1);
  return p;
}
