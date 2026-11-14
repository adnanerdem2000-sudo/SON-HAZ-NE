// v0.3 terrain.js: Worker yokken (kurucu hata verir) prepare/requestDepth/requestGrid davranışı
const ROOT = process.env.DK_ROOT;
const THREE = await import('three');
const { terrain } = await import(ROOT + '/js/world/terrain.js');
const scene = new THREE.Scene();
terrain.init(scene, 'high');
console.log('init: workers', terrain.workers.length);
let settled = false;
const p = terrain.prepare(160, 470, { radius: 900 }).then(() => { settled = true; });
let gridSettled = false;
terrain.requestGrid(-10000, -10000, 20000, 256, -500).then(() => { gridSettled = true; }, () => { gridSettled = 'reject'; });
await new Promise(r => setTimeout(r, 15000));
const tiles = [...terrain.tiles.values()];
console.log({ prepareSettled: settled, gridSettled, tiles: tiles.length, meshes: tiles.filter(t => t.mesh).length, withHeights: tiles.filter(t => t.heights).length, nonHiresWithHeights: tiles.filter(t => t.heights && t.seg !== 80).length, pending: tiles.filter(t => t.pending).length, depthPending: !!terrain._depthPending, depthWin: terrain.depthWin, cbLeft: terrain._cb.size, queue: terrain._queue.length });
process.exit(0);
