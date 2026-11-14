// Karşıt denetim (A): yedek kipte localBudget 10 / 40 ms iken 1024² harita ızgarası süresi ve en uzun dilim (Node, Worker yok)
const ROOT = process.env.DK_ROOT;
const THREE = await import('three');
const { terrain } = await import(ROOT + '/js/world/terrain.js');
console.warn = () => {};
let maxSlice = 0;
const orig = terrain._localSlice.bind(terrain);
terrain._localSlice = function () { const t0 = performance.now(); orig(); const d = performance.now() - t0; if (d > maxSlice) maxSlice = d; };
terrain._localStep = null;
terrain.init(new THREE.Scene(), 'high');
await terrain.prepare(160, 470, { radius: 900 });
while (terrain._jobs.size) await new Promise((r) => setTimeout(r, 10));
const out = {};
for (const [budget, x0] of [[10, -10000], [40, -10001], [10, -10002], [40, -10003]]) {
  terrain.localBudget = budget; maxSlice = 0;
  const t0 = performance.now();
  await terrain.requestGrid(x0, -10000, 20000, 1024, -500);
  out['butce' + budget + '_' + x0] = { ms: Math.round(performance.now() - t0), maxSliceMs: +maxSlice.toFixed(1) };
}
console.log(JSON.stringify(out));
process.exit(0);
