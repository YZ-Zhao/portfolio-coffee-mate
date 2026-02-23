#!/usr/bin/env tsx
/**
 * scripts/scheduler.ts
 *
 * Local cron scheduler using node-cron.
 * Runs the daily digest at 8:00 AM every day.
 *
 * Usage:
 *   npx tsx scripts/scheduler.ts
 *
 * Keep this process running (e.g., via pm2, screen, or tmux) on your server.
 * On Vercel, use vercel.json cron config instead.
 * On GitHub Actions, use .github/workflows/digest.yml instead.
 */

import "dotenv/config";
import cron from "node-cron";
import { runDailyDigest } from "../lib/digest";

const SCHEDULE = process.env.CRON_SCHEDULE ?? "0 8 * * *"; // Default: 8:00 AM daily

console.log("☕ Portfolio Coffee Mate — Scheduler started");
console.log(`   Schedule: ${SCHEDULE}`);
console.log(`   Next run: ${getNextRunDescription(SCHEDULE)}`);
console.log("   Press Ctrl+C to stop.\n");

cron.schedule(SCHEDULE, async () => {
  const now = new Date().toLocaleString();
  console.log(`\n[${now}] ⏰ Cron triggered — running daily digest…`);

  try {
    const stats = await runDailyDigest();
    console.log(`[${now}] ✅ Done — sent: ${stats.sent}, urgent: ${stats.urgentSent}, errors: ${stats.errors}`);
  } catch (err) {
    console.error(`[${now}] ❌ Fatal error:`, err);
  }
});

function getNextRunDescription(schedule: string): string {
  try {
    // Simple human-readable description
    const parts = schedule.split(" ");
    if (parts.length === 5) {
      const [min, hour] = parts;
      if (parts[2] === "*" && parts[3] === "*" && parts[4] === "*") {
        return `Daily at ${hour.padStart(2, "0")}:${min.padStart(2, "0")}`;
      }
    }
    return schedule;
  } catch {
    return schedule;
  }
}
