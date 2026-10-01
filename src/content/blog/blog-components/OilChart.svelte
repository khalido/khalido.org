<script lang="ts">
  // Post-specific chart: LayerChart line + Bits UI range picker. Imports its own
  // colocated CSV, so the post just writes <OilChart client:visible />.
  import { ToggleGroup } from "bits-ui";
  import { LineChart } from "layerchart";
  import brentUrl from "./brent.csv?url";

  let { src = brentUrl }: { src?: string } = $props();

  type Row = { date: Date; price: number };
  let rows = $state<Row[]>([]);
  let error = $state("");
  let range = $state("all");

  const ranges = [
    { value: "all", label: "All", years: Infinity },
    { value: "20", label: "20y", years: 20 },
    { value: "5", label: "5y", years: 5 },
  ];

  $effect(() => {
    fetch(src)
      .then((r) => r.text())
      .then((text) => {
        rows = text
          .trim()
          .split("\n")
          .slice(1)
          .map((line) => {
            const [date, price] = line.split(",");
            return { date: new Date(date), price: +price };
          });
      })
      .catch((e) => (error = e.message));
  });

  const shown = $derived.by(() => {
    const years = ranges.find((r) => r.value === range)?.years ?? Infinity;
    if (!rows.length || years === Infinity) return rows;
    const last = rows[rows.length - 1].date;
    const cutoff = new Date(last.getFullYear() - years, last.getMonth(), 1);
    return rows.filter((d) => d.date >= cutoff);
  });

  const latest = $derived(rows.at(-1));
  const fmtPrice = (v: number) => `$${Math.round(v)}`;
  const fmtYear = (d: Date) => String(d.getFullYear());
</script>

<figure class="not-prose my-6">
  <div class="flex items-baseline justify-between gap-3 mb-2">
    <figcaption class="text-sm text-gray-600">
      Brent crude, monthly average (USD/barrel)
      {#if latest}<span class="text-gray-400">· latest {fmtPrice(latest.price)}</span>{/if}
    </figcaption>
    <ToggleGroup.Root type="single" bind:value={range} class="flex text-xs border border-gray-300 rounded overflow-hidden">
      {#each ranges as r}
        <ToggleGroup.Item
          value={r.value}
          class="px-2 py-0.5 text-gray-600 data-[state=on]:bg-gray-800 data-[state=on]:text-white"
        >{r.label}</ToggleGroup.Item>
      {/each}
    </ToggleGroup.Root>
  </div>

  {#if error}
    <p class="text-sm text-red-600">Couldn't load data: {error}</p>
  {:else}
    <div style="height: 280px">
      {#if rows.length}
        <LineChart
          data={shown}
          x="date"
          y="price"
          props={{ xAxis: { format: fmtYear }, yAxis: { format: fmtPrice } }}
        />
      {/if}
    </div>
  {/if}
</figure>
