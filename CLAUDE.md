# Overview

khalido.org is a personal website with a mix of blog posts, recipes, javascript utilities, notes and anything else i might want to refer back to.

The primary goal is to have a easy to understand code base which works well and serves my content fast.

## Tech Stack

* Framework: [Astro](https://docs.astro.build/en/getting-started/)
* Styling: [Tailwind CSS](https://tailwindcss.com/)
* Interactivity: [@astrojs/svelte](https://docs.astro.build/en/guides/integrations-guide/svelte/)
* UI Components: [shadcn-svelte](https://www.shadcn-svelte.com/)
* Content is in markdown `.md` or MDX `.mdx` files.
* Package Manager: npm

## 🚀 Project Structure

You'll see the following folders and files:

```
├── public/ - static assets, like images, can be placed in the `public/` directory.
├── src/
│   ├── components/ - Astro or Svelte components for sitewide use
│   ├── content/ - collections of related Markdown and MDX documents.
│   ├── layouts/
│   └── pages/ -  `.astro` or `.md` or `.mdx` files are exposed as a route based on the file name
├── astro.config.mjs
├── README.md - Human friendly README
├── package.json
└── tsconfig.json
└── AGENTS.md - overview and instructions for AI agents
```

### Personal web tools

I have a `pages/tools` page which contains a list of simple html+svelte+javascript tools (with optional ui [shadcn-svelte ui components](https://shadcn-svelte.com/docs/components), inspired a bit by [tools.simonwillison.net](https://tools.simonwillison.net/).

Folder with the tool name e.g: /tools/word-counter and a `index.astro` file inside it. All tool specific files like `.js` or `.svelte` components should be inside the tool folder.  Use shadcn-svelte UI components in where possible instead of building your own.

The tool should start with
`import BaseLayout from "@layouts/BaseLayout.astro";`

the index.astro file is currently a manual listing of all the tools.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:3000`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## AI Agent Guidelines
- Follow exisiting file structure
- Update this file as needed
- Use context7 MCP server to fetch current documentation for Astro, Tailwind, Svelte, shadcn-svelte, or any other technologies when needed.
- add `export const prerender = false` at the top of the individual page or endpoint you want to render on demand. 

### Logging Requirements
- **Always add comprehensive logging** to new features and complex operations
- In development/debug mode, log important data to stdout/console (emails, API responses, user flows)
- Log key user actions and system state changes to help with debugging
- Include timestamps and context in log messages
- For authentication flows, log verification links and tokens to console in dev mode
- Logging counts as a tool - use it to help the AI agent understand application flow and debug issues
- Example: `console.log('[Auth] Verification email sent:', { email, verificationLink })`

### Constraints and Guardrails
- Don't install new packages without asking
- For major architectural changes, summarize and ask for approval
- For new features: create implementation plan and get approval

# Task

## Active task and steps

Help the user move the blog from github pages to Cloudflare Workers
- [wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) 
- Deploy to cloudflare Workers via CI/CD - use github actions or [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/#workers-builds). 

Resources
- [Deploy your Astro Site to Cloudflare](https://docs.astro.build/en/guides/deploy/cloudflare/)
- https://docs.astro.build/en/guides/integrations-guide/cloudflare/
- https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/ and 

## Future tasks
- lightweight auth
- store per user API key:value pairs
- llm chat tool - stores openai api key in browser storage, possbibly using a lib like [LLM.js](https://llmjs.themaximalist.com/) which runs in the browser, or using vercels AI lib [with svelte](https://github.com/vercel/ai-chatbot-svelte) or [cloudflare agents](https://developers.cloudflare.com/agents/).
  - Evaluate options, keep it simple. A number of tools might use an llm lib to process a user input or image.

# AI notes

Short notes and learnings about the code base which the AI agent will find helpful.

# Changelog

Put a short summary of completed tasks. 
