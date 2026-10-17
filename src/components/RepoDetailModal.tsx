"use client";

import { useEffect, useState, useCallback } from "react";
import { RepoItem } from "./RepoList";
import { formatRelativeTime } from "@/lib/utils/date";
import {
  X,
  ExternalLink,
  GitCommit,
  GitPullRequest,
  AlertCircle,
  PlayCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Pin,
  Webhook,
  RotateCw,
  Check,
} from "lucide-react";

interface CommitDetail {
  id: number;
  sha: string;
  message: string;
  authorName: string;
  authorLogin: string | null;
  authorAvatar: string | null;
  url: string;
  branch: string | null;
  committedAt: string;
}

interface PrDetail {
  id: string;
  number: number;
  title: string;
  state: string;
  merged: boolean;
  author: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

interface IssueDetail {
  id: string;
  number: number;
  title: string;
  state: string;
  author: string;
  labels: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkflowDetail {
  id: string;
  name: string;
  branch: string | null;
  status: string;
  conclusion: string | null;
  url: string;
  updatedAt: string;
}

interface FullRepoData extends RepoItem {
  commits: CommitDetail[];
  pullRequests: PrDetail[];
  issues: IssueDetail[];
  workflowRuns: WorkflowDetail[];
}

interface RepoDetailModalProps {
  repo: RepoItem | null;
  onClose: () => void;
  onTogglePin?: (repoId: string, currentPinned: boolean) => void;
  onWebhookConfigured?: () => void;
}

export function RepoDetailModal({
  repo,
  onClose,
  onTogglePin,
  onWebhookConfigured,
}: RepoDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"commits" | "prs" | "issues" | "workflows">("commits");
  const [data, setData] = useState<FullRepoData | null>(null);

  // Webhook setup state
  const [isCheckingWebhook, setIsCheckingWebhook] = useState(false);
  const [webhookConfigured, setWebhookConfigured] = useState<boolean | null>(null);
  const [isSettingUpWebhook, setIsSettingUpWebhook] = useState(false);

  // Re-run workflow state
  const [rerunningIds, setRerunningIds] = useState<string[]>([]);

  // Feedback banner
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(
    null,
  );

  // Fetch repository details
  useEffect(() => {
    if (!repo) return;

    let isMounted = true;
    setData(null);
    setFeedback(null);
    setWebhookConfigured(null);

    fetch(`/api/repos/${repo.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((repoData: FullRepoData | null) => {
        if (isMounted && repoData) {
          setData(repoData);
        }
      })
      .catch((err) => {
        console.error("Failed to load repo detail:", err);
      });

    // Check webhook status on GitHub
    setIsCheckingWebhook(true);
    fetch(`/api/repos/${repo.id}/webhook`)
      .then((res) => (res.ok ? res.json() : null))
      .then((hookData) => {
        if (isMounted && hookData) {
          setWebhookConfigured(!!hookData.isConfigured);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsCheckingWebhook(false);
      });

    return () => {
      isMounted = false;
    };
  }, [repo]);

  // One-Click Webhook Setup Handler
  const handleSetupWebhook = useCallback(async () => {
    if (!repo) return;
    setIsSettingUpWebhook(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/repos/${repo.id}/webhook`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal memasang webhook otomatis");
      }

      setWebhookConfigured(true);
      setFeedback({
        message: json.message || "Webhook GitHub berhasil dipasang dan diaktifkan!",
        type: "success",
      });
      onWebhookConfigured?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({ message: msg, type: "error" });
    } finally {
      setIsSettingUpWebhook(false);
    }
  }, [repo, onWebhookConfigured]);

  // Re-run Workflow Run Handler
  const handleRerunWorkflow = useCallback(
    async (workflowId: string) => {
      if (!repo) return;
      setRerunningIds((prev) => [...prev, workflowId]);
      setFeedback(null);

      try {
        const res = await fetch(`/api/repos/${repo.id}/actions/${workflowId}/rerun`, {
          method: "POST",
        });
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Gagal memicu ulang workflow");
        }

        // Optimistically update workflow run state to in_progress
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            workflowRuns: prev.workflowRuns.map((wf) =>
              wf.id === workflowId
                ? {
                    ...wf,
                    status: "in_progress",
                    conclusion: null,
                    updatedAt: new Date().toISOString(),
                  }
                : wf,
            ),
          };
        });

        setFeedback({
          message: json.message || "Workflow berhasil dipicu ulang di GitHub Actions!",
          type: "success",
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setFeedback({ message: msg, type: "error" });
      } finally {
        setRerunningIds((prev) => prev.filter((id) => id !== workflowId));
      }
    },
    [repo],
  );

  if (!repo) return null;

  const isLoading = !data || data.id !== repo.id;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[85vh] flex flex-col bg-[var(--bg-card)] border border-[var(--border-main)] rounded-3xl shadow-2xl overflow-hidden text-[var(--text-primary)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 border-b border-[var(--border-main)] gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] truncate">
                {repo.name}
              </h2>

              {repo.isPinned && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-500 text-xs font-bold border border-amber-500/25 shrink-0">
                  📌 Pinned
                </span>
              )}

              <a
                href={repo.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[#5c62ec] hover:bg-[var(--accent-soft)] transition-colors"
                title="Buka di GitHub"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-xl line-clamp-2">
              {repo.description || "Tidak ada deskripsi."}
            </p>
          </div>

          {/* Action Buttons in Header */}
          <div className="flex items-center gap-2 shrink-0">
            {/* One-Click Webhook Button */}
            <button
              type="button"
              onClick={handleSetupWebhook}
              disabled={isSettingUpWebhook || isCheckingWebhook}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer disabled:opacity-50 ${
                webhookConfigured
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/25 hover:bg-emerald-500/20"
                  : "bg-[#5c62ec]/10 text-[#5c62ec] dark:text-[#8b91ff] border-[#5c62ec]/30 hover:bg-[#5c62ec]/20"
              }`}
              title={
                webhookConfigured
                  ? "Webhook aktif di GitHub. Klik untuk perbarui konfigurasi."
                  : "Pasang webhook otomatis ke repositori ini dengan 1-klik"
              }
            >
              {isSettingUpWebhook ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : webhookConfigured ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Webhook className="w-3.5 h-3.5" />
              )}
              <span>
                {isSettingUpWebhook
                  ? "Memasang..."
                  : webhookConfigured
                    ? "Webhook Aktif"
                    : "Pasang Webhook"}
              </span>
            </button>

            {/* Pin Toggle Button */}
            <button
              type="button"
              onClick={() => onTogglePin?.(repo.id, !!repo.isPinned)}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                repo.isPinned
                  ? "text-amber-500 bg-amber-500/15 hover:bg-amber-500/25"
                  : "text-[var(--text-muted)] hover:text-amber-500 hover:bg-[var(--accent-soft)]"
              }`}
              title={repo.isPinned ? "Lepas sematan repositori" : "Sematkan ke posisi teratas"}
            >
              <Pin
                className={`w-4 h-4 transition-transform ${
                  repo.isPinned ? "fill-amber-500 rotate-45" : ""
                }`}
              />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-soft)] transition-colors cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert Banner */}
        {feedback && (
          <div
            className={`px-6 py-2.5 text-xs flex items-center justify-between border-b transition-all ${
              feedback.type === "success"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span className="font-medium">{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="p-1 hover:opacity-70 transition-opacity cursor-pointer"
              aria-label="Tutup pesan"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-[var(--border-main)] overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab("commits")}
            className={`flex items-center gap-1.5 pb-2.5 transition-all border-b-2 cursor-pointer ${
              activeTab === "commits"
                ? "border-[#5c62ec] text-[#5c62ec] dark:text-[#8b91ff]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <GitCommit className="w-4 h-4" />
            <span>Commit ({data?.commits.length ?? 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("prs")}
            className={`flex items-center gap-1.5 pb-2.5 transition-all border-b-2 cursor-pointer ${
              activeTab === "prs"
                ? "border-[#5c62ec] text-[#5c62ec] dark:text-[#8b91ff]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <GitPullRequest className="w-4 h-4" />
            <span>Pull Request ({data?.pullRequests.length ?? 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("issues")}
            className={`flex items-center gap-1.5 pb-2.5 transition-all border-b-2 cursor-pointer ${
              activeTab === "issues"
                ? "border-[#5c62ec] text-[#5c62ec] dark:text-[#8b91ff]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            <span>Issue ({data?.issues.length ?? 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("workflows")}
            className={`flex items-center gap-1.5 pb-2.5 transition-all border-b-2 cursor-pointer ${
              activeTab === "workflows"
                ? "border-[#5c62ec] text-[#5c62ec] dark:text-[#8b91ff]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            <span>CI Workflow ({data?.workflowRuns.length ?? 0})</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 min-h-[320px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-[var(--text-muted)]">
              <Loader2 className="w-8 h-8 animate-spin text-[#5c62ec] mb-2" />
              <p className="text-xs font-semibold">Memuat detail repositori...</p>
            </div>
          ) : !data ? (
            <div className="text-center py-16 text-xs text-[var(--text-muted)]">
              Gagal memuat rincian data.
            </div>
          ) : (
            <>
              {/* Commits Tab */}
              {activeTab === "commits" && (
                <div className="space-y-2.5">
                  {data.commits.length === 0 ? (
                    <div className="text-center py-12 text-xs text-[var(--text-muted)]">
                      Belum ada commit tersimpan.
                    </div>
                  ) : (
                    data.commits.map((c) => (
                      <div
                        key={c.sha}
                        className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-main)] text-xs hover:border-[var(--accent-border)] transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-[var(--text-primary)] truncate">
                            {c.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 text-[var(--text-secondary)] text-[11px]">
                            <span className="font-mono text-[#5c62ec] dark:text-[#8b91ff] font-bold">
                              {c.sha.slice(0, 7)}
                            </span>
                            {c.branch && <span>• branch {c.branch}</span>}
                            <span>• {c.authorName}</span>
                            <span>• {formatRelativeTime(c.committedAt)}</span>
                          </div>
                        </div>
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-[var(--text-muted)] hover:text-[#5c62ec]"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* PRs Tab */}
              {activeTab === "prs" && (
                <div className="space-y-2.5">
                  {data.pullRequests.length === 0 ? (
                    <div className="text-center py-12 text-xs text-[var(--text-muted)]">
                      Tidak ada Pull Request.
                    </div>
                  ) : (
                    data.pullRequests.map((pr) => (
                      <div
                        key={pr.id}
                        className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-main)] text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                                pr.merged
                                  ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
                                  : pr.state === "closed"
                                    ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                    : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              }`}
                            >
                              {pr.merged ? "Merged" : pr.state === "closed" ? "Closed" : "Open"}
                            </span>
                            <span className="font-semibold text-[var(--text-primary)] truncate">
                              #{pr.number} {pr.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[var(--text-secondary)] text-[11px]">
                            <span>oleh {pr.author}</span>
                            <span>• {formatRelativeTime(pr.updatedAt)}</span>
                          </div>
                        </div>
                        <a
                          href={pr.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-[var(--text-muted)] hover:text-[#5c62ec]"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Issues Tab */}
              {activeTab === "issues" && (
                <div className="space-y-2.5">
                  {data.issues.length === 0 ? (
                    <div className="text-center py-12 text-xs text-[var(--text-muted)]">
                      Tidak ada Issue yang tercatat.
                    </div>
                  ) : (
                    data.issues.map((issue) => {
                      let labelList: string[] = [];
                      try {
                        labelList = JSON.parse(issue.labels);
                      } catch {}
                      return (
                        <div
                          key={issue.id}
                          className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-main)] text-xs"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                                  issue.state === "closed"
                                    ? "bg-[var(--border-main)] text-[var(--text-muted)] border-[var(--border-main)]"
                                    : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                }`}
                              >
                                {issue.state === "closed" ? "Closed" : "Open"}
                              </span>
                              <span className="font-semibold text-[var(--text-primary)] truncate">
                                #{issue.number} {issue.title}
                              </span>
                              {labelList.map((lbl) => (
                                <span
                                  key={lbl}
                                  className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--accent-soft)] text-[#5c62ec] border border-[var(--accent-border)] font-semibold"
                                >
                                  {lbl}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-[11px]">
                              <span>oleh {issue.author}</span>
                              <span>• {formatRelativeTime(issue.updatedAt)}</span>
                            </div>
                          </div>
                          <a
                            href={issue.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-[var(--text-muted)] hover:text-[#5c62ec]"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Workflows Tab */}
              {activeTab === "workflows" && (
                <div className="space-y-2.5">
                  {data.workflowRuns.length === 0 ? (
                    <div className="text-center py-12 text-xs text-[var(--text-muted)]">
                      Belum ada Workflow run yang tercatat.
                    </div>
                  ) : (
                    data.workflowRuns.map((wf) => {
                      const isRerunning = rerunningIds.includes(wf.id);
                      const isRunning =
                        wf.status === "in_progress" || wf.status === "queued" || isRerunning;

                      return (
                        <div
                          key={wf.id}
                          className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-main)] text-xs hover:border-[var(--accent-border)] transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {wf.conclusion === "success" && !isRerunning ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              ) : wf.conclusion === "failure" && !isRerunning ? (
                                <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                              ) : (
                                <Clock className="w-4 h-4 text-amber-500 animate-spin shrink-0" />
                              )}
                              <span className="font-semibold text-[var(--text-primary)] truncate">
                                {wf.name}
                              </span>
                              {wf.branch && (
                                <span className="text-[11px] text-[var(--text-muted)] truncate">
                                  (branch {wf.branch})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-[11px]">
                              <span className="capitalize font-semibold">
                                {isRerunning ? "Dipicu ulang..." : wf.conclusion || wf.status}
                              </span>
                              <span>• {formatRelativeTime(wf.updatedAt)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Actionable Re-run Workflow Button */}
                            <button
                              type="button"
                              onClick={() => handleRerunWorkflow(wf.id)}
                              disabled={isRunning}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-[var(--bg-card)] hover:bg-[#5c62ec]/10 text-[var(--text-secondary)] hover:text-[#5c62ec] border border-[var(--border-main)] hover:border-[#5c62ec]/30 transition-all cursor-pointer disabled:opacity-50"
                              title="Picu ulang workflow ini di GitHub Actions"
                            >
                              {isRerunning ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#5c62ec]" />
                              ) : (
                                <RotateCw className="w-3.5 h-3.5 text-[#5c62ec]" />
                              )}
                              <span>{isRerunning ? "Memicu..." : "Re-run"}</span>
                            </button>

                            <a
                              href={wf.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[#5c62ec] hover:bg-[var(--accent-soft)] transition-colors"
                              title="Buka di GitHub"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
