import { Type } from "@earendil-works/pi-ai";

/**
 * URL → markdown via jina reader (r.jina.ai — CORS enabled, keyless free tier).
 * Mirrors kotools' `ko fetch`. Rate-limited without a key; fine for
 * a handful of reads per session.
 */
export const fetchPageTool = {
  name: "fetch_page",
  label: "Read Page",
  description:
    "Fetch any URL (article, blog post, arxiv abstract page) as clean markdown text. Use to actually read a source found via search. Rate-limited — use selectively on the most promising sources, not every result.",
  parameters: Type.Object({
    url: Type.String({ description: "Full URL to read" }),
  }),
  execute: async (_id: string, params: { url: string }, signal?: AbortSignal) => {
    const res = await fetch(`https://r.jina.ai/${params.url}`, { signal });
    if (!res.ok) throw new Error(`jina reader: ${res.status} (free tier is rate-limited — wait and retry)`);
    const text = (await res.text()).slice(0, 8000);
    return {
      content: [{ type: "text" as const, text }],
      details: { url: params.url, chars: text.length },
    };
  },
};
