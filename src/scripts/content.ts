import type { CollectionEntry } from "astro:content";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";

export type BlogPost = CollectionEntry<"blog">;
export type DataStory = CollectionEntry<"data">;

/** Filter out drafts in production, show all in dev */
export function filterDrafts({ data }: { data: { draft?: boolean } }) {
  return import.meta.env.PROD ? data.draft !== true : true;
}

/** Get all unique tags with counts from multiple collections, sorted by count descending */
export function getAllTagsWithCounts(...collections: { data: { tags: string[] } }[][]): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const item of collections.flat()) {
    for (const tag of item.data.tags) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([tag, count]) => ({ tag, count }));
}

export async function getPreview(post: BlogPost): Promise<string> {
  if (post.data.summary && post.data.summary.trim() !== "...") {
    return post.data.summary;
  }

  // Get first two paragraphs of prose — skip headings, import lines
  const lines = (post.body ?? "").split("\n");
  const paragraphs: string[][] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (line.startsWith("#") || line.startsWith("import ")) {
      if (current.length > 0) { paragraphs.push(current); current = []; }
      if (paragraphs.length >= 2) break;
      continue;
    }
    if (line.trim() === "") {
      if (current.length > 0) { paragraphs.push(current); current = []; }
      if (paragraphs.length >= 2) break;
      continue;
    }
    current.push(line);
  }
  if (current.length > 0 && paragraphs.length < 2) paragraphs.push(current);

  const preview = paragraphs.map(p => p.join("\n")).join("\n\n");
  if (!preview) return "";

  const processedContent = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(preview);

  return processedContent.toString();
}

export function sortByDate<T extends { data: { updated?: Date; date: Date } }>(
  contents: T[],
): T[] {
  return contents.sort((a, b) => {
    const dateA = a.data.updated?.valueOf() || a.data.date.valueOf();
    const dateB = b.data.updated?.valueOf() || b.data.date.valueOf();
    return dateB - dateA;
  });
}
