import { Type } from "@earendil-works/pi-ai";

/**
 * Hacker News tools via Algolia's public API (CORS enabled, no key).
 * Mirrors kotools' `ko hn`: search + story with comment thread.
 */

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/\s+/g, " ")
    .trim();
}

function storyLine(h: any): string {
  return `${(h.created_at ?? "").slice(0, 10)} | ${h.points} pts, ${h.num_comments} comments | ${h.title} | ${h.url ?? "(text post)"} | id:${h.objectID}`;
}

export const hnFrontPageTool = {
  name: "hn_front_page",
  label: "HN Front Page",
  description:
    "The CURRENT Hacker News front page — what's trending right now, in one call. Use this for 'what's hot / latest on HN' questions instead of searching. Use hn_story with an id to read a discussion.",
  parameters: Type.Object({
    count: Type.Optional(Type.Number({ description: "Stories to return, default 30" })),
  }),
  execute: async (_id: string, params: { count?: number }, signal?: AbortSignal) => {
    const url = `https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=${params.count || 30}`;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`HN Algolia: ${res.status}`);
    const data = await res.json();
    const lines = (data.hits ?? []).map(storyLine);
    return {
      content: [{ type: "text" as const, text: lines.join("\n") || "Front page unavailable." }],
      details: { count: lines.length },
    };
  },
};

export const hnSearchTool = {
  name: "hn_search",
  label: "HN Search",
  description:
    "Search Hacker News stories (practitioner discussion signal). Each result: date, points, comments, title, URL, story id. Defaults to relevance over all time — pass days and/or sort='date' for recent stories. To check whether a specific paper/article was discussed on HN, search its URL or exact title. For today's front page use hn_front_page instead.",
  parameters: Type.Object({
    query: Type.String({ description: "Search query, a URL, or an exact title" }),
    count: Type.Optional(Type.Number({ description: "Results, default 10" })),
    days: Type.Optional(Type.Number({ description: "Only stories from the last N days" })),
    sort: Type.Optional(
      Type.String({
        description: "'relevance' (default, best match weighted by points) or 'date' (newest first)",
      }),
    ),
  }),
  execute: async (
    _id: string,
    params: { query: string; count?: number; days?: number; sort?: string },
    signal?: AbortSignal,
  ) => {
    const endpoint = params.sort === "date" ? "search_by_date" : "search";
    let url = `https://hn.algolia.com/api/v1/${endpoint}?query=${encodeURIComponent(params.query)}&tags=story&hitsPerPage=${params.count || 10}`;
    if (params.days) {
      url += `&numericFilters=created_at_i>${Math.floor(Date.now() / 1000 - params.days * 86400)}`;
    }
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`HN Algolia: ${res.status}`);
    const data = await res.json();
    const lines = (data.hits ?? []).map(storyLine);
    return {
      content: [{ type: "text" as const, text: lines.join("\n") || "No stories found." }],
      details: { count: lines.length },
    };
  },
};

export const hnStoryTool = {
  name: "hn_story",
  label: "HN Discussion",
  description:
    "Read a Hacker News story and its top comments — the actual practitioner debate. Takes a story id from hn_search.",
  parameters: Type.Object({
    id: Type.String({ description: "HN story id, e.g. 48480978" }),
    comments: Type.Optional(Type.Number({ description: "Max comments to include, default 15" })),
  }),
  execute: async (_id: string, params: { id: string; comments?: number }, signal?: AbortSignal) => {
    const res = await fetch(`https://hn.algolia.com/api/v1/items/${params.id}`, { signal });
    if (!res.ok) throw new Error(`HN Algolia: ${res.status}`);
    const item = await res.json();
    const max = params.comments || 15;

    // Flatten the comment tree depth-first, keeping top-level order
    const comments: string[] = [];
    function walk(node: any, depth: number) {
      if (comments.length >= max) return;
      if (node.text) {
        const indent = "  ".repeat(Math.min(depth, 4));
        comments.push(`${indent}[${node.author}] ${stripHtml(node.text).slice(0, 600)}`);
      }
      for (const child of node.children ?? []) walk(child, depth + 1);
    }
    for (const child of item.children ?? []) walk(child, 0);

    const text = [
      `${item.title} (${item.points} pts)`,
      item.url ?? "",
      ``,
      ...comments,
    ].join("\n");
    return {
      content: [{ type: "text" as const, text }],
      details: { comments: comments.length },
    };
  },
};
