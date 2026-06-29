import { useState, useEffect } from "react";

let _id = 0;
let _toasts = [];
const _listeners = new Set();

function broadcast() {
  const snapshot = [..._toasts];
  _listeners.forEach((fn) => fn(snapshot));
}

export function toast({ title, description, duration = 3000 }) {
  const id = ++_id;
  _toasts = [..._toasts, { id, title, description }];
  broadcast();
  setTimeout(() => {
    _toasts = _toasts.filter((t) => t.id !== id);
    broadcast();
  }, duration);
}

export function useToaster() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    _listeners.add(setToasts);
    return () => _listeners.delete(setToasts);
  }, []);
  return toasts;
}
