"use client";

import {
  FolderGit2,
  GitCommit,
  GitPullRequest,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  TrendingUp,
} from "lucide-react";

interface SummaryData {
  totalRepos: number;
  commits7Days: number;
  openPrs: number;
  openIssues: number;
  latestCiStatus: string;
}

interface SummaryCardsProps {
  summary: SummaryData;
  isLoading?: boolean;
}

export function SummaryCards({ summary, isLoading }: SummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-32 rounded-2xl bg-[var(--border-main)]/50 animate-pulse border border-[var(--border-main)]"
          />
        ))}
      </div>
    );
  }

  const getCiBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "success":
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
          label: "CI Berhasil",
          trend: "Build Sukses",
          color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
          iconBg: "bg-emerald-500/10 text-emerald-500",
        };
      case "failure":
        return {
          icon: <XCircle className="w-5 h-5 text-rose-500" />,
          label: "CI Gagal",
          trend: "Perlu Dicek",
          color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
          iconBg: "bg-rose-500/10 text-rose-500",
        };
      case "in_progress":
      case "queued":
        return {
          icon: <Clock className="w-5 h-5 text-amber-500 animate-spin" />,
          label: "CI Running",
          trend: "Sedang Berjalan",
          color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
          iconBg: "bg-amber-500/10 text-amber-500",
        };
      default:
        return {
          icon: <HelpCircle className="w-5 h-5 text-[var(--text-muted)]" />,
          label: "Belum Ada CI",
          trend: "Siap Dikonfigurasi",
          color: "text-[var(--text-muted)] bg-[var(--border-main)]",
          iconBg: "bg-[var(--border-main)] text-[var(--text-muted)]",
        };
    }
  };

  const ci = getCiBadge(summary.latestCiStatus);

  const cards = [
    {
      title: "Total Repositori",
      value: summary.totalRepos,
      trend: "Proyek Aktif",
      icon: <FolderGit2 className="w-5 h-5" />,
      iconBg: "bg-[#5c62ec]/10 text-[#5c62ec]",
    },
    {
      title: "Commit (7 Hari)",
      value: summary.commits7Days,
      trend: "Aktivitas Terkini",
      icon: <GitCommit className="w-5 h-5" />,
      iconBg: "bg-sky-500/10 text-sky-500",
    },
    {
      title: "Pull Request Terbuka",
      value: summary.openPrs,
      trend: summary.openPrs === 0 ? "Semua Bersih" : "Perlu Review",
      icon: <GitPullRequest className="w-5 h-5" />,
      iconBg: "bg-violet-500/10 text-violet-500",
    },
    {
      title: "Issue Terbuka",
      value: summary.openIssues,
      trend: summary.openIssues === 0 ? "Nol Masalah" : "Perlu Ditindaklanjuti",
      icon: <AlertCircle className="w-5 h-5" />,
      iconBg: "bg-amber-500/10 text-amber-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 mb-8">
      {cards.map((c, idx) => (
        <div key={idx} className="card-surface p-4 sm:p-5 flex flex-col justify-between">
          {/* Top: Title & Icon in soft container */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">{c.title}</span>
            <div className={`p-2.5 rounded-xl ${c.iconBg}`}>{c.icon}</div>
          </div>

          {/* Value */}
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)] mb-2">
            {c.value.toLocaleString()}
          </div>

          {/* Bottom Trend Badge (FieldPro style) */}
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-500">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{c.trend}</span>
          </div>
        </div>
      ))}

      {/* 5th Card: CI Pipeline Status */}
      <div className="card-surface p-4 sm:p-5 flex flex-col justify-between col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">Status CI/CD</span>
          <div className={`p-2.5 rounded-xl ${ci.iconBg}`}>{ci.icon}</div>
        </div>

        <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--text-primary)] mb-2">
          {ci.label}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-muted)]">
          <span>{ci.trend}</span>
        </div>
      </div>
    </div>
  );
}
