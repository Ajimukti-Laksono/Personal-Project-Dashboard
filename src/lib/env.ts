import { z } from "zod";

/**
 * Schema for all required environment variables.
 * The app will fail to start with a clear message if any are missing.
 */
const envSchema = z.object({
  GITHUB_TOKEN: z
    .string()
    .min(1, "GITHUB_TOKEN is required. Create a fine-grained PAT with read-only access."),
  GITHUB_WEBHOOK_SECRET: z
    .string()
    .min(1, "GITHUB_WEBHOOK_SECRET is required. Set the same value in your GitHub webhook config."),
  GITHUB_USERNAME: z
    .string()
    .min(1, "GITHUB_USERNAME is required. Set this to your GitHub username."),
  DASHBOARD_PASSWORD: z.string().min(8, "DASHBOARD_PASSWORD must be at least 8 characters."),
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 characters. Use a long random string."),
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required. Example: file:./data/dashboard.db")
    .default("file:./data/dashboard.db"),
  PUBLIC_BASE_URL: z
    .string()
    .url("PUBLIC_BASE_URL must be a valid URL.")
    .default("http://localhost:3000"),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

/**
 * Validates and returns the environment variables.
 * Throws with a clear error message listing all missing/invalid variables.
 * Results are cached after the first successful validation.
 */
export function getEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  ❌ ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    const message = [
      "",
      "╔══════════════════════════════════════════════════════════╗",
      "║        ENVIRONMENT VARIABLE VALIDATION FAILED           ║",
      "╠══════════════════════════════════════════════════════════╣",
      "║  Copy .env.example to .env and fill in all values.      ║",
      "╚══════════════════════════════════════════════════════════╝",
      "",
      "Missing or invalid variables:",
      errors,
      "",
    ].join("\n");

    throw new Error(message);
  }

  cachedEnv = result.data;
  return cachedEnv;
}

/**
 * Reset cached env (useful for testing).
 */
export function resetEnvCache(): void {
  cachedEnv = null;
}
