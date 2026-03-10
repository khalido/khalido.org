# khalido.org

Personal website — blog posts, data stories, interactive tools, and TILs.

## Stack

Astro 6 (beta), Svelte 5, Tailwind CSS v4, MDX. Static site deployed to GitHub Pages.

## Content

Three content types in a unified feed:

- **Blog posts** (`src/content/blog/`) — long-form writing, recipes, notes
- **Links** (`src/content/blog/links/`) — short commentary on interesting URLs (`type: link`)
- **Data stories** (`src/content/data/`) — interactive charts and narratives using Observable Plot
- **Tools** (`src/pages/tools/`) — standalone interactive utilities

TILs are blog posts tagged `til`, often using the CodeRunner component for live JavaScript.

## Key components

- **CodeRunner** (`src/components/CodeRunner.svelte`) — editable, runnable JS blocks with syntax highlighting. Built-in globals: `Plot`, `csvParse`, `tsvParse`, `autoType`. Auto-runs on page load. Use `collapsed` prop to show just the output.
- **Observable Plot charts** — used in data stories via Svelte `client:only` components
- **LLM content blocks** — use ` ```llm ` in markdown for AI-generated text, styled distinctly from human writing

## Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Dev server at `localhost:4321` |
| `npm run build` | Build to `./dist/` |
| `FRED_API_KEY=xxx npx tsx scripts/fetch-fred.ts` | Fetch oil/gas/CPI data |

## Structure

```
src/
├── components/        # Astro + Svelte components (CodeRunner, ContentList, etc.)
├── content/
│   ├── blog/          # Posts, links, TILs (content collection)
│   │   ├── links/     # Link posts (clipped via Obsidian)
│   │   └── til/       # TILs with live code
│   └── data/          # Data stories (MDX + colocated _*.svelte charts)
├── layouts/           # BaseLayout, BlogPost
├── pages/             # Routes (blog/, data/, tags/, tools/)
├── scripts/           # Content utilities
└── styles/            # Tailwind v4 global CSS
public/data/           # Static JSON for charts (fetched client-side)
scripts/               # Data-fetching scripts (FRED API, Yahoo Finance)
docs/                  # Setup guides (Obsidian clipper, etc.)
```
