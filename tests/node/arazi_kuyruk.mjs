// Node testi (Faz 1 Adım B; 62 test listesi 1 "Normal Worker açılışı", 2 "Worker bulunamadığında", 3 "Worker çöktüğünde";
// FAZ1-5/6/7; KI-034, KI-153, KI-156, KI-157, KI-159, KI-160, KI-161, KI-163, KI-165, KI-234; audit A-02, A-05, A-07, A-08, A-09,
// A-11, A-12, A-13, A-15, A-17; doğrulama turu SYS1/SYS3/SYS4/SYS5): js/world/terrain.js iş kuyruğu sahte Web Worker ile sürülür.
//
//   node tests/node/arazi_kuyruk.mjs [--kok <ağaç>] [--rapor <özet.json>] [--sadece KY01,KY05,…]
//
// --kok: modüllerin içe aktarılacağı ağaç (varsayılan: bu dosyanın bulunduğu ağaç, yani /home/user/SON-HAZ-NE-w2).
//        "Önce" ölçümü v0.4'e karşı: --kok /home/user/SON-HAZ-NE.
// Tarayıcı açmaz (kilit gerekmez); gerçek zamanlayıcılarla koşar (~2 dk). Çıktı: her denetim için 'PASS <kimlik> …' ya da
// 'FAIL <kimlik> …', sonda 'SONUC: GECTI|KALDI …'. KALDI → çıkış 1.
//
// Sahte işçi (SahteIsci): gerçek üretimi terrainGen.generate/runAll ile yapar (yanıtlar gerçek karo/derinlik/ızgara verisidir).
// Her durum (sahne) kurucu hatası, yükleme hatası (404), hazır sinyali yok, askı (hazır ama yanıt yok), iş başına çökme, 'error'
// iletisi, gecikme ve terminate sonrası geç ileti davranışlarını ayarlar. Gözlenebilir davranış önceliklidir: sözlerin sonuçlanması,
// süreler, yerel yedeğe devir, ağların ve derinlik penceresinin oluşması, işçilere giden ileti sayıları. Yalnız değişmezlerde ve
// birkaç kurulum adımında v0.4'ün iç adları kullanılır (_enqueue, _jobs, workers[].jobs/w, _requestTile, _drop, _lanes, _land,
// _gridCache, focus); ad bulunamazsa denetim FAIL olur ve nedeni "iç ad yok" diye yazılır (sessizce geçmez).
//
// Değişmezler (her durumda ~10 ms'de bir örneklenir; KYxx-D satırı):
//   (1) hayalet yuva yok: her canlı işçi kaydının jobs anahtarları _jobs içinde (A-09)
//   (2) uçuştaki sayaç doğru: canlı işçi kaydının jobs kümesi, o sahte işçiye gönderilip henüz yanıtlanmamış iletilerin alt
//       kümesi (işçinin işlemediği bir iş için yuva tutulmaz)
//   (3) failures.length ≤ 50 (A-05)
// "Bütün sözler süre sınırı içinde sonuçlanır": her durumda _enqueue ile açılan bütün işlerin sözleri durum sonunda sonuçlanmış olmalı
// (KYxx-S satırı; süre sınırı durum başına yazılı).
// B0 düzeltmesi (inceleme B0-I06): KY08a işçi sayısı/yedek işareti yerine gözlenebilir sonuçla yazıldı (iş alan her sahte işçi
// sonlandırılmış, hiçbir iş MAX_TRIES (3) kezden fazla gönderilmemiş, kurulan işçi ≤ 9, açılış tamam): A-15'in boşta yeniden
// başlattığı canlı işçi doğru bir uygulamada da kalabilir. KY20b yalnız dalgadan ÖNCE canlı olan işçilere bakar (dalga sırasında
// kurulan yeni işçinin iş almaması paralellik kaybı değildir).
// B0 düzeltici (2. deneme; inceleme B0-I08 "katı sınırı Node'da belirlenimci ölçün"): KY25 (yeni) yerel dilim bütçesini makine hızından
// bağımsız ölçer. Yükleme kancası geo.js'in computeHeight'ını ince bir sarmalayıcıyla değiştirir: globalThis.__dkYavaslat > 0 iken çağrı
// başına o kadar ms bekler (yalnız KY25'te açılır; diğer durumlarda davranış ve sonuç aynı). Tarayıcıdaki LY13 (02_arazi_yasam) v0.4'te
// koşudan koşuya kırmızı/yeşil değişiyordu (aynı dilimleme koduyla 1–6 aşım); KY25 v0.4'ün parça boyuna bağlı dilimini (KI-154)
// her koşuda gösterir.
import { registerHooks } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const sec = (ad, varsayilan) => { const i = argv.indexOf('--' + ad); return i >= 0 ? argv[i + 1] : varsayilan; };
const KOK = path.resolve(sec('kok', path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')));
const RAPOR = sec('rapor', null);
const SADECE = sec('sadece', null)?.split(',').map((s) => s.trim()).filter(Boolean) || null;
if (!fs.existsSync(path.join(KOK, 'js', 'world', 'terrain.js'))) { console.error(`--kok geçersiz: ${KOK}/js/world/terrain.js yok`); process.exit(2); }
if (typeof registerHooks !== 'function') { console.error('Bu Node sürümünde module.registerHooks yok (≥ 22.15 gerekli)'); process.exit(2); }
const THREE_URL = pathToFileURL(path.join(KOK, 'vendor', 'three', 'three.module.js')).href;
// Node'un çözücüsü dosya yollarını gerçek yola çevirir (bağlantılı kopya ağaçlarda da eşleşsin)
const GEO_URL = pathToFileURL(fs.realpathSync(path.join(KOK, 'js', 'world', 'geo.js'))).href;
registerHooks({
  resolve(spec, ctx, next) {
    if (spec === 'three') return { url: THREE_URL, shortCircuit: true };
    if (spec.startsWith('three/addons/')) return { url: pathToFileURL(path.join(KOK, 'vendor', 'three', 'addons', spec.slice(13))).href, shortCircuit: true };
    return next(spec, ctx);
  },
  // KY25: geo.js computeHeight'a isteğe bağlı yapay gecikme (globalThis.__dkYavaslat ms; 0/tanımsızken etkisiz). Özgün işlev yeniden
  // adlandırılır, aynı adla dışa aktarılan sarmalayıcı onu çağırır (modül içi çağrılar da sarmalayıcıdan geçer).
  load(url, ctx, next) {
    const r = next(url, ctx);
    if (url !== GEO_URL) return r;
    const kaynak = String(r.source);
    if (!kaynak.includes('export function computeHeight(')) { globalThis.__dkYavaslatYok = 'geo.js: export function computeHeight( bulunamadı'; return r; }
    return { ...r, source: kaynak.replace('export function computeHeight(', 'function __dkAsilComputeHeight(') +
      '\nexport function computeHeight(x, z) { const d = globalThis.__dkYavaslat; if (d > 0) { const t = performance.now() + d; while (performance.now() < t); } return __dkAsilComputeHeight(x, z); }\n' };
  },
});
const modUrl = (p) => pathToFileURL(path.join(KOK, 'js', p)).href;

// ---- çıktı
const sonuclar = [];
const kisa = (v, n = 260) => { let s; try { s = typeof v === 'string' ? v : JSON.stringify(v); } catch (e) { s = String(v); } return s && s.length > n ? s.slice(0, n) + '…' : s; };
function denetim(kimlik, aciklama, ok, deger) {
  sonuclar.push({ kimlik, aciklama, ok: !!ok, deger });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${kimlik} ${aciklama} → ${kisa(deger)}`);
}
const bilgi = (s) => console.log('BILGI ' + s);
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
const yuvarla = (x) => Math.round(x);

// konsol: oyunun uyarı/hata iletileri sayılır ve susturulur (çıktı okunur kalsın); test istisnaları yine görünür
const konsol = { warn: 0, error: 0, son: [] };
const asilLog = console.log;
console.warn = (...a) => { konsol.warn++; konsol.son.push('W ' + a.join(' ').slice(0, 160)); if (konsol.son.length > 20) konsol.son.shift(); };
console.error = (...a) => { konsol.error++; konsol.son.push('E ' + a.join(' ').slice(0, 160)); if (konsol.son.length > 20) konsol.son.shift(); };
let aktifDurum = '-';
process.on('uncaughtException', (e) => { asilLog(`FAIL ${aktifDurum}-X test istisnası → ${e && e.stack || e}`); sonuclar.push({ kimlik: aktifDurum + '-X', ok: false }); bitir(); });
// terrain sözlerinden biri işlenmeden reddedilirse (ör. requestGrid reddini kimse yakalamazsa) süreç çökmesin: say
const islenmemis = [];
process.on('unhandledRejection', (e) => { islenmemis.push({ durum: aktifDurum, hata: String(e && e.message || e).slice(0, 160) }); });

const THREE = await import('three');
const Gen = await import(modUrl('world/terrainGen.js'));
const Geo = await import(modUrl('world/geo.js'));
const { generate, runAll } = Gen;
const TERRAIN_URL = modUrl('world/terrain.js');
// 3 işçi (terrain.js: min(3, hardwareConcurrency − 1))
Object.defineProperty(globalThis, 'navigator', { value: { hardwareConcurrency: 4 }, configurable: true, writable: true });
bilgi(`kök ${KOK}; Node ${process.version}`);

// ---- sahte işçi
let SAHNE = null;
class SahteIsci {
  constructor(url, opts = {}) {
    const S = SAHNE;
    this.S = S; this.url = String(url); this.ad = opts.name; this.tip = opts.type;
    this.no = S.kurulan++;
    this.olu = false;
    this.alinan = [];            // gelen iletiler (yapısal kopya)
    this.bekleyen = new Map();   // id → ileti: işçiye ulaşmış, henüz yanıtlanmamış (yanıt, 'error' ya da çökme ile düşer)
    this.onmessage = null; this.onerror = null; this.onmessageerror = null;
    if (S.kurucuHata && S.kurucuHata(this.no)) { S.kurucuHatasi++; throw new DOMException('Sahte: Worker oluşturulamadı', 'SecurityError'); }
    S.isciler.push(this);
    if (S.yuklemeHatasi) { setTimeout(() => this._hata('sahte yükleme hatası (404)'), 5); return; }
    if (!S.hazirYok) setTimeout(() => this._ilet({ t: 'ready' }), S.hazirGecikme ?? 3);
  }
  _ilet(data) {
    if (this.S.bitti) return;
    if (this.olu && !this.S.terminateSonrasiIlet) return;
    if (this.onmessage) this.onmessage({ data });
  }
  _hata(message) { if (this.S.bitti || this.olu) return; if (this.onerror) this.onerror({ message, preventDefault() {} }); }
  postMessage(m) {
    const S = this.S;
    if (this.olu || S.bitti) return;
    const msg = structuredClone(m);
    this.alinan.push(msg);
    this.bekleyen.set(msg.id, msg);                    // gönderildi, henüz yanıtlanmadı
    if (S.yuklemeHatasi || S.hazirYok) return;         // betik yüklenmedi / işçi hiç çalışmıyor: yanıt gelmez
    const p = S.politika ? S.politika(this, msg) : 'tamam';
    const gecikme = typeof S.gecikme === 'function' ? S.gecikme(this, msg) : (S.gecikme ?? 2);
    if (p === 'askida') return;
    if (p === 'cok') { setTimeout(() => { this.bekleyen.delete(msg.id); this._hata('Uncaught Error: sahte çökme'); }, S.cokmeGecikme ?? 1); return; }
    if (p === 'hata') { setTimeout(() => { if (this.olu) return; this.bekleyen.delete(msg.id); this._ilet({ t: 'error', id: msg.id, msg: 'sahte üretim hatası' }); }, 1); return; }
    if (p === 'cokVeGecIlet') setTimeout(() => this._hata('Uncaught Error: sahte çökme (yanıt yine de gelecek)'), S.cokmeGecikme ?? 1);
    setTimeout(() => {
      if (S.bitti || (this.olu && !S.terminateSonrasiIlet)) return;
      const { out } = runAll(generate(msg));
      this.bekleyen.delete(msg.id);
      this._ilet(out);
    }, gecikme);
  }
  terminate() { this.olu = true; }
}

// ---- durum (sahne) kurulumu
let modSayac = 0;
async function taze(ad, ayar = {}) {
  SAHNE = { ad, isciler: [], kurulan: 0, kurucuHatasi: 0, ...ayar };
  const S = SAHNE;
  if (ayar.isciYok) delete globalThis.Worker; else globalThis.Worker = SahteIsci;
  const { terrain: T } = await import(TERRAIN_URL + '?durum=' + (++modSayac));
  S.T = T;
  S.isler = [];
  S.icAdEksik = [];
  // her işin sözünü izle (_enqueue: v0.4 iç adı)
  const asil = T._enqueue;
  if (typeof asil === 'function') {
    T._enqueue = function (msg, prio) {
      const job = asil.call(this, msg, prio);
      const k = { id: job && job.id, t: msg.t, key: msg.key, seg: msg.seg, x0: msg.x0, z0: msg.z0, res: msg.res, t0: performance.now(), durum: 'bekliyor', sonuc: undefined, hata: null, t1: null, job };
      S.isler.push(k);
      if (job && job.promise) job.promise.then((r) => { k.durum = 'cozuldu'; k.sonuc = r; k.t1 = performance.now(); }, (e) => { k.durum = 'reddedildi'; k.hata = String(e && e.message || e); k.t1 = performance.now(); });
      return job;
    };
  } else S.icAdEksik.push('_enqueue');
  T.init(new THREE.Scene(), 'high');
  // değişmez örnekleyicisi
  S.ihlal = []; S.ihlalSay = 0; S.ornek = 0; S.enFazlaFailures = 0;
  S.ornekleyici = setInterval(() => degismezOrnekle(S), 10);
  return S;
}
function degismezOrnekle(S) {
  const T = S.T;
  S.ornek++;
  const ekle = (s) => { S.ihlalSay++; if (S.ihlal.length < 6) S.ihlal.push(s); };
  if (!(T._jobs instanceof Map) || !Array.isArray(T.workers)) { if (!S.icAdEksik.includes('_jobs/workers')) S.icAdEksik.push('_jobs/workers'); return; }
  for (const r of T.workers) {
    if (!r || !(r.jobs instanceof Map)) continue;
    const f = r.w instanceof SahteIsci ? r.w : null;
    for (const id of r.jobs.keys()) {
      if (!T._jobs.has(id)) ekle(`hayalet yuva: işçi ${r.i ?? '?'} iş ${id}`);
      if (f && !f.olu && !f.bekleyen.has(id)) ekle(`uçuştaki sayaç: işçi ${r.i ?? '?'} iş ${id} için yuva tutuyor ama işçi o işi işlemiyor`);
    }
  }
  const nf = Array.isArray(T.failures) ? T.failures.length : 0;
  if (nf > S.enFazlaFailures) S.enFazlaFailures = nf;
  if (nf > 50 && !S.ihlal.some((s) => s.startsWith('failures'))) ekle(`failures ${nf} > 50`);
}
async function kapat(S, sozSiniriMs, ek = '') {
  degismezOrnekle(S);
  clearInterval(S.ornekleyici);
  const T = S.T;
  // değişmezler
  denetim(`${S.ad}-D`, `değişmezler: hayalet yuva yok, uçuştaki sayaç doğru, failures ≤ 50 ${ek}`.trim(),
    S.ihlalSay === 0 && !S.icAdEksik.includes('_jobs/workers'),
    S.icAdEksik.includes('_jobs/workers') ? 'iç ad yok: _jobs/workers' : { ornek: S.ornek, ihlal: S.ihlalSay, ilk: S.ihlal, enFazlaFailures: S.enFazlaFailures });
  // bütün sözler süre sınırı içinde sonuçlandı
  const simdi = performance.now();
  const acik = S.isler.filter((k) => k.durum === 'bekliyor');
  const enUzun = Math.max(0, ...S.isler.map((k) => (k.t1 ?? simdi) - k.t0));
  denetim(`${S.ad}-S`, `bütün iş sözleri ${yuvarla(sozSiniriMs / 1000)} sn sınırı içinde sonuçlandı`,
    S.icAdEksik.includes('_enqueue') ? false : acik.length === 0 && enUzun <= sozSiniriMs,
    S.icAdEksik.includes('_enqueue') ? 'iç ad yok: _enqueue' : { is: S.isler.length, acik: acik.length, acikOrnek: acik.slice(0, 3).map((k) => `${k.t}#${k.id}`), enUzunMs: yuvarla(enUzun),
      cozuldu: S.isler.filter((k) => k.durum === 'cozuldu').length, reddedildi: S.isler.filter((k) => k.durum === 'reddedildi').length });
  // temizlik (yalnız arka plan işini durdurmak için; denetim değildir): sahte işçiler susar, kuyruk pompası durur
  S.bitti = true;
  try { if (typeof T._pump === 'function') T._pump = () => {}; if (typeof T._localPump === 'function') T._localPump = () => {}; if (Array.isArray(T._queue)) T._queue.length = 0; T.ready = false; } catch (e) { /* önemsiz */ }
}
const isTamam = (S, f) => S.isler.filter(f);
async function kosul(f, sinirMs, aralik = 20) {
  const t0 = performance.now();
  for (;;) {
    let v = false;
    try { v = f(); } catch (e) { v = false; }
    if (v) return performance.now() - t0;
    if (performance.now() - t0 > sinirMs) return null;
    await bekle(aralik);
  }
}
const bosalt = (S, sinirMs = 30000) => kosul(() => S.T.stats().jobs === 0, sinirMs);
const sureOlc = async (p) => { const t0 = performance.now(); const r = await p; return { ms: performance.now() - t0, r }; };
const agYakin = (T, x, z, r) => [...T.tiles.values()].filter((t) => t.mesh && Math.hypot(t.x0 + 80 - x, t.z0 + 80 - z) < r).length;
const derinlikMerkezi = (T) => (T.depthWin ? { x: T.depthWin.x0 + T.depthWin.size / 2, z: T.depthWin.z0 + T.depthWin.size / 2 } : null);
const derinlikYakin = (T, x, z, r = 80) => { const c = derinlikMerkezi(T); return !!c && Math.hypot(c.x - x, c.z - z) < r; };
// sahte işçilerin aldığı karo iletileri (anahtar ve seg süzgeci)
const alinanKaro = (S, key, seg) => S.isciler.reduce((n, w) => n + w.alinan.filter((m) => m.t === 'tile' && m.key === key && (seg === undefined || m.seg === seg)).length, 0);
const kosacak = (ad) => !SADECE || SADECE.includes(ad);

const MENU = { x: 160, z: 470 };              // açılıştaki prepare(160, 470) noktası (game.buildWorld)
const KUZEYFENER = { x: 282, z: -5006 };       // Kuzeyfener Limanı demir yeri (menüden ~5,5 km)
const TUZ = { x: 1900, z: 950 };               // 02_arazi_yedek uzak bölge
const DUNYA = [-10000, -10000, 20000];

// açılış hazırlığı: game.buildWorld'deki prepare + initMapBase'in dünya ızgarası (burada 256²)
async function acilis(S, izgaraRes = 256) {
  const T = S.T;
  const p = await sureOlc(T.prepare(MENU.x, MENU.z, { radius: 900 }));
  let izgara;
  try { const m = await T.requestGrid(...DUNYA, izgaraRes, -500); izgara = m && m.heights && m.heights.length === izgaraRes * izgaraRes ? 'tamam' : 'eksik'; }
  catch (e) { izgara = 'RED: ' + (e && e.message || e); }
  return { prepMs: p.ms, donus: p.r, izgara };
}

let normalPrepMs = null;

// ============ KY01 normal: sağlam işçiler ============
if (kosacak('KY01')) {
  aktifDurum = 'KY01';
  const S = await taze('KY01');
  const T = S.T;
  const a = await acilis(S);
  normalPrepMs = a.prepMs;
  await bosalt(S);
  bilgi(`KY01 ${JSON.stringify({ prepMs: yuvarla(a.prepMs), stats: T.stats() })}`);
  denetim('KY01a', 'normal açılış: prepare(160,470,r900) ≤ 10 sn içinde sonuçlanır', a.prepMs <= 10000, { ms: yuvarla(a.prepMs) });
  denetim('KY01b', 'normal açılış: ≥ 100 karo ağı, derinlik penceresi açılış noktasında, dünya ızgarası (256²) geldi', T.stats().meshes >= 100 && derinlikYakin(T, MENU.x, MENU.z) && a.izgara === 'tamam', { meshes: T.stats().meshes, depth: derinlikMerkezi(T), izgara: a.izgara });
  denetim('KY01c', 'normal açılış: 3 işçi canlı, yedek kip kapalı, failures boş', T.workers.length === 3 && T.fallback === false && T.failures.length === 0, { workers: T.workers.length, fallback: T.fallback, failures: T.failures.length });
  denetim('KY01d', "prepare dönüş değeri 'ok' (A-11: sonuç çağırana iletilir)", a.donus === 'ok', { donus: a.donus === undefined ? 'undefined' : a.donus });
  await kapat(S, 15000);
}
const NORMAL = normalPrepMs ?? 1000;
const NORMAL5 = NORMAL + 5000;

// ============ KY02 kurucu hatası (her Worker kurucusu fırlatır) ============
if (kosacak('KY02')) {
  aktifDurum = 'KY02';
  const S = await taze('KY02', { kurucuHata: () => true });
  const T = S.T;
  const a = await acilis(S);
  await bosalt(S);
  denetim('KY02a', 'kurucu hatası: işçi yok, yedek kip açık, hata kaydı var', T.workers.length === 0 && T.fallback === true && T.failures.length >= 1, { workers: T.workers.length, fallback: T.fallback, failures: T.failures.slice(0, 2) });
  denetim('KY02b', `kurucu hatası: açılış hazırlığı ≤ normal + 5 sn (${yuvarla(NORMAL5)} ms)`, a.prepMs <= NORMAL5, { ms: yuvarla(a.prepMs) });
  denetim('KY02c', 'kurucu hatası: ≥ 100 karo ağı, derinlik penceresi, dünya ızgarası (yerel yedekte)', T.stats().meshes >= 100 && derinlikYakin(T, MENU.x, MENU.z) && a.izgara === 'tamam', { meshes: T.stats().meshes, izgara: a.izgara });
  await kapat(S, 15000);
}

// ============ KY03 kısmi kurucu hatası (2. işçinin kurucusu fırlatır) ============
if (kosacak('KY03')) {
  aktifDurum = 'KY03';
  const S = await taze('KY03', { kurucuHata: (no) => no === 1 });
  const T = S.T;
  const a = await acilis(S);
  await bosalt(S);
  denetim('KY03a', 'kısmi kurucu hatası (A-15): kurulabilen işçi çalışır, yedek kip işareti KAPALI (fallback=false, ≥ 1 işçi)', T.fallback === false && T.workers.length >= 1, { workers: T.workers.length, fallback: T.fallback, failures: T.failures.slice(0, 2) });
  denetim('KY03b', 'kısmi kurucu hatası: açılış tamamlanır (≥ 100 ağ, derinlik, ızgara)', T.stats().meshes >= 100 && derinlikYakin(T, MENU.x, MENU.z) && a.izgara === 'tamam', { meshes: T.stats().meshes, izgara: a.izgara, ms: yuvarla(a.prepMs) });
  await kapat(S, 15000);
}

// ============ KY04 yükleme hatası (404: onerror) ============
if (kosacak('KY04')) {
  aktifDurum = 'KY04';
  const S = await taze('KY04', { yuklemeHatasi: true });
  const T = S.T;
  const a = await acilis(S);
  await bosalt(S);
  denetim('KY04a', 'yükleme hatası (404): işçiler devre dışı, yedek kip açık, hata kaydı var', T.workers.length === 0 && T.fallback === true && T.failures.length >= 1, { workers: T.workers.length, fallback: T.fallback, failures: T.failures.length });
  denetim('KY04b', `yükleme hatası: açılış hazırlığı ≤ normal + 5 sn (${yuvarla(NORMAL5)} ms)`, a.prepMs <= NORMAL5, { ms: yuvarla(a.prepMs) });
  denetim('KY04c', 'yükleme hatası: ≥ 100 karo ağı, derinlik, dünya ızgarası', T.stats().meshes >= 100 && derinlikYakin(T, MENU.x, MENU.z) && a.izgara === 'tamam', { meshes: T.stats().meshes, izgara: a.izgara });
  await kapat(S, 15000);
}

// ============ KY05 hazır sinyali yok ============
if (kosacak('KY05')) {
  aktifDurum = 'KY05';
  const S = await taze('KY05', { hazirYok: true });
  const T = S.T;
  const a = await acilis(S);
  await bosalt(S, 30000);
  denetim('KY05a', `hazır sinyali yok (A-11): açılış hazırlığı ≤ normal + 5 sn (${yuvarla(NORMAL5)} ms)`, a.prepMs <= NORMAL5, { ms: yuvarla(a.prepMs) });
  denetim('KY05b', 'hazır sinyali yok: açılış tamamlanır (≥ 100 ağ, derinlik, ızgara) ve hata kaydı var', T.stats().meshes >= 100 && derinlikYakin(T, MENU.x, MENU.z) && a.izgara === 'tamam' && T.failures.length >= 1, { meshes: T.stats().meshes, izgara: a.izgara, failures: T.failures.slice(0, 1) });
  await kapat(S, 45000);
}

// ============ KY06 askı (hazır, ama hiç yanıt yok) ============
if (kosacak('KY06')) {
  aktifDurum = 'KY06';
  const S = await taze('KY06', { politika: () => 'askida' });
  const T = S.T;
  const a = await acilis(S);
  await bosalt(S, 30000);
  denetim('KY06a', `askıdaki işçi (A-11): açılış hazırlığı ≤ normal + 5 sn (${yuvarla(NORMAL5)} ms)`, a.prepMs <= NORMAL5, { ms: yuvarla(a.prepMs) });
  denetim('KY06b', 'askıdaki işçi: açılış tamamlanır (≥ 100 ağ, derinlik, ızgara) ve hata kaydı var', T.stats().meshes >= 100 && derinlikYakin(T, MENU.x, MENU.z) && a.izgara === 'tamam' && T.failures.length >= 1, { meshes: T.stats().meshes, izgara: a.izgara, failures: T.failures.slice(0, 1) });
  await kapat(S, 65000);
}

// ============ KY07 iş ortasında tek işçi çökmesi (işçi 0 ikinci iletisinde bir kez çöker) ============
if (kosacak('KY07')) {
  aktifDurum = 'KY07';
  let coktu = false;
  const S = await taze('KY07', { politika: (w) => (w.no === 0 && w.alinan.length >= 2 && !coktu ? (coktu = true, 'cok') : 'tamam'), gecikme: 3 });
  const T = S.T;
  const a = await acilis(S);
  await bosalt(S);
  const hemen = { workers: T.workers.length, fallback: T.fallback };
  denetim('KY07a', 'tek işçi çökmesi: işler kaybolmaz, açılış tamamlanır (≥ 100 ağ, derinlik, ızgara)', coktu && T.stats().meshes >= 100 && derinlikYakin(T, MENU.x, MENU.z) && a.izgara === 'tamam', { coktu, meshes: T.stats().meshes, izgara: a.izgara, ms: yuvarla(a.prepMs) });
  denetim('KY07b', 'tek işçi çökmesi: kalan işçiler çalışır, yedek kip açılmaz', hemen.workers >= 2 && hemen.fallback === false, hemen);
  // A-15: ölen işçi sınırlı sayıda, gecikmeli yeniden başlatılır → 30 sn içinde işçi sayısı geri gelir
  const geri = await kosul(() => T.workers.length >= 3, 30000, 250);
  denetim('KY07c', 'tek işçi çökmesi (A-15): ölen işçi 30 sn içinde yeniden başlatılır (işçi sayısı 3\'e döner)', geri !== null, { ms: geri === null ? null : yuvarla(geri), workers: T.workers.length, kurulan: S.kurulan });
  await kapat(S, 15000);
}

// ============ KY08 bütün işçiler her işte çöker (?terrain=crash eşdeğeri) + uzak bölge (KI-234) ============
let noworkerUzakMs = null;
if (kosacak('KY08')) {
  aktifDurum = 'KY08';
  // karşılaştırma tabanı: işçisiz (noworker) kipte aynı uzak bölge hazırlığı
  {
    const N = await taze('KY08n', { isciYok: true });
    await acilis(N);
    await bosalt(N);
    const u = await sureOlc(N.T.prepare(TUZ.x, TUZ.z, { radius: 300 }));
    noworkerUzakMs = u.ms;
    clearInterval(N.ornekleyici); N.bitti = true; N.T.ready = false;
    bilgi(`KY08 karşılaştırma: işçisiz kipte uzak prepare(1900,950,r300) ${yuvarla(u.ms)} ms`);
  }
  const S = await taze('KY08', { politika: () => 'cok', gecikme: 3 });
  const T = S.T;
  const a = await acilis(S);
  await bosalt(S);
  {
    // gözlenebilir sonuç: iş alan her sahte işçi sonlandırılmış (terrain çöken işçiyi bırakmış), iş kimliği başına gönderim ≤ MAX_TRIES (3)
    const isAlan = S.isciler.filter((w) => w.alinan.length > 0);
    const gonderim = new Map(); for (const w of S.isciler) for (const m of w.alinan) gonderim.set(m.id, (gonderim.get(m.id) || 0) + 1);
    const enCokGonderim = Math.max(0, ...gonderim.values());
    denetim('KY08a', 'bütün işçiler her işte çöker: iş alan her işçi sonlandırılmış, hiçbir iş 3 (MAX_TRIES) kezden fazla gönderilmemiş, kurulan işçi ≤ 9, hata kaydı var, açılış tamamlanır (≥ 100 ağ, derinlik, ızgara)',
      isAlan.length >= 1 && isAlan.every((w) => w.olu) && enCokGonderim <= 3 && S.kurulan <= 9 && T.failures.length >= 1 && T.stats().meshes >= 100 && derinlikYakin(T, MENU.x, MENU.z) && a.izgara === 'tamam',
      { isAlan: isAlan.length, isAlanCanli: isAlan.filter((w) => !w.olu).length, enCokGonderim, kurulan: S.kurulan, workers: T.workers.length, fallback: T.fallback, failures: T.failures.length, meshes: T.stats().meshes, izgara: a.izgara, ms: yuvarla(a.prepMs) });
  }
  const u = await sureOlc(T.prepare(TUZ.x, TUZ.z, { radius: 300 }));
  await bosalt(S);
  denetim('KY08b', 'bütün işçiler çöktükten sonra uzak bölge prepare(1900,950,r300) ≤ 3 sn (KI-234; işçisiz kipe yakın)', u.ms <= 3000 && agYakin(T, TUZ.x, TUZ.z, 400) >= 6, { ms: yuvarla(u.ms), isciSizMs: noworkerUzakMs && yuvarla(noworkerUzakMs), ag: agYakin(T, TUZ.x, TUZ.z, 400) });
  await kapat(S, 20000);
}

// ============ KY09 MAX_TRIES → yerel devir (ızgara işini alan her işçi ölür) ============
if (kosacak('KY09')) {
  aktifDurum = 'KY09';
  const S = await taze('KY09', { politika: (w, m) => (m.t === 'grid' ? 'cok' : 'tamam'), gecikme: 2 });
  const T = S.T;
  await T.prepare(MENU.x, MENU.z, { radius: 900 });
  let izgara;
  const t0 = performance.now();
  try { const m = await T.requestGrid(...DUNYA, 512, -500); izgara = m && m.heights && m.heights.length === 512 * 512 ? 'tamam' : 'eksik'; }
  catch (e) { izgara = 'RED: ' + (e && e.message || e); }
  const ms = performance.now() - t0;
  await bosalt(S);
  denetim('KY09a', 'MAX_TRIES (A-05): ızgara işini alan her işçi öldüğünde iş yerel yedekte üretilir (söz reddedilmez)', izgara === 'tamam', { izgara, ms: yuvarla(ms), workers: T.workers.length, fallback: T.fallback, gridDenemesi: S.isciler.reduce((n, w) => n + w.alinan.filter((m) => m.t === 'grid').length, 0) });
  denetim('KY09b', 'MAX_TRIES sonrası karo işleri sürer (≥ 100 ağ)', T.stats().meshes >= 100, { meshes: T.stats().meshes });
  await kapat(S, 20000);
}

// ============ KY10 işçinin {t:'error'} iletisi (ızgara üretim hatası) ============
if (kosacak('KY10')) {
  aktifDurum = 'KY10';
  const S = await taze('KY10', { politika: (w, m) => (m.t === 'grid' ? 'hata' : 'tamam'), gecikme: 2 });
  const T = S.T;
  await T.prepare(MENU.x, MENU.z, { radius: 900 });
  const t0 = performance.now();
  let izgara;
  try { const m = await Promise.race([T.requestGrid(...DUNYA, 128, -500), bekle(10000).then(() => 'ASILI')]); izgara = m === 'ASILI' ? 'asılı' : m && m.heights ? 'tamam' : 'eksik'; }
  catch (e) { izgara = 'RED: ' + (e && e.message || e); }
  const ms = performance.now() - t0;
  await bosalt(S);
  denetim('KY10a', "işçinin 'error' iletisi: ızgara sözü ≤ 2 sn içinde sonuçlanır (asılı kalmaz)", izgara !== 'asılı' && ms <= 2000, { izgara, ms: yuvarla(ms) });
  denetim('KY10b', "işçinin 'error' iletisi işçiyi öldürmez: 3 işçi canlı, yedek kip kapalı, karo işleri sürer", T.workers.length === 3 && T.fallback === false && T.stats().meshes >= 100, { workers: T.workers.length, fallback: T.fallback, meshes: T.stats().meshes });
  await kapat(S, 20000);
}

// ============ KY11 kalıcı karo hatası: geri çekilme ve failures sınırı (A-05) ============
if (kosacak('KY11')) {
  aktifDurum = 'KY11';
  // Kırlangıç Limanı karosu (kara, hires) her istekte 'error' döner
  const K = Math.floor((10 + 10000) / 160) * 1024 + Math.floor((222 + 10000) / 160);
  const S = await taze('KY11', { politika: (w, m) => (m.t === 'tile' && m.key === K ? 'hata' : 'tamam'), gecikme: 2 });
  const T = S.T;
  T.update(10, 222, true);
  await bosalt(S, 15000);
  const once = alinanKaro(S, K);
  const err0 = konsol.error;
  // oyun döngüsü benzetimi: 3 sn boyunca 50 ms'de bir zorlamalı güncelleme (oyun 12 karede bir günceller)
  const t0 = performance.now();
  while (performance.now() - t0 < 3000) { T.update(10, 222, true); await bekle(50); }
  const sonra = alinanKaro(S, K);
  const istek = sonra - once;
  denetim('KY11a', 'kalıcı hatalı karo (A-05): 3 sn içinde aynı karo en çok 3 kez yeniden istenir (üstel geri çekilme)', istek <= 3, { ilkIstek: once, sonraki3snIstek: istek, konsolHatasi3sn: konsol.error - err0 });
  denetim('KY11b', 'kalıcı hatalı karo (A-05): failures.length ≤ 50', T.failures.length <= 50, { failures: T.failures.length });
  denetim('KY11c', 'kalıcı hatalı karo: diğer karolar tamamlanır (≥ 100 ağ)', T.stats().meshes >= 100, { meshes: T.stats().meshes });
  await kapat(S, 20000);
}

// ============ KY12 iptal: yerel şeritteki iş (A-08) ============
// Not: Node'da MessageChannel zinciri (terrain.js schedule) setTimeout'u aç bırakır; dilimler arası an, setTimeout ile
// yoklanamaz. Bu yüzden _localSlice (v0.4 iç adı) sarılır: bir dilim, şerit 0'da yarım kalmış bir karo işiyle bitince karo
// o anda düşürülür (oyun döngüsünde dilimler arasında kamera uzaklaşmış gibi).
if (kosacak('KY12')) {
  aktifDurum = 'KY12';
  const S = await taze('KY12', { isciYok: true });
  const T = S.T;
  T.update(MENU.x, MENU.z, true);
  await bosalt(S);
  const asilDilim = T._localSlice;
  if (typeof asilDilim !== 'function' || !Array.isArray(T._lanes) || typeof T._drop !== 'function') {
    denetim('KY12a', 'şeritteki iş (A-08): _drop sonrası iş sonuna kadar üretilmez', false, 'iç ad yok: _localSlice/_lanes/_drop');
  } else {
    let hedef = null, kayit = null, dilimSonra = 0, tetik = false;
    T._localSlice = function () {
      if (tetik && kayit && kayit.durum === 'bekliyor') dilimSonra++;
      const r = asilDilim.apply(this, arguments);
      if (!tetik) {
        const a = this._lanes[0];
        if (a && a.job && a.job.msg && a.job.msg.t === 'tile' && this._jobs.has(a.job.id)) {
          const t = this.tiles.get(a.job.msg.key);
          if (t) { tetik = true; hedef = a.job; kayit = S.isler.find((k) => k.id === hedef.id) || null; this._drop(t); }
        }
      }
      return r;
    };
    T.update(1900, 950, true);              // yeni bölge: çok sayıda karo işi
    await kosul(() => tetik && kayit && kayit.durum !== 'bekliyor', 20000);
    const sonucVar = !!(kayit && kayit.sonuc && kayit.sonuc.pos);
    denetim('KY12a', 'şeritteki iş (A-08): _drop sonrası iş sonuna kadar üretilmez, söz ilk dilimde sonuçsuz sonlanır',
      tetik && !!kayit && kayit.durum !== 'bekliyor' && !sonucVar && dilimSonra <= 1,
      !tetik ? 'şeritte yarım kalmış karo işi yakalanamadı' : { seg: hedef.msg.seg, sonucUretildi: sonucVar, durum: kayit && kayit.durum, sonlanmaDilim: dilimSonra });
    T._localSlice = asilDilim;
  }
  await bosalt(S);
  await kapat(S, 20000);
}

// ============ KY13 iptal: işçideki iş (A-08) ============
if (kosacak('KY13')) {
  aktifDurum = 'KY13';
  let K = null;
  const S = await taze('KY13', { gecikme: (w, m) => (m.t === 'tile' && m.key === K ? 400 : 2) });
  const T = S.T;
  T.update(MENU.x, MENU.z, true);
  await bosalt(S);
  // bir karonun yeni LOD isteği işçide 400 ms sürer; o sırada karo düşürülür
  const t = [...T.tiles.values()].find((x) => x.mesh && x.seg === 80);
  K = t.k;
  let job = null;
  if (typeof T._requestTile === 'function') { T._requestTile(t, 32, 0); job = t.job; }
  await bekle(20);
  const kayit = job && S.isler.find((k) => k.id === job.id);
  const isciTutuyor = !!job && T.workers.some((r) => r.jobs instanceof Map && r.jobs.has(job.id));
  const t0 = performance.now();
  if (typeof T._drop === 'function') T._drop(t);
  await kosul(() => kayit && kayit.durum !== 'bekliyor', 2000, 0);
  const ms = kayit && kayit.t1 ? kayit.t1 - t0 : null;
  const sonucVar = !!(kayit && kayit.sonuc && kayit.sonuc.pos);
  denetim('KY13a', 'işçideki iş (A-08): karo düşürülünce iş sözü ≤ 50 ms içinde sonuçsuz sonlanır (işçinin geç sonucu kullanılmaz)',
    !!job && isciTutuyor && ms !== null && ms <= 50 && !sonucVar, !job ? 'iç ad yok: _requestTile' : { isciTutuyor, sonlanmaMs: ms === null ? null : yuvarla(ms), sonucUretildi: sonucVar });
  await bosalt(S);
  await kapat(S, 20000);
}

// ============ KY14 requestDepth: yeni zorunlu istek eskisini iptal eder (A-08) + KY15 _depthSeq ============
if (kosacak('KY14')) {
  aktifDurum = 'KY14';
  // (işçi kipi) eski derinlik işi işçide 300 ms sürer
  const A = { x: 160, z: 470 }, B = { x: 1900, z: 950 };
  {
    const S = await taze('KY14', { gecikme: (w, m) => (m.t === 'depth' ? (Math.abs(m.x0 + 1200 - A.x) < 60 ? 300 : 10) : 2) });
    const T = S.T;
    let sonOnDepth = null;
    T.onDepth = (m) => { sonOnDepth = { x: m.x0 + m.size / 2, z: m.z0 + m.size / 2 }; };
    const pA = T.requestDepth(A.x, A.z, true);
    await bekle(20);
    const kA = S.isler.filter((k) => k.t === 'depth').pop();
    const t0 = performance.now();
    const pB = T.requestDepth(B.x, B.z, true);
    await Promise.all([pA, pB]);
    await kosul(() => kA && kA.durum !== 'bekliyor', 2000, 0);
    const ms = kA && kA.t1 ? kA.t1 - t0 : null;
    const sonucVar = !!(kA && kA.sonuc && kA.sonuc.data);
    denetim('KY14a', 'requestDepth (A-08, işçi kipi): yeni zorunlu istek eski derinlik işini iptal eder (eski iş ≤ 50 ms içinde sonuçsuz sonlanır)', !!kA && ms !== null && ms <= 50 && !sonucVar, { sonlanmaMs: ms === null ? null : yuvarla(ms), eskiSonucUretildi: sonucVar });
    denetim('KY15', '_depthSeq: yavaş gelen eski derinlik yanıtı yeni pencereyi ezmez (depthWin ve son onDepth yeni bölgede)', derinlikYakin(T, B.x, B.z) && !!sonOnDepth && Math.hypot(sonOnDepth.x - B.x, sonOnDepth.z - B.z) < 80, { depthWin: derinlikMerkezi(T), sonOnDepth });
    await bosalt(S);
    await kapat(S, 10000, '(işçi kipi)');
  }
  // (yerel şerit) eski derinlik işi şeritte yarım kalmışken yeni zorunlu istek gelir (dilimler arasında: _localSlice sarılır,
  // bkz. KY12 notu)
  {
    const S = await taze('KY14y', { isciYok: true });
    const T = S.T;
    const asilDilim = T._localSlice;
    if (typeof asilDilim !== 'function' || !Array.isArray(T._lanes)) {
      denetim('KY14b', 'requestDepth (A-08, yerel şerit): eski derinlik işi sonuna kadar hesaplanmaz', false, 'iç ad yok: _localSlice/_lanes');
    } else {
      let kA = null, pB = null;
      T._localSlice = function () {
        const r = asilDilim.apply(this, arguments);
        const a = this._lanes[1];
        if (!pB && kA && a && a.job && a.job.id === kA.id) pB = this.requestDepth(B.x, B.z, true);
        return r;
      };
      const pA = T.requestDepth(A.x, A.z, true);
      kA = S.isler.filter((k) => k.t === 'depth').pop();
      await kosul(() => !!pB, 20000);
      await Promise.all([pA, pB || Promise.resolve()]);
      await kosul(() => kA && kA.durum !== 'bekliyor', 5000);
      const sonucVar = !!(kA && kA.sonuc && kA.sonuc.data);
      denetim('KY14b', 'requestDepth (A-08, yerel şerit): eski derinlik işi şeritte yarımken yeni zorunlu istek gelince sonuna kadar hesaplanmaz (sonuçsuz sonlanır)',
        !!pB && !!kA && kA.durum !== 'bekliyor' && !sonucVar && derinlikYakin(T, B.x, B.z), !pB ? 'eski derinlik işi şeritte yakalanamadı' : { eskiSonucUretildi: sonucVar, durum: kA && kA.durum, depthWin: derinlikMerkezi(T) });
      T._localSlice = asilDilim;
    }
    await bosalt(S);
    await kapat(S, 10000, '(yerel şerit)');
  }
}

// ============ KY16 odak bastırması + KY17 prepare odak koruması ============
if (kosacak('KY16')) {
  aktifDurum = 'KY16';
  const S = await taze('KY16', { gecikme: 2 });
  const T = S.T;
  T.update(MENU.x, MENU.z, true);            // kamera menü noktasında
  await bosalt(S);
  const r = await T.prepare(KUZEYFENER.x, KUZEYFENER.z, { radius: 450 });
  void r;
  const derinlikOnce = S.isler.filter((k) => k.t === 'depth').length;
  // kamera hâlâ uzakta: kameranın zorunsuz derinlik isteği odak etkinken bastırılır
  await T.requestDepth(MENU.x, MENU.z);
  const derinlikSonra = S.isler.filter((k) => k.t === 'depth').length;
  denetim('KY16', 'odak bastırması: prepare odağı etkinken uzak kameranın derinlik isteği yeni iş açmaz, pencere odakta kalır', derinlikSonra === derinlikOnce && derinlikYakin(T, KUZEYFENER.x, KUZEYFENER.z), { yeniDerinlikIsi: derinlikSonra - derinlikOnce, depthWin: derinlikMerkezi(T) });
  // kamera uzaktayken (≈ 5,5 km) odak bölgesinin karoları korunur ve odakta yüksek çözünürlük istenir
  for (let i = 0; i < 3; i++) { T.update(MENU.x, MENU.z, true); await bekle(30); }
  await bosalt(S);
  const odakAg = agYakin(T, KUZEYFENER.x, KUZEYFENER.z, 450);
  const odakHires = [...T.tiles.values()].filter((t) => t.mesh && t.seg === 80 && Math.hypot(t.x0 + 80 - KUZEYFENER.x, t.z0 + 80 - KUZEYFENER.z) < 450).length;
  denetim('KY17', 'prepare odak koruması: kamera ~5,5 km uzakta güncellenirken odak bölgesinde ≥ 6 karo ağı korunur, ≥ 1 karo seg 80', odakAg >= 6 && odakHires >= 1, { odakAg, odakHires });
  await kapat(S, 15000);
}

// ============ KY18 örtüşen iki prepare (A-12) ============
if (kosacak('KY18')) {
  aktifDurum = 'KY18';
  let yavas = 0;
  const ayar = { aktif: false };
  const yakinF = (m) => m.t === 'tile' && Math.hypot(m.x0 + 80 - KUZEYFENER.x, m.z0 + 80 - KUZEYFENER.z) < 600;
  // B bölgesinin ilk üç karo işi işçide 13 sn sürer (A bittikten 12 sn sonra B hâlâ bekliyor olsun)
  const S = await taze('KY18', { gecikme: (w, m) => (ayar.aktif && yakinF(m) && yavas < 3 ? (yavas++, 13000) : 2) });
  const T = S.T;
  T.update(MENU.x, MENU.z, true);
  await bosalt(S);
  ayar.aktif = true;
  // oyun döngüsü benzetimi: kamera menü noktasında, her karede zorunsuz güncelleme (terrain kendi 12 karelik aralığını uygular)
  const dongu = setInterval(() => T.update(MENU.x, MENU.z), 16);
  const t0 = performance.now();
  const pA = T.prepare(MENU.x, MENU.z, { radius: 300 });
  const pB = T.prepare(KUZEYFENER.x, KUZEYFENER.z, { radius: 450 });
  await pA;
  const aMs = performance.now() - t0;
  await pB;
  const bMs = performance.now() - t0;
  const odakAg = agYakin(T, KUZEYFENER.x, KUZEYFENER.z, 450);
  clearInterval(dongu);
  denetim('KY18', 'örtüşen prepare (A-12): önce biten A, B\'nin odağını kısaltmaz; B bitince B bölgesinde ≥ 6 karo ağı ve derinlik penceresi B\'de',
    odakAg >= 6 && derinlikYakin(T, KUZEYFENER.x, KUZEYFENER.z) && yavas >= 1, { aMs: yuvarla(aMs), bMs: yuvarla(bMs), odakAg, yavasIs: yavas, depthWin: derinlikMerkezi(T) });
  await bosalt(S, 20000);
  await kapat(S, 25000);
}

// ============ KY19 prepare zaman aşımı dalı ============
if (kosacak('KY19')) {
  aktifDurum = 'KY19';
  const S = await taze('KY19', { politika: () => 'askida' });
  const T = S.T;
  const { ms, r } = await sureOlc(T.prepare(MENU.x, MENU.z, { radius: 300, timeout: 400 }));
  denetim('KY19a', 'prepare zaman aşımı dalı: askıdaki işçide 400 ms sınırıyla ≤ 1,5 sn içinde sonuçlanır (asılı kalmaz)', ms <= 1500, { ms: yuvarla(ms) });
  denetim('KY19b', "prepare zaman aşımı dalı (A-11): dönüş değeri 'timeout' (çağırana bildirilir)", r === 'timeout', { donus: r === undefined ? 'undefined' : r });
  clearInterval(S.ornekleyici); S.bitti = true;
  try { T._pump = () => {}; T._localPump = () => {}; T._queue.length = 0; T.ready = false; } catch (e) { /* önemsiz */ }
}

// ============ KY20 terminate edilmiş işçinin geç iletisi (A-09) ============
if (kosacak('KY20')) {
  aktifDurum = 'KY20';
  // işçi 0 iki ızgara işini alır, 2 ms'de çöker ama yanıtlarını 10 ms'de yine teslim eder (terminate sonrası geç ileti);
  // işler işçi 1'e gider ve işçi 1 100 ms'de yanıtlar
  const S = await taze('KY20', {
    terminateSonrasiIlet: true, cokmeGecikme: 2,
    politika: (w, m) => (m.t === 'grid' && m.res === 16 && w.no === 0 ? 'cokVeGecIlet' : 'tamam'),
    gecikme: (w, m) => (m.t === 'grid' && m.res === 16 ? (w.no === 0 ? 10 : 100) : 2),
  });
  const T = S.T;
  T.update(MENU.x, MENU.z, true);
  await bosalt(S);
  const g1 = T.requestGrid(0, 0, 1000, 16, -500).catch((e) => 'RED ' + e.message);
  const g2 = T.requestGrid(1000, 0, 1000, 16, -500).catch((e) => 'RED ' + e.message);
  await Promise.all([g1, g2]);
  await bekle(250);
  await bosalt(S);
  const hayalet = T.workers.reduce((n, r) => n + [...r.jobs.keys()].filter((id) => !T._jobs.has(id)).length, 0);
  denetim('KY20a', 'terminate sonrası geç ileti (A-09): işler bitince hayalet iş yuvası kalmaz', hayalet === 0, { hayalet, isciYuvalari: T.workers.map((r) => [r.i, r.jobs.size]) });
  // gözlenebilir sonuç: yeni iş geldiğinde, dalgadan ÖNCE canlı olan ve dalga boyunca canlı kalan her işçi iş alır (yuvası hayaletle
  // dolu işçi bir daha iş almıyordu). Dalga sırasında kurulan (yeniden başlatılan) işçiler sayılmaz.
  const once = S.isciler.map((w) => w.alinan.length);
  const canliOnce = T.workers.map((r) => r.w).filter((w) => w instanceof SahteIsci && !w.olu);
  T.update(-1500, -900, true);
  await bosalt(S);
  const canli = canliOnce.filter((w) => !w.olu);
  const yeniIleti = canli.map((w) => [w.no, w.alinan.length - (once[w.no] ?? 0)]);
  denetim('KY20b', 'terminate sonrası geç ileti (A-09): sonraki iş dalgasında, dalgadan önce canlı olan her işçi ≥ 1 iş alır (paralellik düşmez)', canli.length >= 2 && yeniIleti.every(([, n]) => n >= 1), { yeniIleti, dalgadaOlen: canliOnce.length - canli.length, dalgadaKurulan: S.isciler.length - once.length });
  await kapat(S, 10000);
}

// ============ KY21 _workerFailed karo artık istenmiyorsa işi yeniden kuyruğa almaz (A-08) ============
if (kosacak('KY21')) {
  aktifDurum = 'KY21';
  let K = null;
  const S = await taze('KY21', {
    politika: (w, m) => (m.t === 'tile' && m.key === K && m.seg === 32 ? 'cok' : 'tamam'),
    cokmeGecikme: 80, gecikme: 2,
  });
  const T = S.T;
  T.update(MENU.x, MENU.z, true);
  await bosalt(S);
  const t = [...T.tiles.values()].find((x) => x.mesh && x.seg === 80);
  K = t.k;
  if (typeof T._requestTile === 'function' && typeof T._drop === 'function') {
    T._requestTile(t, 32, 0);                 // iş bir işçiye gider; işçi 80 ms sonra çökecek
    await bekle(10);
    T._drop(t);                               // karo artık istenmiyor
    await bekle(300);                         // çökme → _workerFailed
    await bosalt(S);
    const gonderim = alinanKaro(S, K, 32);
    denetim('KY21', '_workerFailed (A-08): düşürülmüş karonun işi çöken işçiden sonra yeniden üretilmez (başka işçiye gönderilmez)', gonderim === 1, { seg32Gonderim: gonderim, workers: T.workers.length });
  } else denetim('KY21', '_workerFailed (A-08): düşürülmüş karonun işi yeniden üretilmez', false, 'iç ad yok: _requestTile/_drop');
  await kapat(S, 10000);
}

// ============ KY22 LOD histerezisi (A-07) ============
if (kosacak('KY22')) {
  aktifDurum = 'KY22';
  const S = await taze('KY22', { gecikme: 2 });
  const T = S.T;
  // Kırlangıç Limanı'ndaki kara karosu; merkez karonun batısında, karo merkezine uzaklık d+80 (d: _wantSeg uzaklığı)
  const ki = Math.floor((10 + 10000) / 160), kj = Math.floor((222 + 10000) / 160), K = ki * 1024 + kj;
  const kx = -10000 + (ki + 0.5) * 160, kz = -10000 + (kj + 0.5) * 160;
  const sinir = 380 * T.lodScale;
  const merkez = (d) => ({ x: kx - (d + 80), z: kz });
  const ic = merkez(sinir - 20), dis = merkez(sinir + 20);
  T.update(ic.x, ic.z, true);
  await bosalt(S);
  const t = T.tiles.get(K);
  const seg0 = t && t.seg;
  const istekOnce = isTamam(S, (k) => k.t === 'tile' && k.key === K).length;
  for (let i = 0; i < 3; i++) {
    T.update(dis.x, dis.z, true); await bosalt(S);
    T.update(ic.x, ic.z, true); await bosalt(S);
  }
  const istek = isTamam(S, (k) => k.t === 'tile' && k.key === K).length - istekOnce;
  denetim('KY22', 'LOD histerezisi (A-07): 380 m LOD sınırında ±20 m salınımda (3 tur) karo yeniden üretilmez', seg0 === 80 && istek === 0, { baslangicSeg: seg0, salinimdakiIstek: istek, sonSeg: T.tiles.get(K)?.seg });
  await kapat(S, 10000);
}

// ============ KY23 derin deniz karoları (A-07) ============
if (kosacak('KY23')) {
  aktifDurum = 'KY23';
  const S = await taze('KY23', { gecikme: 1 });
  const T = S.T;
  const derinMi = (t) => (typeof T._land === 'function' ? !T._land(t.i, t.j) : t.maxH < -1);
  let enCok = 0, enCokNokta = null, adim = 0;
  for (let x = 0; x <= 8000; x += 200) {
    T.update(x, -6200, true);
    await bosalt(S, 10000);
    const n = [...T.tiles.values()].filter((t) => t.mesh && derinMi(t) && Math.hypot(t.x0 + 80 - x, t.z0 + 80 + 6200) > 600).length;
    if (n > enCok) { enCok = n; enCokNokta = x; }
    adim++;
  }
  denetim('KY23', 'derin deniz karoları (A-07): 8 km açık deniz dolaşımında 600 m ötesindeki derin karo sayısı ≤ 10', enCok <= 10, { enCok, enCokNokta_x: enCokNokta, adim, ic: typeof T._land === 'function' ? '_land' : 'maxH<-1', toplamKaro: T.stats().tiles });
  await kapat(S, 15000);
}

// ============ KY24 ızgara önbelleği (A-13) ============
if (kosacak('KY24')) {
  aktifDurum = 'KY24';
  const S = await taze('KY24', { gecikme: 1 });
  const T = S.T;
  const ayni1 = T.requestGrid(0, 0, 500, 32, 200), ayni2 = T.requestGrid(0, 0, 500, 32, 200);
  denetim('KY24a', 'ızgara önbelleği: bekleyen aynı istek tek sözde birleşir', ayni1 === ayni2, { ayniSoz: ayni1 === ayni2 });
  const sozler = [ayni1];
  for (let i = 1; i < 26; i++) sozler.push(T.requestGrid(i * 500, 0, 500, 32, 200));
  await Promise.all(sozler.map((p) => p.catch(() => null)));
  await bosalt(S);
  const boyut = T._gridCache instanceof Map ? T._gridCache.size : null;
  denetim('KY24b', 'ızgara önbelleği (A-13): 26 farklı ızgara çözüldükten sonra önbellekte çözülmüş kayıt ≤ 2', boyut !== null && boyut <= 2, boyut === null ? 'iç ad yok: _gridCache' : { onbellek: boyut });
  await kapat(S, 10000);
}

// ============ KY25 A-06 / KI-154: yerel dilim bütçesi makine hızından bağımsız (B0 düzeltici 2. deneme; inceleme B0-I08) ============
// İşçisiz kipte açılıştan sonra yükseklik işlevi çağrı başına 5 µs yavaşlatılır (yavaş bir makineyi taklit eder; belirlenimci) ve uzak
// bir bölge (Kuzeyfener, r300: karolar + 512² derinlik ızgarası) yerel yedekte hazırlanır. Dilim süresini parça boyu belirliyorsa (v0.4:
// derinlikte 32 satır × 512 örnek ≈ 16 384 çağrı ≈ 82 ms) dilimler bütçeyi aşar; zaman tabanlı yield (A-06: bütçe + ≤ 4 ms) dilimi süreyle
// keser (bu gecikmede süre en geç ~800 çağrıda bir, ör. satır başına, denetlenmeli). Ölçüt LY13 ile aynı: p99 (⌊(n−1)·0,99⌋. sıra)
// ≤ bütçe + 4 ms ve en uzun ≤ bütçe + 15 ms. Bütçe: uygulama açık bir alan verirse (terrain.dilimButcesi sayı/işlev) ondan, yoksa
// v0.4 kuralından (terrain.js:162). İç ad: _localSlice (yoksa "iç ad yok" ile KALIR).
if (kosacak('KY25')) {
  aktifDurum = 'KY25';
  const YAVAS_MS = 0.005;
  const S = await taze('KY25', { isciYok: true });
  const T = S.T;
  const a = await acilis(S);
  await bosalt(S, 60000);
  const o = T._localSlice;
  const AC = 'yerel yedek, yükseklik işlevi çağrı başına 5 µs yavaşlatılmışken: dilimlerin p99\'u ≤ bütçe + 4 ms ve en uzunu ≤ bütçe + 15 ms (A-06, KI-154: dilimi parça boyu değil süre keser; makine hızından bağımsız)';
  if (globalThis.__dkYavaslatYok) denetim('KY25', AC, false, 'iç ad yok: ' + globalThis.__dkYavaslatYok);
  else if (typeof o !== 'function') denetim('KY25', AC, false, 'iç ad yok: _localSlice');
  else {
    const D = { dilim: 0, fark: [], ornek: [], butce: null, butceKaynagi: null };
    T._localSlice = function () { const q = Array.isArray(this._queue) ? this._queue.length : 0; const acik = this.dilimButcesi; const but = typeof acik === 'function' ? acik.call(this) : typeof acik === 'number' ? acik : (q > 30 ? Math.max(this.localBudget, 20) : this.localBudget); D.butceKaynagi = acik === undefined ? 'v0.4 kuralı (terrain.js:162)' : 'terrain.dilimButcesi'; D.butce = but;
      const s = performance.now(); try { return o.apply(this, arguments); } finally { const d = performance.now() - s; D.dilim++; D.fark.push(d - but); if (d > but + 4 && D.ornek.length < 6) D.ornek.push([+d.toFixed(1), but]); } };
    let p = null;
    try { globalThis.__dkYavaslat = YAVAS_MS; p = await sureOlc(T.prepare(KUZEYFENER.x, KUZEYFENER.z, { radius: 300 })); await bosalt(S, 120000); }
    finally { globalThis.__dkYavaslat = 0; T._localSlice = o; }
    const f = D.fark.slice().sort((x, y) => x - y); const p99 = f.length ? f[Math.floor((f.length - 1) * 0.99)] : null; const en = f.length ? f[f.length - 1] : null;
    denetim('KY25', AC, f.length >= 5 && p99 <= 4 && en <= 15, { dilim: D.dilim, p99Fark: p99 === null ? null : +p99.toFixed(1), enUzunFark: en === null ? null : +en.toFixed(1), asim: f.filter((x) => x > 4).length, ornek: D.ornek, butce: D.butce, butceKaynagi: D.butceKaynagi, prepMs: p ? yuvarla(p.ms) : null, donus: p ? p.r : null, acilisMs: yuvarla(a.prepMs), workers: T.workers.length, fallback: T.fallback });
  }
  await kapat(S, 180000);
}

function bitir() {
  const gecen = sonuclar.filter((s) => s.ok).length, kalan = sonuclar.length - gecen;
  const durum = kalan === 0 && sonuclar.length > 0 ? 'GECTI' : 'KALDI';
  const cikis = durum === 'GECTI' ? 0 : 1;
  if (islenmemis.length) asilLog(`BILGI işlenmemiş söz reddi ${islenmemis.length}: ${kisa(islenmemis.slice(0, 4))}`);
  asilLog(`BILGI oyun konsolu: uyarı ${konsol.warn}, hata ${konsol.error}`);
  if (RAPOR) {
    try { fs.mkdirSync(path.dirname(path.resolve(RAPOR)), { recursive: true }); fs.writeFileSync(RAPOR, JSON.stringify({ test: 'arazi_kuyruk', kok: KOK, node: process.version, durum, cikis, gecen, kalan, denetimler: sonuclar, islenmemisSozReddi: islenmemis, konsol: { uyari: konsol.warn, hata: konsol.error } }, null, 1)); }
    catch (e) { asilLog('RAPOR YAZILAMADI ' + e.message); }
  }
  asilLog(`SONUC: ${durum} (çıkış ${cikis}) denetim ${gecen}/${sonuclar.length}${kalan ? ' | kalan: ' + sonuclar.filter((s) => !s.ok).map((s) => s.kimlik).join(', ') : ''} | kök ${KOK}`);
  process.exit(cikis);
}
bitir();
