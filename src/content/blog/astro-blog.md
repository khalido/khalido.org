---
title: "Astro"
pubDate: 2023-08-09
description: "Switched the blog over to Astro"
tags:
  - astro
---

# Astro

This website now runs on [Astro](https://astro.build/), and uses [tailwindcss](https://tailwindcss.com) and mdx.

It previously used an [overly complicated python script](https://github.com/khalido/blog/blob/master/bloggy/blog.py) I wrote, but it kept getting longer, so rather than spend time on the blog engine, using a tool like Astro makes it easier to just write. 


## Astro basics

Install by: 

```sh
# create a new project with npm
npm create astro@latest
```

Start the dev server by:
```sh
npm run dev           # only exposes to your machine
npm run dev -- --host # expose on your local network, handy for checking on a phone/tablet
```
Why npm has this extra `--` before the `--host`???

Upgrade astro by `npx @astrojs/upgrade`

Setup integrations:

* [mdx](https://docs.astro.build/en/guides/integrations-guide/mdx/) - to use components inside posts
* [tailwind](https://docs.astro.build/en/guides/integrations-guide/tailwind/) - style all the things
* [svelte](https://docs.astro.build/en/guides/integrations-guide/svelte/) - for search etc

```sh
npx astro add mdx
npx astro add tailwind
npx astro add svelte
```