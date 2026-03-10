# Oil Price Data Story

## Data Sources

- **Monthly Brent crude**: FRED API (`DCOILBRENTEU`) — back to 1987
- **Daily Brent OHLC**: Yahoo Finance (`BZ=F`) — last 12 months
- **CPI for inflation adjustment**: FRED API (`CPIAUCSL`)
- **Events/annotations**: Hand-curated in `public/data/oil/events.json`

## Data Files

| File | Source | Notes |
|---|---|---|
| `public/data/oil/prices.json` | FRED + Yahoo Finance | Monthly + daily prices |
| `public/data/oil/events.json` | Manual | Key oil market events for chart annotations |
| `public/data/cpi.json` | FRED | US CPI data for inflation adjustment |

## How to Refresh Data

```bash
FRED_API_KEY=xxx npx tsx scripts/fetch-fred.ts
```

Requires `FRED_API_KEY` env var (free from https://fred.stlouisfed.org/docs/api/api_key.html). See `.env.example`.

## Chart Components

- `_OilPriceChart.svelte` — two charts:
  1. **Long-term**: Monthly Brent, inflation-adjusted to current USD using CPI. Area + line chart with event annotations.
  2. **Recent**: Last 30 days daily OHLC candlestick. Green/red coloring, shows period change.

## Adding Events

Edit `public/data/oil/events.json`. Each entry:
```json
{"date": "2024-01-15", "y": 80, "anchor": "top", "label": "Description"}
```
- `y`: approximate price level to anchor the tooltip
- `anchor`: "top" or "bottom" — which side of the point the label appears
