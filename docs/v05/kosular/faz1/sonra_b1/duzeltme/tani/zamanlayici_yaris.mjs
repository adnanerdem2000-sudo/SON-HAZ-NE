// Kaynak: karşıt denetçinin tanısı (faz1b_b1_denetim/tani/zamanlayici_yaris.mjs), değiştirilmeden kopyalandı (B1 düzeltici, önce/sonra karşılaştırması için).
// Tanı: terrain.js (B1) A-11 paralel yerel şeridini başlatan zamanlayıcı (gencT, GECIKME_ESIK=1000) performance.now()'a göre
// erken tetiklenirse _yerelAktif() false döner ve şerit başlamaz. Sahte işçi hiç hazır olmaz (KY05 gibi).
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const KOK = process.argv[2] || '/home/user/SON-HAZ-NE-b1';
const N = +(process.argv[3] || 8);
const THREE_URL = pathToFileURL(path.join(KOK, 'vendor', 'three', 'three.module.js')).href;
registerHooks({ resolve(spec, ctx, next) { if (spec === 'three') return { url: THREE_URL, shortCircuit: true }; return next(spec, ctx); } });
const THREE = await import('three');
Object.defineProperty(globalThis, 'navigator', { value: { hardwareConcurrency: 4 }, configurable: true, writable: true });
console.warn = () => {}; console.info = () => {};
class Sessiz { constructor() { this.onmessage = null; } postMessage() {} terminate() {} }
globalThis.Worker = Sessiz;
// GECIKME_ESIK (1000 ms) zamanlayıcılarını izle: kurulduğu ve tetiklendiği andaki performance.now()
const asilST = globalThis.setTimeout;
for (let n = 1; n <= N; n++) {
  const kayit = [];
  globalThis.setTimeout = function (fn, ms, ...a) {
    if (ms === 1000) { const k = { kur: performance.now() }; kayit.push(k); return asilST(() => { k.tetik = performance.now(); fn(); }, ms, ...a); }
    return asilST(fn, ms, ...a);
  };
  const { terrain: T } = await import(pathToFileURL(path.join(KOK, 'js', 'world', 'terrain.js')).href + '?n=' + n);
  const ya = T._yerelAktif.bind(T); const cagri = [];
  T._yerelAktif = function () { const r = ya(); cagri.push({ t: performance.now(), r, gecen: Math.min(...this._isciler.map((w) => performance.now() - w.olusturma)) }); return r; };
  // KY05'teki gibi: init'ten önce eşzamanlı iş (ör. modül yükleme ve kurulumun ardından aynı makro görevde)
  const s0 = performance.now(); while (performance.now() - s0 < +(process.argv[4] || 0)); // isteğe bağlı eşzamanlı yük (ms)
  T.init(new THREE.Scene(), 'high');
  const t0 = performance.now();
  const r = await T.prepare(160, 470, { radius: 900 });
  const ms = performance.now() - t0;
  const ilkGenc = kayit.filter((k) => k.tetik).map((k) => +(k.tetik - k.kur).toFixed(2));
  const tetikteYA = cagri.filter((c) => c.gecen > 900 && c.gecen < 1100).map((c) => `${c.r}@${c.gecen.toFixed(2)}`);
  console.log(JSON.stringify({ n, donus: r, prepareMs: Math.round(ms), gencT_kurTetik_ms: ilkGenc, yerelAktif_1snCagrilari: tetikteYA.slice(0, 4) }));
  globalThis.setTimeout = asilST;
  T.ready = false; T._queue.length = 0; T._pump = () => {}; T._localPump = () => {};
  for (const w of T._isciler) { clearTimeout(w.readyTimer); clearTimeout(w.hazirUyariT); }
}
process.exit(0);
