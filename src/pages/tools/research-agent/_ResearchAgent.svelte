<script lang="ts">
  import { onMount } from "svelte";
  import { Agent } from "@earendil-works/pi-agent-core";
  import { getOpenRouterModel, type ORModel } from "@lib/agent/openrouter-models";
  import { getKey } from "@scripts/keystore";
  import AgentChat from "@components/AgentChat.svelte";
  import ORModelPicker from "@components/ORModelPicker.svelte";
  import { searchPapersTool, getPaperTool, papersCitingTool } from "@lib/agent/tools/papers";
  import { hnFrontPageTool, hnSearchTool, hnStoryTool } from "@lib/agent/tools/hackernews";
  import { hfDailyPapersTool } from "@lib/agent/tools/hf-papers";
  import { fetchPageTool } from "@lib/agent/tools/fetch-page";

  const DEFAULT_MODEL_ID = "google/gemini-3.1-flash-lite-preview";
  const SYSTEM_PROMPT = `You are a research assistant that digs through papers, Hacker News, and the web.

Your sources:
- search_papers / get_paper / papers_citing — academic literature via OpenAlex (all publishers). Snowball: find a seed paper, then papers_citing to go forward.
- hn_front_page — the CURRENT HN front page in one call. Use for "what's hot/latest on HN".
- hn_search / hn_story — practitioner discussion on Hacker News. Search supports days + sort='date' for recency; search a URL or exact title to find discussion of a specific paper/article. The comments often have the real-world caveats papers skip.
- hf_daily_papers — what's trending in ML right now.
- fetch_page — read any URL as text. Use selectively (rate-limited) on the most promising 1-3 sources.

Method: search first, read the best hits, then answer. Cross-check papers against HN discussion when the topic is practical.
Always cite: paper titles with DOI links (https://doi.org/...), HN stories as https://news.ycombinator.com/item?id=..., pages by URL.
Format in markdown. Be concise — findings first, then evidence.`;

  const SUGGESTIONS = [
    "What's trending in ML today?",
    "State of the art on speculative decoding?",
    "What does HN think about local-first software?",
    "Find the RAG survey papers with the most citations",
  ];

  let selectedModelId = $state(DEFAULT_MODEL_ID);
  let selectedModel = $state<ORModel | undefined>();
  let agent: Agent | null = $state(null);
  let error = $state("");
  let ready = $state(false);

  onMount(async () => {
    try {
      const apiKey = getKey("openrouter");
      if (!apiKey) {
        error = "no-key";
        ready = true;
        return;
      }

      selectedModel = await getOpenRouterModel(DEFAULT_MODEL_ID);
      if (!selectedModel) throw new Error(`default model ${DEFAULT_MODEL_ID} not found`);

      agent = new Agent({
        initialState: {
          systemPrompt: SYSTEM_PROMPT,
          model: selectedModel,
          thinkingLevel: selectedModel.reasoning ? "medium" : "off",
          tools: [
            searchPapersTool,
            getPaperTool,
            papersCitingTool,
            hnFrontPageTool,
            hnSearchTool,
            hnStoryTool,
            hfDailyPapersTool,
            fetchPageTool,
          ],
        },
        getApiKey: () => getKey("openrouter"),
      });

      ready = true;
    } catch (e: any) {
      error = e.message || "Failed to initialize";
      ready = true;
    }
  });

  function onModelChange(model: ORModel) {
    selectedModel = model;
    if (!agent) return;
    if (agent.state.isStreaming) agent.abort();
    agent.state.model = model as any;
    agent.state.thinkingLevel = model.reasoning ? "medium" : "off";
  }
</script>

{#if !ready}
  <p class="text-sm text-gray-400">Loading...</p>
{:else if error === "no-key"}
  <div class="p-4 bg-amber-50 rounded border border-amber-200">
    <p>
      Set your OpenRouter API key in <a href="/tools/settings" class="underline font-medium">Settings</a> first.
    </p>
  </div>
{:else if agent}
  <div class="space-y-3 max-w-4xl">
    <div class="flex items-center gap-3 text-xs text-gray-400">
      <ORModelPicker bind:selectedId={selectedModelId} onchange={onModelChange} />
      {#if selectedModel}
        <span title="{selectedModel.contextWindow.toLocaleString()} token context">{(selectedModel.contextWindow / 1000).toFixed(0)}k ctx</span>
        <span>${selectedModel.cost.input.toFixed(2)}/${selectedModel.cost.output.toFixed(2)}</span>
        {#if selectedModel.reasoning}<span class="text-purple-400">reasoning</span>{/if}
      {/if}
    </div>
    <AgentChat {agent} suggestions={SUGGESTIONS} placeholder="Research anything — papers, HN, the web..." />
  </div>
{:else if error}
  <div class="p-3 bg-red-50 rounded text-sm text-red-700">{error}</div>
{/if}
