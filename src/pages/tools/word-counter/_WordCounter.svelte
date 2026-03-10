<script>
  let text = "";
  let wordCount = 0;
  let charCount = 0;

  function count() {
    charCount = text.length;
    wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  }
</script>

<div class="space-y-4">
  <textarea
    bind:value={text}
    on:input={count}
    class="w-full h-48 p-2 border border-gray-300 rounded-md"
    placeholder="Paste your text here..."
  ></textarea>
  <div class="flex justify-around p-4 bg-gray-100 rounded-md">
    <div class="text-center">
      <p class="text-lg font-semibold">Words</p>
      <p class="text-2xl">{wordCount}</p>
    </div>
    <div class="text-center">
      <p class="text-lg font-semibold">Characters</p>
      <p class="text-2xl">{charCount}</p>
    </div>
  </div>
</div>
