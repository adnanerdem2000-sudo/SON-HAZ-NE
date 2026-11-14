const ROOT = process.argv[2];
const G = await import(ROOT + '/js/world/terrainGen.js');
const A = await import(ROOT + '/js/world/archipelago.js');
function chunks(msg) { const gen = G.generate(msg); let max = 0, tot = 0; for (;;) { const t0 = performance.now(); const r = gen.next(); const dt = performance.now() - t0; tot += dt; if (dt > max) max = dt; if (r.done) return [max, tot]; } }
// ısınma
for (let i = 0; i < 3; i++) chunks({ t: 'depth', id: 0, x0: -1040, z0: -730, size: 2400, res: 512 });
const pts = [[160, 470], ...A.EXTRA_ISLANDS.slice(0, 40).filter((_, i) => i % 4 === 0).map(I => [I.x, I.z]), [600, -6200]];
const rows = pts.map(([x, z]) => { const [m, t] = chunks({ t: 'depth', id: 1, x0: Math.round((x - 1200) / 40) * 40, z0: Math.round((z - 1200) / 40) * 40, size: 2400, res: 512 }); return [x, z, +m.toFixed(1), +t.toFixed(0)]; });
const gm = chunks({ t: 'grid', id: 2, x0: -10000, z0: -10000, size: 20000, res: 1024 });
const tl = []; for (const [x, z] of pts.slice(0, 6)) { const [m] = chunks({ t: 'tile', id: 3, key: 1, x0: Math.floor(x / 160) * 160, z0: Math.floor(z / 160) * 160, size: 160, seg: 80, hires: true }); tl.push(+m.toFixed(1)); }
console.log(JSON.stringify({ depth_maxChunk_totalMs: rows, depthMaxChunkOverall: Math.max(...rows.map(r => r[2])), grid1024: gm.map(v => +v.toFixed(1)), tile80MaxChunk: tl }));
