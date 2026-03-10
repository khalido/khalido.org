# scripts/

Standalone data-fetching scripts. **Not part of Astro** — these run manually or in CI.

## Pattern

Each script fetches data from an external API and writes JSON to `public/data/<topic>/`.

## Usage

```bash
# Fetch oil/gas price data from FRED API
FRED_API_KEY=your_key npx tsx scripts/fetch-fred.ts
```

## Rules

- Scripts write to `public/data/` so the JSON is available both at build time and via client-side fetch
- Use subfolders matching the data story path: `public/data/oil/`, `public/data/gas/`, etc.
- Handle missing values (FRED uses "." for missing) — convert to `null`
- Include a `fetchedAt` timestamp in the output JSON
- API keys come from environment variables, never hardcoded
- Keep output JSON small — daily data for 5 years is ~15KB, which is fine
