"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useEventStream } from "@/lib/realtime/useEventStream";
import { RealtimeEventType } from "@/lib/realtime";
import {
  Sidebar,
  NavSection,
  Navbar,
  SummaryCards,
  LiveActivityFeed,
  CommitHeatmap,
  ChartsSection,
  RepoList,
  RepoDetailModal,
  WebhookModal,
  RepoItem,
  CircuitGridBackground,
  AdminConfirmModal,
  AdminLogoutModal,
} from "@/components";
import { ActivityItem } from "@/app/api/dashboard/route";
import { BellRing, X } from "lucide-react";

interface DashboardData {
  githubUsername?: string;
  githubUrl?: string;
  summary: {
    totalRepos: number;
    commits7Days: number;
    openPrs: number;
    openIssues: number;
    latestCiStatus: string;
    lastSyncTime: string | null;
    syncStatus: string;
  };
  activityFeed: ActivityItem[];
  heatmap: Record<string, number>;
  charts: {
    dailyCommits: Array<{ date: string; label: string; commits: number }>;
    languages: Array<{ name: string; count: number; percentage: number }>;
  };
  repositories: RepoItem[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<RepoItem | null>(null);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<NavSection>("overview");
  const [toast, setToast] = useState<{ message: string; type: "info" | "success" } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminConfirmOpen, setIsAdminConfirmOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [adminTargetFeature, setAdminTargetFeature] = useState<string | undefined>(undefined);
  const [adminRedirectUrl, setAdminRedirectUrl] = useState<string>("/");

  // Theme & mounting state
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme");
    const initial = saved === "light" ? "light" : "dark";
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const handleSetTheme = (newTheme: "dark" | "light") => {
    setTheme(newTheme);
    try {
      localStorage.setItem("theme", newTheme);
      document.documentElement.classList.toggle("dark", newTheme === "dark");
    } catch {}
  };

  const toggleTheme = () => {
    handleSetTheme(theme === "dark" ? "light" : "dark");
  };

  // Check admin session status on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { authenticated?: boolean } | null) => {
        setIsAdmin(Boolean(data?.authenticated));
      })
      .catch(() => setIsAdmin(false));
  }, []);

  const handleRequestAdminLogin = (featureName?: string, redirectPath = "/") => {
    setAdminTargetFeature(featureName);
    setAdminRedirectUrl(redirectPath);
    setIsAdminConfirmOpen(true);
  };

  const handleConfirmAdminLogin = () => {
    setIsAdminConfirmOpen(false);
    showToast("Mengarahkan ke halaman login Administrator...", "info");
    router.push(`/login?from=${encodeURIComponent(adminRedirectUrl)}`);
  };

  const handleRequestLogout = () => {
    setIsLogoutConfirmOpen(true);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setIsAdmin(false);
      showToast("Berhasil keluar dari mode Admin.", "info");
    } catch {
      showToast("Gagal logout.", "info");
    } finally {
      setIsLoggingOut(false);
      setIsLogoutConfirmOpen(false);
    }
  };

  const handleLogout = async () => {
    handleRequestLogout();
  };

  // Global keyboard shortcut: 'w' to toggle Webhook Diagnostics Modal (Admin only)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "w" || e.key === "W") &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        if (!isAdmin) {
          handleRequestAdminLogin("Diagnostik Webhook");
        } else {
          setIsWebhookModalOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAdmin, router]);

  const showToast = (message: string, type: "info" | "success" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (res.ok) {
        const json = (await res.json()) as DashboardData;
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/dashboard", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: DashboardData | null) => {
        if (isMounted && json) {
          setData(json);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Initial load error:", err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle incoming real-time SSE events
  const handleRealtimeEvent = useCallback(
    (type: RealtimeEventType, payload: unknown) => {
      const eventData = payload as Record<string, unknown>;

      if (type === "commit.new") {
        showToast(
          `Commit baru di ${eventData.repoFullName}: "${String(eventData.message || "").slice(0, 45)}"`,
          "success",
        );

        const newActivity: ActivityItem = {
          id: `commit-${eventData.sha}`,
          type: "commit",
          repoName: String(eventData.repoFullName || "").split("/")[1] || "repo",
          repoFullName: String(eventData.repoFullName || ""),
          title: String(eventData.message || ""),
          subtitle: eventData.branch ? `branch ${eventData.branch}` : undefined,
          url: String(eventData.url || "#"),
          authorName: String(eventData.authorName || "Unknown"),
          authorLogin: (eventData.authorLogin as string) || null,
          authorAvatar: (eventData.authorAvatar as string) || null,
          timestamp: (eventData.committedAt as string) || new Date().toISOString(),
        };

        setData((prev) => {
          if (!prev) return prev;
          const dateKey = new Date().toISOString().split("T")[0];
          const newHeatmap = { ...prev.heatmap, [dateKey]: (prev.heatmap[dateKey] || 0) + 1 };

          return {
            ...prev,
            summary: {
              ...prev.summary,
              commits7Days: prev.summary.commits7Days + 1,
            },
            activityFeed: [newActivity, ...prev.activityFeed.slice(0, 24)],
            heatmap: newHeatmap,
          };
        });
      } else if (type === "pr.updated") {
        showToast(`Pull Request diupdate: #${eventData.number} ${eventData.title}`);
        fetchDashboardData();
      } else if (type === "issue.updated") {
        showToast(`Issue diupdate: #${eventData.number} ${eventData.title}`);
        fetchDashboardData();
      } else if (type === "workflow.updated") {
        showToast(`GitHub Actions selesai: ${eventData.name} (${eventData.status})`);
        fetchDashboardData();
      } else if (type === "repo.updated") {
        fetchDashboardData();
      }
    },
    [fetchDashboardData],
  );

  // SSE stream connection with auto-reconnect & auto-refetch
  const { status } = useEventStream({
    onEvent: handleRealtimeEvent,
    onReconnect: fetchDashboardData,
  });

  // Manual sync trigger
  const handleSync = async () => {
    if (!isAdmin) {
      handleRequestAdminLogin("Sinkronisasi GitHub");
      return;
    }

    setIsSyncing(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        showToast(`Sync selesai: ${json.stats?.reposProcessed ?? 0} repo diproses.`, "success");
        await fetchDashboardData();
      } else {
        if (res.status === 401) {
          setIsAdmin(false);
          handleRequestAdminLogin("Sinkronisasi GitHub");
          showToast("Sesi admin telah berakhir. Silakan login kembali.", "info");
        } else {
          showToast(`Sync gagal: ${json.error || "Terjadi kesalahan"}`, "info");
        }
      }
    } catch {
      showToast("Gagal menyambung ke server sync.", "info");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenWebhookModal = () => {
    if (!isAdmin) {
      handleRequestAdminLogin("Diagnostik Webhook");
      return;
    }
    setIsWebhookModalOpen(true);
  };

  // Toggle repository pin status
  const handleTogglePin = async (repoId: string, currentPinned: boolean) => {
    if (!isAdmin) {
      handleRequestAdminLogin("Sematkan Repositori");
      return;
    }

    // 1. Optimistic update
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        repositories: prev.repositories.map((r) =>
          r.id === repoId ? { ...r, isPinned: !currentPinned } : r,
        ),
      };
    });

    if (selectedRepo && selectedRepo.id === repoId) {
      setSelectedRepo((prev) => (prev ? { ...prev, isPinned: !currentPinned } : null));
    }

    try {
      const res = await fetch(`/api/repos/${repoId}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !currentPinned }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal mengubah status sematan");
      }
      setToast({
        message:
          json.message ||
          (!currentPinned ? "Repositori berhasil disematkan" : "Sematan repositori dilepas"),
        type: "success",
      });
    } catch {
      // Revert optimistic update on failure
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          repositories: prev.repositories.map((r) =>
            r.id === repoId ? { ...r, isPinned: currentPinned } : r,
          ),
        };
      });
      if (selectedRepo && selectedRepo.id === repoId) {
        setSelectedRepo((prev) => (prev ? { ...prev, isPinned: currentPinned } : null));
      }
      setToast({
        message: "Gagal menyimpan perubahan sematan ke server",
        type: "info",
      });
    }
  };

  // Extract user info for sidebar
  const userProfile = useMemo(() => {
    const firstWithAvatar = data?.activityFeed.find((a) => a.authorAvatar);
    const repoOwner = data?.repositories[0]?.fullName?.split("/")[0];
    const username =
      data?.githubUsername || firstWithAvatar?.authorLogin || repoOwner || "Ajimukti-Laksono";
    return {
      name: firstWithAvatar?.authorName || username || "Ajimukti Laksono",
      avatar: firstWithAvatar?.authorAvatar || null,
      githubUrl: data?.githubUrl || `https://github.com/${username}`,
    };
  }, [data]);

  // Smooth scroll handler for sidebar navigation
  const handleSelectSection = (section: NavSection) => {
    setActiveSection(section);
    const targetElement = document.getElementById(section);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="relative min-h-screen text-[var(--text-primary)] transition-colors">
      {/* Living Dynamic Circuit Grid Background (Day/Night reactive) */}
      <CircuitGridBackground isDarkMode={mounted ? theme === "dark" : true} />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 py-3.5 px-4.5 rounded-2xl bg-[var(--bg-card)] text-[var(--text-primary)] shadow-2xl border border-[var(--border-main)] backdrop-blur-xl animate-slide-down">
          <BellRing className="w-4 h-4 text-[#5c62ec] shrink-0" />
          <span className="text-xs font-semibold max-w-sm">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. Sidebar Component (Fixed on desktop, drawer on mobile) */}
      <Sidebar
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        repoCount={data?.repositories.length ?? 0}
        userName={userProfile.name}
        userAvatar={userProfile.avatar}
        githubUrl={userProfile.githubUrl}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isAdmin={isAdmin}
        onLogout={handleRequestLogout}
        onRequestAdminLogin={() => handleRequestAdminLogin()}
        onRequestLogout={handleRequestLogout}
      />

      {/* Main Content Area (Offset for floating sidebar on desktop) */}
      <div className="lg:pl-72 flex flex-col min-h-screen relative z-10">
        {/* Navigation Bar */}
        <Navbar
          status={status}
          lastSyncTime={data?.summary.lastSyncTime ?? null}
          onSync={handleSync}
          isSyncing={isSyncing}
          theme={theme}
          onToggleTheme={toggleTheme}
          onSetTheme={handleSetTheme}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          mounted={mounted}
          onOpenWebhookModal={handleOpenWebhookModal}
          isAdmin={isAdmin}
          onRequestAdminLogin={() => handleRequestAdminLogin()}
          onRequestLogout={handleRequestLogout}
        />

        {/* Dashboard Main View */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Section: Overview (Summary Metric Cards) */}
          <section id="overview" className="scroll-mt-24">
            <SummaryCards
              summary={
                data?.summary ?? {
                  totalRepos: 0,
                  commits7Days: 0,
                  openPrs: 0,
                  openIssues: 0,
                  latestCiStatus: "unknown",
                }
              }
              isLoading={isLoading}
            />
          </section>

          {/* Section: Analytics (Live Analytics Area Chart & Language Donut) */}
          <section id="analytics" className="scroll-mt-24">
            <ChartsSection
              dailyCommits={data?.charts.dailyCommits ?? []}
              languages={data?.charts.languages ?? []}
              isLoading={isLoading}
              theme={theme}
            />
          </section>

          {/* Section: Heatmap (12-month GitHub Commit Heatmap) */}
          <section id="heatmap" className="scroll-mt-24">
            <CommitHeatmap data={data?.heatmap ?? {}} isLoading={isLoading} />
          </section>

          {/* Section: Live Activity Feed (Real-time SSE event stream) */}
          <section id="feed" className="scroll-mt-24">
            <LiveActivityFeed activities={data?.activityFeed ?? []} isLoading={isLoading} />
          </section>

          {/* Section: Repositories (Searchable, filterable repo cards) */}
          <section id="repositories" className="scroll-mt-24">
            <RepoList
              repositories={data?.repositories ?? []}
              onSelectRepo={(repo) => setSelectedRepo(repo)}
              onTogglePin={handleTogglePin}
              isLoading={isLoading}
            />
          </section>
        </main>

        {/* Repository Detail Modal */}
        <RepoDetailModal
          repo={selectedRepo}
          onClose={() => setSelectedRepo(null)}
          onTogglePin={handleTogglePin}
          onWebhookConfigured={fetchDashboardData}
        />

        {/* Webhook Diagnostics & Test Simulator Modal */}
        <WebhookModal
          isOpen={isWebhookModalOpen}
          onClose={() => setIsWebhookModalOpen(false)}
          onEventSimulated={fetchDashboardData}
        />

        {/* Admin Login Confirmation Modal (Notifikasi & Konfirmasi sebelum ke /login) */}
        <AdminConfirmModal
          isOpen={isAdminConfirmOpen}
          onClose={() => setIsAdminConfirmOpen(false)}
          onConfirm={handleConfirmAdminLogin}
          targetFeature={adminTargetFeature}
        />

        {/* Admin Logout Confirmation Modal */}
        <AdminLogoutModal
          isOpen={isLogoutConfirmOpen}
          onClose={() => setIsLogoutConfirmOpen(false)}
          onConfirm={handleConfirmLogout}
          isLoggingOut={isLoggingOut}
        />

        {/* Footer */}
        <footer className="border-t border-[var(--border-main)] py-6 text-center text-xs text-[var(--text-secondary)] font-medium">
          <p>Personal Project Dashboard • Terhubung real-time ke akun GitHub Anda.</p>
        </footer>
      </div>
    </div>
  );
}
