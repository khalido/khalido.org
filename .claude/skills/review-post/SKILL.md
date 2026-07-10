---
name: review-post
description: Review a blog post draft for factual accuracy, weak arguments, and typos. Use when the user has finished writing a post and wants feedback before publishing. Spawns parallel sonnet subagents for research, simulated reactions, and devil's advocate critique.
user-invocable: true
---

# Review Post

Review a finished blog post draft. The goal is to help the human publish stronger work — surface what they might have missed, **never rewrite their prose**.

## Usage

```
/review-post src/content/blog/til/my-post.mdx
```

If no path is given, ask which post to review.

## Process

Read the full post first to understand the thesis, structure, and claims. Then run steps 1-4 as **parallel sonnet subagents** for speed. Step 5 runs in the main (opus) context.

### 1. Proofread (sonnet subagent)

Carefully read the post and identify:
- Spelling mistakes and typos
- Grammar mistakes
- Repeated terms or phrases ("It was interesting that X, and it was interesting that Y")
- Logical errors or factual mistakes
- Empty or placeholder links
- Broken markdown/MDX syntax

Report issues with line numbers. Do not suggest rewording — just flag the problems.

### 2. Research check (sonnet subagent)

Search for expert consensus on the post's key claims using web search (exa).
- Flag factual claims that contradict known expert positions
- Note where experts have consensus vs. disagreement on the topic
- Find supporting evidence the author might want to cite
- Identify missing context that would strengthen the argument

### 3. Simulated reactions (sonnet subagent)

Generate 20-30 simulated HN/Reddit comments from named perspectives:

**Required perspectives** (at least one comment each):
- **Interested beginner** — doesn't have domain context, asks "dumb" questions that reveal where the post assumes too much knowledge
- **Domain expert** — has deep experience, spots oversimplifications, adds nuance the author missed, or confirms the post gets it right
- **Skeptic** — thinks the whole premise is wrong, pushes back on foundations
- **Practitioner** — tried this (or something similar) and had a different experience
- **The person who shares it** — would they look smart or foolish forwarding this to colleagues or posting it on LinkedIn? If the post has a contrarian take, is it well-argued enough to survive that forwarding test, or does it come across as uninformed?

**Also include:**
- Genuine engagement and interesting follow-up questions
- Constructive "well actually" corrections
- Questions the post doesn't answer but readers will ask

Make the comments feel authentic — terse, opinionated, specific. Not generic praise. The beginner and expert perspectives in particular help catch both "this is inaccessible" and "this is wrong" failure modes.

### 4. Steel-man the opposite (sonnet subagent)

Without seeing any other feedback, argue against the post's thesis as convincingly as possible.
- Build the strongest possible counter-argument
- Find the best evidence for the opposing view
- Identify which of the post's assumptions are weakest
- Note where the post might be confusing correlation with causation, survivorship bias, or other reasoning errors
- **Contrarian opinions are fine — illogical ones aren't.** If the post holds a non-mainstream view, don't flag it for being contrarian. Instead, test whether the reasoning actually supports the conclusion. A well-argued minority position is strong; a position that *feels* contrarian but rests on a logical gap is a liability.

This is not nitpicking — it's building a genuine case for the other side.

### 5. Synthesize (main context, opus)

Before writing the summary, re-read the post with fresh eyes informed by all the subagent feedback. If the post's core argument is ambiguous — you can't confidently state what the author is actually trying to say — **stop and ask clarifying questions first**. Interview the author until you're confident you understand their real point, not just the surface-level one. Common signs you should ask:

- The thesis could be read two different ways
- The post argues X but the examples support Y
- Key terms are used loosely and could mean different things
- The conclusion doesn't follow from the body

Only proceed to the summary once you're clear on what the author actually means.

**Cross-check the steel-man against research findings.** The steel-man agent runs from training data without web search. Before including any of its counter-arguments, verify them against what the research agent found. If the steel-man makes a factual claim that the research agent's sources contradict (e.g., "X has never happened" when it demonstrably has), discard that counter-argument and note why. The steel-man's logical/structural critiques are still valuable even when its facts are stale — keep those, drop the ones built on wrong facts.

Collect all subagent results and present a structured summary:

```
## Post Review: [post title]

### Core Argument (as I understand it)
[one sentence — what you think the post is actually saying]

### Proofread
[typos, grammar, broken links — with line numbers]

### Factual / Research Issues
[claims that need sources, expert disagreements, missing context]

### Strongest Counter-Arguments
[the best 2-3 points from the devil's advocate]

### What Readers Will Ask
[top questions/objections from simulated comments, grouped by theme]

### Simulated Comments
[the full set of simulated reactions]
```

## Rules

- **Do NOT rewrite any prose.** The human writes all published text.
- **Do NOT suggest alternative phrasing.** Flag problems, don't fix them.
- **Do NOT add qualifiers** like "you might want to consider" — be direct.
- **Preserve the author's voice.** The goal is accuracy and strength, not polish.
- Present findings without editorializing — let the human decide what to act on.
- If the post is solid and you can't find real issues, say so. Don't manufacture feedback.
