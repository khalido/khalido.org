<script lang="ts">
  import { Select, ToggleGroup } from "bits-ui";
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";

  interface Theme {
    id: string;
    name: string;
    fg: string;
    bg: string;
    caret: string;
  }

  const themes: Theme[] = [
    { id: "paper",     name: "Paper",     fg: "#1a1a1a", bg: "#ffffff", caret: "#1a1a1a" },
    { id: "terminal",  name: "Terminal",  fg: "#33ff33", bg: "#0a0a0a", caret: "#33ff33" },
    { id: "dracula",   name: "Dracula",   fg: "#f8f8f2", bg: "#282a36", caret: "#bd93f9" },
    { id: "monokai",   name: "Monokai",   fg: "#f8f8f2", bg: "#272822", caret: "#f92672" },
    { id: "solarized", name: "Solarized", fg: "#657b83", bg: "#fdf6e3", caret: "#268bd2" },
    { id: "nord",      name: "Nord",      fg: "#eceff4", bg: "#2e3440", caret: "#88c0d0" },
  ];

  type SizeMode = "uniform" | "maximize";
  type DisplayMode = "text" | "clock" | "countdown" | "date";

  let text = $state("");
  let themeId = $state("paper");
  let sizeMode = $state<SizeMode>("uniform");
  let mode = $state<DisplayMode>("text");
  let isFullscreen = $state(false);
  let containerEl: HTMLDivElement | undefined = $state();
  let displayEl: HTMLDivElement | undefined = $state();
  let inputEl: HTMLTextAreaElement | undefined = $state();
  let copied = $state(false);
  let countdownTarget = $state("");

  // Clock tick
  let now = $state(new Date());

  // Computed display
  let uniformSize = $state(200);
  let uniformLines = $state<string[]>([]);
  let maxLines = $state<{ text: string; size: number }[]>([]);

  const theme = $derived(themes.find((t) => t.id === themeId) ?? themes[0]);

  // Display text for sizing — what fitText operates on
  const displayText = $derived.by(() => {
    switch (mode) {
      case "clock":
        return formatTime(now);
      case "date":
        return formatDate(now);
      case "countdown": {
        if (!countdownTarget) return "";
        return formatCountdown(now, countdownTarget);
      }
      default:
        return text;
    }
  });

  const hasContent = $derived(displayText.trim().length > 0);

  function formatTime(d: Date): string {
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    const s = String(d.getSeconds()).padStart(2, "0");
    return `${h}:${m}\n${s}`;
  }

  function formatDate(d: Date): string {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  }

  function formatCountdown(d: Date, target: string): string {
    const [h, m] = target.split(":").map(Number);
    const t = new Date(d);
    t.setHours(h, m, 0, 0);
    if (t <= d) t.setDate(t.getDate() + 1);
    const diff = Math.max(0, Math.floor((t.getTime() - d.getTime()) / 1000));
    const hh = Math.floor(diff / 3600);
    const mm = Math.floor((diff % 3600) / 60);
    const ss = diff % 60;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}\n${String(ss).padStart(2, "0")}`;
  }

  onMount(() => {
    const saved = localStorage.getItem("bigtext-theme");
    if (saved && themes.some((t) => t.id === saved)) themeId = saved;
    const savedMode = localStorage.getItem("bigtext-sizemode");
    if (savedMode === "uniform" || savedMode === "maximize") sizeMode = savedMode;
    const savedDisplay = localStorage.getItem("bigtext-mode");
    if (savedDisplay === "clock" || savedDisplay === "countdown" || savedDisplay === "date") mode = savedDisplay;
    const savedTarget = localStorage.getItem("bigtext-countdown");
    if (savedTarget) countdownTarget = savedTarget;

    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (hash) { text = hash; mode = "text"; }

    document.addEventListener("fullscreenchange", () => {
      isFullscreen = !!document.fullscreenElement;
    });

    if (mode === "text") inputEl?.focus();
  });

  $effect(() => { localStorage.setItem("bigtext-theme", themeId); });
  $effect(() => { localStorage.setItem("bigtext-sizemode", sizeMode); });
  $effect(() => { localStorage.setItem("bigtext-mode", mode); });
  $effect(() => { localStorage.setItem("bigtext-countdown", countdownTarget); });

  // Clock interval — tick every second for clock/countdown
  $effect(() => {
    if (mode === "clock" || mode === "countdown") {
      const id = setInterval(() => { now = new Date(); }, 1000);
      return () => clearInterval(id);
    }
  });

  // Update URL hash (text mode only)
  $effect(() => {
    if (mode === "text") {
      if (text) {
        history.replaceState(null, "", `#${encodeURIComponent(text)}`);
      } else {
        history.replaceState(null, "", window.location.pathname);
      }
    }
  });

  // Refit on changes
  $effect(() => {
    void displayText;
    void isFullscreen;
    void sizeMode;
    requestAnimationFrame(() => fitText());
  });

  onMount(() => {
    const ro = new ResizeObserver(() => fitText());
    if (displayEl) ro.observe(displayEl);
    return () => ro.disconnect();
  });

  function fitText() {
    if (!displayEl || !displayText.trim()) {
      uniformSize = 200;
      uniformLines = [];
      maxLines = [];
      return;
    }

    const w = displayEl.clientWidth - 48;
    const h = displayEl.clientHeight - 24;
    if (w <= 0 || h <= 0) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const userLines = displayText.split("\n").filter((l) => l.trim() !== "");

    if (sizeMode === "maximize") {
      const perLineH = h / Math.max(userLines.length, 1);
      maxLines = userLines.map((line) => ({
        text: line.trim(),
        size: Math.min(findMaxSize(ctx, line.trim(), w, perLineH), 800),
      }));
    } else {
      const words = userLines.length === 1 ? userLines[0].split(/\s+/) : null;

      if (words && userLines.length === 1) {
        let bestLines: string[] = [userLines[0]];
        let bestSize = 0;

        const splits = generateSplits(words, Math.min(3, words.length));
        const sizeByCount: { lines: string[]; size: number }[] = [];

        for (const split of splits) {
          const size = findMaxSizeMulti(ctx, split, w, h);
          const n = split.length;
          const existing = sizeByCount.find((s) => s.lines.length === n);
          if (!existing || size > existing.size) {
            const idx = sizeByCount.findIndex((s) => s.lines.length === n);
            if (idx >= 0) sizeByCount[idx] = { lines: split, size };
            else sizeByCount.push({ lines: split, size });
          }
        }

        sizeByCount.sort((a, b) => a.lines.length - b.lines.length);
        if (sizeByCount.length > 0) {
          let chosen = sizeByCount[0];
          for (let i = 1; i < sizeByCount.length; i++) {
            if (sizeByCount[i].size > chosen.size * 1.5) chosen = sizeByCount[i];
          }
          bestLines = chosen.lines;
          bestSize = chosen.size;
        }

        uniformLines = bestLines;
        uniformSize = Math.min(bestSize || 100, 800);
      } else {
        const size = findMaxSizeMulti(ctx, userLines.map((l) => l.trim()), w, h);
        uniformLines = userLines.map((l) => l.trim());
        uniformSize = Math.min(size, 800);
      }
    }
  }

  function generateSplits(words: string[], maxLines: number): string[][] {
    if (words.length === 0) return [[""]];
    if (words.length === 1 || maxLines === 1) return [[words.join(" ")]];

    const results: string[][] = [[words.join(" ")]];

    if (maxLines >= 2 && words.length >= 2) {
      for (let i = 1; i < words.length; i++) {
        results.push([words.slice(0, i).join(" "), words.slice(i).join(" ")]);
      }
    }

    if (maxLines >= 3 && words.length >= 3) {
      for (let i = 1; i < words.length - 1; i++) {
        for (let j = i + 1; j < words.length; j++) {
          results.push([words.slice(0, i).join(" "), words.slice(i, j).join(" "), words.slice(j).join(" ")]);
        }
      }
    }

    return results;
  }

  function findMaxSize(ctx: CanvasRenderingContext2D, line: string, maxW: number, maxH: number): number {
    let lo = 10, hi = 800;
    while (hi - lo > 1) {
      const mid = Math.floor((lo + hi) / 2);
      ctx.font = `800 ${mid}px system-ui, -apple-system, sans-serif`;
      if (mid * 1.25 <= maxH && ctx.measureText(line).width <= maxW) lo = mid;
      else hi = mid;
    }
    return lo;
  }

  function findMaxSizeMulti(ctx: CanvasRenderingContext2D, lines: string[], maxW: number, maxH: number): number {
    let lo = 10, hi = 800;
    while (hi - lo > 1) {
      const mid = Math.floor((lo + hi) / 2);
      ctx.font = `800 ${mid}px system-ui, -apple-system, sans-serif`;
      const totalH = lines.length * mid * 1.25;
      let fits = totalH <= maxH;
      if (fits) {
        for (const line of lines) {
          if (ctx.measureText(line).width > maxW) { fits = false; break; }
        }
      }
      if (fits) lo = mid; else hi = mid;
    }
    return lo;
  }

  function toggleFullscreen() {
    if (!containerEl) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else containerEl.requestFullscreen();
  }

  function copyUrl() {
    navigator.clipboard.writeText(window.location.href);
    copied = true;
    setTimeout(() => { copied = false; }, 1500);
  }

  // In clock mode, line index 1 is seconds (accent color)
  // In countdown mode, seconds portion is at the end of a single HH:MM:SS line
  const isTimerMode = $derived(mode === "clock" || mode === "countdown");

  function isAccentLine(lineIndex: number): boolean {
    return isTimerMode && lineIndex === 1;
  }

  const modeItems = [
    { value: "text", label: "Text" },
    { value: "clock", label: "Clock" },
    { value: "countdown", label: "Countdown" },
    { value: "date", label: "Date" },
  ];

  const modeLabel = $derived(modeItems.find((m) => m.value === mode)?.label ?? "Text");
</script>

<div bind:this={containerEl} class="flex flex-col" style="height: {isFullscreen ? '100vh' : 'calc(100dvh - 7rem)'};">
  <!-- Display area -->
  <div
    bind:this={displayEl}
    class="flex-1 flex items-center justify-center overflow-hidden relative transition-colors duration-200"
    class:cursor-text={mode === "text"}
    style="background: {theme.bg};"
    onclick={() => { if (mode === "text") inputEl?.focus(); }}
  >
    {#if hasContent}
      <div
        class="text-center font-extrabold leading-tight p-6 select-none"
        class:cursor-pointer={mode === "text"}
        onclick={() => { if (mode === "text") copyUrl(); }}
        title={mode === "text" ? "Click to copy URL" : ""}
      >
        {#if sizeMode === "maximize"}
          {#each maxLines as line, i}
            <div class="whitespace-nowrap" style="font-size: {line.size}px; color: {isAccentLine(i) ? theme.caret : theme.fg};">
              {#if isTimerMode}
                {#each line.text.split("") as char, j (j)}
                  {#if char === ":"}
                    <span class="colon">:</span>
                  {:else}
                    <span class="digit-slot">
                      {#key char}
                        <span class="digit" in:fly={{ y: 20, duration: 100 }} out:fly={{ y: -20, duration: 100 }}>{char}</span>
                      {/key}
                    </span>
                  {/if}
                {/each}
              {:else}
                {line.text}
              {/if}
              {#if !isFullscreen && mode === "text" && i === maxLines.length - 1}<span class="caret" style="border-color: {theme.caret};"></span>{/if}
            </div>
          {/each}
        {:else}
          {#each uniformLines as line, i}
            <div class="whitespace-nowrap" style="font-size: {uniformSize}px; color: {isAccentLine(i) ? theme.caret : theme.fg};">
              {#if isTimerMode}
                {#each line.split("") as char, j (j)}
                  {#if char === ":"}
                    <span class="colon">:</span>
                  {:else}
                    <span class="digit-slot">
                      {#key char}
                        <span class="digit" in:fly={{ y: 20, duration: 100 }} out:fly={{ y: -20, duration: 100 }}>{char}</span>
                      {/key}
                    </span>
                  {/if}
                {/each}
              {:else}
                {line}
              {/if}
              {#if !isFullscreen && mode === "text" && i === uniformLines.length - 1}<span class="caret" style="border-color: {theme.caret};"></span>{/if}
            </div>
          {/each}
        {/if}
      </div>
    {:else}
      <div class="text-center" style="color: {theme.fg}; opacity: 0.25;">
        {#if mode === "countdown" && !countdownTarget}
          <p class="text-3xl font-extrabold mb-2">Set target time below</p>
        {:else}
          <p class="text-5xl font-extrabold mb-2">Big Text{#if mode === "text"}<span class="caret" style="border-color: {theme.caret};"></span>{/if}</p>
          <p class="text-sm">Start typing</p>
        {/if}
      </div>
    {/if}

    {#if copied}
      <div class="absolute top-3 right-4 text-sm animate-pulse" style="color: {theme.fg}; opacity: 0.4;">
        URL copied!
      </div>
    {/if}

    <!-- Hidden textarea for text mode input -->
    <textarea
      bind:this={inputEl}
      bind:value={text}
      class="absolute opacity-0 w-0 h-0 pointer-events-none"
      aria-label="Big text input"
    ></textarea>
  </div>

  <!-- Controls bar -->
  <div
    class="shrink-0 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-sm"
    style="{isFullscreen
      ? `background: ${theme.bg}; border-top: 1px solid ${theme.fg}20; color: ${theme.fg}80;`
      : 'background: white; border-top: 1px solid #e5e5e5; color: #737373;'}"
  >
    <div class="flex flex-wrap items-center gap-2">
      <!-- Mode selector -->
      <Select.Root
        type="single"
        value={mode}
        onValueChange={(v) => { if (v) mode = v as DisplayMode; }}
      >
        <Select.Trigger
          class="px-3 py-2 rounded border text-sm transition-colors min-h-[44px]"
          style="{isFullscreen
            ? `border-color: ${theme.fg}30; color: ${theme.fg}80;`
            : 'border-color: #e5e5e5; color: #737373;'}"
        >
          {modeLabel}
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            class="z-50 rounded border border-gray-200 bg-white shadow-lg overflow-hidden"
            sideOffset={4}
          >
            <Select.Viewport>
              {#each modeItems as m (m.value)}
                <Select.Item
                  value={m.value}
                  label={m.label}
                  class="px-3 py-2.5 text-sm cursor-pointer text-gray-700 hover:bg-gray-50 data-[highlighted]:bg-gray-50"
                >
                  {m.label}
                </Select.Item>
              {/each}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>

      <!-- Countdown target time input -->
      {#if mode === "countdown"}
        <input
          type="time"
          bind:value={countdownTarget}
          class="px-3 py-2 rounded border text-sm min-h-[44px]"
          style="{isFullscreen
            ? `border-color: ${theme.fg}30; color: ${theme.fg}80; background: transparent;`
            : 'border-color: #e5e5e5; color: #737373;'}"
        />
      {/if}

      <!-- Theme selector -->
      <Select.Root
        type="single"
        value={themeId}
        onValueChange={(v) => { if (v) themeId = v; }}
      >
        <Select.Trigger
          class="px-3 py-2 rounded border text-sm transition-colors min-h-[44px]"
          style="{isFullscreen
            ? `border-color: ${theme.fg}30; color: ${theme.fg}80;`
            : 'border-color: #e5e5e5; color: #737373;'}"
        >
          {theme.name}
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            class="z-50 rounded border border-gray-200 bg-white shadow-lg overflow-hidden"
            sideOffset={4}
          >
            <Select.Viewport>
              {#each themes as t (t.id)}
                <Select.Item
                  value={t.id}
                  label={t.name}
                  class="px-3 py-2.5 text-sm cursor-pointer hover:bg-gray-50 data-[highlighted]:bg-gray-50"
                >
                  {#snippet children({ selected })}
                    <span class="flex items-center gap-2">
                      <span class="w-3 h-3 rounded-sm shrink-0 border border-gray-200" style="background: {t.bg};"></span>
                      <span class="w-2 h-2 rounded-full shrink-0" style="background: {t.fg};"></span>
                      <span class="text-gray-700">{t.name}</span>
                      {#if selected}<span class="text-gray-400">*</span>{/if}
                    </span>
                  {/snippet}
                </Select.Item>
              {/each}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>

      <!-- Size mode toggle (text mode only) -->
      {#if mode === "text"}
        <ToggleGroup.Root
          type="single"
          value={sizeMode}
          onValueChange={(v) => { if (v) sizeMode = v as SizeMode; }}
          class="flex items-center border rounded overflow-hidden"
          style="{isFullscreen ? `border-color: ${theme.fg}30;` : 'border-color: #e5e5e5;'}"
        >
          <ToggleGroup.Item
            value="uniform"
            class="px-3 py-2 text-sm transition-colors min-h-[44px] data-[state=on]:bg-gray-200 data-[state=on]:text-gray-700"
            title="All lines same size"
          >uniform</ToggleGroup.Item>
          <ToggleGroup.Item
            value="maximize"
            class="px-3 py-2 text-sm transition-colors min-h-[44px] data-[state=on]:bg-gray-200 data-[state=on]:text-gray-700"
            title="Each line fills its space"
          >maximize</ToggleGroup.Item>
        </ToggleGroup.Root>
      {/if}
    </div>

    <div class="flex items-center gap-2">
      {#if mode === "text" && text.trim()}
        <button onclick={copyUrl}
          class="px-3 py-2 rounded border transition-colors hover:opacity-80 min-h-[44px]"
          style="{isFullscreen ? `border-color: ${theme.fg}30;` : 'border-color: #e5e5e5;'}"
        >copy link</button>
        <button onclick={() => { text = ""; inputEl?.focus(); }}
          class="px-3 py-2 rounded border transition-colors hover:opacity-80 min-h-[44px]"
          style="{isFullscreen ? `border-color: ${theme.fg}30;` : 'border-color: #e5e5e5;'}"
        >clear</button>
      {/if}
      <button onclick={toggleFullscreen}
        class="px-3 py-2 rounded border transition-colors hover:opacity-80 min-h-[44px]"
        style="{isFullscreen ? `border-color: ${theme.fg}30;` : 'border-color: #e5e5e5;'}"
        title="Fullscreen (F11)"
      >{isFullscreen ? "exit" : "fullscreen"}</button>
    </div>
  </div>
</div>

<style>
  .caret {
    display: inline-block;
    width: 0;
    border-right: 0.06em solid;
    margin-left: 0.04em;
    animation: blink 1s step-end infinite;
    vertical-align: baseline;
    height: 0.75em;
  }
  @keyframes blink {
    50% { opacity: 0; }
  }
  .digit-slot {
    display: inline-block;
    position: relative;
    overflow: hidden;
    text-align: center;
    vertical-align: baseline;
    height: 1.1em;
    width: 0.7em;
  }
  .digit {
    display: block;
  }
  .colon {
    display: inline-block;
    width: 0.3em;
    text-align: center;
  }
</style>
