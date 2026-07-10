<script lang="ts">
  import ModelPicker from "./ModelPicker.svelte";
  import {
    getOpenRouterModels,
    toModelInfo,
    type ORModel,
    type ModelInfo,
  } from "@lib/agent/openrouter-models";

  /**
   * Self-contained OpenRouter model picker: fetches the live model list
   * (1h cache, builtin fallback) and hands the full pi-ai Model object to
   * `onchange`. Drop into any tool that needs model selection.
   */
  let {
    selectedId = $bindable(""),
    onchange,
    onready,
  }: {
    selectedId?: string;
    onchange?: (model: ORModel) => void;
    /** Fires once with the loaded list — useful to pick a default model */
    onready?: (models: ORModel[]) => void;
  } = $props();

  let models = $state<ORModel[]>([]);

  const infos: ModelInfo[] = $derived(
    models
      .map(toModelInfo)
      .sort((a, b) => {
        if (a.reasoning !== b.reasoning) return a.reasoning ? -1 : 1;
        return a.name.localeCompare(b.name);
      }),
  );

  $effect(() => {
    getOpenRouterModels().then((m) => {
      models = m;
      onready?.(m);
    });
  });

  function handleChange(id: string) {
    selectedId = id;
    const model = models.find((m) => m.id === id);
    if (model) onchange?.(model);
  }
</script>

<ModelPicker models={infos} {selectedId} onchange={handleChange} />
