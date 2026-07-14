import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { filterDrafts } from "@scripts/content";

/**
 * /llms.txt — agent-facing site index (llmstxt.org format, same shape as
 * shadcn-svelte's: this file is the index, each post links to its .md twin).
 */

const SITE = "https://khalido.org";

/** First meaningful line of a post body, markdown syntax roughly stripped */
function firstLine(body: string | undefined): string {
  if (!body) return "";
  for (const raw of body.split("\n")) {
    const line = raw
      .replace(/^#+\s*/, "")
      .replace(/^import .*$/, "")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[*_`>]/g, "")
      .trim();
    if (line) return line.slice(0, 150);
  }
  return "";
}

function postLine(post: any): string {
  const d = post.data;
  const title = d.title || firstLine(post.body).slice(0, 60) || post.id;
  const desc = d.summary || firstLine(post.body);
  const tags = d.tags?.length ? ` (${d.tags.join(", ")})` : "";
  const date = d.date ? new Date(d.updated || d.date).toISOString().slice(0, 10) : "";
  return `- [${title}](${SITE}/blog/${post.id}.md): ${date} — ${desc}${tags}`;
}

export const GET: APIRoute = async () => {
  const [posts, stories] = await Promise.all([
    getCollection("blog", filterDrafts),
    getCollection("data", filterDrafts),
  ]);

  // Group by top-level folder; root-level posts under "Posts"
  const sections = new Map<string, any[]>();
  for (const post of posts) {
    const slash = post.id.indexOf("/");
    const category = slash === -1 ? "posts" : post.id.slice(0, slash);
    if (!sections.has(category)) sections.set(category, []);
    sections.get(category)!.push(post);
  }
  for (const list of sections.values()) {
    list.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());
  }
  const sectionOrder = ["posts", ...[...sections.keys()].filter((k) => k !== "posts").sort()];

  const lines: string[] = [
    "# khalido.org",
    "",
    "> Khalid's personal blog — notes, code, recipes, book notes, TILs, data stories, and interactive tools. Written to think out loud; posts are working notes, not polished essays.",
    "",
    "Every post has a clean markdown version: append `.md` to its URL (e.g. `/blog/dev/uv-python.md`). This file lists them all. Interactive tools and data-story charts only exist as HTML pages.",
    "",
  ];

  for (const key of sectionOrder) {
    const list = sections.get(key);
    if (!list?.length) continue;
    lines.push(`## ${key === "posts" ? "Posts" : key}`, "");
    for (const post of list) lines.push(postLine(post));
    lines.push("");
  }

  if (stories.length) {
    lines.push("## data stories", "");
    for (const s of stories.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())) {
      lines.push(`- [${s.data.title}](${SITE}/data/${s.id}): ${s.data.summary ?? ""} (HTML only — interactive charts)`);
    }
    lines.push("");
  }

  lines.push(
    "## Tools",
    "",
    `- [Tools index](${SITE}/tools): interactive browser tools — timezone converter, big text, unwall, research agent, and more (HTML only)`,
    "",
  );

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
