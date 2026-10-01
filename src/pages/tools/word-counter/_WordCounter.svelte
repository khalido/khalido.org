<script lang="ts">
  let text = $state("");

  // Intl.Segmenter counts words properly for CJK, hyphenation, punctuation etc.
  const wordSegmenter = new Intl.Segmenter(undefined, { granularity: "word" });
  const sentenceSegmenter = new Intl.Segmenter(undefined, { granularity: "sentence" });

  const stats = $derived.by(() => {
    const words = [...wordSegmenter.segment(text)].filter((s) => s.isWordLike).length;
    const sentences = [...sentenceSegmenter.segment(text)].filter((s) => s.segment.trim()).length;
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim()).length;
    const minutes = words / 230; // average adult silent reading speed
    return [
      { label: "Words", value: words.toLocaleString() },
      { label: "Characters", value: text.length.toLocaleString() },
      { label: "No spaces", value: text.replace(/\s/g, "").length.toLocaleString() },
      { label: "Sentences", value: sentences.toLocaleString() },
      { label: "Paragraphs", value: paragraphs.toLocaleString() },
      { label: "Reading time", value: words === 0 ? "0 min" : minutes < 1 ? "< 1 min" : `${Math.round(minutes)} min` },
    ];
  });
</script>

<div class="space-y-4">
  <textarea
    bind:value={text}
    class="w-full h-48 p-2 border border-gray-300 rounded-md"
    placeholder="Paste your text here..."
  ></textarea>
  <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-gray-100 rounded-md">
    {#each stats as s}
      <div class="text-center">
        <p class="text-sm font-semibold text-gray-600">{s.label}</p>
        <p class="text-2xl tabular-nums">{s.value}</p>
      </div>
    {/each}
  </div>
</div>
