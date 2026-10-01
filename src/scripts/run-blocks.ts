/**
 * Mounts CodeRunner onto ```js run fences (see runnableCode in astro.config.mjs).
 * Svelte + CodeRunner are only downloaded on pages that have such a block,
 * and each block mounts when it scrolls near the viewport.
 */
const blocks = document.querySelectorAll<HTMLElement>(".cr-run[data-code]");

if (blocks.length) {
  const load = Promise.all([import("svelte"), import("@components/CodeRunner.svelte")]);

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        const el = entry.target as HTMLElement;
        load.then(([{ mount }, { default: CodeRunner }]) => {
          const target = document.createElement("div");
          el.after(target);
          mount(CodeRunner, {
            target,
            props: {
              code: el.dataset.code ?? "",
              title: el.dataset.title ?? "",
              collapsed: !("open" in el.dataset),
            },
          });
          el.hidden = true; // static highlighted copy, kept for no-JS / markdown twin
        });
      }
    },
    { rootMargin: "200px" },
  );
  blocks.forEach((b) => observer.observe(b));
}
