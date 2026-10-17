import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { syncAll } from "@/lib/github/sync";
import { prisma, getSyncState } from "@/lib/db";
import { Octokit } from "@octokit/rest";

describe("Backfill & Sync Logic", () => {
  const syncRepoId1 = BigInt(555501);
  const syncRepoId2 = BigInt(555502);

  beforeAll(async () => {
    await prisma.commit.deleteMany({ where: { repoId: { in: [syncRepoId1, syncRepoId2] } } });
    await prisma.pullRequest.deleteMany({ where: { repoId: { in: [syncRepoId1, syncRepoId2] } } });
    await prisma.issue.deleteMany({ where: { repoId: { in: [syncRepoId1, syncRepoId2] } } });
    await prisma.workflowRun.deleteMany({ where: { repoId: { in: [syncRepoId1, syncRepoId2] } } });
    await prisma.repository.deleteMany({ where: { id: { in: [syncRepoId1, syncRepoId2] } } });
  });

  afterAll(async () => {
    await prisma.commit.deleteMany({ where: { repoId: { in: [syncRepoId1, syncRepoId2] } } });
    await prisma.pullRequest.deleteMany({ where: { repoId: { in: [syncRepoId1, syncRepoId2] } } });
    await prisma.issue.deleteMany({ where: { repoId: { in: [syncRepoId1, syncRepoId2] } } });
    await prisma.workflowRun.deleteMany({ where: { repoId: { in: [syncRepoId1, syncRepoId2] } } });
    await prisma.repository.deleteMany({ where: { id: { in: [syncRepoId1, syncRepoId2] } } });
  });

  function createMockOctokit(options: { failSecondRepoCommits?: boolean } = {}) {
    return {
      paginate: async () => {
        return [
          {
            id: Number(syncRepoId1),
            name: "repo-alpha",
            full_name: "testuser/repo-alpha",
            description: "First test repo",
            language: "TypeScript",
            stargazers_count: 10,
            forks_count: 2,
            open_issues_count: 1,
            private: false,
            archived: false,
            default_branch: "main",
            html_url: "https://github.com/testuser/repo-alpha",
            pushed_at: "2026-01-01T00:00:00Z",
          },
          {
            id: Number(syncRepoId2),
            name: "repo-beta",
            full_name: "testuser/repo-beta",
            description: "Second test repo",
            language: "Go",
            stargazers_count: 3,
            forks_count: 0,
            open_issues_count: 0,
            private: true,
            archived: false,
            default_branch: "master",
            html_url: "https://github.com/testuser/repo-beta",
            pushed_at: "2026-01-02T00:00:00Z",
          },
        ];
      },
      repos: {
        listForAuthenticatedUser: () => {},
        listForUser: () => {},
        listCommits: async ({ repo }: { repo: string }) => {
          if (repo === "repo-beta" && options.failSecondRepoCommits) {
            throw new Error("Git Repository is empty");
          }
          return {
            headers: { "x-ratelimit-remaining": "4900" },
            data: [
              {
                sha: `commit-${repo}-1`,
                commit: {
                  message: `Initial commit on ${repo}`,
                  author: { name: "Author", date: "2026-01-01T12:00:00Z" },
                },
                author: { login: "authorlogin", avatar_url: "https://avatar.url" },
                html_url: `https://github.com/testuser/${repo}/commit/1`,
              },
            ],
          };
        },
      },
      pulls: {
        list: async ({ repo, state }: { repo: string; state: string }) => {
          if (state === "open") {
            return {
              data: [
                {
                  id: 1000 + (repo === "repo-alpha" ? 1 : 2),
                  number: 1,
                  title: `PR 1 on ${repo}`,
                  state: "open",
                  merged_at: null,
                  user: { login: "pr-author" },
                  html_url: `https://github.com/testuser/${repo}/pull/1`,
                  created_at: "2026-01-02T00:00:00Z",
                  updated_at: "2026-01-02T00:00:00Z",
                  closed_at: null,
                },
              ],
            };
          }
          return { data: [] };
        },
      },
      issues: {
        listForRepo: async ({ repo, state }: { repo: string; state: string }) => {
          if (state === "open") {
            return {
              data: [
                {
                  id: 2000 + (repo === "repo-alpha" ? 1 : 2),
                  number: 10,
                  title: `Issue 10 on ${repo}`,
                  state: "open",
                  user: { login: "issue-reporter" },
                  labels: [{ name: "enhancement" }],
                  html_url: `https://github.com/testuser/${repo}/issues/10`,
                  created_at: "2026-01-03T00:00:00Z",
                  updated_at: "2026-01-03T00:00:00Z",
                  closed_at: null,
                  pull_request: undefined,
                },
              ],
            };
          }
          return { data: [] };
        },
      },
      actions: {
        listWorkflowRunsForRepo: async ({ repo }: { repo: string }) => {
          return {
            data: {
              workflow_runs: [
                {
                  id: 3000 + (repo === "repo-alpha" ? 1 : 2),
                  name: "CI Pipeline",
                  head_branch: "main",
                  status: "completed",
                  conclusion: "success",
                  html_url: `https://github.com/testuser/${repo}/actions/runs/1`,
                  run_started_at: "2026-01-04T00:00:00Z",
                  updated_at: "2026-01-04T00:05:00Z",
                },
              ],
            },
          };
        },
      },
    } as unknown as Octokit;
  }

  it("should perform backfill and store repos, commits, PRs, issues, and workflow runs", async () => {
    const mockOctokit = createMockOctokit();
    const stats = await syncAll(mockOctokit);

    expect(stats.reposProcessed).toBe(2);
    expect(stats.commitsProcessed).toBe(2);
    expect(stats.prsProcessed).toBe(2);
    expect(stats.issuesProcessed).toBe(2);
    expect(stats.workflowsProcessed).toBe(2);
    expect(stats.errors).toHaveLength(0);

    // Verify DB
    const repo1 = await prisma.repository.findUnique({ where: { id: syncRepoId1 } });
    expect(repo1?.fullName).toBe("testuser/repo-alpha");

    const syncStatus = await getSyncState("sync_status");
    expect(syncStatus).toBe("completed");
  });

  it("should be idempotent when run multiple times", async () => {
    const mockOctokit = createMockOctokit();
    // Run second time
    const stats = await syncAll(mockOctokit);

    expect(stats.reposProcessed).toBe(2);
    // Ensure no duplicate repos were created
    const repos = await prisma.repository.findMany({
      where: { id: { in: [syncRepoId1, syncRepoId2] } },
    });
    expect(repos).toHaveLength(2);
  });

  it("should tolerate partial errors without aborting entire sync", async () => {
    const mockOctokit = createMockOctokit({ failSecondRepoCommits: true });
    const stats = await syncAll(mockOctokit);

    // Both repos should still be processed
    expect(stats.reposProcessed).toBe(2);
    const syncStatus = await getSyncState("sync_status");
    expect(syncStatus).toBe("completed");
  });
});
