// ============================================================
// GET /api/unsubscribe?token=... — Unsubscribe user
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const record = await prisma.unsubscribeToken.findUnique({
    where: { token },
    include: { subscriber: true },
  });

  if (!record) {
    return NextResponse.json({ error: "Invalid or expired unsubscribe token." }, { status: 404 });
  }

  await prisma.subscriber.update({
    where: { id: record.subscriberId },
    data: { isActive: false },
  });

  // Redirect to unsubscribe confirmation page
  return NextResponse.redirect(
    new URL(`/unsubscribe?done=1&email=${encodeURIComponent(record.subscriber.email)}`, req.url)
  );
}
