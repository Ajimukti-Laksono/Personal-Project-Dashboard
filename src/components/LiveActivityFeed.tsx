"use client";

import { useState } from "react";
import { ActivityItem } from "@/app/api/dashboard/route";
import { formatRelativeTime } from "@/lib/utils/date";
import {
  GitCommit,
  GitPullRequest,
  AlertCircle,
  PlayCircle,
  ExternalLink,
  User,
  Radio,
} from "lucide-react";
import Image from "next/image";

interface LiveActivityFeedProps {
  activities: ActivityItem[];
  isLoading?: boolean;
}

export function LiveActivityFeed({ activities, isLoading }: LiveActivityFeedProps) {
  const [filter, setFilter] = useState<"all" | "commit" | "pr" | "issue" | "workflow">("all");

  const filtered = activities.filter((act) => {
    if (filter === "all") return true;
    return act.type === filter;
  });

  const getIcon = (type: ActivityItem["type"], state?: string | null) => {
    switch (type) {
      case "commit":
        return <GitCommit className="w-4 h-4 text-sky-500" />;
      case "pr":
        return (
          <GitPullRequest
            className={`w-4 h-4 ${
              state === "merged"
                ? "text-purple-500"
                : state === "closed"
                  ? "text-rose-500"
                  : "text-emerald-500"
            }`}
          />
        );
      case "issue":
        return (
          <AlertCircle
            className={`w-4 h-4 ${
              state === "closed" ? "text-[var(--text-muted)]" : "text-amber-500"
            }`}
          />
        );
      case "workflow":
        return (
          <PlayCircle
            className={`w-4 h-4 ${
              state === "success"
                ? "text-emerald-500"
                : state === "failure"
                  ? "text-rose-500"
                  : "text-[#5c62ec]"
            }`}
          />
        );
    }
  };

  const getBadge = (type: ActivityItem["type"], state?: string | null) => {
    switch (type) {
      case "commit":
        return { label: "Commit", color: "bg-sky-500/10 text-sky-500 border-sky-500/20" };
      case "pr":
        return {
          label: state === "merged" ? "PR Merged" : state === "closed" ? "PR Closed" : "PR Open",
          color:
            state === "merged"
              ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
              : state === "closed"
                ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        };
      case "issue":
        return {
          label: state === "closed" ? "Issue Closed" : "Issue Open",
          color:
            state === "closed"
              ? "bg-[var(--border-main)] text-[var(--text-muted)] border-[var(--border-main)]"
              : "bg-amber-500/10 text-amber-500 border-amber-500/20",
        };
      case "workflow":
        return {
          label: `CI ${state || "Run"}`,
          color:
            state === "success"
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
              : state === "failure"
                ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                : "bg-[#5c62ec]/10 text-[#5c62ec] border-[#5c62ec]/20",
        };
    }
  };

  return (
    <div className="card-surface p-5 sm:p-6 mb-8">
      {/* Header and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)]">
              Live Activity Feed
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Pemantauan event GitHub waktu-nyata ({filtered.length} terdeteksi)
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border-main)]">
          {(
            [
              { key: "all", label: "Semua" },
              { key: "commit", label: "Commit" },
              { key: "pr", label: "Pull Request" },
              { key: "issue", label: "Issue" },
              { key: "workflow", label: "CI Actions" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filter === tab.key
                  ? "bg-[#5c62ec] text-white shadow-xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-soft)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 rounded-xl bg-[var(--border-main)]/50 animate-pulse border border-[var(--border-main)]"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-secondary)]">
          <Radio className="w-10 h-10 mx-auto text-[var(--text-muted)] mb-3 opacity-40" />
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Belum ada aktivitas yang tercatat
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Aktivitas akan muncul otomatis saat Anda melakukan git push atau tindakan lain di
            GitHub.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
          {filtered.map((item) => {
            const badge = getBadge(item.type, item.state);
            return (
              <div
                key={item.id}
                className="group flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-[var(--bg-main)] hover:bg-[var(--accent-soft)] border border-[var(--border-main)] hover:border-[var(--accent-border)] transition-all animate-slide-down"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-2xs shrink-0 mt-0.5">
                    {getIcon(item.type, item.state)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-xs text-[#5c62ec] dark:text-[#8b91ff] hover:underline cursor-pointer">
                        {item.repoName}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                      {item.subtitle && (
                        <span className="text-[11px] text-[var(--text-muted)]">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold truncate text-[var(--text-primary)]">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-[var(--text-secondary)]">
                      {item.authorAvatar ? (
                        <Image
                          src={item.authorAvatar}
                          alt={item.authorName}
                          width={16}
                          height={16}
                          unoptimized
                          className="w-4 h-4 rounded-full border border-[var(--border-main)]"
                        />
                      ) : (
                        <User className="w-3.5 h-3.5" />
                      )}
                      <span>{item.authorLogin || item.authorName}</span>
                      <span>•</span>
                      <span>{formatRelativeTime(item.timestamp)}</span>
                    </div>
                  </div>
                </div>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[#5c62ec] hover:bg-[var(--accent-soft)] transition-colors opacity-70 group-hover:opacity-100 shrink-0"
                  title="Buka di GitHub"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
