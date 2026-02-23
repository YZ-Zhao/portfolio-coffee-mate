// ============================================================
// POST /api/cron — Trigger the daily digest (for Vercel Cron / GitHub Actions)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { runDailyDigest } from "@/lib/digest";

export const maxDuration = 300; // 5 minutes (Vercel Pro allows up to 300s)

export async function POST(req: NextRequest) {
  // Optional: protect with a shared secret
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const stats = await runDailyDigest();
    return NextResponse.json({ success: true, stats });
  } catch (err) {
    console.error("[cron] Fatal error:", err);
    return NextResponse.json(
      { error: "Internal error", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

// Also allow GET for easy browser-based testing
export async function GET(req: NextRequest) {
  return POST(req);
}
