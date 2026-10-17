import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  prisma,
  enableWalMode,
  upsertRepository,
  upsertCommit,
  upsertPullRequest,
  upsertIssue,
  upsertWorkflowRun,
  isDeliveryProcessed,
  recordWebhookDelivery,
  getSyncState,
  setSyncState,
  serializeForClient,
} from "@/lib/db";

describe("Database & Prisma Operations", () => {
  const testRepoId = BigInt(99999901);

  beforeAll(async () => {
    await enableWalMode();
    // Clean up any test records
    await prisma.commit.deleteMany({ where: { repoId: testRepoId } });
    await prisma.pullRequest.deleteMany({ where: { repoId: testRepoId } });
    await prisma.issue.deleteMany({ where: { repoId: testRepoId } });
    await prisma.workflowRun.deleteMany({ where: { repoId: testRepoId } });
    await prisma.repository.deleteMany({ where: { id: testRepoId } });
    await prisma.webhookDelivery.deleteMany({
      where: { deliveryId: { in: ["test-del-1", "test-del-2"] } },
    });
    await prisma.syncState.deleteMany({
      where: { key: { in: ["test-sync-key"] } },
    });
  });

  afterAll(async () => {
    // Clean up
    await prisma.commit.deleteMany({ where: { repoId: testRepoId } });
    await prisma.pullRequest.deleteMany({ where: { repoId: testRepoId } });
    await prisma.issue.deleteMany({ where: { repoId: testRepoId } });
    await prisma.workflowRun.deleteMany({ where: { repoId: testRepoId } });
    await prisma.repository.deleteMany({ where: { id: testRepoId } });
    await prisma.$disconnect();
  });

  it("should enable WAL mode on SQLite", async () => {
    const result = (await prisma.$queryRawUnsafe("PRAGMA journal_mode;")) as Array<{
      journal_mode: string;
    }>;
    expect(result[0].journal_mode.toLowerCase()).toBe("wal");
  });

  it("should upsert a Repository idempotently", async () => {
    const repoData = {
      id: testRepoId,
      name: "test-repo",
      fullName: "testuser/test-repo",
      description: "Initial description",
      language: "TypeScript",
      stars: 5,
      forks: 1,
      openIssues: 2,
      isPrivate: false,
      isArchived: false,
      defaultBranch: "main",
      htmlUrl: "https://github.com/testuser/test-repo",
      pushedAt: new Date("2026-01-01T00:00:00Z"),
    };

    // Insert
    const repo1 = await upsertRepository(repoData);
    expect(repo1.id).toBe(testRepoId);
    expect(repo1.description).toBe("Initial description");

    // Update with changed description and stars
    const repo2 = await upsertRepository({
      ...repoData,
      description: "Updated description",
      stars: 10,
    });
    expect(repo2.id).toBe(testRepoId);
    expect(repo2.description).toBe("Updated description");
    expect(repo2.stars).toBe(10);

    // Verify only 1 repo exists
    const count = await prisma.repository.count({ where: { id: testRepoId } });
    expect(count).toBe(1);
  });

  it("should upsert a Commit idempotently without duplicating", async () => {
    const commitData = {
      sha: "abc1234567890abcdef",
      repoId: testRepoId,
      message: "feat: initial commit",
      authorName: "Test User",
      authorLogin: "testuser",
      authorAvatar: "https://avatar.url",
      url: "https://github.com/testuser/test-repo/commit/abc1234567890abcdef",
      branch: "main",
      committedAt: new Date("2026-01-01T12:00:00Z"),
    };

    // First write
    await upsertCommit(commitData);
    // Second write (same sha and repoId) with amended message
    await upsertCommit({
      ...commitData,
      message: "feat: initial commit (amended)",
    });

    const commits = await prisma.commit.findMany({
      where: { repoId: testRepoId, sha: commitData.sha },
    });
    expect(commits).toHaveLength(1);
    expect(commits[0].message).toBe("feat: initial commit (amended)");
  });

  it("should upsert a PullRequest idempotently", async () => {
    const prData = {
      id: BigInt(888801),
      repoId: testRepoId,
      number: 1,
      title: "Add feature X",
      state: "open",
      merged: false,
      author: "contributor",
      url: "https://github.com/testuser/test-repo/pull/1",
      createdAt: new Date("2026-01-02T10:00:00Z"),
      updatedAt: new Date("2026-01-02T10:00:00Z"),
    };

    await upsertPullRequest(prData);
    // Update to merged
    await upsertPullRequest({
      ...prData,
      state: "closed",
      merged: true,
      closedAt: new Date("2026-01-02T12:00:00Z"),
      updatedAt: new Date("2026-01-02T12:00:00Z"),
    });

    const prs = await prisma.pullRequest.findMany({
      where: { repoId: testRepoId, number: 1 },
    });
    expect(prs).toHaveLength(1);
    expect(prs[0].state).toBe("closed");
    expect(prs[0].merged).toBe(true);
  });

  it("should upsert an Issue idempotently", async () => {
    const issueData = {
      id: BigInt(777701),
      repoId: testRepoId,
      number: 1,
      title: "Bug in component",
      state: "open",
      author: "reporter",
      labels: JSON.stringify(["bug", "high-priority"]),
      url: "https://github.com/testuser/test-repo/issues/1",
      createdAt: new Date("2026-01-03T10:00:00Z"),
      updatedAt: new Date("2026-01-03T10:00:00Z"),
    };

    await upsertIssue(issueData);
    await upsertIssue({
      ...issueData,
      title: "Bug in component (resolved)",
      state: "closed",
      closedAt: new Date("2026-01-03T11:00:00Z"),
      updatedAt: new Date("2026-01-03T11:00:00Z"),
    });

    const issues = await prisma.issue.findMany({
      where: { repoId: testRepoId, number: 1 },
    });
    expect(issues).toHaveLength(1);
    expect(issues[0].title).toBe("Bug in component (resolved)");
    expect(issues[0].state).toBe("closed");
  });

  it("should upsert a WorkflowRun idempotently", async () => {
    const runData = {
      id: BigInt(666601),
      repoId: testRepoId,
      name: "CI / Test",
      branch: "main",
      status: "in_progress",
      conclusion: null,
      url: "https://github.com/testuser/test-repo/actions/runs/666601",
      startedAt: new Date("2026-01-04T10:00:00Z"),
      updatedAt: new Date("2026-01-04T10:00:00Z"),
    };

    await upsertWorkflowRun(runData);
    await upsertWorkflowRun({
      ...runData,
      status: "completed",
      conclusion: "success",
      updatedAt: new Date("2026-01-04T10:05:00Z"),
    });

    const runs = await prisma.workflowRun.findMany({
      where: { id: BigInt(666601) },
    });
    expect(runs).toHaveLength(1);
    expect(runs[0].status).toBe("completed");
    expect(runs[0].conclusion).toBe("success");
  });

  it("should handle WebhookDelivery idempotency correctly", async () => {
    const deliveryId = "test-del-1";
    expect(await isDeliveryProcessed(deliveryId)).toBe(false);

    await recordWebhookDelivery(deliveryId, "push");
    expect(await isDeliveryProcessed(deliveryId)).toBe(true);

    // Recording again should not fail
    await recordWebhookDelivery(deliveryId, "push");
    expect(await isDeliveryProcessed(deliveryId)).toBe(true);
  });

  it("should handle SyncState get and set correctly", async () => {
    const key = "test-sync-key";
    expect(await getSyncState(key)).toBeNull();

    await setSyncState(key, "completed");
    expect(await getSyncState(key)).toBe("completed");

    await setSyncState(key, "running");
    expect(await getSyncState(key)).toBe("running");
  });

  it("should serialize BigInt and Date correctly for client", () => {
    const data = {
      id: BigInt(123456789012345),
      name: "my-repo",
      date: new Date("2026-01-01T00:00:00.000Z"),
      nested: {
        otherId: BigInt(987654321),
      },
      list: [BigInt(1), BigInt(2)],
    };

    const serialized = serializeForClient(data) as {
      id: string;
      name: string;
      date: string;
      nested: { otherId: string };
      list: string[];
    };

    expect(serialized.id).toBe("123456789012345");
    expect(serialized.date).toBe("2026-01-01T00:00:00.000Z");
    expect(serialized.nested.otherId).toBe("987654321");
    expect(serialized.list).toEqual(["1", "2"]);

    // JSON.stringify should not throw
    expect(() => JSON.stringify(serialized)).not.toThrow();
  });
});
