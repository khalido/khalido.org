/**
 * Fetches oil/energy news from RSS feeds and writes to public/data/oil/news.json.
 *
 * Usage:
 *   npx tsx scripts/fetch-oil-news.ts
 *
 * No API keys needed — all feeds are public RSS.
 * RSS is parsed with simple regex (no dependencies needed).
 *
 * Sources:
 *   - EIA Today in Energy: https://www.eia.gov/rss/todayinenergy.xml
 *   - OilPrice.com: https://oilprice.com/rss/main
 *   - Oil & Gas Journal: https://www.ogj.com/__rss/website-scheduled-content.xml
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "public", "data", "oil");

interface Article {
  title: string;
  link: string;
  date: string;
  summary: string;
  source: string;
}

const FEEDS: { url: string; source: string }[] = [
  {
    url: "https://www.eia.gov/rss/todayinenergy.xml",
    source: "EIA",
  },
  {
    url: "https://oilprice.com/rss/main",
    source: "OilPrice.com",
  },
  {
    url: 'https://www.ogj.com/__rss/website-scheduled-content.xml?input=%7B%22sectionAlias%22%3A%22general-interest%22%7D',
    source: "Oil & Gas Journal",
  },
];

/** Extract text content between XML tags. Returns empty string if not found. */
function xmlText(item: string, tag: string): string {
  // Handle CDATA: <tag><![CDATA[content]]></tag>
  const cdataMatch = item.match(
    new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`),
  );
  if (cdataMatch) return cdataMatch[1].trim();

  // Handle regular: <tag>content</tag>
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return match ? match[1].trim() : "";
}

/** Strip HTML tags from a string */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Parse an RSS feed XML string into articles */
function parseRss(xml: string, source: string): Article[] {
  const items: Article[] = [];
  const itemMatches = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];

  for (const itemXml of itemMatches) {
    const title = stripHtml(xmlText(itemXml, "title"));
    const link = xmlText(itemXml, "link");
    const pubDate = xmlText(itemXml, "pubDate");
    const description = stripHtml(xmlText(itemXml, "description")).slice(0, 300);

    if (!title) continue;

    // Normalize date to ISO
    let date = "";
    if (pubDate) {
      try {
        date = new Date(pubDate).toISOString().split("T")[0];
      } catch {
        date = pubDate;
      }
    }

    items.push({ title, link, date, summary: description, source });
  }

  return items;
}

async function fetchFeed(feed: { url: string; source: string }): Promise<Article[]> {
  console.log(`[fetch] ${feed.source}: ${feed.url}`);
  try {
    const res = await fetch(feed.url, {
      headers: {
        "User-Agent": "khalido.org/1.0 (oil news aggregator)",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
    });
    if (!res.ok) {
      console.warn(`[warn] ${feed.source}: HTTP ${res.status}`);
      return [];
    }
    const xml = await res.text();
    const articles = parseRss(xml, feed.source);
    console.log(`[info] ${feed.source}: ${articles.length} articles`);
    return articles;
  } catch (err: any) {
    console.warn(`[warn] ${feed.source}: ${err.message}`);
    return [];
  }
}

async function main() {
  // Fetch all feeds in parallel
  const results = await Promise.all(FEEDS.map(fetchFeed));
  const allArticles = results.flat();

  // Sort by date (newest first), deduplicate by title
  const seen = new Set<string>();
  const articles = allArticles
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .filter((a) => {
      const key = a.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  const data = {
    articles,
    sources: FEEDS.map((f) => f.source),
    fetchedAt: new Date().toISOString(),
  };

  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(join(DATA_DIR, "news.json"), JSON.stringify(data, null, 2));
  console.log(`[write] oil/news.json (${articles.length} articles from ${FEEDS.length} sources)`);
  console.log("[done]");
}

main().catch((err) => {
  console.error("[error]", err);
  process.exit(1);
});
