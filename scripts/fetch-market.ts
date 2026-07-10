/**
 * Fetches live market quotes + news headlines via yahoo-finance2 and writes
 * to public/data/market/market.json. Generic: add any Yahoo Finance symbol
 * (futures, stocks, ETFs, FX) to SYMBOLS and any search topic to NEWS_TOPICS.
 *
 * Usage:
 *   npx tsx scripts/fetch-market.ts
 *
 * No API key needed. Run manually or via .github/workflows/refresh-market.yml
 * (hourly cron) — the browser can't call Yahoo directly (no CORS), so this
 * script is the "live with ~1h staleness" layer for agent tools.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import YahooFinance from "yahoo-finance2";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "public", "data", "market");

const SYMBOLS: { symbol: string; label: string }[] = [
  { symbol: "CL=F", label: "WTI Crude Oil" },
  { symbol: "BZ=F", label: "Brent Crude Oil" },
];

const NEWS_TOPICS = ["crude oil", "energy markets"];
const NEWS_PER_TOPIC = 6;

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

interface Quote {
  symbol: string;
  label: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  marketState: string;
  marketTime: string;
}

interface Headline {
  title: string;
  link: string;
  publisher: string;
  date: string;
}

async function fetchQuotes(): Promise<Quote[]> {
  const quotes: Quote[] = [];
  for (const { symbol, label } of SYMBOLS) {
    const q = await yf.quote(symbol);
    quotes.push({
      symbol,
      label,
      name: q.shortName ?? symbol,
      price: q.regularMarketPrice ?? 0,
      change: q.regularMarketChange ?? 0,
      changePercent: q.regularMarketChangePercent ?? 0,
      currency: q.currency ?? "USD",
      marketState: q.marketState ?? "UNKNOWN",
      marketTime: q.regularMarketTime
        ? new Date(q.regularMarketTime).toISOString()
        : "",
    });
    console.log(`  ${label} (${symbol}): ${q.regularMarketPrice} ${q.currency}`);
  }
  return quotes;
}

async function fetchNews(): Promise<Headline[]> {
  const seen = new Set<string>();
  const headlines: Headline[] = [];
  for (const topic of NEWS_TOPICS) {
    const res = await yf.search(topic, { newsCount: NEWS_PER_TOPIC, quotesCount: 0 });
    for (const n of res.news ?? []) {
      if (seen.has(n.link)) continue;
      seen.add(n.link);
      headlines.push({
        title: n.title,
        link: n.link,
        publisher: n.publisher,
        date: n.providerPublishTime ? new Date(n.providerPublishTime).toISOString() : "",
      });
    }
  }
  headlines.sort((a, b) => b.date.localeCompare(a.date));
  console.log(`  ${headlines.length} headlines`);
  return headlines;
}

async function main() {
  console.log("Fetching quotes...");
  const quotes = await fetchQuotes();
  console.log("Fetching news...");
  const news = await fetchNews();

  mkdirSync(DATA_DIR, { recursive: true });
  const out = { fetchedAt: new Date().toISOString(), quotes, news };
  writeFileSync(join(DATA_DIR, "market.json"), JSON.stringify(out, null, 2));
  console.log(`Wrote ${join(DATA_DIR, "market.json")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
