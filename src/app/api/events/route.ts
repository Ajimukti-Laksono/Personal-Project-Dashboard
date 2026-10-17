import { NextRequest } from "next/server";
import { subscribe, RealtimeEvent } from "@/lib/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/events
 * Server-Sent Events stream for real-time dashboard updates.
 * Sends initial connection event, 25s keepalive pings, and broadcasts new events.
 * Cleans up listeners on client disconnect (AbortSignal).
 */
export async function GET(req: NextRequest): Promise<Response> {
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeatInterval: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send initial handshake
      try {
        controller.enqueue(
          encoder.encode(
            `event: connected\ndata: ${JSON.stringify({
              connected: true,
              timestamp: new Date().toISOString(),
            })}\n\n`,
          ),
        );
      } catch {
        return;
      }

      // 2. Subscribe to realtime broadcaster
      unsubscribe = subscribe((event: RealtimeEvent) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`),
          );
        } catch {
          // Stream may have closed, cleanup will occur on cancel
        }
      });

      // 3. Heartbeat ping every 25 seconds to prevent proxy timeouts
      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          if (heartbeatInterval) clearInterval(heartbeatInterval);
        }
      }, 25000);
    },

    cancel() {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
    },
  });

  // Handle abort signal from client disconnection
  req.signal.addEventListener("abort", () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable buffering in Nginx proxies
    },
  });
}
