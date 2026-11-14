// Salt-okur deneme: terrainGen.js üreteçlerinin yield aralıkları arasındaki en uzun süre (ana iş parçacığı yedeğinde tek dilimin bölünemez parçası)
const ROOT = process.argv[2];
const G = await import(ROOT + '/js/world/terrainGen.js');
function run(label, msg) {
  const gen = G.generate(msg);
  let max = 0, n = 0, total = 0;
  for (;;) {
    const t0 = performance.now();
    const r = gen.next();
    const dt = performance.now() - t0;
    total += dt; n++; if (dt > max) max = dt;
    if (r.done) { const o = r.value.out; return { label, chunks: n, maxChunkMs: +max.toFixed(1), totalMs: +total.toFixed(0), keys: Object.keys(o).join(',') }; }
  }
}
// ısınma
run('warm', { t: 'tile', id: 0, key: 0, x0: 0, z0: 400, size: 160, seg: 80, hires: true });
const out = [];
out.push(run('tile seg80 (liman)', { t: 'tile', id: 1, key: 1, x0: 80, z0: 400, size: 160, seg: 80, hires: true }));
out.push(run('tile seg32', { t: 'tile', id: 2, key: 2, x0: 80, z0: 400, size: 160, seg: 32, hires: false }));
out.push(run('depth 512 (2400 m)', { t: 'depth', id: 3, x0: -1040, z0: -730, size: 2400, res: 512 }));
out.push(run('grid 1024 (dunya, initMapBase)', { t: 'grid', id: 4, x0: -10000, z0: -10000, size: 20000, res: 1024 }));
out.push(run('grid 512 (harita ayrinti karosu 1250 m)', { t: 'grid', id: 5, x0: 0, z0: 0, size: 1250, res: 512 }));
out.push(run('grid 256 (test)', { t: 'grid', id: 6, x0: -10000, z0: -10000, size: 20000, res: 256 }));
console.log(JSON.stringify(out, null, 1));
