import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

/**
 * Markdown twin for every post: /blog/<id>.md serves the raw source with a
 * small metadata header. For agents (and humans) who want the clean text —
 * point one at https://khalido.org/blog/recipes/keema.md and it can just read.
 *
 * Drafts included to mirror the HTML pages (built but unlisted); llms.txt is
 * the public index and excludes them.
 */
export async function getStaticPaths() {
  const posts = await getCollection("blog");
  return posts.map((post) => ({ params: { id: post.id }, props: { post } }));
}

export const GET: APIRoute = ({ props }) => {
  const { post } = props as { post: any };
  const d = post.data;
  const meta = [
    d.date ? `date: ${new Date(d.date).toISOString().slice(0, 10)}` : "",
    d.tags?.length ? `tags: ${d.tags.join(", ")}` : "",
    d.link ? `link: ${d.link}` : "",
  ]
    .filter(Boolean)
    .join(" | ");

  const header = d.title ? `# ${d.title}\n\n${meta}\n\n` : `${meta}\n\n`;
  return new Response(header + (post.body ?? ""), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
};
