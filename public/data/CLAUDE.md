# public/data/

Static JSON data files served as-is by the web server. Used by client-side chart components (`client:only="svelte"`) that fetch data via HTTP.

## Structure

```
public/data/
├── oil/              ← data for /data/oil story
│   ├── prices.json   ← fetched by scripts/fetch-fred.ts
│   └── events.json   ← hand-curated event annotations
├── gas/              ← data for future /data/gas story
└── ...
```

## Rules

- Subfolder names should match the corresponding data story or tool path
- JSON files are committed to the repo (small enough, ~15KB each)
- Updated manually via `scripts/` or via CI, NOT on every site build
- Accessible at `https://khalido.org/data/<subfolder>/<file>.json`
- Client components fetch these with `fetch("/data/oil/prices.json")`
