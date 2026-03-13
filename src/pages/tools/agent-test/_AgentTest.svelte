<script lang="ts">
  import { onMount } from "svelte";
  import { Agent } from "@mariozechner/pi-agent-core";
  import { getModel, getModels } from "@mariozechner/pi-ai";
  import { ToggleGroup } from "bits-ui";
  import { getKey } from "@scripts/keystore";
  import AgentChat from "@components/AgentChat.svelte";
  import ModelPicker from "@components/ModelPicker.svelte";
  import type { ModelInfo } from "@components/ModelPicker.svelte";
  import { oilPriceTool } from "@lib/agent/tools/oil-prices";
  import { oilEventsTool } from "@lib/agent/tools/oil-events";
  import { oilNewsTool } from "@lib/agent/tools/oil-news";

  const DEFAULT_MODEL_ID = "google/gemini-3.1-flash-lite-preview";
  const SYSTEM_PROMPT = `You are a concise assistant that answers questions about oil prices and energy markets.
You have tools for: price data (monthly back to 1987, daily recent), major historical events, and recent news.
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

  let allModels = $state<ModelInfo[]>([]);
  let selectedModelId = $state(DEFAULT_MODEL_ID);
  const selectedModel = $derived(allModels.find((m) => m.id === selectedModelId));
  let agent: Agent | null = $state(null);
  let error = $state("");
  let ready = $state(false);
  let chatMode = $state<"page" | "terminal">("page");

  onMount(() => {
    try {
      const raw = getModels("openrouter") as any[];
      allModels = raw
        .map((m: any) => ({
          id: m.id,
          name: m.name,
          reasoning: m.reasoning,
          costIn: m.cost.input,
          costOut: m.cost.output,
          contextWindow: m.contextWindow,
        }))
        .sort((a, b) => {
          if (a.reasoning !== b.reasoning) return a.reasoning ? -1 : 1;
          return a.name.localeCompare(b.name);
        });

      const apiKey = getKey("openrouter");
      if (!apiKey) {
        error = "no-key";
        ready = true;
        return;
      }

      agent = new Agent({
        initialState: {
          systemPrompt: SYSTEM_PROMPT,
          model: getModel("openrouter", DEFAULT_MODEL_ID as any),
          tools: [oilPriceTool, oilEventsTool, oilNewsTool],
        },
        getApiKey: () => getKey("openrouter"),
      });

      ready = true;
    } catch (e: any) {
      error = e.message || "Failed to initialize";
      ready = true;
    }
  });

  function onModelChange(modelId: string) {
    selectedModelId = modelId;
    if (agent) {
      const newModel = getModel("openrouter", modelId as any);
      if (newModel) agent.setModel(newModel);
    }
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
  <div class="space-y-3 max-w-2xl">
    <div class="flex items-center gap-3 text-xs text-gray-400">
      <ModelPicker models={allModels} selectedId={selectedModelId} onchange={onModelChange} />
      {#if selectedModel}
        <span title="{selectedModel.contextWindow.toLocaleString()} token context">{(selectedModel.contextWindow / 1000).toFixed(0)}k ctx</span>
        <span>${selectedModel.costIn.toFixed(2)}/${selectedModel.costOut.toFixed(2)}</span>
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
