// ============================================================
// Daily Digest Job — Core Logic
// ============================================================

import { prisma } from "./prisma";
import { fetchNews } from "./news";
import { summarizeAndScore, Holding } from "./scoring";
import { sendEmail } from "./email";
import { digestEmailHtml, digestEmailText, urgentEmailHtml } from "./templates/digest";
import {
  getOrCreateUnsubscribeToken,
  buildUnsubscribeUrl,
  buildHoldingsEditUrl,
} from "./tokens";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function hadUrgentAlertToday(subscriberId: string): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const log = await prisma.deliveryLog.findFirst({
    where: {
      subscriberId,
      type: "URGENT",
      sentAt: { gte: today },
      status: "sent",
    },
  });

  return log !== null;
}

export async function runDailyDigest(): Promise<{
  processed: number;
  sent: number;
  urgentSent: number;
  errors: number;
}> {
  const stats = { processed: 0, sent: 0, urgentSent: 0, errors: 0 };

  const subscribers = await prisma.subscriber.findMany({
    where: { isActive: true },
    include: { holdings: true },
  });

  console.log(`[digest] Processing ${subscribers.length} subscribers`);

  for (const subscriber of subscribers) {
    stats.processed++;

    try {
      const tickers = subscriber.holdings.map((h) => h.ticker);
      const news = await fetchNews(tickers);

      const holdings: Holding[] = subscriber.holdings.map((h) => ({
        ticker: h.ticker,
        weightPct: h.weightPct,
      }));

      const events = await summarizeAndScore(news, holdings);

      if (events.length === 0) {
        console.log(`[digest] No relevant events for ${subscriber.email}`);
        continue;
      }

      const token = await getOrCreateUnsubscribeToken(subscriber.id);
      const unsubscribeUrl = buildUnsubscribeUrl(token, APP_URL);
      const holdingsEditUrl = buildHoldingsEditUrl(subscriber.id, token, APP_URL);
      const date = formatDate(new Date());

      // --- Send Daily Digest ---
      const dailyHtml = digestEmailHtml({
        email: subscriber.email,
        events,
        date,
        unsubscribeUrl,
        holdingsEditUrl,
        appUrl: APP_URL,
      });

      const dailyText = digestEmailText({
        email: subscriber.email,
        events,
        date,
        unsubscribeUrl,
        holdingsEditUrl,
        appUrl: APP_URL,
      });

      const dailyResult = await sendEmail({
        to: subscriber.email,
        subject: `☕ Your Morning Portfolio Brief — ${events.length} thing${events.length !== 1 ? "s" : ""} that matter today`,
        html: dailyHtml,
        text: dailyText,
      });

      await prisma.deliveryLog.create({
        data: {
          subscriberId: subscriber.id,
          type: "DAILY",
          status: dailyResult.success ? "sent" : "failed",
          errorMessage: dailyResult.error,
        },
      });

      if (dailyResult.success) stats.sent++;
      else stats.errors++;

      console.log(
        `[digest] Daily → ${subscriber.email}: ${dailyResult.success ? "✓" : "✗ " + dailyResult.error}`
      );

      // Brief pause to respect Resend's 2 req/sec rate limit
      await new Promise((r) => setTimeout(r, 600));

      // --- Send Urgent Alerts ---
      if (subscriber.wantsUrgentAlerts) {
        const urgentEvents = events.filter((e) => e.isUrgent);
        const alreadySentUrgent = await hadUrgentAlertToday(subscriber.id);

        if (urgentEvents.length > 0 && !alreadySentUrgent) {
          // Send only the highest-scoring urgent event
          const topUrgent = urgentEvents.sort((a, b) => b.impactScore - a.impactScore)[0];

          const urgentHtml = urgentEmailHtml({
            email: subscriber.email,
            event: topUrgent,
            unsubscribeUrl,
            holdingsEditUrl,
            appUrl: APP_URL,
          });

          const urgentResult = await sendEmail({
            to: subscriber.email,
            subject: `🚨 Urgent: ${topUrgent.affectedHoldings.join(", ") || "Market"} alert — ${topUrgent.title.slice(0, 60)}`,
            html: urgentHtml,
          });

          await prisma.deliveryLog.create({
            data: {
              subscriberId: subscriber.id,
              type: "URGENT",
              status: urgentResult.success ? "sent" : "failed",
              errorMessage: urgentResult.error,
            },
          });

          if (urgentResult.success) stats.urgentSent++;
          console.log(
            `[digest] Urgent → ${subscriber.email}: ${urgentResult.success ? "✓" : "✗ " + urgentResult.error}`
          );
        }
      }
    } catch (err) {
      stats.errors++;
      console.error(`[digest] Error for ${subscriber.email}:`, err);

      await prisma.deliveryLog.create({
        data: {
          subscriberId: subscriber.id,
          type: "DAILY",
          status: "failed",
          errorMessage: err instanceof Error ? err.message : String(err),
        },
      });
    }
  }

  console.log(
    `[digest] Done — processed: ${stats.processed}, sent: ${stats.sent}, urgent: ${stats.urgentSent}, errors: ${stats.errors}`
  );

  return stats;
}
