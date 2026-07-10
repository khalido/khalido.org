import { Type } from "@earendil-works/pi-ai";

/**
 * Market quotes + headlines from /data/market/market.json — a snapshot
 * written by scripts/fetch-market.ts (run manually before deploys).
 * Generic — covers whatever symbols the script is configured with.
 */
export const marketQuotesTool = {
  name: "get_market_quotes",
  label: "Market Quotes",
  description:
    "Get recent market prices (WTI and Brent crude futures) with change and market state, plus recent news headlines. Data is a snapshot — always mention its fetchedAt timestamp. Use this for 'current price' questions; use get_oil_prices for historical trends.",
  parameters: Type.Object({
    includeNews: Type.Optional(
      Type.Boolean({
        description: "Also return recent market news headlines. Defaults to true.",
      }),
    ),
  }),
  execute: async (
    _toolCallId: string,
    params: { includeNews?: boolean },
    signal?: AbortSignal,
  ) => {
    const res = await fetch("/data/market/market.json", { signal });
    const data = await res.json();

    const lines = data.quotes.map(
      (q: any) =>
        `${q.label} (${q.symbol}): $${q.price} ${q.currency} ` +
        `(${q.change >= 0 ? "+" : ""}${q.change.toFixed(2)}, ${q.changePercent.toFixed(2)}%) ` +
        `market ${q.marketState}, as of ${q.marketTime}`,
    );

    let text = `Data fetched: ${data.fetchedAt}\n\n${lines.join("\n")}`;
    if (params.includeNews !== false && data.news?.length) {
      const headlines = data.news
        .slice(0, 8)
        .map((n: any) => `- ${n.title} (${n.publisher}, ${n.date.slice(0, 10)})`)
        .join("\n");
      text += `\n\nRecent headlines:\n${headlines}`;
    }

    return {
      content: [{ type: "text" as const, text }],
      details: { count: data.quotes.length, fetchedAt: data.fetchedAt },
    };
  },
};
