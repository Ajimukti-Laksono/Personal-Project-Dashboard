import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { processWebhookEvent } from "@/lib/github/webhook-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/webhook/history
 * Returns metadata about the webhook configuration, recent deliveries, and diagnostic info.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const env = getEnv();

    const [totalDeliveries, recentDeliveries] = await Promise.all([
      prisma.webhookDelivery.count(),
      prisma.webhookDelivery.findMany({
        take: 20,
        orderBy: { receivedAt: "desc" },
      }),
    ]);

    const lastDelivery = recentDeliveries[0] ?? null;

    return NextResponse.json({
      webhookUrl: `${env.PUBLIC_BASE_URL}/api/webhook`,
      publicBaseUrl: env.PUBLIC_BASE_URL,
      githubUsername: env.GITHUB_USERNAME,
      totalDeliveries,
      recentDeliveries: recentDeliveries.map((d) => ({
        deliveryId: d.deliveryId,
        event: d.event,
        receivedAt: d.receivedAt.toISOString(),
      })),
      lastDeliveryAt: lastDelivery ? lastDelivery.receivedAt.toISOString() : null,
      tunnelCommand: `smee -u https://smee.io/your-channel -t ${env.PUBLIC_BASE_URL}/api/webhook`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Failed to fetch webhook history:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/webhook/history
 * Triggers a simulated push event to verify real-time SSE broadcast and database storage.
 */
export async function POST(): Promise<NextResponse> {
  try {
    const env = getEnv();
    const commitSha = `sim-${Math.random().toString(16).substring(2, 9)}${Date.now()}`;
    const deliveryId = `sim-delivery-${Date.now()}`;
    const now = new Date();

    const testPayload = {
      ref: "refs/heads/main",
      before: "0000000000000000000000000000000000000000",
      after: commitSha,
      created: false,
      deleted: false,
      forced: false,
      repository: {
        id: 987654321,
        name: "personal-project-dashboard",
        full_name: `${env.GITHUB_USERNAME}/personal-project-dashboard`,
        description: "Personal Project Dashboard dengan integrasi real-time GitHub",
        language: "TypeScript",
        stargazers_count: 15,
        forks_count: 4,
        open_issues_count: 0,
        private: false,
        archived: false,
        default_branch: "main",
        html_url: `https://github.com/${env.GITHUB_USERNAME}/personal-project-dashboard`,
        pushed_at: now.toISOString(),
      },
      commits: [
        {
          id: commitSha,
          message: `test: simulasi webhook real-time via dashboard UI (${now.toLocaleTimeString("id-ID")})`,
          timestamp: now.toISOString(),
          url: `https://github.com/${env.GITHUB_USERNAME}/personal-project-dashboard/commit/${commitSha}`,
          author: {
            name: env.GITHUB_USERNAME,
            email: `${env.GITHUB_USERNAME.toLowerCase()}@users.noreply.github.com`,
            username: env.GITHUB_USERNAME,
          },
        },
      ],
      pusher: {
        name: env.GITHUB_USERNAME,
        email: `${env.GITHUB_USERNAME.toLowerCase()}@users.noreply.github.com`,
      },
      sender: {
        login: env.GITHUB_USERNAME,
        avatar_url: `https://avatars.githubusercontent.com/${env.GITHUB_USERNAME}`,
      },
    };

    const result = await processWebhookEvent("push", deliveryId, testPayload);

    return NextResponse.json({
      success: true,
      message: "Simulasi webhook berhasil diproses dan disiarkan secara real-time!",
      deliveryId,
      commitSha,
      result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Simulation failed:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
