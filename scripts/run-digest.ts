#!/usr/bin/env tsx
/**
 * scripts/run-digest.ts
 *
 * Runs the daily digest job locally.
 *
 * Usage:
 *   npx tsx scripts/run-digest.ts
 *
 * Or add to package.json scripts:
 *   "digest": "tsx scripts/run-digest.ts"
 *
 * To schedule locally (e.g., run at 8am daily):
 *   npx tsx scripts/scheduler.ts
 */

import "dotenv/config";
import { runDailyDigest } from "../lib/digest";

console.log("═".repeat(50));
console.log("☕ Portfolio Coffee Mate — Daily Digest");
console.log(`   ${new Date().toLocaleString()}`);
console.log("═".repeat(50));

runDailyDigest()
  .then((stats) => {
    console.log("\n✅ Digest complete.");
    console.log(`   Processed : ${stats.processed}`);
    console.log(`   Sent      : ${stats.sent}`);
    console.log(`   Urgent    : ${stats.urgentSent}`);
    console.log(`   Errors    : ${stats.errors}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Fatal error:", err);
    process.exit(1);
  });
