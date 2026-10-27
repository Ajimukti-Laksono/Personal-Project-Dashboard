"use client";

import {
  LayoutDashboard,
  FolderGit2,
  Radio,
  Calendar,
  BarChart3,
  LogOut,
  LogIn,
  X,
  User,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Logo } from "./Logo";

export type NavSection = "overview" | "repositories" | "feed" | "heatmap" | "analytics";

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  repoCount: number;
  userName?: string;
  userAvatar?: string | null;
  githubUrl?: string;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  onLogout?: () => void;
  onRequestAdminLogin?: () => void;
  onRequestLogout?: () => void;
}

export function Sidebar({
  activeSection,
  onSelectSection,
  repoCount,
  userName = "Ajimukti Laksono",
  userAvatar,
  githubUrl,
  isOpen,
  onClose,
  isAdmin = false,
  onLogout,
  onRequestAdminLogin,
  onRequestLogout,
}: SidebarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
      return;
    }
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch {
      // ignore
    }
  };

  const navItems = [
    {
      id: "overview" as const,
      label: "Overview",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: "repositories" as const,
      label: "Repositories",
      icon: <FolderGit2 className="w-4 h-4" />,
      badge: repoCount > 0 ? String(repoCount) : undefined,
    },
    {
      id: "feed" as const,
      label: "Live Feed",
      icon: <Radio className="w-4 h-4" />,
      liveDot: true,
    },
    {
      id: "heatmap" as const,
      label: "Commit Heatmap",
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      id: "analytics" as const,
      label: "Analytics",
      icon: <BarChart3 className="w-4 h-4" />,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container (Floating rounded card on desktop as in screenshot) */}
      <aside
        className={`fixed top-0 lg:top-4 left-0 lg:left-4 z-50 h-full lg:h-[calc(100vh-2rem)] w-64 sidebar-surface flex flex-col justify-between rounded-none lg:rounded-3xl border-r lg:border border-[var(--border-main)] shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top: Logo & Close Button */}
        <div>
          <div className="h-20 px-6 flex items-center justify-between border-b border-[var(--border-main)]">
            <Logo size="sm" />

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="px-4 py-6">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-3 mb-3">
              Menu Utama
            </div>
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectSection(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#5c62ec] text-white shadow-sm shadow-[#5c62ec]/30"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-soft)]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? "text-white" : "text-[var(--text-muted)]"}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.liveDot && (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                      )}
                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-[var(--accent-soft)] text-[#5c62ec] dark:text-[#8b91ff]"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom: User Profile Card (Just like Image 1 & 2) */}
        <div className="p-4 border-t border-[var(--border-main)]">
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-main)]">
            <a
              href={githubUrl || "https://github.com/Ajimukti-Laksono"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 min-w-0 flex-1 group hover:opacity-95 transition-all cursor-pointer mr-2"
              title="Buka profil GitHub"
            >
              {userAvatar ? (
                <Image
                  src={userAvatar}
                  alt={userName}
                  width={34}
                  height={34}
                  unoptimized
                  className="w-8.5 h-8.5 rounded-xl object-cover border border-[var(--border-main)] shrink-0 group-hover:ring-2 group-hover:ring-[#5c62ec]/60 transition-all"
                />
              ) : (
                <div className="w-8.5 h-8.5 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center text-[#5c62ec] shrink-0 group-hover:ring-2 group-hover:ring-[#5c62ec]/60 transition-all">
                  <User className="w-4 h-4" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-bold truncate text-[var(--text-primary)] group-hover:text-[#5c62ec] transition-colors">
                    {userName}
                  </p>
                  <ExternalLink className="w-3 h-3 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 group-hover:text-[#5c62ec] transition-all shrink-0" />
                </div>
                <p
                  className={`text-[10px] font-medium flex items-center gap-1 ${
                    isAdmin
                      ? "text-[#5c62ec] dark:text-[#8b91ff] font-semibold"
                      : "text-emerald-500"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full inline-block ${
                      isAdmin ? "bg-[#5c62ec] animate-pulse" : "bg-emerald-500"
                    }`}
                  />
                  {isAdmin ? "Mode Admin Aktif" : "GitHub Pro"}
                </p>
              </div>
            </a>

            <button
              type="button"
              id="sidebar-admin-btn"
              onClick={() => {
                if (isAdmin) {
                  if (onRequestLogout) {
                    onRequestLogout();
                  } else {
                    handleLogout();
                  }
                } else {
                  if (onRequestAdminLogin) {
                    onRequestAdminLogin();
                  } else {
                    router.push("/login?from=/");
                  }
                }
              }}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[#5c62ec] hover:bg-[#5c62ec]/10 transition-colors shrink-0 cursor-pointer"
              title={isAdmin ? "Keluar dari Mode Admin" : "Masuk ke Mode Admin"}
            >
              {isAdmin ? (
                <LogOut className="w-4 h-4 text-rose-500" />
              ) : (
                <LogIn className="w-4 h-4 text-[var(--text-muted)]" />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
