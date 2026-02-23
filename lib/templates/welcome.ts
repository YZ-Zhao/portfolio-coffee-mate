// ============================================================
// Welcome Email Template
// ============================================================

export interface WelcomeEmailData {
  email: string;
  tickers: string[];
  appUrl: string;
  unsubscribeUrl: string;
  holdingsEditUrl: string;
}

export function welcomeEmailHtml(data: WelcomeEmailData): string {
  const { email, tickers, appUrl, unsubscribeUrl, holdingsEditUrl } = data;
  const tickerList = tickers.length > 0 ? tickers.join(", ") : "None yet — you can add them anytime.";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Portfolio Coffee Mate</title>
  <style>
    body { margin: 0; padding: 0; background: #faf9f6; font-family: Georgia, 'Times New Roman', serif; color: #2d2d2d; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; }
    .header { background: #1a1a2e; padding: 32px 40px; text-align: center; }
    .header h1 { color: #f5c842; margin: 0; font-size: 22px; font-weight: normal; letter-spacing: 1px; }
    .header p { color: #a8a8c0; margin: 8px 0 0; font-size: 14px; font-family: Arial, sans-serif; }
    .body { padding: 40px; }
    .greeting { font-size: 18px; margin-bottom: 16px; }
    p { line-height: 1.7; font-size: 15px; color: #3a3a3a; margin: 0 0 16px; }
    .holdings-box { background: #f5f5ef; border-left: 4px solid #f5c842; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 24px 0; font-family: Arial, sans-serif; }
    .holdings-box h3 { margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #888; }
    .holdings-box p { margin: 0; font-size: 15px; font-weight: bold; color: #1a1a2e; }
    .example-box { border: 1px solid #e8e4d9; border-radius: 8px; padding: 24px; margin: 24px 0; background: #faf9f6; }
    .example-box h3 { margin: 0 0 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #aaa; font-family: Arial, sans-serif; }
    .event-card { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e8e4d9; }
    .event-card:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .event-title { font-size: 15px; font-weight: bold; color: #1a1a2e; margin: 0 0 6px; }
    .event-summary { font-size: 14px; color: #555; margin: 0 0 8px; font-family: Arial, sans-serif; }
    .event-meta { font-family: Arial, sans-serif; font-size: 12px; color: #888; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; margin-right: 6px; }
    .badge-high { background: #fee2e2; color: #b91c1c; }
    .badge-moderate { background: #fef3c7; color: #b45309; }
    .badge-low { background: #d1fae5; color: #047857; }
    .btn { display: inline-block; padding: 12px 24px; background: #1a1a2e; color: #f5c842 !important; text-decoration: none; border-radius: 6px; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; margin: 8px 4px; }
    .footer { padding: 24px 40px; border-top: 1px solid #e8e4d9; font-family: Arial, sans-serif; font-size: 12px; color: #aaa; text-align: center; line-height: 1.6; }
    .footer a { color: #aaa; }
    a { color: #1a6ed4; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>☕ Portfolio Coffee Mate</h1>
      <p>Your calm morning portfolio brief</p>
    </div>

    <div class="body">
      <p class="greeting">Welcome aboard! ☕</p>

      <p>
        You're all set to receive your personalized morning portfolio brief — a short, calm email
        that tells you exactly what financial news actually matters to your holdings, in plain English.
        No jargon. No noise.
      </p>

      <div class="holdings-box">
        <h3>Your tracked holdings</h3>
        <p>${tickerList}</p>
      </div>

      <p>
        Each morning (around your chosen send time), you'll get an email that looks like this:
      </p>

      <div class="example-box">
        <h3>Example Morning Brief</h3>

        <div class="event-card">
          <p class="event-title">NVIDIA reports record quarterly earnings, beats analyst estimates</p>
          <p class="event-summary">NVDA posted quarterly revenue of $36B, surpassing Wall Street expectations as AI chip demand continued to surge.</p>
          <p class="event-meta">
            <span class="badge badge-high">High ● 9/10</span>
            Affects: <strong>NVDA</strong> (15% of your portfolio)
          </p>
        </div>

        <div class="event-card">
          <p class="event-title">10-year Treasury yield climbs to 4.6% amid inflation concerns</p>
          <p class="event-summary">Bond prices fell as investors repriced rate cut expectations following hotter-than-expected CPI data.</p>
          <p class="event-meta">
            <span class="badge badge-moderate">Moderate ● 5/10</span>
            Affects: <strong>BND</strong> (25% of your portfolio)
          </p>
        </div>
      </div>

      <p>
        <strong>Urgent alerts</strong> are sent only when something truly significant happens —
        like a major earnings shock, a regulatory action, or a sudden large price move in one
        of your holdings. They're designed to be <em>rare</em>, so when you get one, it matters.
      </p>

      <p>You can update your holdings or preferences at any time:</p>

      <p>
        <a href="${holdingsEditUrl}" class="btn">Edit My Holdings</a>
      </p>

      <p>
        If you have any questions, just reply to this email.
      </p>

      <p>See you tomorrow morning. ☕</p>
    </div>

    <div class="footer">
      <p>
        You subscribed as <strong>${email}</strong> at <a href="${appUrl}">${appUrl.replace(/https?:\/\//, "")}</a>.<br/>
        <a href="${unsubscribeUrl}">Unsubscribe</a> · <a href="${holdingsEditUrl}">Edit holdings</a>
      </p>
      <p>For informational purposes only. Not financial advice.<br/>
      Past performance is not indicative of future results.</p>
    </div>
  </div>
</body>
</html>`;
}

export function welcomeEmailText(data: WelcomeEmailData): string {
  const { email, tickers, unsubscribeUrl, holdingsEditUrl } = data;
  return `Welcome to Portfolio Coffee Mate! ☕

You're subscribed as: ${email}
Tracked holdings: ${tickers.length > 0 ? tickers.join(", ") : "None yet"}

Each morning you'll receive a short, calm email with 2-5 news events relevant to your portfolio — in plain English, no jargon.

Urgent alerts are only sent for truly high-impact events. They're rare by design.

Edit your holdings: ${holdingsEditUrl}

---
For informational purposes only. Not financial advice.
Unsubscribe: ${unsubscribeUrl}
`;
}
