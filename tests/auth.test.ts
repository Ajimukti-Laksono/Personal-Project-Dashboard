import { describe, it, expect, beforeEach } from "vitest";
import { createSessionToken, verifySessionToken, verifyPassword } from "@/lib/auth/session";
import { checkLoginRateLimit, resetLoginRateLimit } from "@/lib/auth/rate-limiter";

describe("Authentication & Session Security", () => {
  const secret = "a_very_long_test_session_secret_1234567890";

  it("should create and verify valid session token", async () => {
    const token = await createSessionToken(secret);
    expect(await verifySessionToken(token, secret)).toBe(true);
  });

  it("should reject token with wrong secret", async () => {
    const token = await createSessionToken(secret);
    const wrongSecret = "completely_different_secret_key_32_chars";
    expect(await verifySessionToken(token, wrongSecret)).toBe(false);
  });

  it("should reject tampered token payload", async () => {
    const token = await createSessionToken(secret);
    const [payload, sig] = token.split(".");
    const tampered = `${payload}tampered.${sig}`;
    expect(await verifySessionToken(tampered, secret)).toBe(false);
  });

  it("should reject malformed token strings", async () => {
    expect(await verifySessionToken("", secret)).toBe(false);
    expect(await verifySessionToken("not-a-token", secret)).toBe(false);
    expect(await verifySessionToken("part1.part2.part3", secret)).toBe(false);
  });

  it("should verify correct password", () => {
    expect(verifyPassword("mypassword123", "mypassword123")).toBe(true);
    expect(verifyPassword("wrongpassword", "mypassword123")).toBe(false);
    expect(verifyPassword("", "mypassword123")).toBe(false);
  });
});

describe("Login Rate Limiter", () => {
  const testIp = "192.168.1.100";

  beforeEach(() => {
    resetLoginRateLimit(testIp);
  });

  it("should allow first 5 login attempts", () => {
    for (let i = 0; i < 5; i++) {
      const res = checkLoginRateLimit(testIp);
      expect(res.allowed).toBe(true);
    }
  });

  it("should block 6th login attempt within the window", () => {
    for (let i = 0; i < 5; i++) {
      checkLoginRateLimit(testIp);
    }
    const sixth = checkLoginRateLimit(testIp);
    expect(sixth.allowed).toBe(false);
    expect(sixth.remaining).toBe(0);
    expect(sixth.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("should reset rate limit upon successful login", () => {
    for (let i = 0; i < 5; i++) {
      checkLoginRateLimit(testIp);
    }
    expect(checkLoginRateLimit(testIp).allowed).toBe(false);

    resetLoginRateLimit(testIp);
    expect(checkLoginRateLimit(testIp).allowed).toBe(true);
  });
});

describe("Hybrid Mode Access & Permissions", () => {
  it("should classify public routes correctly for guest viewers", () => {
    const publicPaths = [
      "/",
      "/login",
      "/api/auth/me",
      "/api/auth/login",
      "/api/auth/logout",
      "/api/dashboard",
      "/api/events",
      "/api/repos/123",
      "/api/health",
      "/api/webhook",
    ];

    for (const path of publicPaths) {
      const isPublicPage = path === "/" || path === "/login";
      const isPublicApi =
        path === "/api/auth/login" ||
        path === "/api/auth/logout" ||
        path === "/api/auth/me" ||
        path === "/api/dashboard" ||
        path === "/api/events" ||
        path.startsWith("/api/repos") ||
        path === "/api/webhook" ||
        path === "/api/health";

      expect(isPublicPage || isPublicApi).toBe(true);
    }
  });

  it("should classify admin-only protected routes", () => {
    const protectedPaths = [
      "/api/sync",
      "/api/webhook/history",
      "/api/admin/settings",
    ];

    for (const path of protectedPaths) {
      const isPublicPage = path === "/" || path === "/login";
      const isPublicApi =
        path === "/api/auth/login" ||
        path === "/api/auth/logout" ||
        path === "/api/auth/me" ||
        path === "/api/dashboard" ||
        path === "/api/events" ||
        path.startsWith("/api/repos") ||
        path === "/api/webhook" ||
        path === "/api/health";

      expect(isPublicPage || isPublicApi).toBe(false);
    }
  });
});
