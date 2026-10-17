import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { getOctokit } from "@/lib/github/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/repos/[id]/webhook
 * Checks if a webhook pointing to this dashboard is currently installed on GitHub for this repo.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const repoId = BigInt(id);

    const repository = await prisma.repository.findUnique({
      where: { id: repoId },
      select: { fullName: true, name: true },
    });

    if (!repository) {
      return NextResponse.json({ error: "Repositori tidak ditemukan" }, { status: 404 });
    }

    const [owner, repoName] = repository.fullName.split("/");
    const env = getEnv();
    const targetUrl = `${env.PUBLIC_BASE_URL}/api/webhook`;

    const octokit = getOctokit();
    const { data: webhooks } = await octokit.rest.repos.listWebhooks({
      owner,
      repo: repoName,
    });

    const existingHook = webhooks.find(
      (h) => h.config && "url" in h.config && h.config.url === targetUrl,
    );

    return NextResponse.json({
      isConfigured: !!existingHook,
      hookId: existingHook?.id ?? null,
      active: existingHook?.active ?? false,
      targetUrl,
      repoFullName: repository.fullName,
    });
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    const message = err instanceof Error ? err.message : String(err);
    if (status === 404 || status === 403) {
      return NextResponse.json(
        {
          isConfigured: false,
          error: "Token GitHub tidak memiliki izin untuk membaca webhook di repositori ini.",
        },
        { status: 200 },
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/repos/[id]/webhook
 * One-click automatic creation or update of GitHub webhook pointing to this dashboard.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const repoId = BigInt(id);

    const repository = await prisma.repository.findUnique({
      where: { id: repoId },
      select: { fullName: true, name: true },
    });

    if (!repository) {
      return NextResponse.json({ error: "Repositori tidak ditemukan" }, { status: 404 });
    }

    const [owner, repoName] = repository.fullName.split("/");
    const env = getEnv();
    const targetUrl = `${env.PUBLIC_BASE_URL}/api/webhook`;

    if (!env.GITHUB_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "GITHUB_WEBHOOK_SECRET belum dikonfigurasi di file .env" },
        { status: 400 },
      );
    }

    const octokit = getOctokit();

    // 1. Check existing webhooks on GitHub
    const { data: webhooks } = await octokit.rest.repos.listWebhooks({
      owner,
      repo: repoName,
    });

    const existingHook = webhooks.find(
      (h) => h.config && "url" in h.config && h.config.url === targetUrl,
    );

    const webhookEvents = [
      "push",
      "pull_request",
      "issues",
      "workflow_run",
      "repository",
      "create",
      "delete",
    ];

    let hookId: number;

    if (existingHook) {
      // 2a. Update existing webhook
      const res = await octokit.rest.repos.updateWebhook({
        owner,
        repo: repoName,
        hook_id: existingHook.id,
        config: {
          url: targetUrl,
          content_type: "json",
          secret: env.GITHUB_WEBHOOK_SECRET,
          insecure_ssl: "0",
        },
        events: webhookEvents,
        active: true,
      });
      hookId = res.data.id;
    } else {
      // 2b. Create new webhook
      const res = await octokit.rest.repos.createWebhook({
        owner,
        repo: repoName,
        name: "web",
        active: true,
        events: webhookEvents,
        config: {
          url: targetUrl,
          content_type: "json",
          secret: env.GITHUB_WEBHOOK_SECRET,
          insecure_ssl: "0",
        },
      });
      hookId = res.data.id;
    }

    // 3. Trigger ping to verify connectivity
    await octokit.rest.repos
      .pingWebhook({
        owner,
        repo: repoName,
        hook_id: hookId,
      })
      .catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Webhook untuk "${repository.fullName}" berhasil dipasang ke GitHub!`,
      hookId,
      targetUrl,
      updated: !!existingHook,
    });
  } catch (err: unknown) {
    const errorObj = err as { status?: number; message?: string };
    console.error("Auto webhook setup error:", err);

    if (errorObj?.status === 404) {
      return NextResponse.json(
        {
          error:
            "Repositori tidak ditemukan di GitHub atau token tidak memiliki akses ke repositori ini.",
        },
        { status: 404 },
      );
    }

    if (errorObj?.status === 403) {
      return NextResponse.json(
        {
          error:
            "Akses ditolak (403): GitHub Personal Access Token (PAT) Anda memerlukan permission 'admin:repo_hook' atau 'repo' untuk mengelola webhook.",
        },
        { status: 403 },
      );
    }

    const message = errorObj?.message || "Gagal memasang webhook otomatis ke GitHub";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
