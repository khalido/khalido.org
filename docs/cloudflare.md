# Cloudflare Workers Migration

Migrating khalido.org from GitHub Pages to Cloudflare Workers. Enables server-side API proxies, auth, cron jobs, and gated access to paid services (LLMs, search). Agent features run client-side (see `docs/agent.md`); Workers provides the secure backend.

## Current Setup

- Domain: `khalido.org` already on Cloudflare DNS
- Account: Paid Workers plan ($5/mo)
- Site: Static on GitHub Pages
- Agent features: client-side with pi-agent + OpenRouter (see `docs/agent.md`)
- Reference project: `~/code/pakairquality` (Astro 6 + Cloudflare Workers, D1, SSR)

## Architecture

Everything is one Astro project deployed to Cloudflare Workers. No separate Worker, no subdomain. Astro handles both static content and API routes.

```
khalido.org
├── /blog/*, /data/*, /tags/*   → prerendered (static CDN)
├── /tools/*                    → prerendered (client-side JS)
├── /api/auth/*                 → Better Auth (SSR)
├── /api/exa/*                  → Exa proxy (SSR, auth-gated)
├── /api/llm/*                  → OpenRouter proxy (SSR, tier-gated)
├── /api/news                   → Cached RSS/news feed (public)
└── cron                        → RSS fetch, data refresh
```

### Key Decisions

- **`output: 'server'`** with `export const prerender = true` on content pages — only way to get hybrid rendering with the Cloudflare adapter
- Blog posts, data stories, tag pages → **prerendered** (static, served from CDN)
- `/api/*` → **SSR** (server-side API calls, auth endpoints)
- `/tools/*` → **prerendered** (client-side JS calls `/api/*` endpoints)
- **API keys**: `wrangler secret put OPENROUTER_KEY` for server-side secrets
- Static assets (images, CSS, JS) served directly from Cloudflare CDN, never touch the Worker

## Auth: Better Auth + Google OAuth (Stateless)

Stateless sessions — no database needed for auth. Google OAuth for login. Roles assigned by email in config.

### Why stateless

- No D1/KV dependency just for auth
- JWT sessions stored client-side, validated server-side
- Simpler deployment, fewer moving parts
- Good enough for a personal site with a handful of users

### Setup

```ts
// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { env } from "cloudflare:workers";

export const auth = betterAuth({
  // No database → automatic stateless mode (JWT sessions)
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
});
```

### Astro integration

Better Auth handles its own routes. Astro just passes requests through:

```ts
// src/pages/api/auth/[...all].ts
export const prerender = false;
import { auth } from "@/lib/auth";
import type { APIRoute } from "astro";

export const ALL: APIRoute = async (ctx) => {
  return auth.handler(ctx.request);
};
```

### User tiers

Roles are hardcoded by email — no database needed for a handful of users:

```ts
// src/lib/auth.ts
const TIERS: Record<string, string> = {
  "khalid@example.com": "admin",
  "family1@example.com": "family",
  "family2@example.com": "family",
};

export function getTier(email: string | undefined): "admin" | "family" | "public" {
  if (!email) return "public";
  return (TIERS[email] as "admin" | "family") ?? "public";
}
```

### Tier limits

| Tier | Who | Models | Daily budget | Access |
|------|-----|--------|-------------|--------|
| **admin** | You | All (Claude, GPT-4o, etc.) | Uncapped | Everything |
| **family** | Invited by email | Gemini Flash, Haiku, etc. | $5/day | LLM chat, Exa search, tools |
| **public** | Anonymous / anyone | Gemini Flash Lite only | $1/day shared pool | News feed, basic agent chat |

### Getting the user in API routes

```ts
// In any /api/*.ts route
import { auth } from "@/lib/auth";
import { getTier } from "@/lib/auth";

export const POST: APIRoute = async (ctx) => {
  const session = await auth.api.getSession({ headers: ctx.request.headers });
  const tier = getTier(session?.user?.email);

  if (tier === "public") {
    // require Turnstile token or reject
  }

  // tier-gated logic...
};
```

## API Security Layers

### Layer 1: Rate limiting (Workers binding)

Native Cloudflare rate limiting, runs at the edge:

```jsonc
// wrangler.jsonc
"ratelimits": [
  { "name": "API_LIMITER", "namespace_id": "1001", "simple": { "limit": 30, "period": 60 } }
]
```

```ts
// Middleware pattern for API routes
const { success } = await env.API_LIMITER.limit({
  key: request.headers.get("cf-connecting-ip") ?? "unknown",
});
if (!success) return new Response("Rate limited", { status: 429 });
```

### Layer 2: Turnstile (anonymous users)

For public-tier users who aren't logged in. Proves "real browser, not a bot/agent."

**Client-side** (on tool pages):
```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" defer></script>
```

```ts
// Invisible challenge on page load
const token = await new Promise((resolve) => {
  turnstile.render("#turnstile", {
    sitekey: "YOUR_SITE_KEY",
    callback: resolve,
  });
});

// Send with API calls
fetch("/api/exa/search", {
  headers: { "X-Turnstile-Token": token },
  body: JSON.stringify({ query }),
});
```

**Server-side** (validate in API route):
```ts
async function validateTurnstile(token: string, ip: string): Promise<boolean> {
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: env.TURNSTILE_SECRET,
      response: token,
      remoteip: ip,
    }),
  });
  const data = await res.json();
  return data.success;
}
```

### Layer 3: Provider-side caps (always do this)

- OpenRouter: set daily spend limit on the key ($1-5/day)
- Exa: separate key with budget cap
- Even if all other defenses fail, max loss is capped

### What each layer stops

| Threat | Rate limit | Turnstile | Auth | Provider cap |
|--------|-----------|-----------|------|-------------|
| Random bots/crawlers | ✓ | ✓ | — | — |
| Autonomous agents (HTTP clients) | ✓ | ✓ | — | — |
| Autonomous agents (headless browser) | ✓ | Maybe | — | ✓ |
| Abuse from other websites | ✓ | ✓ | — | — |
| Overspending by legit users | — | — | ✓ | ✓ |

## API Routes

### Exa proxy

```ts
// src/pages/api/exa/search.ts
export const prerender = false;
import { env } from "cloudflare:workers";
import { auth, getTier } from "@/lib/auth";

export const POST: APIRoute = async (ctx) => {
  const session = await auth.api.getSession({ headers: ctx.request.headers });
  const tier = getTier(session?.user?.email);

  // Public users need Turnstile
  if (tier === "public") {
    const turnstileToken = ctx.request.headers.get("x-turnstile-token");
    if (!turnstileToken) return new Response("Forbidden", { status: 403 });
    const valid = await validateTurnstile(turnstileToken, ctx.request.headers.get("cf-connecting-ip") ?? "");
    if (!valid) return new Response("Forbidden", { status: 403 });
  }

  const body = await ctx.request.json();
  body.numResults = Math.min(body.numResults || 5, 10); // cap results

  const res = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: { "x-api-key": env.EXA_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return new Response(res.body, { headers: { "Content-Type": "application/json" } });
};
```

### LLM proxy (tier-gated model access)

```ts
// src/pages/api/llm/chat.ts
export const prerender = false;
import { env } from "cloudflare:workers";
import { auth, getTier } from "@/lib/auth";

const MODEL_ALLOWLIST: Record<string, string[]> = {
  admin: ["*"],
  family: ["google/gemini-2.0-flash", "anthropic/claude-3-haiku"],
  public: ["google/gemini-2.0-flash-lite"],
};

export const POST: APIRoute = async (ctx) => {
  const session = await auth.api.getSession({ headers: ctx.request.headers });
  const tier = getTier(session?.user?.email);
  const body = await ctx.request.json();

  // Check model access
  const allowed = MODEL_ALLOWLIST[tier];
  if (!allowed.includes("*") && !allowed.some((m) => body.model.startsWith(m))) {
    return new Response(JSON.stringify({ error: "Model not available for your tier" }), { status: 403 });
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://khalido.org",
    },
    body: JSON.stringify(body),
  });
  return new Response(res.body, {
    headers: { "Content-Type": "application/json" },
  });
};
```

### News feed (public, cached)

```ts
// src/pages/api/news.ts
export const prerender = false;

export const GET: APIRoute = async (ctx) => {
  const cache = await caches.open("news");
  const cacheKey = new Request("https://cache/news/latest");
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  // Fetch from RSS sources, aggregate, format
  const news = await fetchAndAggregateNews();

  const response = new Response(JSON.stringify(news), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "max-age=3600", // 1 hour
    },
  });
  cache.put(cacheKey, response.clone());
  return response;
};
```

## Images & Static Assets

Images in the repo work fine. After build, everything in `dist/` is uploaded to Cloudflare's static assets infrastructure and served directly from the CDN.

| Limit | Value |
|-------|-------|
| Max file per asset | 25 MB |
| Max total files | 20,000 |
| Max upload per deploy | ~100 MB practical |

Move to R2 later if image volume grows significantly or if you need user uploads.

## Setup Steps

```bash
npx astro add cloudflare           # adds @astrojs/cloudflare adapter
npm install wrangler@latest -D     # CLI for deploy/dev
npm install better-auth            # stateless auth
npx wrangler login                 # one-time browser auth
```

### astro.config.mjs

```js
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  // ... existing config
  adapter: cloudflare(),
  output: "server", // required for hybrid — mark static pages with prerender = true
});
```

### wrangler.jsonc

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "khalido-org",
  "main": "@astrojs/cloudflare/entrypoints/server",
  "compatibility_date": "2026-03-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": { "binding": "ASSETS", "directory": "./dist" },
  "observability": { "enabled": true },
  "ratelimits": [
    { "name": "API_LIMITER", "namespace_id": "1001", "simple": { "limit": 30, "period": 60 } }
  ]
}
```

### Secrets

```bash
wrangler secret put OPENROUTER_KEY
wrangler secret put EXA_API_KEY
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put TURNSTILE_SECRET
```

### Prerendering Content Pages

Add to every content page that should be static:

```astro
---
// src/pages/blog/[...id].astro
export const prerender = true;
// ...existing code
---
```

Pages without this export will be SSR by default (since `output: 'server'`).

### Deploy

```bash
npx astro build && npx wrangler deploy
```

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npm run build
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

Secrets needed: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

## Accessing Cloudflare APIs

```js
// Environment variables & bindings (Astro 6+)
import { env } from "cloudflare:workers";
const key = env.OPENROUTER_KEY;

// Request metadata
const country = Astro.request.cf?.country;
```

Generate types with `npx wrangler types` — creates type stubs for all bindings.

## Caching Pattern for SSR API Routes

For API routes that hit external APIs, use the Cache API:

```js
const cache = await caches.open("tools");
const cacheKey = new Request("https://cache/tool-name/" + inputHash);
const cached = await cache.match(cacheKey);
if (cached) return cached;

const result = await fetchFromAPI(...);
const response = new Response(JSON.stringify(result), {
  headers: { "Cache-Control": "max-age=300" },
});
cache.put(cacheKey, response.clone());
return response;
```

## Cron Triggers

For scheduled tasks (RSS fetch, data refresh), add a `triggers.crons` entry to wrangler.jsonc:

```jsonc
// wrangler.jsonc
"triggers": { "crons": ["0 */6 * * *"] }
```

Note: Astro doesn't natively wire up `scheduled()` handlers — may need a separate worker entry or Cloudflare Pages Function. Investigate when implementing.

Test locally: `curl http://localhost:8787/cdn-cgi/handler/scheduled`

## Gotchas

- **`output: 'static'` doesn't work for hybrid** — use `output: 'server'` + `prerender = true` per page
- **No filesystem in Workers** — can't write files at runtime; use KV/D1/R2 for dynamic data
- **`astro dev` runs on workerd** — great for parity, but some Node packages with native APIs will fail
- **CommonJS deps** may need Vite pre-compilation (`optimizeDeps.include` in astro config)
- **`@astrojs/cloudflare` v13+** required for Astro 6
- **Bundle size limit** — 10 MB compressed for the Worker; client-side deps (Plot, highlight.js) don't count since they're static assets
- **`public/data/*.json` still works** — served as static assets, fetchable from prerendered and SSR pages alike
- **Disable Cloudflare Auto Minify** to avoid hydration mismatches with Svelte
- Regenerate types after changing wrangler.jsonc: `npx wrangler types`
- **Better Auth stateless** — no database config = automatic JWT sessions. Don't add a database adapter unless you need server-side session revocation.

## Migration Checklist

1. [ ] `npx astro add cloudflare` + install wrangler + better-auth
2. [ ] Create `wrangler.jsonc` (with rate limit binding)
3. [ ] Change `output` to `'server'` in astro config
4. [ ] Add `export const prerender = true` to all content pages
5. [ ] `npx astro build && npx wrangler deploy` — verify site works
6. [ ] Update DNS to point to Workers (if not using custom domain yet)
7. [ ] Update GitHub Actions workflow
8. [ ] Set up Google Cloud OAuth project, add credentials as secrets
9. [ ] Add Better Auth (`src/lib/auth.ts` + `/api/auth/[...all].ts`)
10. [ ] Add Turnstile widget (Cloudflare dashboard + site integration)
11. [ ] Add `/api/exa/search` proxy with auth gating
12. [ ] Add `/api/llm/chat` proxy with tier-gated models
13. [ ] Add `/api/news` with caching
14. [ ] Set provider-side daily spend caps (OpenRouter, Exa)
15. [ ] Add cron trigger for news/data refresh (later)
16. [ ] Add agent endpoints (later, see `docs/agent.md`)

## Useful Links

- [Astro Cloudflare deploy guide](https://v6.docs.astro.build/en/guides/deploy/cloudflare/)
- [Astro Cloudflare adapter docs](https://v6.docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Better Auth Astro integration](https://better-auth.com/docs/integrations/astro)
- [Better Auth stateless sessions](https://better-auth.com/docs/concepts/session-management#stateless-session-management)
- [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)
- [Workers rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
- [Wrangler CLI docs](https://developers.cloudflare.com/workers/wrangler/)
- [Workers static assets](https://developers.cloudflare.com/workers/runtime-apis/bindings/assets/)
- [Workers KV](https://developers.cloudflare.com/kv/)
- [D1 SQLite](https://developers.cloudflare.com/d1/)
- [Cron triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)

## Learned from pakairquality

Patterns confirmed working in `~/code/pakairquality` (Astro 6 + Cloudflare Workers):

- `import { env } from 'cloudflare:workers'` for all bindings
- `@astrojs/cloudflare/entrypoints/server` as wrangler `main`
- `"observability": { "enabled": true }` for production debugging
- `nodejs_compat` flag required
- D1 accessed via raw SQL (`env.DB.prepare(...).all()`) — no ORM needed
- Cache API (`caches.open()`) for edge caching of API responses
- GitHub Actions deploy with `cloudflare/wrangler-action@v3`
- `remote: true` on D1 bindings connects dev to live data (useful but dangerous)
