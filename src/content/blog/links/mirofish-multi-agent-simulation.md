---
date: 2026-03-15
link: https://github.com/666ghj/MiroFish
tags: [ai, agentic, llm]
---

[MiroFish](https://github.com/666ghj/MiroFish) — looks really interesting. It builds agents based on text you feed it (anything really!) and simulates them. The genius idea here really is, you don't even have to think about agents, you need it, it'll figure it all out itself. 

> You feed it a document, and it builds a world of AI agents that argue about it on simulated Twitter and Reddit. Each agent gets an LLM-generated persona — age, MBTI, profession, stance on the issue — and they interact across both platforms simultaneously.

```ai
MiroFish runs through five steps: it extracts entities from your document into a knowledge graph, generates AI agent personas from those entities, runs parallel simulations on fake Twitter and Reddit (via the OASIS framework), writes a cited report using ReACT-pattern retrieval, and keeps the simulation alive so you can interview individual agents afterwards.

The dual-platform approach is the interesting bit — same agents, different platform mechanics (threading vs flat posts, upvotes vs likes), so you see how platform design shapes the same debate differently. The stack is Vue 3 + Flask + Zep Cloud for the knowledge graph, with no database — simulations are just JSON/JSONL files on disk.
```
