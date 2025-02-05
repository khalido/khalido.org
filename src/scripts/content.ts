import type { CollectionEntry } from "astro:content";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";

export type BlogPost = CollectionEntry<"blog">;

export async function getPreview(post: BlogPost): Promise<string> {
  if (post.data.summary) {
    return post.data.summary;
  }

  const firstParagraph = post.body.split("\n\n")[0];
  const processedContent = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(firstParagraph);

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

export function getAllTags(posts: BlogPost[]): string[] {
  return [...new Set(posts.map((post) => post.data.tags).flat())].sort();
}
