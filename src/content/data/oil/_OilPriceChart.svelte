<script>
  import { onMount } from "svelte";

  let container = $state(null);
  let width = $state(800);
  let loading = $state(true);
  let error = $state(null);

  onMount(async () => {
    try {
      const Plot = await import("@observablehq/plot");

      const [pricesRes, eventsRes, cpiRes] = await Promise.all([
        fetch("/data/oil/prices.json"),
        fetch("/data/oil/events.json"),
        fetch("/data/cpi.json"),
      ]);

      if (!pricesRes.ok || !eventsRes.ok || !cpiRes.ok) {
        error = "Failed to load data. Run: npx tsx scripts/fetch-fred.ts";
        loading = false;
        return;
      }

      const prices = await pricesRes.json();
      const events = await eventsRes.json();
      const cpiData = await cpiRes.json();

      // CPI lookup for inflation adjustment
      const cpiMap = new Map();
      for (const d of cpiData.cpi) {
        if (d.value !== null) cpiMap.set(d.date.slice(0, 7), d.value);
      }
      const latestCpi = cpiData.latestCpiValue;

      // Monthly Brent, inflation-adjusted
      const brentMonthly = prices.brent
        .filter((d) => d.value !== null)
        .map((d) => {
          const cpi = cpiMap.get(d.date.slice(0, 7));
          return {
            date: new Date(d.date),
            value: cpi ? d.value * (latestCpi / cpi) : d.value,
          };
        });

      // Daily Brent OHLC (last 30 days for candlestick detail)
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const brentDaily = (prices.brentDaily || [])
        .filter((d) => d.close !== null && new Date(d.date) >= cutoff)
        .map((d) => ({
          date: new Date(d.date),
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }));

      // Annotations for the long-term chart
      const annotations = events.map((e) =>
        Plot.tip([e.label], {
          x: new Date(e.date),
          y: e.y,
          dy: e.anchor === "bottom" ? -3 : 3,
          anchor: e.anchor,
        })
      );

      function render() {
        if (!container) return;
        container.replaceChildren();

        // --- Chart 1: Full history (monthly, inflation-adjusted) ---
        const longLabel = document.createElement("div");
        longLabel.className = "text-base font-semibold text-gray-700 mb-1";
        longLabel.textContent = "Brent crude — inflation adjusted (2026 USD per barrel)";
        container.appendChild(longLabel);

        const longDesc = document.createElement("div");
        longDesc.className = "text-xs text-gray-400 mb-2";
        longDesc.textContent = `Monthly average, ${brentMonthly[0]?.date.getFullYear()}–${brentMonthly.at(-1)?.date.getFullYear()}. Adjusted using US CPI.`;
        container.appendChild(longDesc);

        const longChart = Plot.plot({
          width,
          height: 320,
          style: { fontSize: "12px", background: "transparent", overflow: "visible" },
          x: { label: null },
          y: { label: "$", grid: true },
          marks: [
            Plot.ruleY([0]),
            Plot.areaY(brentMonthly, {
              x: "date",
              y: "value",
              fill: "#1e40af",
              fillOpacity: 0.08,
            }),
            Plot.lineY(brentMonthly, {
              x: "date",
              y: "value",
              stroke: "#1e40af",
              strokeWidth: 1.5,
              tip: {
                format: {
                  x: (d) => d.toLocaleDateString("en-US", { year: "numeric", month: "short" }),
                  y: (d) => `$${d.toFixed(0)}`,
                },
              },
            }),
            ...annotations,
          ],
        });
        container.appendChild(longChart);

        // --- Chart 2: Last 30 days (daily OHLC candlestick) ---
        if (brentDaily.length > 0) {
          const latest = brentDaily.at(-1);
          const first = brentDaily[0];
          const change = latest.close - first.close;
          const changePct = ((change / first.close) * 100).toFixed(1);
          const changeStr = change >= 0 ? `+$${change.toFixed(2)} (+${changePct}%)` : `-$${Math.abs(change).toFixed(2)} (${changePct}%)`;

          const recentLabel = document.createElement("div");
          recentLabel.className = "text-base font-semibold text-gray-700 mt-8 mb-1";
          recentLabel.textContent = `Last 30 days — $${latest.close.toFixed(2)}`;
          container.appendChild(recentLabel);

          const recentDesc = document.createElement("div");
          recentDesc.className = "text-xs text-gray-400 mb-2";
          recentDesc.textContent = `${first.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} to ${latest.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}. ${changeStr}`;
          container.appendChild(recentDesc);

          const recentChart = Plot.plot({
            width,
            height: 200,
            style: { fontSize: "12px", background: "transparent", overflow: "visible" },
            x: { label: null, type: "band", tickFormat: (d) => d.toLocaleDateString("en-US", { day: "numeric", month: "short" }) },
            y: { label: "$", grid: true },
            marks: [
              // Wicks (high-low)
              Plot.ruleX(brentDaily, {
                x: "date",
                y1: "low",
                y2: "high",
                stroke: "#9ca3af",
                strokeWidth: 1,
              }),
              // Bodies (open-close)
              Plot.ruleX(brentDaily, {
                x: "date",
                y1: "open",
                y2: "close",
                stroke: (d) => (d.close >= d.open ? "#22c55e" : "#ef4444"),
                strokeWidth: Math.max(2, Math.min(8, Math.floor(width / brentDaily.length * 0.6))),
              }),
              // Tooltip
              Plot.tip(brentDaily, Plot.pointerX({
                x: "date",
                y: "close",
                title: (d) =>
                  `${d.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}\n` +
                  `O: $${d.open?.toFixed(2)}  C: $${d.close?.toFixed(2)}\n` +
                  `H: $${d.high?.toFixed(2)}  L: $${d.low?.toFixed(2)}`,
              })),
            ],
          });
          container.appendChild(recentChart);
        }

        // Sources
        const sources = document.createElement("div");
        sources.className = "text-[10px] text-gray-400 mt-4 leading-relaxed";
        sources.innerHTML =
          'Source: ' +
          '<a href="https://fred.stlouisfed.org/series/DCOILBRENTEU" class="underline">FRED/DCOILBRENTEU</a> (monthly), ' +
          '<a href="https://finance.yahoo.com/quote/BZ=F" class="underline">Yahoo Finance/BZ=F</a> (daily), ' +
          '<a href="https://fred.stlouisfed.org/series/CPIAUCSL" class="underline">FRED/CPIAUCSL</a> (CPI). ' +
          `Updated ${new Date(prices.fetchedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}.`;
        container.appendChild(sources);
      }

      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          width = entry.contentRect.width;
          render();
        }
      });

      render();
      observer.observe(container);
      loading = false;

      return () => observer.disconnect();
    } catch (err) {
      error = err.message;
      loading = false;
    }
  });
</script>

<div class="my-6">
  {#if loading}
    <div class="h-[540px] flex items-center justify-center bg-gray-50 rounded-lg">
      <p class="text-gray-500">Loading chart...</p>
    </div>
  {:else if error}
    <div class="h-[540px] flex items-center justify-center bg-red-50 rounded-lg">
      <p class="text-red-600">{error}</p>
    </div>
  {/if}
  <div bind:this={container} class="w-full" class:hidden={loading || error}></div>
</div>
