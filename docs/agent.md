# Agents & LLM Integration

Context-aware agent capabilities for khalido.org — not a generic chatbot, but page-specific tools that know the content and can answer questions, search the blog, and fetch external data.

## Architecture: Agent Client-Side, Proxies Server-Side

**The agent runs entirely in the browser.** Cloudflare Workers just provides dumb proxy endpoints for APIs that block CORS or need hidden keys.

```
Browser (all the intelligence lives here)
├── pi-agent-core — conversation loop, tool execution, state
├── pi-ai → OpenRouter — LLM calls (direct, CORS supported)
├── Tool: get_oil_prices — fetch('/data/oil/prices.json') → direct
├── Tool: web_search — fetch('/api/exa/search') → proxied
└── Tool: search_blog — Pagefind index → direct, client-side

Cloudflare Workers (dumb proxies, no agent logic)
├── /api/exa/search — forwards to api.exa.ai, adds API key
├── /api/exa/contents — forwards to api.exa.ai/contents, adds API key
└── /api/llm/chat — (future) OpenRouter proxy for shared-key access
```

**Key insight:** pi-agent tools are just JS functions with an `execute()` method. The function runs in the browser. If it needs to call a CORS-blocked API, it `fetch()`es a proxy endpoint on our own domain. The Worker adds the secret API key and forwards the request. The Worker knows nothing about pi-agent.

**What stays client-side:**
- Agent runtime (pi-agent-core)
- Conversation state, message history
- Tool definitions and execution
- Model selection, streaming display
- OpenRouter LLM calls (CORS works, user provides key or uses shared proxy)

**What moves to Workers:**
- API proxies for CORS-blocked services (Exa, future others)
- Shared API key storage (`wrangler secret`)
- Cron triggers (data refresh, RSS fetch)
- Rate limiting (Cloudflare built-in)

See `docs/cloudflare.md` for migration plan and setup.

## Stack

| Package | Role | Browser? |
|---------|------|----------|
| `@mariozechner/pi-agent-core` | Agent runtime, multi-turn, compaction, event system | Yes — pure ESM, zero Node deps |
| `@mariozechner/pi-ai` | LLM provider abstraction, streaming, tool calling, 241 OpenRouter models built-in | Yes — Node imports guarded behind runtime checks |
| `@sinclair/typebox` | Tool parameter schemas (peer dep of pi-ai) | Yes |
| `bits-ui` | Headless Svelte 5 components (Combobox for model picker, etc.) | Yes — must use `client:only="svelte"` in Astro |

Install: `npm install @mariozechner/pi-agent-core` — pulls in pi-ai and typebox automatically.

### Astro + Bits UI gotcha

Bits UI ships `.svelte` source files. Astro's SSR can't handle `.svelte` in node_modules, so any component importing Bits UI **must** use `client:only="svelte"` (not `client:load`). This is fine — agent components have no meaningful server-rendered output.

## Browser CORS Support

| Provider | Direct from browser? | Notes |
|----------|---------------------|-------|
| **OpenRouter** | Yes | CORS supported, streaming works, spend caps per key |
| **Anthropic** | Yes | Requires `anthropic-dangerous-direct-browser-access: true` header |
| **Google Gemini** | No | CORS blocked — use via OpenRouter instead |
| **OpenAI** | No | CORS blocked — use via OpenRouter instead |

**Recommendation:** Use OpenRouter exclusively for client-side. One API key, access to all models (including Gemini, Claude, GPT via OpenRouter routing).

## Prototype: Working

`/tools/agent-test/` — oil price agent, validates the full pipeline.

**Status:** Working. Confirmed:
- [x] pi-agent-core + pi-ai bundle correctly with Vite/Astro
- [x] OpenRouter connection with user-provided API key
- [x] Streaming text display (incremental)
- [x] Tool calling (agent calls tools, gets data, responds)
- [x] Model switching via Bits UI Combobox (241 models from pi-ai registry)
- [x] Svelte 5 `$state` reactivity with agent event subscription

**Files:**
```
src/pages/tools/agent-test/
├── index.astro           # page shell, client:only="svelte"
└── _AgentTest.svelte     # Agent + chat UI + model picker + tools
```

## API Reference

### Agent Constructor

```ts
import { Agent } from '@mariozechner/pi-agent-core';
import { getModel, getModels } from '@mariozechner/pi-ai';

const agent = new Agent({
  initialState: {
    systemPrompt: "You are a helpful assistant...",
    model: getModel('openrouter', 'google/gemini-3.1-flash-lite-preview'),
    tools: [myTool],
  },
  getApiKey: () => getKey('openrouter'),  // called on every LLM request
});
```

### Events & Streaming

```ts
agent.subscribe((event) => {
  // event.type: agent_start | agent_end | turn_start | turn_end
  //   message_start | message_update | message_end
  //   tool_execution_start | tool_execution_update | tool_execution_end
  messages = [...agent.state.messages];
  isStreaming = agent.state.isStreaming;
  // For live streaming text:
  if (event.type === 'message_update') {
    const text = agent.state.streamMessage?.content?.find(c => c.type === 'text')?.text;
  }
});

await agent.prompt("user message");     // start conversation
agent.setModel(newModel);               // switch model mid-conversation
agent.steer("new direction");           // interrupt current generation
agent.followUp("next question");        // queue after current turn
```

### Model Registry

pi-ai has 241 OpenRouter models built-in with name, cost, context window, reasoning flag. No API call needed.

```ts
const models = getModels('openrouter');  // Model[] with id, name, cost, contextWindow, reasoning
const model = getModel('openrouter', 'google/gemini-3.1-flash-lite-preview');
```

### Agent State

```ts
agent.state.messages        // AgentMessage[] — full conversation, JSON-serializable
agent.state.isStreaming      // boolean
agent.state.streamMessage    // current in-flight message (for live display)
agent.state.pendingToolCalls // ToolCall[]
agent.state.error            // string | undefined
```

## Writing Good Tools

Patterns learned from pi-mono's coding-agent tools (`~/code/refs/pi-mono/packages/coding-agent/src/core/tools/`).

### Tool Definition

```ts
import { Type } from '@sinclair/typebox';

const myTool = {
  name: 'tool_name',           // snake_case, used by LLM
  label: 'Human Label',        // shown in UI
  description: '...',          // critical — this is what makes the LLM use the tool correctly
  parameters: Type.Object({    // TypeBox schema
    required: Type.String({ description: "..." }),
    optional: Type.Optional(Type.Number({ description: "Defaults to 30." })),
  }),
  execute: async (toolCallId, params, signal?, onUpdate?) => {
    return {
      content: [{ type: 'text', text: '...' }],  // goes back to LLM — keep concise
      details: { count: 10 },                      // metadata for UI display
    };
  },
};
```

### Description Writing

The description is the most important part — it's the LLM's only guide for when and how to use the tool.

**Include:**
1. What it does (action verb + object)
2. What data it returns and format
3. Default values for optional params
4. Output limits ("returns last 30 entries")
5. When to use which option ("use 'daily' for current prices, 'monthly' for long-term trends")

**Example:**
```
"Fetch Brent crude oil prices. Has monthly averages (back to 1987) and daily OHLC (recent).
Use period='daily' for current/recent prices, 'monthly' for long-term trends.
Returns date and price in USD/barrel. Defaults to last 30 entries."
```

### Error Handling

Throw with actionable messages — the LLM sees these and can retry or adjust:

```ts
throw new Error("Web search failed: rate limited. Try again with a simpler query.");
// NOT: throw new Error("Error");
```

Pattern: **what failed** + **where/why** + **what to try next**.

### Output Truncation

Always cap tool output. Full data dumps burn tokens and confuse the LLM.

- Summarize: `data.slice(-30)` not `data` (thousands of entries)
- Format concisely: `"2026-03-09: $105.07"` not full JSON objects
- Include metadata: `"Data fetched: 2026-03-09T10:56:17Z"` for freshness context

### Streaming Progress (onUpdate)

For slow tools (web search, large fetches), use the `onUpdate` callback:

```ts
execute: async (toolCallId, params, signal, onUpdate) => {
  // Stream partial results as they arrive
  if (onUpdate) {
    onUpdate({ content: [{ type: 'text', text: 'Searching...' }], details: {} });
  }
  const results = await search(params.query);
  return { content: [{ type: 'text', text: formatResults(results) }], details: { count: results.length } };
},
```

## Tools: Built and Planned

### Built (in agent-test prototype)

- **get_oil_prices** — fetch daily OHLC or monthly Brent crude from `/data/oil/prices.json`
- **get_oil_events** — fetch historical events that affected oil prices

### Proxy Endpoints (after Cloudflare migration)

Exa.ai blocks CORS — browser can't call it directly. Don't install `exa-js` (wraps `node-fetch`, breaks in browser). Instead, proxy through our own Workers endpoints:

```ts
// src/pages/api/exa/search.ts — ~15 lines
export const prerender = false;
import { env } from 'cloudflare:workers';

export async function POST({ request }) {
  const body = await request.json();
  const res = await fetch('https://api.exa.ai/search', {
    method: 'POST',
    headers: {
      'x-api-key': env.EXA_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return new Response(res.body, {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

Same pattern for `/api/exa/contents` (URL content extraction).

The browser tool just calls our proxy:
```ts
// In tool's execute():
const res = await fetch('/api/exa/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, type: 'auto', numResults: 5,
    contents: { highlights: { maxCharacters: 4000 } } }),
  signal,
});
```

### Web Search Tool (Exa)

```ts
const webSearchTool = {
  name: 'web_search',
  label: 'Web Search',
  description: 'Search the web for current information using Exa semantic search. Returns titles, URLs, and highlighted snippets. Use for recent events, facts, or topics not covered by other tools. Be specific in queries.',
  parameters: Type.Object({
    query: Type.String({ description: "Search query — be specific and descriptive" }),
    numResults: Type.Optional(Type.Number({ description: "Number of results, 1-10. Defaults to 5." })),
    category: Type.Optional(Type.String({ description: "'news' for recent articles, 'research paper' for academic, 'tweet' for Twitter. Omit for general." })),
  }),
  execute: async (toolCallId, params, signal) => {
    const res = await fetch('/api/exa/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: params.query,
        numResults: Math.min(params.numResults || 5, 10),
        type: 'auto',
        ...(params.category && { category: params.category }),
        contents: { highlights: { maxCharacters: 4000 } },
      }),
      signal,
    });
    if (!res.ok) throw new Error(`Search failed: ${res.status}. Try rephrasing your query.`);
    const data = await res.json();
    const text = data.results
      .map((r: any, i: number) =>
        `${i + 1}. ${r.title}\n   ${r.url}\n   ${r.highlights?.[0] || r.text?.slice(0, 300) || ''}`)
      .join('\n\n');
    return {
      content: [{ type: 'text', text: text || 'No results found.' }],
      details: { count: data.results.length },
    };
  },
};
```

### Fetch URL Tool (Exa Contents)

Exa's `/contents` endpoint extracts clean text from any URL — better than scraping HTML ourselves:

```ts
const fetchUrlTool = {
  name: 'fetch_url',
  label: 'Fetch URL',
  description: 'Fetch and extract text content from a URL. Returns clean text, not raw HTML. Good for reading articles, docs, or API responses. Truncated to ~5000 chars.',
  parameters: Type.Object({
    url: Type.String({ description: "Full URL to fetch" }),
  }),
  execute: async (toolCallId, params, signal) => {
    const res = await fetch('/api/exa/contents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        urls: [params.url],
        text: { maxCharacters: 5000 },
      }),
      signal,
    });
    if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status}. The site may be inaccessible.`);
    const data = await res.json();
    const page = data.results?.[0];
    const text = page?.text?.slice(0, 5000) || 'No content extracted.';
    return {
      content: [{ type: 'text', text: `${page?.title || params.url}\n\n${text}` }],
      details: { url: params.url, title: page?.title, chars: text.length },
    };
  },
};
```

### Search Blog Tool (client-side, no proxy)

Pagefind generates a static search index at build time. Runs entirely in the browser:

```ts
const searchBlogTool = {
  name: 'search_blog',
  label: 'Search Blog',
  description: 'Search khalido.org posts by keyword. Returns matching post titles, URLs, and excerpts. Use to find related posts or answer "did I write about X?" questions.',
  parameters: Type.Object({
    query: Type.String({ description: "Search terms" }),
  }),
  execute: async (toolCallId, params, signal) => {
    // Pagefind loaded client-side (lazy, ~100KB on first use)
    const pagefind = await import('/pagefind/pagefind.js');
    await pagefind.init();
    const results = await pagefind.search(params.query);
    const items = await Promise.all(results.results.slice(0, 10).map(r => r.data()));
    const text = items
      .map((d, i) => `${i + 1}. ${d.meta.title}\n   ${d.url}\n   ${d.excerpt}`)
      .join('\n\n');
    return {
      content: [{ type: 'text', text: text || 'No matching posts found.' }],
      details: { count: items.length },
    };
  },
};
```

### Future Tool Ideas

**General-purpose (available on every page agent):**
- `web_search` — Exa via proxy (described above)
- `fetch_url` — Exa contents via proxy
- `search_blog` — Pagefind, client-side

**Recipe page "cook mode":**
- `scale_recipe` — pure math, multiply ingredient quantities by a factor
- `substitute_ingredient` — web_search("substitute for X in Y recipe") with dietary context
- `convert_units` — cups ↔ grams ↔ ml, temperature F ↔ C

**Data story agents:**
- `query_data` — fetch and filter `public/data/*.json` (already have `get_oil_prices`)
- `compare_commodities` — fetch multiple datasets, summarize trends
- `annotate_chart` — combine events.json + web_search for context on price spikes

**TIL/blog agents:**
- `find_related` — given current post tags, search blog for related posts
- `fact_check` — cross-reference claims with web_search

**Code post agents:**
- `explain_code` — system prompt has the code, agent explains specific sections
- `suggest_modification` — "how would I adapt this for CSV input?"

## Page-Specific Agents

Each page type gets its own system prompt + tools:

| Page Type | System Prompt | Tools |
|-----------|--------------|-------|
| Recipe | Full recipe text | scale_recipe, substitute_ingredient, convert_units, web_search |
| TIL | TIL content | search_blog, web_search, fetch_url |
| Data story | Chart descriptions + data summary | query_data, web_search |
| Code post | Code examples + explanation | web_search, fetch_url |
| General | Page content | search_blog, web_search |

## Persistence

- **Ephemeral by default** — conversation resets on page reload. Fine for most use cases.
- **Optional persistence** — save `agent.state.messages` to localStorage or IndexedDB. Messages are JSON-serializable.
- **API keys** — `src/scripts/keystore.ts` + Settings page (`/tools/settings`)

## Cost Control

**With shared project key (after Workers migration):**
- Default to cheapest model (Gemini 3.1 Flash Lite)
- Rate limit by IP — Cloudflare built-in rate limiting rules
- Daily budget cap on OpenRouter key (~$1/day = ~500 conversations)
- If budget exhausted, fall back to "bring your own key" mode
- Show token count / estimated cost in UI

**With user-provided key:**
- User's responsibility, but be a good citizen
- pi-ai tracks usage per AssistantMessage (`message.usage.input/output/cost`)
- Let user choose model via Combobox (power users pick expensive models)
- Reasonable `max_tokens` limits per request

## Reference: pi-mono on disk

Cloned to `~/code/refs/pi-mono/`:

| Path | What's there |
|------|-------------|
| `packages/agent/src/agent.ts` | Agent class — constructor, prompt(), subscribe(), steer() |
| `packages/agent/src/agent-loop.ts` | Conversation loop — LLM call → tool execution → repeat |
| `packages/agent/src/types.ts` | AgentTool, AgentEvent, AgentState types |
| `packages/ai/src/models.ts` | `getModel()`, `getModels()` — 241 OpenRouter models |
| `packages/ai/src/stream.ts` | `streamSimple()` — streaming LLM calls |
| `packages/ai/src/providers/openai-completions.ts` | OpenRouter via OpenAI SDK with custom baseUrl |
| `packages/coding-agent/src/core/tools/` | Reference tool implementations (bash, read, edit, grep, etc.) |
| `packages/web-ui/src/` | Browser Agent patterns, IndexedDB storage, CORS helpers |

### Key patterns from coding-agent tools

- **pi-agent-core has zero built-in tools** — all tools are user-defined
- Coding-agent tools (bash, read, write, edit, grep, find, ls) are in the separate `@mariozechner/pi-coding-agent` package — all filesystem/shell, none browser-safe
- **Pluggable operations** — each tool takes an `operations` interface for swappable I/O (useful for making tools work both client-side and server-side)
- **Output truncation everywhere** — 2000 lines / 50KB / 100 matches caps. Never dump raw data
- **Error messages are actionable** — "what failed + where + why + what to try"
- **Descriptions are detailed** — include defaults, limits, when to use which option
- **`onUpdate` for streaming** — only bash.ts uses it (slow operations); other tools return at once

## Next Steps

1. ~~Install pi-agent-core~~ Done
2. ~~Build agent-test prototype~~ Done — `/tools/agent-test/`
3. ~~Model picker~~ Done — Bits UI Combobox, 241 models
4. Migrate to Cloudflare Workers (see `docs/cloudflare.md`)
5. Add `/api/exa/search` and `/api/exa/contents` proxy endpoints
6. Add web_search and fetch_url tools to agent-test
7. Add Pagefind for search_blog tool
8. Extract reusable `AgentChat.svelte` components
9. Add markdown rendering for assistant messages
10. Build first page-specific agent (recipe page — "cook mode")
11. Generalize into a `PageAgent.svelte` component

## References

- [pi-mono](https://github.com/badlogic/pi-mono) — source (cloned at `~/code/refs/pi-mono/`)
- [pi-web-ui](https://github.com/badlogic/pi-mono/tree/main/packages/web-ui) — reference for browser Agent patterns
- [Exa.ai API docs](https://docs.exa.ai) — semantic web search
- [Bits UI](https://bits-ui.com/) — headless Svelte 5 components
- [What I learned building a coding agent](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/) — Mario's writeup
- [How to Build a Custom Agent Framework with PI](https://nader.substack.com/p/how-to-build-a-custom-agent-framework) — agent architecture walkthrough
