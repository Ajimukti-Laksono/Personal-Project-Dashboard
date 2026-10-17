"use client";

import { useEffect, useState } from "react";
import {
  Shield,
  ShieldAlert,
  ArrowRight,
  X,
  Lock,
  RefreshCw,
  Sliders,
  Radio,
  LogOut,
  AlertTriangle,
} from "lucide-react";

interface AdminConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  targetFeature?: string;
}

export function AdminConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  targetFeature,
}: AdminConfirmModalProps) {
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsNavigating(false);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isNavigating) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isNavigating]);

  if (!isOpen) return null;

  const handleProceed = () => {
    setIsNavigating(true);
    onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in"
      onClick={() => {
        if (!isNavigating) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-confirm-title"
    >
      <div
        className="relative w-full max-w-lg rounded-3xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-2xl overflow-hidden transition-all duration-300 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow:
            "0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px -10px rgba(92, 98, 236, 0.25)",
        }}
      >
        {/* Ambient Top Glow Line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-transparent via-[#5c62ec] to-transparent" />

        {/* Header */}
        <div className="px-6 sm:px-8 pt-7 pb-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-[#5c62ec] flex items-center justify-center shadow-inner shrink-0">
              <Shield className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#5c62ec]/10 text-[#5c62ec] border border-[#5c62ec]/20 mb-1">
                <Lock className="w-2.5 h-2.5" />
                Autentikasi Diperlukan
              </div>
              <h2
                id="admin-confirm-title"
                className="text-lg sm:text-xl font-bold text-[var(--text-primary)] tracking-tight"
              >
                Konfirmasi Masuk Mode Admin
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isNavigating}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-soft)] transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-6 sm:px-8 py-3 space-y-4 text-sm">
          {/* Notification / Alert Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <p className="font-semibold mb-0.5">Pemberitahuan Akses Keamanan</p>
              <p className="text-amber-700/90 dark:text-amber-300/80">
                {targetFeature
                  ? `Fitur "${targetFeature}" memerlukan hak akses Administrator.`
                  : "Anda akan dialihkan ke halaman verifikasi login Administrator."}{" "}
                Pastikan Anda memiliki password dashboard yang sah sebelum melanjutkan.
              </p>
            </div>
          </div>

          {/* Explanation of Admin privileges */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2.5">
              Fitur yang Terbuka di Mode Admin:
            </p>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)]">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-[var(--text-primary)]">Sinkronisasi Data Manual: </span>
                  <span className="text-[var(--text-secondary)]">
                    Trigger pembaruan langsung dari GitHub API ke database.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)]">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-[#5c62ec] flex items-center justify-center shrink-0">
                  <Sliders className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-[var(--text-primary)]">Kelola Sematan Proyek: </span>
                  <span className="text-[var(--text-secondary)]">
                    Pin/unpin repositori unggulan untuk pengunjung.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)]">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                  <Radio className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-[var(--text-primary)]">Diagnostik Webhook: </span>
                  <span className="text-[var(--text-secondary)]">
                    Simulasi event real-time & pantau riwayat webhook GitHub.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 sm:px-8 py-5 mt-2 bg-[var(--bg-main)]/60 border-t border-[var(--border-main)] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isNavigating}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-soft)] transition-all cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleProceed}
            disabled={isNavigating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#5c62ec] hover:bg-[#4e53db] text-white shadow-lg shadow-[#5c62ec]/30 transition-all cursor-pointer disabled:opacity-60"
          >
            {isNavigating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Mengarahkan ke Login...</span>
              </>
            ) : (
              <>
                <span>Lanjutkan ke Login</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface AdminLogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoggingOut?: boolean;
}

export function AdminLogoutModal({
  isOpen,
  onClose,
  onConfirm,
  isLoggingOut = false,
}: AdminLogoutModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoggingOut) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isLoggingOut]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in"
      onClick={() => {
        if (!isLoggingOut) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-logout-title"
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-2xl overflow-hidden transition-all duration-300 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow:
            "0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 30px -10px rgba(244, 63, 94, 0.2)",
        }}
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-transparent via-rose-500 to-transparent" />

        <div className="px-6 pt-6 pb-4 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2
              id="admin-logout-title"
              className="text-lg font-bold text-[var(--text-primary)] tracking-tight"
            >
              Keluar dari Mode Admin?
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
              Sesi Administrator Anda akan diakhiri. Dashboard akan kembali ke mode publik
              (read-only).
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-[var(--bg-main)]/60 border-t border-[var(--border-main)] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoggingOut}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-soft)] transition-all cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoggingOut}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/30 transition-all cursor-pointer disabled:opacity-60"
          >
            {isLoggingOut ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            <span>Keluar Mode Admin</span>
          </button>
        </div>
      </div>
    </div>
  );
}
