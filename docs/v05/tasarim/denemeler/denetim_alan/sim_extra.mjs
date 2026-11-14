const ROOT = process.env.DK_ROOT;
const THREE = await import('three');
const Gen = await import(ROOT + '/js/world/terrainGen.js');
const { installFakeWorker } = await import('/tmp/denetim_alan/fake_worker.mjs');
const G = { cfg: {}, generate: Gen.generate, runAll: Gen.runAll };
const workers = installFakeWorker(ROOT, G);
Object.defineProperty(globalThis, 'navigator', { value: { hardwareConcurrency: 4 }, configurable: true });
console.warn = () => {}; console.error = () => {};
const wait = (ms) => new Promise(r => setTimeout(r, ms));
let n = 0;
async function fresh(cfg) { G.cfg = cfg; workers.length = 0; const T = (await import(ROOT + '/js/world/terrain.js?e=' + (++n))).terrain; T.init(new THREE.Scene(), 'high'); return T; }
const res = {};
// E1: örtüşen iki prepare (yavaş işçi): A biter, B'nin odağı kısalır mı?
{
  const T = await fresh({ delay: (w, m) => (m.t === 'tile' && Math.hypot(m.x0 + 80 - 1900, m.z0 + 80 - 950) < 600 ? 400 : 3) });
  await wait(20);
  T.update(160, 470, true); while (T._jobs.size) await wait(10);
  const pA = T.prepare(160, 470, { radius: 300 });
  await wait(1);
  const pB = T.prepare(1900, 950, { radius: 400 });
  const FB = T.focus;
  await pA;
  const kalanB = (FB.until - performance.now()) / 1000;
  await pB;
  res.E1_ortusen_prepare = { B_odak_kalan_sn_A_bitince: +kalanB.toFixed(1), beklenen: '≈ 90' };
}
// E2: kısmi kurulum — ikinci kurucu hata verir
{
  let k = 0;
  G.cfg = {}; workers.length = 0;
  const Orig = globalThis.Worker;
  globalThis.Worker = class extends Orig { constructor(u, o) { if (k++ === 1) throw new Error('sahte kurucu hatası'); super(u, o); } };
  const T = (await import(ROOT + '/js/world/terrain.js?e=' + (++n))).terrain; T.init(new THREE.Scene(), 'high');
  await wait(30);
  res.E2_kismi_kurulum = { workers: T.workers.length, fallback: T.fallback, failures: T.failures };
  globalThis.Worker = Orig;
}
// E3: yedek kipte şeritteki karo işi silinirse (dead-code 176) iş sonuna kadar üretilir mi?
{
  const T = await fresh({ ctorThrows: true });
  T.localBudget = 1;
  T.update(160, 470, true);
  await wait(2);
  const lane = T._lanes[0];
  let r = null;
  if (lane) {
    const job = lane.job; const t = [...T.tiles.values()].find(t => t.job === job);
    const stepsBefore = job.msg.seg;
    T._drop(t);
    const stillInJobs = T._jobs.has(job.id);
    let doneAt = null; const t0 = performance.now();
    job.promise.then(() => { doneAt = performance.now() - t0; });
    while (doneAt === null) await wait(1);
    r = { seg: stepsBefore, silindiktenSonraJobsIcinde: stillInJobs, uretimTamamlandiMs: +doneAt.toFixed(1) };
  }
  res.E3_seritte_iptal = r || 'şeritte iş yok';
}
console.log(JSON.stringify(res, null, 1));
process.exit(0);
