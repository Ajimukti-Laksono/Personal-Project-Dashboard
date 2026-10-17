interface RateLimitRecord {
  attempts: number;
  resetAt: number;
}

declare global {
  var __loginRateLimiter: Map<string, RateLimitRecord> | undefined;
}

const rateLimitMap: Map<string, RateLimitRecord> = globalThis.__loginRateLimiter ?? new Map();

if (process.env.NODE_ENV !== "production") {
  globalThis.__loginRateLimiter = rateLimitMap;
}

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 1000; // 1 minute

/**
 * Checks if an IP is rate limited for login attempts.
 * Returns { allowed: boolean, remaining: number, retryAfterSeconds?: number }
 */
export function checkLoginRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // If no record or record has expired, reset
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, {
      attempts: 1,
      resetAt: now + WINDOW_MS,
    });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  // If already at or above limit
  if (record.attempts >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  // Increment attempts
  record.attempts += 1;
  return {
    allowed: true,
    remaining: MAX_ATTEMPTS - record.attempts,
  };
}

/**
 * Resets the rate limit for a successful login.
 */
export function resetLoginRateLimit(ip: string): void {
  rateLimitMap.delete(ip);
}
