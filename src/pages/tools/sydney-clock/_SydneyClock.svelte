<script lang="ts">
  import { onMount } from "svelte";
  import sunRefRaw from "./sun-data.json";

  let plotEl: HTMLDivElement | undefined = $state();
  let now = $state(new Date());
  let Plot: typeof import("@observablehq/plot") | undefined = $state();

  // Parse "HH:MM" to decimal hours
  function parseTime(s: string): number {
    const [h, m] = s.split(":").map(Number);
    return h + m / 60;
  }

  const sunRef = sunRefRaw.map((r) => ({
    month: r.month,
    day: r.day,
    rise: parseTime(r.rise),
    set: parseTime(r.set),
    twiStart: parseTime(r.twiStart),
    noon: parseTime(r.noon),
    twiEnd: parseTime(r.twiEnd),
  }));

  // DST rules for Sydney (NSW):
  // Spring forward: first Sunday in October at 2:00 AM (AEST → AEDT)
  // Fall back: first Sunday in April at 3:00 AM (AEDT → AEST)

  function firstSunday(year: number, month: number): Date {
    const d = new Date(year, month, 1);
    const day = d.getDay(); // 0 = Sunday
    const offset = day === 0 ? 0 : 7 - day;
    return new Date(year, month, 1 + offset);
  }

  function getTransitions(year: number) {
    return {
      fallBack: firstSunday(year, 3),   // first Sunday in April
      springForward: firstSunday(year, 9), // first Sunday in October
    };
  }

  function isDST(date: Date): boolean {
    const year = date.getFullYear();
    const { fallBack, springForward } = getTransitions(year);
    // DST is active from first Sunday Oct to first Sunday Apr (next year)
    // So: Jan 1 - early Apr = DST, early Apr - early Oct = no DST, early Oct - Dec 31 = DST
    if (date < fallBack) return true;
    if (date < springForward) return false;
    return true;
  }

  function getLastChange(date: Date): { date: Date; type: "forward" | "back" } {
    const year = date.getFullYear();
    const t = getTransitions(year);
    if (date >= t.springForward) return { date: t.springForward, type: "forward" };
    if (date >= t.fallBack) return { date: t.fallBack, type: "back" };
    // Before April — last change was spring forward of previous year
    return { date: getTransitions(year - 1).springForward, type: "forward" };
  }

  function getNextChange(date: Date): { date: Date; type: "forward" | "back" } {
    const year = date.getFullYear();
    const t = getTransitions(year);
    if (date < t.fallBack) return { date: t.fallBack, type: "back" };
    if (date < t.springForward) return { date: t.springForward, type: "forward" };
    // After October — next change is fall back next year
    return { date: getTransitions(year + 1).fallBack, type: "back" };
  }

  function daysUntil(from: Date, to: Date): number {
    return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  }

  function daysSince(from: Date, to: Date): number {
    return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  }

  function formatDate(d: Date): string {
    return d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }

  const currentlyDST = $derived(isDST(now));
  const nowHours = $derived(now.getHours() + now.getMinutes() / 60);
  const last = $derived(getLastChange(now));
  const next = $derived(getNextChange(now));
  const daysToNext = $derived(daysUntil(now, next.date));
  const daysFromLast = $derived(daysSince(last.date, now));
  const isTonight = $derived(daysToNext === 0 || daysToNext === 1);

  // Generate daily data by linearly interpolating between reference points
  function generateSunData(year: number) {
    const data: { date: Date; sunrise: number; sunset: number; twiStart: number; twiEnd: number; noon: number; dst: boolean }[] = [];

    // Convert reference points to day-of-year with values
    const refs = sunRef.map((r) => {
      const d = new Date(year, r.month - 1, r.day);
      const dayOfYear = Math.floor((d.getTime() - new Date(year, 0, 1).getTime()) / 86400000);
      return { dayOfYear, rise: r.rise, set: r.set, twiStart: r.twiStart, twiEnd: r.twiEnd, noon: r.noon };
    });

    for (let dayOfYear = 0; dayOfYear < 365; dayOfYear++) {
      const date = new Date(year, 0, dayOfYear + 1);
      if (date.getFullYear() !== year) break;

      // Find surrounding reference points
      let lo = refs[refs.length - 1], hi = refs[0];
      for (let i = 0; i < refs.length - 1; i++) {
        if (dayOfYear >= refs[i].dayOfYear && dayOfYear < refs[i + 1].dayOfYear) {
          lo = refs[i];
          hi = refs[i + 1];
          break;
        }
      }
      if (dayOfYear >= refs[refs.length - 1].dayOfYear) {
        lo = refs[refs.length - 1];
        hi = refs[0];
      }

      const span = hi.dayOfYear > lo.dayOfYear ? hi.dayOfYear - lo.dayOfYear : hi.dayOfYear + 365 - lo.dayOfYear;
      const t = span > 0 ? ((dayOfYear - lo.dayOfYear + 365) % 365) / span : 0;

      data.push({
        date,
        sunrise: lo.rise + (hi.rise - lo.rise) * t,
        sunset: lo.set + (hi.set - lo.set) * t,
        twiStart: lo.twiStart + (hi.twiStart - lo.twiStart) * t,
        twiEnd: lo.twiEnd + (hi.twiEnd - lo.twiEnd) * t,
        noon: lo.noon + (hi.noon - lo.noon) * t,
        dst: isDST(date),
      });
    }
    return data;
  }

  function timeLabel(h: number): string {
    const hours = Math.floor(h);
    const mins = Math.round((h - hours) * 60);
    const ampm = hours >= 12 ? "pm" : "am";
    const h12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${h12}:${String(mins).padStart(2, "0")}${ampm}`;
  }

  onMount(async () => {
    Plot = await import("@observablehq/plot");
    renderPlot();

    const ro = new ResizeObserver(() => renderPlot());
    if (plotEl) ro.observe(plotEl);

    const interval = setInterval(() => { now = new Date(); }, 60_000);
    return () => { ro.disconnect(); clearInterval(interval); };
  });

  $effect(() => {
    void now;
    if (Plot) renderPlot();
  });

  function renderPlot() {
    if (!Plot || !plotEl) return;

    const year = now.getFullYear();
    const data = generateSunData(year);
    const { fallBack, springForward } = getTransitions(year);

    const width = plotEl.clientWidth;
    const height = Math.max(300, Math.min(plotEl.clientHeight, window.innerHeight - 200));

    const plot = Plot.plot({
      width,
      height,
      marginLeft: 50,
      marginRight: 30,
      marginTop: 30,
      marginBottom: 40,
      x: {
        type: "time",
        label: null,
        tickFormat: "%b",
      },
      y: {
        label: "Time of day",
        domain: [4, 21],
        tickFormat: (d: number) => timeLabel(d),
        grid: true,
      },
      marks: [
        // Civil twilight areas (dawn and dusk)
        Plot.areaY(data, {
          x: "date",
          y1: "twiStart",
          y2: "sunrise",
          fill: "#6366f1",
          fillOpacity: 0.06,
        }),
        Plot.areaY(data, {
          x: "date",
          y1: "sunset",
          y2: "twiEnd",
          fill: "#6366f1",
          fillOpacity: 0.06,
        }),

        // Daylight area between sunrise and sunset
        Plot.areaY(data, {
          x: "date",
          y1: "sunrise",
          y2: "sunset",
          fill: "#fbbf24",
          fillOpacity: 0.12,
        }),

        // Civil twilight lines (faint)
        Plot.lineY(data, {
          x: "date",
          y: "twiStart",
          stroke: "#818cf8",
          strokeWidth: 1,
          strokeDasharray: "3 3",
        }),
        Plot.lineY(data, {
          x: "date",
          y: "twiEnd",
          stroke: "#818cf8",
          strokeWidth: 1,
          strokeDasharray: "3 3",
        }),

        // Solar noon line
        Plot.lineY(data, {
          x: "date",
          y: "noon",
          stroke: "#f59e0b",
          strokeWidth: 1.5,
          strokeDasharray: "4 3",
        }),

        // Sunrise line
        Plot.lineY(data, {
          x: "date",
          y: "sunrise",
          stroke: "#fb923c",
          strokeWidth: 2.5,
        }),

        // Sunset line
        Plot.lineY(data, {
          x: "date",
          y: "sunset",
          stroke: "#7c3aed",
          strokeWidth: 2.5,
        }),

        // Pointer tooltip — vertical crosshair snapping to nearest date
        Plot.ruleX(data, Plot.pointerX({
          x: "date",
          stroke: "#a3a3a3",
          strokeWidth: 0.5,
        })),
        // Pointer dots on both lines
        Plot.dot(data, Plot.pointerX({
          x: "date",
          y: "sunrise",
          fill: "#fb923c",
          r: 4,
        })),
        Plot.dot(data, Plot.pointerX({
          x: "date",
          y: "sunset",
          fill: "#7c3aed",
          r: 4,
        })),
        Plot.dot(data, Plot.pointerX({
          x: "date",
          y: "noon",
          fill: "#f59e0b",
          r: 3,
        })),
        Plot.tip(data, Plot.pointerX({
          x: "date",
          y: "sunset",
          anchor: "top",
          dy: 8,
          fontSize: 14,
          title: (d: { date: Date; sunrise: number; sunset: number; twiStart: number; twiEnd: number; noon: number; dst: boolean }) => {
            const daylight = d.sunset - d.sunrise;
            const hrs = Math.floor(daylight);
            const mins = Math.round((daylight - hrs) * 60);
            const rise = timeLabel(d.sunrise).padStart(7);
            const set = timeLabel(d.sunset).padStart(7);
            const dawn = timeLabel(d.twiStart).padStart(7);
            const dusk = timeLabel(d.twiEnd).padStart(7);
            return `${d.date.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}\n${hrs}h ${mins}m daylight\nDawn   ${dawn}\nSunrise${rise}\nNoon    ${timeLabel(d.noon)}\nSunset ${set}\nDusk   ${dusk}`;
          },
        })),

        // Current time horizontal line
        Plot.ruleY([nowHours], { stroke: "#ef4444", strokeWidth: 1, strokeDasharray: "2 3" }),
        Plot.text([{ x: new Date(year, 11, 28), y: nowHours, text: timeLabel(nowHours) }], {
          x: "x", y: "y", text: "text", fill: "#ef4444", fontSize: 11, fontWeight: "600", dy: -8,
        }),

        // DST transition lines — solid amber
        Plot.ruleX([fallBack], { stroke: "#d97706", strokeWidth: 2.5 }),
        Plot.ruleX([springForward], { stroke: "#d97706", strokeWidth: 2.5 }),

        // DST annotations
        Plot.text([{ x: fallBack, y: 19.5, text: "Clocks fall back 1hr" }], {
          x: "x", y: "y", text: "text", fill: "#b45309", fontSize: 18, fontWeight: "bold", textAnchor: "start", dx: 10,
        }),
        Plot.text([{ x: fallBack, y: 20.5, text: formatDate(fallBack) }], {
          x: "x", y: "y", text: "text", fill: "#b4530990", fontSize: 16, textAnchor: "start", dx: 10,
        }),
        Plot.text([{ x: springForward, y: 19.5, text: "Clocks spring forward 1hr" }], {
          x: "x", y: "y", text: "text", fill: "#b45309", fontSize: 18, fontWeight: "bold", textAnchor: "start", dx: 10,
        }),
        Plot.text([{ x: springForward, y: 20.5, text: formatDate(springForward) }], {
          x: "x", y: "y", text: "text", fill: "#b4530990", fontSize: 16, textAnchor: "start", dx: 10,
        }),

        // Today marker — dotted red, distinct from DST lines
        Plot.ruleX([now], { stroke: "#ef4444", strokeWidth: 1.5, strokeDasharray: "2 3" }),
        Plot.text([{ x: now, y: 19.5, text: "Today" }], {
          x: "x", y: "y", text: "text", fill: "#ef4444", fontSize: 18, fontWeight: "bold", textAnchor: "end", dx: -10,
        }),
        Plot.text([{ x: now, y: 20.5, text: now.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" }) }], {
          x: "x", y: "y", text: "text", fill: "#ef444490", fontSize: 14, textAnchor: "end", dx: -10,
        }),

        // Arrow between Today and next DST change
        Plot.arrow([{ x1: now, x2: next.date }], {
          x1: "x1", x2: "x2",
          y: 5.5,
          stroke: "#a3a3a3",
          strokeWidth: 1,
          bend: false,
        }),
        Plot.text([{
          x: new Date((now.getTime() + next.date.getTime()) / 2),
          y: 5.5,
          text: `${daysToNext} days`,
        }], {
          x: "x", y: "y", text: "text", fill: "#737373", fontSize: 12, fontWeight: "600", dy: -10,
        }),

        // Line labels
        Plot.text([{ x: new Date(year, 0, 15), y: data[14].sunrise - 0.5, text: "Sunrise" }], {
          x: "x", y: "y", text: "text", fill: "#fb923c", fontSize: 14, fontWeight: "bold",
        }),
        Plot.text([{ x: new Date(year, 0, 15), y: data[14].sunset + 0.5, text: "Sunset" }], {
          x: "x", y: "y", text: "text", fill: "#7c3aed", fontSize: 14, fontWeight: "bold",
        }),
        Plot.text([{ x: new Date(year, 6, 1), y: data[181].twiStart - 0.4, text: "Civil twilight" }], {
          x: "x", y: "y", text: "text", fill: "#818cf8", fontSize: 11,
        }),
        Plot.text([{ x: new Date(year, 6, 1), y: data[181].twiEnd + 0.4, text: "Civil twilight" }], {
          x: "x", y: "y", text: "text", fill: "#818cf8", fontSize: 11,
        }),
        Plot.text([{ x: new Date(year, 6, 1), y: data[181].noon - 0.4, text: "Solar noon" }], {
          x: "x", y: "y", text: "text", fill: "#f59e0b", fontSize: 11,
        }),
      ],
    });

    plotEl.replaceChildren(plot);
  }
</script>

<div class="flex flex-col min-h-[500px]" style="height: calc(100dvh - 4rem);">
  <!-- Hero -->
  <div class="shrink-0 px-4 py-6 sm:px-6 sm:py-8 bg-white border-b border-gray-200">
    <div class="flex flex-wrap items-start justify-between gap-6">
      <!-- Next change -->
      <div>
        <p class="text-3xl sm:text-5xl font-extrabold text-gray-800 leading-tight">
          In {daysToNext} days you'll {next.type === "back" ? "gain" : "lose"} an hour of sleep
        </p>
        <p class="text-xl sm:text-2xl text-gray-500 mt-1">
          Clocks {next.type === "forward" ? "spring forward" : "fall back"} on {formatDate(next.date)}
        </p>
      </div>

      <!-- Current status -->
      <div class="text-right">
        <p class="text-sm text-gray-400">Currently</p>
        <p class="text-2xl font-bold text-gray-800">{currentlyDST ? "AEDT" : "AEST"} <span class="text-gray-400 font-normal">{currentlyDST ? "(UTC+11)" : "(UTC+10)"}</span></p>
        <p class="text-xs text-gray-400 mt-2">QLD, WA, and NT don't do daylight saving — lucky them</p>
      </div>
    </div>
  </div>

  <!-- Plot -->
  <div bind:this={plotEl} class="flex-1 min-h-0 px-4 pt-2 sm:px-6 sm:pt-4 bg-white"></div>
  <p class="shrink-0 px-4 pb-3 sm:px-6 text-xs text-gray-400 bg-white">
    Sunrise, sunset, civil twilight and solar noon times for Sydney interpolated from <a href="https://www.timeanddate.com/sun/australia/sydney" class="underline hover:text-gray-600">timeanddate.com</a> data at 5-day intervals. The 1-hour jump shows when daylight saving starts and ends. Civil twilight marks when the sky is light enough to see without artificial light.
  </p>
</div>
