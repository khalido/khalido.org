# Cloudflare Workers Migration

Reference doc for migrating khalido.org from GitHub Pages to Cloudflare Workers.

## Current Setup

- Domain: `khalido.org` already on Cloudflare DNS
- Account: Paid Workers plan ($5/mo)
- Site: Static on GitHub Pages

## Why Migrate

- Server-side API keys (no client exposure)
- Cron jobs for agents (auto-fetch RSS, refresh data)
- Better Auth for user accounts + per-user API key storage
- Sessions via Workers KV
- Budget gating on LLM tools (~$1/day per user)
- `astro dev` uses workerd runtime in Astro 6 — dev matches prod

## Key Architecture Decisions

- **Default to pre-rendered** (`output: 'static'` or hybrid) — blog posts, data stories, tag pages are all static
- **SSR only for tool pages** that need server-side API calls — use `export const prerender = false` per-page
- **API keys**: `wrangler secret put OPENROUTER_KEY` for server-side, localStorage for user-provided keys
- **Sessions**: Workers KV (eventually consistent, up to 60s globally) — fine for tool state, not for real-time

## Setup Steps

```bash
npx astro add cloudflare           # adds @astrojs/cloudflare adapter
npm install wrangler@latest -D     # CLI for deploy/dev
```

### astro.config.mjs

```js
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  // ... existing config
  adapter: cloudflare(),
  output: 'static',  // default static, opt-in SSR per page
});
```

### wrangler.jsonc

```json
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "khalido-org",
  "main": "@astrojs/cloudflare/entrypoints/server",
  "compatibility_date": "2026-03-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": { "binding": "ASSETS", "directory": "./dist" },
  "vars": {},
  "kv_namespaces": [
    { "binding": "SESSION", "id": "<create-via-wrangler>" }
  ]
}
```

### Deploy

```bash
npx astro build && npx wrangler deploy
```

Or use Workers Builds (beta) for auto-deploy on git push.

## Accessing Cloudflare APIs

```js
// Environment variables & bindings (Astro 6+)
import { env } from 'cloudflare:workers';
const key = env.OPENROUTER_KEY;
const kv = env.MY_KV;

// Request metadata
const country = Astro.request.cf?.country;

// Sessions (auto-backed by KV)
const cart = await Astro.session?.get('cart');
await Astro.session?.set('cart', updatedCart);
```

## Hybrid Rendering

Most pages stay pre-rendered (static). Opt specific pages into SSR:

```astro
---
// src/pages/tools/chat/index.astro
export const prerender = false;
---
```

Good candidates for SSR:
- `/tools/*` pages that call LLM APIs server-side
- `/api/*` endpoints for tool backends
- Auth pages

## Bindings Available

| Binding | Use case |
|---------|----------|
| KV | Sessions, user preferences, API key storage |
| D1 | SQLite database (link post analytics, usage tracking) |
| R2 | Object storage (uploaded images, generated content) |
| AI | Cloudflare Workers AI (built-in models, no API key needed) |
| Cron | Scheduled agents (RSS fetcher, data refresher) |

## Gotchas

- `astro dev` in Astro 6 uses workerd runtime — much closer to prod, but some Node packages may fail
- Disable Cloudflare Auto Minify to avoid hydration mismatches
- No filesystem access in Workers — use KV/D1/R2 instead
- CommonJS dependencies may need Vite pre-compilation
- `@astrojs/cloudflare` v13+ required for Astro 6
- KV sessions are eventually consistent (not instant globally)

## Useful Links

- [Astro Cloudflare deploy guide](https://docs.astro.build/en/guides/deploy/cloudflare/)
- [Astro Cloudflare adapter docs](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Wrangler CLI docs](https://developers.cloudflare.com/workers/wrangler/)
- [Workers KV](https://developers.cloudflare.com/kv/)
- [D1 SQLite](https://developers.cloudflare.com/d1/)
- [Workers AI](https://developers.cloudflare.com/workers-ai/)
- [Better Auth](https://www.better-auth.com/)

## Libraries to Consider

- [pi-ai](https://github.com/badlogic/pi-mono/tree/main/packages/ai) — lightweight multi-provider AI (browser + server, tool calling, streaming)
- [pi-agent](https://github.com/badlogic/pi-mono/tree/main/packages/agent) — agent framework with persistent storage
- [Bits UI](https://bits-ui.com/) — headless Svelte components for tool UIs
- [nanostores](https://github.com/nanostores/nanostores) — cross-island state (Astro recommended)
