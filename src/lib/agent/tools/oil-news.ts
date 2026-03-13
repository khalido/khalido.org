import { Type } from "@sinclair/typebox";

/**
 * Oil news tool — reads pre-fetched news from /data/oil/news.json.
 *
 * Data is fetched by scripts/fetch-oil-news.ts (run manually or in CI):
 *   npx tsx scripts/fetch-oil-news.ts
 */
export const oilNewsTool = {
  name: "get_oil_news",
  label: "Oil News",
  description:
    "Get recent oil and energy news headlines. Returns titles, sources, dates, and summaries. Data is refreshed periodically, not live. Use to provide context on current events affecting oil markets.",
  parameters: Type.Object({
    count: Type.Optional(
      Type.Number({
        description: "Number of articles to return. Defaults to 10, max 20.",
      }),
    ),
    query: Type.Optional(
      Type.String({
        description:
          "Optional keyword to filter articles by. Matches against title and summary.",
      }),
    ),
  }),
  execute: async (
    _toolCallId: string,
    params: { count?: number; query?: string },
    signal?: AbortSignal,
  ) => {
    const res = await fetch("/data/oil/news.json", { signal });
    if (!res.ok) {
      throw new Error(
        "Oil news data not available. Run: npx tsx scripts/fetch-oil-news.ts",
      );
    }
    const data = await res.json();
    let articles = data.articles || [];

    // Filter by query if provided
    if (params.query) {
      const q = params.query.toLowerCase();
      articles = articles.filter(
        (a: any) =>
          a.title?.toLowerCase().includes(q) ||
          a.summary?.toLowerCase().includes(q),
      );
    }

    const count = Math.min(params.count || 10, 20);
    articles = articles.slice(0, count);

    if (articles.length === 0) {
      return {
        content: [{ type: "text" as const, text: "No matching news articles found." }],
        details: { count: 0 },
      };
    }

    const text = [
      `News fetched: ${data.fetchedAt || "unknown"}`,
      `Sources: ${data.sources?.join(", ") || "various"}`,
      "",
      ...articles.map(
        (a: any, i: number) =>
          `${i + 1}. ${a.title}\n   ${a.source} — ${a.date}\n   ${a.summary || ""}`,
      ),
    ].join("\n");

    return {
      content: [{ type: "text" as const, text }],
      details: { count: articles.length, total: (data.articles || []).length },
    };
  },
};
