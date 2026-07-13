<script>
  import { Combobox } from "bits-ui";

  let tz1 = $state(Intl.DateTimeFormat().resolvedOptions().timeZone);
  let tz2 = $state("Asia/Kolkata");
  let baseHour = $state(8);

  const allTimezones = Intl.supportedValuesOf("timeZone");

  // Search text for the two comboboxes — we filter, bits-ui handles
  // keyboard nav / open-close / aria
  let search1 = $state("");
  let search2 = $state("");

  function filtered(query) {
    const q = query.toLowerCase();
    if (!q) return allTimezones.slice(0, 20);
    return allTimezones.filter(tz => tz.toLowerCase().includes(q)).slice(0, 20);
  }

  function friendlyName(tz) {
    return tz.replace(/_/g, " ").replace(/\//g, " / ");
  }

  function getOffset(tz) {
    const now = new Date();
    const str = now.toLocaleString("en-US", { timeZone: tz, timeZoneName: "shortOffset" });
    const match = str.match(/GMT([+-]\d+(?::\d+)?)/);
    if (!match) return 0;
    const [h, m] = match[1].split(":").map(Number);
    return h < 0 ? h - (m || 0) / 60 : h + (m || 0) / 60;
  }

  function diffHours(tz1, tz2) {
    const o1 = getOffset(tz1);
    const o2 = getOffset(tz2);
    return o2 - o1;
  }

  function formatDiff(diff) {
    const sign = diff >= 0 ? "+" : "";
    const h = Math.trunc(diff);
    const m = Math.abs(Math.round((diff - h) * 60));
    return m ? `${sign}${h}h ${m}m` : `${sign}${h}h`;
  }

  // Generate 24 hour rows starting from baseHour in tz1
  let rows = $derived.by(() => {
    const diff = diffHours(tz1, tz2);
    const result = [];
    for (let i = 0; i < 24; i++) {
      const h1 = (baseHour + i) % 24;
      const h2Raw = h1 + diff;
      const h2 = ((h2Raw % 24) + 24) % 24;
      const m2 = Math.round((Math.abs(diff) % 1) * 60);
      const dayOffset = Math.floor((baseHour + i + diff) / 24) - Math.floor((baseHour + diff) / 24);

      const awake1 = h1 >= 8 && h1 < 21;
      const awake2Hr = h2 + m2 / 60;
      const awake2 = awake2Hr >= 8 && awake2Hr < 21;
      const evening1 = h1 === 21 || h1 === 22;
      const evening2 = Math.floor(awake2Hr) === 21 || Math.floor(awake2Hr) === 22;
      const asleep1 = h1 >= 23 || h1 < 8;
      const asleep2 = awake2Hr >= 23 || awake2Hr < 8;
      const overlap = awake1 && awake2;
      const bothAsleep = asleep1 && asleep2;

      result.push({
        h1,
        h2: Math.floor(h2),
        m2,
        awake1,
        awake2,
        evening1,
        evening2,
        overlap,
        bothAsleep,
        dayLabel: dayOffset > 0 ? "+1d" : dayOffset < 0 ? "-1d" : "",
      });
    }
    return result;
  });

  function fmt(h, m) {
    return `${String(h).padStart(2, "0")}:${String(m || 0).padStart(2, "0")}`;
  }

</script>

{#snippet tzList(search)}
  {@const matches = filtered(search)}
  {#each matches as tz (tz)}
    <Combobox.Item
      value={tz}
      label={friendlyName(tz)}
      class="px-2 py-1.5 text-[13px] rounded cursor-pointer data-[highlighted]:bg-gray-100"
    >
      {friendlyName(tz)}
    </Combobox.Item>
  {:else}
    <div class="px-2 py-1.5 text-[13px] text-gray-400">No matching timezone</div>
  {/each}
{/snippet}

<div class="tz-wrap">
  <div class="tz-pickers">
    <div class="tz-picker">
      <label for="tz-from">From</label>
      <Combobox.Root type="single" bind:value={tz1} onOpenChange={(o) => { if (o) search1 = ""; }}>
        <Combobox.Input
          id="tz-from"
          class="w-[200px] px-2.5 py-1.5 border border-gray-300 rounded-md text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
          placeholder="Search timezone..."
          defaultValue={friendlyName(tz1)}
          oninput={(e) => (search1 = e.currentTarget.value)}
        />
        <Combobox.Portal>
          <Combobox.Content class="z-50 w-[240px] max-h-[200px] overflow-y-auto bg-white border border-gray-300 rounded-md shadow-lg p-1" sideOffset={4}>
            <Combobox.Viewport>
              {@render tzList(search1)}
            </Combobox.Viewport>
          </Combobox.Content>
        </Combobox.Portal>
      </Combobox.Root>
    </div>

    <div class="tz-picker">
      <label for="tz-to">To</label>
      <Combobox.Root type="single" bind:value={tz2} onOpenChange={(o) => { if (o) search2 = ""; }}>
        <Combobox.Input
          id="tz-to"
          class="w-[200px] px-2.5 py-1.5 border border-gray-300 rounded-md text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
          placeholder="Search timezone..."
          defaultValue={friendlyName(tz2)}
          oninput={(e) => (search2 = e.currentTarget.value)}
        />
        <Combobox.Portal>
          <Combobox.Content class="z-50 w-[240px] max-h-[200px] overflow-y-auto bg-white border border-gray-300 rounded-md shadow-lg p-1" sideOffset={4}>
            <Combobox.Viewport>
              {@render tzList(search2)}
            </Combobox.Viewport>
          </Combobox.Content>
        </Combobox.Portal>
      </Combobox.Root>
    </div>

    <div class="tz-picker">
      <label>Start hour</label>
      <input type="number" bind:value={baseHour} min="0" max="23" class="tz-hour" />
    </div>
  </div>

  <p class="tz-diff">
    {friendlyName(tz2)} is <strong>{formatDiff(diffHours(tz1, tz2))}</strong> from {friendlyName(tz1)}
  </p>

  <div class="tz-table-wrap">
    <table class="tz-table">
      <thead>
        <tr>
          <th>{friendlyName(tz1).split(" / ").pop()}</th>
          <th></th>
          <th>{friendlyName(tz2).split(" / ").pop()}</th>
        </tr>
      </thead>
      <tbody>
        {#each rows as row}
          <tr class:overlap={row.overlap} class:both-asleep={row.bothAsleep}>
            <td class:sun={row.awake1} class:evening={row.evening1} class:night={!row.awake1 && !row.evening1}>
              {fmt(row.h1, 0)}
            </td>
            <td class="tz-bar">
              <div class="bar-cell">
                <span class="bar bar-left" class:bar-sun={row.awake1} class:bar-evening={row.evening1} class:bar-night={!row.awake1 && !row.evening1}></span>
                <span class="bar bar-right" class:bar-sun={row.awake2} class:bar-evening={row.evening2} class:bar-night={!row.awake2 && !row.evening2}></span>
              </div>
            </td>
            <td class:sun={row.awake2} class:evening={row.evening2} class:night={!row.awake2 && !row.evening2}>
              {fmt(row.h2, row.m2)}
              {#if row.dayLabel}<span class="day-label">{row.dayLabel}</span>{/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <p class="tz-legend">
    <span class="legend-swatch overlap-swatch"></span> Both awake
    <span class="legend-swatch awake-swatch"></span> Daytime (8am–9pm)
    <span class="legend-swatch asleep-swatch"></span> Night (10pm–8am)
  </p>
</div>

<style>
  .tz-wrap {
    font-family: system-ui, sans-serif;
    max-width: 500px;
  }
  .tz-pickers {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }
  .tz-picker {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .tz-picker label {
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .tz-hour {
    padding: 6px 10px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    width: 70px;
  }
  .tz-diff {
    font-size: 14px;
    color: #374151;
    margin: 0 0 12px;
  }
  .tz-table-wrap {
    overflow-x: auto;
  }
  .tz-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    font-variant-numeric: tabular-nums;
  }
  .tz-table th {
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 600;
    color: #374151;
    border-bottom: 2px solid #e5e7eb;
    text-align: left;
  }
  .tz-table td {
    padding: 4px 12px;
    color: #6b7280;
    border-bottom: 1px solid #f3f4f6;
  }
  /* Per-cell: sun (awake) = warm yellow bg, night (asleep) = dark slate bg */
  td.sun {
    background: #fef9c3;
    color: #713f12;
  }
  td.evening {
    background: #334155;
    color: #cbd5e1;
  }
  td.night {
    background: #1e293b;
    color: #94a3b8;
  }
  /* Both awake = full warm row */
  .tz-table tr.overlap td.sun {
    background: #fef08a;
    color: #713f12;
    font-weight: 500;
  }
  /* Both asleep = full dark row */
  .tz-table tr.both-asleep td.night {
    background: #0f172a;
    color: #64748b;
  }
  .tz-bar {
    width: 40px;
    padding: 0 !important;
    background: transparent !important;
  }
  .bar-cell {
    display: flex;
    height: 100%;
    gap: 2px;
    justify-content: center;
    padding: 2px 0;
  }
  .bar {
    display: block;
    width: 6px;
    height: 100%;
    min-height: 18px;
    border-radius: 2px;
  }
  .bar-sun { background: #facc15; }
  .bar-evening { background: #64748b; }
  .bar-night { background: #334155; }
  tr.overlap .bar-sun { background: #eab308; }
  .day-label {
    font-size: 11px;
    color: inherit;
    opacity: 0.6;
    margin-left: 4px;
  }
  .tz-legend {
    font-size: 12px;
    color: #6b7280;
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .legend-swatch {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 2px;
  }
  .overlap-swatch { background: #fef08a; }
  .awake-swatch { background: #fef9c3; }
  .asleep-swatch { background: #1e293b; }
</style>
