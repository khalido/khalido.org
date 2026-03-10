/**
 * Fetches energy price, inflation, and spending data from the FRED API.
 *
 * API docs: https://fred.stlouisfed.org/docs/api/fred/
 * API keys: https://fredaccount.stlouisfed.org/apikeys
 * Series observations: https://fred.stlouisfed.org/docs/api/fred/series_observations.html
 *
 * Data sources:
 *   Oil (Brent = global benchmark, prices ~80% of world oil):
 *     - POILBREUSDM: Brent Crude Monthly (USD/bbl) https://fred.stlouisfed.org/series/POILBREUSDM
 *     - DCOILBRENTEU: Brent Crude Daily (USD/bbl) https://fred.stlouisfed.org/series/DCOILBRENTEU
 *   Inflation:
 *     - CPIAUCSL: CPI All Urban Consumers (monthly) https://fred.stlouisfed.org/series/CPIAUCSL
 *   Energy spending (for % of consumer spending):
 *     - DNRGRC1M027SBEA: Personal consumption on energy (monthly, $B) https://fred.stlouisfed.org/series/DNRGRC1M027SBEA
 *     - PCE: Total personal consumption expenditure (monthly, $B) https://fred.stlouisfed.org/series/PCE
 *   Gas:
 *     - DHHNGSP: Henry Hub Natural Gas Spot (daily) https://fred.stlouisfed.org/series/DHHNGSP
 *
 * Usage:
 *   npx tsx scripts/fetch-fred.ts          # reads FRED_API_KEY from .env
 *   FRED_API_KEY=xxx npx tsx scripts/fetch-fred.ts  # or pass directly
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "public", "data");

// Load .env file if it exists
const envPath = join(__dirname, "..", ".env");
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (key && rest.length > 0 && !process.env[key]) {
      process.env[key] = rest.join("=");
    }
  }
}

const API_KEY = process.env.FRED_API_KEY;
if (!API_KEY) {
  console.error("Error: FRED_API_KEY is required");
  console.error("Set it in .env or pass as: FRED_API_KEY=xxx npx tsx scripts/fetch-fred.ts");
  console.error("Get a free key at: https://fredaccount.stlouisfed.org/apikeys");
  process.exit(1);
}

const FRED_BASE = "https://api.stlouisfed.org/fred/series/observations";

interface DataPoint {
  date: string;
  value: number | null;
}

async function fetchSeries(
  seriesId: string,
  opts: { start?: string; frequency?: string } = {}
): Promise<DataPoint[]> {
  const url = new URL(FRED_BASE);
  url.searchParams.set("series_id", seriesId);
  url.searchParams.set("api_key", API_KEY!);
  url.searchParams.set("file_type", "json");
  if (opts.start) url.searchParams.set("observation_start", opts.start);
  if (opts.frequency) url.searchParams.set("frequency", opts.frequency);

  console.log(`[fetch] ${seriesId} (${opts.frequency || "native"}) from ${opts.start || "beginning"}...`);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`FRED API error for ${seriesId}: ${res.status} ${res.statusText}`);

  const data = await res.json();
  return data.observations.map((obs: { date: string; value: string }) => ({
    date: obs.date,
    value: obs.value === "." ? null : parseFloat(obs.value),
  }));
}

async function fetchYahooDaily(symbol: string, days: number) {
  const { default: YahooFinance } = await import("yahoo-finance2");
  const yahooFinance = new YahooFinance();
  const period1 = new Date(Date.now() - days * 86400000);
  console.log(`[fetch] Yahoo Finance: ${symbol} daily from ${period1.toISOString().split("T")[0]}...`);
  const result = await yahooFinance.chart(symbol, {
    period1,
    interval: "1d" as const,
  });
  return result.quotes.map((q: any) => ({
    date: q.date.toISOString().split("T")[0],
    open: q.open ? parseFloat(q.open.toFixed(2)) : null,
    high: q.high ? parseFloat(q.high.toFixed(2)) : null,
    low: q.low ? parseFloat(q.low.toFixed(2)) : null,
    close: q.close ? parseFloat(q.close.toFixed(2)) : null,
    volume: q.volume,
  }));
}

async function main() {
  // Fetch all data in parallel
  const [brent, brentDaily, cpi, energySpend, totalPce, gas] = await Promise.all([
    fetchSeries("DCOILBRENTEU", { frequency: "m" }), // Brent daily aggregated to monthly (FRED, from 1987)
    fetchYahooDaily("BZ=F", 365),                // Brent daily OHLC, last year (Yahoo)
    fetchSeries("CPIAUCSL"),                     // CPI monthly, all history
    fetchSeries("DNRGRC1M027SBEA"),              // Energy spending, monthly
    fetchSeries("PCE"),                          // Total consumer spending, monthly
    fetchSeries("DHHNGSP", { start: new Date(Date.now() - 365 * 86400000).toISOString().split("T")[0] }),
  ]);

  // Latest CPI for inflation adjustment
  const latestCpi = cpi.filter((d) => d.value !== null).at(-1);
  console.log(`[info] Latest CPI: ${latestCpi?.value} (${latestCpi?.date})`);

  // Compute energy as % of consumer spending
  const pceMap = new Map(totalPce.filter((d) => d.value !== null).map((d) => [d.date, d.value!]));
  const energyPctPce = energySpend
    .filter((d) => d.value !== null && pceMap.has(d.date))
    .map((d) => ({
      date: d.date,
      value: parseFloat(((d.value! / pceMap.get(d.date)!) * 100).toFixed(2)),
    }));
  console.log(`[info] Energy as % of PCE: ${energyPctPce.length} obs, latest: ${energyPctPce.at(-1)?.value}%`);

  // Write shared CPI
  const cpiData = {
    cpi,
    latestCpiDate: latestCpi?.date,
    latestCpiValue: latestCpi?.value,
    fetchedAt: new Date().toISOString(),
  };
  writeFileSync(join(DATA_DIR, "cpi.json"), JSON.stringify(cpiData, null, 2));
  console.log(`[write] cpi.json (${cpi.length} obs)`);

  // Write oil data
  const oilData = {
    brent,
    brentDaily,
    energyPctPce,
    fetchedAt: new Date().toISOString(),
  };
  mkdirSync(join(DATA_DIR, "oil"), { recursive: true });
  writeFileSync(join(DATA_DIR, "oil", "prices.json"), JSON.stringify(oilData, null, 2));
  console.log(`[write] oil/prices.json (Brent monthly: ${brent.length}, daily OHLC: ${brentDaily.length}, energyPctPce: ${energyPctPce.length})`);

  // Write gas data
  mkdirSync(join(DATA_DIR, "gas"), { recursive: true });
  writeFileSync(join(DATA_DIR, "gas", "prices.json"), JSON.stringify({ henryHub: gas, fetchedAt: new Date().toISOString() }, null, 2));
  console.log(`[write] gas/prices.json (${gas.length} obs)`);

  console.log("[done] Data updated successfully");
}

main().catch((err) => {
  console.error("[error]", err);
  process.exit(1);
});
