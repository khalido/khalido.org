<script>
  // Live editable JS code block for MDX posts. Usage:
  //   <CodeRunner client:load code={`...`} />              — collapsed by default, shows output
  //   <CodeRunner client:load code={`...`} collapsed={false} /> — code visible
  // Built-in globals: Plot (Observable Plot), csvParse, tsvParse, autoType, Inputs
  let { code = "", lang = "js", collapsed = true, title = "", caption = "" } = $props();

  const initialCode = code.trim();
  let editableCode = $state(initialCode);
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

  // Track input values across re-renders so sliders/selects keep their state
  let inputValues = {};
  let createdInputElements = [];

  function createInputs() {
    let counter = 0;
    createdInputElements = [];

    const style = (el, styles) => { Object.assign(el.style, styles); return el; };

    const labelStyle = {
      display: "inline-flex", alignItems: "center", gap: "6px",
      fontSize: "13px", fontFamily: "system-ui, sans-serif", color: "#374151",
    };

    const inputElStyle = {
      fontSize: "13px", fontFamily: "system-ui, sans-serif",
      border: "1px solid #d1d5db", borderRadius: "4px", padding: "2px 6px",
      outline: "none", background: "white",
    };

    function register(type, element, defaultValue) {
      const id = counter++;
      createdInputElements.push(element);

      // Restore previous value or use default
      if (!(id in inputValues)) inputValues[id] = defaultValue;
      setVal(element, type, inputValues[id]);

      // On change, update stored value and re-run
      const handler = () => {
        inputValues[id] = getVal(element, type);
        run();
      };
      const input = element.querySelector("input, select");
      input.addEventListener("input", handler);

      return { get value() { return inputValues[id]; }, element };
    }

    function getVal(el, type) {
      const input = el.querySelector("input, select");
      if (type === "checkbox") return input.checked;
      if (type === "slider") return Number(input.value);
      return input.value;
    }

    function setVal(el, type, val) {
      const input = el.querySelector("input, select");
      if (type === "checkbox") input.checked = val;
      else input.value = val;
      // Update slider display span
      if (type === "slider") {
        const span = el.querySelector("span");
        if (span) span.textContent = val;
      }
    }

    return {
      slider(min, max, opts = {}) {
        const { value: val = min, label, step = 1 } = opts;
        const wrap = style(document.createElement("label"), labelStyle);
        if (label) wrap.append(label + " ");
        const inp = style(document.createElement("input"), { accentColor: "#6366f1", cursor: "pointer" });
        inp.type = "range"; inp.min = min; inp.max = max; inp.step = step; inp.value = val;
        const span = Object.assign(document.createElement("span"), {
          textContent: val,
        });
        span.style.cssText = "min-width:2.5em;text-align:right;font-variant-numeric:tabular-nums";
        inp.addEventListener("input", () => { span.textContent = inp.value; });
        wrap.append(inp, " ", span);
        return register("slider", wrap, val);
      },

      select(options, opts = {}) {
        const { value: val, label } = opts;
        const wrap = style(document.createElement("label"), labelStyle);
        if (label) wrap.append(label + " ");
        const sel = style(document.createElement("select"), { ...inputElStyle, cursor: "pointer" });
        for (const o of options) {
          const opt = document.createElement("option");
          opt.value = o; opt.textContent = o;
          if (o === val) opt.selected = true;
          sel.append(opt);
        }
        wrap.append(sel);
        return register("select", wrap, val ?? options[0]);
      },

      checkbox(opts = {}) {
        const { value: val = false, label } = opts;
        const wrap = style(document.createElement("label"), { ...labelStyle, cursor: "pointer" });
        const inp = style(document.createElement("input"), { accentColor: "#6366f1", cursor: "pointer" });
        inp.type = "checkbox"; inp.checked = val;
        wrap.append(inp);
        if (label) wrap.append(" " + label);
        return register("checkbox", wrap, val);
      },

      text(opts = {}) {
        const { value: val = "", label, placeholder = "" } = opts;
        const wrap = style(document.createElement("label"), labelStyle);
        if (label) wrap.append(label + " ");
        const inp = style(document.createElement("input"), { ...inputElStyle, width: "160px" });
        inp.type = "text"; inp.value = val; inp.placeholder = placeholder;
        wrap.append(inp);
        return register("text", wrap, val);
      },
    };
  }

  // Built-in libraries available in code blocks without imports
  async function loadBuiltins() {
    const [Plot, dsv] = await Promise.all([
      getLib("Plot", async () => {
        try { return await import("@observablehq/plot"); }
        catch { return await import("https://esm.sh/@observablehq/plot"); }
      }),
      getLib("dsv", () => import("https://esm.sh/d3-dsv")),
    ]);
    return { Plot, csvParse: dsv.csvParse, tsvParse: dsv.tsvParse, autoType: dsv.autoType, Inputs: createInputs() };
  }

  // Load highlight.js from CDN (just core + JS, ~5KB gzipped), shared across instances
  $effect(() => {
    getLib("hljs", async () => {
      const mod = await import("https://esm.sh/highlight.js@11/es/core");
      const hl = mod.default;
      const jsLang = await import("https://esm.sh/highlight.js@11/es/languages/javascript");
      hl.registerLanguage("javascript", jsLang.default);
      return hl;
    }).then((hl) => {
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
        // If inputs were created, wrap them above the result
        if (createdInputElements.length > 0) {
          const container = document.createElement("div");
          const inputRow = document.createElement("div");
          inputRow.style.cssText = "display:flex;flex-wrap:wrap;gap:12px;padding:10px 12px;align-items:center;border-bottom:1px solid #e5e7eb";
          for (const el of createdInputElements) inputRow.append(el);
          container.append(inputRow, result);
          htmlOutput = container;
        } else {
          htmlOutput = result;
        }
      } else if (result !== undefined && logs.length === 0) {
        logs.push(formatArg(result));
      }

      // If inputs exist but no DOM result, still show the input row
      if (createdInputElements.length > 0 && !htmlOutput) {
        const inputRow = document.createElement("div");
        inputRow.style.cssText = "display:flex;flex-wrap:wrap;gap:12px;padding:10px 12px;align-items:center";
        for (const el of createdInputElements) inputRow.append(el);
        htmlOutput = inputRow;
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

  let editorPre = $state(null);

  function syncScroll(e) {
    if (!editorPre) editorPre = e.target.parentElement.querySelector("pre");
    if (editorPre) {
      editorPre.scrollTop = e.target.scrollTop;
      editorPre.scrollLeft = e.target.scrollLeft;
    }
  }

  function handleKeydown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      run();
    } else if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.target;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      editableCode = editableCode.substring(0, start) + "  " + editableCode.substring(end);
      // Restore cursor after Svelte updates the textarea value
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 2; });
    }
  }

  function resetCode() {
    editableCode = code.trim();
    inputValues = {};
    run();
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
          <button onclick={resetCode} class="cr-btn cr-btn-light">↺ Reset</button>
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
        onkeydown={handleKeydown}
        spellcheck="false"
        class="cr-textarea"
      ></textarea>
    </div>
  {/if}
  {#if running}
    <div class="cr-running">Running...</div>
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
  .cr-running {
    padding: 8px var(--cr-pad);
    font-size: 12px;
    color: #9ca3af;
    border-top: 1px solid #e5e7eb;
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
