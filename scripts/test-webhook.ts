import { signWebhookPayload } from "../src/lib/github/verify";
import { getEnv } from "../src/lib/env";

async function main() {
  const env = getEnv();
  const baseUrl = process.env.BASE_URL || env.PUBLIC_BASE_URL || "http://localhost:3000";
  const webhookUrl = `${baseUrl}/api/webhook`;

  const commitSha = `test-${Math.random().toString(16).substring(2, 10)}${Date.now()}`;
  const now = new Date();

  const payload = {
    ref: "refs/heads/main",
    before: "0000000000000000000000000000000000000000",
    after: commitSha,
    created: false,
    deleted: false,
    forced: false,
    repository: {
      id: 987654321,
      name: "personal-project-dashboard",
      full_name: `${env.GITHUB_USERNAME}/personal-project-dashboard`,
      description: "Personal Project Dashboard dengan integrasi real-time GitHub",
      language: "TypeScript",
      stargazers_count: 12,
      forks_count: 3,
      open_issues_count: 0,
      private: false,
      archived: false,
      default_branch: "main",
      html_url: `https://github.com/${env.GITHUB_USERNAME}/personal-project-dashboard`,
      pushed_at: now.toISOString(),
    },
    commits: [
      {
        id: commitSha,
        message: `feat: real-time commit simulation at ${now.toLocaleTimeString("id-ID")}`,
        timestamp: now.toISOString(),
        url: `https://github.com/${env.GITHUB_USERNAME}/personal-project-dashboard/commit/${commitSha}`,
        author: {
          name: env.GITHUB_USERNAME,
          email: `${env.GITHUB_USERNAME.toLowerCase()}@users.noreply.github.com`,
          username: env.GITHUB_USERNAME,
        },
      },
    ],
    pusher: {
      name: env.GITHUB_USERNAME,
      email: `${env.GITHUB_USERNAME.toLowerCase()}@users.noreply.github.com`,
    },
    sender: {
      login: env.GITHUB_USERNAME,
      avatar_url: `https://avatars.githubusercontent.com/${env.GITHUB_USERNAME}`,
    },
  };

  const rawBody = JSON.stringify(payload);
  const signature = signWebhookPayload(rawBody, env.GITHUB_WEBHOOK_SECRET);
  const deliveryId = `test-delivery-${Date.now()}`;

  console.log("==================================================");
  console.log("📡 Mengirim Fake GitHub Webhook Event:");
  console.log(`- Target:      ${webhookUrl}`);
  console.log(`- Event:       push`);
  console.log(`- Delivery ID: ${deliveryId}`);
  console.log(`- Commit SHA:  ${commitSha}`);
  console.log(`- Signature:   ${signature.slice(0, 20)}...`);
  console.log("==================================================");

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-GitHub-Event": "push",
        "X-GitHub-Delivery": deliveryId,
        "X-Hub-Signature-256": signature,
      },
      body: rawBody,
    });

    const status = res.status;
    const body = await res.text();

    console.log(`\n📥 Respons Server (HTTP ${status}):`);
    console.log(body);

    if (res.ok) {
      console.log("\n✅ Webhook berhasil diproses!");
      console.log("👉 Buka dashboard di browser Anda untuk melihat commit baru muncul secara real-time.");
    } else {
      console.error("\n❌ Webhook ditolak oleh server.");
    }
  } catch (err) {
    console.error("\n❌ Gagal mengirim request ke server:", err instanceof Error ? err.message : err);
    console.error("Pastikan server lokal berjalan dengan 'pnpm dev' sebelum menjalankan script ini.");
  }
}

main();
