import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getEnv, resetEnvCache } from "@/lib/env";

describe("Environment Validation", () => {
  const validEnv = {
    GITHUB_TOKEN: "ghp_test_token_123",
    GITHUB_WEBHOOK_SECRET: "whsec_test_secret",
    GITHUB_USERNAME: "testuser",
    DASHBOARD_PASSWORD: "securepassword123",
    SESSION_SECRET: "a".repeat(32),
    DATABASE_URL: "file:./data/dashboard.db",
    PUBLIC_BASE_URL: "http://localhost:3000",
  };

  beforeEach(() => {
    resetEnvCache();
    // Save original env
    vi.stubEnv("GITHUB_TOKEN", validEnv.GITHUB_TOKEN);
    vi.stubEnv("GITHUB_WEBHOOK_SECRET", validEnv.GITHUB_WEBHOOK_SECRET);
    vi.stubEnv("GITHUB_USERNAME", validEnv.GITHUB_USERNAME);
    vi.stubEnv("DASHBOARD_PASSWORD", validEnv.DASHBOARD_PASSWORD);
    vi.stubEnv("SESSION_SECRET", validEnv.SESSION_SECRET);
    vi.stubEnv("DATABASE_URL", validEnv.DATABASE_URL);
    vi.stubEnv("PUBLIC_BASE_URL", validEnv.PUBLIC_BASE_URL);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetEnvCache();
  });

  it("should validate all required env variables successfully", () => {
    const env = getEnv();
    expect(env.GITHUB_TOKEN).toBe(validEnv.GITHUB_TOKEN);
    expect(env.GITHUB_USERNAME).toBe(validEnv.GITHUB_USERNAME);
    expect(env.DATABASE_URL).toBe(validEnv.DATABASE_URL);
  });

  it("should throw when GITHUB_TOKEN is missing", () => {
    vi.stubEnv("GITHUB_TOKEN", "");
    expect(() => getEnv()).toThrow("GITHUB_TOKEN");
  });

  it("should throw when GITHUB_WEBHOOK_SECRET is missing", () => {
    vi.stubEnv("GITHUB_WEBHOOK_SECRET", "");
    expect(() => getEnv()).toThrow("GITHUB_WEBHOOK_SECRET");
  });

  it("should throw when DASHBOARD_PASSWORD is too short", () => {
    vi.stubEnv("DASHBOARD_PASSWORD", "short");
    expect(() => getEnv()).toThrow("DASHBOARD_PASSWORD");
  });

  it("should throw when SESSION_SECRET is too short", () => {
    vi.stubEnv("SESSION_SECRET", "tooshort");
    expect(() => getEnv()).toThrow("SESSION_SECRET");
  });

  it("should cache env after first successful validation", () => {
    const env1 = getEnv();
    vi.stubEnv("GITHUB_TOKEN", "changed_token");
    const env2 = getEnv();
    // Should return cached value, not the changed one
    expect(env2.GITHUB_TOKEN).toBe(env1.GITHUB_TOKEN);
  });

  it("should clear cache with resetEnvCache", () => {
    const env1 = getEnv();
    resetEnvCache();
    vi.stubEnv("GITHUB_TOKEN", "ghp_new_token");
    const env2 = getEnv();
    expect(env2.GITHUB_TOKEN).toBe("ghp_new_token");
    expect(env2.GITHUB_TOKEN).not.toBe(env1.GITHUB_TOKEN);
  });
});
