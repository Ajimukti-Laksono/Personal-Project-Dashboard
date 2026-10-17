import { spawn } from "child_process";
import { getEnv } from "../src/lib/env";

/**
 * Helper script to launch Smee tunnel forwarder to localhost webhook URL.
 */
function main() {
  const env = getEnv();
  const targetUrl = `${env.PUBLIC_BASE_URL || "http://localhost:3000"}/api/webhook`;
  const smeeChannel = process.env.SMEE_CHANNEL || process.argv[2];

  console.log("==================================================");
  console.log("🌐 GitHub Webhook Local Tunnel Helper");
  console.log(`- Target Lokal: ${targetUrl}`);
  console.log("==================================================");

  if (!smeeChannel) {
    console.log("\n⚠️ Channel smee belum ditentukan!");
    console.log("Langkah mudah:");
    console.log("1. Buka https://smee.io dan klik 'Start a new channel'");
    console.log("2. Salin URL channel (contoh: https://smee.io/abc123xyz)");
    console.log("3. Jalankan:");
    console.log(`   pnpm tunnel https://smee.io/abc123xyz`);
    console.log("   atau");
    console.log(`   smee -u https://smee.io/abc123xyz -t ${targetUrl}\n`);
    process.exit(1);
  }

  console.log(`📡 Menghubungkan tunnel dari ${smeeChannel} ke ${targetUrl}...`);

  const child = spawn("npx", ["-y", "smee-client", "-u", smeeChannel, "-t", targetUrl], {
    stdio: "inherit",
    shell: true,
  });

  child.on("error", (err) => {
    console.error("Gagal menjalankan smee-client:", err.message);
  });
}

main();
