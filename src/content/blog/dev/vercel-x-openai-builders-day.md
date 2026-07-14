---
title: "Vercel x OpenAI in Sydney"
date: 2026-04-28
summary: notes taken during/after this meetup
tags:
  - ai
---

I'm building with AI, sometimes on top of Vercel's [ai sdk](https://ai-sdk.dev/) (also eying the [chat sdk](https://chat-sdk.dev/)) and [ai gateway](https://vercel.com/ai-gateway) so [Vercel x OpenAI Builder Day](https://luma.com/vercel-openai-builder-day) seemed like a good place to meet others building on Vercel + AI.

> Connect with fellow builders who will be in Sydney for Sunrise and take home a mix of technical demos, practical insights, and proven patterns for building with AI. You'll also get a chance to meet with Liminal and Crane, two international venture firms helping startups scale globally.

## Vercel

It's a new era of software dev: More software will be written next year than in the last 30yrs by everyone, not just coders. 

Vercel is building FAANG style managed DevOps infra for everyone. Codex/Claude is increasingly writing the code, managing the evals, infrastructure, roll backs, security, testing, QA and all the other fun stuff of running apps is what vercel is providing. They call it self driving infra - agents monitor, catch issues, write a PR to fix them, alert monitoring humans.

Vercel builds vercel on vercel using vercel. Vercel has 100+ agents deployed. Example - d0 is a [data scientist agent](https://vercel.com/templates/next.js/oss-data-analyst-agent-reference-architecture) which does BI for all in vercel's slack. It uses
- chat sdk to connect to the users
- ai sdk for agent loop using ai gateway
	- ai gateway makes it easy to compare models and pick the right one for your cost/intelligence requirements
- [workflows](https://vercel.com/workflows) to make your flows durable e.g tool fails, workflow suspends the agent, pings tool owner, tool gets fixed, agent resumed
- [sandbox](https://vercel.com/sandbox) to run code, build dynamic BI graphs

[v0](https://v0.app/) is vercel's app building agent. It uses [vercel's agent skills](https://vercel.com/docs/agent-resources/skills) to build things on top of vercel infra. They demo'd a simple [twoup game](https://v0-two-up.vercel.zone/)[^1], looked good but I did note the vibecoded app seemed to put every player in their own game instead of the promised land of joining everyone in the room. 

## Openai

Demo of codex along with 3 months free codex! 

Build a pixelated fps game
- ask codex to generate a screenshot of a FPS game - basically a pixellated doom x counterstrike
- ask codex to create the full game and generate image and midi assets
- wait many minutes as codex autonomously goes ahead and generates the game
- it kind of worked! though it looked totally different from the screenshot. 
- deploy to vercel with `@vercel deploy` - this is the most interesting part.

Also demo'd a super mario clone built with codex.

**My takeaway is that making clones is easy - but even with baked demos and vercel agent skills it wasn't very convincing.** I like vercel primitives and codex - but the cake they bake autonomously is not quite there yet for bigger, proper flows. 

I think what all this is missing is the [real work](https://hamel.dev/blog/posts/revenge/):

> The bulk of the work is setting up experiments to test how well the AI generalizes to unseen data, debugging stochastic systems, and designing good metrics. Calling an LLM over an API does not make this work go away.

The other codex demo was using it for non-coding day to day work by connecting it to your data. A nice example: a colleague asked a technical question, his codex read the question, did the work, posted the reply back to slack. This could have been just a bot, didn't seem any need for the human here besides the initial work to setup some codex flows. Read every incoming msg, incant the answer if appropriate agent skill found or send to human.

[Liminal](https://liminal.build/) and [Crane](https://crane.vc/) were also there, just noting their websites for posterity. 

Since this demo, [Fable 5](https://simonwillison.net/2026/Jun/9/claude-fable-5/) and [GPT 5.6](https://simonwillison.net/2026/Jul/9/gpt-5-6/) have launched. Many of the rough edges in the demos have already been taken care of by the newer smarter models. 

[^1]: The link is dead, which aptly serves to illustrate how AI generated artifacts aren't long for the world. This was a throwaway game built for this talks, but even in the biz world I am seeing ppl generate artifacts, get excited, tell their company peers how they have solved A, B and C - but the tool rots away and no one uses it. 

This is also linked to the fact that artefacts aren't connecting life to data, they're not maintaining state, a bunch of other things. 