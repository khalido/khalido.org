// `brentUrl` comes in via <CodeRunner vars={{ brentUrl }} />; csv() is cached,
// so dragging the slider re-runs this without refetching.
const brent = await csv(brentUrl);
const from = Inputs.slider(1990, 2025, { value: 2010, label: "From", step: 1 });

return Plot.plot({
  height: 240,
  y: { label: "USD/barrel", grid: true },
  marks: [
    Plot.lineY(
      brent.filter((d) => d.date.getFullYear() >= from.value),
      { x: "date", y: "price" },
    ),
  ],
});
