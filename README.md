# ☕ Portfolio Coffee Mate

> Start your morning with what actually affects your investments.
> Personalized to your holdings. Simple explanations. Calm, low-noise alerts.

A simple habit product: a daily email that summarizes the 2–5 most relevant financial news events for each subscriber's specific holdings — in plain English, no jargon, with impact scores.

---

## Features

- **Landing page** with subscribe form (email + optional tickers + weights)
- **Personalized daily brief** — top news events scored and explained per subscriber
- **Impact scoring** (1–10) with heuristic fallback or LLM (OpenAI / Anthropic)
- **Urgent alerts** (score ≥ 8, direct holding shock) — rare by design, max 1/day
- **Holdings edit page** — update tickers anytime via magic link in email
- **Unsubscribe** — one-click, token-based
- **Email provider abstraction** — Resend (primary), SendGrid (fallback), console (dev)
- **News source abstraction** — NewsAPI (primary), curated stub data (fallback)

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Database | SQLite via Prisma 7 |
| Email | Resend (or SendGrid) |
| News | NewsAPI (or stub articles) |
| LLM | OpenAI `gpt-4o-mini` or Anthropic `claude-haiku` (optional) |
| Scheduler | Vercel Cron / GitHub Actions / local `node-cron` |

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Edit `.env` and fill in your keys:

```
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Email (pick one)
RESEND_API_KEY=""
EMAIL_FROM="Portfolio Coffee Mate <hello@yourdomain.com>"

# LLM summarization (optional — heuristic fallback if empty)
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""

# News (optional — stub articles if empty)
NEWS_API_KEY=""

# Cron endpoint protection (optional)
CRON_SECRET=""
```

Key variables:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | `file:./dev.db` (SQLite) |
| `NEXT_PUBLIC_APP_URL` | Yes | Your app URL, e.g. `http://localhost:3000` |
| `RESEND_API_KEY` | Recommended | Free key at [resend.com](https://resend.com) |
| `EMAIL_FROM` | Recommended | Sender address |
| `NEWS_API_KEY` | Optional | From [newsapi.org](https://newsapi.org) — falls back to stub articles |
| `OPENAI_API_KEY` | Optional | LLM summarization — falls back to heuristic |
| `ANTHROPIC_API_KEY` | Optional | Alternative LLM (used if OpenAI key absent) |
| `CRON_SECRET` | Optional | Shared secret to protect `/api/cron` |

> **No API keys needed to get started.** The app uses stub articles and heuristic scoring as fallbacks, and logs emails to the console in dev mode.

### 3. Set up the database

```bash
npm run db:migrate    # Creates dev.db and runs migrations
```

### 4. Seed the database (dev/testing)

```bash
npm run db:seed
```

Creates a test subscriber `test@example.com` with holdings (NVDA:15%, VTI:40%, BND:25%, AAPL:10%, AMZN:10%) and prints magic links for testing.

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll see the landing page.

---

## Manually Trigger the Daily Digest

**Option A — Script (local):**

```bash
npm run digest
```

**Option B — API endpoint (server running):**

```bash
curl -X POST http://localhost:3000/api/cron
# With CRON_SECRET set:
curl -X POST http://localhost:3000/api/cron \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Option C — Local scheduler (keeps running, 8 AM daily):**

```bash
npm run scheduler
# Override schedule:
CRON_SCHEDULE="0 9 * * *" npm run scheduler
```

---

## Deploying

### Vercel (recommended)

1. Push to GitHub and connect to Vercel.
2. Set all environment variables in the Vercel dashboard.
3. `vercel.json` triggers `/api/cron` daily at 1:00 PM UTC — adjust as needed.
4. Vercel Cron requires a **Pro** plan.

### GitHub Actions (free alternative)

Set repository secrets: `APP_URL` and `CRON_SECRET`.

The workflow at `.github/workflows/digest.yml` triggers at 8:00 AM UTC daily and can be manually triggered from the GitHub Actions UI.

---

## Project Structure

```
portfolio-coffee-mate/
├── app/
│   ├── page.tsx                  # Landing page + subscribe form
│   ├── unsubscribe/page.tsx      # Unsubscribe confirmation
│   ├── holdings/page.tsx         # Holdings edit page (magic link)
│   └── api/
│       ├── subscribe/route.ts    # POST: create subscriber + send welcome email
│       ├── unsubscribe/route.ts  # GET: unsubscribe by token
│       ├── holdings/route.ts     # GET/PUT: fetch + update holdings
│       └── cron/route.ts         # POST/GET: trigger daily digest
├── lib/
│   ├── prisma.ts                 # Prisma client singleton
│   ├── news.ts                   # News fetching (NewsAPI + stub fallback)
│   ├── scoring.ts                # Impact scoring (heuristic + LLM abstraction)
│   ├── email.ts                  # Email provider wrapper (Resend / SendGrid / console)
│   ├── digest.ts                 # Daily digest job — core orchestration logic
│   ├── tokens.ts                 # Unsubscribe + holdings magic link tokens
│   └── templates/
│       ├── welcome.ts            # Welcome email (HTML + plain text)
│       └── digest.ts             # Daily brief + urgent alert (HTML + plain text)
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Auto-generated migrations
├── scripts/
│   ├── seed.ts                   # Dev seed data
│   ├── run-digest.ts             # One-shot digest runner
│   └── scheduler.ts              # Local cron scheduler (node-cron)
├── .github/workflows/
│   └── digest.yml                # GitHub Actions daily trigger
├── vercel.json                   # Vercel Cron config
└── .env                          # Environment variables (do not commit)
```

---

## Database Schema

| Model | Key fields |
|---|---|
| `Subscriber` | email, isActive, timezone, sendTime, wantsUrgentAlerts |
| `Holding` | subscriberId, ticker, weightPct (optional) |
| `DeliveryLog` | subscriberId, type (DAILY/URGENT), status, sentAt, errorMessage |
| `UnsubscribeToken` | subscriberId, token (used for magic links) |

---

## Impact Scoring Logic

| Rule | Points |
|---|---|
| Direct ticker mention in article | +7 |
| Sector/macro keyword match (rates, oil, inflation…) | +3 |
| Portfolio weight exposure | +min(3, weight/10) |
| Shock keywords (crash, surge, bankruptcy, etc.) | +0.5–2 |
| **Total clamped to 1–10** | |

| Score | Level |
|---|---|
| 1–3 | Low |
| 4–6 | Moderate |
| 7–10 | High |

**Urgent alert triggers** when: score ≥ 8 AND (direct holding mentioned OR shock keyword). Rate-limited to 1 per subscriber per day.

If `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` is set, the LLM rewrites summaries and scores in natural language — otherwise the heuristic engine runs.

---

## Legal

For informational purposes only. Not financial advice. Past performance is not indicative of future results. Always consult a qualified financial advisor before making investment decisions.
