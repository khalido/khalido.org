export function getRelatedTags(posts: any[], currentTag: string) {
  // Get all tags from posts that contain the current tag
  const relatedTags = posts
    .filter((post) => post.data.tags.includes(currentTag))
    .map((post) => post.data.tags)
    .flat();

  // Remove duplicates and the current tag
  return [...new Set(relatedTags)].filter((tag) => tag !== currentTag);
}

export function getIntersectingPostsUrl(tag1: string, tag2: string) {
  return `/tags/${tag1}+${tag2}`;
}
