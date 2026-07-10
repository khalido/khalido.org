import { Type } from "@earendil-works/pi-ai";

/**
 * Hugging Face Daily Papers (huggingface.co/api — CORS enabled, no key).
 * Mirrors kotools' `ko hf top`: trending ML papers with upvotes.
 */
export const hfDailyPapersTool = {
  name: "hf_daily_papers",
  label: "HF Daily Papers",
  description:
    "Trending ML papers from Hugging Face Daily Papers, by community upvotes — what's hot in ML right now. Returns title, upvotes, arxiv id, and a short summary. Use get_paper with DOI 10.48550/arXiv.<id> for full details.",
  parameters: Type.Object({
    count: Type.Optional(Type.Number({ description: "Papers to return, default 10" })),
  }),
  execute: async (_id: string, params: { count?: number }, signal?: AbortSignal) => {
    const res = await fetch(`https://huggingface.co/api/daily_papers?limit=${params.count || 10}`, { signal });
    if (!res.ok) throw new Error(`HF API: ${res.status}`);
    const data = await res.json();
    const lines = (data ?? []).map((d: any) => {
      const p = d.paper ?? d;
      const summary = (p.summary ?? "").replace(/\s+/g, " ").slice(0, 200);
      return `${p.upvotes ?? 0} upvotes | ${p.title} | arxiv:${p.id} | ${summary}`;
    });
    return {
      content: [{ type: "text" as const, text: lines.join("\n") || "No papers today." }],
      details: { count: lines.length },
    };
  },
};
