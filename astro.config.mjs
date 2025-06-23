import { defineConfig } from "astro/config";
import embeds from 'astro-embed/integration';
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
//import { remarkEmbed } from 'astro-embed/integration';

import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://khalido.org",
  integrations: [
    embeds({
    services: {
      YouTube: true,
      Tweet: true,
      Vimeo: false,
      LinkPreview: false, // Disable this to avoid conflicts while testing
      }
    }),
    mdx({
      include: ['**/*.mdx', '**/*.md']
    }),
    sitemap(), svelte()],

  vite: {
    plugins: [tailwindcss()],
  },
});