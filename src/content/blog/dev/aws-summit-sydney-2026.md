---
title: AWS Summit 2026 Sydney
date: 2026-05-13
summary: notes and some cents from attending AWS Sydney
tags:
  - ai
---
A visit to the AWS Summit. This was super busy with barely room to squeeze past ppl and booths. Everything is Agentic and AI, the only mention of other things is how you can best feed them to AI or how you can enable AI to monitor the thing. The thing itself is now demoted to barely worth a mention.

There is a who's who of serious, real AI enablers sprinkled with snake oils sales booths promising AI will do all the things. This is a a bit of a sad observation - it is true that LLM's are becoming so able that everything benefits from agentic workflows - but its clear that some companies are bolting on AI where it doesn't quite fit and others will hand over money to AI hucksters who will fail to deliver the right AI fit.

On the whole though - while you can get a good feel on whats happening in the Agentic AI space by reading hckrnews and following ppl like [Simon Willison](https://simonwillison.net/), it was useful to see 100's of companies in real life, attend a few talks, gasbag to a few ppl.

Notes and thoughts from some of the talks I attended.

## practioners guide to using data in agentic ai

This talk starts with 2026's number one dev concern: how best to go "from single shot inference to multi-step autonomous action".

The data pipeline has been the same for ages
1. Understand data, how its produced, why, whats useful
2. Store somewhere (database, files, etc)
3. Transform and use this data
4. Create or do new things from this data

The data contract changes with agentic AI. Its very easy to give the agent tools to do all the above but now we have lost any deterministic ordering - today's agent can go to town in any order with these tools. We are very much in the wild west agentic gold rush.

To really truly madly properly use agents we really need to
1. structure data and provide context to allow agents to understand and use it properly
2. how do we orchestrate everything - memory, loops, ID
3. Observe all the things agents do and govern/catch/eval. This is a key step - without observability its hard to do evals and improvements. In the rush to build and the warm glow of agentic ai actually working its easy to skip or half arse this step.

So really, you need good old fashioned business process mapping consultant style to understand the current process PLUS a good understanding of data, AI, agent loops, tools, what different models are good at, plus dev tooling around all this and a bunch more I'm skipping - to start designing a good agentic flow.

This talk was about data - but with agents the data is everything so my takeaway is: with agents all the old principles around data apply to agents. With any robust data setup you already should be monitoring, evaluating, governing, improving - we just now do this at the agent level as well.

Agents are different enough to data - agents being loops with code superpowers - That you need to build systems. Current players are still heavily working on ideal agent platforms - meanwhile practicioners are rolling out their own.

## AWS Agentcore

I saw a couple of AWS's [agentcore](https://aws.amazon.com/bedrock/agentcore/) talks. This hit home why modern platforms[^1] and SDK's like Vercel are really taking off - they do a lot less than AWS (e.g identity management and governance) but just looking at the dev demo it is so much easier to dev outside AWS. 
- Need ALL the features - use agentcore
- Not in AWS, consider what features you actually need and pick a easier to use platform

The builders lab in particular highligted how slow and overwhelming the AWS interface has become. There is [AWS CloudFormation](https://aws.amazon.com/cloudformation/) to abstract away all the clicks but the surface and depth of AWS is so vast that just spinning up sensible agent backends is itself a job and the AWS observability tools are so old fashioned and clunky that you need to build your own. 

This makes sense for bigCo - use AWS as a backend, but build custom platforms on top.

**Memory** has become something of a magic add-on to agents - agents need memory, but listening to both the big picture and dev picture of using memory - it seems to me that a lot of the off the shelf memory solutions aren't great - you need to think through how to manage and use memory.

## AWS keynote by Radic Stanoc CTO ANZ
  
> ...learn how organisations of all sizes, and across sectors, are using agentic Al, intelligent automation, and cloud innovation to reimagine their future and drive meaningful change. ...explore how emerging technologies can be used to drive transformation. 
  
It's weird listing to a talk at 1x. 

We can sum up this talk and also this whole summit by:

Imagine a smart untiring analyst who gives an assessment of something by using a bunch of knowledge, related info (context) and some tools (investigate some data, ask a q of another agent/human, etc)

Now just wire up N llm agents to do this, in a loop. The work is on assembling the context and writing the useful tools. Let's outside data quality (everyone has good data, right!) and evals and so on. That's the infra AWS and plenty others are providing. 

Everything is very simple old fashioned software plumbing here. The smarts are provided by the llm. The orchestration and interopbikity amongst agents is not simple but this is something you would use a infra platform to manage - the human job is to understand how and when multi agent orchestration makes sense. 

Choose the right model for the right model - this is just HR applied to models. Modern orchestrators can route using a cheap and fast triage model.  

All the above is doable - many demos out there in the wild. Governance and security is where it's at right now. How to trust your agentic setup?

Sass Ecomics is changing from pricing per seat to per outcome

Data is changing - agents are accessing tons of unstructured data. Data access now needs business logic. Agents need business context and all the unwritten rules clearly written down to properly access data. 

## Healthcare example by AWS engr Anthony

Demod old fashioned healthcare web app

Instead of humans doing stuff - agent does stuff

Reschedule patients - - forgot the check with patient part, just moved them to future slots - I expect my clinic to call and perhaps shift to another dr. Without this step this is just a simple script. A lot of demos and even real apps function like this in the may 2026 agentic ai space. 
  
The demo also includes recording every users every interaction - they use this data to automate more and more stuff. 

The agent keeps building skills based on observations - this could lead to the glorious future or a horribly mish mash of thousands of overlapping skills no one can really understand besides another, smarter agent. A nightly prune and dreaming routine would alleviate most of the ills of allowing agents to build skills. 

Heidi health

Connects to health records, transcripts, everything. Records all consults

Everything about their clients is captured and stored on AWS. The goal is everything medical is done on the Heidi platform or it connects and manages the underlying systems. 

Building hardware - Heidi remote is the start - a small wearable for medical staff u can ask questions to in real time. 

## AI in Marketing - chase trends fast

[Brittany Oliver](https://www.linkedin.com/in/brittanyoliver5/), CMO [Zuro toys](https://zurutoys.com/)

They use AI to analyse AI generate trends to use AI to define briefs for other AI agents to produce social content which is analysed by gatekeeping AI agents before shooting into the wild where the AI slop is then watched presumably by parents and their kids AI agents who place orders.

Very practical, almost dystopian use of ai. I did not genuinely know that so many companies are spending so much money on ingesting and producing AI slop. This is both frightening and reaffirms my belief to keep off social media.

I don't quite see the value of every company with a CMO ingesting ticktoks and instareels and YouTube shorts and paying to analyse them. Why not save the planet and some money and have a third party do this once and provide a ai slop data lake? But then won't this one company know all the trends and produce the most clickable AI content?

Trends last 48-72hrs on social while products take 12-18 months to reach shelfs. Almost half of all toys now are new every year!

One line which stuck with me: **we aren't replacing marketers, we are giving them systems which don't stop watching.**

In one example of AI can enable everyone to do everything - this AI content + toy company is launching AI home design. Why? They didn't say, but they can so why not.

Observations which don't really fit anywhere:
- Aws has moved to being the bedrock for IT infra to being the mass enabler for AI content slop.
- The world of toys has moved away from whatever anyone's old fashioned ideas of toys has ever been to some newage weaponized version. I found this AI slop talk frightening in its lack of awareness of its sheer nihilistic view of kids and toys and reinforced my beleif of old school toys for kids.

## Lendi - going AI native

Agents run the whole refinance workflow. CTO is claiming the entire mortgage flow is fully automated, AI from end to end.

They build a superhero agent with 270 tools, it kept failing. They split it into targeted multi-agent setup and its working much better.

Learnings 
- don't have a monolith agent, gave targeted specialist agents each of which owns a decision. 
- this is not an IT change - its changing how the business runs - everything has to be downstream of the agentic workflows. 
- Don't bolt on AI - rebuild from first principles
- Agents need business instincts and outcomes, not just tasks and tools
- Provide information when needed, don't overwhelm agent with info at stages where its not needed yet

Tech they used of interest:
- FastAPI Agent runtime
- Langfuse for observability

## [TGE](https://teamglobalexp.com/) how data unlocks AI

Aus logistics, 14K emps, 750 depots.

Some of their basic AI use cases:
- Driver takes delivery photo, AI strips PII
- All emps get AI insights to data formerly locked in spreadsheets
	- replaces BI dashboards, just use AI to understand stuff
- Understand Customer sentiment and intent
- Every POC needs an exit criteria
- Have governance and AI framework up front
- Expose uncertainties and data sources

Don't just throw AI things at users, tell them whats going on behind the scene. This builds trust.

The key thing which enabled this (and more) is
- data cleanup and remediation
- consolidated dozens of databases into AWS

## Appendix

AI is well past its initial gold rush era, at AWS it was more dreams of avarice, selling shovels to all the gold dreamers

Words I heard a lot
- Permissions boundaries
- Governance
- Compression of timelines
- Tokenomics

The things no one said, but was apparent in many places, including some of the very serious AWS tech and big bank finance talks:
- AI slop
- Who is the target? At what point does the AI produced consumer content is just feeding the consumers AI, not the actual human - and how to target that AI vs a human. 

[^1]: [Railway](https://railway.com/) and [Vercel](https://vercel.com/) come to mind here. Both of them are so much easier to use and understand than AWS or gCloud, so while more expensive and missing many, many features bigCos need, they are much easier and faster to dev for smaller players. 