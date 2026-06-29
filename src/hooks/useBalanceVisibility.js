import { useState, useEffect } from "react";

const KEY = "bytepay_show_balance";

let _show = (() => {
  try {
    const stored = localStorage.getItem(KEY);
    return stored === null ? true : stored === "true";
  } catch {
    return true;
  }
})();

const _listeners = new Set();

function broadcast(val) {
  _show = val;
  try { localStorage.setItem(KEY, String(val)); } catch {}
  _listeners.forEach((fn) => fn(val));
}

export function useBalanceVisibility() {
  const [show, setShow] = useState(_show);

  useEffect(() => {
    _listeners.add(setShow);
    return () => _listeners.delete(setShow);
  }, []);

  const toggle = () => broadcast(!_show);

  return [show, toggle];
}
