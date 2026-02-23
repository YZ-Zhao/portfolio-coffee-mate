#!/usr/bin/env tsx
/**
 * scripts/seed.ts
 *
 * Seeds the database with a test subscriber for local development.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const libsqlUrl = dbUrl.startsWith("file:") ? dbUrl : `file:${dbUrl}`;
const adapter = new PrismaLibSql({ url: libsqlUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database…\n");

  // Create a test subscriber
  const subscriber = await prisma.subscriber.upsert({
    where: { email: "yizhouzhao319@outlook.com" },
    create: {
      email: "yizhouzhao319@outlook.com",
      isActive: true,
      timezone: "America/Chicago",
      sendTime: "08:00",
      wantsUrgentAlerts: true,
    },
    update: {
      isActive: true,
    },
  });

  console.log(`✓ Subscriber: ${subscriber.email} (id: ${subscriber.id})`);

  // Add holdings
  const holdings = [
    { ticker: "NVDA", weightPct: 15 },
    { ticker: "VTI",  weightPct: 40 },
    { ticker: "BND",  weightPct: 25 },
    { ticker: "AAPL", weightPct: 10 },
    { ticker: "AMZN", weightPct: 10 },
  ];

  await prisma.holding.deleteMany({ where: { subscriberId: subscriber.id } });
  await prisma.holding.createMany({
    data: holdings.map((h) => ({ ...h, subscriberId: subscriber.id })),
  });

  console.log(`✓ Holdings: ${holdings.map((h) => `${h.ticker}:${h.weightPct}%`).join(", ")}`);

  // Create unsubscribe token
  const token = await prisma.unsubscribeToken.upsert({
    where: { subscriberId: subscriber.id },
    create: { subscriberId: subscriber.id },
    update: {},
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  console.log(`✓ Unsubscribe token: ${token.token}`);
  console.log(`\n📧 To test the digest manually, run:`);
  console.log(`   npx tsx scripts/run-digest.ts\n`);
  console.log(`🔗 Holdings edit link:`);
  console.log(`   ${appUrl}/holdings?id=${subscriber.id}&token=${token.token}\n`);
  console.log(`🔗 Unsubscribe link:`);
  console.log(`   ${appUrl}/unsubscribe?token=${token.token}\n`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("✅ Seed complete.");
  })
  .catch(async (err) => {
    console.error("❌ Seed error:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
