---
title: Astro Blogging
date: 2023-08-09
updated: 2024-12-1
summary: Switched the blog over to Astro
tags:
  - astro
---

This website now runs on [Astro](https://astro.build/), and uses [tailwindcss](https://tailwindcss.com) and mdx.

It previously used an [overly complicated python script](https://github.com/khalido/blog/blob/master/bloggy/blog.py) I wrote, but it kept getting longer, so rather than spend time on the blog engine, using a tool like Astro makes it easier to just write.

## Astro basics

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

- [mdx](https://docs.astro.build/en/guides/integrations-guide/mdx/) - to use components inside posts
- [tailwind](https://docs.astro.build/en/guides/integrations-guide/tailwind/) - style all the things
- [svelte](https://docs.astro.build/en/guides/integrations-guide/svelte/) - for search etc, though not using at the moment

```sh
npx astro add mdx
npx astro add tailwind
npx astro add svelte
```

### Astro Components

## Astro integrations

Astro has a number of [official and community built integrations](https://astro.build/integrations/).

### [Astro mdx](https://docs.astro.build/en/guides/integrations-guide/mdx/)

Using this to have interactive web pages with components, e.g an observable plot etc.

> MDX allows you to use variables, JSX expressions and components within Markdown content in Astro.

```sh
npx astro add mdx
```

#### Observable plot

Trying our embedding an observable plot in mdx.

```html
<div id="myplot"></div>

<script type="module">
  import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

  const plot = Plot.rectY(
    { length: 10000 },
    Plot.binX({ y: "count" }, { x: Math.random, tip: true })
  ).plot();

  //attach to the div
  const div = document.querySelector("#myplot");
  div.append(plot);
</script>
```

The above code should produce a plot with interactive tooltips:

<div id="myplot"></div>

<script type="module">
  import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

  const plot = Plot.rectY(
	  {length: 10000}, Plot.binX({y: "count"}, 
	  {x: Math.random, tip:true})
  ).plot();

  //attach to the div
  const div = document.querySelector("#myplot");
  div.append(plot);
</script>

So the above does work, but I could also look into installing observable into astro by `npm install @observablehq/plot`, and adding it to my blog post template as an import

```js
import * as Plot from "@observablehq/plot";
```

Astro should smartly not include any imports which aren't used on a page, e.g only a few blog pages will have

### [Astro Embed](https://astro-embed.netlify.app/)

grab a youtube/x link on its own line in markdown and embed it.

```sh
npm i astro-embed
```

You can import embed components for more customization, but to keep it simple, setup [Auto-embed URLs in MDX](https://astro-embed.netlify.app/integration/)

### [@astrojs/svelte](https://docs.astro.build/en/guides/integrations-guide/svelte/)

I don't need this for this blog setup, installing this to learn some svelte.

```sh
npx astro add svelte
```

## Misc

### Visualizing Data with Astro and Observable Plot

In this post, we’ll look at how to create data visualizations using Astro and Observable Plot.

Here’s an example visualization of the **Iris dataset**, rendered below:

<div id="iris-plot"></div>

<script is:inline src="./irisPlot.js"></script>
