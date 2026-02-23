// ============================================================
// Daily Digest Email Template
// ============================================================

import { ScoredEvent } from "../scoring";

export interface DigestEmailData {
  email: string;
  events: ScoredEvent[];
  date: string; // e.g., "Monday, February 22, 2026"
  unsubscribeUrl: string;
  holdingsEditUrl: string;
  appUrl: string;
}

function badgeStyle(level: "Low" | "Moderate" | "High"): string {
  const styles: Record<string, string> = {
    High: "background:#fee2e2;color:#b91c1c;",
    Moderate: "background:#fef3c7;color:#b45309;",
    Low: "background:#d1fae5;color:#047857;",
  };
  return styles[level] ?? styles.Low;
}

function eventCard(event: ScoredEvent, index: number): string {
  const affectedStr =
    event.affectedHoldings.length > 0
      ? `Affects: <strong>${event.affectedHoldings.join(", ")}</strong>${
          event.portfolioPctAffected > 0
            ? ` (~${event.portfolioPctAffected}% of your portfolio)`
            : ""
        }`
      : "General market news";

  return `
  <div style="margin-bottom:28px;padding-bottom:28px;border-bottom:1px solid #e8e4d9;">
    <p style="margin:0 0 4px;font-size:11px;font-family:Arial,sans-serif;color:#aaa;text-transform:uppercase;letter-spacing:1px;">
      ${index + 1} of ${index + 1}
    </p>
    <h2 style="margin:0 0 10px;font-size:17px;color:#1a1a2e;font-family:Georgia,serif;line-height:1.4;">
      <a href="${event.url}" style="color:#1a1a2e;text-decoration:none;">${event.title}</a>
    </h2>
    <p style="margin:0 0 10px;font-size:14px;color:#444;line-height:1.6;font-family:Arial,sans-serif;">
      ${event.summary}
    </p>

    <details style="margin-bottom:10px;">
      <summary style="cursor:pointer;font-size:13px;font-family:Arial,sans-serif;color:#1a6ed4;font-weight:bold;list-style:none;outline:none;">
        Why this matters ▾
      </summary>
      <div style="margin-top:8px;padding:12px 16px;background:#faf9f6;border-radius:6px;font-size:13px;color:#555;line-height:1.7;font-family:Arial,sans-serif;">
        ${event.whyItMatters}
      </div>
    </details>

    <p style="margin:0;font-size:12px;color:#888;font-family:Arial,sans-serif;">
      <span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:bold;margin-right:8px;${badgeStyle(event.impactLevel)}">
        ${event.impactLevel} &bull; ${event.impactScore}/10
      </span>
      ${affectedStr}
    </p>
    <p style="margin:4px 0 0;font-size:11px;color:#bbb;font-family:Arial,sans-serif;">
      Source: ${event.source}
    </p>
  </div>`;
}

export function digestEmailHtml(data: DigestEmailData): string {
  const { events, date, email, unsubscribeUrl, holdingsEditUrl, appUrl } = data;
  const count = events.length;
  const subjectLine = `${count} thing${count !== 1 ? "s" : ""} that matter${count === 1 ? "s" : ""} today`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Morning Portfolio Brief</title>
</head>
<body style="margin:0;padding:0;background:#faf9f6;font-family:Georgia,'Times New Roman',serif;color:#2d2d2d;">
  <div style="max-width:600px;margin:0 auto;background:#fff;">

    <!-- Header -->
    <div style="background:#1a1a2e;padding:28px 40px;text-align:center;">
      <p style="margin:0;color:#f5c842;font-size:22px;font-family:Georgia,serif;letter-spacing:1px;">☕ Portfolio Coffee Mate</p>
      <p style="margin:8px 0 0;color:#a8a8c0;font-size:13px;font-family:Arial,sans-serif;">${date}</p>
    </div>

    <!-- Intro -->
    <div style="padding:28px 40px 8px;">
      <p style="margin:0 0 4px;font-size:22px;font-family:Georgia,serif;">Good morning.</p>
      <p style="margin:0;font-size:14px;color:#777;font-family:Arial,sans-serif;">
        Here are the <strong>${subjectLine}</strong> for your portfolio.
      </p>
    </div>

    <!-- Divider -->
    <div style="padding:0 40px;">
      <hr style="border:none;border-top:2px solid #f5c842;margin:20px 0;" />
    </div>

    <!-- Events -->
    <div style="padding:0 40px 8px;">
      ${events.map((e, i) => eventCard(e, i)).join("")}
    </div>

    <!-- CTA -->
    <div style="padding:20px 40px 32px;text-align:center;">
      <p style="margin:0 0 12px;font-size:13px;color:#888;font-family:Arial,sans-serif;">
        Not tracking the right stocks?
      </p>
      <a href="${holdingsEditUrl}" style="display:inline-block;padding:10px 20px;background:#1a1a2e;color:#f5c842;text-decoration:none;border-radius:6px;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;">
        Update my holdings
      </a>
    </div>

    <!-- Footer -->
    <div style="padding:20px 40px;border-top:1px solid #e8e4d9;font-family:Arial,sans-serif;font-size:11px;color:#aaa;text-align:center;line-height:1.7;">
      <p style="margin:0 0 6px;">
        You subscribed as <strong>${email}</strong> · <a href="${unsubscribeUrl}" style="color:#aaa;">Unsubscribe</a>
        · <a href="${appUrl}" style="color:#aaa;">Portfolio Coffee Mate</a>
      </p>
      <p style="margin:0;">
        For informational purposes only. Not financial advice.<br/>
        Past performance is not indicative of future results.
      </p>
    </div>
  </div>
</body>
</html>`;
}

export function digestEmailText(data: DigestEmailData): string {
  const { events, date, email, unsubscribeUrl } = data;
  const lines = [
    `☕ Portfolio Coffee Mate — ${date}`,
    "=".repeat(50),
    "",
  ];

  events.forEach((e, i) => {
    lines.push(`[${i + 1}] ${e.title}`);
    lines.push(e.summary);
    lines.push(`Impact: ${e.impactLevel} (${e.impactScore}/10)`);
    if (e.affectedHoldings.length > 0) {
      lines.push(`Affects: ${e.affectedHoldings.join(", ")}`);
    }
    lines.push(`Why: ${e.whyItMatters}`);
    lines.push(`Source: ${e.source} — ${e.url}`);
    lines.push("");
  });

  lines.push("-".repeat(50));
  lines.push(`Subscribed as: ${email}`);
  lines.push(`Unsubscribe: ${unsubscribeUrl}`);
  lines.push("For informational purposes only. Not financial advice.");

  return lines.join("\n");
}

// ============================================================
// Urgent Alert Email Template
// ============================================================

export interface UrgentEmailData {
  email: string;
  event: ScoredEvent;
  unsubscribeUrl: string;
  holdingsEditUrl: string;
  appUrl: string;
}

export function urgentEmailHtml(data: UrgentEmailData): string {
  const { event, email, unsubscribeUrl, holdingsEditUrl } = data;

  const affectedStr =
    event.affectedHoldings.length > 0
      ? `${event.affectedHoldings.join(", ")}${
          event.portfolioPctAffected > 0
            ? ` (~${event.portfolioPctAffected}% of your portfolio)`
            : ""
        }`
      : "Your portfolio";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Urgent Portfolio Alert</title>
</head>
<body style="margin:0;padding:0;background:#fff5f5;font-family:Georgia,'Times New Roman',serif;color:#2d2d2d;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-top:4px solid #dc2626;">

    <!-- Header -->
    <div style="padding:24px 40px;background:#fef2f2;border-bottom:1px solid #fecaca;">
      <p style="margin:0;font-size:13px;font-family:Arial,sans-serif;color:#dc2626;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">
        🚨 Urgent Portfolio Alert
      </p>
    </div>

    <!-- Body -->
    <div style="padding:32px 40px;">
      <h1 style="margin:0 0 12px;font-size:20px;color:#1a1a2e;line-height:1.4;">
        ${event.title}
      </h1>

      <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.7;font-family:Arial,sans-serif;">
        ${event.summary}
      </p>

      <div style="background:#faf9f6;border-left:4px solid #dc2626;padding:16px 20px;border-radius:0 8px 8px 0;margin:20px 0;">
        <p style="margin:0 0 4px;font-size:11px;font-family:Arial,sans-serif;color:#aaa;text-transform:uppercase;letter-spacing:1px;">Why this matters for you</p>
        <p style="margin:0;font-size:14px;color:#333;line-height:1.7;font-family:Arial,sans-serif;">${event.whyItMatters}</p>
      </div>

      <p style="margin:0 0 6px;font-size:13px;font-family:Arial,sans-serif;color:#666;">
        <strong>Affected holdings:</strong> ${affectedStr}
      </p>
      <p style="margin:0 0 20px;font-size:13px;font-family:Arial,sans-serif;color:#666;">
        <strong>Impact Score:</strong>
        <span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:bold;background:#fee2e2;color:#b91c1c;">
          ${event.impactLevel} &bull; ${event.impactScore}/10
        </span>
      </p>

      <p style="margin:0 0 4px;font-size:12px;font-family:Arial,sans-serif;color:#888;">
        Source: ${event.source}
      </p>
      <p style="margin:0;font-size:12px;font-family:Arial,sans-serif;">
        <a href="${event.url}" style="color:#1a6ed4;">Read full story →</a>
      </p>

      <hr style="border:none;border-top:1px solid #e8e4d9;margin:24px 0;" />

      <p style="margin:0;font-size:13px;color:#888;font-family:Arial,sans-serif;">
        This is an automated urgent alert. You receive these only when impact is high (score ≥ 8)
        and a holding is directly involved. <a href="${holdingsEditUrl}" style="color:#1a6ed4;">Update your holdings</a>
        to fine-tune your alerts.
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:16px 40px;border-top:1px solid #e8e4d9;font-family:Arial,sans-serif;font-size:11px;color:#aaa;text-align:center;">
      <p style="margin:0 0 4px;">
        Subscribed as <strong>${email}</strong> · <a href="${unsubscribeUrl}" style="color:#aaa;">Unsubscribe</a>
      </p>
      <p style="margin:0;">For informational purposes only. Not financial advice.</p>
    </div>
  </div>
</body>
</html>`;
}
