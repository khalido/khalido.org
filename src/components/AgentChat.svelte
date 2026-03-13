<script lang="ts">
  import type { Agent, AgentEvent } from "@mariozechner/pi-agent-core";
  import { Streamdown } from "svelte-streamdown";
  import { onMount } from "svelte";

  let {
    agent,
    suggestions = [],
    placeholder = "Ask something...",
    mode = "page",
  }: {
    agent: Agent;
    suggestions?: string[];
    placeholder?: string;
    mode?: "page" | "terminal";
  } = $props();

  let messages = $state<any[]>([]);
  let streamingText = $state("");
  let isStreaming = $state(false);
  let error = $state("");
  let input = $state("");
  let inputEl: HTMLInputElement | undefined = $state();
  let totalCost = $state(0);
  let totalTokens = $state(0);
  let chatContainer: HTMLElement | undefined = $state();
  let suggestionsUsed = $state(0);

  // Streamdown config: hide table/code download buttons
  const streamdownControls = { table: false, code: false };

  // Dark theme overrides for terminal mode code blocks
  const terminalCodeTheme = {
    code: {
      base: "my-2 w-full overflow-hidden rounded border border-gray-700 flex flex-col",
      container: "relative overflow-visible bg-gray-900 p-2 font-mono text-sm text-gray-300",
      header: "flex items-center justify-between bg-gray-900 px-2 py-1 text-gray-500 text-xs",
      pre: "overflow-x-auto font-mono p-0 bg-gray-900",
    },
    codespan: {
      base: "bg-gray-800 text-gray-300 rounded px-1.5 py-0.5 font-mono text-[0.9em]",
    },
    table: {
      base: "overflow-x-auto max-w-full my-2 border border-gray-700 rounded",
      table: "w-full border-collapse min-w-full",
    },
    thead: { base: "bg-gray-800" },
    tr: { base: "border-gray-700 border-b" },
    td: { base: "px-3 py-2 text-sm text-gray-300" },
    th: { base: "px-3 py-2 text-sm text-gray-300" },
  };

  const visibleSuggestions = $derived(
    suggestions.length === 0
      ? []
      : suggestions.slice(suggestionsUsed).slice(0, 3),
  );

  /** Group messages into display blocks: user bubbles, activity accordions, and assistant text */
  interface ActivityItem {
    type: "thinking" | "tool_call" | "tool_result";
    name?: string;
    args?: any;
    text: string;
    count?: number;
  }

  interface DisplayBlock {
    kind: "user" | "assistant" | "activity";
    text?: string;
    items?: ActivityItem[];
    cost?: number;
  }

  const displayBlocks = $derived.by(() => {
    const blocks: DisplayBlock[] = [];
    let pendingActivity: ActivityItem[] = [];

    function flushActivity() {
      if (pendingActivity.length > 0) {
        blocks.push({ kind: "activity", items: [...pendingActivity] });
        pendingActivity = [];
      }
    }

    for (const msg of messages) {
      if (msg.role === "user") {
        flushActivity();
        blocks.push({ kind: "user", text: getMessageText(msg) });
      } else if (msg.role === "assistant") {
        if (Array.isArray(msg.content)) {
          for (const c of msg.content) {
            if (c.type === "thinking" && c.thinking) {
              pendingActivity.push({
                type: "thinking",
                text: c.thinking,
              });
            } else if (c.type === "toolCall") {
              pendingActivity.push({
                type: "tool_call",
                name: c.name,
                args: c.arguments,
                text: JSON.stringify(c.arguments),
              });
            }
          }
        }
        const text = getMessageText(msg);
        if (text) {
          flushActivity();
          blocks.push({ kind: "assistant", text, cost: msg.usage?.cost?.total });
        }
      } else if (msg.role === "toolResult") {
        const resultText = getMessageText(msg);
        pendingActivity.push({
          type: "tool_result",
          name: msg.toolName,
          text: resultText.slice(0, 200),
          count: msg.details?.count,
        });
      }
    }
    flushActivity();
    return blocks;
  });

  onMount(() => {
    agent.subscribe((event: AgentEvent) => {
      messages = [...agent.state.messages];
      isStreaming = agent.state.isStreaming;
      if (
        event.type === "message_update" &&
        agent.state.streamMessage?.role === "assistant"
      ) {
        const textContent = agent.state.streamMessage.content?.find(
          (c: any) => c.type === "text",
        );
        streamingText = textContent?.text || "";
      }
      if (event.type === "message_end" || event.type === "agent_end") {
        streamingText = "";
        const assistantMsgs = agent.state.messages.filter((m: any) => m.role === "assistant");
        totalCost = assistantMsgs.reduce((sum: number, m: any) => sum + (m.usage?.cost?.total || 0), 0);
        totalTokens = assistantMsgs.reduce((sum: number, m: any) => sum + (m.usage?.totalTokens || 0), 0);
      }
      if (mode === "terminal" && chatContainer) {
        requestAnimationFrame(() => {
          chatContainer!.scrollTop = chatContainer!.scrollHeight;
        });
      }
    });
    inputEl?.focus();
  });

  function getMessageText(msg: any): string {
    if (typeof msg.content === "string") return msg.content;
    if (Array.isArray(msg.content)) {
      return msg.content.find((c: any) => c.type === "text")?.text || "";
    }
    return "";
  }

  function activitySummary(items: ActivityItem[]): string {
    const parts: string[] = [];
    const hasThinking = items.some((i) => i.type === "thinking");
    if (hasThinking) parts.push("thinking");
    const tools = items.filter((i) => i.type === "tool_result");
    for (const t of tools) {
      const label = t.name || "tool";
      parts.push(t.count ? `${label} (${t.count})` : label);
    }
    if (parts.length === 0) {
      const calls = items.filter((i) => i.type === "tool_call");
      for (const c of calls) parts.push(c.name || "tool");
    }
    return parts.join(" → ");
  }

  async function send() {
    if (!input.trim() || isStreaming) return;
    error = "";
    const msg = input.trim();
    input = "";
    inputEl?.focus();
    try {
      await agent.prompt(msg);
    } catch (e: any) {
      error = e.message || "Something went wrong";
    }
    inputEl?.focus();
  }

  function useSuggestion(suggestion: string) {
    input = suggestion;
    suggestionsUsed++;
    send();
  }

  function formatCost(cost: number): string {
    if (cost === 0) return "";
    if (cost < 0.01) return `$${cost.toFixed(4)}`;
    return `$${cost.toFixed(2)}`;
  }
</script>

{#snippet activityBlock(items: ActivityItem[], dark: boolean)}
  <details class="group">
    <summary class="cursor-pointer select-none flex items-center gap-1.5 text-[11px] {dark ? 'text-gray-600 hover:text-gray-400' : 'text-gray-400 hover:text-gray-500'} transition-colors">
      <svg class="w-3 h-3 shrink-0 transition-transform group-open:rotate-90" viewBox="0 0 16 16" fill="currentColor">
        <path d="M6 4l4 4-4 4V4z" />
      </svg>
      <span class="font-mono">{activitySummary(items)}</span>
    </summary>
    <div class="mt-1.5 ml-4.5 space-y-1.5 text-[11px] font-mono {dark ? 'text-gray-600' : 'text-gray-400'}">
      {#each items as item}
        {#if item.type === "thinking"}
          <details class="group/think">
            <summary class="cursor-pointer select-none flex items-center gap-1.5 {dark ? 'text-purple-500/60 hover:text-purple-400/80' : 'text-purple-400 hover:text-purple-500'}">
              <span>💭</span>
              <span>thinking ({item.text.length} chars)</span>
            </summary>
            <div class="mt-1 ml-5 whitespace-pre-wrap break-words {dark ? 'text-gray-600' : 'text-gray-400'} max-h-40 overflow-y-auto">
              {item.text}
            </div>
          </details>
        {:else if item.type === "tool_call"}
          <div class="flex gap-1.5">
            <span class="{dark ? 'text-blue-500/60' : 'text-blue-400'}">→</span>
            <span><span class="font-semibold">{item.name}</span>({item.text})</span>
          </div>
        {:else if item.type === "tool_result"}
          <div class="flex gap-1.5">
            <span class="{dark ? 'text-green-500/60' : 'text-green-400'}">←</span>
            <span><span class="font-semibold">{item.name}</span>{#if item.count} ({item.count}){/if}: {item.text.slice(0, 120)}{#if item.text.length > 120}…{/if}</span>
          </div>
        {/if}
      {/each}
    </div>
  </details>
{/snippet}

<!-- Terminal mode -->
{#if mode === "terminal"}
<div class="border border-gray-700 rounded-lg bg-gray-950 text-gray-300 font-mono text-sm flex flex-col" style="height: 36rem;">
  <div class="flex justify-between items-center px-3 py-1.5 border-b border-gray-800 text-xs text-gray-500">
    <span>agent</span>
    {#if totalCost > 0}
      <span>{formatCost(totalCost)} · {totalTokens.toLocaleString()} tokens</span>
    {/if}
  </div>

  <div class="flex-1 overflow-y-auto p-3 space-y-3" bind:this={chatContainer}>
    {#each displayBlocks as block}
      {#if block.kind === "user"}
        <div class="flex justify-end">
          <div class="px-3 py-1.5 bg-amber-900/40 text-amber-200 rounded max-w-[80%]">
            {block.text}
          </div>
        </div>
      {:else if block.kind === "activity" && block.items}
        {@render activityBlock(block.items, true)}
      {:else if block.kind === "assistant"}
        <div class="text-gray-300 max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:py-0.5 [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_strong]:text-gray-200 [&_a]:text-blue-400">
          <Streamdown content={block.text ?? ""} controls={streamdownControls} theme={terminalCodeTheme} />
        </div>
      {/if}
    {/each}

    {#if isStreaming}
      <div class="text-gray-300 max-w-none [&_p]:my-1 [&_strong]:text-gray-200">
        {#if streamingText}
          <Streamdown content={streamingText} controls={streamdownControls} theme={terminalCodeTheme} />
        {:else}
          <span class="text-gray-600 animate-pulse">thinking...</span>
        {/if}
      </div>
    {/if}

    {#if error}
      <div class="text-red-400 text-xs">{error}</div>
    {/if}
  </div>

  <div class="border-t border-gray-800 bg-gray-900/80 px-3 py-2.5">
    <div class="flex items-center gap-2">
      <span class="text-amber-700">$</span>
      <input
        bind:this={inputEl}
        bind:value={input}
        onkeydown={(e) => e.key === "Enter" && send()}
        placeholder={placeholder}
        class="flex-1 bg-transparent text-amber-200 placeholder-gray-500 outline-none caret-amber-400"
        disabled={isStreaming}
      />
    </div>
  </div>

  {#if visibleSuggestions.length > 0}
    <div class="flex gap-2 px-3 py-2 border-t border-gray-800 bg-gray-900/50">
      {#each visibleSuggestions as suggestion}
        <button
          onclick={() => useSuggestion(suggestion)}
          class="text-[11px] px-2.5 py-1 border border-gray-700 rounded text-gray-500 hover:text-amber-300 hover:border-amber-800 transition-colors"
        >{suggestion}</button>
      {/each}
    </div>
  {/if}
</div>

<!-- Page mode -->
{:else}
<div class="space-y-3">
  {#if displayBlocks.length > 0}
    <div class="space-y-3" bind:this={chatContainer}>
      {#each displayBlocks as block}
        {#if block.kind === "user"}
          <div class="flex justify-end">
            <div class="px-3 py-2 bg-amber-100 text-amber-900 rounded-2xl rounded-br-sm max-w-[80%]">
              <p class="text-sm">{block.text}</p>
            </div>
          </div>
        {:else if block.kind === "activity" && block.items}
          {@render activityBlock(block.items, false)}
        {:else if block.kind === "assistant"}
          <div class="prose prose-sm max-w-none">
            <Streamdown content={block.text ?? ""} controls={streamdownControls} />
          </div>
        {/if}
      {/each}
    </div>
  {/if}

  {#if isStreaming}
    <div class="prose prose-sm max-w-none">
      {#if streamingText}
        <Streamdown content={streamingText} controls={streamdownControls} />
      {:else}
        <p class="text-sm text-gray-400 animate-pulse">thinking...</p>
      {/if}
    </div>
  {/if}

  {#if error}
    <div class="p-3 bg-red-50 rounded text-sm text-red-700">{error}</div>
  {/if}

  <div class="flex gap-2">
    <input
      bind:this={inputEl}
      bind:value={input}
      onkeydown={(e) => e.key === "Enter" && send()}
      {placeholder}
      class="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent caret-blue-600"
      disabled={isStreaming}
    />
    <button
      onclick={send}
      disabled={isStreaming || !input.trim()}
      class="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50 hover:bg-blue-700 transition-colors"
    >
      {isStreaming ? "..." : "Send"}
    </button>
  </div>

  <div class="flex items-center justify-between">
    {#if visibleSuggestions.length > 0}
      <div class="flex flex-wrap gap-2">
        {#each visibleSuggestions as suggestion}
          <button
            onclick={() => useSuggestion(suggestion)}
            class="text-[11px] px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-all"
          >{suggestion}</button>
        {/each}
      </div>
    {:else}
      <div></div>
    {/if}
    {#if totalCost > 0}
      <span class="text-xs text-gray-400" title="{totalTokens.toLocaleString()} tokens">
        {formatCost(totalCost)} · {totalTokens.toLocaleString()} tokens
      </span>
    {/if}
  </div>
</div>
{/if}
