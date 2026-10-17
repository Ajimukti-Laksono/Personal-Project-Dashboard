"use client";

import React, { useState } from "react";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, X, ShieldCheck } from "lucide-react";

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminLoginModal({ isOpen, onClose, onSuccess }: AdminLoginModalProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Masukkan password dashboard admin.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        remainingAttempts?: number;
      };

      if (!res.ok) {
        if (res.status === 429) {
          setError(data.error || "Terlalu banyak percobaan. Silakan coba beberapa saat lagi.");
        } else if (data.remainingAttempts !== undefined) {
          setError(`Password salah. Sisa kesempatan: ${data.remainingAttempts}`);
        } else {
          setError(data.error || "Gagal masuk. Periksa kembali password admin Anda.");
        }
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setPassword("");
        onSuccess();
        onClose();
      }, 700);
    } catch {
      setError("Terjadi kesalahan jaringan. Silakan coba kembali.");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border-main)] bg-[var(--bg-card)] p-6 sm:p-8 shadow-2xl transition-all z-10 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-main)] transition-colors cursor-pointer"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#5c62ec]/15 border border-[#5c62ec]/30 flex items-center justify-center text-[#5c62ec] shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Admin Access Login</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Masukkan password untuk mengaktifkan fitur sinkronisasi & diagnostik.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-500">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Success Alert */}
        {isSuccess && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-500">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <p className="font-medium">Autentikasi admin berhasil! Membuka akses...</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Dashboard Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--text-muted)]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password admin..."
                disabled={isLoading || isSuccess}
                autoFocus
                className="w-full rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)] py-2.5 pl-10 pr-10 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors focus:border-[#5c62ec] focus:outline-none focus:ring-1 focus:ring-[#5c62ec] disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading || isSuccess}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-[var(--border-main)] text-[var(--text-secondary)] hover:bg-[var(--bg-main)] transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading || isSuccess || !password.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#5c62ec] hover:bg-[#4e53db] text-white shadow-md shadow-[#5c62ec]/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Sukses!</span>
                </>
              ) : (
                <span>Masuk sebagai Admin</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
