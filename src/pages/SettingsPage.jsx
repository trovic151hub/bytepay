import { useState } from "react";
import { useLocation } from "wouter";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase";
import { useTheme } from "@/contexts/ThemeContext";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function SettingsGroup({ children }) {
  return (
    <div className="bg-white dark:bg-card rounded-2xl overflow-hidden shadow-sm">
      {children}
    </div>
  );
}

function SettingsRow({ label, value, toggle, toggleValue, onToggle, onClick, last }) {
  return (
    <div
      onClick={toggle ? undefined : onClick}
      className={cn(
        "flex items-center justify-between px-5 py-4",
        !last && "border-b border-border/30",
        !toggle && onClick && "cursor-pointer active:bg-secondary/30"
      )}
    >
      <span className="text-sm text-foreground">{label}</span>
      {toggle ? (
        <button
          onClick={onToggle}
          className={cn(
            "w-11 h-6 rounded-full flex items-center px-0.5 transition-colors shrink-0",
            toggleValue ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"
          )}
        >
          <div className={cn(
            "h-5 w-5 rounded-full bg-white shadow transition-transform",
            toggleValue ? "translate-x-5" : "translate-x-0"
          )}/>
        </button>
      ) : (
        <div className="flex items-center gap-1 text-muted-foreground">
          {value && <span className="text-sm">{value}</span>}
          <ChevronRight className="h-4 w-4 shrink-0"/>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const [speakerOn, setSpeakerOn] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-[#F4F2FA] dark:bg-background">
      <div className="max-w-[430px] mx-auto">

        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#F4F2FA] dark:bg-background px-4 pt-5 pb-3 flex items-center gap-3">
          <button onClick={() => setLocation("/me")}
            className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-white -ml-1">
            <ArrowLeft className="h-5 w-5 text-foreground"/>
          </button>
          <h1 className="text-base font-bold text-foreground">Settings</h1>
        </header>

        <div className="px-4 pb-10 space-y-3">

          {/* Group 1 — Security */}
          <SettingsGroup>
            <SettingsRow label="Login Settings" onClick={() => {}}/>
            <SettingsRow label="Payment Settings" onClick={() => {}}/>
            <SettingsRow label="Security Questions" onClick={() => {}} last/>
          </SettingsGroup>

          {/* Group 2 — Theme */}
          <SettingsGroup>
            <SettingsRow
              label="Dark Mode"
              value={isDark ? "Dark" : "Light"}
              onClick={toggleTheme}
              last
            />
          </SettingsGroup>

          {/* Group 3 — Notifications */}
          <SettingsGroup>
            <SettingsRow label="SMS Alert Subscribe" onClick={() => {}}/>
            <SettingsRow label="Email Notification Settings" onClick={() => {}}/>
            <SettingsRow
              label="Speaker on"
              toggle
              toggleValue={speakerOn}
              onToggle={() => setSpeakerOn(v => !v)}
              last
            />
          </SettingsGroup>

          {/* Group 4 — About */}
          <SettingsGroup>
            <SettingsRow label="About BytePay" onClick={() => {}} last/>
          </SettingsGroup>

          {/* Group 5 — Close account */}
          <SettingsGroup>
            <SettingsRow label="Close BytePay Account" onClick={() => {}} last/>
          </SettingsGroup>

          {/* Log Out */}
          <button
            onClick={handleLogout}
            className="w-full bg-primary/10 dark:bg-primary/20 text-primary font-bold py-4 rounded-2xl text-sm"
          >
            Log Out
          </button>

        </div>
      </div>
    </div>
  );
}
