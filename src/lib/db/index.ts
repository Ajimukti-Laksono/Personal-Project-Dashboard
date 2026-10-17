import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

declare global {
  var __prisma: PrismaClient | undefined;
  var __prismaWalEnabled: boolean | undefined;
}

/**
 * Creates PrismaClient using Turso LibSQL adapter in production/cloud if configured,
 * or standard local SQLite if running locally without Turso.
 */
function createPrismaClient(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN?.trim();

  if (tursoUrl) {
    const adapter = new PrismaLibSQL({
      url: tursoUrl,
      authToken: tursoAuthToken,
    });
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

/**
 * Global singleton PrismaClient to prevent connection leaks during Next.js hot reload.
 */
export const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

/**
 * Activates WAL (Write-Ahead Logging) mode and foreign keys for local SQLite.
 * In Turso cloud mode, this is skipped as Turso manages concurrency automatically.
 */
export async function enableWalMode(client: PrismaClient = prisma): Promise<void> {
  if (globalThis.__prismaWalEnabled || process.env.TURSO_DATABASE_URL) {
    return;
  }

  try {
    // Execute PRAGMA statements for SQLite optimization
    await client.$queryRawUnsafe("PRAGMA journal_mode = WAL;");
    await client.$queryRawUnsafe("PRAGMA synchronous = NORMAL;");
    await client.$queryRawUnsafe("PRAGMA foreign_keys = ON;");
    globalThis.__prismaWalEnabled = true;
  } catch (error) {
    console.error("Failed to enable WAL mode on SQLite:", error);
  }
}

// Automatically trigger WAL mode activation on module import
enableWalMode().catch((err) => {
  console.error("Auto WAL mode activation failed:", err);
});

// ============================================================================
// Database Upsert Helpers (Idempotent Writes)
// ============================================================================

export interface RepositoryData {
  id: bigint;
  name: string;
  fullName: string;
  description?: string | null;
  language?: string | null;
  stars?: number;
  forks?: number;
  openIssues?: number;
  isPrivate?: boolean;
  isArchived?: boolean;
  isPinned?: boolean;
  defaultBranch?: string;
  htmlUrl: string;
  pushedAt?: Date | null;
}

export async function upsertRepository(data: RepositoryData) {
  return prisma.repository.upsert({
    where: { id: data.id },
    create: {
      id: data.id,
      name: data.name,
      fullName: data.fullName,
      description: data.description ?? null,
      language: data.language ?? null,
      stars: data.stars ?? 0,
      forks: data.forks ?? 0,
      openIssues: data.openIssues ?? 0,
      isPrivate: data.isPrivate ?? false,
      isArchived: data.isArchived ?? false,
      isPinned: data.isPinned ?? false,
      defaultBranch: data.defaultBranch ?? "main",
      htmlUrl: data.htmlUrl,
      pushedAt: data.pushedAt ?? null,
    },
    update: {
      name: data.name,
      fullName: data.fullName,
      description: data.description !== undefined ? data.description : undefined,
      language: data.language !== undefined ? data.language : undefined,
      stars: data.stars !== undefined ? data.stars : undefined,
      forks: data.forks !== undefined ? data.forks : undefined,
      openIssues: data.openIssues !== undefined ? data.openIssues : undefined,
      isPrivate: data.isPrivate !== undefined ? data.isPrivate : undefined,
      isArchived: data.isArchived !== undefined ? data.isArchived : undefined,
      isPinned: data.isPinned !== undefined ? data.isPinned : undefined,
      defaultBranch: data.defaultBranch !== undefined ? data.defaultBranch : undefined,
      htmlUrl: data.htmlUrl,
      pushedAt: data.pushedAt !== undefined ? data.pushedAt : undefined,
    },
  });
}

/**
 * Toggles or sets the pinned status of a repository.
 */
export async function toggleRepoPin(id: bigint, explicitPinned?: boolean) {
  const repo = await prisma.repository.findUnique({
    where: { id },
    select: { isPinned: true },
  });

  if (!repo) {
    throw new Error(`Repository with ID ${id} not found`);
  }

  const nextPinned = explicitPinned !== undefined ? explicitPinned : !repo.isPinned;

  return prisma.repository.update({
    where: { id },
    data: { isPinned: nextPinned },
  });
}

export interface CommitData {
  sha: string;
  repoId: bigint;
  message: string;
  authorName: string;
  authorLogin?: string | null;
  authorAvatar?: string | null;
  url: string;
  branch?: string | null;
  committedAt: Date;
}

export async function upsertCommit(data: CommitData) {
  return prisma.commit.upsert({
    where: {
      sha_repoId: {
        sha: data.sha,
        repoId: data.repoId,
      },
    },
    create: {
      sha: data.sha,
      repoId: data.repoId,
      message: data.message,
      authorName: data.authorName,
      authorLogin: data.authorLogin ?? null,
      authorAvatar: data.authorAvatar ?? null,
      url: data.url,
      branch: data.branch ?? null,
      committedAt: data.committedAt,
    },
    update: {
      message: data.message,
      authorName: data.authorName,
      authorLogin: data.authorLogin ?? null,
      authorAvatar: data.authorAvatar ?? null,
      url: data.url,
      branch: data.branch ?? null,
      committedAt: data.committedAt,
    },
  });
}

export interface PullRequestData {
  id: bigint;
  repoId: bigint;
  number: number;
  title: string;
  state: string;
  merged?: boolean;
  author: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date | null;
}

export async function upsertPullRequest(data: PullRequestData) {
  return prisma.pullRequest.upsert({
    where: {
      repoId_number: {
        repoId: data.repoId,
        number: data.number,
      },
    },
    create: {
      id: data.id,
      repoId: data.repoId,
      number: data.number,
      title: data.title,
      state: data.state,
      merged: data.merged ?? false,
      author: data.author,
      url: data.url,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      closedAt: data.closedAt ?? null,
    },
    update: {
      id: data.id,
      title: data.title,
      state: data.state,
      merged: data.merged !== undefined ? data.merged : undefined,
      author: data.author,
      url: data.url,
      updatedAt: data.updatedAt,
      closedAt: data.closedAt !== undefined ? data.closedAt : undefined,
    },
  });
}

export interface IssueData {
  id: bigint;
  repoId: bigint;
  number: number;
  title: string;
  state: string;
  author: string;
  labels?: string; // JSON string
  url: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date | null;
}

export async function upsertIssue(data: IssueData) {
  return prisma.issue.upsert({
    where: {
      repoId_number: {
        repoId: data.repoId,
        number: data.number,
      },
    },
    create: {
      id: data.id,
      repoId: data.repoId,
      number: data.number,
      title: data.title,
      state: data.state,
      author: data.author,
      labels: data.labels ?? "[]",
      url: data.url,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      closedAt: data.closedAt ?? null,
    },
    update: {
      id: data.id,
      title: data.title,
      state: data.state,
      author: data.author,
      labels: data.labels !== undefined ? data.labels : undefined,
      url: data.url,
      updatedAt: data.updatedAt,
      closedAt: data.closedAt !== undefined ? data.closedAt : undefined,
    },
  });
}

export interface WorkflowRunData {
  id: bigint;
  repoId: bigint;
  name: string;
  branch?: string | null;
  status: string;
  conclusion?: string | null;
  url: string;
  startedAt?: Date | null;
  updatedAt: Date;
}

export async function upsertWorkflowRun(data: WorkflowRunData) {
  return prisma.workflowRun.upsert({
    where: { id: data.id },
    create: {
      id: data.id,
      repoId: data.repoId,
      name: data.name,
      branch: data.branch ?? null,
      status: data.status,
      conclusion: data.conclusion ?? null,
      url: data.url,
      startedAt: data.startedAt ?? null,
      updatedAt: data.updatedAt,
    },
    update: {
      name: data.name,
      branch: data.branch ?? null,
      status: data.status,
      conclusion: data.conclusion ?? null,
      url: data.url,
      startedAt: data.startedAt ?? null,
      updatedAt: data.updatedAt,
    },
  });
}

// ============================================================================
// Webhook Delivery Idempotency
// ============================================================================

export async function isDeliveryProcessed(deliveryId: string): Promise<boolean> {
  const existing = await prisma.webhookDelivery.findUnique({
    where: { deliveryId },
  });
  return !!existing;
}

export async function recordWebhookDelivery(deliveryId: string, event: string) {
  return prisma.webhookDelivery.upsert({
    where: { deliveryId },
    create: { deliveryId, event },
    update: {},
  });
}

// ============================================================================
// Sync State
// ============================================================================

export async function getSyncState(key: string): Promise<string | null> {
  const state = await prisma.syncState.findUnique({
    where: { key },
  });
  return state ? state.value : null;
}

export async function setSyncState(key: string, value: string) {
  return prisma.syncState.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

// ============================================================================
// JSON / BigInt Serialization Helpers
// ============================================================================

/**
 * Recursively converts BigInt fields to String so they can be JSON-serialized
 * safely without throwing errors.
 */
export function serializeForClient<T>(obj: T): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "bigint") {
    return obj.toString();
  }

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeForClient);
  }

  if (typeof obj === "object") {
    const serialized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      serialized[key] = serializeForClient(val);
    }
    return serialized;
  }

  return obj;
}
