// ============================================================
// News Fetching — NewsAPI + RSS stub fallback
// ============================================================

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  content?: string;
}

// Stub articles used when no API key is configured
const STUB_ARTICLES: NewsArticle[] = [
  {
    title: "Federal Reserve holds interest rates steady, signals cautious outlook",
    description:
      "The Federal Reserve kept its benchmark interest rate unchanged on Wednesday, citing persistent inflation concerns and a resilient labor market. Fed Chair Jerome Powell indicated the committee will remain data-dependent before making any cuts.",
    url: "https://example.com/fed-rates",
    source: "Reuters",
    publishedAt: new Date().toISOString(),
    content:
      "The Federal Open Market Committee voted unanimously to maintain the federal funds rate target range. Inflation remains above the 2% target. Markets had largely priced in the hold.",
  },
  {
    title: "NVIDIA reports record quarterly earnings, beats analyst estimates",
    description:
      "NVIDIA Corp posted quarterly revenue of $36 billion, surpassing Wall Street expectations as AI chip demand continued to surge. The company raised its forward guidance.",
    url: "https://example.com/nvda-earnings",
    source: "Bloomberg",
    publishedAt: new Date().toISOString(),
    content:
      "NVDA shares rose 8% in after-hours trading. Data center segment revenue hit $30.8 billion. CEO Jensen Huang cited unprecedented demand for Blackwell GPUs.",
  },
  {
    title: "Oil prices fall 4% on rising OPEC+ production signals",
    description:
      "Crude oil futures dropped sharply after reports that OPEC+ members are considering increasing output quotas at their next meeting, adding supply pressure to an already oversupplied market.",
    url: "https://example.com/oil-opec",
    source: "Wall Street Journal",
    publishedAt: new Date().toISOString(),
    content:
      "WTI crude fell to $72 per barrel. Energy stocks broadly declined. Analysts say higher oil supply could benefit transportation and consumer discretionary sectors.",
  },
  {
    title: "Apple announces major iPhone software update with AI features",
    description:
      "Apple unveiled iOS enhancements powered by Apple Intelligence, its on-device AI system, expanding features to more languages and devices. Analysts expect the update to accelerate upgrade cycles.",
    url: "https://example.com/aapl-ai",
    source: "CNBC",
    publishedAt: new Date().toISOString(),
    content:
      "AAPL rose 2% on the news. The update is available immediately for iPhone 16 and later. New writing tools, image generation, and Siri improvements are included.",
  },
  {
    title: "10-year Treasury yield climbs to 4.6% amid inflation concerns",
    description:
      "US Treasury yields rose as investors repriced rate cut expectations following hotter-than-expected CPI data. Bond prices fell, impacting rate-sensitive sectors like real estate and utilities.",
    url: "https://example.com/treasury-yields",
    source: "MarketWatch",
    publishedAt: new Date().toISOString(),
    content:
      "The benchmark 10-year yield hit its highest level in three months. Bond-heavy ETFs such as BND and TLT fell around 1%. REITs and dividend stocks also declined.",
  },
  {
    title: "Amazon expands same-day delivery to 15 new cities, pressuring competitors",
    description:
      "Amazon announced a major logistics expansion targeting suburban markets, increasing same-day delivery coverage by 30%. The move is expected to pressure brick-and-mortar retailers.",
    url: "https://example.com/amzn-logistics",
    source: "Financial Times",
    publishedAt: new Date().toISOString(),
    content:
      "AMZN stock rose 1.5%. Walmart and Target shares dipped slightly on competitive concern. Amazon's delivery network now reaches 120 million US households.",
  },
  {
    title: "Vanguard Total Stock Market ETF sees record inflows as investors buy the dip",
    description:
      "VTI attracted over $2.3 billion in net inflows this week as retail investors took advantage of a broad market pullback, signaling sustained confidence in long-term index investing.",
    url: "https://example.com/vti-inflows",
    source: "ETF.com",
    publishedAt: new Date().toISOString(),
    content:
      "Passive index funds continue to dominate retail investor flows. VTI is now the second-largest ETF by assets under management. Year-to-date performance remains positive.",
  },
  {
    title: "Recession fears rise as manufacturing PMI falls below 50 for third month",
    description:
      "The ISM Manufacturing PMI came in at 48.5, below the 50 threshold that separates expansion from contraction, fueling concerns about an economic slowdown in the goods sector.",
    url: "https://example.com/pmi-recession",
    source: "Reuters",
    publishedAt: new Date().toISOString(),
    content:
      "New orders subindex was the weakest component. Cyclical stocks such as industrials and materials declined. Defensive sectors — utilities, healthcare — outperformed.",
  },
];

async function fetchFromNewsAPI(tickers: string[]): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];

  const query = tickers.length > 0 ? tickers.slice(0, 5).join(" OR ") : "stock market economy";

  const url = new URL("https://newsapi.org/v2/everything");
  url.searchParams.set("q", query);
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("language", "en");
  url.searchParams.set("pageSize", "20");
  url.searchParams.set("apiKey", apiKey);

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.articles) return [];

    return (data.articles as Record<string, string>[]).map((a) => ({
      title: a.title ?? "",
      description: a.description ?? "",
      url: a.url ?? "",
      source: (a.source as unknown as { name: string })?.name ?? "Unknown",
      publishedAt: a.publishedAt ?? new Date().toISOString(),
      content: a.content ?? "",
    }));
  } catch {
    return [];
  }
}

export async function fetchNews(tickers: string[]): Promise<NewsArticle[]> {
  // Try real API first
  const real = await fetchFromNewsAPI(tickers);
  if (real.length > 0) return real;

  // Fall back to stub data (good for local dev / demo)
  console.log("[news] No NEWS_API_KEY found — using stub articles");
  return STUB_ARTICLES;
}
