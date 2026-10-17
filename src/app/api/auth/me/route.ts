import { NextResponse } from "next/server";
import { isCurrentSessionValid } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/auth/me
 * Returns whether the current visitor is authenticated as admin.
 * Used by UI to render admin buttons (Sync, Webhook modal) vs visitor read-only mode.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const authenticated = await isCurrentSessionValid();
    return NextResponse.json({ authenticated });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
