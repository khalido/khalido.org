<script lang="ts">
  /**
   * Sortable table with CSV download. `data` (rows) or `src` (.csv/.json URL).
   * `columns` picks/orders columns (default: keys of the first row).
   * Numbers right-aligned and formatted; long tables show `limit` rows + "show all".
   */
  import { csvParse, csvFormat, autoType } from "d3-dsv";
  import { formatter, type Format } from "./palette";

  type Row = Record<string, any>;

  let {
    data = undefined,
    src = "",
    columns = undefined,
    format = "number",
    limit = 10,
    title = "",
    filename = "data.csv",
  }: {
    data?: Row[];
    src?: string;
    columns?: string[];
    format?: Format;
    limit?: number;
    title?: string;
    filename?: string;
  } = $props();

  let fetched = $state<Row[] | null>(null);
  let error = $state("");
  let sortKey = $state("");
  let sortDesc = $state(false);
  let showAll = $state(false);

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
  const cols = $derived(columns ?? Object.keys(rows[0] ?? {}));
  const fmt = $derived(formatter(format));
  const dateFmt = new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" });

  const sorted = $derived.by(() => {
    if (!sortKey) return rows;
    const dir = sortDesc ? -1 : 1;
    return [...rows].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      return (av > bv ? 1 : av < bv ? -1 : 0) * dir;
    });
  });
  const visible = $derived(showAll ? sorted : sorted.slice(0, limit));

  function sortBy(col: string) {
    if (sortKey === col) sortDesc = !sortDesc;
    else { sortKey = col; sortDesc = false; }
  }

  function cell(v: unknown, col: string): string {
    if (v instanceof Date) return dateFmt.format(v);
    // Year-like integer columns shouldn't get thousands separators
    if (typeof v === "number" && /^(year|yr)$/i.test(col)) return String(v);
    if (typeof v === "number") return fmt(v);
    return String(v ?? "");
  }

  function download() {
    const blob = new Blob([csvFormat(rows, cols)], { type: "text/csv" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: filename });
    a.click();
    URL.revokeObjectURL(a.href);
  }
</script>

<figure class="ktable not-prose">
  {#if title || rows.length}
    <div class="ktable-head">
      <figcaption>{title}</figcaption>
      {#if rows.length}<button onclick={download} class="ktable-btn">⤓ CSV</button>{/if}
    </div>
  {/if}
  {#if error}
    <p class="ktable-error">Couldn't load table data: {error}</p>
  {:else}
    <div class="ktable-scroll">
      <table>
        <thead>
          <tr>
            {#each cols as col}
              <th class:num={typeof rows[0]?.[col] === "number"}>
                <button onclick={() => sortBy(col)}>
                  {col}{sortKey === col ? (sortDesc ? " ↓" : " ↑") : ""}
                </button>
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each visible as row}
            <tr>
              {#each cols as col}
                <td class:num={typeof row[col] === "number"}>{cell(row[col], col)}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    {#if rows.length > limit}
      <button class="ktable-more" onclick={() => (showAll = !showAll)}>
        {showAll ? "Show fewer" : `Show all ${rows.length} rows`}
      </button>
    {/if}
  {/if}
</figure>

<style>
  .ktable { margin: 1rem 0; font-size: 0.8125rem; }
  .ktable-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.375rem; }
  .ktable-head figcaption { font-weight: 600; color: #374151; font-size: 0.875rem; }
  .ktable-btn, .ktable-more {
    font-size: 0.75rem; color: #6b7280; background: none; border: 1px solid #e5e7eb;
    border-radius: 4px; padding: 1px 8px; cursor: pointer;
  }
  .ktable-btn:hover, .ktable-more:hover { background: #f9fafb; color: #374151; }
  .ktable-more { margin-top: 0.375rem; }
  .ktable-scroll { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
  th { text-align: left; border-bottom: 1px solid #d1d5db; padding: 0; }
  th button {
    all: unset; cursor: pointer; display: block; width: 100%; padding: 4px 8px;
    font-weight: 600; color: #374151; box-sizing: border-box;
  }
  th.num button, td.num { text-align: right; }
  td { padding: 3px 8px; border-bottom: 1px solid #f3f4f6; color: #374151; }
  tbody tr:hover { background: #f9fafb; }
  .ktable-error { color: #b91c1c; }
</style>
