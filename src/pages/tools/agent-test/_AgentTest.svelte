<script lang="ts">
  import { onMount } from "svelte";
  import { Agent } from "@earendil-works/pi-agent-core";
  import { getOpenRouterModel, openrouterStreamFn, type ORModel } from "@lib/agent/openrouter-models";
  import { ToggleGroup } from "bits-ui";
  import { getKey } from "@scripts/keystore";
  import AgentChat from "@components/AgentChat.svelte";
  import ORModelPicker from "@components/ORModelPicker.svelte";
  import { oilPriceTool } from "@lib/agent/tools/oil-prices";
  import { oilEventsTool } from "@lib/agent/tools/oil-events";
  import { oilNewsTool } from "@lib/agent/tools/oil-news";
  import { marketQuotesTool } from "@lib/agent/tools/market-quotes";

  const DEFAULT_MODEL_ID = "google/gemini-3.1-flash-lite-preview";
  const SYSTEM_PROMPT = `You are a concise assistant that answers questions about oil prices and energy markets.
You have tools for: live market quotes (WTI + Brent, refreshed hourly, with headlines), historical price data (monthly back to 1987, daily recent), major historical events, and recent news.
For "current price" questions use get_market_quotes; for trends use get_oil_prices.
Use your tools to fetch data before answering. Keep responses short and factual.
When discussing trends, mention specific prices and dates.
When asked about current events, check the news tool for recent context.
Format responses using markdown — use **bold** for key numbers, bullet lists for comparisons, and headers for longer answers.`;

  const SUGGESTIONS = [
    "What's the current oil price?",
    "How did COVID affect oil prices?",
    "What's happening in oil markets right now?",
    "Show me the price trend for the last year",
    "What were the biggest oil price crashes in history?",
    "How does OPEC affect oil prices?",
  ];

  let selectedModelId = $state(DEFAULT_MODEL_ID);
  let selectedModel = $state<ORModel | undefined>();
  let agent: Agent | null = $state(null);
  let error = $state("");
  let ready = $state(false);
  let chatMode = $state<"page" | "terminal">("page");

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
          // Without this, reasoning-capable models get effort "none" and never think
          thinkingLevel: selectedModel.reasoning ? "medium" : "off",
          tools: [marketQuotesTool, oilPriceTool, oilEventsTool, oilNewsTool],
        },
        streamFn: openrouterStreamFn,
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
    // Switching models mid-response: abort the current run first so the
    // next prompt cleanly uses the new model
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
      <ToggleGroup.Root
        type="single"
        value={chatMode}
        onValueChange={(v) => { if (v) chatMode = v as "page" | "terminal"; }}
        class="ml-auto flex items-center border rounded overflow-hidden"
      >
        <ToggleGroup.Item
          value="page"
          class="px-2 py-1 text-xs text-gray-400 data-[state=on]:bg-gray-200 data-[state=on]:text-gray-700 hover:bg-gray-50 transition-colors"
        >page</ToggleGroup.Item>
        <ToggleGroup.Item
          value="terminal"
          class="px-2 py-1 text-xs text-gray-400 data-[state=on]:bg-gray-200 data-[state=on]:text-gray-700 hover:bg-gray-50 transition-colors"
        >terminal</ToggleGroup.Item>
      </ToggleGroup.Root>
    </div>
    <AgentChat {agent} suggestions={SUGGESTIONS} placeholder="Ask about oil prices..." mode={chatMode} />
  </div>
{/if}
