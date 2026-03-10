# Architecture

## Tech Stack

- **Framework**: Astro 6 beta, Vite 7, Zod 4
- **Interactivity**: Svelte 5 via @astrojs/svelte
- **Styling**: Tailwind CSS v4 (CSS-based config, no tailwind.config.js)
- **Charts**: Observable Plot via Svelte `client:only` components
- **Content**: Markdown (.md) and MDX (.mdx) with content collections
- **Package manager**: npm
- **Hosting**: GitHub Pages (static site, deployed via GitHub Actions)

## Content Collections

Defined in `src/content.config.ts`:

### Blog (`src/content/blog/`)
- Glob loader: `**/[^_]*.{md,mdx}` (files prefixed with `_` are ignored)
- Types: `post` (default), `link`, `video`
- Title is optional (link posts may omit it)
- Subfolders for organization: `links/`, `til/`, `recipes/`, `code/`, `books/`, etc.

### Data Stories (`src/content/data/`)
- Glob loader: `**/index.mdx`
- Each story is a folder with `index.mdx` + colocated `_*.svelte` chart components + `CLAUDE.md` for data/refresh docs
- Charts use `client:only="svelte"` for client-side rendering
- Data JSON in `public/data/<topic>/` fetched client-side
- Non-`index.mdx` files (like `CLAUDE.md`, `_*.svelte`) are ignored by the glob loader

## Page Routing

- `src/pages/index.astro` — unified feed (blog + data, sorted by date) with tag cloud sidebar
- `src/pages/blog/[...id].astro` — blog post pages
- `src/pages/data/[...id].astro` — data story pages
- `src/pages/tags/[tag].astro` — single tag pages with client-side related tag filtering
- `src/pages/tags/index.astro` — all tags with counts
- `src/pages/tools/<name>/index.astro` — standalone tool pages

## Layout

- `BaseLayout.astro` — HTML shell with compact header strip (site title + nav: about, tags, tools), breadcrumbs, footer
- `BlogPost.astro` — wraps BaseLayout, adds prose width, TOC sidebar, title/date/tags
- Header is content-width aligned with yellow background strip
- Body is white, content max-width scales from 3xl to 5xl

## Search & Filtering

- `ContentList.astro` — used on homepage, tag pages, and blog index
- Client-side text filter: multi-word search across title, tags, summary, preview
- Client-side tag filtering: tag page buttons dispatch `toggle-tag-filter` events
- Each `<li>` has `data-search` (text) and `data-tags` (comma-separated) attributes
- No external search library — pure DOM filtering, instant for ~100 posts

## Shared Utilities

- `src/scripts/content.ts` — `filterDrafts`, `getPreview`, `sortByDate`, `getAllTags`, `getAllTagsFromCollections`, `getAllTagsWithCounts`
- `src/scripts/tagUtils.ts` — `getRelatedTags`

## Data Pipeline

Static JSON in `public/data/` is fetched client-side by chart components.
Fetching scripts in `scripts/` run manually or via CI (not on every build).

- `scripts/fetch-fred.ts` — FRED API (oil, CPI, energy spending) + Yahoo Finance (daily OHLC)
- Writes to `public/data/oil/prices.json`, `public/data/cpi.json`, `public/data/gas/prices.json`
- API keys in `.env` (gitignored), template in `.env.example`
- Each data story folder has a `CLAUDE.md` documenting its data sources and refresh process

## Components

### CodeRunner (`src/components/CodeRunner.svelte`)
Live editable JavaScript blocks. Uses `client:load`.
- Syntax highlighting via highlight.js (loaded from CDN, JS grammar only)
- Built-in globals: `Plot` (Observable Plot, from npm), `csvParse`/`tsvParse`/`autoType` (d3-dsv, from CDN)
- Auto-runs on mount, captures console output, renders DOM elements (charts)
- Props: `code`, `lang`, `collapsed`, `title`, `caption`

### LLM Content Blocks
Use ` ```llm ` in markdown. Shiki renders with `data-language="llm"` (configured via `langAlias` in astro.config.mjs). Styled in `global.css` with faint background and "AI" badge.

## Known Issues

- Astro 6 beta: occasional HMR errors on hot reload (transient, not from our code)
- `@astrojs/rss` must stay on beta (4.0.15-beta.4) — stable release uses Zod 3 API incompatible with Astro 6's Zod 4
