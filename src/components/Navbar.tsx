"use client";

import { ConnectionStatus } from "@/lib/realtime/useEventStream";
import { formatRelativeTime } from "@/lib/utils/date";
import {
  RefreshCw,
  Sun,
  Moon,
  Menu,
  Radio,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  ShieldCheck,
  LogOut,
  KeyRound,
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
  soundEnabled: boolean;
  onToggleSound: () => void;
  notificationsEnabled: boolean;
  onRequestNotifications: () => void;
  isAdmin?: boolean;
  onOpenAdminLogin?: () => void;
  onLogout?: () => void;
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
  soundEnabled,
  onToggleSound,
  notificationsEnabled,
  onRequestNotifications,
  isAdmin = false,
  onOpenAdminLogin,
  onLogout,
}: NavbarProps) {
  const isDark = mounted ? theme === "dark" : true;
  const isNotificationsActive = mounted ? notificationsEnabled : false;

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

        {/* Center / Right: Day/Night Switch (FieldPro style) + SSE status + Sync Button */}
        <div className="flex items-center gap-2 sm:gap-4">
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

          {/* Admin Status Badge or Login CTA */}
          {isAdmin ? (
            <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full pl-2.5 pr-1.5 py-1">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Admin Mode</span>
              </span>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1 rounded-full text-emerald-500/70 hover:text-rose-500 hover:bg-rose-500/15 transition-colors cursor-pointer"
                  title="Keluar dari Admin Mode"
                  aria-label="Logout Admin"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#5c62ec]/40 transition-all cursor-pointer shadow-xs"
              title="Login Admin untuk Sinkronisasi & Konfigurasi"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Admin Login</span>
            </button>
          )}

          {/* Webhook Diagnostics Button */}
          <button
            onClick={() => {
              if (isAdmin) {
                onOpenWebhookModal();
              } else if (onOpenAdminLogin) {
                onOpenAdminLogin();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-secondary)] hover:text-[#5c62ec] hover:border-[#5c62ec]/30 transition-all cursor-pointer shadow-xs"
            title={
              isAdmin
                ? "Buka Diagnostik Webhook GitHub & Simulator"
                : "Diagnostik Webhook (Memerlukan Admin Login)"
            }
          >
            <Radio className="w-3.5 h-3.5 text-[#5c62ec]" />
            <span className="hidden md:inline">Webhook</span>
          </button>

          {/* Sound Toggle Button */}
          <button
            onClick={onToggleSound}
            className={`p-2 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
              soundEnabled
                ? "bg-indigo-500/10 border-indigo-500/30 text-[#5c62ec]"
                : "bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
            title={
              soundEnabled
                ? "Suara Notifikasi: Aktif (Klik untuk Matikan)"
                : "Suara Notifikasi: Mati (Klik untuk Nyalakan)"
            }
            aria-label="Toggle Sound"
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Desktop Push Notification Toggle Button */}
          <button
            onClick={onRequestNotifications}
            className={`p-2 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
              isNotificationsActive
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                : "bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
            title={
              isNotificationsActive
                ? "Notifikasi Desktop Browser: Aktif"
                : "Nyalakan Notifikasi Desktop Browser"
            }
            aria-label="Toggle Desktop Notifications"
          >
            {isNotificationsActive ? (
              <Bell className="w-3.5 h-3.5" />
            ) : (
              <BellOff className="w-3.5 h-3.5" />
            )}
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

          {/* Sync Button (Primary CTA Button) */}
          <button
            onClick={() => {
              if (isAdmin) {
                onSync();
              } else if (onOpenAdminLogin) {
                onOpenAdminLogin();
              }
            }}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#5c62ec] hover:bg-[#4e53db] text-white transition-all shadow-md shadow-[#5c62ec]/30 disabled:opacity-50 cursor-pointer shrink-0"
            title={
              isAdmin
                ? "Sinkronisasi data repository dari GitHub API"
                : "Sync GitHub (Memerlukan Admin Login)"
            }
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span className="hidden xs:inline">
              {isSyncing ? "Menyinkronkan..." : "Sync Sekarang"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
