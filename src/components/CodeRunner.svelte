<script>
  let { code = "", lang = "js", collapsed = false, title = "", caption = "" } = $props();

  let editableCode = $state(code.trim());
  let output = $state("");
  let running = $state(false);
  let hasRun = $state(false);
  let htmlOutput = $state(null);
  let highlighted = $state("");
  let hljs = $state(null);
  let showCode = $state(!collapsed);
  let copied = $state(false);
  let hasError = $state(false);

  // Shared lib cache — loaded once across all CodeRunner instances on the page
  const libCache = globalThis.__cr_libs ??= {};

  async function getLib(name, loader) {
    if (!libCache[name]) libCache[name] = loader();
    return libCache[name];
  }

  // Built-in libraries available in code blocks without imports
  async function loadBuiltins() {
    const [Plot, dsv] = await Promise.all([
      getLib("Plot", () => import("@observablehq/plot")),
      getLib("dsv", () => import("https://esm.sh/d3-dsv")),
    ]);
    return { Plot, csvParse: dsv.csvParse, tsvParse: dsv.tsvParse, autoType: dsv.autoType };
  }

  // Load highlight.js from CDN (just core + JS, ~5KB gzipped)
  $effect(() => {
    import("https://esm.sh/highlight.js@11/es/core").then(async (mod) => {
      const hl = mod.default;
      const jsLang = await import("https://esm.sh/highlight.js@11/es/languages/javascript");
      hl.registerLanguage("javascript", jsLang.default);
      hljs = hl;
      highlight(editableCode);
    });
  });

  function highlight(code) {
    if (hljs) {
      highlighted = hljs.highlight(code, { language: "javascript" }).value;
    } else {
      highlighted = escapeHtml(code);
    }
  }

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  $effect(() => {
    highlight(editableCode);
  });

  $effect(() => {
    if (!hasRun) {
      hasRun = true;
      run();
    }
  });

  async function run() {
    running = true;
    output = "";
    htmlOutput = null;
    hasError = false;
    const logs = [];

    const fakeConsole = {
      log: (...args) => logs.push(args.map(formatArg).join(" ")),
      error: (...args) => logs.push("ERROR: " + args.map(formatArg).join(" ")),
      warn: (...args) => logs.push("WARN: " + args.map(formatArg).join(" ")),
    };

    try {
      const libs = await loadBuiltins();
      const libNames = Object.keys(libs);
      const libValues = Object.values(libs);
      const fn = new Function("console", ...libNames, `"use strict";\nreturn (async () => {\n${editableCode}\n})()`);
      const result = await fn(fakeConsole, ...libValues);
      if (result instanceof HTMLElement || result instanceof SVGElement) {
        htmlOutput = result;
      } else if (result !== undefined && logs.length === 0) {
        logs.push(formatArg(result));
      }
    } catch (err) {
      hasError = true;
      logs.push(err.message);
    }

    output = logs.join("\n");
    running = false;
  }

  function formatArg(val) {
    if (val === null) return "null";
    if (val === undefined) return "undefined";
    if (typeof val === "object") {
      try { return JSON.stringify(val, null, 2); } catch { return String(val); }
    }
    return String(val);
  }

  function mountHtml(node) {
    $effect(() => {
      if (htmlOutput) {
        node.replaceChildren(htmlOutput);
      } else {
        node.replaceChildren();
      }
    });
  }

  function syncScroll(e) {
    const pre = e.target.parentElement.querySelector("pre");
    if (pre) {
      pre.scrollTop = e.target.scrollTop;
      pre.scrollLeft = e.target.scrollLeft;
    }
  }

  async function copyCode() {
    await navigator.clipboard.writeText(editableCode);
    copied = true;
    setTimeout(() => copied = false, 1500);
  }
</script>

<link rel="stylesheet" href="https://esm.sh/highlight.js@11/styles/github.min.css" />

<div class="cr-wrap not-prose">
  {#if title}
    <div class="cr-title">{title}</div>
  {/if}
  {#if showCode}
    <div class="cr-toolbar">
      <span class="cr-lang">{lang}</span>
      <div class="cr-buttons">
        {#if editableCode !== code.trim()}
          <button onclick={() => { editableCode = code.trim(); run(); }} class="cr-btn cr-btn-light">↺ Reset</button>
        {/if}
        <button onclick={copyCode} class="cr-btn cr-btn-light" title="Copy code">{copied ? "✓" : "⎘"}</button>
        <button onclick={run} disabled={running} class="cr-btn cr-btn-run" title="Run">▶</button>
        <button onclick={() => showCode = false} class="cr-btn cr-btn-light">Hide code</button>
      </div>
    </div>
    <div class="cr-editor">
      <pre aria-hidden="true" class="cr-pre"><code>{@html highlighted + "\n"}</code></pre>
      <textarea
        bind:value={editableCode}
        oninput={syncScroll}
        onscroll={syncScroll}
        spellcheck="false"
        class="cr-textarea"
      ></textarea>
    </div>
  {/if}
  {#if output}
    <div class="cr-output" class:cr-error={hasError}>{output}</div>
  {/if}
  <div use:mountHtml class="cr-html" class:cr-html-visible={htmlOutput}></div>
  {#if !showCode}
    <button onclick={() => showCode = true} class="cr-show-code">View source</button>
  {/if}
  {#if caption}
    <div class="cr-caption">{caption}</div>
  {/if}
</div>

<style>
  .cr-wrap {
    margin: 1rem 0;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    --cr-font: "SF Mono", ui-monospace, Menlo, Consolas, "Liberation Mono", monospace;
    --cr-size: 13px;
    --cr-line: 1.5;
    --cr-pad: 12px;
  }
  .cr-title {
    padding: 8px 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
  }
  .cr-caption {
    padding: 6px 12px 8px;
    font-size: 12px;
    color: #6b7280;
  }
  .cr-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #f9fafb;
    padding: 6px 12px;
    border-bottom: 1px solid #e5e7eb;
  }
  .cr-lang {
    font-size: 12px;
    color: #6b7280;
    font-family: var(--cr-font);
  }
  .cr-buttons {
    display: flex;
    gap: 4px;
  }
  .cr-btn {
    font-size: 12px;
    padding: 3px 10px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .cr-btn-run {
    background: #6b7280;
    color: white;
  }
  .cr-btn-run:hover { background: #4b5563; }
  .cr-btn-run:disabled { opacity: 0.5; }
  .cr-btn-light {
    background: #e5e7eb;
    color: #374151;
  }
  .cr-btn-light:hover { background: #d1d5db; }
  .cr-editor {
    position: relative;
    min-height: 60px;
  }
  .cr-pre {
    margin: 0;
    padding: var(--cr-pad);
    font-family: var(--cr-font);
    font-size: var(--cr-size);
    line-height: var(--cr-line);
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow: auto;
    color: #24292e;
    background: white;
    border: none;
  }
  .cr-textarea {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    padding: var(--cr-pad);
    font-family: var(--cr-font);
    font-size: var(--cr-size);
    line-height: var(--cr-line);
    white-space: pre-wrap;
    word-wrap: break-word;
    color: transparent;
    caret-color: black;
    background: transparent;
    border: none;
    resize: none;
    outline: none;
    overflow: auto;
    box-sizing: border-box;
  }
  .cr-output {
    border-top: 1px solid #e5e7eb;
    background: #1e1e1e;
    color: #d4d4d4;
    padding: var(--cr-pad);
    font-family: var(--cr-font);
    font-size: var(--cr-size);
    white-space: pre-wrap;
  }
  .cr-error {
    color: #f87171;
  }
  .cr-html { overflow-x: auto; }
  .cr-html-visible { border-top: 1px solid #e5e7eb; }
  .cr-show-code {
    display: block;
    width: 100%;
    font-size: 12px;
    padding: 6px 12px;
    background: transparent;
    border: none;
    border-top: 1px solid #e5e7eb;
    text-align: left;
    font-family: var(--cr-font);
    color: #6b7280;
    cursor: pointer;
  }
  .cr-show-code:hover { background: #f9fafb; }
</style>
