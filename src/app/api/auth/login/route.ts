import { NextRequest, NextResponse } from "next/server";
import { checkLoginRateLimit, resetLoginRateLimit } from "@/lib/auth/rate-limiter";
import { setSessionCookie, verifyPassword } from "@/lib/auth/session";
import { getEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Get client IP for rate limiting
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "127.0.0.1";

  // 2. Check rate limit
  const rateLimit = checkLoginRateLimit(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Too many login attempts. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds ?? 60),
        },
      },
    );
  }

  try {
    const body = (await req.json()) as { password?: string };
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const env = getEnv();
    const isCorrect = verifyPassword(password, env.DASHBOARD_PASSWORD);

    if (!isCorrect) {
      return NextResponse.json(
        {
          error: "Invalid password",
          remainingAttempts: rateLimit.remaining,
        },
        { status: 401 },
      );
    }

    // Success - reset rate limiter and issue session cookie
    resetLoginRateLimit(ip);
    await setSessionCookie();

    return NextResponse.json({ success: true, message: "Logged in successfully" });
  } catch (err) {
    console.error("Login endpoint error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
