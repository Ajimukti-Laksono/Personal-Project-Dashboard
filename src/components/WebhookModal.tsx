"use client";

import { useState, useEffect, useCallback } from "react";
import { formatRelativeTime } from "@/lib/utils/date";
import {
  X,
  Copy,
  Check,
  Radio,
  Play,
  Loader2,
  Terminal,
  Activity,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface WebhookDeliveryItem {
  deliveryId: string;
  event: string;
  receivedAt: string;
}

interface WebhookHistoryData {
  webhookUrl: string;
  publicBaseUrl: string;
  githubUsername: string;
  totalDeliveries: number;
  recentDeliveries: WebhookDeliveryItem[];
  lastDeliveryAt: string | null;
  tunnelCommand: string;
}

interface WebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventSimulated?: () => void;
}

export function WebhookModal({ isOpen, onClose, onEventSimulated }: WebhookModalProps) {
  const [data, setData] = useState<WebhookHistoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" } | null>(
    null,
  );

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/webhook/history", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;

    fetch("/api/webhook/history", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: WebhookHistoryData | null) => {
        if (!isCancelled && json) {
          setData(json);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const copyToClipboard = async (text: string, type: "url" | "cmd") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "url") {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      } else {
        setCopiedCmd(true);
        setTimeout(() => setCopiedCmd(false), 2000);
      }
    } catch {
      // fallback
    }
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/webhook/history", {
        method: "POST",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setStatusMsg({
          text: "Simulasi commit baru berhasil disiarkan secara real-time!",
          type: "success",
        });
        await fetchHistory();
        if (onEventSimulated) onEventSimulated();
      } else {
        setStatusMsg({
          text: json.error || "Gagal menjalankan simulasi webhook.",
          type: "error",
        });
      }
    } catch (err) {
      setStatusMsg({
        text: err instanceof Error ? err.message : "Terjadi kesalahan koneksi.",
        type: "error",
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--border-main)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-[#5c62ec] flex items-center justify-center">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                Diagnostik Webhook GitHub
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Status koneksi real-time, payload URL, dan riwayat delivery
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-soft)] transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status Message */}
          {statusMsg && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
                statusMsg.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-500"
                  : "bg-rose-500/10 border border-rose-500/30 text-rose-500"
              }`}
            >
              {statusMsg.type === "success" ? (
                <Check className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-main)]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Status Saluran
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-xs font-bold text-emerald-500">Siap Menerima</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-main)]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Total Delivery
              </span>
              <p className="text-base font-bold text-[var(--text-primary)] mt-0.5">
                {isLoading ? "-" : (data?.totalDeliveries ?? 0)} event
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-main)]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Delivery Terakhir
              </span>
              <p className="text-xs font-semibold text-[var(--text-secondary)] mt-1 truncate">
                {isLoading
                  ? "-"
                  : data?.lastDeliveryAt
                    ? formatRelativeTime(data.lastDeliveryAt)
                    : "Belum ada event"}
              </p>
            </div>
          </div>

          {/* Webhook Payload URL Box */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
              Payload URL GitHub Webhook
            </label>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] text-xs font-mono">
              <input
                type="text"
                readOnly
                value={data?.webhookUrl || "http://localhost:3000/api/webhook"}
                className="w-full bg-transparent text-[var(--text-primary)] focus:outline-hidden"
              />
              <button
                onClick={() => copyToClipboard(data?.webhookUrl || "", "url")}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer shrink-0"
              >
                {copiedUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[11px] text-emerald-500 font-semibold">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-medium">Salin</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tunnel Command Helper */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#5c62ec]" />
                <span>Forwarder Tunnel Lokal (Smee.io)</span>
              </label>
              <a
                href="https://smee.io"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[#5c62ec] hover:underline flex items-center gap-1"
              >
                <span>Buka smee.io</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] text-xs font-mono">
              <input
                type="text"
                readOnly
                value={
                  data?.tunnelCommand ||
                  "smee -u https://smee.io/your-channel -t http://localhost:3000/api/webhook"
                }
                className="w-full bg-transparent text-[var(--text-secondary)] focus:outline-hidden"
              />
              <button
                onClick={() => copyToClipboard(data?.tunnelCommand || "", "cmd")}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer shrink-0"
              >
                {copiedCmd ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[11px] text-emerald-500 font-semibold">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-medium">Salin</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Test Event Simulator Button */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#5c62ec]/10 to-indigo-500/5 border border-[#5c62ec]/20 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-[var(--text-primary)]">
                Uji Coba Real-Time Pipeline
              </h4>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                Kirim commit simulasi untuk memverifikasi SSE dan update feed tanpa harus git push
                asli.
              </p>
            </div>

            <button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5c62ec] hover:bg-[#4e53db] text-white text-xs font-bold transition-all shadow-md shadow-[#5c62ec]/30 disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isSimulating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengirim...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Kirim Simulasi</span>
                </>
              )}
            </button>
          </div>

          {/* Recent Deliveries List */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-[var(--text-muted)]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Riwayat Webhook Deliveries Terbaru
              </h3>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-10 rounded-xl bg-[var(--bg-main)] animate-pulse border border-[var(--border-main)]"
                  />
                ))}
              </div>
            ) : !data?.recentDeliveries || data.recentDeliveries.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-main)] text-center">
                <p className="text-xs text-[var(--text-muted)]">
                  Belum ada event webhook yang diterima. Klik tombol simulasi di atas untuk mencoba.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--border-main)] overflow-hidden">
                <div className="max-h-52 overflow-y-auto divide-y divide-[var(--border-main)] bg-[var(--bg-main)]">
                  {data.recentDeliveries.map((delivery) => (
                    <div
                      key={delivery.deliveryId}
                      className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-[var(--bg-card)] transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-[#5c62ec]/10 text-[#5c62ec] border border-[#5c62ec]/20 uppercase">
                          {delivery.event}
                        </span>
                        <span className="font-mono text-[11px] text-[var(--text-secondary)] truncate">
                          {delivery.deliveryId}
                        </span>
                      </div>
                      <span className="text-[11px] text-[var(--text-muted)] shrink-0 ml-3">
                        {formatRelativeTime(delivery.receivedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border-main)] bg-[var(--bg-main)]/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
