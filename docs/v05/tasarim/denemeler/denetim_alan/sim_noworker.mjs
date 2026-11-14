// Node'da Worker yok: new Worker ReferenceError atar → "işçi kurucusu hata verir" yolu. Açılış dizisinin arazi kısmı taklit edilir.
const ROOT = process.env.DK_ROOT;
const THREE = await import('three');
const { terrain } = await import(ROOT + '/js/world/terrain.js');
const scene = new THREE.Scene();
// en uzun bloklayan dilimi ölçmek için schedule edilen işleri sar: MessageChannel olay döngüsünde tek görev = tek dilim
let maxSlice = 0, slices = 0;
const origSlice = terrain._localSlice.bind(terrain);
terrain._localSlice = function () { const t0 = performance.now(); origSlice(); const dt = performance.now() - t0; slices++; if (dt > maxSlice) maxSlice = dt; };
terrain._localStep = null;
const t0 = performance.now();
terrain.init(scene, 'high');
console.log('init:', { workers: terrain.workers.length, fallback: terrain.fallback, failures: terrain.failures, mode: terrain.mode });
terrain.localBudget = 40;
let depthMsg = null; terrain.onDepth = (m) => { depthMsg = m; };
await terrain.prepare(160, 470, { radius: 900 });
const tPrep = performance.now() - t0;
const st = terrain.stats();
console.log('buildWorld.prepare bitti ms=', Math.round(tPrep), st, 'depthWin', terrain.depthWin, 'depth res', depthMsg && depthMsg.res, 'maxSlice(40ms bütçe)', maxSlice.toFixed(1), 'slices', slices);
// mesh sahnede mi
let inScene = 0; for (const t of terrain.tiles.values()) if (t.mesh && t.mesh.parent === terrain.group) inScene++;
console.log('sahnedeki karo ağı:', inScene, 'hires heights:', [...terrain.tiles.values()].filter(t => t.heights).length, 'heights ama hires değil:', [...terrain.tiles.values()].filter(t => t.heights && t.seg !== 80).length);
terrain.localBudget = 10; maxSlice = 0; slices = 0;
const tg = performance.now();
const g = await terrain.requestGrid(-10000, -10000, 20000, 1024, -500);
console.log('initMapBase ızgarası 1024²: ms=', Math.round(performance.now() - tg), 'len', g.heights.length, 'maxSlice(10ms bütçe)', maxSlice.toFixed(1), 'slices', slices, 'kalan iş', terrain.stats().jobs);
// tüm kuyruk boşalana kadar
const tq = performance.now(); maxSlice = 0;
while (terrain._jobs.size) await new Promise(r => setTimeout(r, 20));
console.log('kalan kuyruk bitti ms=', Math.round(performance.now() - tq), 'maxSlice', maxSlice.toFixed(1), terrain.stats());
// uzak bölge hazırlığı (hızlı yolculuk/ışınlanma benzeri), kamera eski yerde
maxSlice = 0;
const tf = performance.now();
const r = await terrain.prepare(1900, 950, { radius: 450 });
const near = [...terrain.tiles.values()].filter(t => t.mesh && Math.hypot(t.x0 + 80 - 1900, t.z0 + 80 - 950) < 400).length;
console.log('uzak prepare ms=', Math.round(performance.now() - tf), 'sonuç', r, 'hedef çevresi ağ', near, 'depthWin', terrain.depthWin, 'maxSlice(10ms)', maxSlice.toFixed(1));
process.exit(0);
