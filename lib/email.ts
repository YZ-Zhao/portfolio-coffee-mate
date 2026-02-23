// ============================================================
// Email Provider Wrapper — Resend (primary) / SendGrid (fallback)
// ============================================================

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

async function sendViaResend(options: SendEmailOptions): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { success: false, error: "No RESEND_API_KEY" };

  const from = process.env.EMAIL_FROM ?? "Portfolio Coffee Mate <noreply@example.com>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    }),
  });

  const data = await res.json() as { id?: string; message?: string; name?: string; error?: { message?: string } };
  if (!res.ok) {
    const msg = data.message ?? data.error?.message ?? JSON.stringify(data);
    console.error("[email] Resend API error:", msg);
    return { success: false, error: msg };
  }
  return { success: true, id: data.id };
}

async function sendViaSendGrid(options: SendEmailOptions): Promise<EmailResult> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) return { success: false, error: "No SENDGRID_API_KEY" };

  const from = process.env.EMAIL_FROM ?? "noreply@example.com";

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: options.to }] }],
      from: { email: from },
      subject: options.subject,
      content: [{ type: "text/html", value: options.html }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { success: false, error: text };
  }
  return { success: true };
}

async function sendViaConsole(options: SendEmailOptions): Promise<EmailResult> {
  // Dev fallback: just log the email
  console.log("\n========== [DEV EMAIL] ==========");
  console.log(`TO: ${options.to}`);
  console.log(`SUBJECT: ${options.subject}`);
  console.log("HTML (first 500 chars):", options.html.slice(0, 500));
  console.log("=================================\n");
  return { success: true, id: "dev-console-" + Date.now() };
}

export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  // Try Resend first
  if (process.env.RESEND_API_KEY) {
    return sendViaResend(options);
  }

  // Try SendGrid
  if (process.env.SENDGRID_API_KEY) {
    return sendViaSendGrid(options);
  }

  // Dev mode: log to console
  return sendViaConsole(options);
}
