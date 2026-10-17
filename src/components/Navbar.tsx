"use client";

import { ConnectionStatus } from "@/lib/realtime/useEventStream";
import { formatRelativeTime } from "@/lib/utils/date";
import {
  RefreshCw,
  Sun,
  Moon,
  Menu,
  Radio,
  Shield,
  ShieldCheck,
  LogOut,
} from "lucide-react";

interface NavbarProps {
  status: ConnectionStatus;
  lastSyncTime: string | null;
  onSync: () => Promise<void>;
  isSyncing: boolean;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onSetTheme?: (theme: "dark" | "light") => void;
  onOpenSidebar: () => void;
  mounted?: boolean;
  onOpenWebhookModal: () => void;
  isAdmin?: boolean;
  onRequestAdminLogin?: () => void;
  onRequestLogout?: () => void;
}

export function Navbar({
  status,
  lastSyncTime,
  onSync,
  isSyncing,
  theme,
  onToggleTheme,
  onSetTheme,
  onOpenSidebar,
  mounted = false,
  onOpenWebhookModal,
  isAdmin = false,
  onRequestAdminLogin,
  onRequestLogout,
}: NavbarProps) {
  const isDark = mounted ? theme === "dark" : true;

  const handleSelectTheme = (mode: "dark" | "light") => {
    if (onSetTheme) {
      onSetTheme(mode);
    } else {
      if ((mode === "dark" && !isDark) || (mode === "light" && isDark)) {
        onToggleTheme();
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[var(--bg-main)]/85 backdrop-blur-xl border-b border-[var(--border-main)] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger + Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="p-2 rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] lg:hidden cursor-pointer"
            aria-label="Buka menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Overview
            </h1>
            <p className="text-xs text-[var(--text-secondary)] hidden sm:block mt-0.5">
              {lastSyncTime
                ? `Real-time GitHub insights • Terakhir sync: ${formatRelativeTime(lastSyncTime)}`
                : "Real-time insights and GitHub project management"}
            </p>
          </div>
        </div>

        {/* Center / Right: Day/Night Switch (FieldPro style) + Mode Admin + SSE status + Sync Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Exact FieldPro Style Day Mode / Night Mode Switch */}
          <div
            className="mode-toggle-track select-none flex items-center"
            title="Ganti Mode Tampilan (Day / Night)"
          >
            {/* Day Option */}
            <button
              type="button"
              id="theme-toggle-day"
              onClick={() => handleSelectTheme("light")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                !isDark
                  ? "bg-white text-slate-900 shadow-sm shadow-slate-300"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              <Sun className={`w-3.5 h-3.5 ${!isDark ? "text-amber-500 fill-amber-500" : ""}`} />
              <span className="hidden md:inline">Day Mode</span>
            </button>

            {/* Night Option */}
            <button
              type="button"
              id="theme-toggle-night"
              onClick={() => handleSelectTheme("dark")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                isDark
                  ? "bg-[#252f47] text-white shadow-sm shadow-black/40"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              <Moon className={`w-3.5 h-3.5 ${isDark ? "text-indigo-400 fill-indigo-400" : ""}`} />
              <span className="hidden md:inline">Night Mode</span>
            </button>
          </div>

          {/* Fitur Mode Admin disamping Fitur Theme */}
          <button
            type="button"
            id="navbar-admin-mode-btn"
            onClick={() => {
              if (isAdmin) {
                onRequestLogout?.();
              } else {
                onRequestAdminLogin?.();
              }
            }}
            className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-xs select-none ${
              isAdmin
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-500"
                : "bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-secondary)] hover:text-[#5c62ec] hover:border-[#5c62ec]/40 hover:bg-[#5c62ec]/5"
            }`}
            title={
              isAdmin
                ? "Mode Admin Aktif • Klik untuk keluar"
                : "Beralih ke Mode Admin (Perlu Konfirmasi)"
            }
            aria-label={isAdmin ? "Mode Admin Aktif" : "Masuk Mode Admin"}
          >
            {isAdmin ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400 animate-ping" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <ShieldCheck className="w-3.5 h-3.5 group-hover:hidden" />
                <LogOut className="w-3.5 h-3.5 hidden group-hover:inline text-rose-500" />
                <span className="hidden md:inline group-hover:hidden">Admin Aktif</span>
                <span className="hidden md:group-hover:inline text-rose-500">Keluar</span>
              </>
            ) : (
              <>
                <Shield className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#5c62ec] transition-colors" />
                <span className="hidden md:inline">Mode Admin</span>
              </>
            )}
          </button>

          {/* Webhook Diagnostics Button */}
          <button
            onClick={onOpenWebhookModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-secondary)] hover:text-[#5c62ec] hover:border-[#5c62ec]/30 transition-all cursor-pointer shadow-xs"
            title="Buka Diagnostik Webhook GitHub & Simulator"
          >
            <Radio className="w-3.5 h-3.5 text-[#5c62ec]" />
            <span className="hidden md:inline">Webhook</span>
          </button>

          {/* Connection Status Pill */}
          <div
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
              status === "Live"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                : status === "Reconnecting"
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-500"
            }`}
          >
            <span className="relative flex h-2 w-2">
              {status === "Live" && (
                <span className="absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400 animate-ping" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  status === "Live"
                    ? "bg-emerald-500"
                    : status === "Reconnecting"
                      ? "bg-amber-500"
                      : "bg-rose-500"
                }`}
              />
            </span>
            <span>{status === "Live" ? "Live SSE" : status}</span>
          </div>

          {/* Sync Button */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#5c62ec] hover:bg-[#4e53db] text-white transition-all shadow-md shadow-[#5c62ec]/30 disabled:opacity-50 cursor-pointer shrink-0"
            title={isSyncing ? "Menyinkronkan..." : "Sinkronisasi Data GitHub"}
            aria-label="Sinkronisasi Data GitHub"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
