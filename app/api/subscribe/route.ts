// ============================================================
// POST /api/subscribe — Create subscriber + send welcome email
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { welcomeEmailHtml, welcomeEmailText } from "@/lib/templates/welcome";
import {
  getOrCreateUnsubscribeToken,
  buildUnsubscribeUrl,
  buildHoldingsEditUrl,
} from "@/lib/tokens";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function parseTickers(raw: string): { ticker: string; weightPct?: number }[] {
  if (!raw.trim()) return [];

  return raw
    .split(/[,\s]+/)
    .map((part) => part.trim().toUpperCase())
    .filter((part) => /^[A-Z]{1,5}(:\d+(\.\d+)?)?$/.test(part))
    .map((part) => {
      const [ticker, weightStr] = part.split(":");
      return {
        ticker,
        weightPct: weightStr ? parseFloat(weightStr) : undefined,
      };
    });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      email?: string;
      tickers?: string;
      wantsUrgentAlerts?: boolean;
      timezone?: string;
    };

    const { email, tickers: rawTickers, wantsUrgentAlerts, timezone } = body;

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    const parsedTickers = parseTickers(rawTickers ?? "");

    // Upsert subscriber
    const subscriber = await prisma.subscriber.upsert({
      where: { email },
      create: {
        email,
        isActive: true,
        wantsUrgentAlerts: wantsUrgentAlerts ?? true,
        timezone: timezone ?? "America/Chicago",
      },
      update: {
        isActive: true,
        wantsUrgentAlerts: wantsUrgentAlerts ?? true,
        timezone: timezone ?? "America/Chicago",
      },
    });

    // Replace holdings (delete + recreate for upsert simplicity)
    if (parsedTickers.length > 0) {
      await prisma.holding.deleteMany({ where: { subscriberId: subscriber.id } });
      await prisma.holding.createMany({
        data: parsedTickers.map((t) => ({
          subscriberId: subscriber.id,
          ticker: t.ticker,
          weightPct: t.weightPct ?? null,
        })),
      });
    }

    // Build URLs
    const token = await getOrCreateUnsubscribeToken(subscriber.id);
    const unsubscribeUrl = buildUnsubscribeUrl(token, APP_URL);
    const holdingsEditUrl = buildHoldingsEditUrl(subscriber.id, token, APP_URL);

    // Send welcome email
    const welcomeHtml = welcomeEmailHtml({
      email,
      tickers: parsedTickers.map((t) => t.ticker),
      appUrl: APP_URL,
      unsubscribeUrl,
      holdingsEditUrl,
    });

    const welcomeText = welcomeEmailText({
      email,
      tickers: parsedTickers.map((t) => t.ticker),
      appUrl: APP_URL,
      unsubscribeUrl,
      holdingsEditUrl,
    });

    await sendEmail({
      to: email,
      subject: "☕ Welcome to Portfolio Coffee Mate",
      html: welcomeHtml,
      text: welcomeText,
    });

    return NextResponse.json({
      success: true,
      message: "Subscribed! Check your inbox for a welcome email.",
    });
  } catch (err) {
    console.error("[subscribe] Error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
