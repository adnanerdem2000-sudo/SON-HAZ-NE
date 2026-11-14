// Tek sayfalı senaryo koşucusu (Playwright + başsız Chromium, yazılımsal WebGL).
//
//   node tests/harness/run.cjs tests/scenarios/<senaryo>.js [--url http://localhost:8080/index.html]
//        [--size 960x540] [--timeout 600] [--report rapor.json] [--trace]
//        [--uretim] [--izin-hata '<düzenli ifade> # <gerekçe>']… [--degisken ad=deger]… [--baslatma <betik.js>]…
//        [--goruntu kalan|hep|yok] [--goruntu-dizin <dizin>] [--hedef-tip moduler|tek-test|tek-uretim|site|canli]
//
// Senaryo dosyası, bir adım dizisi döndüren JS ifadesidir (eval ile okunur). Dizinin ilk öğesi {meta: {...}} olabilir; adım
// sayılmaz (Faz 9 tasarımı §6.3-6). Meta alanları: testler, dosyalar, olcum (true → durum OLCUM, asla GECTI), izinliHatalar
// ([{desen, gerekce, tur?: 'konsol'|'ag'|'hepsi'}]), baslatma (dizge ya da dizi: sayfa betiklerinden önce çalışan js).
// Adım alanları (bir adımda birden çok alan varsa bu sırayla işlenir):
//   wait   : ms bekle
//   rotaKok: {kok: 'https://oyun.ornek', dizin: '.'}  sahte kökeni yerel dizinden sunar (context.route; işçi betikleri dahil)
//   goto   : 'adres' | {url, testParam = true, hazir = true, zaman}  gezinir (göreli adres geçerli sayfaya göre); test=1 ekler;
//            beforeunload onay penceresini kabul eder ve rapora yazar; hazir → window.__ready beklenir
//   bekleSecici: 'css' | {secici, durum = 'visible', zaman = 30000}  (waitForSelector)
//   tikla  : 'css' | {secici} | {metin, tam?, ilk?}  görünürlük ve isabet denetimli tıklama (locator.click)
//   js     : sayfada çalıştır (sonuç R: satırıyla yazılır)
//   degisken: {ad, js} | {ad, deger}  koşu değişkeni: window.__KOSUCU[ad] olarak sayfaya (ve sonraki gezinmelere) konur
//   expect : { js, eq|truthy|gte|lte, label }  → başarısızsa rapor "fail" sayar
//   key    : klavye basışı (Playwright kodu)        down/up: tuşu basılı tut / bırak
//   metrics: etiket → CDP page.metrics (JS yığını MB, DOM düğümü, dinleyici) 'M:' satırıyla yazılır
//   click  : [x, y] fare tıklaması                  view   : [dosya, from[xyz], to[xyz]] (DK.snapFrom)
//   snap   : 3B tuval yakalama dosyası (DK.snap)     snapjs : [dosya, jsIfadesi]  (ifade dataURL döndürmeli)
//   shot   : sayfa ekran görüntüsü dosyası
//   agSay  : {desen, enCok?, enAz?, sonGezinmeden?, label}  koşucunun ağ günlüğünden istek sayar (onay gibi davranır)
//   metrikKarsilastir: {once: 'm1', sonra: 'm2', alan: 'listeners', enCokFark?, enAzFark?, label}  iki metrics kaydını karşılaştırır
//
// Test kipi (§5.6): --uretim verilmezse adrese test=1 eklenir ve __ready'den sonra window.DK aranır; yoksa KOSUCU_HATASI.
// --uretim verilirse test eklenmez ve koşucu 'U00 Üretimde test kancası yok' kontrolünü kendiliğinden ekler.
// Başlatma betikleri (addInitScript) şu sırayla kurulur: --degisken değerleri, meta.baslatma, --baslatma dosyaları.
//
// Çıkış kodu (§6.3-4): 0 yalnız durum GECTI ya da OLCUM ise. 1: başarısız kontrol/adım, sayfa hatası (pageerror), izinsiz konsol
// hatası, izinsiz ağ hatası (≥ 400 yanıt, requestfailed), adım istisnası, onaysız senaryo (meta.olcum yoksa), koşucu hatası,
// zaman aşımı. 2: kullanım hatası. Rapor: eski alanlar (scenario … ms) + dk-test-raporu/2 alanları (§6.2).
//
// Sayfadaki DK yardımcıları: DK.sim(sn, dt) oyunu çizmeden ileri sarar; DK.press/DK.tap tuş simüle eder;
// DK.G.noAutoPause=true odak kaybında duraklatmayı kapatır. Kontrol türü (tarayici / tarayici+benzetim) DK.__sayac farkıyla
// son gezinmeden bu yana ölçülür; oyunda __sayac yoksa (v0.3/v0.4) koşucu sim/press/tap'i sayan sarmalayıcı kurar.
//
// A1 inceleme düzeltmeleri (Faz 1):
//   - Tür ölçümü (A1-03, A1-11): test kipinde sayfa betiklerinden önce bir başlatma betiği kurulur (her belgede; sayfanın kendi
//     yeniden yüklemesinde de). requestAnimationFrame geri çağrıları işaretlenir; oyun window.__ready'yi yazdığı anda (DK kurulmuş)
//     DK.sim/press/tap/frames/simSteps ve DK.game.update sarılır. DK.game.update'in rAF döngüsü ve DK.sim dışından (test kodundan)
//     gelen çağrıları benzetim sayılır (benzetim.update). Doğrudan alt sistem çağrıları (DK.enemies.update, DK.treasure.update …)
//     ölçülmez: oyun bunları döngü dışında da çağırır (ör. terrain.prepare → terrain.update), sarmak yanlış "benzetim" verirdi.
//     Not: koşucu window.__ready'yi erişimci (get/set) olarak tanımlar; değeri ve 'typeof' davranışı aynıdır.
//   - Onay adımı denetimi (A1-04): expect/agSay/metrikKarsilastir iç alanları okunurken denetlenir (bilinmeyen alan, karşılaştırıcı
//     ya da sınır yoksa KOSUCU_HATASI); expect'te verilen bütün karşılaştırıcılar uygulanır; gte/lte yalnız sonlu sayıyla geçer.
//   - Kanıt adımları (A1-06): snap/view/snapjs sayfa istisnası ya da data: adresi olmayan dönüş adım hatasıdır (evalErrors);
//     dosya yazımı, shot ve metrics (CDP) sorunları kanitUyarilari'na yazılır, sayılmaz. Sayfa çökmesi pageErrors'a yazılır.
//   - Yerleşme (A1-08): son adımdan sonra --yerlesme ms (varsayılan 1000) beklenir; bu sürede gelen hatalar da sayılır.
//   - Kapanış (A1-01): rapor döngü/BigInt güvenli yazılır; yazılamazsa yedek iskelet rapor denenir ve çıkış 1 olur; tarayıcı
//     kapanışı ve process.exit her durumda çalışır (asılı kalma yok); yakalanmamış istisna KOSUCU_HATASI raporuyla biter.
//   - İzin listesi (A1-09, A1-10): gerekçe zorunlu; her şeyle eşleşen desen reddedilir; komut satırı izinleri tarayıcı açılmadan
//     derlenir, hata kullanım hatasıdır (çıkış 2).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const O = require('./ortak.cjs');

const argv = process.argv.slice(2);
let ayr;
try {
  ayr = O.secenekler(argv, { deger: ['url', 'size', 'timeout', 'report', 'goruntu', 'goruntu-dizin', 'hedef-tip', 'yerlesme'], cok: ['izin-hata', 'degisken', 'baslatma'], bayrak: ['uretim', 'trace'] });
} catch (e) { console.error(e.message); process.exit(2); }
const secim = ayr.o;
const scenarioPath = secim._[0];
const KULLANIM = 'Kullanım: node tests/harness/run.cjs <senaryo.js> [--url ...] [--size WxH] [--report r.json] [--uretim] [--izin-hata "desen # gerekçe"] [--degisken ad=deger] [--baslatma betik.js] [--goruntu kalan|hep|yok] [--yerlesme ms]';
if (!scenarioPath || ayr.bilinmeyen.length) { console.error((ayr.bilinmeyen.length ? 'Bilinmeyen seçenek: ' + ayr.bilinmeyen.join(' ') + '\n' : '') + KULLANIM); process.exit(2); }
// (A1-10) komut satırı izinleri tarayıcı açılmadan derlenir: bozuk düzenli ifade ya da gerekçesiz izin kullanım hatasıdır
let cliIzinleri;
try { cliIzinleri = O.izinleriDerle([], secim['izin-hata'] || []); } catch (e) { console.error(e.message + '\n' + KULLANIM); process.exit(2); }
const yerlesmeMs = secim.yerlesme === undefined ? 1000 : Number(secim.yerlesme);
if (!Number.isFinite(yerlesmeMs) || yerlesmeMs < 0) { console.error('--yerlesme negatif olmayan bir sayı (ms) olmalı\n' + KULLANIM); process.exit(2); }
// (A1-01) Yakalanmamış istisna ya da söz reddi: koşu KOSUCU_HATASI raporuyla 1 ile biter (asılı kalmaz, sessizce çökmez).
// finish() kurulmadan önce (tarayıcı açılırken) olursa asgari rapor yazılır.
let acilKapanis = null;
const yakalanmamis = (tur) => (e) => {
  const ileti = `yakalanmamış ${tur}: ` + O.temiz((e && e.message) || e).split('\n')[0].slice(0, 300);
  console.log('KOSUCU: ' + ileti + ((e && e.stack) ? ' | ' + O.temiz(e.stack).split('\n').slice(1, 3).join(' | ').slice(0, 300) : ''));
  if (acilKapanis) { acilKapanis(ileti); return; }
  if (secim.report) {
    try { fs.mkdirSync(path.dirname(secim.report), { recursive: true }); fs.writeFileSync(secim.report, JSON.stringify({ sema: O.SEMA, scenario: scenarioPath, url: secim.url || null, harnessError: ileti, sonuc: { durum: 'KOSUCU_HATASI', cikisKodu: 1, neden: [ileti], yedekRapor: true } }, null, 1)); } catch (e2) { /* yazılamadı */ }
  }
  process.exit(1);
};
process.on('unhandledRejection', yakalanmamis('söz reddi'));
process.on('uncaughtException', yakalanmamis('istisna'));
const url = secim.url || 'http://localhost:8080/index.html';
const [W, H] = (secim.size || '960x540').split('x').map(Number);
const timeoutS = Number(secim.timeout || '600');
const reportPath = secim.report || null;
const uretim = !!secim.uretim;
const goruntuKipi = secim.goruntu || 'kalan';
if (!['kalan', 'hep', 'yok'].includes(goruntuKipi)) { console.error('--goruntu kalan|hep|yok olmalı\n' + KULLANIM); process.exit(2); }
let kosuDegiskenleri;
try { kosuDegiskenleri = O.degiskenler(secim.degisken); } catch (e) { console.error(e.message); process.exit(2); }
const hedefUrl = uretim ? url : O.testUrl(url);

(async () => {
  const t0 = Date.now();
  const report = { scenario: scenarioPath, url, size: [W, H], steps: [], errors: [], pageErrors: [], fails: 0, evalErrors: 0, readyMs: null };
  const kontroller = [];
  const diyaloglar = [];
  const adimHatalari = [];
  const goruntuler = [];
  const metrikler = {};
  const agGunlugu = [];
  const kayit = new O.HataKaydi(null);
  const kanitUyarilari = [];
  let meta = {};
  let izinler = cliIzinleri;
  let onaySayisi = null;   // senaryodaki onay adımı sayısı (expect, agSay, metrikKarsilastir); senaryo okunamazsa null
  let gezinmeNo = 0;
  let gotoSuruyor = false;
  let aktifAdim = 0;
  let bitti = false;
  let bitisSozu = null;
  let yerlesmeSure = null;
  let ilkGoruntu = null;
  const goruntuDir = O.goruntuDizini(__dirname, scenarioPath, secim['goruntu-dizin']);
  // DK_JSFLAGS ortam değişkeni (örn. --expose-gc) V8'e iletilir: bellek teşhisi için
  const extra = process.env.DK_JSFLAGS ? ['--js-flags=' + process.env.DK_JSFLAGS] : [];
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog', '--autoplay-policy=no-user-gesture-required', '--enable-precise-memory-info', ...extra] }); // kesin performance.memory (başsızda nicemlenmiş değer döner)
  const ortam = await O.ortamBilgisi(b, { kosucuDizin: __dirname, gorunum: [W, H], chromium });
  const tekrar = O.tekrarBilgisi({ kosucuDosya: __filename, argv, senaryoArg: scenarioPath, url: hedefUrl, coop: false, ortam });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  p.on('console', (m) => {
    const t = m.text();
    if (m.type() === 'error') { kayit.konsolIletisi(m); if (report.errors.length < 5000) report.errors.push(t.slice(0, 600)); console.log('ERR:', t.slice(0, 400)); }
    else {
      if (m.type() === 'warning') kayit.konsolIletisi(m);
      if (/NOTIFY|LOG|\[test\]/.test(t)) console.log(t.slice(0, 300));
    }
  });
  p.on('pageerror', (e) => { const s = e.message + ' | ' + (e.stack || '').split('\n').slice(0, 4).join(' | '); report.pageErrors.push(s.slice(0, 800)); console.log('PAGEERR:', s.slice(0, 500)); });
  // (A1-06) sayfa (renderer) çökmesi: coop.cjs gibi pageErrors'a yazılır → KALDI
  p.on('crash', () => { report.pageErrors.push('SAYFA ÇÖKTÜ (renderer crash)'); console.log('PAGECRASH'); });
  p.on('requestfailed', (r) => {
    const sonuc = kayit.istekBasarisiz(r);
    if (!/favicon/.test(r.url())) { if (report.errors.length < 5000) report.errors.push('NET ' + r.url() + ' ' + (r.failure()?.errorText || '')); console.log('NETFAIL:', r.url() + (sonuc === 'iptal' ? ' (gezinme iptali; hata sayılmaz)' : '')); }
  });
  p.on('response', (r) => { if (kayit.yanit(r)) console.log('HTTP', r.status(), r.url().slice(0, 300)); });
  p.on('request', (r) => { if (agGunlugu.length < 50000) agGunlugu.push({ url: r.url(), yontem: r.method(), kaynakTuru: r.resourceType(), gezinme: gezinmeNo }); });
  // Dinleyici varken Playwright pencereleri kendiliğinden kapatmaz: eskisi gibi hepsi kapatılır, yalnız goto sırasındaki beforeunload kabul edilir.
  p.on('dialog', async (d) => {
    const k = { tur: d.type(), ileti: d.message().slice(0, 300), adim: aktifAdim, kabul: false };
    try { if (d.type() === 'beforeunload' && gotoSuruyor) { await d.accept(); k.kabul = true; } else await d.dismiss(); } catch (e) { k.hata = e.message.slice(0, 200); }
    diyaloglar.push(k);
    console.log('DIALOG', k.tur, k.kabul ? 'kabul edildi' : 'kapatıldı', k.ileti.slice(0, 100));
  });

  // ---- tür ölçümü (§6.1): DK.__sayac son gezinmeden bu yana değiştiyse kontrol 'tarayici+benzetim'
  // SAYAC_KUR(D): DK'nin benzetim işlevlerini sarar (her işlev bir kez; sonradan eklenenler sonraki çağrıda). Oyunun kendi
  // __sayac'ı yoksa (v0.3, v0.4, Y3 öncesi w2) koşucu sim/press/tap/frames/simSteps çağrılarını sayar; varsa (Y3) yalnız iç içe
  // çağrı derinliği izlenir. DK.game.update yalnız rAF sarmalayıcısı kuruluysa (başlatma betiği) sarılır: rAF döngüsünden ve
  // DK.sim içinden gelen çağrılar sayılmaz, öteki (test kodundan doğrudan) çağrılar __kosucuDurum.update'i artırır (A1-03).
  const SAYAC_KUR = `function (D) {
    if (!D || typeof D !== 'object') return;
    let durum = window.__kosucuDurum;
    if (!durum) { durum = { raf: 0, ic: 0, update: 0, rafSarili: false }; Object.defineProperty(window, '__kosucuDurum', { value: durum, configurable: true }); }
    if (!D.__sayac) {
      Object.defineProperty(D, '__sayac', { value: { sim: 0, adim: 0, press: 0, tap: 0, frames: 0, simSteps: 0 }, configurable: true, writable: true, enumerable: false });
      Object.defineProperty(D, '__sayacKaynak', { value: 'kosucu', configurable: true, enumerable: false });
    }
    const c = D.__sayac;
    const kosucuSayar = D.__sayacKaynak === 'kosucu';
    const sar = (nesne, ad, say, dongu) => {
      const o = nesne[ad];
      if (typeof o !== 'function' || o.__kosucuSarili) return;
      const f = function () {
        if (dongu && durum.raf === 0 && durum.ic === 0) durum.update++;
        durum.ic++;
        let r;
        try { r = o.apply(this, arguments); } finally { durum.ic--; }
        if (say && kosucuSayar) say(r);
        return r;
      };
      Object.defineProperty(f, '__kosucuSarili', { value: true });
      nesne[ad] = f;
    };
    sar(D, 'sim', (r) => { c.sim++; if (typeof r === 'number' && isFinite(r)) c.adim += r; });
    sar(D, 'press', () => { c.press++; });
    sar(D, 'tap', () => { c.tap++; });
    sar(D, 'frames', () => { c.frames = (c.frames || 0) + 1; });
    sar(D, 'simSteps', () => { c.simSteps = (c.simSteps || 0) + 1; });
    if (durum.rafSarili && D.game && typeof D.game === 'object') sar(D.game, 'update', null, true);
  }`;
  // Başlatma betiği (yalnız test kipinde; --uretim'de window'a hiçbir şey eklenmez): rAF geri çağrılarını işaretler ve oyun
  // window.__ready'yi yazdığı anda (DK kurulmuş: main.js:134-153; Y3 §5.7-2 "__ready install'dan sonra") SAYAC_KUR'u çağırır.
  // Böylece sayfa kendini yeniden yüklese de sayım yeni belgede baştan kurulur (A1-11).
  const SAYAC_BASLATMA = `(() => {
    if (window.__kosucuDurum) return;
    const durum = { raf: 0, ic: 0, update: 0, rafSarili: false };
    Object.defineProperty(window, '__kosucuDurum', { value: durum, configurable: true });
    const ham = window.requestAnimationFrame;
    if (typeof ham === 'function') {
      window.requestAnimationFrame = function requestAnimationFrame(cb) {
        if (typeof cb !== 'function') return ham.call(window, cb);
        return ham.call(window, function (t) { durum.raf++; try { return cb(t); } finally { durum.raf--; } });
      };
      durum.rafSarili = true;
    }
    const kur = ${SAYAC_KUR};
    Object.defineProperty(window, '__kosucuSar', { value: kur, configurable: true });
    let hazir;
    Object.defineProperty(window, '__ready', { configurable: true, enumerable: true, get() { return hazir; },
      set(v) { hazir = v; try { if (v && window.DK) kur(window.DK); } catch (e) { /* sayım kurulamadı; kontrol anında yeniden denenir */ } } });
  })();`;
  const SAYAC_JS = `(() => {
    const D = window.DK;
    if (!D || typeof D !== 'object') return null;
    (window.__kosucuSar || ${SAYAC_KUR})(D);
    if (!window.__kosucuBelge) Object.defineProperty(window, '__kosucuBelge', { value: Math.random().toString(36).slice(2), configurable: true });
    const s = {};
    for (const [k, v] of Object.entries(D.__sayac)) if (typeof v === 'number') s[k] = v;
    if (window.__kosucuDurum && window.__kosucuDurum.rafSarili) s.update = window.__kosucuDurum.update;
    return { belge: window.__kosucuBelge, kaynak: D.__sayacKaynak === 'kosucu' ? 'kosucu' : 'oyun', sayac: s };
  })()`;
  let sayacTaban = null;
  const sayacOku = async () => { try { return await p.evaluate(SAYAC_JS); } catch (e) { return undefined; } };
  const tabanla = async () => { const s = await sayacOku(); sayacTaban = s || null; };
  const turOlc = async () => {
    const s = await sayacOku();
    if (s === null) return { tur: 'tarayici', benzetim: null };            // DK yok (üretim): DK.sim ile ileri sarılamaz
    if (s === undefined) return { tur: null, benzetim: null, turNot: 'ölçülemedi (sayfa yanıt vermedi)' };
    if (!sayacTaban || sayacTaban.belge !== s.belge) sayacTaban = { belge: s.belge, kaynak: s.kaynak, sayac: {} };   // sayfanın kendi gezinmesi
    const fark = {};
    for (const [k, v] of Object.entries(s.sayac)) fark[k] = v - (sayacTaban.sayac[k] || 0);
    return { tur: Object.values(fark).some((v) => v > 0) ? 'tarayici+benzetim' : 'tarayici', benzetim: fark, sayacKaynak: s.kaynak };
  };

  // ---- ekran görüntüsü (§6.1): ilk başarısızlıkta sayfa + varsa DK.snap() tuvali; --goruntu hep → senaryo sonunda son.png
  const goruntuAl = async (ad) => {
    const out = { sayfa: null, tuval: null };
    try { fs.mkdirSync(goruntuDir, { recursive: true }); const f = path.join(goruntuDir, ad + '.png'); await p.screenshot({ path: f, timeout: 60000 }); out.sayfa = f; } catch (e) { out.sayfaHata = e.message.slice(0, 200); }
    try {
      const d = await p.evaluate('window.DK && typeof window.DK.snap === "function" ? window.DK.snap() : null');
      if (typeof d === 'string' && d.startsWith('data:')) { const f = path.join(goruntuDir, ad + '_tuval.jpg'); fs.writeFileSync(f, Buffer.from(d.split(',')[1], 'base64')); out.tuval = f; }
    } catch (e) { out.tuvalHata = e.message.slice(0, 200); }
    goruntuler.push({ ad, ...out });
    if (out.sayfa) console.log('GORUNTU', out.sayfa);
    return out;
  };
  const ilkBasarisizlik = async (n, js) => {
    if (!tekrar.adim) tekrar.adim = { n, js: js !== undefined && js !== null ? String(js).slice(0, 400) : null };
    if (goruntuKipi === 'yok' || ilkGoruntu || p.isClosed()) return null;
    ilkGoruntu = await goruntuAl('ilk_kalan');
    return ilkGoruntu;
  };
  const kontrolEkle = async ({ n, etiket, ok, deger, beklenen, hata, sureMs, js }) => {
    const t = await turOlc();
    const k = { n, id: O.kimlik(etiket), etiket: etiket || null, ok, deger, beklenen, sure_ms: sureMs, benzetim: t.benzetim, tur: t.tur, hata: ok ? null : (hata || null), goruntu: null };
    if (t.turNot) k.turNot = t.turNot;
    kontroller.push(k);
    if (!ok) k.goruntu = await ilkBasarisizlik(n, js);
    return k;
  };
  const adimHatasi = async (rec, tur, e, js, ek) => {
    rec.error = O.temiz(e.message).slice(0, 600); report.evalErrors++; report.fails++;
    adimHatalari.push({ n: rec.n, tur, hata: rec.error, ...(ek || {}) });
    console.log('EVALERR', e.message.slice(0, 500));
    const g = await ilkBasarisizlik(rec.n, js);
    if (g) rec.goruntu = g;
  };
  // (A1-06) sayılmayan kanıt sorunu (dosya yazımı, sayfa ekran görüntüsü, CDP metrikleri): adım kaydında ve kanitUyarilari'nda iz kalır
  const kanitUyarisi = (rec, tur, e) => {
    const k = { n: rec.n, tur, hata: O.temiz((e && e.message) || e).split('\n')[0].slice(0, 300) };
    (rec.kanitUyarisi = rec.kanitUyarisi || []).push(k);
    kanitUyarilari.push(k);
    console.log('KANIT UYARISI', tur, k.hata.slice(0, 200));
  };
  const kanitAdimi = async (rec, tur, js, dosya) => {
    let d;
    try { d = await p.evaluate(js); }
    catch (e) { console.log('SNAPFAIL', O.temiz(e.message).slice(0, 200)); await adimHatasi(rec, tur, e, js, { kanit: true }); return; }
    if (typeof d !== 'string' || !/^data:[^,]*,/.test(d)) {
      console.log('SNAPFAIL', tur, 'data: adresi dönmedi');
      await adimHatasi(rec, tur, new Error(`${tur}: ifade data: adresi döndürmedi (gelen ${O.kisa(d, 80)})`), js, { kanit: true });
      return;
    }
    try { fs.mkdirSync(path.dirname(dosya), { recursive: true }); fs.writeFileSync(dosya, Buffer.from(d.slice(d.indexOf(',') + 1), 'base64')); }
    catch (e) { console.log('SNAPFAIL', tur, 'dosya yazılamadı'); kanitUyarisi(rec, tur, e); }
  };

  const killer = setTimeout(() => { console.log('TIMEOUT'); report.timeout = true; finish(); }, timeoutS * 1000);
  // (A1-01) Kapanış her durumda tamamlanır: raporlama istisna atsa da (ör. yazılamayan --report yolu) tarayıcı kapatılır ve
  // süreç çıkar. Önceden finish() içindeki istisna dış catch'e düşüyor, ikinci finish() 'bitti' yüzünden hemen dönüyor, süreç
  // asılı kalıyor ve tarayıcı kilidi tutuluyordu. Bekçi: kapanış 120 sn içinde bitmezse süreç 1 ile zorla çıkar.
  const finish = () => {
    if (bitti) return bitisSozu;
    bitti = true;
    clearTimeout(killer);
    bitisSozu = (async () => {
      let cikis = 1;
      const bekci = setTimeout(() => { console.log('KOSUCU: kapanış 120 sn içinde bitmedi; zorla çıkılıyor (çıkış 1)'); process.exit(1); }, 120000);
      try { cikis = await raporla(); }
      catch (e) {
        cikis = 1;
        const ileti = 'kapanışta koşucu istisnası: ' + O.temiz((e && e.message) || e).split('\n')[0].slice(0, 300);
        console.log('KOSUCU HATASI ' + ileti);
        yedekRapor(ileti);
        console.log(`SONUC: KOSUCU_HATASI (çıkış 1) | neden: ${ileti}`);
      } finally {
        try { await Promise.race([b.close(), new Promise((r) => setTimeout(r, 20000))]); } catch (e) { /* kapalı */ }
        clearTimeout(bekci);
        process.exit(cikis);
      }
    })();
    return bitisSozu;
  };
  // Tam rapor yazılamazsa (dizin yok, salt okunur, ya da beklenmedik bir değer) şema-2 iskeleti denenir; çıkış 1.
  const yedekRapor = (ileti) => {
    if (!reportPath) return;
    try {
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
      fs.writeFileSync(reportPath, JSON.stringify({ sema: O.SEMA, scenario: scenarioPath, url, size: [W, H], harnessError: report.harnessError || ileti, ms: Date.now() - t0,
        sonuc: { durum: 'KOSUCU_HATASI', cikisKodu: 1, neden: [ileti], yedekRapor: true } }, null, 1));
      console.log('YEDEK RAPOR yazıldı: ' + reportPath);
    } catch (e) { console.log('YEDEK RAPOR da yazılamadı: ' + O.temiz(e.message).slice(0, 200)); }
  };
  const raporla = async () => {
    const hatalar = O.siniflandir([kayit], izinler);
    const izinsizKonsol = hatalar.sayim.konsol, izinsizAg = hatalar.sayim.ag;
    const neden = [];
    if (report.fails) neden.push(`başarısız kontrol ya da adım: ${report.fails}`);
    if (report.pageErrors.length) neden.push(`sayfa hatası (pageerror): ${report.pageErrors.length}`);
    if (izinsizKonsol) neden.push(`izinsiz konsol hatası: ${izinsizKonsol}`);
    if (izinsizAg) neden.push(`izinsiz ağ hatası (≥ 400 yanıt ya da başarısız istek): ${izinsizAg}`);
    if (report.evalErrors) neden.push(`adım istisnası (evalErrors): ${report.evalErrors}`);
    if (onaySayisi === 0 && meta.olcum !== true) neden.push('senaryo hiç onay içermiyor (ölçüm betiği mi? meta.olcum ile işaretleyin)');
    if (report.harnessError) neden.push('koşucu hatası: ' + report.harnessError);
    if (report.timeout) neden.push(`zaman aşımı (${timeoutS} sn)`);
    const durum = report.timeout ? 'ZAMAN_ASIMI' : report.harnessError ? 'KOSUCU_HATASI' : neden.length ? 'KALDI' : meta.olcum === true ? 'OLCUM' : 'GECTI';
    const cikis = durum === 'GECTI' || durum === 'OLCUM' ? 0 : 1;
    if (!report.timeout && !p.isClosed() && (goruntuKipi === 'hep' || (goruntuKipi === 'kalan' && cikis !== 0 && !ilkGoruntu))) {
      await Promise.race([goruntuAl('son'), new Promise((r) => setTimeout(r, 30000))]);
    }
    report.ms = Date.now() - t0;
    const turSayim = {};
    for (const k of kontroller) turSayim[k.tur] = (turSayim[k.tur] || 0) + 1;
    Object.assign(report, {
      sema: O.SEMA, senaryo: path.relative(process.cwd(), path.resolve(scenarioPath)) || scenarioPath, meta,
      hedef: { tip: O.hedefTipi(hedefUrl, uretim, secim['hedef-tip']), url: hedefUrl, verilenUrl: url, gorunum: [W, H], uretim },
      ortam, tekrar, kontroller,
      hatalar: { konsol: hatalar.konsol, konsolIzinli: hatalar.konsolIzinli, konsolAgEslesen: hatalar.konsolAgEslesen, sayfa: report.pageErrors.slice(), ag: hatalar.ag, agIzinli: hatalar.agIzinli, agIptal: hatalar.agIptal, degerlendirme: adimHatalari, kesildi: hatalar.kesildi },
      uyarilar: hatalar.uyarilar, uyariSayim: { farkli: hatalar.uyarilar.length, toplam: hatalar.uyariToplam, sinirDisi: hatalar.uyariTasma },
      izinler: O.izinOzeti(izinler), diyaloglar, goruntuler, kanitUyarilari, agIstekSayisi: agGunlugu.length,
      sonuc: { durum, cikisKodu: cikis, neden, onaySayisi, kontrolSayisi: kontroller.length, gecen: kontroller.filter((k) => k.ok).length, kalan: kontroller.filter((k) => !k.ok).length,
        izinsizKonsol, izinsizAg, izinliKonsol: hatalar.sayim.konsolIzinli, izinliAg: hatalar.sayim.agIzinli, tur: turSayim['tarayici+benzetim'] ? 'tarayici+benzetim' : kontroller.length ? 'tarayici' : null, turSayim },
      sure: { hazirMs: report.readyMs, toplamMs: report.ms, yerlesmeMs: yerlesmeSure },
    });
    console.log(`errors: ${report.errors.length} pageErrors: ${report.pageErrors.length} fails: ${report.fails}${report.evalErrors ? ` evalErrors: ${report.evalErrors}` : ''}${report.harnessError ? ' HARNESS ERROR (senaryo koşmadı)' : ''}${report.timeout ? ' TIMEOUT' : ''} (${(report.ms / 1000).toFixed(1)} s)`);
    for (const k of hatalar.konsol.slice(0, 10)) console.log(`IZINSIZ KONSOL ×${k.sayi}: ${k.ileti.slice(0, 200)}${k.url ? ' @ ' + k.url.slice(0, 160) : ''}`);
    for (const a of hatalar.ag.slice(0, 10)) console.log(`IZINSIZ AG ×${a.sayi}: ${a.durum || a.hata} ${a.url.slice(0, 200)}`);
    for (const a of hatalar.konsolIzinli.concat(hatalar.agIzinli).slice(0, 10)) console.log(`IZINLI ×${a.sayi} (${a.izin}): ${(a.ileti || `${a.durum || a.hata} ${a.url}`).slice(0, 160)}`);
    // (A1-09) kullanılan bütün izinler gerekçesiyle listelenir
    for (const z of izinler) if (z.eslesme > 0) console.log(`IZIN ×${z.eslesme} (${z.kaynak}, ${z.tur}) ${z.desen} — ${z.gerekce.slice(0, 160)}`);
    let sonDurum = durum, sonCikis = cikis;
    if (reportPath) {
      try { fs.mkdirSync(path.dirname(reportPath), { recursive: true }); fs.writeFileSync(reportPath, O.guvenliJson(report, 1)); }
      catch (e) {
        const ileti = 'rapor yazılamadı: ' + O.temiz(e.message).split('\n')[0].slice(0, 300);
        console.log('RAPOR YAZILAMADI: ' + ileti);
        neden.push(ileti); sonDurum = 'KOSUCU_HATASI'; sonCikis = 1;
        yedekRapor(ileti);
      }
    }
    console.log(`SONUC: ${sonDurum} (çıkış ${sonCikis}) kontrol ${kontroller.filter((k) => k.ok).length}/${kontroller.length}, onay ${onaySayisi ?? '-'} | izinsiz konsol ${izinsizKonsol}, ağ ${izinsizAg} | izinli konsol ${hatalar.sayim.konsolIzinli}, ağ ${hatalar.sayim.agIzinli} | uyarı ${hatalar.uyarilar.length} farklı/${hatalar.uyariToplam}${kanitUyarilari.length ? ` | kanıt uyarısı ${kanitUyarilari.length}` : ''}${neden.length ? ' | neden: ' + neden.join('; ') : ''}`);
    return sonCikis;
  };
  acilKapanis = (ileti) => { if (!bitti) { report.harnessError = ileti; finish(); } };
  try {
    // senaryo gezinmeden önce okunur: meta (izin listesi, başlatma betiği) sayfa açılmadan gerekir
    let steps = eval(fs.readFileSync(scenarioPath, 'utf8'));
    if (!Array.isArray(steps)) throw new Error('senaryo bir adım dizisi döndürmeli');
    if (steps[0] && typeof steps[0] === 'object' && 'meta' in steps[0]) {
      if (Object.keys(steps[0]).length !== 1) throw new Error('meta öğesi ({meta: {...}}) başka adım alanı içeremez');
      meta = steps[0].meta || {};
      steps = steps.slice(1);
    }
    // bilinmeyen adım alanı (ör. yazım hatasıyla 'expext') eskiden sessizce atlanıyor ve onay hiç koşmuyordu: koşucu hatası
    const ADIM_ALANLARI = new Set(['label', 'wait', 'rotaKok', 'goto', 'bekleSecici', 'tikla', 'js', 'degisken', 'expect', 'key', 'down', 'up', 'metrics', 'click', 'view', 'snap', 'snapjs', 'shot', 'agSay', 'metrikKarsilastir']);
    steps.forEach((s, i) => {
      if (!s || typeof s !== 'object' || Array.isArray(s)) throw new Error(`adım ${i + 1} bir nesne olmalı`);
      const yabanci = Object.keys(s).filter((k) => !ADIM_ALANLARI.has(k));
      if (yabanci.length) throw new Error(`adım ${i + 1}: bilinmeyen adım alanı ${yabanci.join(', ')} (yazım hatası mı? bilinenler: ${[...ADIM_ALANLARI].join(', ')})`);
      // (A1-04) onay adımlarının iç alanları: yazım hatalı karşılaştırıcı, karşılaştırıcısız expect, sınırsız agSay → koşucu hatası
      O.onayDenetle(s, `adım ${i + 1}`);
    });
    // meta izinleri: gerekçesiz ya da her şeyle eşleşen izin koşucu hatasıdır (A1-09)
    izinler = O.izinleriDerle(meta.izinliHatalar, secim['izin-hata'] || []);
    onaySayisi = steps.filter((s) => s.expect || s.agSay || s.metrikKarsilastir).length;
    // başlatma betikleri: sayfanın kendi betiklerinden önce, her gezinmede çalışır
    // tür ölçümü (A1-03, A1-11): yalnız test kipinde; --uretim'de sayfaya hiçbir şey eklenmez
    if (!uretim) await p.addInitScript({ content: SAYAC_BASLATMA });
    if (Object.keys(kosuDegiskenleri).length) await p.addInitScript({ content: O.degiskenBetigi(kosuDegiskenleri) });
    const metaBaslatma = meta.baslatma === undefined ? [] : [].concat(meta.baslatma);
    for (const s of metaBaslatma) { if (typeof s !== 'string') throw new Error('meta.baslatma dizge ya da dizge dizisi olmalı'); await p.addInitScript({ content: s }); }
    for (const f of secim.baslatma || []) await p.addInitScript({ content: fs.readFileSync(f, 'utf8') });
    if (metaBaslatma.length || (secim.baslatma || []).length) console.log(`başlatma betiği: ${metaBaslatma.length} meta, ${(secim.baslatma || []).length} dosya`);

    await p.goto(hedefUrl);
    await p.waitForFunction('window.__ready', null, { timeout: 240000 });
    report.readyMs = Date.now() - t0;
    console.log('ready in', (report.readyMs / 1000).toFixed(1), 's');
    if (!uretim) {
      const dk = await p.evaluate('typeof window.DK');
      if (dk !== 'object') throw new Error(`Test kipi açılmadı: sayfa üretim yapıtı mı ya da köken yerel değil mi? (typeof window.DK = ${dk}, adres ${hedefUrl})`);
    } else {
      const ts = Date.now();
      const v = await p.evaluate('typeof window.DK === "undefined"');
      console.log((v ? 'PASS ' : 'FAIL ') + 'U00 Üretimde test kancası yok → ' + JSON.stringify(v));
      if (!v) report.fails++;
      await kontrolEkle({ n: 0, etiket: 'U00 Üretimde test kancası yok', ok: v === true, deger: v, beklenen: { truthy: true }, hata: v ? null : 'window.DK üretim kipinde tanımlı', sureMs: Date.now() - ts, js: 'typeof window.DK === "undefined"' });
    }
    await tabanla();
    let n = 0;
    for (const s of steps) {
      if (bitti) break;   // zaman aşımı: rapor yazıldı, tarayıcı kapanıyor; kalan adımlar koşmaz ve PASS/FAIL basmaz
      n++;
      aktifAdim = n;
      const ta = Date.now();
      const rec = { n, label: s.label || null };
      if (s.wait) await p.waitForTimeout(s.wait);
      if (s.rotaKok) {
        try {
          const r = s.rotaKok;
          const kok = String(r.kok).replace(/\/+$/, '');
          const dizin = path.resolve(r.dizin || '.');
          await p.context().route(kok + '/**', async (route) => {
            const u = new URL(route.request().url());
            let yol = decodeURIComponent(u.pathname);
            if (yol.endsWith('/')) yol += 'index.html';
            const dosya = path.resolve(dizin, '.' + yol);
            const icinde = dosya === dizin || dosya.startsWith(dizin + path.sep);
            if (!icinde || !fs.existsSync(dosya) || !fs.statSync(dosya).isFile()) return route.fulfill({ status: 404, contentType: 'text/plain; charset=utf-8', body: 'yok' });
            return route.fulfill({ status: 200, contentType: O.mime(dosya), body: fs.readFileSync(dosya) });
          });
          rec.rotaKok = { kok, dizin };
          console.log('ROTA', kok, '→', dizin);
        } catch (e) { await adimHatasi(rec, 'rotaKok', e, JSON.stringify(s.rotaKok)); }
      }
      if (s.goto) {
        const g = typeof s.goto === 'string' ? { url: s.goto } : s.goto;
        let hedef = null;
        try {
          hedef = new URL(g.url, p.url()).toString();
          if (g.testParam !== false && !uretim) hedef = O.testUrl(hedef);
          gotoSuruyor = true; kayit.gezinmede = true; gezinmeNo++;
          await p.goto(hedef, { timeout: g.zaman || 60000 });
          if (g.hazir !== false) await p.waitForFunction('window.__ready', null, { timeout: g.hazirZaman || 240000 });
          rec.goto = { url: hedef };
          console.log('GOTO', hedef);
        } catch (e) { await adimHatasi(rec, 'goto', e, hedef || g.url); }
        finally { gotoSuruyor = false; kayit.gezinmede = false; }
        await tabanla();
      }
      if (s.bekleSecici) {
        const w = typeof s.bekleSecici === 'string' ? { secici: s.bekleSecici } : s.bekleSecici;
        try { await p.waitForSelector(w.secici, { state: w.durum || 'visible', timeout: w.zaman || 30000 }); rec.bekleSecici = w.secici; }
        catch (e) { await adimHatasi(rec, 'bekleSecici', e, w.secici); }
      }
      if (s.tikla) {
        const c = typeof s.tikla === 'string' ? { secici: s.tikla } : s.tikla;
        try {
          let loc = c.metin !== undefined ? p.getByText(c.metin, { exact: !!c.tam }) : p.locator(c.secici);
          if (c.ilk) loc = loc.first();
          await loc.click({ timeout: c.zaman || 10000 });
          rec.tikla = c.metin !== undefined ? { metin: c.metin } : { secici: c.secici };
        } catch (e) { await adimHatasi(rec, 'tikla', e, c.metin !== undefined ? 'metin: ' + c.metin : c.secici); }
      }
      if (s.js) {
        let r, hata = null;
        try { r = await p.evaluate(s.js); } catch (e) { hata = e; }
        // js adımı istisna atarsa senaryo amaçladığını yapmamıştır: başarısızlık sayılır (önce yalnız yazdırılıyordu, çıkış kodu 0 kalıyordu)
        if (hata) await adimHatasi(rec, 'js', hata, s.js);
        else {
          rec.result = r;
          // (A1-01) dönüş değeri döngüsel ya da BigInt olabilir (Playwright ikisini de taşır): güvenli yazılır; dönüş değeri onay
          // değildir, yazılamaması adım hatası sayılmaz (eskiden R: satırındaki JSON.stringify istisnası adım hatası sayılıyordu)
          const d = {};
          const sj = O.guvenliJson(r, undefined, d);
          if (d.dongu || d.bigint) rec.sonucNot = `dönüş değeri JSON'a doğrudan çevrilemiyordu: ${d.dongu ? `${d.dongu} döngüsel başvuru "${O.DONGUSEL}" olarak` : ''}${d.dongu && d.bigint ? ', ' : ''}${d.bigint ? `${d.bigint} BigInt "<sayı>n" dizgesi olarak` : ''} yazıldı`;
          if (r !== undefined) console.log('R:', (sj === undefined ? String(r) : sj).slice(0, 1500));
        }
      }
      if (s.degisken) {
        const v = s.degisken;
        try {
          if (!v || !v.ad) throw new Error('degisken adımı {ad, js} ya da {ad, deger} ister');
          const deger = 'js' in v ? await p.evaluate(v.js) : v.deger;
          kosuDegiskenleri[v.ad] = deger;
          await p.addInitScript({ content: O.degiskenBetigi({ [v.ad]: deger }) });
          await p.evaluate(O.degiskenBetigi({ [v.ad]: deger }));
          rec.degisken = { ad: v.ad, deger };
          console.log('DEGISKEN', v.ad, '=', O.kisa(deger, 200));
        } catch (e) { await adimHatasi(rec, 'degisken', e, v && (v.js || v.ad)); }
      }
      if (s.expect) {
        const E = s.expect;
        const beklenen = {};
        for (const k of ['eq', 'truthy', 'gte', 'lte']) if (k in E) beklenen[k] = E[k];
        const te = Date.now();
        try {
          const v = await p.evaluate(E.js);
          if (bitti) break;
          // (A1-04) verilen bütün karşılaştırıcılar uygulanır (eskiden yalnız sonuncusu); gte/lte yalnız sonlu sayıyla geçer
          const { ok, sorun } = O.karsilastir(v, E);
          rec.expect = { label: E.label, ok, value: v };
          if (!ok) report.fails++;
          console.log((ok ? 'PASS ' : 'FAIL ') + (E.label || E.js.slice(0, 80)) + ' → ' + O.kisa(v, 300));
          await kontrolEkle({ n, etiket: E.label || E.js.slice(0, 80), ok, deger: v, beklenen, hata: ok ? null : `beklenen ${O.kisa(beklenen, 200)}, gelen ${O.kisa(v, 200)} (sağlanmayan: ${sorun.join('; ')})`, sureMs: Date.now() - te, js: E.js });
        } catch (e) {
          if (bitti) break;
          report.fails++; rec.expect = { label: E.label, ok: false, error: e.message.slice(0, 300) }; console.log('FAIL (hata) ' + (E.label || '') + ' ' + e.message.slice(0, 200));
          await kontrolEkle({ n, etiket: E.label || E.js.slice(0, 80), ok: false, deger: null, beklenen, hata: 'istisna: ' + e.message.slice(0, 300), sureMs: Date.now() - te, js: E.js });
        }
      }
      if (s.key) await p.keyboard.press(s.key);
      if (s.down) await p.keyboard.down(s.down);
      if (s.up) await p.keyboard.up(s.up);
      if (s.metrics) { try { if (!p._cdp) { p._cdp = await p.context().newCDPSession(p); await p._cdp.send('Performance.enable'); } const mm = (await p._cdp.send('Performance.getMetrics')).metrics; const m = Object.fromEntries(mm.map((x) => [x.name, x.value])); const hu = await p._cdp.send('Runtime.getHeapUsage').catch(() => ({})); const o = { label: s.metrics, heapMB: +(m.JSHeapUsedSize / 1048576).toFixed(1), heapTotalMB: +(m.JSHeapTotalSize / 1048576).toFixed(1), backingMB: hu.backingStorageSize !== undefined ? +(hu.backingStorageSize / 1048576).toFixed(1) : null, embedderMB: hu.embedderHeapUsedSize !== undefined ? +(hu.embedderHeapUsedSize / 1048576).toFixed(1) : null, nodes: m.Nodes, listeners: m.JSEventListeners, docs: m.Documents, frames: m.Frames }; rec.metrics = o; metrikler[s.metrics] = o; console.log('M:', JSON.stringify(o)); } catch (e) { console.log('METRICSFAIL', e.message.slice(0, 120)); kanitUyarisi(rec, 'metrics', e); } }
      if (s.click) await p.mouse.click(s.click[0], s.click[1]);
      // (A1-06) kanıt adımları: sayfa tarafındaki istisna (evaluate reddi) ya da data: adresi olmayan dönüş adım hatasıdır (sayılır);
      // dosya yazımı sorunu yalnız kanıt uyarısıdır. Eskiden üçü de yalnız SNAPFAIL satırı basıyor, raporda iz kalmıyordu.
      if (s.view) await kanitAdimi(rec, 'view', `DK.snapFrom(${JSON.stringify(s.view[1])}, ${JSON.stringify(s.view[2])})`, s.view[0]);
      if (s.snap) await kanitAdimi(rec, 'snap', 'DK.snap()', s.snap);
      if (s.snapjs) await kanitAdimi(rec, 'snapjs', s.snapjs[1], s.snapjs[0]);
      // shot: sayfa ekran görüntüsü koşucu tarafında alınır (zaman aşımı, dosya); sorunu kanıt uyarısıdır, çökme ayrıca pageErrors'tadır
      if (s.shot) { try { fs.mkdirSync(path.dirname(s.shot), { recursive: true }); await p.screenshot({ path: s.shot, timeout: 90000 }); } catch (e) { console.log('SHOTFAIL', e.message.slice(0, 100)); kanitUyarisi(rec, 'shot', e); } }
      if (s.agSay) {
        const a = s.agSay;
        const etiket = a.label || `agSay ${a.desen}`;
        try {
          const re = new RegExp(a.desen);
          const say = agGunlugu.filter((x) => (!a.sonGezinmeden || x.gezinme === gezinmeNo) && re.test(x.url)).length;
          let ok = true;
          if ('enCok' in a) ok = ok && say <= a.enCok;
          if ('enAz' in a) ok = ok && say >= a.enAz;
          if (!ok) report.fails++;
          rec.agSay = { label: etiket, ok, value: say };
          console.log((ok ? 'PASS ' : 'FAIL ') + etiket + ' → ' + say);
          await kontrolEkle({ n, etiket, ok, deger: say, beklenen: { enCok: a.enCok, enAz: a.enAz }, hata: ok ? null : `istek sayısı ${say}, sınır ${O.kisa({ enAz: a.enAz, enCok: a.enCok })}`, sureMs: 0, js: 'agSay ' + a.desen });
        } catch (e) { report.fails++; console.log('FAIL (hata) ' + etiket + ' ' + e.message.slice(0, 200)); await kontrolEkle({ n, etiket, ok: false, deger: null, beklenen: { enCok: a.enCok, enAz: a.enAz }, hata: 'istisna: ' + e.message.slice(0, 300), sureMs: 0, js: 'agSay ' + a.desen }); }
      }
      if (s.metrikKarsilastir) {
        const m = s.metrikKarsilastir;
        const etiket = m.label || `metrikKarsilastir ${m.once}→${m.sonra} ${m.alan}`;
        const a = metrikler[m.once], c = metrikler[m.sonra];
        let ok = true, fark = null, hata = null;
        if (!a || !c || typeof a[m.alan] !== 'number' || typeof c[m.alan] !== 'number') { ok = false; hata = `metrik bulunamadı: ${m.once}/${m.sonra} alan ${m.alan}`; }
        else {
          fark = c[m.alan] - a[m.alan];
          if ('enCokFark' in m) ok = ok && fark <= m.enCokFark;
          if ('enAzFark' in m) ok = ok && fark >= m.enAzFark;
          if (!ok) hata = `fark ${fark}, sınır ${O.kisa({ enAzFark: m.enAzFark, enCokFark: m.enCokFark })}`;
        }
        if (!ok) report.fails++;
        rec.metrikKarsilastir = { label: etiket, ok, value: fark };
        console.log((ok ? 'PASS ' : 'FAIL ') + etiket + ' → ' + JSON.stringify(fark));
        await kontrolEkle({ n, etiket, ok, deger: fark, beklenen: { enCokFark: m.enCokFark, enAzFark: m.enAzFark }, hata, sureMs: 0, js: `metrik ${m.once}→${m.sonra}.${m.alan}` });
      }
      rec.ms = Date.now() - ta;
      report.steps.push(rec);
    }
    // (A1-08) yerleşme: son adımın başlattığı eşzamansız işlerin (zamanlayıcı, söz, ağ yanıtı) hataları sınıflandırmadan önce gelsin
    if (!bitti && yerlesmeMs > 0 && !p.isClosed()) {
      const onceSay = report.pageErrors.length + kayit.konsolToplam + kayit.agToplam;
      const ty = Date.now();
      await new Promise((r) => setTimeout(r, yerlesmeMs));
      yerlesmeSure = Date.now() - ty;
      const yeni = report.pageErrors.length + kayit.konsolToplam + kayit.agToplam - onceSay;
      if (yeni > 0) console.log(`YERLESME: son adımdan sonraki ${yerlesmeSure} ms içinde ${yeni} yeni hata kaydı geldi`);
    }
    await finish();
  } catch (e) {
    // kapanış sürüyorsa (ör. zaman aşımı tarayıcıyı kapattı ve yarıdaki adım koptu) onu bekle; o raporu yazıp çıkar
    if (bitti) { console.log('(kapanış sürerken yarıda kalan adım: ' + O.temiz((e && e.message) || e).split('\n')[0].slice(0, 160) + ')'); await bitisSozu; return; }
    console.log('HARNESS ERROR', O.temiz(e.message).slice(0, 500));
    report.harnessError = O.temiz(e.message).slice(0, 500);
    await finish();
  }
})();
