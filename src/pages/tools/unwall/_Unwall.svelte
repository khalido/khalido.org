<script>
  let url = $state("");
  let results = $state([]);
  let checking = $state(false);

  const services = [
    {
      name: "Archive.today",
      getUrl: (u) => `https://archive.today/newest/${u}`,
      icon: "📦",
    },
    {
      name: "12ft.io",
      getUrl: (u) => `https://12ft.io/${u}`,
      icon: "🪜",
    },
    {
      name: "Google Cache",
      getUrl: (u) => `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(u)}`,
      icon: "🔍",
    },
    {
      name: "Wayback Machine",
      getUrl: (u) => `https://web.archive.org/web/${u}`,
      icon: "🕰️",
    },
    {
      name: "Archive.org (latest)",
      getUrl: (u) => `https://web.archive.org/web/2/${u}`,
      icon: "📚",
    },
  ];

  async function checkUrl(service) {
    const target = service.getUrl(url);
    try {
      // We can't actually check if these work due to CORS,
      // so we just generate the links and let the user try them
      return { ...service, url: target, status: "link" };
    } catch {
      return { ...service, url: target, status: "error" };
    }
  }

  async function check() {
    if (!url.trim()) return;
    // Normalize URL
    let normalized = url.trim();
    if (!normalized.startsWith("http")) normalized = "https://" + normalized;
    url = normalized;

    checking = true;
    results = services.map((s) => ({
      ...s,
      url: s.getUrl(normalized),
      status: "link",
    }));

    // Try to check archive.org API for actual availability
    try {
      const res = await fetch(`https://archive.org/wayback/available?url=${encodeURIComponent(normalized)}`);
      const data = await res.json();
      if (data.archived_snapshots?.closest?.available) {
        const idx = results.findIndex(r => r.name === "Wayback Machine");
        if (idx !== -1) {
          results[idx] = { ...results[idx], url: data.archived_snapshots.closest.url, status: "available" };
        }
      }
    } catch {}

    checking = false;
  }

  function handleKeydown(e) {
    if (e.key === "Enter") check();
  }

  function extractDomain(u) {
    try { return new URL(u).hostname.replace("www.", ""); }
    catch { return u; }
  }
</script>

<div class="unwall">
  <div class="input-row">
    <input
      type="text"
      bind:value={url}
      onkeydown={handleKeydown}
      placeholder="Paste a paywalled URL..."
      class="url-input"
    />
    <button onclick={check} disabled={checking || !url.trim()} class="btn-check">
      {checking ? "Checking..." : "Unwall"}
    </button>
  </div>

  {#if results.length > 0}
    <div class="results">
      <p class="results-label">Try these for <strong>{extractDomain(url)}</strong>:</p>
      {#each results as r}
        <a href={r.url} target="_blank" rel="noopener" class="result-row" class:available={r.status === "available"}>
          <span class="result-icon">{r.icon}</span>
          <span class="result-name">{r.name}</span>
          {#if r.status === "available"}
            <span class="result-badge available-badge">found</span>
          {:else}
            <span class="result-badge">try →</span>
          {/if}
        </a>
      {/each}
    </div>

    <div class="tips">
      <p><strong>Tips:</strong></p>
      <ul>
        <li>Archive.today is usually the most reliable for news articles</li>
        <li>Wayback Machine works best for older articles</li>
        <li>Try reader mode in your browser (Firefox Reader View, Safari Reader)</li>
        <li>Some sites unblock if you disable JavaScript</li>
      </ul>
    </div>
  {/if}
</div>

<style>
  .unwall {
    max-width: 500px;
  }
  .input-row {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }
  .url-input {
    flex: 1;
    padding: 10px 14px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
    outline: none;
  }
  .url-input:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
  }
  .btn-check {
    padding: 10px 20px;
    background: #374151;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
  }
  .btn-check:hover { background: #1f2937; }
  .btn-check:disabled { opacity: 0.5; cursor: default; }
  .results {
    margin-bottom: 16px;
  }
  .results-label {
    font-size: 13px;
    color: #6b7280;
    margin-bottom: 8px;
  }
  .result-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 6px;
    text-decoration: none;
    color: #374151;
    transition: background 0.1s;
  }
  .result-row:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }
  .result-row.available {
    border-color: #86efac;
    background: #f0fdf4;
  }
  .result-icon {
    font-size: 18px;
  }
  .result-name {
    flex: 1;
    font-weight: 500;
    font-size: 14px;
  }
  .result-badge {
    font-size: 12px;
    color: #9ca3af;
    padding: 2px 8px;
    border-radius: 4px;
    background: #f3f4f6;
  }
  .available-badge {
    background: #dcfce7;
    color: #166534;
  }
  .tips {
    font-size: 13px;
    color: #6b7280;
    background: #f9fafb;
    padding: 12px 16px;
    border-radius: 8px;
    line-height: 1.6;
  }
  .tips ul {
    margin: 4px 0 0;
    padding-left: 18px;
  }
  .tips li {
    margin-bottom: 2px;
  }
</style>
