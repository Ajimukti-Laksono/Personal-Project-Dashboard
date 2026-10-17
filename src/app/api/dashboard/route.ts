import { NextResponse } from "next/server";
import { prisma, serializeForClient, getSyncState } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface ActivityItem {
  id: string;
  type: "commit" | "pr" | "issue" | "workflow";
  repoName: string;
  repoFullName: string;
  title: string;
  subtitle?: string;
  url: string;
  authorName: string;
  authorLogin?: string | null;
  authorAvatar?: string | null;
  status?: string | null;
  state?: string | null;
  timestamp: string;
}

/**
 * GET /api/dashboard
 * Aggregates all dashboard metrics, charts, repository lists, and recent activity.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    // 1. Fetch Summary Stats
    const [
      totalRepos,
      commits7Days,
      openPrs,
      openIssues,
      latestWorkflowRun,
      lastSyncTime,
      syncStatus,
    ] = await Promise.all([
      prisma.repository.count(),
      prisma.commit.count({
        where: { committedAt: { gte: sevenDaysAgo } },
      }),
      prisma.pullRequest.count({
        where: { state: "open" },
      }),
      prisma.issue.count({
        where: { state: "open" },
      }),
      prisma.workflowRun.findFirst({
        orderBy: { updatedAt: "desc" },
      }),
      getSyncState("last_sync_time"),
      getSyncState("sync_status"),
    ]);

    // 2. Fetch Repositories with latest CI status and PR counts
    const repositories = await prisma.repository.findMany({
      orderBy: { pushedAt: "desc" },
      include: {
        workflowRuns: {
          take: 1,
          orderBy: { updatedAt: "desc" },
          select: { status: true, conclusion: true, name: true },
        },
        pullRequests: {
          where: { state: "open" },
          select: { id: true },
        },
      },
    });

    const repoList = repositories.map((r) => ({
      id: r.id.toString(),
      name: r.name,
      fullName: r.fullName,
      description: r.description,
      language: r.language,
      stars: r.stars,
      forks: r.forks,
      openIssues: r.openIssues,
      isPrivate: r.isPrivate,
      isArchived: r.isArchived,
      isPinned: r.isPinned ?? false,
      defaultBranch: r.defaultBranch,
      htmlUrl: r.htmlUrl,
      pushedAt: r.pushedAt?.toISOString() ?? null,
      updatedAt: r.updatedAt.toISOString(),
      latestCiStatus: r.workflowRuns[0]?.conclusion ?? r.workflowRuns[0]?.status ?? null,
      openPrCount: r.pullRequests.length,
    }));

    // 3. Fetch Recent Activity Feed (Top 25 combined)
    const [recentCommits, recentPrs, recentIssues, recentWorkflows] = await Promise.all([
      prisma.commit.findMany({
        take: 15,
        orderBy: { committedAt: "desc" },
        include: { repo: { select: { name: true, fullName: true } } },
      }),
      prisma.pullRequest.findMany({
        take: 10,
        orderBy: { updatedAt: "desc" },
        include: { repo: { select: { name: true, fullName: true } } },
      }),
      prisma.issue.findMany({
        take: 10,
        orderBy: { updatedAt: "desc" },
        include: { repo: { select: { name: true, fullName: true } } },
      }),
      prisma.workflowRun.findMany({
        take: 10,
        orderBy: { updatedAt: "desc" },
        include: { repo: { select: { name: true, fullName: true } } },
      }),
    ]);

    const activityFeed: ActivityItem[] = [];

    for (const c of recentCommits) {
      activityFeed.push({
        id: `commit-${c.sha}`,
        type: "commit",
        repoName: c.repo.name,
        repoFullName: c.repo.fullName,
        title: c.message.split("\n")[0],
        subtitle: c.branch ? `branch ${c.branch}` : undefined,
        url: c.url,
        authorName: c.authorName,
        authorLogin: c.authorLogin,
        authorAvatar: c.authorAvatar,
        timestamp: c.committedAt.toISOString(),
      });
    }

    for (const p of recentPrs) {
      activityFeed.push({
        id: `pr-${p.id}`,
        type: "pr",
        repoName: p.repo.name,
        repoFullName: p.repo.fullName,
        title: `#${p.number} ${p.title}`,
        url: p.url,
        authorName: p.author,
        state: p.merged ? "merged" : p.state,
        timestamp: p.updatedAt.toISOString(),
      });
    }

    for (const i of recentIssues) {
      activityFeed.push({
        id: `issue-${i.id}`,
        type: "issue",
        repoName: i.repo.name,
        repoFullName: i.repo.fullName,
        title: `#${i.number} ${i.title}`,
        url: i.url,
        authorName: i.author,
        state: i.state,
        timestamp: i.updatedAt.toISOString(),
      });
    }

    for (const w of recentWorkflows) {
      activityFeed.push({
        id: `wf-${w.id}`,
        type: "workflow",
        repoName: w.repo.name,
        repoFullName: w.repo.fullName,
        title: w.name,
        subtitle: w.branch ? `branch ${w.branch}` : undefined,
        url: w.url,
        authorName: "GitHub Actions",
        status: w.status,
        state: w.conclusion,
        timestamp: w.updatedAt.toISOString(),
      });
    }

    // Sort descending by timestamp
    activityFeed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // 4. Commit Heatmap Data (365 days grouped by YYYY-MM-DD)
    const commitsForHeatmap = await prisma.commit.findMany({
      where: { committedAt: { gte: oneYearAgo } },
      select: { committedAt: true },
    });

    const heatmapMap: Record<string, number> = {};
    for (const c of commitsForHeatmap) {
      const dateKey = c.committedAt.toISOString().split("T")[0];
      heatmapMap[dateKey] = (heatmapMap[dateKey] ?? 0) + 1;
    }

    // 5. Daily Commits for Last 30 Days (for Recharts)
    const last30DaysData: Array<{ date: string; label: string; commits: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = d.toISOString().split("T")[0];
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "Mei",
        "Jun",
        "Jul",
        "Agt",
        "Sep",
        "Okt",
        "Nov",
        "Des",
      ];
      const label = `${d.getDate()} ${monthNames[d.getMonth()]}`;
      last30DaysData.push({
        date: dateKey,
        label,
        commits: heatmapMap[dateKey] ?? 0,
      });
    }

    // 6. Language Distribution
    const languageCounts: Record<string, number> = {};
    let totalLanguageCount = 0;

    for (const r of repositories) {
      if (r.language) {
        languageCounts[r.language] = (languageCounts[r.language] ?? 0) + 1;
        totalLanguageCount++;
      }
    }

    const languages = Object.entries(languageCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalLanguageCount > 0 ? Math.round((count / totalLanguageCount) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const responseData = {
      summary: {
        totalRepos,
        commits7Days,
        openPrs,
        openIssues,
        latestCiStatus: latestWorkflowRun?.conclusion ?? latestWorkflowRun?.status ?? "unknown",
        lastSyncTime: lastSyncTime ?? null,
        syncStatus: syncStatus ?? "idle",
      },
      activityFeed: activityFeed.slice(0, 25),
      heatmap: heatmapMap,
      charts: {
        dailyCommits: last30DaysData,
        languages,
      },
      repositories: repoList,
    };

    return NextResponse.json(serializeForClient(responseData));
  } catch (err) {
    console.error("Dashboard API error:", err);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
