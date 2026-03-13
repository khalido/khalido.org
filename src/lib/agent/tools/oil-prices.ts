import { Type } from "@sinclair/typebox";

export const oilPriceTool = {
  name: "get_oil_prices",
  label: "Oil Prices",
  description:
    "Fetch Brent crude oil prices. Has monthly averages (back to 1987) and daily OHLC (recent). Use period='daily' for current/recent prices, 'monthly' for long-term trends. Returns date and price in USD/barrel. Defaults to last 30 entries.",
  parameters: Type.Object({
    period: Type.Optional(
      Type.String({
        description:
          "'daily' for recent daily OHLC prices, 'monthly' for monthly averages. Defaults to 'daily'.",
      }),
    ),
    count: Type.Optional(
      Type.Number({
        description: "Number of recent entries to return. Defaults to 30.",
      }),
    ),
  }),
  execute: async (
    _toolCallId: string,
    params: { period?: string; count?: number },
    signal?: AbortSignal,
  ) => {
    const res = await fetch("/data/oil/prices.json", { signal });
    const data = await res.json();
    const count = params.count || 30;
    const useDaily = (params.period || "daily") === "daily";
    let text: string;
    let entries: any[];
    if (useDaily && data.brentDaily) {
      entries = data.brentDaily.slice(-count);
      text = entries
        .map(
          (d: any) =>
            `${d.date}: open=$${d.open} high=$${d.high} low=$${d.low} close=$${d.close}`,
        )
        .join("\n");
    } else {
      entries = data.brent
        .filter((d: any) => d.value !== null)
        .slice(-count);
      text = entries.map((d: any) => `${d.date}: $${d.value}`).join("\n");
    }
    const fetchedAt = data.fetchedAt || "unknown";
    text = `Data fetched: ${fetchedAt}\n\n${text}`;
    return {
      content: [{ type: "text" as const, text }],
      details: { count: entries.length, period: useDaily ? "daily" : "monthly" },
    };
  },
};
