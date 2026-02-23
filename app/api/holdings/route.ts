// ============================================================
// GET  /api/holdings?id=...&token=...  — Fetch subscriber holdings
// PUT  /api/holdings                   — Update holdings
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function verifyToken(subscriberId: string, token: string): Promise<boolean> {
  const record = await prisma.unsubscribeToken.findFirst({
    where: { subscriberId, token },
  });
  return record !== null;
}

function parseTickers(raw: string): { ticker: string; weightPct?: number }[] {
  if (!raw.trim()) return [];
  return raw
    .split(/[,\s]+/)
    .map((part) => part.trim().toUpperCase())
    .filter((part) => /^[A-Z]{1,5}(:\d+(\.\d+)?)?$/.test(part))
    .map((part) => {
      const [ticker, weightStr] = part.split(":");
      return { ticker, weightPct: weightStr ? parseFloat(weightStr) : undefined };
    });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const token = req.nextUrl.searchParams.get("token");

  if (!id || !token) {
    return NextResponse.json({ error: "Missing id or token." }, { status: 400 });
  }

  const valid = await verifyToken(id, token);
  if (!valid) {
    return NextResponse.json({ error: "Invalid token." }, { status: 403 });
  }

  const subscriber = await prisma.subscriber.findUnique({
    where: { id },
    include: { holdings: { orderBy: { createdAt: "asc" } } },
  });

  if (!subscriber) {
    return NextResponse.json({ error: "Subscriber not found." }, { status: 404 });
  }

  return NextResponse.json({
    email: subscriber.email,
    timezone: subscriber.timezone,
    sendTime: subscriber.sendTime,
    wantsUrgentAlerts: subscriber.wantsUrgentAlerts,
    holdings: subscriber.holdings.map((h: { ticker: string; weightPct: number | null }) => ({
      ticker: h.ticker,
      weightPct: h.weightPct,
    })),
  });
}

export async function PUT(req: NextRequest) {
  const body = await req.json() as {
    id?: string;
    token?: string;
    tickers?: string;
    wantsUrgentAlerts?: boolean;
    timezone?: string;
  };
  const { id, token, tickers: rawTickers, wantsUrgentAlerts, timezone } = body;

  if (!id || !token) {
    return NextResponse.json({ error: "Missing id or token." }, { status: 400 });
  }

  const valid = await verifyToken(id, token);
  if (!valid) {
    return NextResponse.json({ error: "Invalid token." }, { status: 403 });
  }

  const parsedTickers = parseTickers(rawTickers ?? "");

  await prisma.subscriber.update({
    where: { id },
    data: {
      wantsUrgentAlerts: wantsUrgentAlerts ?? true,
      timezone: timezone ?? "America/Chicago",
    },
  });

  // Replace all holdings
  await prisma.holding.deleteMany({ where: { subscriberId: id } });

  if (parsedTickers.length > 0) {
    await prisma.holding.createMany({
      data: parsedTickers.map((t) => ({
        subscriberId: id,
        ticker: t.ticker,
        weightPct: t.weightPct ?? null,
      })),
    });
  }

  return NextResponse.json({ success: true, message: "Holdings updated." });
}
