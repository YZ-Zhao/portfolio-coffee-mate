// ============================================================
// Scoring Engine — Heuristic + optional LLM abstraction
// ============================================================

import { NewsArticle } from "./news";

export interface Holding {
  ticker: string;
  weightPct?: number | null;
}

export interface ScoredEvent {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  // Generated fields
  summary: string;           // 1-2 sentence plain-language summary
  whyItMatters: string;      // <=120 words, layman-friendly
  affectedHoldings: string[]; // tickers mentioned or indirectly affected
  portfolioPctAffected: number; // sum of weights of affected holdings
  impactScore: number;       // 1-10
  impactLevel: "Low" | "Moderate" | "High";
  isUrgent: boolean;
}

// ============================================================
// Macro keyword → affected tickers/sectors dictionary
// ============================================================
const MACRO_IMPACTS: Record<string, { sectors: string[]; description: string }> = {
  "federal reserve": { sectors: ["bonds", "reits", "financials"], description: "rate-sensitive assets" },
  "interest rate": { sectors: ["bonds", "reits", "financials"], description: "rate-sensitive assets" },
  "inflation": { sectors: ["bonds", "consumer"], description: "purchasing power & fixed income" },
  "cpi": { sectors: ["bonds", "consumer"], description: "inflation-linked assets" },
  "treasury": { sectors: ["bonds", "bnd", "tlt", "aggy"], description: "bond holdings" },
  "oil": { sectors: ["energy", "xle", "transportation"], description: "energy & transport costs" },
  "opec": { sectors: ["energy", "xle"], description: "oil & energy stocks" },
  "recession": { sectors: ["cyclicals", "industrials"], description: "economically sensitive stocks" },
  "pmi": { sectors: ["industrials", "materials"], description: "manufacturing-exposed stocks" },
  "gdp": { sectors: ["broad market"], description: "overall portfolio" },
  "unemployment": { sectors: ["consumer", "financials"], description: "consumer spending & banking" },
  "dollar": { sectors: ["international", "exporters"], description: "currency-exposed holdings" },
  "china": { sectors: ["technology", "consumer", "semiconductors"], description: "Asia-exposed stocks" },
  "tariff": { sectors: ["technology", "consumer", "industrials"], description: "import-heavy sectors" },
};

// Common ETF / broad market tickers
const BROAD_ETFs = ["VTI", "VOO", "SPY", "QQQ", "IWM", "VT", "VXUS"];
const BOND_ETFs = ["BND", "AGG", "TLT", "IEF", "SHY", "LQD", "HYG"];

// ============================================================
// Heuristic scoring
// ============================================================

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

function extractDirectTickers(text: string, holdings: Holding[]): string[] {
  const upper = text.toUpperCase();
  return holdings
    .map((h) => h.ticker.toUpperCase())
    .filter((t) => {
      // Match ticker as whole word (surrounded by non-alpha or start/end)
      const regex = new RegExp(`(?<![A-Z])${t}(?![A-Z])`, "g");
      return regex.test(upper);
    });
}

function extractMacroImpacts(text: string, holdings: Holding[]): string[] {
  const lower = normalizeText(text);
  const affectedTickers: Set<string> = new Set();

  for (const [keyword, impact] of Object.entries(MACRO_IMPACTS)) {
    if (!lower.includes(keyword)) continue;

    // Check if any holding matches the sectors
    for (const holding of holdings) {
      const ticker = holding.ticker.toUpperCase();
      const inSector = impact.sectors.some((s) => {
        return (
          ticker.includes(s.toUpperCase()) ||
          BROAD_ETFs.includes(ticker) ||
          (s === "bonds" && BOND_ETFs.includes(ticker))
        );
      });
      if (inSector || BROAD_ETFs.includes(ticker)) {
        affectedTickers.add(ticker);
      }
    }
  }

  return Array.from(affectedTickers);
}

function computeImpactScore(
  directTickers: string[],
  macroTickers: string[],
  holdings: Holding[],
  text: string
): number {
  let score = 0;

  if (directTickers.length > 0) {
    score += 7;
  } else if (macroTickers.length > 0) {
    score += 3;
  }

  // Bonus for sector/company mention
  const allAffected = new Set([...directTickers, ...macroTickers]);
  const totalWeight = holdings
    .filter((h) => allAffected.has(h.ticker.toUpperCase()) && h.weightPct != null)
    .reduce((sum, h) => sum + (h.weightPct ?? 0), 0);

  // +up to 3 based on portfolio weight exposure
  const weightBonus = Math.min(3, totalWeight / 10);
  score += weightBonus;

  // Shock keywords
  const lower = normalizeText(text);
  const shockKeywords = [
    "surge", "plunge", "crash", "soar", "record", "beats", "misses",
    "bankruptcy", "recall", "investigation", "fine", "layoffs", "downgrade",
    "upgrade", "merger", "acquisition", "ipo", "guidance cut", "guidance raise",
  ];
  const shockCount = shockKeywords.filter((k) => lower.includes(k)).length;
  score += Math.min(2, shockCount * 0.5);

  return Math.round(Math.min(10, Math.max(1, score)));
}

function impactLevel(score: number): "Low" | "Moderate" | "High" {
  if (score >= 7) return "High";
  if (score >= 4) return "Moderate";
  return "Low";
}

function generateSummary(article: NewsArticle): string {
  // Use first sentence(s) of description as plain-language summary
  const text = article.description || article.title;
  const sentences = text.split(/(?<=[.!?])\s+/);
  return sentences.slice(0, 2).join(" ").trim();
}

function generateWhyItMatters(
  article: NewsArticle,
  affectedHoldings: string[],
  holdings: Holding[]
): string {
  const lower = normalizeText(article.title + " " + article.description);
  let why = "";

  if (affectedHoldings.length > 0) {
    const totalWeight = holdings
      .filter((h) => affectedHoldings.includes(h.ticker.toUpperCase()))
      .reduce((s, h) => s + (h.weightPct ?? 0), 0);

    why += `This event directly involves ${affectedHoldings.slice(0, 3).join(", ")}${
      totalWeight > 0 ? ` (about ${Math.round(totalWeight)}% of your portfolio)` : ""
    }. `;
  }

  // Add macro context
  for (const [keyword, impact] of Object.entries(MACRO_IMPACTS)) {
    if (lower.includes(keyword)) {
      why += `Changes in ${keyword} typically affect your ${impact.description}. `;
      break;
    }
  }

  // Generic fallback
  if (!why) {
    why = "This market development could affect the broader economy and your investments. ";
  }

  why += "Monitor your positions and consider how this fits your long-term investment plan.";

  // Trim to ~120 words
  const words = why.split(" ");
  return words.slice(0, 110).join(" ") + (words.length > 110 ? "..." : "");
}

// ============================================================
// LLM mode (OpenAI / Anthropic)
// ============================================================

async function summarizeWithLLM(
  articles: NewsArticle[],
  holdings: Holding[]
): Promise<ScoredEvent[] | null> {
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!openaiKey && !anthropicKey) return null;

  const holdingsStr = holdings
    .map((h) => `${h.ticker}${h.weightPct ? ` (${h.weightPct}%)` : ""}`)
    .join(", ");

  const articlesStr = articles
    .slice(0, 10)
    .map((a, i) => `[${i + 1}] ${a.title}\n${a.description}`)
    .join("\n\n");

  const prompt = `You are a calm financial news summarizer for retail investors.
A user holds: ${holdingsStr}

Here are today's top news articles:
${articlesStr}

For each relevant article (pick the 2-5 most relevant to the portfolio), return a JSON array with objects:
{
  "index": <article index>,
  "summary": "<1-2 sentence plain-language summary, no jargon>",
  "whyItMatters": "<max 120 words, layman-friendly explanation of why this matters for the portfolio>",
  "affectedHoldings": ["<ticker>"],
  "impactScore": <1-10>,
  "impactLevel": "Low|Moderate|High",
  "isUrgent": <boolean — true only if score >= 8 AND direct holding shock>
}

Only include articles relevant to these holdings. Return valid JSON array only.`;

  try {
    if (openaiKey) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });

      if (!res.ok) return null;
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content ?? "";
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]) as Array<{
        index: number;
        summary: string;
        whyItMatters: string;
        affectedHoldings: string[];
        impactScore: number;
        impactLevel: "Low" | "Moderate" | "High";
        isUrgent: boolean;
      }>;

      return parsed
        .filter((p) => articles[p.index - 1])
        .map((p) => {
          const article = articles[p.index - 1];
          const totalWeight = holdings
            .filter((h) => (p.affectedHoldings ?? []).includes(h.ticker.toUpperCase()))
            .reduce((s, h) => s + (h.weightPct ?? 0), 0);

          return {
            ...article,
            summary: p.summary,
            whyItMatters: p.whyItMatters,
            affectedHoldings: p.affectedHoldings ?? [],
            portfolioPctAffected: Math.round(totalWeight),
            impactScore: p.impactScore,
            impactLevel: p.impactLevel,
            isUrgent: p.isUrgent ?? false,
          };
        });
    }

    if (anthropicKey) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 2000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!res.ok) return null;
      const data = await res.json();
      const content = data.content?.[0]?.text ?? "";
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]) as Array<{
        index: number;
        summary: string;
        whyItMatters: string;
        affectedHoldings: string[];
        impactScore: number;
        impactLevel: "Low" | "Moderate" | "High";
        isUrgent: boolean;
      }>;

      return parsed
        .filter((p) => articles[p.index - 1])
        .map((p) => {
          const article = articles[p.index - 1];
          const totalWeight = holdings
            .filter((h) => (p.affectedHoldings ?? []).includes(h.ticker.toUpperCase()))
            .reduce((s, h) => s + (h.weightPct ?? 0), 0);

          return {
            ...article,
            summary: p.summary,
            whyItMatters: p.whyItMatters,
            affectedHoldings: p.affectedHoldings ?? [],
            portfolioPctAffected: Math.round(totalWeight),
            impactScore: p.impactScore,
            impactLevel: p.impactLevel,
            isUrgent: p.isUrgent ?? false,
          };
        });
    }
  } catch (err) {
    console.error("[scoring] LLM error:", err);
  }

  return null;
}

// ============================================================
// Main export: summarizeAndScore
// ============================================================

export async function summarizeAndScore(
  articles: NewsArticle[],
  holdings: Holding[]
): Promise<ScoredEvent[]> {
  // Try LLM first
  const llmResults = await summarizeWithLLM(articles, holdings);
  if (llmResults && llmResults.length > 0) {
    console.log(`[scoring] LLM mode: scored ${llmResults.length} events`);
    return llmResults;
  }

  // Heuristic fallback
  console.log("[scoring] Heuristic mode");

  const scored: ScoredEvent[] = articles
    .map((article) => {
      const text = article.title + " " + article.description + " " + (article.content ?? "");
      const directTickers = extractDirectTickers(text, holdings);
      const macroTickers = extractMacroImpacts(text, holdings);
      const allAffected = [...new Set([...directTickers, ...macroTickers])];

      const impactScore = computeImpactScore(directTickers, macroTickers, holdings, text);
      const level = impactLevel(impactScore);

      const totalWeight = holdings
        .filter((h) => allAffected.includes(h.ticker.toUpperCase()))
        .reduce((s, h) => s + (h.weightPct ?? 0), 0);

      const isUrgent =
        impactScore >= 8 &&
        (directTickers.length > 0 ||
          normalizeText(text).match(
            /crash|plunge|bankruptcy|recall|emergency|halt|suspended|fraud/
          ) !== null);

      return {
        ...article,
        summary: generateSummary(article),
        whyItMatters: generateWhyItMatters(article, allAffected, holdings),
        affectedHoldings: allAffected,
        portfolioPctAffected: Math.round(totalWeight),
        impactScore,
        impactLevel: level,
        isUrgent,
      };
    })
    .filter((e) => e.impactScore >= 2) // Skip completely irrelevant
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 5); // Top 5

  return scored;
}
