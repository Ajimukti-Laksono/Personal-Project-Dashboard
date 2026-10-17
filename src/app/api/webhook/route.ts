import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/github/verify";
import { processWebhookEvent } from "@/lib/github/webhook-handler";
import { getEnv } from "@/lib/env";

export const runtime = "nodejs";

/**
 * POST /api/webhook
 * Handles incoming GitHub webhook payloads with signature verification,
 * delivery idempotency, database synchronization, and SSE broadcasting.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Read unparsed raw body for signature verification
    const rawBody = await req.text();

    // 2. Read headers
    const signature = req.headers.get("x-hub-signature-256");
    const event = req.headers.get("x-github-event");
    const deliveryId = req.headers.get("x-github-delivery");

    // 3. Verify signature using constant-time comparison
    const env = getEnv();
    const isValid = verifyWebhookSignature(rawBody, signature, env.GITHUB_WEBHOOK_SECRET);

    if (!isValid) {
      // 401 Unauthorized - never leak internal error details
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!event) {
      return NextResponse.json({ error: "Missing x-github-event header" }, { status: 400 });
    }

    // 4. Safely parse JSON after signature has been verified
    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // 5. Process event
    const result = await processWebhookEvent(event, deliveryId, payload);

    return NextResponse.json({ message: result.message }, { status: result.status });
  } catch (err) {
    // Log internally without leaking secrets or stack trace to the client
    console.error("Internal error handling webhook:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
