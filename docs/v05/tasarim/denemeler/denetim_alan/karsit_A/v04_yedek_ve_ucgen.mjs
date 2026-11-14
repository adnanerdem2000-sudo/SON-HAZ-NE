// Karşıt denetim (A): v0.4 terrain.js — Worker yokken (Node: ReferenceError) açılış hazırlığı + heightAt/ağ üçgenleme tutarlılığı.
// Salt-okur: depo dosyalarını yalnız içe aktarır.
const ROOT = process.env.DK_ROOT;
const THREE = await import('three');
const { terrain } = await import(ROOT + '/js/world/terrain.js');
console.warn = () => {};
const scene = new THREE.Scene();
const t0 = performance.now();
terrain.init(scene, 'high');
const init = { workers: terrain.workers.length, fallback: terrain.fallback, failures: terrain.failures.slice() };
terrain.localBudget = 40;
let depthMsg = null; terrain.onDepth = (m) => { depthMsg = m; };
const r = await terrain.prepare(160, 470, { radius: 900 });
const tPrep = Math.round(performance.now() - t0);
const st = terrain.stats();
terrain.localBudget = 10;
const tg = performance.now();
const g = await terrain.requestGrid(-10000, -10000, 20000, 1024, -500).then((m) => m.heights.length, (e) => 'RED ' + e.message);
const tGrid = Math.round(performance.now() - tg);
console.log(JSON.stringify({ init, prepareResult: r, tPrep, stats: st, depthWin: terrain.depthWin, depthRes: depthMsg && depthMsg.res, grid: g, tGrid }));

// heightAt ile çizilen üçgen düzleminin karşılaştırması (hires karolar, rastgele noktalar)
let maxDiff = 0, n = 0, worstAt = null;
const hires = [...terrain.tiles.values()].filter((t) => t.heights && t.mesh);
const rnd = (() => { let s = 12345; return () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296); })();
for (const t of hires) {
  const pos = t.mesh.geometry.attributes.position.array, idx = t.mesh.geometry.index.array;
  const seg = t.seg, nn = seg + 1;
  for (let k = 0; k < 400; k++) {
    const i = Math.floor(rnd() * seg), j = Math.floor(rnd() * seg);
    const tx = rnd(), tz = rnd();
    const step = 160 / seg;
    const x = t.x0 + (i + tx) * step, z = t.z0 + (j + tz) * step;
    // hücrenin iki üçgeni indeks dizisinden: q = (j*seg + i)*6
    const q = (j * seg + i) * 6;
    const tris = [[idx[q], idx[q + 1], idx[q + 2]], [idx[q + 3], idx[q + 4], idx[q + 5]]];
    let hm = null;
    for (const [a, b, c] of tris) {
      const ax = pos[a * 3], az = pos[a * 3 + 2], bx = pos[b * 3], bz = pos[b * 3 + 2], cx = pos[c * 3], cz = pos[c * 3 + 2];
      const den = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
      const w1 = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / den;
      const w2 = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / den;
      const w3 = 1 - w1 - w2;
      if (w1 >= -1e-6 && w2 >= -1e-6 && w3 >= -1e-6) { hm = w1 * pos[a * 3 + 1] + w2 * pos[b * 3 + 1] + w3 * pos[c * 3 + 1]; break; }
    }
    if (hm === null) continue;
    const hq = terrain.heightAt(x, z);
    const d = Math.abs(hq - hm);
    n++;
    if (d > maxDiff) { maxDiff = d; worstAt = [+x.toFixed(2), +z.toFixed(2), +hq.toFixed(3), +hm.toFixed(3)]; }
  }
}
console.log(JSON.stringify({ hiresTiles: hires.length, samples: n, maxAbsDiff_heightAt_vs_mesh: maxDiff, worstAt }));
process.exit(0);
