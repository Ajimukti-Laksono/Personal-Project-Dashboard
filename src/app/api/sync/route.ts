import { NextResponse } from "next/server";
import { syncAll } from "@/lib/github/sync";

export const runtime = "nodejs";

/**
 * POST /api/sync
 * Admin endpoint to trigger a complete GitHub backfill and sync.
 * Protected by authentication middleware.
 */
export async function POST(): Promise<NextResponse> {
  try {
    const stats = await syncAll();
    return NextResponse.json({
      success: true,
      message: "Sync completed successfully",
      stats,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Manual sync failed:", message);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
