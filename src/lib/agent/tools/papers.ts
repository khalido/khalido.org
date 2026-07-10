import { Type } from "@earendil-works/pi-ai";

/**
 * Academic paper tools via OpenAlex (api.openalex.org — CORS enabled, no key).
 * Mirrors kotools' `ko papers`: cross-publisher search + citation graph.
 */

const MAILTO = "khalid.omar@gmail.com"; // OpenAlex polite pool

/** Rebuild abstract text from OpenAlex's inverted index */
function reconstructAbstract(inv: Record<string, number[]> | null): string {
  if (!inv) return "";
  const words: string[] = [];
  for (const [word, positions] of Object.entries(inv)) {
    for (const pos of positions) words[pos] = word;
  }
  return words.join(" ");
}

function paperLine(w: any): string {
  const year = w.publication_year ?? "?";
  const cites = w.cited_by_count ?? 0;
  const journal = w.primary_location?.source?.display_name ?? "";
  const doi = w.doi?.replace("https://doi.org/", "") ?? "";
  const id = w.id?.replace("https://openalex.org/", "") ?? "";
  return `${year} | ${cites} cites | ${w.title} | ${journal} | doi:${doi} | ${id}`;
}

export const searchPapersTool = {
  name: "search_papers",
  label: "Paper Search",
  description:
    "Search academic papers across all publishers via OpenAlex. Returns year, citation count, title, journal, DOI, and OpenAlex ID per paper. Use get_paper with the DOI or ID for the abstract; papers_citing to snowball the citation graph.",
  parameters: Type.Object({
    query: Type.String({ description: "Search query (title/abstract keywords)" }),
    count: Type.Optional(Type.Number({ description: "Results to return, default 10" })),
  }),
  execute: async (_id: string, params: { query: string; count?: number }, signal?: AbortSignal) => {
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(params.query)}&per-page=${params.count || 10}&mailto=${MAILTO}`;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`OpenAlex: ${res.status}`);
    const data = await res.json();
    const lines = (data.results ?? []).map(paperLine);
    return {
      content: [{ type: "text" as const, text: lines.join("\n") || "No papers found." }],
      details: { count: lines.length },
    };
  },
};

export const getPaperTool = {
  name: "get_paper",
  label: "Paper Details",
  description:
    "Get one paper's details from OpenAlex: authors, venue, abstract, citation count, open-access URL. Takes a DOI (10.xxxx/...), arxiv id via DOI, or OpenAlex ID (W...).",
  parameters: Type.Object({
    id: Type.String({ description: "DOI like 10.48550/arXiv.1706.03762 or OpenAlex ID like W2741809807" }),
  }),
  execute: async (_id: string, params: { id: string }, signal?: AbortSignal) => {
    const ref = params.id.startsWith("W") ? params.id : `doi:${params.id}`;
    const res = await fetch(`https://api.openalex.org/works/${ref}?mailto=${MAILTO}`, { signal });
    if (!res.ok) throw new Error(`OpenAlex: ${res.status} for ${ref}`);
    const w = await res.json();
    const authors = (w.authorships ?? []).map((a: any) => a.author?.display_name).filter(Boolean).slice(0, 12).join(", ");
    const abstract = reconstructAbstract(w.abstract_inverted_index).slice(0, 2500);
    const text = [
      `Title: ${w.title}`,
      `Authors: ${authors}`,
      `Year: ${w.publication_year} | Cites: ${w.cited_by_count} | ${w.primary_location?.source?.display_name ?? ""}`,
      `DOI: ${w.doi ?? "none"} | OpenAlex: ${w.id}`,
      `Open access: ${w.open_access?.oa_url ?? "no OA copy found"}`,
      ``,
      `Abstract: ${abstract || "(none available)"}`,
    ].join("\n");
    return {
      content: [{ type: "text" as const, text }],
      details: { title: w.title },
    };
  },
};

export const papersCitingTool = {
  name: "papers_citing",
  label: "Citation Graph",
  description:
    "List papers that cite a given paper (most-cited first) via OpenAlex — use to snowball forward from a seed paper. Takes an OpenAlex ID (W...) from search_papers/get_paper results.",
  parameters: Type.Object({
    id: Type.String({ description: "OpenAlex work ID, e.g. W2741809807" }),
    count: Type.Optional(Type.Number({ description: "Results to return, default 10" })),
  }),
  execute: async (_id: string, params: { id: string; count?: number }, signal?: AbortSignal) => {
    const url = `https://api.openalex.org/works?filter=cites:${params.id}&sort=cited_by_count:desc&per-page=${params.count || 10}&mailto=${MAILTO}`;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`OpenAlex: ${res.status}`);
    const data = await res.json();
    const lines = (data.results ?? []).map(paperLine);
    return {
      content: [{ type: "text" as const, text: lines.join("\n") || "No citing papers found." }],
      details: { count: lines.length },
    };
  },
};
