const ROOT = process.env.DK_ROOT;
const THREE = await import('three');
const Gen = await import(ROOT + '/js/world/terrainGen.js');
const { installFakeWorker } = await import('/tmp/denetim_alan/fake_worker.mjs');
const G = { cfg: {}, generate: Gen.generate, runAll: Gen.runAll };
const workers = installFakeWorker(ROOT, G);
Object.defineProperty(globalThis, "navigator", { value: { hardwareConcurrency: 4 }, configurable: true }); // 3 işçi
console.warn = () => {}; const errs = []; console.error = (...a) => errs.push(a.join(' ').slice(0, 80));
const wait = (ms) => new Promise(r => setTimeout(r, ms));
let caseN = 0;
async function fresh(cfg) {
  G.cfg = cfg; workers.length = 0;
  const mod = await import(ROOT + '/js/world/terrain.js?c=' + (++caseN));
  const T = mod.terrain;
  T.init(new THREE.Scene(), 'high');
  return T;
}
const orphanCheck = (T) => [...T._jobs.values()].filter(j => !T._queue.includes(j) && !T._lanes.some(a => a && a.job === j) && !T.workers.some(r => r.jobs.has(j.id))).length;
const phantom = (T) => T.workers.reduce((n, r) => n + [...r.jobs.keys()].filter(id => !T._jobs.has(id)).length, 0);
const res = {};
// C1: görev sırasında bir işçi çöker (ikinci mesajında), diğerleri sağlam
{
  let crashed = false;
  const T = await fresh({ policy: (w, m) => (w.idx === 0 && w.received.length >= 2 && !crashed ? (crashed = true, 'crash') : 'ok'), delay: 3 });
  const t0 = Date.now();
  await T.prepare(160, 470, { radius: 900 });
  const g = await T.requestGrid(-10000, -10000, 20000, 256, -500).then(m => m.heights.length, e => 'RED: ' + e.message);
  while (T._jobs.size) await wait(10);
  res.C1_bir_isci_coker = { ms: Date.now() - t0, workers: T.workers.length, fallback: T.fallback, meshes: T.stats().meshes, tiles: T.stats().tiles, depthWin: !!T.depthWin, grid: g, orphan: orphanCheck(T), phantom: phantom(T), failures: T.failures.slice(0, 3) };
}
// C2: tüm işçiler ilk mesajda çöker (crash kipi) → yedek
{
  const T = await fresh({ policy: () => 'crash', delay: 3 });
  const t0 = Date.now();
  await T.prepare(160, 470, { radius: 900 });
  const g = await T.requestGrid(-10000, -10000, 20000, 256, -500).then(m => m.heights.length, e => 'RED: ' + e.message);
  while (T._jobs.size) await wait(10);
  res.C2_hepsi_coker = { ms: Date.now() - t0, workers: T.workers.length, fallback: T.fallback, meshes: T.stats().meshes, depthWin: !!T.depthWin, grid: g, orphan: orphanCheck(T) };
}
// C3: işçi kurucusu eşzamanlı hata verir
{
  const T = await fresh({ ctorThrows: true });
  const t0 = Date.now();
  await T.prepare(160, 470, { radius: 900 });
  const g = await T.requestGrid(-10000, -10000, 20000, 256, -500).then(m => m.heights.length, e => 'RED: ' + e.message);
  res.C3_kurucu_hata = { ms: Date.now() - t0, workers: T.workers.length, fallback: T.fallback, meshes: T.stats().meshes, depthWin: !!T.depthWin, grid: g, failures: T.failures };
}
// C4: yükleme hatası (404 benzeri onerror)
{
  const T = await fresh({ loadError: true });
  const t0 = Date.now();
  await T.prepare(160, 470, { radius: 900 });
  res.C4_yukleme_hatasi = { ms: Date.now() - t0, workers: T.workers.length, fallback: T.fallback, meshes: T.stats().meshes, depthWin: !!T.depthWin };
}
// C5: harita ızgarası işçide hata iletisi verir → requestGrid reddedilir (initMapBase bunu yakalamıyor)
{
  const T = await fresh({ policy: (w, m) => (m.t === 'grid' ? 'error' : 'ok'), delay: 2 });
  await T.prepare(160, 470, { radius: 900 });
  const g = await T.requestGrid(-10000, -10000, 20000, 1024, -500).then(m => 'tamam', e => 'RED: ' + e.message);
  res.C5_izgara_hatasi = { grid: g, workers: T.workers.length, fallback: T.fallback };
}
// C6: ızgara işini alan her işçi çöker (ör. bellek) → 3 denemede red; yerel yedeğe verilmez
{
  const T = await fresh({ policy: (w, m) => (m.t === 'grid' ? 'crash' : 'ok'), delay: 2 });
  await T.prepare(160, 470, { radius: 900 });
  // 3 işçi; her biri ızgara işini alınca ölür
  const g = await T.requestGrid(-10000, -10000, 20000, 512, -500).then(m => 'tamam(' + m.heights.length + ')', e => 'RED: ' + e.message);
  res.C6_izgara_isciyi_oldurur = { grid: g, workers: T.workers.length, fallback: T.fallback };
}
// C7: LOD yarışı — aynı karoya önce seg 32 (yavaş yanıt), sonra seg 80 (hızlı yanıt)
{
  const T = await fresh({ delay: (w, m) => (m.t === 'tile' && m.seg === 32 ? 60 : 2) });
  await wait(20);
  T.update(160, 470, true);
  while (T._jobs.size) await wait(10);
  const t = [...T.tiles.values()].find(t => t.seg === 80);
  T._requestTile(t, 32, 0); // eski (yavaş) istek
  await wait(5);
  T._requestTile(t, 80, 0); // yeni istek, eskiyi geçersiz kılar
  await wait(150);
  res.C7_lod_yarisi = { segSonunda: t.seg, pending: t.pending, idxCount: t.mesh.geometry.index.count, beklenen80: 80 * 80 * 6 + 4 * 80 * 6 };
}
// C8: silinmiş karonun geç gelen sonucu
{
  const T = await fresh({ delay: (w, m) => (m.t === 'tile' ? 50 : 2) });
  await wait(20);
  T.update(160, 470, true);
  await wait(5);
  const t = [...T.tiles.values()].find(t => t.pending);
  const k = t.k; const before = T.group.children.length;
  T._drop(t);
  while (T._jobs.size) await wait(10);
  res.C8_silinen_karo = { karoHaritada: T.tiles.has(k), grupAgSayisi: T.group.children.length, oncesi: before, ilgiliAgVar: T.group.children.some(m => m.geometry.boundingSphere && Math.abs(m.geometry.boundingSphere.center.x - (t.x0 + 80)) < 1 && Math.abs(m.geometry.boundingSphere.center.z - (t.z0 + 80)) < 1), jobs: T._jobs.size };
}
// C9: sonlandırılmış işçinin geç iletisi teslim edilirse (tarayıcıya bağlı) → hayalet iş yuvası
{
  let first = true;
  const T = await fresh({ deliverAfterTerminate: true, delay: (w, m) => (m.t === 'tile' && w.idx === 0 && first ? (first = false, 30) : 2), policy: () => 'ok' });
  await wait(20);
  // işçi 0'a iş ver, yanıt gelmeden işçi 0'ı öldür; iş işçi 1/2'ye gider, işçi 0'ın geç yanıtı yine gelir
  T.update(160, 470, true);
  await wait(3);
  T._workerFailed(T.workers.find(r => r.i === 0), 'sahte: zaman aşımı');
  while (T._jobs.size) await wait(10);
  await wait(100);
  res.C9_gec_ileti = { phantomSlots: phantom(T), perWorker: T.workers.map(r => [r.i, r.jobs.size]) };
}
console.log(JSON.stringify(res, null, 1));
console.log('console.error sayısı', errs.length, errs.slice(0, 3));
process.exit(0);
