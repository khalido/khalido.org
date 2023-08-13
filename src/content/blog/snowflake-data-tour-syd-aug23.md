---
title: "Snowflake Data World Tour Sydney"
pubDate: 2023-08-11
description: "Seeing what Snowflake is promising the world of data."
tags:
  - data
---

# Snowflake data world tour

> [#](https://www.snowflake.com/events/data-cloud-world-tour-sydney) The Data Cloud World Tour is all about collaborating with data in unimaginable ways. Join us and your fellow data, technology and business leaders to learn about the latest capabilities of the Data Cloud and hear directly from our customers about their most exciting use cases.

[Theo Hourmouzis](https://www.linkedin.com/in/thourmouzis/)  - VP at Snowflake ANZ
* Customers using Snowflake to store data, do analytics and provide insights
* Data is in many seperate silos - SF is un-siloing the data - making it more accessible where its needed
	* data lakes/warehouse started on this, but data is still spread across many different tables
* A lot of data is unstructured, hard to get insights on, SF is now providing tools to get insights directly - see [document ai](https://youtu.be/OTycMK18d2M).
* build applications with python

## Keynote:  Data at CBA

[Dr Andrew McMullan](https://www.linkedin.com/in/andrew-mcmullan-5707ab47/) - CDO, CBA and [Nathan Attrell](https://www.linkedin.com/in/nathan-attrell-aabb68227/) 

tl;dr CBA is guns blazing in snowflake modelling and LLMing all their data

* Orgs have many different data questions, CBA deploys multifunctional crew across the org to provide insights where needed
* using SF to build AI models at lunch time and deploy them in the evening
	* nice, very agile for a huge company. Though this is a bank, whats the risk assessment and monitoring process?
* so many thousands of docs frontline team has to be across, using LLMs to provide a chat interface - you can have a conversation with the document repo
* Using generative AI in the app - e.g the benefit finder is using gen AI to tailor images and text to the customer profile. 
	* There are over 320 benefits available, so for e.g gen aI makes it easier to tell a customer you are eligible for a rebate on your green slip.
	* greatly increased update of the benefit finder
* CBA looks to the tech giants, partners with [h20.ai](https://h2o.ai/), which is integrated with SnowFlake, getting excellent results.
* The slowest part of anything at CBA was moving the data where it was needed, snowflake is allowing them to stop thinking about moving data and instead just allows safe and easy data easy
	* can run models on more data, as on snowflake its easy to go across the width of your data
	* commbank rewards - system where businesses can reward or make offers to customers, CBA uses data science to make sure this is creating value for both the biz and customer.
* Hallucination risks with gen ai:
	* engineered in a way to only return information from their documents
	* using Retrieval Augmented Generation and other tools to combat (did not get technical)
* Goal is to give everyone at CBA access to their data via an easy to use interface

## why snowflake is the platform

tl;dr snowflake is a one stop data shop, from ingestion all the way to bespoke apps

[Prabhath Nanisetty](https://www.linkedin.com/in/prabhathnanisetty/) leads retail data & quick commerce
* done tons of migrations to snowflake.
* single platform - deploy distribute monetize
	* no upgrades, no patching, no nothing. Data lives, nurtured by snowflake
* SPI - [snowflake performance index](https://www.snowflake.com/blog/measuring-performance-improvements/) - measures sf real world speed
* expanding support for apache iceberg so you can query external iceberg data. if you let sf manage these its 2x faster
* [document ai](https://www.snowflake.com/blog/generative-ai-llms-summit-2023/) - easy put LLM's on top of your data and feed it all the places
* [ML powered functions](https://www.snowflake.com/blog/ml-powered-functions-improve-speed-quality/) - do ML directly in SQL
	* contribution explorer 
	* anomaly detection 
* snowflake marketplace: anyone can build apps, anyone can easily use them. More than 1800 data+apps listing and growing
	* e.g [cybersyn](https://www.snowflake.com/blog/snowflake-invests-cybersyn-bringing-unique-data-products-to-marketplace/) combines data from multiple sources and creates datasets catering to specific needs
	* can run [snowflake native apps](https://www.snowflake.com/en/data-cloud/workloads/applications/native-apps/) directly in your sf account
* [git integration](https://www.snowflake.com/blog/snowflake-expands-developer-programmability-snowpark-container-services/) is coming
* [snowpark](https://www.snowflake.com/en/data-cloud/snowpark/) - 30% of customers use, lots of python improvements coming
* [snowpipe streaming](https://docs.snowflake.com/en/user-guide/data-load-snowpipe-streaming-overview) - serverless data ingestion to snowflake tables
* [snowpark ml api](https://docs.snowflake.com/en/developer-guide/snowpark-ml/index) - provides entire ML pipeline
	* model registery to manage ml model
* [streamlit in snowflake](https://docs.snowflake.com/en/developer-guide/native-apps/adding-streamlit) - run [streamlit](https://streamlit.io/) apps directly in sf. Can quickly turn data models into interactive apps. Allows your data team to become full stack.
	* gets early product into the wild for feedback and quick iteration
* [snowpark container services](https://www.snowflake.com/blog/snowpark-container-services-deploy-genai-full-stack-apps/) - deploy containers - offers gpu, good platform for llms
	* have access to commercial llm's 

## Demo - restaurant chain

- has data being added using snowpipe streaming
- dynamic tables can combine this data with other data tables, and we can assign a latency - currently 1 minute but in the future can lower the latency 
	- e.g add to static menu table, delivery table, etc
- next up - use snowpark ml for feature engineering and ml model
	- using jupyter notebook in vs code - pull in the snowflake lib, it processes the data in the cloud tons faster than using pandas and co on your device
	- moving data out of the cloud is slow, plus the security implications etc, than your machine is slow
- streamlit to make a interface - in this case a mini app to see the ML pricing for menu items, and they can experiment themselves by updating pricing
	- the app generates a demand lift and profit forecast based on this
	- the branch manager can then save their preferred values back to snowflake

## Generative AI and LLM's

tl;dr: Make money using gen ai! snowflake is becoming the platform of choice for gen ai.

Panel: [Dharmesh Kalyan](https://www.linkedin.com/in/dharmeshkalyan/) BI head at Dominos, [Victor Bajanov](https://www.linkedin.com/in/victorbajanov/) Quantium, [Simon Johnston](https://www.linkedin.com/in/simonpeterjohnston/) AI at AWS, [David Wakeman](https://www.linkedin.com/in/wakemandavid/) Marketing Snowflake

**AWS:** ML drives everythigng at Amazon. AWS thinks about the how, there is a lot of amazing models out there, but the how and the cost drives adoption. LLMs are getting more useful every day. 
* [AWS Inferentia2](https://aws.amazon.com/machine-learning/inferentia/) - new chip cheaper for inference. 
* See a lot of potential in robotic automation
* Where are the repetitive mundane tasks? e.g LLM's will take over call center work
* LLM's to access knowledge bases - surface information for the ppl who need it

**Quantium**: 
* done predictive, moving on to how to help ppl get things done, e.g help the Dominos customer place the order
* feedback: every org gets tons of feedback from customers. Historically ppl have had to read that, now LLM's can read and structure feedback.
* LLMs: its very fast and easy now to get something working with LLMs, but really hard to get to a point where you can put it in front of a customer
	* need guide rails 
	* space is changing very fast, need to dedicate ppl to keep up whats going on
	* Can sit back and wait for LLM's to evolve, but is your competition also waiting?

**Dominos:** million pizzas a day in 12 markets
* very tech driven, using AI since the early days
* they look at data in realtime - stores see orders being made on screen with a probability of completion, they can decide to start making the order even before you complete it.
* snowflake allows for data sharing with franchises
	* EDM - direct marketing partners have better, fresher data
* feedback is very imp, currently humans go through feedback, they are interested in how to use LLM's to assist this. 
* lots of awesome models, but business acumen is very important

## Corelogic

tl;dr collects/buy data to provide insights on customers/property

[Hannah Nimot](https://www.linkedin.com/in/hannah-nimot-848a7259/) GM Partnerships at [Corelogic](https://www.corelogic.com.au/), a one stop shop for all property data.

* What is a property worth? Traditionally done by a valuer, Corelogic;s ML model does this weekly. 
* Propensity to list model: estimates who is most likely to move, this data is useful for all kinds of business
* property data universe: CL has lots of geospatial data + data from over 7,000 sources
	* add million data points a month, covers 98% of the market
* Snowflake partnership: ability to host and harness data. Some examples:
	* standardising CRM data across the industry
	* selling [corelogic data on the snowflake marketplace](https://app.snowflake.com/marketplace/providers/GZSUZOCTP/CoreLogic%20Australia), planning on adding more.
* looking to support energy [efficiency targets by working with CSIRO to estimate energy efficiency for every home](https://www.corelogic.com.au/news-research/news/2023/new-tech-to-drive-energy-efficiency-gains-in-australian-homes). 

## VGW: Building an optimal data framework

tl;dr snowflake enabled moving from a tribal setup to just having clean data

[Phillip Hampton](https://www.linkedin.com/in/philliphampton/) head of data platform, [VGW](https://www.linkedin.com/company/virtual-gaming-worlds/), [Rubesh Dhallapah](https://www.linkedin.com/in/rubeshdhallapah/) snowflake cloud

* data platform purpose is to serve corp insights, analytics and data science consumers with datasets that are timely, accurate, comprehensive and well modelled
	* but legacy systems are all over the place with too many tools and not much consistency with stale data which is difficult to track and update
* choose snowflake to lead their data renaissance and become the single source of truth
* VGW data is about their games, customers and purchases
* vgw games are structured as different units, but essentially have the same data. This naturally lead them to multi-tenant tables (MTT) - tenants share one common data model, have similarly shaped data
	* tables contain rows for every tenant, maked by ID
	* adv: multiple consumers can share the same tables, makes things cheaper and allows for easier allocation of costs
* snowflake data framework provides security and governance. Understand, classify and track data and its usage.
	* Monitoring - with dashboards and metrics
* many dashboards targeting the relevant teams: 
	* admin 
	* governance - who is accessing what 
	* tenants (or business units) - how are they performing, what data/processes do they have

## What's Coming in the World of Government and Education

tl;dr big brother view of your citizen/student or other entity 

[Jeff Frazier](https://www.linkedin.com/in/ssjfrazier/)  VP Public Sector, Snowflake

* in times of crisis, govt turns to data. e.g tens of thousands of ppl turn up to help on the aftermath of a big crisis, data helps to map volunteer skills to the ppl needing that help
* sense the market disruption, don't do the right thing too long
* data is driving growth, the top companies are all data driven
	* airline companies which a smaller market cap than their consumer data
	* data is becoming more valuable and tech is reducing time b/w data access and data value
* governments are the largest producer and consumers of data
* growing collaboration: snowflake is seeing institutions share data both within the org and also externally - a nice clustering diagram
	* e.g elevator repair company shares data with a hotel chain so they can both better plan staffing
* data ecosystems: think about what external data could be useful for me? How is my data useful to others?
	* if you had unlimited data resources, what would you want to know?
	* data ecosystems are critical
	* Risk, Fraud, Waste &  Abuse: data sharing b/w orgs makes it easier to battle
* 360 views:  Citizen 360, [Customer 360](https://www.snowflake.com/enable-customer-360-with-snowflake/), Student 360 (also big brother 720 in the future?)


## snowflake data transforms with coalesce

[Satish Jayanthi](https://www.linkedin.com/in/satish-jayanthi-32703613/), CTO [coalesce.io](https://coalesce.io/) Rishi Saxena

* coalesce solves the T in ELT
	* many companies have automated the extract and load part
	* snowflake has automated storage, no need for DBA's
	* many companies in the viz space
	* there are still pain points in the Transformation space

[Coalesce hands on guide](https://guides.coalesce.io/foundations/#0)
* skipped as its just a straightforward no code data join+transformations

> 1. In the Column Editor on the right hand side of the screen, select Data Type and Transform under Attributes. Clarify the Data Type as STRING and enter the transformation `UPPER({{SRC}})`in the Transform field.

Code is easier tha

## LLM's inside snowflake

tl;dr: run your own llm or a partner llm all inside snowflake on top of you data

[Chuang Zhu](https://www.linkedin.com/in/chuangsta/) - sales engr at snowflake

* llm's predict the next word
* embeddings encode information - but better of reading [this embeddings overview](https://vickiboykis.com/what_are_embeddings/)
* fine tuning - adapt the model to a novel task, e.g QA on a doc corpus using specific training examples
* [in context learning](https://thegradient.pub/in-context-learning-in-context/) - a prompt with a few examples of a task helps the model learn to do it without updating weights or any fine tuning
	* without any further fine-tuning, a pre-trained model is able to learn to do something entirely new by merely being shown a few input-output examples.
	* new learnings don't persist
* nl processing vs conversations
* snowflake can provide hosted llm models (expensive), or use a model shared with multiple customers 
	* can download llm container from hugging face and run inside snowflake
	* LLM partners in marketplace are a button click away
* demo: snowflake has a sql function `llm_complete` which does completions for oss llm, partner llm or external llm

```sql
select llm_complete(concat('what is the campital of ', state, '?') from state limit 10;
select llm_sentiment_score(review) from reviews;
```

* Its ridiculously easy to use llm's inside snowflake
* streamlit 

---

tl;dr for the whole thing: the world is ready for a David Attenborough doc on all the companies leaving behind their overloaded servers unable to keep up and migrating to snowflake
