# Changelog

Notable changes to the khalido.org site itself — features, fixes, upgrades, tooling.
Blog posts and content edits are not tracked here; the [RSS feed](https://khalido.org/rss.xml)
is the content changelog. New site sections or tools do count.

Format based on [Keep a Changelog](https://keepachangelog.com/en/2.0.0/). Versioning is
**CalVer**: `vYYYY.MM.DD` (a second release the same day appends `.1`, `.2`). The tag
marks a period, not an API contract. History before this file starts lives in
[git log](https://github.com/khalido/khalido.org/commits/main).

## [Unreleased]

### Added

- Post filter niceties: `/` focuses the search box, Esc clears it, and the query
  syncs to the URL (`?q=`) so a filtered view is shareable and survives reload.
- `CHANGELOG.md` (this file) and a `/release` skill for cutting CalVer releases.
- `:::ai` container directive — AI-written blocks with full markdown (links, lists),
  same faint styling + "AI" badge as ` ```ai ` fences.

### Changed

- Markdown now renders single newlines as `<br>` (Obsidian/GitHub style) via a
  custom Sätteri mdast plugin; plain `.md` files moved off the MDX pipeline onto
  Astro 7's native Rust markdown processor.
- Tighter prose spacing: lists sit closer to the paragraph that introduces them.
- Migrated the Oil Price Agent tool from `@mariozechner/pi-agent-core`/`pi-ai` (v0.60)
  to `@earendil-works/pi-agent-core`/`pi-ai` (v0.80.3), adapting to the new model
  registry (`getBuiltinModel(s)`) and agent state API.
- Upgraded Astro 6 → 7 (Rust compiler, Vite 8/Rolldown) — full build dropped from
  ~5.4s to ~1.8s. Also @astrojs/mdx 5 → 7, @astrojs/svelte 8 → 9, astro-embed 0.13.
- Deploy workflow bumped to withastro/action v6 (Node 24, required by Astro 7) and
  actions/deploy-pages v5.
- All dependencies updated (Tailwind 4.3, Svelte 5.56, bits-ui 2.18, TypeScript 6 —
  TS 7 blocked by @astrojs/svelte peer range).
- Added LayerChart 2.0 (Svelte 5 native charts) with a test page at
  `/tools/layerchart-test` — candidate to replace Observable Plot in dedicated
  chart components.

- Agent chat: Stop button (aborts the run via `agent.abort()`), live status while
  the model thinks ("thinking… N chars" / "running tool…"), and errors from failed
  runs now surface instead of failing silently.
- Agent model list is now fetched live from OpenRouter (1-hour localStorage cache,
  builtin registry as offline fallback) — new models like grok-4.5 appear without
  a pi-ai update. Switching models mid-response aborts the current run first;
  Stop also clears queued messages.
- Reusable model-selection pair: `src/lib/agent/openrouter-models.ts`
  (`getOpenRouterModels()`, `getOpenRouterModel(id)`) and `ORModelPicker.svelte`,
  a self-contained picker that loads the live list and emits full pi Model objects.
- Market data: `scripts/fetch-market.ts` (yahoo-finance2 quotes + headlines →
  `public/data/market/market.json`, run manually before deploys) and a
  `get_market_quotes` agent tool. Yahoo has no CORS, so the browser reads a
  static JSON snapshot rather than calling Yahoo directly.
- Reasoning models now actually think: `thinkingLevel` is set to "medium" for
  reasoning-capable models (was silently "off" for all). pi audit fixes: no error
  banner when a model swap aborts a run; phantom "thinking" after `agent_end`
  fixed; tool status shows args and parallel tool counts; elapsed seconds shown.

- Agent chat shows a discreet "model · N tools" line (hover for tool names).
- Research Agent (`/tools/research-agent`) — web version of kotools' `ko agent
  research`: paper search + citation graph (OpenAlex), Hacker News discussion
  (Algolia), trending ML (HF Daily Papers), and URL reading (jina reader). All
  CORS-verified public APIs, runs browser-side with your own OpenRouter key.
  Post-test upgrades from agent feedback: `hn_front_page` tool (current front
  page in one call), `days` + `sort='date'` search params, date shown first in
  results, URL/title cross-reference search documented; agent pages widened.

- Agent-facing site: `/llms.txt` index (llmstxt.org format) and a markdown twin
  for every post at `/blog/<id>.md`. URLs are now slashless (`/blog/foo` not
  `/blog/foo/`) so each page pairs with its `.md`; old trailing-slash links 404
  by design (URL stability is a non-goal here).

- Big Text: screen wake lock while fullscreen or showing a clock/countdown (the
  display never sleeps mid-use), controls bar and cursor auto-hide in fullscreen
  after 3s idle, `f` toggles fullscreen.
- Big Text mobile: faux-fullscreen fallback for iOS Safari (no element-fullscreen
  API there), tap-anywhere-to-type via a display-covering invisible textarea (the
  old zero-size one couldn't summon the iOS keyboard), `100dvh` heights, and
  safe-area padding for the home indicator.

- Timezone converter: the two hand-rolled searchable dropdowns replaced with
  bits-ui Combobox — keyboard navigation, proper aria, no blur-timing hacks.

### Fixed

- Big Text: tap/click on the (invisible) input could place the caret mid-text,
  making typed characters insert out of order ("mirrored" text) — caret now
  snaps to end on focus/click.
- Post pages and RSS now use the post's `summary` as description — both read a
  nonexistent `description` field before, so every page shipped the generic
  site tagline.
- Unwall: removed dead services (12ft.io is shut down, Google Cache is
  discontinued — verified both); Wayback links now go to latest snapshot and
  the all-snapshots calendar. Big Text: fullscreen listener cleaned up on unmount.

- Post meta line ("posted … tagged: …") and footer rendered with words glued
  together under Astro 7's JSX whitespace rules — explicit spaces added.

### Removed

- Dead components `Tags.astro` and `Plot.astro`, unused `tw-animate-css`
  dependency, and a leftover shadcn-svelte `components.json`.

[Unreleased]: https://github.com/khalido/khalido.org/commits/main
