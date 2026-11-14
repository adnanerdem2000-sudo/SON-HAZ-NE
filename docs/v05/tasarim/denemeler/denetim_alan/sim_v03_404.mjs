// v0.3: işçi dosyası bulunamaz (yükleme hatası, onerror) → prepare/requestDepth/requestGrid sonuçlanıyor mu?
const ROOT = process.env.DK_ROOT;
const THREE = await import('three');
const Gen = await import('/home/user/SON-HAZ-NE-w2/js/world/terrainGen.js');
const { installFakeWorker } = await import('/tmp/denetim_alan/fake_worker.mjs');
const G = { cfg: { loadError: true }, generate: Gen.generate, runAll: Gen.runAll };
installFakeWorker(ROOT, G);
Object.defineProperty(globalThis, 'navigator', { value: { hardwareConcurrency: 4 }, configurable: true });
const errs = []; console.error = (...a) => errs.push(String(a[0]).slice(0, 60));
const { terrain } = await import(ROOT + '/js/world/terrain.js');
terrain.init(new THREE.Scene(), 'high');
let settled = false, gridSettled = false;
terrain.prepare(160, 470, { radius: 900 }).then(() => { settled = true; });
terrain.requestGrid(-10000, -10000, 20000, 256, -500).then(() => { gridSettled = true; }, () => { gridSettled = 'red'; });
await new Promise(r => setTimeout(r, 12000));
const tiles = [...terrain.tiles.values()];
console.log({ prepareSettled: settled, gridSettled, workers: terrain.workers.length, tiles: tiles.length, meshes: tiles.filter(t => t.mesh).length, pending: tiles.filter(t => t.pending).length, cbWaiting: terrain._cb.size, depthWin: terrain.depthWin, onerrorLogs: errs.length });
process.exit(0);
