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
---

[{{title}}]({{url}}). {{selection|blockquote}}
```

## Workflow

1. **Clip**: Browse to an interesting page, select relevant text (optional), click the clipper icon, choose "Link Post"
2. **Edit**: Open the file later, add your commentary, add tags
3. **Publish**: `git commit && git push` — posts without `draft: true` are published by default

## Tips

- Selected text becomes a blockquote automatically via `{{selection|blockquote}}`
- `link:` in frontmatter is the primary URL (machine-readable for scripts/analysis)
- The body repeats the link inline as markdown — this is intentional (frontmatter for machines, body for readers)
- Title is optional — add one manually if you want a heading on the post
- Tags are empty by default — add them during the edit step
- Add `draft: true` only if you want to hold it back from publishing
- All link posts live in `src/content/blog/links/`

## Frontmatter Reference

```yaml
---
date: 2026-03-09          # required
link: https://example.com  # the external URL (machine-readable)
title: "Optional title"    # omit for untitled link posts
tags: [ai, tools]          # add during editing
via: https://...           # optional — where you found the link
viaTitle: "Hacker News"    # optional — name of the source
draft: true                # optional — only add to hold back from publishing
---
```
