---
title: Astro Starlight
date: 2024-02-09
summary: Notes on setting up a Astro starlight powered site.
tags:
  - astro
---

[Astro starlight](https://starlight.astro.build/) is a newish documentation website builder. [Docusaurus](https://docusaurus.io/) is awesome, but doesn't have built in search, so out of the box Astro starlight is both complete, and also easier to extend as you can write a component in any framework supported by Astro.

Basically, all the good documentation website frameworks have converged to the same look and feel, so choosing one is more about which one you can grok better.

## a new astro site

I setup a new git repo and cloned it locally. Delete the README file, as the starlight installer needs a blank folder.

So my path is `code/detnsw`, run the command below in the `code` folder and type in `detnsw` when asked:

```sh
npm create astro@latest -- --template starlight
```

Start the dev server by:

```sh
npm run dev           # only exposes to your machine
npm run dev -- --host # expose on your local network, handy for checking on a phone/tablet
```

Why this extra `--` before the `--host`??? Who thought typing 6 dashes was a good idea?

update asto + astro packages by: `npx @astrojs/upgrade`

### Sidebar config

The default install was only showing some docs in the navigation - which was puzzling, until I figured out the default config [hard codes what items appear in the sidebar](https://starlight.astro.build/reference/configuration/#sidebar). In the `astron.confir.mjs` file I removed this section `sidebar: `. This now autoloads every directory and md file under docs in the sidebar.

## Deploy

I'm using Vervel - adding the vercel plugin by: `npx astro add vercel` and used the [deploy guide](https://docs.astro.build/en/guides/deploy/vercel/). This was really easy, once the vercel adapter is in the astro project and its on github, vercel auto-configures everything and builds it on every commit.

- Commits to branches make [preview deployments](https://vercel.com/docs/deployments/preview-deployments) - very hand to test and share with ppl.
- Commits to main update the main site.

I added a custom domain using vercel domains.
