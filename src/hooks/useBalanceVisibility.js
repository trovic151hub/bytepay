import { useState } from "react";

const KEY = "bytepay_show_balance";

export function useBalanceVisibility() {
  const [show, setShow] = useState(() => {
    try {
      const stored = localStorage.getItem(KEY);
      return stored === null ? true : stored === "true";
    } catch {
      return true;
    }
  });

  const toggle = () => {
    setShow((v) => {
      const next = !v;
      try { localStorage.setItem(KEY, String(next)); } catch {}
      return next;
    });
  };

  return [show, toggle];
}
