import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { verifyWebhookSignature, signWebhookPayload } from "@/lib/github/verify";
import { processWebhookEvent } from "@/lib/github/webhook-handler";
import { realtimeEmitter, RealtimeEvent } from "@/lib/realtime";
import { prisma } from "@/lib/db";

describe("Webhook Signature Verification", () => {
  const secret = "test_webhook_secret_key_123456";
  const payload = JSON.stringify({ action: "test", repository: { name: "test-repo" } });

  it("should verify valid signature", () => {
    const validSignature = signWebhookPayload(payload, secret);
    expect(verifyWebhookSignature(payload, validSignature, secret)).toBe(true);
  });

  it("should reject invalid signature", () => {
    const invalidSignature =
      "sha256=0000000000000000000000000000000000000000000000000000000000000000";
    expect(verifyWebhookSignature(payload, invalidSignature, secret)).toBe(false);
  });

  it("should reject missing or empty signature header", () => {
    expect(verifyWebhookSignature(payload, null, secret)).toBe(false);
    expect(verifyWebhookSignature(payload, undefined, secret)).toBe(false);
    expect(verifyWebhookSignature(payload, "", secret)).toBe(false);
  });

  it("should reject signature when payload body is modified", () => {
    const validSignature = signWebhookPayload(payload, secret);
    const modifiedPayload = payload + " ";
    expect(verifyWebhookSignature(modifiedPayload, validSignature, secret)).toBe(false);
  });

  it("should reject malformed signature header prefix", () => {
    const validSignature = signWebhookPayload(payload, secret);
    const malformed = validSignature.replace("sha256=", "sha1=");
    expect(verifyWebhookSignature(payload, malformed, secret)).toBe(false);
  });
});

describe("Webhook Event Handlers & Idempotency", () => {
  const testRepoId = BigInt(123456789);

  beforeAll(async () => {
    await prisma.commit.deleteMany({ where: { repoId: testRepoId } });
    await prisma.pullRequest.deleteMany({ where: { repoId: testRepoId } });
    await prisma.issue.deleteMany({ where: { repoId: testRepoId } });
    await prisma.workflowRun.deleteMany({ where: { repoId: testRepoId } });
    await prisma.repository.deleteMany({ where: { id: testRepoId } });
  });

  afterAll(async () => {
    await prisma.commit.deleteMany({ where: { repoId: testRepoId } });
    await prisma.pullRequest.deleteMany({ where: { repoId: testRepoId } });
    await prisma.issue.deleteMany({ where: { repoId: testRepoId } });
    await prisma.workflowRun.deleteMany({ where: { repoId: testRepoId } });
    await prisma.repository.deleteMany({ where: { id: testRepoId } });
    await prisma.webhookDelivery.deleteMany({
      where: {
        deliveryId: { in: ["del-push-1", "del-pr-1", "del-issue-1", "del-wf-1", "del-ping-1"] },
      },
    });
  });

  it("should handle 'ping' event successfully", async () => {
    const result = await processWebhookEvent("ping", "del-ping-1", { zen: "Design for failure." });
    expect(result.status).toBe(200);
    expect(result.message).toBe("Pong");
  });

  it("should handle 'push' event and broadcast commit.new", async () => {
    const broadcastEvents: RealtimeEvent[] = [];
    const listener = (event: RealtimeEvent) => {
      broadcastEvents.push(event);
    };
    realtimeEmitter.on("event", listener);

    const pushPayload = {
      ref: "refs/heads/main",
      before: "0000000000000000000000000000000000000000",
      after: "1111111111111111111111111111111111111111",
      repository: {
        id: Number(testRepoId),
        name: "test-webhook-repo",
        full_name: "testuser/test-webhook-repo",
        html_url: "https://github.com/testuser/test-webhook-repo",
        pushed_at: "2026-01-10T10:00:00Z",
      },
      commits: [
        {
          id: "1111111111111111111111111111111111111111",
          message: "feat: webhook support",
          timestamp: "2026-01-10T10:00:00Z",
          url: "https://github.com/testuser/test-webhook-repo/commit/111111",
          author: {
            name: "John Doe",
            username: "johndoe",
          },
        },
      ],
      pusher: { name: "johndoe" },
    };

    const result = await processWebhookEvent("push", "del-push-1", pushPayload);
    expect(result.status).toBe(200);

    // Verify commit was saved
    const commit = await prisma.commit.findUnique({
      where: {
        sha_repoId: {
          sha: "1111111111111111111111111111111111111111",
          repoId: testRepoId,
        },
      },
    });
    expect(commit).not.toBeNull();
    expect(commit?.message).toBe("feat: webhook support");

    // Verify broadcast was triggered
    const commitEvent = broadcastEvents.find((e) => e.type === "commit.new");
    expect(commitEvent).toBeDefined();

    realtimeEmitter.off("event", listener);
  });

  it("should be idempotent: duplicate delivery is not reprocessed", async () => {
    // Send same push delivery id again
    const result = await processWebhookEvent("push", "del-push-1", {});
    expect(result.status).toBe(200);
    expect(result.duplicate).toBe(true);
  });

  it("should handle 'pull_request' event and broadcast pr.updated", async () => {
    const broadcastEvents: RealtimeEvent[] = [];
    const listener = (event: RealtimeEvent) => {
      broadcastEvents.push(event);
    };
    realtimeEmitter.on("event", listener);

    const prPayload = {
      action: "opened",
      number: 42,
      pull_request: {
        id: 994201,
        number: 42,
        title: "Support dark mode",
        state: "open",
        merged: false,
        user: { login: "designer" },
        html_url: "https://github.com/testuser/test-webhook-repo/pull/42",
        created_at: "2026-01-11T12:00:00Z",
        updated_at: "2026-01-11T12:00:00Z",
      },
      repository: {
        id: Number(testRepoId),
        name: "test-webhook-repo",
        full_name: "testuser/test-webhook-repo",
        html_url: "https://github.com/testuser/test-webhook-repo",
      },
    };

    const result = await processWebhookEvent("pull_request", "del-pr-1", prPayload);
    expect(result.status).toBe(200);

    const pr = await prisma.pullRequest.findUnique({
      where: {
        repoId_number: {
          repoId: testRepoId,
          number: 42,
        },
      },
    });
    expect(pr?.title).toBe("Support dark mode");

    const prEvent = broadcastEvents.find((e) => e.type === "pr.updated");
    expect(prEvent).toBeDefined();

    realtimeEmitter.off("event", listener);
  });

  it("should handle 'issues' event and broadcast issue.updated", async () => {
    const broadcastEvents: RealtimeEvent[] = [];
    const listener = (event: RealtimeEvent) => {
      broadcastEvents.push(event);
    };
    realtimeEmitter.on("event", listener);

    const issuePayload = {
      action: "opened",
      issue: {
        id: 884201,
        number: 10,
        title: "Navigation link broken",
        state: "open",
        user: { login: "tester" },
        labels: [{ name: "bug" }],
        html_url: "https://github.com/testuser/test-webhook-repo/issues/10",
        created_at: "2026-01-12T10:00:00Z",
        updated_at: "2026-01-12T10:00:00Z",
      },
      repository: {
        id: Number(testRepoId),
        name: "test-webhook-repo",
        full_name: "testuser/test-webhook-repo",
        html_url: "https://github.com/testuser/test-webhook-repo",
      },
    };

    const result = await processWebhookEvent("issues", "del-issue-1", issuePayload);
    expect(result.status).toBe(200);

    const issue = await prisma.issue.findUnique({
      where: {
        repoId_number: {
          repoId: testRepoId,
          number: 10,
        },
      },
    });
    expect(issue?.title).toBe("Navigation link broken");

    const issueEvent = broadcastEvents.find((e) => e.type === "issue.updated");
    expect(issueEvent).toBeDefined();

    realtimeEmitter.off("event", listener);
  });

  it("should handle 'workflow_run' event and broadcast workflow.updated", async () => {
    const broadcastEvents: RealtimeEvent[] = [];
    const listener = (event: RealtimeEvent) => {
      broadcastEvents.push(event);
    };
    realtimeEmitter.on("event", listener);

    const wfPayload = {
      action: "completed",
      workflow_run: {
        id: 774201,
        name: "Build and Test",
        head_branch: "main",
        status: "completed",
        conclusion: "success",
        html_url: "https://github.com/testuser/test-webhook-repo/actions/runs/774201",
        run_started_at: "2026-01-12T11:00:00Z",
        updated_at: "2026-01-12T11:05:00Z",
      },
      repository: {
        id: Number(testRepoId),
        name: "test-webhook-repo",
        full_name: "testuser/test-webhook-repo",
        html_url: "https://github.com/testuser/test-webhook-repo",
      },
    };

    const result = await processWebhookEvent("workflow_run", "del-wf-1", wfPayload);
    expect(result.status).toBe(200);

    const wf = await prisma.workflowRun.findUnique({
      where: { id: BigInt(774201) },
    });
    expect(wf?.conclusion).toBe("success");

    const wfEvent = broadcastEvents.find((e) => e.type === "workflow.updated");
    expect(wfEvent).toBeDefined();

    realtimeEmitter.off("event", listener);
  });

  it("should ignore unsupported events gracefully with 200", async () => {
    const result = await processWebhookEvent("star", "del-star-1", {});
    expect(result.status).toBe(200);
    expect(result.ignored).toBe(true);
  });

  it("should reject invalid schema with 400", async () => {
    const result = await processWebhookEvent("push", "del-invalid-1", { invalid: true });
    expect(result.status).toBe(400);
  });
});
