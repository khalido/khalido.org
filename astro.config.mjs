import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import { defineMdastPlugin } from "satteri";
import embeds from "astro-embed/integration";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";

// Render single newlines as <br> (Obsidian/GitHub style), like remark-breaks.
// Sätteri keeps soft breaks as "\n" inside text nodes; split them into break nodes.
const softBreaks = defineMdastPlugin({
  name: "soft-breaks",
  text(node, ctx) {
    if (!node.value.includes("\n")) return;
    const out = [];
    node.value.split("\n").forEach((part, i) => {
      if (i > 0) out.push({ type: "break" });
      if (part) out.push({ type: "text", value: part });
    });
    ctx.insertAfter(node, out);
    ctx.removeNode(node);
  },
});

// :::ai blocks — AI-written explanatory content with full markdown (links, lists),
// unlike ```ai code fences which render plain text. Styled via .ai-block in global.css.
// Text/leaf directives are turned back into literal text so prose like "10:30" survives.
const aiDirective = defineMdastPlugin({
  name: "ai-directive",
  containerDirective(node, ctx) {
    if (node.name !== "ai") return;
    ctx.setProperty(node, "data", { hName: "div", hProperties: { className: "ai-block" } });
  },
  textDirective(node, ctx) {
    const inner = ctx.textContent(node);
    ctx.replaceNode(node, { type: "text", value: `:${node.name}${inner ? `[${inner}]` : ""}` });
  },
  leafDirective(node, ctx) {
    const inner = ctx.textContent(node);
    ctx.replaceNode(node, { type: "text", value: `::${node.name}${inner ? `[${inner}]` : ""}` });
  },
});

// https://astro.build/config
export default defineConfig({
  site: "https://khalido.org",
  // Slashless URLs (/blog/foo not /blog/foo/) so every post pairs with its
  // markdown twin at /blog/foo.md. GH Pages serves the built foo.html at /blog/foo.
  trailingSlash: "never",
  build: { format: "file" },
  markdown: {
    processor: satteri({
      features: { directive: true },
      mdastPlugins: [softBreaks, aiDirective],
    }),
    shikiConfig: {
      langAlias: {
        ai: "plaintext",
        gitignore: "plaintext",
      },
    },
  },
  integrations: [
    embeds({
      services: {
        YouTube: true,
        Tweet: true,
        Vimeo: false,
        LinkPreview: false, // Disable this to avoid conflicts while testing
      },
    }),
    mdx(),
    sitemap(),
    svelte(),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
