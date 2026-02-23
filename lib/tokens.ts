// ============================================================
// Unsubscribe Token Utilities
// ============================================================

import { prisma } from "./prisma";

export async function getOrCreateUnsubscribeToken(subscriberId: string): Promise<string> {
  const existing = await prisma.unsubscribeToken.findUnique({
    where: { subscriberId },
  });

  if (existing) return existing.token;

  const created = await prisma.unsubscribeToken.create({
    data: { subscriberId },
  });

  return created.token;
}

export function buildUnsubscribeUrl(token: string, appUrl: string): string {
  return `${appUrl}/unsubscribe?token=${token}`;
}

export function buildHoldingsEditUrl(subscriberId: string, token: string, appUrl: string): string {
  return `${appUrl}/holdings?id=${subscriberId}&token=${token}`;
}
