"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { formatRelativeTime } from "@/lib/utils/date";
import { exportReposToCsv, exportDashboardToJson } from "@/lib/utils/export";
import {
  Search,
  Star,
  GitFork,
  GitPullRequest,
  AlertCircle,
  ExternalLink,
  Lock,
  Archive,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  FolderGit2,
  FileSpreadsheet,
  FileJson,
  Pin,
} from "lucide-react";

export interface RepoItem {
  id: string;
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  isPrivate: boolean;
  isArchived: boolean;
  isPinned?: boolean;
  defaultBranch: string;
  htmlUrl: string;
  pushedAt: string | null;
  updatedAt: string;
  latestCiStatus: string | null;
  openPrCount: number;
}

interface RepoListProps {
  repositories: RepoItem[];
  onSelectRepo: (repo: RepoItem) => void;
  onTogglePin?: (repoId: string, currentPinned: boolean) => Promise<void> | void;
  isLoading?: boolean;
}

export function RepoList({
  repositories,
  onSelectRepo,
  onTogglePin,
  isLoading,
}: RepoListProps) {
  const [search, setSearch] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedVisibility, setSelectedVisibility] = useState<
    "all" | "public" | "private" | "archived" | "pinned"
  >("all");
  const [sortBy, setSortBy] = useState<"pushedAt" | "stars" | "prs" | "name">("pushedAt");

  // Available unique languages
  const languages = useMemo(() => {
    const set = new Set<string>();
    repositories.forEach((r) => {
      if (r.language) set.add(r.language);
    });
    return Array.from(set).sort();
  }, [repositories]);

  // Filtered & Sorted repositories
  const filteredRepos = useMemo(() => {
    return repositories
      .filter((repo) => {
        // Search query
        if (search) {
          const q = search.toLowerCase();
          const matchName = repo.name.toLowerCase().includes(q);
          const matchDesc = (repo.description ?? "").toLowerCase().includes(q);
          if (!matchName && !matchDesc) return false;
        }

        // Language filter
        if (selectedLanguage !== "all" && repo.language !== selectedLanguage) {
          return false;
        }

        // Visibility filter
        if (selectedVisibility === "pinned" && !repo.isPinned) return false;
        if (selectedVisibility === "private" && !repo.isPrivate) return false;
        if (selectedVisibility === "public" && repo.isPrivate) return false;
        if (selectedVisibility === "archived" && !repo.isArchived) return false;

        return true;
      })
      .sort((a, b) => {
        // Prioritize pinned repositories at the top
        const aPinned = a.isPinned ? 1 : 0;
        const bPinned = b.isPinned ? 1 : 0;
        if (aPinned !== bPinned) {
          return bPinned - aPinned;
        }

        if (sortBy === "pushedAt") {
          const timeA = a.pushedAt ? new Date(a.pushedAt).getTime() : 0;
          const timeB = b.pushedAt ? new Date(b.pushedAt).getTime() : 0;
          return timeB - timeA;
        }
        if (sortBy === "stars") {
          return b.stars - a.stars;
        }
        if (sortBy === "prs") {
          return b.openPrCount - a.openPrCount;
        }
        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [repositories, search, selectedLanguage, selectedVisibility, sortBy]);

  const renderCiBadge = (status: string | null) => {
    if (!status) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--border-main)] text-[var(--text-muted)] border border-[var(--border-main)]">
          <HelpCircle className="w-3 h-3" />
          <span>No CI</span>
        </span>
      );
    }

    switch (status.toLowerCase()) {
      case "success":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>CI Pass</span>
          </span>
        );
      case "failure":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <XCircle className="w-3 h-3 text-rose-500" />
            <span>CI Fail</span>
          </span>
        );
      case "in_progress":
      case "queued":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Clock className="w-3 h-3 text-amber-500 animate-spin" />
            <span>CI Running</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--border-main)] text-[var(--text-muted)]">
            {status}
          </span>
        );
    }
  };

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Shortcut key '/' to focus repository search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="card-surface p-5 sm:p-6 mb-8">
      {/* Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#5c62ec]/10 text-[#5c62ec]">
            <FolderGit2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)]">
              Daftar Repositori
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              {filteredRepos.length} dari {repositories.length} repositori terhubung
            </p>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportReposToCsv(filteredRepos)}
            disabled={filteredRepos.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--bg-main)] hover:bg-[var(--accent-soft)] border border-[var(--border-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer disabled:opacity-50"
            title="Download data repositori sebagai file CSV / Spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => exportDashboardToJson({ repositories: filteredRepos })}
            disabled={filteredRepos.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--bg-main)] hover:bg-[var(--accent-soft)] border border-[var(--border-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer disabled:opacity-50"
            title="Download data repositori sebagai file JSON"
          >
            <FileJson className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Controls: Search, Language, Visibility, Sort */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari repositori... (tekan '/' untuk cari)"
            className="w-full pl-9 pr-9 py-2.5 text-xs bg-[var(--bg-main)] text-[var(--text-primary)] placeholder-[var(--text-muted)] border border-[var(--border-main)] rounded-xl focus:outline-none focus:border-[#5c62ec] focus:ring-2 focus:ring-[#5c62ec]/20 transition-all font-medium"
          />
          <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-[var(--text-muted)] bg-[var(--bg-card)] border border-[var(--border-main)] px-1.5 py-0.5 rounded-md pointer-events-none">
            /
          </kbd>
        </div>

        {/* Language Filter */}
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="py-2.5 px-3.5 text-xs bg-[var(--bg-main)] text-[var(--text-primary)] border border-[var(--border-main)] rounded-xl focus:outline-none focus:border-[#5c62ec] focus:ring-2 focus:ring-[#5c62ec]/20 transition-all font-medium cursor-pointer"
        >
          <option value="all">Semua Bahasa</option>
          {languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>

        {/* Visibility Filter */}
        <select
          value={selectedVisibility}
          onChange={(e) =>
            setSelectedVisibility(
              e.target.value as "all" | "public" | "private" | "archived" | "pinned",
            )
          }
          className="py-2.5 px-3.5 text-xs bg-[var(--bg-main)] text-[var(--text-primary)] border border-[var(--border-main)] rounded-xl focus:outline-none focus:border-[#5c62ec] focus:ring-2 focus:ring-[#5c62ec]/20 transition-all font-medium cursor-pointer"
        >
          <option value="all">Semua Akses</option>
          <option value="pinned">📌 Disematkan Saja</option>
          <option value="public">Publik Saja</option>
          <option value="private">Private Saja</option>
          <option value="archived">Diarsipkan</option>
        </select>

        {/* Sorting */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "pushedAt" | "stars" | "prs" | "name")}
          className="py-2.5 px-3.5 text-xs bg-[var(--bg-main)] text-[var(--text-primary)] border border-[var(--border-main)] rounded-xl focus:outline-none focus:border-[#5c62ec] focus:ring-2 focus:ring-[#5c62ec]/20 transition-all font-medium cursor-pointer"
        >
          <option value="pushedAt">Urut: Aktivitas Terkini</option>
          <option value="stars">Urut: Bintang Terbanyak</option>
          <option value="prs">Urut: PR Terbuka</option>
          <option value="name">Urut: Nama (A-Z)</option>
        </select>
      </div>

      {/* Repository Cards Grid - Inspired by Image 1 & 2 */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl bg-[var(--border-main)]/40 animate-pulse border border-[var(--border-main)]"
            />
          ))}
        </div>
      ) : filteredRepos.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-secondary)]">
          <FolderGit2 className="w-10 h-10 mx-auto text-[var(--text-muted)] mb-3 opacity-40" />
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Tidak ada repositori yang cocok
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Ubah kata kunci pencarian atau sesuaikan opsi filter Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRepos.map((repo) => (
            <div
              key={repo.id}
              onClick={() => onSelectRepo(repo)}
              className={`group flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-[var(--bg-main)] hover:bg-[var(--accent-soft)] transition-all hover:shadow-md cursor-pointer ${
                repo.isPinned
                  ? "border-2 border-amber-500/40 dark:border-amber-500/30 bg-amber-500/[0.03]"
                  : "border border-[var(--border-main)] hover:border-[var(--accent-border)]"
              }`}
            >
              <div>
                {/* Header: Title + Badges */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h3 className="font-bold text-sm text-[var(--text-primary)] group-hover:text-[#5c62ec] dark:group-hover:text-[#8b91ff] transition-colors truncate">
                      {repo.name}
                    </h3>
                    {repo.isPinned && (
                      <span
                        className="px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-500 text-[10px] font-bold border border-amber-500/25 shrink-0"
                        title="Repositori disematkan"
                      >
                        Pinned
                      </span>
                    )}
                    {repo.isPrivate && (
                      <span
                        className="p-1 rounded-md bg-amber-500/10 text-amber-500 shrink-0"
                        title="Private repository"
                      >
                        <Lock className="w-3 h-3" />
                      </span>
                    )}
                    {repo.isArchived && (
                      <span
                        className="p-1 rounded-md bg-[var(--border-main)] text-[var(--text-muted)] shrink-0"
                        title="Archived repository"
                      >
                        <Archive className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Pin / Unpin Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin?.(repo.id, !!repo.isPinned);
                      }}
                      className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                        repo.isPinned
                          ? "text-amber-500 bg-amber-500/15 hover:bg-amber-500/25"
                          : "text-[var(--text-muted)] hover:text-amber-500 hover:bg-[var(--accent-soft)] opacity-60 group-hover:opacity-100"
                      }`}
                      title={
                        repo.isPinned
                          ? "Lepas sematan repositori"
                          : "Sematkan repositori ke posisi teratas"
                      }
                    >
                      <Pin
                        className={`w-3.5 h-3.5 transition-transform ${
                          repo.isPinned ? "fill-amber-500 rotate-45" : "hover:scale-110"
                        }`}
                      />
                    </button>

                    <a
                      href={repo.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[#5c62ec] hover:bg-[var(--accent-soft)] transition-colors opacity-70 group-hover:opacity-100 shrink-0"
                      title="Buka di GitHub"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-[var(--text-secondary)] line-clamp-2 min-h-[2rem] mb-4">
                  {repo.description || "Tidak ada deskripsi repositori."}
                </p>
              </div>

              {/* Footer Metrics */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3 pt-3 border-t border-[var(--border-main)] text-xs">
                  {/* Language */}
                  <div className="flex items-center gap-1.5 font-semibold truncate text-[var(--text-primary)]">
                    {repo.language ? (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-[#5c62ec] shrink-0" />
                        <span className="truncate">{repo.language}</span>
                      </>
                    ) : (
                      <span className="text-[var(--text-muted)] font-normal">Text</span>
                    )}
                  </div>

                  {/* CI Badge */}
                  <div>{renderCiBadge(repo.latestCiStatus)}</div>
                </div>

                {/* Sub metrics: stars, forks, prs, issues, pushed */}
                <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] font-medium">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1" title="Stars">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span>{repo.stars}</span>
                    </span>
                    <span className="flex items-center gap-1" title="Forks">
                      <GitFork className="w-3 h-3 text-[var(--text-muted)]" />
                      <span>{repo.forks}</span>
                    </span>
                    {repo.openPrCount > 0 && (
                      <span
                        className="flex items-center gap-1 text-purple-500 font-semibold"
                        title="Open PRs"
                      >
                        <GitPullRequest className="w-3 h-3" />
                        <span>{repo.openPrCount}</span>
                      </span>
                    )}
                    {repo.openIssues > 0 && (
                      <span
                        className="flex items-center gap-1 text-amber-500 font-semibold"
                        title="Open Issues"
                      >
                        <AlertCircle className="w-3 h-3" />
                        <span>{repo.openIssues}</span>
                      </span>
                    )}
                  </div>

                  <span className="text-[var(--text-muted)]">
                    {repo.pushedAt ? formatRelativeTime(repo.pushedAt) : "Belum push"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
