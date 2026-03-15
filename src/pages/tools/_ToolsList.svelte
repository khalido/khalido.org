<script lang="ts">
  import { Toggle } from "bits-ui";

  interface Tool {
    name: string;
    url: string;
    desc: string;
    test?: boolean;
  }

  interface Section {
    name: string;
    tools: Tool[];
  }

  const sections: Section[] = [
    {
      name: "AI",
      tools: [
        { name: "Oil Price Agent", url: "/tools/agent-test", desc: "Pi-agent + pi-ai running browser-side with OpenRouter", test: true },
      ],
    },
    {
      name: "Reading",
      tools: [
        { name: "Unwall", url: "/tools/unwall", desc: "Try to bypass article paywalls via archive and cache services" },
      ],
    },
    {
      name: "Utilities",
      tools: [
        { name: "Big Text", url: "/tools/big-text", desc: "Display text as large as possible — shareable via URL, rendered locally" },
        { name: "Sydney Clock Change", url: "/tools/sydney-clock", desc: "When do Sydney clocks change? Sunrise/sunset chart with DST" },
        { name: "Timezone Converter", url: "/tools/timezone-converter", desc: "Compare two timezones side by side with day/night overlap" },
        { name: "Word Counter", url: "/tools/word-counter", desc: "Count words and characters in text" },
      ],
    },
  ];

  let showTests = $state(true);

  const filtered = $derived(
    sections
      .map((s) => ({
        ...s,
        tools: s.tools.filter((t) => showTests || !t.test),
      }))
      .filter((s) => s.tools.length > 0),
  );
</script>

<!-- Main list -->
<div class="max-w-2xl">
  {#each filtered as section}
    <div class="mb-8" id="section-{section.name.toLowerCase()}">
      <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{section.name}</h2>
      <div class="space-y-2">
        {#each section.tools as tool}
          <div class="flex items-baseline gap-2">
            <a href={tool.url} class="font-medium hover:underline shrink-0">{tool.name}</a>
            <span class="text-sm text-gray-500">&mdash; {tool.desc}</span>
            {#if tool.test}<span class="text-[10px] text-gray-300">test</span>{/if}
          </div>
        {/each}
      </div>
    </div>
  {/each}
</div>

<!-- Sidebar — pinned to top-right of the relative parent (starts at heading level) -->
<aside class="hidden lg:block absolute top-0 right-0 w-40">
  <div class="sticky top-24 space-y-5">
    <nav class="space-y-1.5">
      {#each filtered as section}
        <a
          href="#section-{section.name.toLowerCase()}"
          class="block text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >{section.name}</a>
      {/each}
    </nav>

    <div class="space-y-2">
      <p class="text-xs font-medium text-gray-500 border-b border-gray-200 pb-1">Filter</p>
      <Toggle.Root
        pressed={showTests}
        onPressedChange={(v) => { showTests = v; }}
        class="px-2 py-0.5 text-xs rounded border transition-colors
          {showTests
            ? 'bg-gray-800 text-white border-gray-800'
            : 'text-gray-400 border-gray-200 hover:border-gray-300'}"
      >tests</Toggle.Root>
    </div>

    <div class="border-t border-gray-200 pt-3">
      <a href="/tools/settings" class="text-sm text-gray-500 hover:text-gray-800 transition-colors">Settings</a>
    </div>
  </div>
</aside>
