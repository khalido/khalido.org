<script lang="ts">
  /**
   * Opinionated line / bar / area chart on LayerChart. One component for MDX
   * (<Chart … />), Svelte, and code blocks (line()/bar()/area() in CodeRunner).
   *
   * Data: `data` (array of rows) or `src` (URL to .csv/.json, fetched client-side).
   * Series: long format via `series="type"` (one line per value of that column),
   * or wide format via `y={["domestic", "international"]}`.
   * Defaults: hover tooltip, legend for ≥2 series, fixed palette order, compact
   * numbers, year-ish x labels, 300px tall. `options` passes straight to LayerChart.
   */
  import { LineChart, BarChart, AreaChart } from "layerchart";
  import { csvParse, autoType } from "d3-dsv";
  import { SERIES, formatter, xFormatter, type Format } from "./palette";

  type Row = Record<string, any>;

  let {
    type = "line",
    data = undefined,
    src = "",
    x,
    y,
    series = undefined,
    format = "compact",
    height = 300,
    stack = false,
    title = "",
    caption = "",
    options = {},
  }: {
    type?: "line" | "bar" | "area";
    data?: Row[];
    src?: string;
    x: string;
    y: string | string[];
    series?: string;
    format?: Format;
    height?: number;
    stack?: boolean;
    title?: string;
    caption?: string;
    options?: Record<string, any>;
  } = $props();

  let fetched = $state<Row[] | null>(null);
  let error = $state("");

  $effect(() => {
    if (data || !src) return;
    fetch(src)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} fetching ${src}`);
        return /\.json(\?|$)/.test(src) ? r.json() : r.text().then((t) => csvParse(t, autoType));
      })
      .then((rows) => (fetched = rows))
      .catch((e) => (error = e.message));
  });

  const rows = $derived<Row[]>(data ?? fetched ?? []);

  // Normalise to wide rows + a list of series keys
  const shaped = $derived.by(() => {
    if (series && typeof y === "string") {
      const keys: string[] = [];
      const byX = new Map<string, Row>();
      for (const r of rows) {
        const k = String(r[series]);
        if (!keys.includes(k)) keys.push(k);
        const xv = r[x];
        const id = xv instanceof Date ? String(+xv) : String(xv);
        if (!byX.has(id)) byX.set(id, { [x]: xv });
        byX.get(id)![k] = r[y];
      }
      return { wide: [...byX.values()], keys };
    }
    return { wide: rows, keys: Array.isArray(y) ? y : [y] };
  });

  const multi = $derived(shaped.keys.length > 1);
  const seriesProp = $derived(
    shaped.keys.map((key, i) => ({ key, value: key, color: SERIES[i % SERIES.length] })),
  );

  const fmtY = $derived(formatter(format));
  const fmtX = $derived.by(() => {
    const first = shaped.wide[0]?.[x];
    const last = shaped.wide.at(-1)?.[x];
    const span = first instanceof Date && last instanceof Date ? Math.abs(+last - +first) / 864e5 : Infinity;
    return xFormatter(first, span);
  });

  // Tooltip header is more precise than axis ticks: dates show month + year
  const monthYear = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" });
  const fmtHeader = $derived((v: unknown) => (v instanceof Date ? monthYear.format(v) : fmtX(v)));

  const Component = $derived(type === "bar" ? BarChart : type === "area" ? AreaChart : LineChart);

  // `any`: one props object feeds Line/Bar/AreaChart, whose prop types differ
  const chartProps: any = $derived.by(() => {
    const { props: extraProps = {}, ...extra } = options;
    return {
    data: shaped.wide,
    x,
    // room for "$1.2M"-width y labels so they aren't clipped
    padding: { top: 8, right: 12, bottom: multi ? 48 : 24, left: 48 },
    series: seriesProp,
    legend: multi,
    ...(type === "bar" && multi ? { seriesLayout: stack ? "stack" : "group" } : {}),
    ...(type === "area" && multi && stack ? { seriesLayout: "stack" } : {}),
    props: {
      xAxis: { format: fmtX },
      yAxis: { format: fmtY },
      // "total" only means something when series are stacked
      tooltip: { item: { format: fmtY }, header: { format: fmtHeader }, hideTotal: !stack },
      // thin marks: no outline, 4px rounded data end
      bars: { stroke: "none", radius: 4, rounded: "edge" },
      ...extraProps,
    },
    ...extra,
    };
  });
</script>

<figure class="kchart not-prose">
  {#if title}<figcaption class="kchart-title">{title}</figcaption>{/if}
  {#if error}
    <p class="kchart-error">Couldn't load chart data: {error}</p>
  {:else}
    <div style="height: {height}px">
      {#if rows.length}
        <Component {...chartProps} />
      {/if}
    </div>
  {/if}
  {#if caption}<p class="kchart-caption">{caption}</p>{/if}
</figure>

<style>
  .kchart {
    margin: 1rem 0;
    width: 100%;
  }
  .kchart-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.5rem;
  }
  .kchart-caption {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.5rem;
  }
  .kchart-error {
    font-size: 0.875rem;
    color: #b91c1c;
  }
</style>
