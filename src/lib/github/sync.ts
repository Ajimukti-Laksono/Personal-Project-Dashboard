import { Octokit } from "@octokit/rest";
import { getOctokit } from "./client";
import { getEnv } from "@/lib/env";
import {
  upsertRepository,
  upsertCommit,
  upsertPullRequest,
  upsertIssue,
  upsertWorkflowRun,
  setSyncState,
} from "@/lib/db";
import { broadcast } from "@/lib/realtime";

export interface SyncStats {
  reposProcessed: number;
  commitsProcessed: number;
  prsProcessed: number;
  issuesProcessed: number;
  workflowsProcessed: number;
  errors: Array<{ repo: string; error: string }>;
  startTime: string;
  endTime?: string;
  durationMs?: number;
}

/**
 * Checks remaining GitHub API rate limit from response headers.
 * Throws early if rate limit is exhausted to avoid unnecessary errors.
 */
function checkRateLimit(headers: Record<string, unknown>): void {
  const remaining = headers["x-ratelimit-remaining"];
  if (typeof remaining === "string" || typeof remaining === "number") {
    const rem = Number(remaining);
    if (rem < 5) {
      const reset = headers["x-ratelimit-reset"];
      console.warn(`[GitHub Rate Limit Warning] Only ${rem} requests remaining! Reset at ${reset}`);
    }
  }
}

/**
 * Executes a full backfill/sync from GitHub API.
 * Idempotent: can be run repeatedly without duplicating or corrupting data.
 * Fault-tolerant: errors on one repository do not stop others.
 */
export async function syncAll(client?: Octokit): Promise<SyncStats> {
  const env = getEnv();
  const octokit = client ?? getOctokit();
  const startTime = new Date();

  await setSyncState("sync_status", "running");
  await setSyncState("sync_started_at", startTime.toISOString());

  const stats: SyncStats = {
    reposProcessed: 0,
    commitsProcessed: 0,
    prsProcessed: 0,
    issuesProcessed: 0,
    workflowsProcessed: 0,
    errors: [],
    startTime: startTime.toISOString(),
  };

  try {
    // 1. Fetch repositories
    // Try listForAuthenticatedUser first (includes private repos the token has access to)
    let repos: Array<{
      id: number;
      name: string;
      full_name: string;
      description: string | null;
      language: string | null;
      stargazers_count: number;
      forks_count: number;
      open_issues_count: number;
      private: boolean;
      archived?: boolean;
      default_branch?: string;
      html_url: string;
      pushed_at: string | null;
    }> = [];

    try {
      const authRepos = await octokit.paginate(octokit.repos.listForAuthenticatedUser, {
        per_page: 100,
        affiliation: "owner",
        sort: "updated",
      });
      repos = authRepos as unknown as typeof repos;
    } catch {
      // Fallback to listForUser
      const userRepos = await octokit.paginate(octokit.repos.listForUser, {
        username: env.GITHUB_USERNAME,
        per_page: 100,
        sort: "updated",
      });
      repos = userRepos as unknown as typeof repos;
    }

    for (const repo of repos) {
      try {
        const repoId = BigInt(repo.id);

        // Upsert repository record
        await upsertRepository({
          id: repoId,
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          language: repo.language,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          openIssues: repo.open_issues_count,
          isPrivate: repo.private,
          isArchived: repo.archived ?? false,
          defaultBranch: repo.default_branch ?? "main",
          htmlUrl: repo.html_url,
          pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
        });
        stats.reposProcessed++;

        const owner = repo.full_name.split("/")[0];
        const repoName = repo.name;
        const defaultBranch = repo.default_branch ?? "main";

        // 2. Fetch up to 100 recent commits on default branch
        try {
          const commitsRes = await octokit.repos.listCommits({
            owner,
            repo: repoName,
            sha: defaultBranch,
            per_page: 100,
          });
          checkRateLimit(commitsRes.headers as Record<string, unknown>);

          for (const c of commitsRes.data) {
            const committedAt = c.commit.author?.date
              ? new Date(c.commit.author.date)
              : c.commit.committer?.date
                ? new Date(c.commit.committer.date)
                : new Date();

            await upsertCommit({
              sha: c.sha,
              repoId,
              message: c.commit.message,
              authorName: c.commit.author?.name ?? "Unknown",
              authorLogin: c.author?.login ?? null,
              authorAvatar: c.author?.avatar_url ?? null,
              url: c.html_url,
              branch: defaultBranch,
              committedAt,
            });
            stats.commitsProcessed++;
          }
        } catch (commitErr) {
          // Empty repo (no commits) can return 409 Conflict
          const message = commitErr instanceof Error ? commitErr.message : String(commitErr);
          if (!message.includes("Git Repository is empty")) {
            stats.errors.push({ repo: repo.full_name, error: `Commits: ${message}` });
          }
        }

        // 3. Fetch PRs (open + up to 30 closed)
        try {
          const [openPrsRes, closedPrsRes] = await Promise.all([
            octokit.pulls.list({
              owner,
              repo: repoName,
              state: "open",
              per_page: 100,
            }),
            octokit.pulls.list({
              owner,
              repo: repoName,
              state: "closed",
              per_page: 30,
              sort: "updated",
              direction: "desc",
            }),
          ]);

          const allPrs = [...openPrsRes.data, ...closedPrsRes.data];
          for (const pr of allPrs) {
            await upsertPullRequest({
              id: BigInt(pr.id),
              repoId,
              number: pr.number,
              title: pr.title,
              state: pr.state,
              merged: !!pr.merged_at,
              author: pr.user?.login ?? "unknown",
              url: pr.html_url,
              createdAt: new Date(pr.created_at),
              updatedAt: new Date(pr.updated_at),
              closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
            });
            stats.prsProcessed++;
          }
        } catch (prErr) {
          stats.errors.push({
            repo: repo.full_name,
            error: `PRs: ${prErr instanceof Error ? prErr.message : String(prErr)}`,
          });
        }

        // 4. Fetch Issues (open + up to 30 closed, excluding PRs)
        try {
          const [openIssuesRes, closedIssuesRes] = await Promise.all([
            octokit.issues.listForRepo({
              owner,
              repo: repoName,
              state: "open",
              per_page: 100,
            }),
            octokit.issues.listForRepo({
              owner,
              repo: repoName,
              state: "closed",
              per_page: 30,
              sort: "updated",
              direction: "desc",
            }),
          ]);

          const allIssues = [...openIssuesRes.data, ...closedIssuesRes.data];
          for (const issue of allIssues) {
            // In GitHub API, PRs also appear in issues list. Filter them out:
            if (issue.pull_request) {
              continue;
            }

            const labelNames = (issue.labels ?? []).map((l) =>
              typeof l === "string" ? l : (l.name ?? ""),
            );

            await upsertIssue({
              id: BigInt(issue.id),
              repoId,
              number: issue.number,
              title: issue.title,
              state: issue.state,
              author: issue.user?.login ?? "unknown",
              labels: JSON.stringify(labelNames),
              url: issue.html_url,
              createdAt: new Date(issue.created_at),
              updatedAt: new Date(issue.updated_at),
              closedAt: issue.closed_at ? new Date(issue.closed_at) : null,
            });
            stats.issuesProcessed++;
          }
        } catch (issueErr) {
          stats.errors.push({
            repo: repo.full_name,
            error: `Issues: ${issueErr instanceof Error ? issueErr.message : String(issueErr)}`,
          });
        }

        // 5. Fetch up to 20 workflow runs
        try {
          const workflowsRes = await octokit.actions.listWorkflowRunsForRepo({
            owner,
            repo: repoName,
            per_page: 20,
          });

          for (const run of workflowsRes.data.workflow_runs) {
            await upsertWorkflowRun({
              id: BigInt(run.id),
              repoId,
              name: run.name ?? "Workflow",
              branch: run.head_branch,
              status: run.status ?? "completed",
              conclusion: run.conclusion,
              url: run.html_url,
              startedAt: run.run_started_at ? new Date(run.run_started_at) : null,
              updatedAt: new Date(run.updated_at),
            });
            stats.workflowsProcessed++;
          }
        } catch {
          // Actions may not be enabled or configured for this repo; safe to skip silently
        }
      } catch (repoErr) {
        // Log repo failure and continue to next repo without aborting
        const errMessage = repoErr instanceof Error ? repoErr.message : String(repoErr);
        console.error(`Error syncing repository ${repo.full_name}:`, errMessage);
        stats.errors.push({ repo: repo.full_name, error: errMessage });
      }
    }

    const endTime = new Date();
    stats.endTime = endTime.toISOString();
    stats.durationMs = endTime.getTime() - startTime.getTime();

    // Save final status
    await setSyncState("sync_status", "completed");
    await setSyncState("last_sync_time", endTime.toISOString());
    await setSyncState("sync_stats", JSON.stringify(stats));

    // Broadcast sync completed to SSE
    broadcast("repo.updated", { sync: "completed", stats });

    return stats;
  } catch (fatalErr) {
    const message = fatalErr instanceof Error ? fatalErr.message : String(fatalErr);
    await setSyncState("sync_status", "failed");
    await setSyncState("sync_error", message);
    throw fatalErr;
  }
}
