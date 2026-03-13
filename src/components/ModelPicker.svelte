<script lang="ts">
  import { Command, Toggle } from "bits-ui";

  export interface ModelInfo {
    id: string;
    name: string;
    reasoning: boolean;
    costIn: number;
    costOut: number;
    contextWindow: number;
  }

  let {
    models = [],
    selectedId = "",
    onchange,
  }: {
    models: ModelInfo[];
    selectedId: string;
    onchange: (id: string) => void;
  } = $props();

  let open = $state(false);
  let freeOnly = $state(false);

  const visibleModels = $derived(
    freeOnly ? models.filter((m) => m.costIn === 0 && m.costOut === 0) : models,
  );

  const selectedModel = $derived(models.find((m) => m.id === selectedId));
  const freeCount = $derived(models.filter((m) => m.costIn === 0 && m.costOut === 0).length);

  function selectModel(id: string) {
    open = false;
    onchange(id);
  }

  function formatCost(costIn: number, costOut: number): string {
    if (costIn === 0 && costOut === 0) return "free";
    return `$${costIn.toFixed(2)}/$${costOut.toFixed(2)}`;
  }

  function truncate(s: string, max: number): string {
    return s.length > max ? s.slice(0, max) + "…" : s;
  }
</script>

<div class="relative text-sm">
  <button
    onclick={() => { open = !open; }}
    class="border rounded px-2.5 py-1.5 bg-white text-left truncate max-w-56"
    title={selectedModel?.name ?? selectedId}
  >
    {selectedModel ? truncate(selectedModel.name, 24) : selectedId || "Select model…"}
  </button>

  {#if open}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="fixed inset-0 z-40"
      onclick={() => { open = false; }}
      onkeydown={(e) => e.key === "Escape" && (open = false)}
    ></div>
    <div class="absolute top-full left-0 mt-1 z-50 w-[32rem] rounded border bg-white shadow-lg">
      <Command.Root shouldFilter={true}>
        <div class="flex items-center gap-2 border-b px-2 py-1.5">
          <Command.Input
            placeholder="Search {visibleModels.length} models…"
            class="flex-1 text-sm outline-none bg-transparent"
            autofocus
          />
          <Toggle.Root
            pressed={freeOnly}
            onPressedChange={(v) => { freeOnly = v; }}
            class="px-1.5 py-0.5 text-xs rounded border transition-colors shrink-0
              {freeOnly
                ? 'bg-green-100 text-green-700 border-green-300'
                : 'text-gray-400 border-gray-200 hover:border-gray-300'}"
          >free</Toggle.Root>
        </div>
        <Command.List>
          <Command.Viewport class="max-h-72 overflow-y-auto">
            <Command.Empty>
              <div class="px-3 py-4 text-sm text-gray-400 text-center">No models found</div>
            </Command.Empty>
            {#each visibleModels as m (m.id)}
              <Command.Item
                value={m.name}
                keywords={[m.id]}
                onSelect={() => selectModel(m.id)}
                class="flex items-center justify-between gap-2 px-2.5 py-1.5 text-sm cursor-pointer data-[highlighted]:bg-blue-50 {m.id === selectedId ? 'font-medium' : ''}"
              >
                <span class="truncate min-w-0">
                  {m.name}
                  {#if m.reasoning}<span class="text-xs text-purple-500 ml-1">reasoning</span>{/if}
                </span>
                <span class="text-xs text-gray-400 shrink-0">{formatCost(m.costIn, m.costOut)}</span>
              </Command.Item>
            {/each}
          </Command.Viewport>
        </Command.List>
      </Command.Root>
    </div>
  {/if}
</div>
