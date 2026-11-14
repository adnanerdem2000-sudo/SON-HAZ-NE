// Çok oyunculu (co-op) senaryo koşucusu: N tarayıcı bağlamı, yerel PeerJS sinyal sunucusu.
//
//   node tests/peer-server.cjs &                       (bir kez; 127.0.0.1:9000)
//   node tests/harness/coop.cjs tests/scenarios/coop/<senaryo>.cjs [--players 2] [--size 640x360] [--report r.json]
//        [--url ...] [--timeout 900] [--izin-hata '<düzenli ifade> # <gerekçe>']… [--degisken ad=deger]… [--baslatma <betik.js>]…
//        [--goruntu kalan|hep|yok] [--goruntu-dizin <dizin>]
//
// Senaryo modülü şunu dışa aktarır:  module.exports = async ({ pages, host, guests, ev, tick, log, check }) => { ... }
//   pages   : Playwright sayfaları (pages[0] oda sahibi)        ev(page, js, label?, {kapaliIzinli}?) : sayfada çalıştır, sonucu yaz
//   tick(sn): açık sayfalarda DK.sim ile sn saniye ilerlet (ağ mesajlarının akması için gerçek bekleme de yapar)
//   check(label, ok, detay): sonuç kaydeder (ok=false → fail)   log(msg): ekrana yaz
//   module.exports.meta (isteğe bağlı): { testler, dosyalar, olcum, izinliHatalar, baslatma } — anlamları run.cjs ile aynı
//
// Faz 9 tasarımı §6.3 (K-11, K-12, K-13):
//   - ev() istisnası yutulmaz: report.evalErrors'a yazılır ve fails artar. Kapalı sayfada çağrı yapılmaz (report.kapaliAtlama);
//     istisna anında sayfa kapanmışsa izinlidir (report.kapaliIstisna). tick() kapalı sayfaları atlar. Kasıtlı kapatma
//     (page.close / context.close) kendiliğinden işaretlenir; o sekmenin yarıda kalan istekleri hata sayılmaz.
//   - Konsol hataları (404 süzgeci yok), ≥ 400 yanıtlar ve başarısız istekler oyuncu başına kaydedilir ve çıkış koduna girer;
//     izin listesi run.cjs'teki gibidir. Uyarılar oyuncu başına tekilleştirilerek kaydedilir.
//   - check() hiç çağrılmadıysa (meta.olcum yoksa) KALDI. İlk başarısızlıkta her oyuncunun ekran görüntüsü alınır.
//   - Adrese test=1 eklenir (§5.6); __ready'den sonra window.DK yoksa KOSUCU_HATASI.
// A1 inceleme düzeltmeleri (Faz 1):
//   - mk(ad) aynı adla yeniden çağrılırsa (yeniden katılım) yeni sekmenin rapor anahtarı 'Ad#2', 'Ad#3' … olur; önceki sekmenin
//     sayfa hataları ve konsol kayıtları silinmez (A1-02). Oyun içi ad (DK.G.profile.appearance.name, p.playerName) değişmez.
//   - check(etiket, ok): ok bir söz (Promise) ise kontrol KALIR: await unutulmuştur, değer denetlenmemiştir (A1-07).
//   - Senaryo bittikten sonra --yerlesme ms (varsayılan 1000) beklenir; bu sürede gelen sayfa/konsol/ağ hataları da sayılır (A1-08).
//   - Kapanış her durumda tamamlanır (rapor döngü/BigInt güvenli yazılır; yazılamazsa yedek iskelet, çıkış 1; tarayıcı kapanır,
//     süreç çıkar); yakalanmamış istisna KOSUCU_HATASI raporuyla biter (A1-01). İzinlerde gerekçe zorunlu; komut satırı izinleri
//     tarayıcı açılmadan derlenir, hata kullanım hatasıdır (A1-09, A1-10).
// Çıkış kodu: 0 yalnız GECTI ya da OLCUM; 1 başarısızlık, koşucu hatası, zaman aşımı; 2 kullanım hatası.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const O = require('./ortak.cjs');

const argv = process.argv.slice(2);
let ayr;
try {
  ayr = O.secenekler(argv, { deger: ['players', 'size', 'url', 'report', 'timeout', 'goruntu', 'goruntu-dizin', 'hedef-tip', 'yerlesme'], cok: ['izin-hata', 'degisken', 'baslatma'], bayrak: [] });
} catch (e) { console.error(e.message); process.exit(2); }
const secim = ayr.o;
const scenarioPath = secim._[0];
const KULLANIM = 'Kullanım: node tests/harness/coop.cjs <senaryo.cjs> [--players N] [--size WxH] [--url ...] [--report r.json] [--izin-hata "desen # gerekçe"] [--baslatma betik.js] [--goruntu kalan|hep|yok] [--yerlesme ms]';
if (!scenarioPath || ayr.bilinmeyen.length) { console.error((ayr.bilinmeyen.length ? 'Bilinmeyen seçenek: ' + ayr.bilinmeyen.join(' ') + '\n' : '') + KULLANIM); process.exit(2); }
// (A1-10) komut satırı izinleri tarayıcı açılmadan derlenir: bozuk düzenli ifade ya da gerekçesiz izin kullanım hatasıdır
let cliIzinleri;
try { cliIzinleri = O.izinleriDerle([], secim['izin-hata'] || []); } catch (e) { console.error(e.message + '\n' + KULLANIM); process.exit(2); }
const yerlesmeMs = secim.yerlesme === undefined ? 1000 : Number(secim.yerlesme);
if (!Number.isFinite(yerlesmeMs) || yerlesmeMs < 0) { console.error('--yerlesme negatif olmayan bir sayı (ms) olmalı\n' + KULLANIM); process.exit(2); }
// (A1-01) yakalanmamış istisna ya da söz reddi: KOSUCU_HATASI raporu ve çıkış 1 (finish kurulmadan önce asgari rapor)
let acilKapanis = null;
const yakalanmamis = (tur) => (e) => {
  const ileti = `yakalanmamış ${tur}: ` + O.temiz((e && e.message) || e).split('\n')[0].slice(0, 300);
  console.log('KOSUCU: ' + ileti + ((e && e.stack) ? ' | ' + O.temiz(e.stack).split('\n').slice(1, 3).join(' | ').slice(0, 300) : ''));
  if (acilKapanis) { acilKapanis(ileti); return; }
  if (secim.report) {
    try { fs.mkdirSync(path.dirname(secim.report), { recursive: true }); fs.writeFileSync(secim.report, JSON.stringify({ sema: O.SEMA, scenario: scenarioPath, harnessError: ileti, sonuc: { durum: 'KOSUCU_HATASI', cikisKodu: 1, neden: [ileti], yedekRapor: true } }, null, 1)); } catch (e2) { /* yazılamadı */ }
  }
  process.exit(1);
};
process.on('unhandledRejection', yakalanmamis('söz reddi'));
process.on('uncaughtException', yakalanmamis('istisna'));
const N = Number(secim.players || '2');
const [W, H] = (secim.size || '640x360').split('x').map(Number);
const url = secim.url || 'http://localhost:8080/index.html?peerhost=127.0.0.1&peerport=9000';
const hedefUrl = O.testUrl(url);
const reportPath = secim.report || null;
const timeoutS = Number(secim.timeout || '900');
const goruntuKipi = secim.goruntu || 'kalan';
if (!['kalan', 'hep', 'yok'].includes(goruntuKipi)) { console.error('--goruntu kalan|hep|yok olmalı\n' + KULLANIM); process.exit(2); }
let kosuDegiskenleri;
try { kosuDegiskenleri = O.degiskenler(secim.degisken); } catch (e) { console.error(e.message); process.exit(2); }

(async () => {
  const t0 = Date.now();
  const report = { scenario: scenarioPath, players: N, checks: [], errors: {}, pageErrors: {}, fails: 0, evalErrors: [], kapaliAtlama: 0, kapaliIstisna: 0, kapananlar: [] };
  const kontroller = [];
  const kayitlar = [];
  const goruntuler = [];
  let meta = {};
  let izinler = cliIzinleri;
  let baslatma = [];
  let senaryoOkundu = false;
  let bitti = false;
  let bitisSozu = null;
  let yerlesmeSure = null;
  let ilkGoruntu = null;
  let bekleyenGoruntu = null;
  let hazirMs = null;
  let senaryoT0 = null;
  let sonKontrolT = null;
  const goruntuDir = O.goruntuDizini(__dirname, scenarioPath, secim['goruntu-dizin']);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] });
  const ortam = await O.ortamBilgisi(b, { kosucuDizin: __dirname, gorunum: [W, H], chromium });
  const tekrar = O.tekrarBilgisi({ kosucuDosya: __filename, argv, senaryoArg: scenarioPath, url: hedefUrl, coop: true, ortam });
  const names = ['Kaptan', 'Tayfa', 'Lostromo', 'Topçu'];
  const pages = [];
  const mk = async (name) => {
    // (A1-02) rapor anahtarı sekme başına benzersizdir: aynı adla yeniden katılım ('Tayfa' → 'Tayfa#2') önceki sekmenin
    // errors/pageErrors kaydını sıfırlamaz (eskiden sıfırlıyordu: ilk sekmedeki yakalanmamış oyun hatası kayboluyor, koşu GECTI oluyordu)
    let anahtar = name;
    for (let i = 2; Object.prototype.hasOwnProperty.call(report.pageErrors, anahtar); i++) anahtar = `${name}#${i}`;
    report.errors[anahtar] = []; report.pageErrors[anahtar] = [];
    const ctx = await b.newContext({ viewport: { width: W, height: H } });
    const kayit = new O.HataKaydi(anahtar);
    kayitlar.push(kayit);
    // senaryo bağlamı ya da sekmeyi kasıtlı kapatırken o sekmenin yarıda kalan istekleri hata sayılmaz
    const baglamKapat = ctx.close.bind(ctx);
    ctx.close = async (...a) => { kayit.kapaniyor = true; return baglamKapat(...a); };
    if (Object.keys(kosuDegiskenleri).length) await ctx.addInitScript({ content: O.degiskenBetigi(kosuDegiskenleri) });
    for (const s of baslatma) await ctx.addInitScript({ content: s });
    const p = await ctx.newPage();
    const sayfaKapat = p.close.bind(p);
    p.close = async (...a) => { kayit.kapaniyor = true; return sayfaKapat(...a); };
    p.on('console', (m) => {
      const t = m.text();
      if (m.type() === 'error') { kayit.konsolIletisi(m); report.errors[anahtar].push(t.slice(0, 400)); console.log(anahtar, 'ERR:', t.slice(0, 300)); }
      else if (m.type() === 'warning') kayit.konsolIletisi(m);
    });
    p.on('pageerror', (e) => { const s = e.message + ' | ' + (e.stack || '').split('\n').slice(0, 3).join(' | '); report.pageErrors[anahtar].push(s.slice(0, 600)); console.log(anahtar, 'PAGEERR:', s.slice(0, 400)); });
    p.on('requestfailed', (r) => { const s = kayit.istekBasarisiz(r); if (!/favicon/.test(r.url())) console.log(anahtar, 'NETFAIL:', r.url().slice(0, 300) + (s === 'iptal' ? ' (kapanış iptali; hata sayılmaz)' : '')); });
    p.on('response', (r) => { if (kayit.yanit(r)) console.log(anahtar, 'HTTP', r.status(), r.url().slice(0, 300)); });
    p.on('close', () => { kayit.kapaniyor = true; if (!bitti) { report.kapananlar.push({ oyuncu: anahtar, ms: Date.now() - t0 }); console.log(anahtar, 'sekme kapandı'); } });
    p.on('crash', () => { report.pageErrors[anahtar].push('SAYFA ÇÖKTÜ (renderer crash)'); console.log(anahtar, 'PAGECRASH'); });
    p.playerName = name;
    p.oyuncuAnahtari = anahtar;
    await p.goto(hedefUrl);
    await p.waitForFunction('window.__ready', null, { timeout: 240000 });
    const dk = await p.evaluate('typeof window.DK');
    if (dk !== 'object') throw new Error(`Test kipi açılmadı: sayfa üretim yapıtı mı ya da köken yerel değil mi? (${anahtar}: typeof window.DK = ${dk}, adres ${hedefUrl})`);
    await p.evaluate(`DK.G.noAutoPause=true; DK.G.profile.appearance.name='${name}';`);
    if (anahtar !== name) console.log(`${anahtar}: '${name}' adıyla yeniden katılan sekme (rapor anahtarı ${anahtar})`);
    return p;
  };
  // ilk başarısızlıkta her oyuncunun ekran görüntüsü (png'ler tests/out/ altında, git dışı)
  const goruntuAl = async (ad) => {
    const out = [];
    try { fs.mkdirSync(goruntuDir, { recursive: true }); } catch (e) { /* yok */ }
    for (const p of pages) {
      const oyuncu = p.oyuncuAnahtari || p.playerName;
      if (p.isClosed()) { out.push({ oyuncu, sayfa: null, not: 'sekme kapalı' }); continue; }
      const f = path.join(goruntuDir, `${ad}_${oyuncu}.png`);
      try { await p.screenshot({ path: f, timeout: 60000 }); out.push({ oyuncu, sayfa: f }); console.log('GORUNTU', f); }
      catch (e) { out.push({ oyuncu, sayfa: null, hata: e.message.slice(0, 200) }); }
    }
    goruntuler.push({ ad, oyuncular: out });
    return out;
  };
  // yalnız ilk başarısızlık görüntü alır; çağıran o ilk başarısızlıksa söz döner, değilse null
  const ilkBasarisizlik = (neden) => {
    if (!tekrar.adim) tekrar.adim = { n: report.checks.length, js: null, neden: String(neden).slice(0, 400) };
    if (goruntuKipi === 'yok' || bekleyenGoruntu) return null;
    bekleyenGoruntu = goruntuAl('ilk_kalan').then((g) => { ilkGoruntu = g; return g; });
    return bekleyenGoruntu;
  };
  // (A1-01) Kapanış her durumda tamamlanır: raporlama istisna atsa da (ör. yazılamayan --report yolu) tarayıcı kapatılır ve
  // süreç çıkar (önceden ikinci finish() 'bitti' yüzünden boşa düşüyor, süreç asılı kalıyor, tarayıcı kilidi tutuluyordu).
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
  const yedekRapor = (ileti) => {
    if (!reportPath) return;
    try {
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
      fs.writeFileSync(reportPath, JSON.stringify({ sema: O.SEMA, scenario: scenarioPath, players: N, harnessError: report.harnessError || ileti, ms: Date.now() - t0,
        sonuc: { durum: 'KOSUCU_HATASI', cikisKodu: 1, neden: [ileti], yedekRapor: true } }, null, 1));
      console.log('YEDEK RAPOR yazıldı: ' + reportPath);
    } catch (e) { console.log('YEDEK RAPOR da yazılamadı: ' + O.temiz(e.message).slice(0, 200)); }
  };
  const raporla = async () => {
    if (bekleyenGoruntu) await Promise.race([bekleyenGoruntu, new Promise((r) => setTimeout(r, 30000))]);
    const pe = Object.values(report.pageErrors).reduce((s, a) => s + a.length, 0);
    const hatalar = O.siniflandir(kayitlar, izinler);
    const neden = [];
    if (report.fails) neden.push(`başarısız kontrol ya da ev() istisnası: ${report.fails}`);
    if (pe) neden.push(`sayfa hatası (pageerror): ${pe}`);
    if (hatalar.sayim.konsol) neden.push(`izinsiz konsol hatası: ${hatalar.sayim.konsol}`);
    if (hatalar.sayim.ag) neden.push(`izinsiz ağ hatası (≥ 400 yanıt ya da başarısız istek): ${hatalar.sayim.ag}`);
    if (report.evalErrors.length) neden.push(`ev() istisnası (evalErrors): ${report.evalErrors.length}`);
    if (senaryoOkundu && !report.harnessError && !report.timeout && report.checks.length === 0 && meta.olcum !== true) neden.push('senaryo hiç onay içermiyor: check() çağrılmadı (ölçüm betiği mi? module.exports.meta.olcum ile işaretleyin)');
    if (report.harnessError) neden.push('koşucu hatası: ' + report.harnessError);
    if (report.timeout) neden.push(`zaman aşımı (${timeoutS} sn)`);
    const durum = report.timeout ? 'ZAMAN_ASIMI' : report.harnessError ? 'KOSUCU_HATASI' : neden.length ? 'KALDI' : meta.olcum === true ? 'OLCUM' : 'GECTI';
    const cikis = durum === 'GECTI' || durum === 'OLCUM' ? 0 : 1;
    if (!report.timeout && (goruntuKipi === 'hep' || (goruntuKipi === 'kalan' && cikis !== 0 && !ilkGoruntu))) await Promise.race([goruntuAl('son'), new Promise((r) => setTimeout(r, 30000))]);
    report.ms = Date.now() - t0;
    const sayfaHatalari = [];
    for (const [oyuncu, liste] of Object.entries(report.pageErrors)) for (const ileti of liste) sayfaHatalari.push({ oyuncu, ileti });
    Object.assign(report, {
      sema: O.SEMA, senaryo: path.relative(process.cwd(), path.resolve(scenarioPath)) || scenarioPath, meta,
      hedef: { tip: O.hedefTipi(hedefUrl, false, secim['hedef-tip']), url: hedefUrl, verilenUrl: url, gorunum: [W, H], oyuncu: N },
      ortam, tekrar, kontroller,
      hatalar: { konsol: hatalar.konsol, konsolIzinli: hatalar.konsolIzinli, konsolAgEslesen: hatalar.konsolAgEslesen, sayfa: sayfaHatalari, ag: hatalar.ag, agIzinli: hatalar.agIzinli, agIptal: hatalar.agIptal, degerlendirme: report.evalErrors, kesildi: hatalar.kesildi },
      uyarilar: hatalar.uyarilar, uyariSayim: { farkli: hatalar.uyarilar.length, toplam: hatalar.uyariToplam, sinirDisi: hatalar.uyariTasma },
      izinler: O.izinOzeti(izinler), goruntuler,
      sonuc: { durum, cikisKodu: cikis, neden, onaySayisi: report.checks.length, kontrolSayisi: kontroller.length, gecen: kontroller.filter((k) => k.ok).length, kalan: kontroller.filter((k) => !k.ok).length,
        izinsizKonsol: hatalar.sayim.konsol, izinsizAg: hatalar.sayim.ag, izinliKonsol: hatalar.sayim.konsolIzinli, izinliAg: hatalar.sayim.agIzinli,
        evalErrors: report.evalErrors.length, kapaliAtlama: report.kapaliAtlama, kapaliIstisna: report.kapaliIstisna, tur: 'tarayici+webrtc' },
      sure: { hazirMs, toplamMs: report.ms, yerlesmeMs: yerlesmeSure },
    });
    console.log(`checks: ${report.checks.length} fails: ${report.fails} pageErrors: ${pe} (${(report.ms / 1000).toFixed(1)} s)`);
    for (const k of hatalar.konsol.slice(0, 10)) console.log(`IZINSIZ KONSOL ${k.oyuncu} ×${k.sayi}: ${k.ileti.slice(0, 200)}${k.url ? ' @ ' + k.url.slice(0, 160) : ''}`);
    for (const a of hatalar.ag.slice(0, 10)) console.log(`IZINSIZ AG ${a.oyuncu} ×${a.sayi}: ${a.durum || a.hata} ${a.url.slice(0, 200)}`);
    for (const a of hatalar.konsolIzinli.concat(hatalar.agIzinli).slice(0, 10)) console.log(`IZINLI ${a.oyuncu} ×${a.sayi} (${a.izin}): ${(a.ileti || `${a.durum || a.hata} ${a.url}`).slice(0, 160)}`);
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
    console.log(`SONUC: ${sonDurum} (çıkış ${sonCikis}) kontrol ${kontroller.filter((k) => k.ok).length}/${kontroller.length} | ev() istisnası ${report.evalErrors.length}, kapalı sayfa atlama ${report.kapaliAtlama}, kapanışta istisna ${report.kapaliIstisna} | izinsiz konsol ${hatalar.sayim.konsol}, ağ ${hatalar.sayim.ag} | izinli konsol ${hatalar.sayim.konsolIzinli}, ağ ${hatalar.sayim.agIzinli} | uyarı ${hatalar.uyarilar.length} farklı/${hatalar.uyariToplam}${neden.length ? ' | neden: ' + neden.join('; ') : ''}`);
    return sonCikis;
  };
  acilKapanis = (ileti) => { if (!bitti) { report.harnessError = ileti; finish(); } };
  const killer = setTimeout(() => { console.log('TIMEOUT'); report.timeout = true; finish(); }, timeoutS * 1000);
  try {
    const scenario = require(path.resolve(scenarioPath));
    if (typeof scenario !== 'function') throw new Error('senaryo modülü bir işlev dışa aktarmalı (module.exports = async ({...}) => {...})');
    meta = scenario.meta || {};
    senaryoOkundu = true;
    // meta izinleri: gerekçesiz ya da her şeyle eşleşen izin koşucu hatasıdır (A1-09)
    izinler = O.izinleriDerle(meta.izinliHatalar, secim['izin-hata'] || []);
    baslatma = meta.baslatma === undefined ? [] : [].concat(meta.baslatma);
    if (baslatma.some((s) => typeof s !== 'string')) throw new Error('meta.baslatma dizge ya da dizge dizisi olmalı');
    for (const f of secim.baslatma || []) baslatma.push(fs.readFileSync(f, 'utf8'));
    for (let i = 0; i < N; i++) pages.push(await mk(names[i]));
    hazirMs = Date.now() - t0;
    const ev = async (p, js, label, { kapaliIzinli = false } = {}) => {
      if (p.isClosed()) { report.kapaliAtlama++; return undefined; }
      const oyuncu = p.oyuncuAnahtari || p.playerName;
      // sonuç günlüğü döngü/BigInt güvenli (A1-01): eskiden döngüsel bir dönüş değeri JSON.stringify istisnasıyla EVALERR sayılıyordu
      try { const r = await p.evaluate(js); if (label) console.log(`${oyuncu}/${label}`, O.kisa(r, 700)); return r; }
      catch (e) {
        const msg = O.temiz((e && e.message) || e);
        const kapanmaIletisi = /has been closed|Target closed|Target page, context or browser/i.test(msg);
        // kapanma olayı istisnadan hemen sonra işlenebilir: "kapandı" iletisinde sayfanın kapandığını kısa süre bekleyerek doğrula
        if (kapanmaIletisi) for (let i = 0; i < 10 && !p.isClosed(); i++) await new Promise((r) => setTimeout(r, 20));
        if (p.isClosed() || (kapaliIzinli && kapanmaIletisi)) { report.kapaliIstisna++; console.log('EV-KAPALI', oyuncu, label || '', msg.slice(0, 120)); return undefined; }
        report.evalErrors.push({ oyuncu: oyuncu || null, etiket: label || null, js: String(js).slice(0, 400), hata: msg.slice(0, 600) });
        report.fails++;
        console.log('EVALERR', oyuncu, label || '', msg.slice(0, 300));
        ilkBasarisizlik(`EVALERR ${oyuncu}/${label || ''}: ${msg.slice(0, 200)}`);
        return undefined;
      }
    };
    const tick = async (sec = 1) => {
      for (let i = 0; i < sec * 5; i++) {
        for (const p of pages) { if (p.isClosed()) { report.kapaliAtlama++; continue; } await ev(p, 'DK.sim(0.2)'); }
        if (!pages[0].isClosed()) await pages[0].waitForTimeout(40); else await new Promise((r) => setTimeout(r, 40));
      }
    };
    const log = (m) => console.log('[test]', m);
    const check = (label, ok, detail) => {
      // zaman aşımından sonra (rapor yazıldı, tarayıcı kapanıyor) yarıda kalan senaryonun kontrolleri sayılmaz ve PASS/FAIL basmaz
      if (bitti) { console.log('GEC KONTROL (koşu bitmişti; sayılmadı): ' + label); return; }
      // (A1-07) ok bir söz (Promise) ise await unutulmuştur: söz her zaman 'doğru'dur ama değer hiç denetlenmedi → kontrol kalır
      const sozMu = (x) => x !== null && (typeof x === 'object' || typeof x === 'function') && typeof x.then === 'function';
      let hata = null;
      if (sozMu(ok)) { ok.then(() => {}, () => {}); ok = false; hata = "check()'e söz (Promise) verildi: await unutulmuş, değer denetlenmedi"; }
      if (sozMu(detail)) { detail.then(() => {}, () => {}); detail = '(söz: await unutulmuş)'; }
      report.checks.push({ label, ok: !!ok, detail });
      if (!ok) report.fails++;
      console.log((ok ? 'PASS ' : 'FAIL ') + label + (detail !== undefined ? ' → ' + O.kisa(detail, 300) : '') + (hata ? ' [' + hata + ']' : ''));
      const simdi = Date.now();
      const k = { n: report.checks.length, id: O.kimlik(label), etiket: label, ok: !!ok, deger: detail === undefined ? null : detail, beklenen: { truthy: true }, sure_ms: simdi - (sonKontrolT || senaryoT0 || simdi), benzetim: null, tur: 'tarayici+webrtc', hata: ok ? null : (hata || 'kontrol yanlış (false) döndü'), goruntu: null };
      sonKontrolT = simdi;
      kontroller.push(k);
      if (!ok) { const g = ilkBasarisizlik(`FAIL ${label}`); if (g) g.then((x) => { k.goruntu = x; }); }
    };
    senaryoT0 = Date.now();
    await scenario({ pages, host: pages[0], guests: pages.slice(1), ev, tick, log, check, browser: b, mk });
    // (A1-08) yerleşme: son adımın başlattığı eşzamansız işlerin (zamanlayıcı, söz, ağ mesajı) hataları sınıflandırmadan önce gelsin
    if (!bitti && yerlesmeMs > 0 && b.contexts().some((c) => c.pages().some((x) => !x.isClosed()))) {
      const say = () => Object.values(report.pageErrors).reduce((s, a) => s + a.length, 0) + kayitlar.reduce((s, k) => s + k.konsolToplam + k.agToplam, 0);
      const onceSay = say();
      const ty = Date.now();
      await new Promise((r) => setTimeout(r, yerlesmeMs));
      yerlesmeSure = Date.now() - ty;
      if (say() > onceSay) console.log(`YERLESME: senaryodan sonraki ${yerlesmeSure} ms içinde ${say() - onceSay} yeni hata kaydı geldi`);
    }
    await finish();
  } catch (e) {
    if (bitti) { console.log('(kapanış sürerken yarıda kalan senaryo: ' + O.temiz((e && e.message) || e).split('\n')[0].slice(0, 160) + ')'); await bitisSozu; return; }
    console.log('HARNESS ERROR', O.temiz(e.message).slice(0, 500));
    report.harnessError = O.temiz(e.message).slice(0, 500);
    await finish();
  }
})();
