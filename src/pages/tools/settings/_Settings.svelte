<script>
  import { getKeys, setKey, clearKeys } from "@scripts/keystore";

  const keyDefs = [
    { id: "openrouter", label: "OpenRouter", placeholder: "sk-or-v1-...", help: "openrouter.ai — access 200+ models with one key" },
    { id: "gemini", label: "Google Gemini", placeholder: "AIza...", help: "aistudio.google.com" },
    { id: "exa", label: "Exa.ai", placeholder: "exa-...", help: "exa.ai — search API" },
  ];

  let values = $state({});
  let saved = $state(false);

  // Load on mount
  $effect(() => {
    values = getKeys();
  });

  function save() {
    for (const def of keyDefs) {
      setKey(def.id, values[def.id] || "");
    }
    saved = true;
    setTimeout(() => saved = false, 2000);
  }

  function clearAll() {
    clearKeys();
    values = {};
  }

  function mask(key) {
    if (!key || key.length < 8) return key;
    return key.slice(0, 6) + "•".repeat(Math.min(key.length - 10, 20)) + key.slice(-4);
  }
</script>

<div class="settings">
  <p class="info">
    API keys are stored in your browser's localStorage. They never leave your device — tools call APIs directly from your browser.
  </p>

  {#each keyDefs as def}
    <div class="field">
      <label for={def.id}>
        {def.label}
        <span class="help">{def.help}</span>
      </label>
      <input
        type="password"
        id={def.id}
        bind:value={values[def.id]}
        placeholder={def.placeholder}
        autocomplete="off"
      />
    </div>
  {/each}

  <div class="actions">
    <button class="btn-save" onclick={save}>
      {saved ? "✓ Saved" : "Save keys"}
    </button>
    <button class="btn-clear" onclick={clearAll}>Clear all</button>
  </div>
</div>

<style>
  .settings {
    max-width: 500px;
  }
  .info {
    font-size: 13px;
    color: #6b7280;
    background: #f9fafb;
    padding: 10px 14px;
    border-radius: 6px;
    margin-bottom: 20px;
    line-height: 1.5;
  }
  .field {
    margin-bottom: 16px;
  }
  .field label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 4px;
  }
  .help {
    font-weight: 400;
    color: #9ca3af;
    font-size: 12px;
    margin-left: 6px;
  }
  .field input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    font-family: ui-monospace, monospace;
    outline: none;
  }
  .field input:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
  }
  .actions {
    display: flex;
    gap: 8px;
    margin-top: 20px;
  }
  .btn-save {
    padding: 8px 20px;
    background: #374151;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
  }
  .btn-save:hover { background: #1f2937; }
  .btn-clear {
    padding: 8px 16px;
    background: white;
    color: #6b7280;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
  }
  .btn-clear:hover { background: #f9fafb; }
</style>
