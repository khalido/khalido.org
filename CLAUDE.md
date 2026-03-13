# khalido.org

Personal website — blog posts, links, TILs, data stories, and interactive tools. Built with Astro 6, Svelte 5, Tailwind CSS v4, MDX. Hosted on GitHub Pages.

## Writing Policy

**The human writes all published prose.** LLMs assist with code, scripts, charts, data analysis, proofreading, and research — but never generate narrative content published under the author's name. Use `TODO: write this` as placeholder for content sections. When asked to help with a blog post, research the topic, suggest structure, provide data — but leave the writing to the human.

AI-generated explanatory text (e.g. describing how a component works) should use ` ```ai ` blocks so it renders with distinct styling.

## How to Help with Content

### Writing a blog post or TIL
- Use `.mdx` for posts that need components (CodeRunner, charts), `.md` otherwise
- Blog posts go in `src/content/blog/`, TILs in `src/content/blog/til/`
- Set `draft: true` until the human is ready to publish
- Research the topic, suggest an outline, provide code examples — don't write the prose

### Adding a live code block
Use CodeRunner in any `.mdx` file:
```mdx
import CodeRunner from '@components/CodeRunner.svelte';

<CodeRunner client:load code={`const data = [1, 2, 3];
console.log(data.reduce((a, b) => a + b));
`} />
```
- Built-in globals (no imports needed): `Plot`, `csvParse`, `tsvParse`, `autoType`, `Inputs`
- Return a DOM element for charts: `return Plot.plot({...})`
- `console.log()` output appears in a dark panel below
- `Inputs.slider(min, max, {value, label, step})`, `Inputs.select(options, {label})`, `Inputs.checkbox({label, value})`, `Inputs.text({label, placeholder})` — interactive controls that re-run the code block on change; values persist across re-renders
- Props: `collapsed` (hide code, show output), `title`, `caption`
- Code auto-runs on page load, is editable, has Run/Reset/Copy buttons

### Adding a chart in a data story
Data stories use colocated Svelte components:
```
src/content/data/<topic>/
├── index.mdx           # narrative + imports
└── _ChartName.svelte   # chart component (prefix with _)
```
- Charts use `client:only="svelte"` and dynamically import Plot in `onMount`
- Data JSON goes in `public/data/<topic>/` — must be in public/ for client-side fetch
- Fetch scripts go in `scripts/`

### Adding a link post
```yaml
---
date: 2026-03-10
link: https://example.com
tags: [topic]
type: link
draft: true
---
Commentary goes here.
```
Files go in `src/content/blog/links/`. Title is optional. See `docs/obsidian-link-clipper.md` for the capture workflow.

## Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Dev server at `localhost:4321` |
| `npm run build` | Build to `./dist/` |
| `FRED_API_KEY=xxx npx tsx scripts/fetch-fred.ts` | Fetch oil/gas/CPI data |

## Quick Queries

Use these grep patterns to answer common questions about content:

```bash
# List all draft posts
grep -rl 'draft: true' src/content/

# List all published posts (non-draft)
grep -rL 'draft: true' src/content/ --include='*.md' --include='*.mdx'

# Count posts by type
grep -rl 'type: link' src/content/blog/ | wc -l    # link posts
find src/content/blog/til -name '*.md' -o -name '*.mdx' | wc -l  # TILs

# Find posts by tag
grep -rl 'tags:' src/content/ -A5 | grep '  - python'

# List all tags used across the site
grep -rh '  - ' src/content/ --include='*.md' --include='*.mdx' | sort | uniq -c | sort -rn

# Find posts mentioning a topic (in body text)
grep -rl 'keema\|kebab' src/content/blog/

# List data stories
ls src/content/data/*/index.mdx
```

## Guidelines

- **Don't install packages** without asking
- **Don't upgrade packages** without asking — we're on Astro 6, upgrades can break things
- **Don't write prose** for the human (see Writing Policy above)
- Use context7 MCP to fetch current docs when needed
- Prefer editing existing files over creating new ones
- Svelte components in `src/pages/` must be prefixed with `_`
- `client:only="svelte"` components can't receive server-side props — use client-side fetch
- For architecture details, see `docs/architecture.md`

## Key Learnings

### When to use CodeRunner vs a dedicated Svelte component

| Use case | Approach |
| :--- | :--- |
| Quick chart in a blog post or TIL | **CodeRunner** (`collapsed`) — write Plot code inline in MDX, no component needed |
| Teaching code / data exploration | **CodeRunner** (visible) — readers can edit the code and re-run |
| Polished chart with annotations, multiple panels, resize handling | **Dedicated `_Chart.svelte`** with `client:only="svelte"` |
| Chart needing complex state, event handlers, or multiple data sources | **Dedicated component** — full Svelte reactivity |
| One-off chart you might not maintain | **CodeRunner** — self-contained, no component to update |
| Core chart for a data story page | **Dedicated component** — better control, ResizeObserver, loading states |

Both render client-side — Observable Plot needs browser DOM APIs, so Astro cannot pre-render either approach. The difference is developer ergonomics: CodeRunner is faster to write (just JS in MDX), dedicated components give more control (Svelte reactivity, lifecycle, resize, error handling).

### Where data goes

- **JSON for charts**: Always `public/data/<topic>/` — served as static files, fetchable via `fetch("/data/...")`
- **Colocated JSON in post folders does NOT work** — content collection files aren't served as static assets
- **External URLs work fine** — CodeRunner can fetch from any URL (GitHub raw, APIs, etc.)
- **Fetch scripts** go in `scripts/` and write to `public/data/`. Run manually, not on every build.

### Content file types

- `.md` — plain markdown, no components. Use for regular blog posts, links, quotes.
- `.mdx` — markdown + JSX. Required when importing Svelte components (CodeRunner, charts). Use for TILs with code blocks, data stories.
- Files prefixed with `_` are ignored by Astro's glob loader — use for colocated components and examples.

### Observable Plot + Astro

- `Plot.plot()` returns a DOM element — cannot SSR, always runs client-side
- Chart components must use `client:only="svelte"` (skip SSR) or `client:load` (SSR the wrapper, hydrate the chart)
- Dynamic `import("@observablehq/plot")` in `onMount` keeps Plot out of the server bundle
- CodeRunner loads Plot from the npm bundle (already installed); dedicated components do the same via dynamic import

### Shiki / syntax highlighting

- Astro uses Shiki by default — all ` ```lang ` blocks get syntax highlighting
- Custom languages via `langAlias` in `astro.config.mjs` (e.g. `ai → plaintext`)
- Shiki uses inline styles, not CSS classes — target with `pre.astro-code[data-language="..."]`
- Both `py` and `python` work for Python

## Tools (`src/pages/tools/`)

Tools are standalone interactive pages, not content collections. Each tool lives in its own folder under `src/pages/tools/` with an `index.astro` wrapper and `_Component.svelte` for the interactive parts.

### Adding a new tool

1. Create `src/pages/tools/<name>/index.astro` (Astro wrapper with BaseLayout)
2. Create `src/pages/tools/<name>/_ToolName.svelte` (prefixed with `_`, uses `client:only="svelte"`)
3. Add entry to `src/pages/tools/_ToolsList.svelte` — set `test: true` for experiments
4. If the tool needs an API key, use `getKey("provider")` from `@scripts/keystore`

### Available UI libraries

- **[Bits UI](https://bits-ui.com)** (`bits-ui`) — headless accessible Svelte 5 components. Already installed and used across tools. Key components in use:
  - `Command` — searchable command palette (model picker)
  - `Toggle` — on/off button (free filter, test filter)
  - `ToggleGroup` — segmented control for single/multi select (page/terminal mode)
  - `Combobox` — searchable single-select dropdown
  - Other available: Accordion, Dialog, Popover, Select, Slider, Tabs, Tooltip, etc.
  - **Important**: Bits UI components can't SSR — always use `client:only="svelte"`, not `client:load`
- **[svelte-streamdown](https://github.com/nicholascostadev/svelte-streamdown)** — markdown rendering for streamed LLM output. Props: `content`, `controls` (`{ table: false, code: false }` to hide buttons), `theme` for custom styling.

### Agent tools pattern (example: Oil Price Agent)

Browser-side agent chat using pi-agent + pi-ai + OpenRouter:

```
src/pages/tools/agent-test/
├── index.astro                    # page shell
└── _AgentTest.svelte              # wires agent + tools + UI

src/components/
├── AgentChat.svelte               # reusable chat UI (page + terminal modes)
└── ModelPicker.svelte             # model search with Command palette

src/lib/agent/tools/               # tool definitions
├── oil-prices.ts
├── oil-events.ts
└── oil-news.ts

public/data/oil/                   # static data fetched by tools
scripts/fetch-oil-news.ts          # data refresh script
```

- **pi-ai** (`@mariozechner/pi-ai`): LLM provider abstraction. `getModels("openrouter")` returns 237+ tool-calling models from an in-memory registry (no API call, no caching needed). `getModel(provider, id)` returns a model instance for the agent.
- **pi-agent-core** (`@mariozechner/pi-agent-core`): Agent runtime with conversation loop, tool execution, event system. `agent.subscribe()` for streaming events, `agent.prompt()` to send messages.
- **AgentChat.svelte**: Two modes — `"page"` (grows with content) and `"terminal"` (fixed dark box). Uses svelte-streamdown for markdown. Activity accordion groups thinking + tool calls between messages.
- **ModelPicker.svelte**: Bits UI Command palette with search. Shows model name, reasoning badge, cost. Free filter toggle built in.
- Tools fetch from `public/data/` (static JSON baked at deploy time, not live APIs).

## Future Work

- Fuzzy search (MiniSearch or Fuse.js) for title/tag/summary matching — or Pagefind for full-content search
- astro-embed integration for YouTube/Twitter embeds from URLs in MDX
- PyRunner component (Pyodide WASM for Python code blocks)
- Callout/admonition components (reference: Astro Starlight)

### Cloudflare Workers migration

Migrate from GitHub Pages to Cloudflare Workers to enable server-side features:
- **Why**: Server-side API keys (no client exposure), cron jobs for agents, Better Auth for users, spending limits
- **Architecture**: Astro on Cloudflare Workers with `/api/*` routes for auth/proxies
- **Auth**: Better Auth with per-user API key storage + global project key for shared tools
- **LLM tools**: Use OpenRouter or Gemini for cheap models, opinionated agentic tools (not generic chat)
- **Budget gating**: Allow ~$1/day per user on shared tools, then gate
- **Libraries**: [pi-ai](https://github.com/badlogic/pi-mono/tree/main/packages/ai) (lightweight multi-provider AI, works in browser + server, tool calling, streaming) + [pi-agent](https://github.com/badlogic/pi-mono/tree/main/packages/agent) (agent framework with conversation management, persistent storage)
- **Cron agents**: Auto-fetch RSS feeds and draft link posts, refresh data stories
- **Reference**: `~/code/pakairquality` for Cloudflare Workers setup, `docs/cloudflare.md` for full migration plan

### Context-aware page agents

Add a conversational agent layer to blog content using pi-agent + Cloudflare Workers:
- **Recipe pages**: "Cook mode" — agent knows the recipe, answers substitution/scaling/timing questions hands-free
- **TIL pages**: Agent has the current TIL as context + tools to search other TILs by tag/keyword + web search (Exa) for related content. "Didn't I write something about functools?" → finds and links your post
- **Data stories**: Ask questions about the charts — "what caused that spike in 2023?"
- **Code posts**: "Explain line 5" or "how would I modify this for CSV input?"
- **Pattern**: Page content = system prompt, agent tools = search your posts + search web. Blog becomes a personal knowledge graph with conversational interface.
- **Start with**: One recipe page + Cloudflare Worker + pi-agent as prototype
