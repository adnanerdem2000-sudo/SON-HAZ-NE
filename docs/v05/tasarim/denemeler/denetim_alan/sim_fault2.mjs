const ROOT = process.env.DK_ROOT;
const THREE = await import('three');
const Gen = await import(ROOT + '/js/world/terrainGen.js');
const { installFakeWorker } = await import('/tmp/denetim_alan/fake_worker.mjs');
const G = { cfg: {}, generate: Gen.generate, runAll: Gen.runAll };
const workers = installFakeWorker(ROOT, G);
Object.defineProperty(globalThis, 'navigator', { value: { hardwareConcurrency: 4 }, configurable: true });
console.warn = () => {}; console.error = () => {};
const wait = (ms) => new Promise(r => setTimeout(r, ms));
let caseN = 0;
async function fresh(cfg) { G.cfg = cfg; workers.length = 0; const mod = await import(ROOT + '/js/world/terrain.js?d=' + (++caseN)); const T = mod.terrain; T.init(new THREE.Scene(), 'high'); return T; }
const res = {};
for (const [name, cfg] of [['C4_yukleme_hatasi_404', { loadError: true }], ['C10_hazir_sinyali_yok', { noReady: true }], ['C11_hazir_ama_yanit_yok', { policy: () => 'hang' }]]) {
  const T = await fresh(cfg);
  const t0 = Date.now();
  const r = await T.prepare(160, 470, { radius: 900 });
  const tPrep = Date.now() - t0;
  const g = await T.requestGrid(-10000, -10000, 20000, 256, -500).then(m => m.heights.length, e => 'RED: ' + e.message);
  res[name] = { prepareMs: tPrep, prepareSonuc: r ?? 'tamam', toplamMs: Date.now() - t0, workers: T.workers.length, fallback: T.fallback, meshes: T.stats().meshes, depthWin: !!T.depthWin, grid: g, failures: T.failures.slice(0, 4) };
}
console.log(JSON.stringify(res, null, 1));
process.exit(0);
