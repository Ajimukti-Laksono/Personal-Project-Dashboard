import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/health
 * Public healthcheck endpoint for Docker container and uptime monitors.
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Quick DB ping
    await prisma.$queryRawUnsafe("SELECT 1;");

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: err instanceof Error ? err.message : "Database connection failed",
      },
      { status: 503 },
    );
  }
}
