import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOctokit } from "@/lib/github/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/repos/[id]/actions/[runId]/rerun
 * Triggers a re-run of a specific GitHub Actions workflow run.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; runId: string }> },
): Promise<NextResponse> {
  try {
    const { id, runId } = await params;
    const repoId = BigInt(id);
    const parsedRunId = Number(runId);

    if (isNaN(parsedRunId)) {
      return NextResponse.json({ error: "Format ID workflow run tidak valid" }, { status: 400 });
    }

    const repository = await prisma.repository.findUnique({
      where: { id: repoId },
      select: { fullName: true, name: true },
    });

    if (!repository) {
      return NextResponse.json({ error: "Repositori tidak ditemukan" }, { status: 404 });
    }

    const [owner, repoName] = repository.fullName.split("/");
    const octokit = getOctokit();

    // Call GitHub REST API to re-run workflow
    await octokit.rest.actions.reRunWorkflow({
      owner,
      repo: repoName,
      run_id: parsedRunId,
    });

    // Optimistically update local database record
    await prisma.workflowRun.updateMany({
      where: { id: BigInt(runId) },
      data: {
        status: "in_progress",
        conclusion: null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Workflow run #${runId} pada "${repository.name}" berhasil dipicu ulang di GitHub!`,
      status: "in_progress",
    });
  } catch (err: unknown) {
    const errorObj = err as { status?: number; message?: string };
    console.error("Re-run workflow error:", err);

    if (errorObj?.status === 404) {
      return NextResponse.json(
        { error: "Workflow run tidak ditemukan di repositori GitHub ini." },
        { status: 404 },
      );
    }

    if (errorObj?.status === 403) {
      return NextResponse.json(
        {
          error:
            "Akses ditolak (403): GitHub Personal Access Token (PAT) Anda memerlukan permission 'actions:write' atau 'repo' untuk memicu ulang workflow.",
        },
        { status: 403 },
      );
    }

    if (errorObj?.status === 409) {
      return NextResponse.json(
        { error: "Workflow ini sedang berjalan atau belum bisa dipicu ulang (Conflict 409)." },
        { status: 409 },
      );
    }

    const message = errorObj?.message || "Gagal memicu ulang workflow run di GitHub";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
