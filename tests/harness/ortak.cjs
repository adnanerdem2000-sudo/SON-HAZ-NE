// Koşucuların (run.cjs, coop.cjs) ortak parçaları — Faz 9 tasarımı §5.6, §6.1–6.3 (Y1; K-11, K-12, K-13).
//   - seçenek ayrıştırma (eski --url/--size/--timeout/--report biçimi aynen; bilinmeyen seçenek hata verir)
//   - testUrl(): test kipini kendiliğinden açar (test=1 ekler, diğer parametreleri bayt bayt korur)
//   - HataKaydi + siniflandir(): konsol hataları, uyarılar (tekilleştirilmiş), ağ hataları (≥ 400 yanıt, requestfailed);
//     izin listesi metin VE adres (location().url) üzerinde eşlenir; adres içermeyen "Failed to load resource" iletisi
//     aynı adresli ağ kaydıyla tekilleştirilir (N9-11)
//   - ortam/tekrar alanları, kontrol kimliği, ekran görüntüsü dizini, rota kökü için MIME türleri
//   - (A1 inceleme düzeltmesi) guvenliJson(): döngüsel başvuru ve BigInt içeren değerleri de yazar (Playwright evaluate ikisini
//     de olduğu gibi döndürür; düz JSON.stringify rapor yazımında istisna atıp koşucuyu asılı bırakıyordu, A1-01);
//     expect/agSay/metrikKarsilastir iç alan denetimi ve karşılaştırıcı (A1-04); izinlerde gerekçe zorunlu, her şeyle eşleşen
//     desen reddedilir, konsol iletisinin konum adresi yalnız "Failed to load resource" iletilerinde eşlenir (A1-09)
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const SEMA = 'dk-test-raporu/2';
const KONSOL_SINIR = 2000;   // ham konsol hatası kaydı üst sınırı (sayım sürer)
const AG_SINIR = 2000;       // ham ağ hatası kaydı üst sınırı
const UYARI_SINIR = 200;     // farklı uyarı iletisi üst sınırı (§6.3-1)

// ---- seçenekler
// tanim: { deger: [tek değerli], cok: [tekrarlanabilir], bayrak: [değersiz] }. Tek değerli seçenekte eski opt() gibi ilk geçiş geçerlidir.
function secenekler(argv, { deger = [], cok = [], bayrak = [] }) {
  const o = { _: [] };
  const bilinmeyen = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--') || a === '--') { o._.push(a); continue; }
    let ad = a.slice(2);
    let v;
    const e = ad.indexOf('=');
    if (e > 0) { v = ad.slice(e + 1); ad = ad.slice(0, e); }
    if (deger.includes(ad) || cok.includes(ad)) {
      if (v === undefined) {
        if (i + 1 >= argv.length) throw new Error(`--${ad} bir değer ister`);
        v = argv[++i];
      }
      if (cok.includes(ad)) (o[ad] = o[ad] || []).push(v);
      else if (!(ad in o)) o[ad] = v;
    } else if (bayrak.includes(ad)) {
      if (v !== undefined) throw new Error(`--${ad} değer almaz`);
      o[ad] = true;
    } else bilinmeyen.push(a);
  }
  return { o, bilinmeyen };
}

// --degisken ad=deger → { ad: deger } (değer JSON olarak çözülebiliyorsa çözülür, yoksa dizge kalır)
function degiskenler(liste) {
  const out = {};
  for (const s of liste || []) {
    const i = s.indexOf('=');
    if (i <= 0) throw new Error(`--degisken ad=deger biçiminde olmalı: ${s}`);
    const ad = s.slice(0, i);
    const ham = s.slice(i + 1);
    let v = ham;
    try { v = JSON.parse(ham); } catch (e) { v = ham; }
    out[ad] = v;
  }
  return out;
}
const degiskenBetigi = (obj) => `window.__KOSUCU = Object.assign(window.__KOSUCU || {}, ${JSON.stringify(obj)});`;

// ---- test kipi adresi (§5.6): http(s) ya da file adresine, test parametresi yoksa test=1 ekler; diğer parametreleri korur
function testUrl(u) {
  let x;
  try { x = new URL(u); } catch (e) { return u; }
  if (!['http:', 'https:', 'file:'].includes(x.protocol)) return u;
  if (x.searchParams.has('test')) return u;
  const h = u.indexOf('#');
  const govde = h >= 0 ? u.slice(0, h) : u;
  const kare = h >= 0 ? u.slice(h) : '';
  const ayrac = !govde.includes('?') ? '?' : (govde.endsWith('?') || govde.endsWith('&') ? '' : '&');
  return govde + ayrac + 'test=1' + kare;
}

// ---- izin listesi
// Kaynaklar: varsayılan (yalnız favicon), senaryo metası izinliHatalar ({desen, gerekce, tur?: 'konsol'|'ag'|'hepsi', bayrak?}
// ya da '<desen> # <gerekçe>' dizgesi), komut satırı --izin-hata '<düzenli ifade> # <gerekçe>'.
// (A1-09) Gerekçe zorunludur. Boş dizgeyle ya da ilgisiz yoklama dizgelerinin hepsiyle eşleşen desen ('.*', 'x|', '(?:)', '.',
// '\d' …) reddedilir: böyle bir izin bütün hataları izinliye taşır ve koşucuyu eski, hata yutan davranışına döndürür.
const VARSAYILAN_IZIN = [{ desen: 'favicon\\.ico(\\?|$)', gerekce: 'Tarayıcının kendiliğinden istediği site simgesi; oyunun işleviyle ilgisiz.', tur: 'ag', kaynak: 'varsayilan' }];
const IZIN_ALANLARI = ['desen', 'gerekce', 'tur', 'bayrak'];
const IZIN_YOKLAMA = ['kosucu-yoklama-7f3a', 'Zq9 0', 'http://127.0.0.1:9/yoklama.png'];
const izinDizgesi = (s, kaynak) => { const i = s.indexOf(' # '); return { desen: i >= 0 ? s.slice(0, i) : s, gerekce: i >= 0 ? s.slice(i + 3).trim() : null, kaynak }; };
function izinleriDerle(metaIzin, cliIzin) {
  const ham = [...VARSAYILAN_IZIN];
  if (metaIzin !== undefined && !Array.isArray(metaIzin)) throw new Error('meta.izinliHatalar bir dizi olmalı');
  for (const x of metaIzin || []) {
    if (typeof x === 'string') { ham.push(izinDizgesi(x, 'meta')); continue; }
    if (!x || typeof x !== 'object' || Array.isArray(x)) throw new Error('meta.izinliHatalar: her öğe {desen, gerekce} nesnesi ya da "<desen> # <gerekçe>" dizgesi olmalı: ' + kisa(x));
    const yabanci = Object.keys(x).filter((k) => !IZIN_ALANLARI.includes(k));
    if (yabanci.length) throw new Error(`meta.izinliHatalar: bilinmeyen alan ${yabanci.join(', ')} (bilinenler: ${IZIN_ALANLARI.join(', ')}): ${kisa(x)}`);
    ham.push({ ...x, kaynak: 'meta' });
  }
  for (const s of cliIzin || []) ham.push(izinDizgesi(s, 'cli'));
  return ham.map((z) => {
    const yer = z.kaynak === 'cli' ? 'izin listesi (--izin-hata)' : z.kaynak === 'meta' ? 'izin listesi (meta.izinliHatalar)' : 'izin listesi';
    if (typeof z.desen !== 'string' || !z.desen) throw new Error(`${yer}: desen dizgesi gerekli: ${kisa(z)}`);
    if (typeof z.gerekce !== 'string' || !z.gerekce.trim()) {
      throw new Error(`${yer}: gerekçe zorunlu (desen ${JSON.stringify(z.desen)}); biçim: ${z.kaynak === 'cli' ? "--izin-hata '<desen> # <gerekçe>'" : '{desen, gerekce} ya da "<desen> # <gerekçe>"'}`);
    }
    const tur = z.tur || 'hepsi';
    if (!['hepsi', 'konsol', 'ag'].includes(tur)) throw new Error(`${yer}: tur 'hepsi' | 'konsol' | 'ag' olmalı: ${kisa(z)}`);
    let re;
    try { re = new RegExp(z.desen, String(z.bayrak || '').replace(/[gy]/g, '')); } catch (e) { throw new Error(`${yer}: geçersiz düzenli ifade ${JSON.stringify(z.desen)}: ${e.message}`); }
    if (re.test('')) throw new Error(`${yer}: desen boş dizgeyle eşleşiyor, yani her iletiyle eşleşir (${JSON.stringify(z.desen)})`);
    if (IZIN_YOKLAMA.every((s) => re.test(s))) throw new Error(`${yer}: desen ilgisiz yoklama dizgelerinin hepsiyle eşleşiyor, çok geniş (${JSON.stringify(z.desen)}; yoklama: ${IZIN_YOKLAMA.join(' | ')})`);
    return { desen: z.desen, gerekce: z.gerekce.trim(), tur, kaynak: z.kaynak, re, eslesme: 0 };
  });
}
function izinBul(izinler, tur, metinler) {
  for (const z of izinler) {
    if (z.tur !== 'hepsi' && z.tur !== tur) continue;
    if (metinler.some((m) => m && z.re.test(m))) { z.eslesme++; return z; }
  }
  return null;
}
const izinOzeti = (izinler) => izinler.map(({ desen, gerekce, tur, kaynak, eslesme }) => ({ desen, gerekce, tur, kaynak, eslesme }));

// ---- hata kaydı (sayfa ya da oyuncu başına)
class HataKaydi {
  constructor(oyuncu = null) {
    this.oyuncu = oyuncu;
    this.konsol = []; this.konsolToplam = 0;
    this.ag = []; this.agToplam = 0;
    this.agIptal = [];
    this.uyari = new Map(); this.uyariToplam = 0; this.uyariTasma = 0;
    this.gezinmede = false;   // koşucunun başlattığı gezinme sürerken (goto): eski belgenin ERR_ABORTED istekleri hata sayılmaz
    this.kapaniyor = false;   // senaryo sekmeyi/bağlamı kapatırken: o sekmenin başarısız istekleri hata sayılmaz
  }
  konsolIletisi(m) {
    const tur = m.type();
    const ileti = m.text();
    let url = null, satir = null;
    try { const l = m.location(); url = l.url || null; satir = l.line ?? l.lineNumber ?? null; } catch (e) { /* konum yok */ }
    let isci = false;
    try { isci = typeof m.worker === 'function' && !!m.worker(); } catch (e) { /* eski sürüm */ }
    if (tur === 'error') {
      this.konsolToplam++;
      if (this.konsol.length < KONSOL_SINIR) this.konsol.push({ oyuncu: this.oyuncu, ileti: ileti.slice(0, 2000), url, satir, isci });
    } else if (tur === 'warning') {
      this.uyariToplam++;
      const k = ileti.slice(0, 600);
      const v = this.uyari.get(k);
      if (v) v.sayi++;
      else if (this.uyari.size < UYARI_SINIR) this.uyari.set(k, { oyuncu: this.oyuncu, ileti: k, url, sayi: 1 });
      else this.uyariTasma++;
    }
  }
  istekBasarisiz(r) {
    const hata = (r.failure() && r.failure().errorText) || '';
    const k = { oyuncu: this.oyuncu, tur: 'basarisiz', url: r.url(), hata, kaynakTuru: safe(() => r.resourceType()), yontem: safe(() => r.method()) };
    if (this.kapaniyor) { this.agIptal.push({ ...k, neden: 'sekme kapanışı' }); return 'iptal'; }
    if (this.gezinmede && /ERR_ABORTED/.test(hata)) { this.agIptal.push({ ...k, neden: 'koşucu gezinmesi' }); return 'iptal'; }
    this.agToplam++;
    if (this.ag.length < AG_SINIR) this.ag.push(k);
    return 'hata';
  }
  yanit(r) {
    const durum = r.status();
    if (durum < 400) return false;
    this.agToplam++;
    if (this.ag.length < AG_SINIR) this.ag.push({ oyuncu: this.oyuncu, tur: 'yanit', url: r.url(), durum, metin: safe(() => r.statusText()), kaynakTuru: safe(() => r.request().resourceType()) });
    return true;
  }
}
function safe(f) { try { return f(); } catch (e) { return null; } }

// Ham kayıtları sınıflandırır: tekilleştirme (aynı ileti/adres → sayi), "Failed to load resource" ↔ ağ kaydı eşlemesi, izin listesi.
function siniflandir(kayitlar, izinler) {
  const h = { konsol: [], konsolIzinli: [], konsolAgEslesen: 0, ag: [], agIzinli: [], agIptal: [], uyarilar: [], uyariToplam: 0, uyariTasma: 0, kesildi: false };
  const ekle = (liste, anahtar, kayit) => {
    const v = liste.find((x) => x._k === anahtar);
    if (v) v.sayi++; else liste.push({ ...kayit, sayi: 1, _k: anahtar });
  };
  for (const K of kayitlar) {
    if (K.konsolToplam > K.konsol.length || K.agToplam > K.ag.length) h.kesildi = true;
    const agAdres = new Set(K.ag.map((a) => a.url));
    for (const c of K.konsol) {
      // Sayfa düzeyindeki 404'ün konsol iletisi adres içermez; adres location().url'dedir. Aynı adresli ağ kaydı varsa yalnız orada sayılır.
      const kaynakYuklenemedi = /^Failed to load resource/.test(c.ileti);
      if (kaynakYuklenemedi && c.url && agAdres.has(c.url)) { h.konsolAgEslesen++; continue; }
      // (A1-09) Konum adresi yalnız "Failed to load resource" iletisinde yüklenemeyen kaynağın adresidir. Öteki iletilerde konum,
      // iletiyi basan betiğin adresidir (ör. js/world/terrain.js); izni ona uygulamak o dosyanın bastığı her hatayı izinli yapardı.
      const z = izinBul(izinler, 'konsol', kaynakYuklenemedi ? [c.ileti, c.url] : [c.ileti]);
      ekle(z ? h.konsolIzinli : h.konsol, `${c.oyuncu}|${c.ileti}|${c.url}`, z ? { ...c, izin: z.desen } : c);
    }
    for (const a of K.ag) {
      const z = izinBul(izinler, 'ag', [a.url, `${a.durum || a.hata} ${a.url}`]);
      ekle(z ? h.agIzinli : h.ag, `${a.oyuncu}|${a.tur}|${a.url}|${a.durum || a.hata}`, z ? { ...a, izin: z.desen } : a);
    }
    for (const a of K.agIptal) ekle(h.agIptal, `${a.oyuncu}|${a.url}|${a.hata}|${a.neden}`, a);
    for (const u of K.uyari.values()) h.uyarilar.push(u);
    h.uyariToplam += K.uyariToplam; h.uyariTasma += K.uyariTasma;
  }
  for (const k of ['konsol', 'konsolIzinli', 'ag', 'agIzinli', 'agIptal']) for (const x of h[k]) delete x._k;
  const say = (a) => a.reduce((s, x) => s + x.sayi, 0);
  h.sayim = { konsol: say(h.konsol), konsolIzinli: say(h.konsolIzinli), ag: say(h.ag), agIzinli: say(h.agIzinli), agIptal: say(h.agIptal) };
  return h;
}

// ---- kontrol kimliği (§6.2): etiketin başındaki kod (K01, D4-01, H07/H22, B02/B-08, E-13/A1, F-07, ek-110); yoksa kısa özet
const HARF = 'A-Za-zÇĞİÖŞÜçğıöşü';
const KOD = new RegExp(`^([${HARF}]{1,4}-?\\d+[a-z]?(?:-\\d+)?(?:\\/[${HARF}]{1,4}-?\\d+[a-z]?(?:-\\d+)?)*)(?=[\\s:,.;)]|$)`);
function kimlik(etiket) {
  const s = String(etiket || '').trim();
  const m = KOD.exec(s);
  if (m) return m[1];
  const ozet = s.split(/\s+/).slice(0, 6).join(' ');
  return ozet.length > 48 ? ozet.slice(0, 48) : ozet || null;
}

// ---- ortam (§6.1)
function git(dizin) {
  const g = (...a) => execFileSync('git', ['-C', dizin, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 15000 }).trim();
  const out = { commit: null, dal: null, kirli: null };
  try { out.commit = g('rev-parse', 'HEAD'); } catch (e) { return out; }
  try { out.dal = g('rev-parse', '--abbrev-ref', 'HEAD'); } catch (e) { /* yok */ }
  try { out.kirli = g('status', '--porcelain').length > 0; } catch (e) { /* yok */ }
  return out;
}
async function ortamBilgisi(browser, { kosucuDizin, gorunum, chromium }) {
  let gl = null;
  try {
    const ctx = await browser.newContext();
    const gp = await ctx.newPage();
    gl = await gp.evaluate(() => {
      const c = document.createElement('canvas');
      const g = c.getContext('webgl2') || c.getContext('webgl');
      if (!g) return null;
      const e = g.getExtension('WEBGL_debug_renderer_info');
      const r = { surum: g.getParameter(g.VERSION), uretici: e ? g.getParameter(e.UNMASKED_VENDOR_WEBGL) : g.getParameter(g.VENDOR), cizici: e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER) };
      const l = g.getExtension('WEBGL_lose_context');
      if (l) l.loseContext();
      return r;
    });
    await ctx.close();
  } catch (e) { gl = { hata: String(e.message || e).slice(0, 200) }; }
  let playwright = null;
  try { playwright = require('playwright/package.json').version; } catch (e) { /* yok */ }
  let yol = null;
  try { yol = chromium.executablePath(); } catch (e) { /* yok */ }
  const gk = git(kosucuDizin);
  const cizici = gl && gl.cizici ? String(gl.cizici) : null;
  return {
    makine: process.env.CI ? 'ci' : 'yerel', isletim: `${os.platform()} ${os.release()}`, cekirdek: os.cpus().length,
    bellekGB: Math.round(os.totalmem() / 1073741824), node: process.version, playwright,
    tarayici: `${yol && /headless_shell/.test(yol) ? 'chromium-headless-shell' : 'chromium'} ${safe(() => browser.version())}`,
    gl: cizici, glSurum: gl && gl.surum ? gl.surum : null, glHata: gl && gl.hata ? gl.hata : undefined,
    gercekGPU: cizici ? !/SwiftShader|llvmpipe|softpipe|Software|Microsoft Basic/i.test(cizici) : false,
    gorunum, ci: !!process.env.CI, commit: gk.commit, dal: gk.dal, kirli: gk.kirli, tarih: new Date().toISOString(),
  };
}

// ---- hedef türü (§6.1): moduler, tek-test, tek-uretim, site, canli
function hedefTipi(u, uretim, verilen) {
  if (verilen) return verilen;
  try {
    const x = new URL(u);
    if (x.protocol === 'file:' || /DenizKorsanlari-SonHazine(\.test)?\.html$/i.test(x.pathname)) return uretim ? 'tek-uretim' : 'tek-test';
    if (!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(x.hostname)) return 'canli';
    if (/\/_site\//.test(x.pathname)) return 'site';
    return 'moduler';
  } catch (e) { return null; }
}

// ---- tekrar (§6.1): tam komut (mutlak senaryo yolu), çalışma dizini, sunucu ipuçları, commit
function tekrarBilgisi({ kosucuDosya, argv, senaryoArg, url, coop, ortam }) {
  const q = (s) => (/^[\w@%+=:,./-]+$/.test(String(s)) ? String(s) : `'${String(s).replace(/'/g, `'\\''`)}'`);
  const args = argv.map((a) => (a === senaryoArg ? path.resolve(a) : a));
  const sunucular = [];
  try {
    const x = new URL(url);
    if (/^https?:$/.test(x.protocol) && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(x.hostname)) {
      sunucular.push(`statik sunucu ${x.origin} — sunulan ağacın kökünde: python3 -m http.server --bind 127.0.0.1 ${x.port || 80}`);
    }
    if (coop) sunucular.push(`PeerJS sinyal sunucusu ${x.searchParams.get('peerhost') || '127.0.0.1'}:${x.searchParams.get('peerport') || 9000} — node tests/peer-server.cjs (peer modülü NODE_PATH'te)`);
  } catch (e) { /* adres çözülemedi */ }
  let senaryoSha256 = null;
  try { senaryoSha256 = crypto.createHash('sha256').update(fs.readFileSync(senaryoArg)).digest('hex'); } catch (e) { /* yok */ }
  return {
    komut: ['node', kosucuDosya, ...args].map(q).join(' '), cwd: process.cwd(), sunucular,
    commit: ortam && ortam.commit ? ortam.commit + (ortam.kirli ? '-kirli' : '') : null, senaryoSha256, adim: null, url,
  };
}

// ---- ekran görüntüsü dizini (png'ler depoya girmez: tests/out/ git dışı)
function goruntuDizini(kosucuDizin, senaryoYolu, secilen) {
  if (secilen) return path.resolve(secilen);
  const ad = path.basename(String(senaryoYolu || 'senaryo')).replace(/\.(c?js|mjs)$/, '');
  const zaman = new Date().toISOString().replace(/[:.]/g, '-');
  return path.resolve(kosucuDizin, '..', 'out', 'goruntu', `${ad}_${zaman}_${process.pid}`);
}

// ---- rota kökü (rotaKok adımı) için MIME türleri
const MIME = {
  '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.map': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf', '.txt': 'text/plain; charset=utf-8', '.wasm': 'application/wasm',
};
const mime = (dosya) => MIME[path.extname(dosya).toLowerCase()] || 'application/octet-stream';

// Playwright çağrı günlüğündeki ANSI renk kodlarını hata iletilerinden ayıklar
const temiz = (s) => String(s).replace(/\u001b\[[0-9;]*m/g, '');

// ---- güvenli JSON (A1-01): döngüsel başvuru → "[Döngüsel]", BigInt → "<sayı>n". Yalnız gerçek döngüler (atası olan nesne)
// değiştirilir; aynı nesnenin iki yerde geçmesi döngü değildir ve iki kez yazılır (düz JSON.stringify gibi).
// durum verilirse değiştirilen öğe sayıları ona yazılır: { dongu, bigint }.
const DONGUSEL = '[Döngüsel]';
function guvenliJson(deger, bosluk, durum) {
  const atalar = [];
  return JSON.stringify(deger, function (anahtar, v) {
    if (typeof v === 'bigint') { if (durum) durum.bigint = (durum.bigint || 0) + 1; return v.toString() + 'n'; }
    if (v !== null && typeof v === 'object') {
      while (atalar.length && atalar[atalar.length - 1] !== this) atalar.pop();
      if (atalar.includes(v)) { if (durum) durum.dongu = (durum.dongu || 0) + 1; return DONGUSEL; }
      atalar.push(v);
    }
    return v;
  }, bosluk);
}
const kisa = (v, n = 300) => { let s; try { s = guvenliJson(v); } catch (e) { s = String(v); } return s === undefined ? 'undefined' : s.slice(0, n); };

// ---- onay adımlarının iç alan denetimi (A1-04). Senaryo okunurken çağrılır; hata → KOSUCU_HATASI (adımlar koşmadan).
// Yazım hatalı karşılaştırıcı ('truthly'), karşılaştırıcısız expect ve sınırsız agSay/metrikKarsilastir eskiden sessizce GEÇİYORDU.
const EXPECT_ALANLARI = ['js', 'label', 'eq', 'truthy', 'gte', 'lte'];
const AGSAY_ALANLARI = ['desen', 'enCok', 'enAz', 'sonGezinmeden', 'label'];
const METRIK_ALANLARI = ['once', 'sonra', 'alan', 'enCokFark', 'enAzFark', 'label'];
const sonluSayi = (x) => typeof x === 'number' && Number.isFinite(x);
function alanDenetle(o, izinli, ad, yer) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) throw new Error(`${yer}: ${ad} bir nesne olmalı`);
  const yabanci = Object.keys(o).filter((k) => !izinli.includes(k));
  if (yabanci.length) throw new Error(`${yer}: ${ad} içinde bilinmeyen alan ${yabanci.join(', ')} (yazım hatası mı? bilinenler: ${izinli.join(', ')})`);
  if ('label' in o && typeof o.label !== 'string') throw new Error(`${yer}: ${ad}.label dizge olmalı`);
}
function onayDenetle(s, yer) {
  if (s.expect !== undefined) {
    const E = s.expect;
    alanDenetle(E, EXPECT_ALANLARI, 'expect', yer);
    if (typeof E.js !== 'string' || !E.js.trim()) throw new Error(`${yer}: expect.js boş olmayan bir dizge olmalı`);
    if (!['eq', 'truthy', 'gte', 'lte'].some((k) => k in E)) throw new Error(`${yer}: expect'te karşılaştırıcı yok (eq, truthy, gte ya da lte gerekli)`);
    if ('truthy' in E && E.truthy !== true) throw new Error(`${yer}: expect.truthy yalnız true olabilir (yanlışlık için eq: false ya da olumsuzlanmış js kullanın)`);
    for (const k of ['gte', 'lte']) if (k in E && !sonluSayi(E[k])) throw new Error(`${yer}: expect.${k} sonlu bir sayı olmalı (gelen ${kisa(E[k], 60)})`);
  }
  if (s.agSay !== undefined) {
    const a = s.agSay;
    alanDenetle(a, AGSAY_ALANLARI, 'agSay', yer);
    if (typeof a.desen !== 'string' || !a.desen) throw new Error(`${yer}: agSay.desen boş olmayan bir düzenli ifade dizgesi olmalı`);
    try { new RegExp(a.desen); } catch (e) { throw new Error(`${yer}: agSay.desen geçersiz düzenli ifade: ${e.message}`); }
    if (!('enCok' in a) && !('enAz' in a)) throw new Error(`${yer}: agSay'de sınır yok (enCok ya da enAz gerekli)`);
    for (const k of ['enCok', 'enAz']) if (k in a && !sonluSayi(a[k])) throw new Error(`${yer}: agSay.${k} sonlu bir sayı olmalı`);
  }
  if (s.metrikKarsilastir !== undefined) {
    const m = s.metrikKarsilastir;
    alanDenetle(m, METRIK_ALANLARI, 'metrikKarsilastir', yer);
    for (const k of ['once', 'sonra', 'alan']) if (typeof m[k] !== 'string' || !m[k]) throw new Error(`${yer}: metrikKarsilastir.${k} boş olmayan bir dizge olmalı`);
    if (!('enCokFark' in m) && !('enAzFark' in m)) throw new Error(`${yer}: metrikKarsilastir'da sınır yok (enCokFark ya da enAzFark gerekli)`);
    for (const k of ['enCokFark', 'enAzFark']) if (k in m && !sonluSayi(m[k])) throw new Error(`${yer}: metrikKarsilastir.${k} sonlu bir sayı olmalı`);
  }
}
// expect karşılaştırıcısı: verilen BÜTÜN karşılaştırıcılar sağlanmalı (eskiden yalnız sonuncusu uygulanıyordu: gte+lte'de gte yok
// sayılıyordu). gte/lte yalnız sonlu sayılarla karşılaştırır: null >= 0, [] <= 5, '' >= 0 JS'te true'dur ama onay değildir.
// eq: JSON gösterimleri eşit olmalı; değer JSON'a çevrilemiyorsa (döngüsel, BigInt) karşılaştırma yapılamaz → kalır.
function karsilastir(v, E) {
  const sorun = [];
  if ('eq' in E) {
    let a, b, hata = null;
    try { a = JSON.stringify(v); b = JSON.stringify(E.eq); } catch (e) { hata = String(e.message).split('\n')[0]; }
    if (hata) sorun.push(`eq karşılaştırılamadı: değer JSON'a çevrilemiyor (${hata})`);
    else if (a !== b) sorun.push(`eq ${kisa(E.eq, 120)}`);
  }
  if (E.truthy === true && !v) sorun.push('truthy');
  for (const k of ['gte', 'lte']) {
    if (!(k in E)) continue;
    if (!sonluSayi(v)) { sorun.push(`${k} ${E[k]}: değer sonlu bir sayı değil (${v === null ? 'null' : typeof v === 'number' ? String(v) : typeof v})`); continue; }
    if (k === 'gte' ? !(v >= E.gte) : !(v <= E.lte)) sorun.push(`${k} ${E[k]}`);
  }
  return { ok: sorun.length === 0, sorun };
}

module.exports = {
  SEMA, secenekler, degiskenler, degiskenBetigi, testUrl, izinleriDerle, izinOzeti, HataKaydi, siniflandir, kimlik,
  ortamBilgisi, hedefTipi, tekrarBilgisi, goruntuDizini, mime, kisa, temiz, git, guvenliJson, DONGUSEL, onayDenetle, karsilastir,
};
