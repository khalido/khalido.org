// Lives in its own .js file (real editor support, no escaping) and is loaded
// into CodeRunner with `import fibCode from './fib.js?raw'`.
const n = Inputs.slider(5, 40, { value: 15, label: "Terms" });

const seq = [1, 1];
for (let i = 2; i < n.value; i++) seq.push(seq[i - 1] + seq[i - 2]);

return Plot.plot({
  height: 200,
  y: { type: "log", label: "value (log)" },
  marks: [Plot.dot(seq.map((v, i) => ({ i, v })), { x: "i", y: "v" })],
});
