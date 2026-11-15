// Tanı (B1 düzeltici, bulgu B1-D01): A-11'in paralel yerel şeridi zamanlayıcıya bağlı. terrain.js GECIKME_ESIK (1000 ms) süreli iki
// zamanlayıcı kurar: gencT (işçi hâlâ hazır değil) ve sessizT (hazır işçi ilk işine yanıt vermiyor). Zamanlayıcı tetiklenince
// _pump() çağrılır; yerel şeridin başlayıp başlamayacağına _yerelAktif() karar verir.
//
// Platform zamanlayıcısı performance.now()'a göre 1 ms'nin altında erken tetiklenebilir. Node/libuv zamanlayıcıyı döngünün önbellekteki
// ms saatine göre kurar; tarayıcı performance.now()'ı kabalaştırır. Bu tanı erken tetiklenmeyi BELİRLENİMLİ taklit eder: yalnız
// 1000 ms'lik zamanlayıcılar (terrain.js'te yalnız GECIKME_ESIK bu süreyi kullanır) `erken` ms erken kurulur. Böylece denetçinin
// olasılıklı yarışı (tani/zamanlayici_yaris.mjs: 20 koşuda 2–3 kez) her koşuda oluşur.
//
//   node erken_zamanlayici.mjs <kök> <durum: hazirYok|askida> <erken ms> <tekrar>
//
// Sahte işçi: hazirYok → hiç 'ready' göndermez, yanıt vermez (KY05 gibi); askida → 'ready' gönderir, hiçbir işe yanıt vermez (KY06 gibi).
// Çıktı: her tekrar için bir JSON satırı (prepare süresi, dönüş, 1000 ms zamanlayıcılarının kurulma→tetiklenme süresi, tetiklendiği anda
// _yerelAktif() sonucu, ilk yerel dilimin zamanı); sonda ozet satırı.
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const KOK = process.argv[2] || '/home/user/SON-HAZ-NE-b1';
const DURUM = process.argv[3] || 'hazirYok';
const ERKEN = +(process.argv[4] ?? 2);
const N = +(process.argv[5] || 5);
const THREE_URL = pathToFileURL(path.join(KOK, 'vendor', 'three', 'three.module.js')).href;
registerHooks({ resolve(spec, ctx, next) { if (spec === 'three') return { url: THREE_URL, shortCircuit: true }; return next(spec, ctx); } });
const THREE = await import('three');
Object.defineProperty(globalThis, 'navigator', { value: { hardwareConcurrency: 4 }, configurable: true, writable: true });
const asilLog = console.log;
console.warn = () => {}; console.info = () => {}; console.error = () => {};

class SahteIsci {
  constructor() {
    this.onmessage = null; this.onerror = null; this.olu = false;
    if (DURUM === 'askida') setTimeout(() => { if (!this.olu && this.onmessage) this.onmessage({ data: { t: 'ready' } }); }, 3);
  }
  postMessage() { /* hiç yanıt yok */ }
  terminate() { this.olu = true; }
}
globalThis.Worker = SahteIsci;

const asilST = globalThis.setTimeout;
const sonuclar = [];
for (let n = 1; n <= N; n++) {
  const zaman = [];
  let T = null;
  globalThis.setTimeout = function (fn, ms, ...a) {
    if (ms === 1000) {
      const k = { kur: performance.now() };
      zaman.push(k);
      return asilST(() => { k.tetik = performance.now(); try { k.yerelAktif = T && typeof T._yerelAktif === 'function' ? T._yerelAktif() : null; } catch (e) { k.yerelAktif = 'hata'; } fn(); }, ms - ERKEN, ...a);
    }
    return asilST(fn, ms, ...a);
  };
  ({ terrain: T } = await import(pathToFileURL(path.join(KOK, 'js', 'world', 'terrain.js')).href + '?n=' + n + '&d=' + DURUM));
  // ilk yerel dilimin zamanı (yerel şeridin başladığı an)
  let ilkDilim = null;
  const asilDilim = T._localSlice;
  T._localSlice = function () { if (ilkDilim === null) ilkDilim = performance.now(); return asilDilim.apply(this, arguments); };
  T._localStep = null;
  T.init(new THREE.Scene(), 'high');
  const t0 = performance.now();
  const r = await T.prepare(160, 470, { radius: 900 });
  const ms = performance.now() - t0;
  const satir = {
    n, durum: DURUM, erkenMs: ERKEN, donus: r, prepareMs: Math.round(ms),
    ilkYerelDilimMs: ilkDilim === null ? null : Math.round(ilkDilim - t0),
    zamanlayici: zaman.filter((k) => k.tetik).map((k) => ({ kurTetikMs: +(k.tetik - k.kur).toFixed(2), yerelAktif: k.yerelAktif })),
  };
  sonuclar.push(satir);
  asilLog(JSON.stringify(satir));
  globalThis.setTimeout = asilST;
  // temizlik: kuyruğu ve zamanlayıcıları durdur (sonraki tekrar etkilenmesin)
  T.ready = false; T._queue.length = 0; T._pump = () => {}; T._localPump = () => {};
  for (const w of T._isciler || []) { for (const k of ['readyTimer', 'hazirUyariT', 'ilkIsT', 'sessizT', 'gencT']) clearTimeout(w[k]); }
}
const msler = sonuclar.map((s) => s.prepareMs).sort((a, b) => a - b);
asilLog('OZET ' + JSON.stringify({ kok: KOK, durum: DURUM, erkenMs: ERKEN, tekrar: N, prepareMs: msler, enCok: msler[msler.length - 1], ortanca: msler[Math.floor(msler.length / 2)] }));
process.exit(0);
