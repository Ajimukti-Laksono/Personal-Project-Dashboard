import { syncAll } from "../src/lib/github/sync";

async function main() {
  console.log("🚀 Starting GitHub repository backfill & synchronization...");
  try {
    const stats = await syncAll();
    console.log("\n✅ Sync completed successfully!");
    console.log(`- Repositories: ${stats.reposProcessed}`);
    console.log(`- Commits:      ${stats.commitsProcessed}`);
    console.log(`- Pull Requests:${stats.prsProcessed}`);
    console.log(`- Issues:       ${stats.issuesProcessed}`);
    console.log(`- Workflow Runs:${stats.workflowsProcessed}`);
    console.log(`- Duration:     ${stats.durationMs}ms`);

    if (stats.errors.length > 0) {
      console.warn(`\n⚠️  Encountered ${stats.errors.length} non-fatal warning(s):`);
      for (const err of stats.errors) {
        console.warn(`  - [${err.repo}]: ${err.error}`);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Fatal error during sync:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
