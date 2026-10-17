import { Octokit } from "@octokit/rest";
import { getEnv } from "@/lib/env";

declare global {
  var __octokitClient: Octokit | undefined;
}

/**
 * Creates or retrieves a singleton Octokit client configured with GITHUB_TOKEN.
 */
export function getOctokit(): Octokit {
  if (globalThis.__octokitClient) {
    return globalThis.__octokitClient;
  }

  const env = getEnv();
  const octokit = new Octokit({
    auth: env.GITHUB_TOKEN,
    userAgent: "Personal-Project-Dashboard/1.0",
  });

  if (process.env.NODE_ENV !== "production") {
    globalThis.__octokitClient = octokit;
  }

  return octokit;
}
