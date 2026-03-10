# Obsidian Web Clipper Setup for Link Posts

Quick-capture interesting links as blog posts using [Obsidian Web Clipper](https://help.obsidian.md/web-clipper).

## Prerequisites

- [Obsidian](https://obsidian.md/) installed
- Obsidian vault open at (or including) `~/code/khalido.org/`
- [Obsidian Web Clipper](https://help.obsidian.md/web-clipper) browser extension installed

## Clipper Template

In Obsidian Web Clipper settings, create a new template called **"Link Post"**:

**File name:**
```
{{date:YYYY-MM-DD}}-{{title|slugify}}
```

**Folder:**
```
src/content/blog/links
```

**Template content:**
```markdown
---
date: {{date:YYYY-MM-DD}}
link: {{url}}
tags: []
type: link
draft: true
---

{{selection|blockquote}}
```

## Workflow

1. **Clip**: Browse to an interesting page, select relevant text (optional), click the clipper icon, choose "Link Post"
2. **Edit**: Open in Obsidian later, add your commentary above the quote, add tags, review
3. **Publish**: Remove `draft: true` (or set to `false`), then `git commit && git push`

## Tips

- Selected text becomes a blockquote automatically via `{{selection|blockquote}}`
- `title` in frontmatter is optional — if omitted, the feed shows the link's domain name
- Add a `title` field manually if you want a custom heading
- Tags are empty by default — add them during the edit step
- All link posts live in `src/content/blog/links/` for organization but render at `/blog/links/...`
- `draft: true` is the default so nothing publishes until you explicitly remove it

## Frontmatter Reference

```yaml
---
date: 2026-03-09          # required
link: https://example.com  # the external URL
title: "Optional title"    # omit for untitled link posts
tags: [ai, tools]          # add during editing
type: link                 # required — marks this as a link post
via: https://...           # optional — where you found the link
viaTitle: "Hacker News"    # optional — name of the source
draft: true                # remove to publish
---
```
