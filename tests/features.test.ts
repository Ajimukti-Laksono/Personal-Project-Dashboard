import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma, enableWalMode, upsertRepository, toggleRepoPin } from "@/lib/db";
import { POST as pinHandler } from "@/app/api/repos/[id]/pin/route";
import { POST as rerunHandler } from "@/app/api/repos/[id]/actions/[runId]/rerun/route";
import { NextRequest } from "next/server";

describe("New Features: Pinned Repos, Webhook Setup & Actions Re-run", () => {
  const testRepoId = BigInt(88880001);

  beforeAll(async () => {
    await enableWalMode();
    // Clean up
    await prisma.workflowRun.deleteMany({ where: { repoId: testRepoId } });
    await prisma.repository.deleteMany({ where: { id: testRepoId } });

    // Seed test repository
    await upsertRepository({
      id: testRepoId,
      name: "awesome-tool",
      fullName: "testuser/awesome-tool",
      description: "A test repository for pinned and action features",
      language: "TypeScript",
      stars: 12,
      forks: 3,
      htmlUrl: "https://github.com/testuser/awesome-tool",
    });
  });

  afterAll(async () => {
    await prisma.workflowRun.deleteMany({ where: { repoId: testRepoId } });
    await prisma.repository.deleteMany({ where: { id: testRepoId } });
  });

  it("should have isPinned false by default", async () => {
    const repo = await prisma.repository.findUnique({
      where: { id: testRepoId },
    });
    expect(repo?.isPinned).toBe(false);
  });

  it("should toggle isPinned to true using toggleRepoPin", async () => {
    const updated = await toggleRepoPin(testRepoId);
    expect(updated.isPinned).toBe(true);

    const recheck = await prisma.repository.findUnique({
      where: { id: testRepoId },
    });
    expect(recheck?.isPinned).toBe(true);
  });

  it("should toggle isPinned back to false", async () => {
    const updated = await toggleRepoPin(testRepoId);
    expect(updated.isPinned).toBe(false);
  });

  it("should allow explicitly setting isPinned", async () => {
    const updated = await toggleRepoPin(testRepoId, true);
    expect(updated.isPinned).toBe(true);

    const updatedAgain = await toggleRepoPin(testRepoId, true);
    expect(updatedAgain.isPinned).toBe(true);

    await toggleRepoPin(testRepoId, false);
  });

  it("should not overwrite isPinned during upsertRepository sync", async () => {
    // Pin it first
    await toggleRepoPin(testRepoId, true);

    // Run upsert without isPinned specified (like periodic GitHub sync does)
    await upsertRepository({
      id: testRepoId,
      name: "awesome-tool",
      fullName: "testuser/awesome-tool",
      description: "Updated description during sync",
      stars: 15,
      htmlUrl: "https://github.com/testuser/awesome-tool",
    });

    const repo = await prisma.repository.findUnique({
      where: { id: testRepoId },
    });
    expect(repo?.isPinned).toBe(true);
    expect(repo?.stars).toBe(15);
    expect(repo?.description).toBe("Updated description during sync");
  });

  it("should handle /api/repos/[id]/pin POST route handler", async () => {
    const req = new NextRequest("http://localhost:3000/api/repos/88880001/pin", {
      method: "POST",
      body: JSON.stringify({ isPinned: false }),
    });

    const res = await pinHandler(req, {
      params: Promise.resolve({ id: "88880001" }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.isPinned).toBe(false);
  });

  it("should validate invalid runId on /api/repos/[id]/actions/[runId]/rerun", async () => {
    const req = new NextRequest("http://localhost:3000/api/repos/88880001/actions/invalid-id/rerun", {
      method: "POST",
    });

    const res = await rerunHandler(req, {
      params: Promise.resolve({ id: "88880001", runId: "invalid-id" }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Format ID workflow run tidak valid");
  });

  it("should return 404 for unknown repository in rerun handler", async () => {
    const req = new NextRequest("http://localhost:3000/api/repos/999999999/actions/12345/rerun", {
      method: "POST",
    });

    const res = await rerunHandler(req, {
      params: Promise.resolve({ id: "999999999", runId: "12345" }),
    });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Repositori tidak ditemukan");
  });
});
