import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE_TITLE, SITE_DESCRIPTION } from "../consts";
import { filterDrafts } from "../scripts/content";

export async function GET(context) {
  // Same set as the homepage feed: blog posts + data stories, drafts excluded in prod
  const posts = await getCollection("blog", filterDrafts);
  const stories = await getCollection("data", filterDrafts);

  const items = [
    ...posts.map((post) => ({ entry: post, link: `/blog/${post.id}` })),
    ...stories.map((story) => ({ entry: story, link: `/data/${story.id}` })),
  ]
    .sort((a, b) => b.entry.data.date.valueOf() - a.entry.data.date.valueOf())
    .map(({ entry, link }) => ({
      title: entry.data.title,
      pubDate: entry.data.date,
      description: entry.data.summary,
      link,
      categories: entry.data.tags,
    }));

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    trailingSlash: false,
    items,
  });
}
