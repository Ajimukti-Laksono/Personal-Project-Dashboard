import { RepoItem } from "@/components/RepoList";

/**
 * Utility to export dashboard repositories and activities to CSV and JSON formats.
 */

export function exportReposToCsv(repos: RepoItem[], filename = "github-repositories.csv") {
  if (typeof window === "undefined" || repos.length === 0) return;

  const headers = [
    "Name",
    "Full Name",
    "Language",
    "Stars",
    "Forks",
    "Open Issues",
    "Open PRs",
    "Visibility",
    "Default Branch",
    "Last Push",
    "CI Status",
    "URL",
  ];

  const rows = repos.map((r) => [
    `"${r.name.replace(/"/g, '""')}"`,
    `"${r.fullName.replace(/"/g, '""')}"`,
    `"${(r.language || "Unknown").replace(/"/g, '""')}"`,
    r.stars,
    r.forks,
    r.openIssues,
    r.openPrCount,
    r.isPrivate ? "Private" : "Public",
    r.defaultBranch,
    r.pushedAt ? `"${new Date(r.pushedAt).toISOString()}"` : '""',
    `"${(r.latestCiStatus || "None").replace(/"/g, '""')}"`,
    `"${r.htmlUrl}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename);
}

export function exportDashboardToJson(data: unknown, filename = "dashboard-data.json") {
  if (typeof window === "undefined" || !data) return;

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  downloadBlob(blob, filename);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
