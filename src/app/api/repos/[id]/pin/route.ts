import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/repos/[id]/pin
 * Toggles or sets the isPinned boolean for the specified repository.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const repoId = BigInt(id);

    const body = await req.json().catch(() => ({}));
    const explicitPinned = typeof body?.isPinned === "boolean" ? body.isPinned : undefined;

    const currentRepo = await prisma.repository.findUnique({
      where: { id: repoId },
      select: { isPinned: true, name: true },
    });

    if (!currentRepo) {
      return NextResponse.json({ error: "Repositori tidak ditemukan" }, { status: 404 });
    }

    const nextPinned = explicitPinned !== undefined ? explicitPinned : !currentRepo.isPinned;

    const updated = await prisma.repository.update({
      where: { id: repoId },
      data: { isPinned: nextPinned },
      select: { id: true, name: true, isPinned: true },
    });

    return NextResponse.json({
      success: true,
      repoId: updated.id.toString(),
      isPinned: updated.isPinned,
      message: updated.isPinned
        ? `Repositori "${updated.name}" disematkan ke atas`
        : `Sematan repositori "${updated.name}" dilepas`,
    });
  } catch (err) {
    console.error("Pin repository error:", err);
    return NextResponse.json({ error: "Gagal mengubah status semat repositori" }, { status: 500 });
  }
}
