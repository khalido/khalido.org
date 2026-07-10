<script lang="ts">
  import { AreaChart, LineChart } from "layerchart";

  let brent = $state<{ date: Date; value: number }[]>([]);
  let error = $state("");

  $effect(() => {
    fetch("/data/oil/prices.json")
      .then((r) => r.json())
      .then((json) => {
        brent = json.brent.map((d: { date: string; value: number }) => ({
          date: new Date(d.date),
          value: d.value,
        }));
      })
      .catch((e) => (error = e.message));
  });

  // Static sample for a second chart flavour
  const recentYears = $derived(brent.filter((d) => d.date.getFullYear() >= 2020));
</script>

<div class="max-w-3xl">
  <h1 class="text-2xl font-semibold mb-1">LayerChart test</h1>
  <p class="text-sm text-gray-500 mb-6">
    LayerChart 2.0 (Svelte 5 runes) with default styles — Brent crude from the oil dataset.
  </p>

  {#if error}
    <p class="text-red-600 text-sm">{error}</p>
  {:else if brent.length === 0}
    <p class="text-gray-400 text-sm animate-pulse">loading…</p>
  {:else}
    <h2 class="text-sm font-medium text-gray-600 mb-2">Brent crude, full history (AreaChart)</h2>
    <div style="height: 320px; width: 100%;">
      <AreaChart data={brent} x="date" y="value" />
    </div>

    <h2 class="text-sm font-medium text-gray-600 mt-8 mb-2">Since 2020 (LineChart)</h2>
    <div style="height: 320px; width: 100%;">
      <LineChart data={recentYears} x="date" y="value" />
    </div>
  {/if}
</div>
