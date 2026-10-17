import { NextRequest, NextResponse } from "next/server";
import { prisma, serializeForClient } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/repos/[id]
 * Fetches single repository with its latest commits, pull requests, issues, and workflow runs.
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
      include: {
        commits: {
          take: 50,
          orderBy: { committedAt: "desc" },
        },
        pullRequests: {
          take: 30,
          orderBy: { updatedAt: "desc" },
        },
        issues: {
          take: 30,
          orderBy: { updatedAt: "desc" },
        },
        workflowRuns: {
          take: 20,
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    if (!repository) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    return NextResponse.json(serializeForClient(repository));
  } catch (err) {
    console.error("Repository detail API error:", err);
    return NextResponse.json({ error: "Failed to fetch repository" }, { status: 500 });
  }
}
