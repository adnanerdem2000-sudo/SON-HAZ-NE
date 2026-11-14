// Test kipi denetimi (Faz 9 tasarımı §5.3, §5.7-1, §5.7-2; K-07, K-08, K9-3, K9-20). Tarayıcı açmaz.
//
//   node tests/node/test_kipi.mjs [--agac <dizin>] [--taban 44d548c] [--taban-main <dosya>] [--rapor <özet.json>]
//   --taban-main: taban main.js git yerine bu dosyadan okunur (git geçmişi olmayan sığ klonlar ve araç sınamaları için).
//
// Beş bölüm:
//  (i)  Modül kuralları (§5.3), js/** üzerinde statik tarama:
//       K1 teste özgü kod (window.DK kurulumu, __sayac, işaret dizgesi) yalnız js/test/ altında ya da saplanan
//          js/net/netTest.js, js/net/netShape.js dosyalarında durur (Object.assign/defineProperty/Reflect.set ile global nesneye DK
//          yazmak, window['DK'] = … ve DK anahtarlı nesne değişmezi de kurulumdur);
//       K2 bu modüller yalnız geçerli if (TEST …) bloğundaki dinamik import() ile yüklenir (koşul yalnız TEST ya da en üst düzeyde
//          TEST && …), dışarıya yalnız install (kancalar.js'te ek olarak MARK) verir; oyun kodu onları statik içe aktarmaz (göreli,
//          '/' ile başlayan ve tam adresli belirteçler); TEST js/core/testmode.js'ten gelir;
//       K3 oyun kodu window.DK'yi hiçbir yerde okumaz (herhangi bir nesnenin .DK / ?.DK özelliği, çıplak DK, 'DK' dizgesi);
//       K4 oyun kodunda sayfa adresinin sorgusu yalnız js/core/testmode.js'te ve js/main.js'teki
//          new URLSearchParams(location.search).get('join') ile okunur: location yalnız origin/pathname/protocol/hostname/host/port/
//          reload üyeleriyle kullanılır; location.search/href/hash, location[…], document.URL/documentURI/baseURI, URLSearchParams,
//          searchParams yasaktır;
//       K5 test kancası globalleri (window.__DK_*; üretim bayrağı __DK_SINGLE_FILE hariç) yalnız geçerli if (TEST …) bloğunda ya da
//          TEST ? … : … ifadesinin doğru dalında okunur.
//  (ii) Doğruluk tablosu: GERÇEK js/core/testmode.js kaynağı node:vm ile, location taklidiyle yüklenir; tespit()/TEST ve
//       testParam() §5.3 tablosunun 10 durumu ve ek durumlarla sınanır. Kaynak değiştirilmeden yalnız 'export' anahtar sözcükleri
//       kaldırılır (vm betiği modül sözdizimi kabul etmez); modülde içe aktarma varsa bu yöntem uygulanamaz ve denetim KALIR.
//  (iii) API eşliği (§5.7-1): `git show <taban>:js/main.js` içindeki window.DK nesnesinin anahtarları (49) ile kancalar.js'in
//       kurduğu anahtarlar (main.js'teki install({...}) çağrısı + kancalar.js'teki window.DK.<ad> atamaları) statik ayrıştırmayla
//       karşılaştırılır: eksik 0, fazla tam olarak audio, mod, __sayac. snap/snapFrom/sim/tap/press gövdeleri tabandaki
//       main.js:136-152 ile (boşluk normalleştirilerek) aynı olmalıdır. Zamanlama (§5.7-2): kancalar modülünün sözü beklenir
//       (doğrudan 'await import()' ya da sözün atandığı değişken için 'await <ad>'), install ondan sonra, window.__ready de
//       install'dan SONRA yazılır (ZM). ZM2 (A2-UY-02): bekleme ve install boot() içinde yükleme ekranı kaldırılmadan ve
//       menu.show(true)'dan ÖNCE yapılır; kancalar yüklenemez ya da kurulamazsa hata görünür yükleme ekranında kalır.
//  (iv) Sinyal sunucusu kuralı (K9-20): GERÇEK net.js'teki GERI_DONGU + testSinyali() node:vm'de 36 durumla koşulur; kabul edilen
//       seçenekler GERÇEK PeerJS (vendor) yol/URL kurma ifadeleriyle adrese çevrilir ve konağın geri döngü olduğu denetlenir (SN01…);
//       SN00 yapıyı denetler (testParam('peer…') yalnız testSinyali'nde, her new Peer(…) seçeneği peerOpts()'tan). --agac ile verilen
//       ağaçta vendor/peerjs/peerjs.min.js de bulunmalıdır.
//  (v)  Öz-sınama (NS01…): A2 incelemesinin mutasyonları ve ekler bellekteki bozulmuş kopyalara uygulanır (dosyaya yazılmaz);
//       beklenen kural kırmızıya dönmezse (kural o biçimi kaçırıyorsa) öz-sınama KALIR. Kuralların yanlış GEÇTİ vermediği böylece
//       her koşuda yeniden gösterilir.
// (A2 inceleme düzeltmeleri: A2-G-01, A2-G-02, A2-UY-01, A2-UY-02. Kurallar sözdizimseldir; dolaylı erişimler — takma adlı global,
//  hesaplanmış özellik adı — tarayıcıdaki 53_test_kipi uçtan uca denetimlerine kalır.)
//
// Dosya yoksa (ör. Y3 öncesi) araç çökmez: ilgili denetim açık nedenle KALIR. Çözümleyici (yorum, dizge, şablon ve düzenli ifade
// ayıklayan küçük bir tarayıcı) bir dosyayı dengeli çözemezse o dosyanın denetimi KALIR; yanlış "geçti" üretilmez.
// Çıkış: bütün denetimler geçerse 0 (GECTI), değilse 1 (KALDI). Kullanım hatası 2.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const sec = (ad, varsayilan) => { const i = argv.indexOf('--' + ad); return i >= 0 ? argv[i + 1] : varsayilan; };
const bilinen = new Set(['--agac', '--taban', '--taban-main', '--rapor']);
for (let i = 0; i < argv.length; i += 2) if (!bilinen.has(argv[i]) || argv[i + 1] === undefined) { console.error('Kullanım: node tests/node/test_kipi.mjs [--agac <dizin>] [--taban 44d548c] [--taban-main <dosya>] [--rapor <özet.json>]'); process.exit(2); }
const AGAC = path.resolve(sec('agac', path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')));
const TABAN = sec('taban', '44d548c');
const RAPOR = sec('rapor', null);
const TABAN_MAIN = sec('taban-main', null);

const TEST_MODULLERI_EK = ['js/net/netTest.js', 'js/net/netShape.js'];   // saplama düzenli ifadesindeki dosyalar (§5.3-1)
const KANCALAR = 'js/test/kancalar.js';
const TESTMODE = 'js/core/testmode.js';
const MAIN = 'js/main.js';
const YARDIMCILAR = ['snap', 'snapFrom', 'sim', 'tap', 'press'];
const IZINLI_FAZLA = ['audio', 'mod', '__sayac'];

const denetimler = [];
const ekle = (id, ad, ok, ayrinti) => { denetimler.push({ id, ad, ok: !!ok, ayrinti }); };
const kisa = (v, n = 400) => { const s = typeof v === 'string' ? v : JSON.stringify(v); return s === undefined ? 'undefined' : s.length > n ? s.slice(0, n) + '…' : s; };

// ---------------------------------------------------------------- çözümleyici
// Kaynağı aynı uzunlukta bir "kod" dizgesine çevirir: yorumlar, dizge/şablon metni ve düzenli ifade değişmezleri boşlukla
// maskelenir (satır sonları korunur, konumlar değişmez). Şablonların ${…} içi koddur. Dizge değişmezleri ayrıca konum ve
// değerleriyle döner (içe aktarma belirteci, 'join' vb. için).
const KELIME_SONRA_REGEX = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'case', 'do', 'else', 'yield', 'await']);
function cozumle(src) {
  const n = src.length;
  const kod = src.split('');
  const dizgeler = [];
  const hatalar = [];
  const maskele = (a, b) => { for (let k = a; k < b; k++) if (kod[k] !== '\n') kod[k] = ' '; };
  const sablonYigini = [];   // her ${ için o anki { derinliği
  let derinlik = 0;
  let son = '';              // son anlamlı kod öğesi (regex/bölme ayrımı)
  let i = 0;
  const sablonOku = (bas) => {   // bas: ` ya da } konumu; şablon metnini ${ ya da kapanış `'a kadar okur
    let j = bas + 1;
    let deger = '';
    while (j < n) {
      const c = src[j];
      if (c === '\\') { deger += src.slice(j, j + 2); j += 2; continue; }
      if (c === '`') { maskele(bas, j + 1); dizgeler.push({ bas, son: j + 1, deger, tur: 'sablon' }); return { j: j + 1, acik: false }; }
      if (c === '$' && src[j + 1] === '{') { maskele(bas, j + 2); dizgeler.push({ bas, son: j + 2, deger, tur: 'sablon-parca' }); return { j: j + 2, acik: true }; }
      deger += c; j++;
    }
    hatalar.push(`kapanmamış şablon (konum ${bas})`);
    maskele(bas, n);
    return { j: n, acik: false };
  };
  while (i < n) {
    const c = src[i];
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { i++; continue; }
    if (c === '/' && src[i + 1] === '/') { const e = src.indexOf('\n', i); const s = e < 0 ? n : e; maskele(i, s); i = s; continue; }
    if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); if (e < 0) { hatalar.push(`kapanmamış yorum (konum ${i})`); maskele(i, n); i = n; continue; } maskele(i, e + 2); i = e + 2; continue; }
    if (c === '\'' || c === '"') {
      let j = i + 1, deger = '';
      while (j < n && src[j] !== c) {
        if (src[j] === '\\') { deger += src.slice(j, j + 2); j += 2; continue; }
        if (src[j] === '\n') break;
        deger += src[j]; j++;
      }
      if (src[j] !== c) { hatalar.push(`kapanmamış dizge (konum ${i})`); maskele(i, j); i = j; continue; }
      maskele(i, j + 1); dizgeler.push({ bas: i, son: j + 1, deger, tur: c === '\'' ? 'tek' : 'cift' });
      i = j + 1; son = 'dizge'; continue;
    }
    if (c === '`') { const r = sablonOku(i); if (r.acik) { sablonYigini.push(derinlik); son = '('; } else son = 'dizge'; i = r.j; continue; }
    if (c === '{') { derinlik++; son = '{'; i++; continue; }
    if (c === '}') {
      if (sablonYigini.length && sablonYigini[sablonYigini.length - 1] === derinlik) {
        sablonYigini.pop();
        const r = sablonOku(i);
        if (r.acik) { sablonYigini.push(derinlik); son = '('; } else son = 'dizge';
        i = r.j; continue;
      }
      derinlik--; son = '}'; i++; continue;
    }
    if (c === '/') {
      const regex = son === '' || son === '}' || (/^[\w$]+$/.test(son) ? KELIME_SONRA_REGEX.has(son) : !(son === ')' || son === ']' || son === 'dizge' || son === 'regex'));
      if (regex) {
        let j = i + 1, sinif = false;
        while (j < n) {
          const d = src[j];
          if (d === '\\') { j += 2; continue; }
          if (d === '\n') break;
          if (sinif) { if (d === ']') sinif = false; }
          else if (d === '[') sinif = true;
          else if (d === '/') break;
          j++;
        }
        if (src[j] !== '/') { hatalar.push(`kapanmamış düzenli ifade (konum ${i})`); i++; son = '/'; continue; }
        j++;
        while (j < n && /[a-z]/.test(src[j])) j++;
        maskele(i, j); i = j; son = 'regex'; continue;
      }
      son = '/'; i++; continue;
    }
    if (/[A-Za-z0-9_$]/.test(c)) { let j = i; while (j < n && /[A-Za-z0-9_$]/.test(src[j])) j++; son = src.slice(i, j); i = j; continue; }
    son = c; i++;
  }
  const k = kod.join('');
  // denge denetimi: maskelenmiş kodda parantezler dengeli olmalı (çözümleyici yanlış anladıysa yakalanır)
  for (const [a, b] of [['{', '}'], ['(', ')'], ['[', ']']]) {
    let s = 0;
    for (const ch of k) { if (ch === a) s++; else if (ch === b) s--; if (s < 0) break; }
    if (s !== 0) hatalar.push(`dengesiz ${a}${b} (fark ${s})`);
  }
  if (sablonYigini.length) hatalar.push('kapanmamış şablon ifadesi');
  return { kod: k, dizgeler, hatalar, src };
}
const satirNo = (src, konum) => src.slice(0, konum).split('\n').length;
// konumdaki açan parantezin ({ ( [) eşini bulur (maskelenmiş kodda)
function esi(kod, konum) {
  const ac = kod[konum], kapa = { '{': '}', '(': ')', '[': ']' }[ac];
  let s = 0;
  for (let j = konum; j < kod.length; j++) { if (kod[j] === ac) s++; else if (kod[j] === kapa) { s--; if (s === 0) return j; } }
  return -1;
}
const sonrakiDizge = (c, konum) => c.dizgeler.find((d) => d.bas >= konum);
const ilkAnlamli = (kod, konum) => { let j = konum; while (j < kod.length && /\s/.test(kod[j])) j++; return j; };
// maskelenmiş dizgeleri atlamamak için boşluk ÖZGÜN kaynakta aranır (yorum varsa durur: belirteç 'değişmez değil' sayılır, güvenli yön)
const ilkAnlamliKaynak = (src, konum) => { let j = konum; while (j < src.length && /\s/.test(src[j])) j++; return j; };
// en üst düzeyde (derinlik 0) virgülle böl
function ustDuzeyBol(kod, a, b) {
  const parcalar = [];
  let s = 0, bas = a;
  for (let j = a; j < b; j++) {
    const ch = kod[j];
    if ('{(['.includes(ch)) s++; else if ('})]'.includes(ch)) s--;
    else if (ch === ',' && s === 0) { parcalar.push([bas, j]); bas = j + 1; }
  }
  parcalar.push([bas, b]);
  return parcalar.filter(([x, y]) => kod.slice(x, y).trim());
}
// { … } nesne değişmezinin anahtarları: kısa yazım (ad), ad: değer, ...yayılım
function nesneAnahtarlari(c, acik) {
  const kapa = esi(c.kod, acik);
  if (kapa < 0) return null;
  const anahtarlar = [], yayilimlar = [], tanimsiz = [];
  for (const [x, y] of ustDuzeyBol(c.kod, acik + 1, kapa)) {
    const p = c.kod.slice(x, y).trim();
    let m;
    if ((m = /^\.\.\.\s*([A-Za-z_$][\w$]*)$/.exec(p))) yayilimlar.push(m[1]);
    else if ((m = /^([A-Za-z_$][\w$]*)$/.exec(p))) anahtarlar.push(m[1]);
    else if ((m = /^([A-Za-z_$][\w$]*)\s*:/.exec(p))) anahtarlar.push(m[1]);
    else tanimsiz.push(c.src.slice(x, y).trim().slice(0, 60));
  }
  return { anahtarlar, yayilimlar, tanimsiz, kapa };
}
const normal = (s) => s.replace(/\s+/g, ' ').trim();
// atama ifadesinin sağ tarafı: '=' sonrasından derinlik 0'daki ';' ya da satır sonuna kadar
function sagTaraf(c, esitKonum) {
  let s = 0;
  for (let j = esitKonum + 1; j < c.kod.length; j++) {
    const ch = c.kod[j];
    if ('{(['.includes(ch)) s++; else if ('})]'.includes(ch)) { if (s === 0) return { bas: esitKonum + 1, son: j }; s--; }
    else if (ch === ';' && s === 0) return { bas: esitKonum + 1, son: j };
  }
  return { bas: esitKonum + 1, son: c.kod.length };
}
// ad.alt = … atamaları (== ve => hariç)
function atamalar(c, onekDuzenli) {
  const out = [];
  const re = new RegExp(onekDuzenli.source + '\\s*\\.\\s*([A-Za-z_$][\\w$]*)\\s*=(?![=>])', 'g');
  let m;
  while ((m = re.exec(c.kod))) {
    const esit = m.index + m[0].length - 1;
    const r = sagTaraf(c, esit);
    out.push({ ad: m[1], konum: m.index, satir: satirNo(c.src, m.index), sag: c.src.slice(r.bas, r.son) });
  }
  return out;
}

// ---------------------------------------------------------------- dosyalar
function yuru(dizin) {
  const out = [];
  if (!fs.existsSync(dizin)) return out;
  for (const ad of fs.readdirSync(dizin).sort()) {
    const p = path.join(dizin, ad);
    const st = fs.statSync(p);
    if (st.isDirectory()) out.push(...yuru(p)); else if (/\.(m?js)$/.test(ad)) out.push(p);
  }
  return out;
}
const goreli = (p) => path.relative(AGAC, p).split(path.sep).join('/');
const testModuluMu = (r) => r.startsWith('js/test/') || TEST_MODULLERI_EK.includes(r);
const dosyalar = yuru(path.join(AGAC, 'js')).map((p) => ({ yol: goreli(p), c: cozumle(fs.readFileSync(p, 'utf8')) }));
const cozumHatasi = dosyalar.filter((d) => d.c.hatalar.length);
ekle('C0', 'Çözümleyici js/** dosyalarının hepsini dengeli çözdü', dosyalar.length > 0 && cozumHatasi.length === 0,
  dosyalar.length === 0 ? 'js/ altında dosya yok' : cozumHatasi.length ? cozumHatasi.map((d) => `${d.yol}: ${d.c.hatalar.join('; ')}`) : `${dosyalar.length} dosya`);
const dosya = (r) => dosyalar.find((d) => d.yol === r) || null;
const cozulebilir = (d) => d && d.c.hatalar.length === 0;

// içe aktarma belirtecini ağaç içi dosya yoluna çevir. Göreli belirteç dosyanın dizinine, '/' ile başlayan belirteç ağacın köküne
// (sayfa kökü; A2-UY-01: eskiden dosya sisteminin köküne çözülüyor ve '/js/test/…' test modülü sayılmıyordu) göre çözülür. Tam adres
// (http:, https:, file: …) yolunda '/js/' geçiyorsa oradan sonrası alınır (ör. http://localhost:8081/js/test/kancalar.js →
// js/test/kancalar.js); 'three' gibi çıplak adlar ve '/js/' içermeyen adresler null.
const coz = (kimden, belirtec) => {
  if (belirtec.startsWith('.')) return goreli(path.resolve(path.dirname(path.join(AGAC, kimden)), belirtec));
  if (belirtec.startsWith('/') && !belirtec.startsWith('//')) return goreli(path.join(AGAC, belirtec));
  if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(belirtec) || /^[a-z][a-z0-9+.-]*:/i.test(belirtec)) {
    let p = null;
    try { p = decodeURIComponent(new URL(belirtec, 'http://kok.yok/').pathname); } catch (e) { return null; }
    const i = p.indexOf('/js/');
    return i >= 0 ? path.posix.normalize(p.slice(i + 1)) : null;
  }
  return null;
};
function statikIceAktarmalar(d) {
  const out = [];
  const k = d.c.kod;
  // import … from 'x' / export … from 'x'
  let m;
  const reFrom = /\bfrom\s*$/;
  const anahtar = [];
  const reAnahtar = /\b(?:import|export)\b/g;
  while ((m = reAnahtar.exec(k))) anahtar.push(m.index);
  for (const s of d.c.dizgeler) {
    if (s.tur !== 'tek' && s.tur !== 'cift') continue;
    const once = k.slice(Math.max(0, s.bas - 12), s.bas);
    if (reFrom.test(once)) {
      // ifadenin başı: bu 'from'dan önceki son import/export anahtar sözcüğü
      let bas = 0;
      for (const a of anahtar) { if (a < s.bas) bas = a; else break; }
      out.push({ belirtec: s.deger, konum: s.bas, satir: satirNo(d.c.src, s.bas), cumle: k.slice(bas, s.bas) });
    }
  }
  // import 'x' (yan etkili)
  const reYan = /\bimport\s*$/;
  for (const s of d.c.dizgeler) {
    if (s.tur !== 'tek' && s.tur !== 'cift') continue;
    const once = k.slice(Math.max(0, s.bas - 10), s.bas);
    if (reYan.test(once) && !/\.\s*import\s*$/.test(once)) out.push({ belirtec: s.deger, konum: s.bas, satir: satirNo(d.c.src, s.bas), cumle: 'import' });
  }
  void m;
  return out;
}
function dinamikIceAktarmalar(d) {
  const out = [];
  const re = /(^|[^.\w$])import\s*\(/g;
  let m;
  while ((m = re.exec(d.c.kod))) {
    const ac = m.index + m[0].length - 1;
    const j = ilkAnlamliKaynak(d.c.src, ac + 1);
    const s = d.c.dizgeler.find((x) => x.bas === j && (x.tur === 'tek' || x.tur === 'cift'));
    let degismez = false;
    if (s) { const sonra = ilkAnlamli(d.c.kod, s.son); degismez = d.c.kod[sonra] === ')'; }
    const once = d.c.kod.slice(Math.max(0, m.index - 12), m.index + m[1].length);
    out.push({ belirtec: degismez ? s.deger : null, konum: ac, satir: satirNo(d.c.src, ac), bekleniyor: /\bawait\s*$/.test(once) });
  }
  return out;
}
// if (TEST …) { … } bloklarının aralıkları. Koşul yalnız 'TEST' ya da en üst düzeyde 'TEST && …' olabilir (A2-G-02): TEST bir
// karşılaştırmanın ya da işlemin içinde geçerse (TEST !== undefined, TEST == x, TEST + 1, TEST, 1 …) koşul TEST false iken de doğru
// olabilir; en üst düzeyde || , ?: ya da ?? varsa TEST atlanabilir. Bu bloklar geçersiz sayılır.
function testBloklari(d) {
  const out = [];
  const re = /\bif\s*\(\s*TEST\b/g;
  let m;
  while ((m = re.exec(d.c.kod))) {
    const ac = d.c.kod.indexOf('(', m.index);
    const kapa = esi(d.c.kod, ac);
    if (kapa < 0) continue;
    const kosul = d.c.kod.slice(ac + 1, kapa);
    let s = 0, gecersiz = !/^\s*TEST\s*(?:&&|$)/.test(kosul) || /^\s*TEST\s*&&\s*$/.test(kosul);
    for (let j = 0; j < kosul.length; j++) { const ch = kosul[j]; if ('{(['.includes(ch)) s++; else if ('})]'.includes(ch)) s--; else if (s === 0 && ((ch === '|' && kosul[j + 1] === '|') || ch === '?' || ch === ',')) gecersiz = true; }
    const b = ilkAnlamli(d.c.kod, kapa + 1);
    if (d.c.kod[b] !== '{') continue;
    const bs = esi(d.c.kod, b);
    out.push({ bas: b, son: bs, kosul: normal(d.c.src.slice(ac + 1, kapa)), gecersiz, satir: satirNo(d.c.src, m.index) });
  }
  return out;
}
function disaAktarimlar(d) {
  const adlar = [], desteklenmeyen = [];
  const re = /\bexport\s+(default\b|async\s+function\s*\*?\s*([A-Za-z_$][\w$]*)|function\s*\*?\s*([A-Za-z_$][\w$]*)|class\s+([A-Za-z_$][\w$]*)|(?:const|let|var)\s+([A-Za-z_$][\w$]*)|\{|\*)/g;
  let m;
  while ((m = re.exec(d.c.kod))) {
    if (m[1] === 'default') { adlar.push('default'); continue; }
    if (m[1] === '{') {
      const kapa = esi(d.c.kod, m.index + m[0].length - 1);
      for (const [x, y] of ustDuzeyBol(d.c.kod, m.index + m[0].length, kapa)) { const p = d.c.kod.slice(x, y).trim(); const a = /\bas\s+([A-Za-z_$][\w$]*)$/.exec(p); adlar.push(a ? a[1] : p); }
      continue;
    }
    if (m[1] === '*') { desteklenmeyen.push('export *'); continue; }
    const ad = m[2] || m[3] || m[4] || m[5];
    if (ad) {
      adlar.push(ad);
      // export const a = 1, b = 2: virgüllü bildirimler de sayılsın
      if (/^(const|let|var)\b/.test(m[1])) {
        const r = sagTaraf(d.c, d.c.kod.indexOf('=', m.index + m[0].length) >= 0 ? d.c.kod.indexOf('=', m.index + m[0].length) : m.index + m[0].length);
        const kalan = d.c.kod.slice(r.bas, r.son);
        let s = 0;
        for (let j = 0; j < kalan.length; j++) { const ch = kalan[j]; if ('{(['.includes(ch)) s++; else if ('})]'.includes(ch)) s--; else if (ch === ',' && s === 0) { const a = /^\s*([A-Za-z_$][\w$]*)/.exec(kalan.slice(j + 1)); if (a) adlar.push(a[1]); } }
      }
    }
  }
  return { adlar, desteklenmeyen };
}

// ---------------------------------------------------------------- (i) modül kuralları
// Kurallar bir dosya listesi alan işlevlerdir: ağacın kendisine ve (v) öz-sınamadaki bozulmuş kopyalara aynı kod uygulanır.
const yer = (d, konum) => `${d.yol}:${satirNo(d.c.src, konum)}`;
const MARK_DESEN = /dk-test-kancalari/;
const GLOBAL = 'window|globalThis|self|top|parent|frames';   // sayfanın global nesnesine giden adlar
const degismezler = (d, a, b) => d.c.dizgeler.filter((s) => s.bas >= a && s.son <= b && (s.tur === 'tek' || s.tur === 'cift'));
const dosyaBul = (liste) => (r) => liste.find((d) => d.yol === r) || null;

// K1: teste özgü kod (window.DK kurulumu, __sayac, işaret dizgesi) oyun kodunda yok. A2-G-02: Object.assign/defineProperty/Reflect.set
// ile global nesneye DK yazılması, window['DK'] = … ve DK anahtarlı nesne değişmezi de kurulum sayılır.
function kuralK1(oyun) {
  const ihlal = [];
  for (const d of oyun) {
    const k = d.c.kod;
    let m;
    const reAtama = new RegExp(`\\b(?:${GLOBAL})\\s*\\.\\s*DK\\s*(?:\\.\\s*[A-Za-z_$][\\w$]*\\s*|\\[[^\\]]*\\]\\s*)?=(?![=>])`, 'g');
    while ((m = reAtama.exec(k))) ihlal.push(`${yer(d, m.index)} window.DK kurulumu/ataması`);
    for (const s of d.c.dizgeler) {
      if ((s.tur !== 'tek' && s.tur !== 'cift') || s.deger !== 'DK') continue;
      if (new RegExp(`\\b(?:${GLOBAL})\\s*\\[\\s*$`).test(k.slice(Math.max(0, s.bas - 24), s.bas)) && /^\s*\]\s*=(?![=>])/.test(k.slice(s.son, s.son + 12))) ihlal.push(`${yer(d, s.bas)} window['DK'] ataması`);
    }
    const reCagri = /\b(?:Object\s*\.\s*(?:assign|defineProperty|defineProperties)|Reflect\s*\.\s*(?:set|defineProperty))\s*\(/g;
    while ((m = reCagri.exec(k))) {
      const ac = m.index + m[0].length - 1;
      const kapa = esi(k, ac);
      if (kapa < 0) continue;
      const globalIlk = new RegExp(`^\\s*(?:${GLOBAL})\\s*[,)]`).test(k.slice(ac + 1, kapa + 1));
      const dkVar = /(^|[^.\w$])DK(?![\w$])/.test(k.slice(ac + 1, kapa)) || degismezler(d, ac, kapa).some((s) => s.deger === 'DK');
      if (globalIlk && dkVar) ihlal.push(`${yer(d, m.index)} ${normal(k.slice(m.index, m.index + 32))}… global nesneye DK yazıyor`);
    }
    const reAnahtar = /[{,]\s*DK\s*(?=[:,}])/g;
    while ((m = reAnahtar.exec(k))) ihlal.push(`${yer(d, m.index + m[0].indexOf('DK'))} DK anahtarlı nesne değişmezi ya da yıkıcı atama`);
    const reSayac = /\b__sayac\b|\b__DK_TEST_KIPI\b/g;
    while ((m = reSayac.exec(k))) ihlal.push(`${yer(d, m.index)} ${m[0]}`);
    for (const s of d.c.dizgeler) if (MARK_DESEN.test(s.deger)) ihlal.push(`${yer(d, s.bas)} test kancası işaret dizgesi`);
  }
  return ihlal;
}

// K2: test modülleri yalnız geçerli if (TEST …) bloğundaki dinamik import() ile yüklenir; yalnız install (kancalar.js: + MARK) verir.
function kuralK2(oyun, test, bul) {
  const ihlal = [];
  if (!bul(KANCALAR)) ihlal.push(`${KANCALAR} yok (test kancaları modülü kurulmamış)`);
  for (const d of test) {
    const { adlar, desteklenmeyen } = disaAktarimlar(d);
    const izinli = d.yol === KANCALAR ? ['install', 'MARK'] : ['install'];
    const fazla = adlar.filter((a) => !izinli.includes(a));
    if (fazla.length) ihlal.push(`${d.yol} izin dışı dışa aktarım: ${fazla.join(', ')}`);
    if (desteklenmeyen.length) ihlal.push(`${d.yol} ${desteklenmeyen.join(', ')}`);
    if (!adlar.includes('install')) ihlal.push(`${d.yol} install dışa aktarmıyor`);
  }
  let kancaYukleyici = 0;
  for (const d of oyun) {
    const statik = statikIceAktarmalar(d);
    for (const s of statik) { const r = coz(d.yol, s.belirtec); if (r && testModuluMu(r)) ihlal.push(`${d.yol}:${s.satir} test modülünü statik içe aktarıyor (${s.belirtec})`); }
    const dinamik = dinamikIceAktarmalar(d);
    const bloklar = testBloklari(d);
    const testYukler = [];
    for (const x of dinamik) {
      if (x.belirtec === null) { ihlal.push(`${d.yol}:${x.satir} değişmez olmayan belirteçli dinamik import() (statik olarak doğrulanamaz)`); continue; }
      const r = coz(d.yol, x.belirtec);
      if (!r || !testModuluMu(r)) continue;
      testYukler.push(x);
      const blok = bloklar.find((b) => b.bas < x.konum && x.konum < b.son);
      if (!blok) ihlal.push(`${d.yol}:${x.satir} test modülü (${x.belirtec}) if (TEST …) bloğu dışında yükleniyor`);
      else if (blok.gecersiz) ihlal.push(`${d.yol}:${blok.satir} if (${blok.kosul}): koşul yalnız TEST ya da en üst düzeyde TEST && … olmalı (|| , ?: , karşılaştırma ya da işlem yok); TEST false iken de doğru olabilir`);
      if (r === KANCALAR && d.yol === MAIN && blok && !blok.gecersiz) kancaYukleyici++;
    }
    if (testYukler.length || bloklar.length) {
      // TEST, js/core/testmode.js'ten içe aktarılmalı; yerel bir TEST bildirimi olmamalı
      const tm = statik.find((s) => coz(d.yol, s.belirtec) === TESTMODE && /\bTEST\b/.test(s.cumle));
      if (!tm) ihlal.push(`${d.yol}: TEST ${TESTMODE}'den içe aktarılmıyor`);
      const yerel = /\b(?:const|let|var|function|class)\s+TEST\b/.exec(d.c.kod);
      if (yerel) ihlal.push(`${yer(d, yerel.index)} yerel TEST bildirimi`);
    }
  }
  if (!kancaYukleyici) ihlal.push(`${MAIN} ${KANCALAR}'ı if (TEST …) arkasında dinamik import() ile yüklemiyor`);
  return ihlal;
}

// K3: oyun kodu window.DK'yi hiçbir yerde okumaz. A2-UY-01: herhangi bir nesnenin DK özelliği (window?.DK, top.DK, parent.DK,
// document.defaultView.DK …), çıplak DK tanımlayıcısı (const { DK } = window, { DK }, x ? DK : y …) ve 'DK' dizgesi ihlaldir.
function kuralK3(oyun) {
  const ihlal = [];
  for (const d of oyun) {
    const k = d.c.kod;
    let m;
    const reOzellik = /\.\s*DK(?![\w$])/g;
    while ((m = reOzellik.exec(k))) ihlal.push(`${yer(d, m.index)} ${normal(k.slice(Math.max(0, m.index - 16), m.index + 8))} (DK özelliği)`);
    const reCiplak = /(^|[^.\w$])DK(?![\w$])/g;
    while ((m = reCiplak.exec(k))) ihlal.push(`${yer(d, m.index + m[1].length)} çıplak DK tanımlayıcısı`);
    for (const s of d.c.dizgeler) if ((s.tur === 'tek' || s.tur === 'cift') && s.deger === 'DK') ihlal.push(`${yer(d, s.bas)} 'DK' dizgesiyle erişim`);
  }
  return ihlal;
}

// K4: sayfa adresinin sorgu kısmı (?peerhost, ?terrain …) yalnız js/core/testmode.js'te ve js/main.js'teki
// new URLSearchParams(location.search).get('join') ile okunur. A2-G-01, A2-UY-01: location yalnız sorgu taşımayan üyeleriyle
// (origin, pathname, protocol, hostname, host, port, reload) kullanılabilir; location.search/href/hash, location[…], toString ya da değer
// olarak kullanım, document.URL/documentURI/baseURI, URLSearchParams ve searchParams ihlaldir (window./self./top./document. öneki dahil).
const KONUM_UYELERI = new Set(['origin', 'pathname', 'protocol', 'hostname', 'host', 'port', 'reload']);
function joinAraliklari(d) {
  const out = [];
  if (d.yol !== MAIN) return out;
  const re = /\bnew\s+URLSearchParams\s*\(\s*location\s*\.\s*search\s*\)\s*\.\s*get\s*\(/g;
  let m;
  while ((m = re.exec(d.c.kod))) {
    const j = ilkAnlamliKaynak(d.c.src, m.index + m[0].length);
    const s = d.c.dizgeler.find((x) => x.bas === j && (x.tur === 'tek' || x.tur === 'cift'));
    if (s && s.deger === 'join' && /^\s*\)/.test(d.c.kod.slice(s.son))) out.push([m.index, s.son]);
  }
  return out;
}
function kuralK4(tum, bul) {
  const ihlal = [];
  if (!bul(TESTMODE)) ihlal.push(`${TESTMODE} yok`);
  for (const d of tum) {
    if (d.yol === TESTMODE) continue;
    const k = d.c.kod;
    const join = joinAraliklari(d);
    const izinli = (konum) => join.some(([a, b]) => a <= konum && konum < b);
    let m;
    const reKonum = /(^|[^.\w$])((?:(?:window|self|globalThis|top|parent|frames|opener|document)\s*\??\.\s*)?location)(?![\w$])/g;
    while ((m = reKonum.exec(k))) {
      const bas = m.index + m[1].length;
      const son = bas + m[2].length;
      const uye = /^\s*\??\.\s*([A-Za-z_$][\w$]*)/.exec(k.slice(son));
      if (uye && KONUM_UYELERI.has(uye[1])) continue;
      if (izinli(bas)) continue;
      ihlal.push(`${yer(d, bas)} ${normal(k.slice(bas, son + 14))} (sayfa adresi okuması)`);
    }
    const reBelge = /\bdocument\s*\??\.\s*(URL|documentURI|baseURI)\b/g;
    while ((m = reBelge.exec(k))) ihlal.push(`${yer(d, m.index)} document.${m[1]}`);
    const reSorgu = /\b(URLSearchParams|searchParams)\b/g;
    while ((m = reSorgu.exec(k))) if (!izinli(m.index)) ihlal.push(`${yer(d, m.index)} ${m[1]}`);
  }
  return ihlal;
}

// K5 (A2-G-02): test kancası globalleri (window.__DK_TERRAIN_MODE ve ileride gelecek window.__DK_*) oyun kodunda yalnız geçerli bir
// if (TEST …) bloğunda ya da koşulu yalnız TEST olan bir üçlü ifadenin doğru dalında (TEST ? … : …) okunur. __DK_SINGLE_FILE üretim
// tek HTML'inin işaretidir (derleme aracı yazar), test kancası değildir.
const URETIM_BAYRAKLARI = new Set(['__DK_SINGLE_FILE']);
function testUcluleri(k) {   // TEST ? <aralık> : … — doğru dalın [baş, son) aralıkları
  const out = [];
  const re = /\bTEST\s*\?(?![.?])/g;
  let m;
  while ((m = re.exec(k))) {
    const once = k.slice(0, m.index).replace(/\s+$/, '');
    const s1 = once.slice(-1), s2 = once.slice(-2);
    const kosulYalnizTest = once === '' || /(^|[^\w$])return$/.test(once) || s2 === '=>' || (s1 === '=' && !/[=!<>]=$/.test(once)) || '(,:[{;'.includes(s1) || (s1 === '?' && s2 !== '??');
    if (!kosulYalnizTest) continue;
    let derin = 0, ic = 0, j = m.index + m[0].length;
    const bas = j;
    for (; j < k.length; j++) {
      const ch = k[j];
      if ('([{'.includes(ch)) derin++;
      else if (')]}'.includes(ch)) { if (derin === 0) break; derin--; }
      else if (derin === 0 && ch === '?' && k[j + 1] !== '.' && k[j + 1] !== '?' && k[j - 1] !== '?') ic++;
      else if (derin === 0 && ch === ':') { if (ic === 0) { out.push([bas, j]); break; } ic--; }
      else if (derin === 0 && ch === ';') break;
    }
  }
  return out;
}
function kuralK5(oyun) {
  const ihlal = [];
  for (const d of oyun) {
    const k = d.c.kod;
    const bloklar = testBloklari(d).filter((b) => !b.gecersiz);
    const uclu = testUcluleri(k);
    const re = /(^|[^\w$])(__DK_[A-Za-z0-9_]+)(?![\w$])/g;
    let m;
    while ((m = re.exec(k))) {
      const ad = m[2], konum = m.index + m[1].length;
      if (URETIM_BAYRAKLARI.has(ad)) continue;
      const korunuyor = bloklar.some((b) => b.bas < konum && konum < b.son) || uclu.some(([a, b]) => a <= konum && konum < b);
      if (!korunuyor) ihlal.push(`${yer(d, konum)} ${ad} test kipi koruması (if (TEST …) bloğu ya da TEST ? … : …) dışında okunuyor`);
    }
  }
  for (const d of oyun) for (const s of d.c.dizgeler) if (/^__DK_/.test(s.deger) && !URETIM_BAYRAKLARI.has(s.deger)) ihlal.push(`${yer(d, s.bas)} '${s.deger}' dizgesiyle erişim (statik olarak doğrulanamaz)`);
  return ihlal;
}

function kurallar(liste) {
  const oyun = liste.filter((d) => !testModuluMu(d.yol));
  const test = liste.filter((d) => testModuluMu(d.yol));
  const bul = dosyaBul(liste);
  return { K1: kuralK1(oyun), K2: kuralK2(oyun, test, bul), K3: kuralK3(oyun), K4: kuralK4(liste, bul), K5: kuralK5(oyun) };
}
const oyunDosyalari = dosyalar.filter((d) => !testModuluMu(d.yol));
const testDosyalari = dosyalar.filter((d) => testModuluMu(d.yol));
const KURAL = kurallar(dosyalar);
ekle('K1', 'Teste özgü kod (window.DK kurulumu — Object.assign/defineProperty/Reflect.set ve DK anahtarlı nesne dahil —, __sayac, işaret) yalnız js/test/ ya da saplanan netTest/netShape dosyalarında', KURAL.K1.length === 0, KURAL.K1.length ? KURAL.K1 : `${oyunDosyalari.length} oyun dosyası tarandı`);
ekle('K2', 'Test modülleri yalnız geçerli if (TEST …) bloğundaki (koşul TEST ya da TEST && …) dinamik import() ile yükleniyor; yalnız install (kancalar.js: + MARK) dışa aktarıyor; statik içe aktarma yok (göreli, kökten ve tam adresli belirteçler)', KURAL.K2.length === 0, KURAL.K2.length ? KURAL.K2 : `test modülleri: ${testDosyalari.map((d) => d.yol).join(', ')}`);
ekle('K3', 'Oyun kodu window.DK\'yi hiçbir yerde okumuyor (js/test/ dışı; ?.DK, top/parent/… .DK, çıplak DK ve \'DK\' dizgesi dahil)', KURAL.K3.length === 0, KURAL.K3.length ? KURAL.K3 : 'erişim yok');
ekle('K4', 'Sayfa adresinin sorgusu yalnız js/core/testmode.js\'te ve js/main.js\'te (?join) okunuyor (location.search/href/hash, location[…], document.URL/documentURI/baseURI, URLSearchParams, searchParams)', KURAL.K4.length === 0, KURAL.K4.length ? KURAL.K4 : 'yalnız izinli yerler');
ekle('K5', 'Test kancası globalleri (window.__DK_*; üretim bayrağı __DK_SINGLE_FILE hariç) yalnız if (TEST …) bloğunda ya da TEST ? … : … doğru dalında okunuyor', KURAL.K5.length === 0, KURAL.K5.length ? KURAL.K5 : 'korumasız okuma yok');

// ---------------------------------------------------------------- (ii) doğruluk tablosu
const DURUMLAR = [
  // §5.3 tablosu (10 durum)
  { id: 'DT01', url: 'http://localhost:8080/?test=1', test: true },
  { id: 'DT02', url: 'http://127.0.0.1:9/?test=1', test: true },
  { id: 'DT03', url: 'http://[::1]:8080/?test=1', test: true },
  { id: 'DT04', url: 'file:///x.html?test=1', test: true },
  { id: 'DT05', url: 'https://adnanerdem2000-sudo.github.io/SON-HAZ-NE/?test=1', test: false },
  { id: 'DT06', url: 'http://192.168.1.5:8080/?test=1', test: false },
  { id: 'DT07', url: 'http://localhost:8080/?test=0', test: false },
  { id: 'DT08', url: 'http://localhost:8080/?test=true', test: false, not: '?test=true' },
  { id: 'DT09', url: 'http://localhost:8080/?test=1&test=0', test: true, not: 'get ilk değeri alır' },
  { id: 'DT10', url: 'http://localhost:8080/?join=X&test=1', test: true },
  // ek durumlar
  { id: 'DT11', url: 'http://localhost.evil.com/?test=1', test: false, not: 'localhost önekli yabancı alan adı' },
  { id: 'DT12', url: 'https://127.0.0.1.nip.io/?test=1', test: false, not: '127.0.0.1 önekli yabancı alan adı' },
  { id: 'DT13', url: 'http://localhost:8080/index.html', test: false, not: 'test parametresi yok' },
  { id: 'DT14', url: 'https://oyun.ornek/index.html?test=1&peerhost=kotu.ornek&terrain=crash', test: false, not: 'TK05 sahte kökeni' },
  { id: 'DT15', url: 'http://127.0.0.2:8080/?test=1', test: false, not: 'yalnız 127.0.0.1 geri döngü sayılır' },
  { id: 'DT16', url: 'http://0.0.0.0:8080/?test=1', test: false },
  { id: 'DT17', url: 'http://localhost:8080/#?test=1', test: false, not: 'test yalnız parça (#) içinde' },
  { id: 'DT18', url: 'http://[::ffff:127.0.0.1]:8080/?test=1', test: false, not: 'IPv4 eşlemeli IPv6' },
  { id: 'DT19', url: 'http://LOCALHOST:8080/?test=1', test: true, not: 'tarayıcı gibi URL konak adını küçültür' },
  { id: 'DT20', ozel: 'firlatan', test: false, not: 'location erişimi istisna atıyor' },
  { id: 'DT21', ozel: 'tanimsiz', test: false, not: 'location tanımsız' },
  // testParam
  { id: 'TP01', url: 'https://oyun.ornek/index.html?test=1&peerhost=kotu.ornek&terrain=crash', test: false, param: { peerhost: null, terrain: null, test: null }, not: 'yerel olmayan köken: hepsi null' },
  { id: 'TP02', url: 'http://localhost:8080/?peerhost=127.0.0.1&terrain=crash', test: false, param: { peerhost: null, terrain: null }, not: 'test kipi kapalı (test=1 yok): null' },
  { id: 'TP03', url: 'http://localhost:8080/?test=1&peerhost=127.0.0.1&peerport=9000&terrain=noworker', test: true, param: { peerhost: '127.0.0.1', peerport: '9000', terrain: 'noworker', yok: null } },
  { id: 'TP04', url: 'file:///x.html?test=1&terrain=badurl', test: true, param: { terrain: 'badurl' } },
  { id: 'TP05', url: 'http://192.168.1.5/?test=1&peerhost=127.0.0.1', test: false, param: { peerhost: null } },
  { id: 'TP06', ozel: 'firlatan', test: false, param: { peerhost: null }, not: 'location istisna atıyor' },
];
function konumTaklidi(u) {
  const x = new URL(u);
  return { href: x.href, protocol: x.protocol, host: x.host, hostname: x.hostname, port: x.port, pathname: x.pathname, search: x.search, hash: x.hash, origin: x.origin };
}
{
  const d = dosya(TESTMODE);
  if (!d) {
    ekle('DT', 'Doğruluk tablosu (gerçek testmode.js, node:vm)', false, `${TESTMODE} yok: tablo koşulamadı`);
  } else if (!cozulebilir(d)) {
    ekle('DT', 'Doğruluk tablosu (gerçek testmode.js, node:vm)', false, `${TESTMODE} çözümlenemedi: ${d.c.hatalar.join('; ')}`);
  } else {
    const ice = statikIceAktarmalar(d).concat(dinamikIceAktarmalar(d));
    const { adlar, desteklenmeyen } = disaAktarimlar(d);
    const sorun = [];
    if (ice.length) sorun.push(`modül içe aktarma içeriyor (${ice.map((x) => x.belirtec).join(', ')}); vm betiği olarak yüklenemez`);
    if (desteklenmeyen.length || adlar.includes('default') || /\bexport\s*\{/.test(d.c.kod)) sorun.push('desteklenmeyen dışa aktarım biçimi (export {…}, export *, export default)');
    for (const a of ['TEST', 'testParam']) if (!adlar.includes(a)) sorun.push(`${a} dışa aktarılmıyor`);
    if (sorun.length) ekle('DT', 'Doğruluk tablosu (gerçek testmode.js, node:vm)', false, sorun);
    else {
      // yalnız 'export ' anahtar sözcükleri kaldırılır (konumlar maskelenmiş koddan: dizge ve yorum içindekilere dokunulmaz)
      const kaynak = d.c.src;
      const konumlar = [];
      const re = /\bexport\s+(?=(?:async\s+)?function|const|let|var|class)/g;
      let m;
      while ((m = re.exec(d.c.kod))) konumlar.push([m.index, m.index + m[0].length]);
      let govde = '';
      let son = 0;
      for (const [a, b] of konumlar) { govde += kaynak.slice(son, a) + ' '.repeat(b - a); son = b; }
      govde += kaynak.slice(son);
      const betik = `(function () {\n${govde}\n;return { TEST: typeof TEST === 'undefined' ? undefined : TEST, testParam: typeof testParam === 'function' ? testParam : undefined };\n})()`;
      let derlenmis = null;
      try { derlenmis = new vm.Script(betik, { filename: TESTMODE }); } catch (e) { ekle('DT', 'Doğruluk tablosu (gerçek testmode.js, node:vm)', false, 'derlenemedi: ' + e.message); }
      if (derlenmis) {
        for (const t of DURUMLAR) {
          const baglam = { URLSearchParams };
          if (t.ozel === 'firlatan') Object.defineProperty(baglam, 'location', { get() { throw new Error('SecurityError (taklit)'); }, enumerable: true });
          else if (t.ozel !== 'tanimsiz') baglam.location = konumTaklidi(t.url);
          let sonuc, hata = null;
          try { sonuc = derlenmis.runInContext(vm.createContext(baglam)); } catch (e) { hata = e.message; }
          const ayr = { url: t.url || `(${t.ozel})`, beklenenTEST: t.test };
          let ok = !hata && sonuc && sonuc.TEST === t.test;
          ayr.TEST = hata ? `istisna: ${hata}` : sonuc && sonuc.TEST;
          if (ok && t.param) {
            ayr.testParam = {};
            for (const [ad, bek] of Object.entries(t.param)) {
              let v;
              try { v = sonuc.testParam(ad); } catch (e) { v = `istisna: ${e.message}`; }
              ayr.testParam[ad] = v;
              if (v !== bek) { ok = false; ayr.beklenenParam = t.param; }
            }
          }
          if (t.not) ayr.not = t.not;
          ekle(t.id, t.param ? `testParam: ${t.url || t.ozel}` : `TEST: ${t.url || t.ozel}`, ok, ayr);
        }
      }
    }
  }
}

// ---------------------------------------------------------------- zamanlama ve sinyal kuralının işlevleri ((iii), (iv), (v) kullanır)
// Zamanlama (§5.7-2): main.js'te kancalar modülünün sözü beklenir, install ondan sonra çağrılır, window.__ready install'dan sonra
// yazılır (ZM). A2-UY-02 (ZM2): bekleme ve install, boot() içinde yükleme ekranı kaldırılmadan (getElementById('loading')
// .classList.remove(…)) ve menü açılmadan (menu.show(true)) ÖNCE yapılır: modül yüklenemez ya da install istisna atarsa boot() orada
// reddedilir ve catch'in "Oyun başlatılamadı" iletisi görünür yükleme ekranında kalır (eskiden menü açılıyor, ileti gizli kalıyordu).
function zamanlama(ana) {
  const mi = /\binstall\s*\(\s*\{/.exec(ana.c.kod);
  const installKonum = mi ? mi.index : -1;
  const kancaImportlari = dinamikIceAktarmalar(ana).filter((x) => x.belirtec && coz(MAIN, x.belirtec) === KANCALAR);
  const d = kancaImportlari[0] || null;
  // bekleme: ya doğrudan 'await import(…)' ya da sözün atandığı değişkenin sonradan 'await <ad>' ile beklenmesi.
  // Birden çok kancalar import'u varsa install'dan önceki en son bekleme alınır.
  let bekleme = null;
  for (const k of kancaImportlari) {
    let b = null;
    if (k.bekleniyor) b = { tur: 'await import()', konum: k.konum, satir: k.satir };
    else {
      const atama = /([A-Za-z_$][\w$]*)\s*=\s*import\s*$/.exec(ana.c.kod.slice(Math.max(0, k.konum - 80), k.konum));
      if (atama) {
        const reB = new RegExp('\\bawait\\s+' + atama[1].replace(/\$/g, '\\$') + '\\b', 'g');
        let x;
        while ((x = reB.exec(ana.c.kod))) if (x.index > k.konum) { b = { tur: `await ${atama[1]} (söz ${k.satir}. satırda başlatıldı)`, konum: x.index, satir: satirNo(ana.c.src, x.index) }; break; }
      }
    }
    if (b && (installKonum < 0 || b.konum < installKonum) && (!bekleme || b.konum > bekleme.konum)) bekleme = b;
  }
  const hazirlar = [];
  const re = /\bwindow\s*\.\s*__ready\s*=(?![=>])/g;
  let m3;
  while ((m3 = re.exec(ana.c.kod))) hazirlar.push(m3.index);
  const zm = { ok: !!bekleme && installKonum > bekleme.konum && hazirlar.length === 1 && hazirlar[0] > installKonum,
    ayr: { kancaImport: d ? { satir: d.satir } : 'yok', bekleme: bekleme ? { tur: bekleme.tur, satir: bekleme.satir } : 'yok', installSatir: installKonum >= 0 ? satirNo(ana.c.src, installKonum) : 'yok', readySatirlari: hazirlar.map((k) => satirNo(ana.c.src, k)) } };
  // ZM2: boot() gövdesinde ilk yükleme ekranı kaldırma ve ilk menu.show(true)
  const mb = /\basync\s+function\s+boot\s*\(/.exec(ana.c.kod);
  const bAc = mb ? ana.c.kod.indexOf('{', mb.index) : -1;
  const bKapa = bAc >= 0 ? esi(ana.c.kod, bAc) : -1;
  let yuklemeKaldir = -1, menuGoster = -1;
  if (bKapa > 0) {
    for (const s of ana.c.dizgeler) {
      if (s.bas < bAc || s.son > bKapa || (s.tur !== 'tek' && s.tur !== 'cift') || s.deger !== 'loading') continue;
      if (/getElementById\s*\(\s*$/.test(ana.c.kod.slice(Math.max(0, s.bas - 24), s.bas)) && /^\s*\)\s*\.\s*classList\s*\.\s*remove\s*\(/.test(ana.c.kod.slice(s.son, s.son + 40))) { yuklemeKaldir = s.bas; break; }
    }
    const reM = /\bmenu\s*\.\s*show\s*\(\s*true\s*\)/g;
    reM.lastIndex = bAc;
    const mm = reM.exec(ana.c.kod);
    if (mm && mm.index < bKapa) menuGoster = mm.index;
  }
  const ic = (x) => x >= 0 && bKapa > 0 && x > bAc && x < bKapa;
  const zm2 = { ok: !!bekleme && ic(bekleme.konum) && ic(installKonum) && yuklemeKaldir >= 0 && menuGoster >= 0 && bekleme.konum < yuklemeKaldir && installKonum < yuklemeKaldir && installKonum < menuGoster,
    ayr: { boot: bKapa > 0 ? 'bulundu' : 'yok', bekleme: bekleme ? bekleme.satir : 'yok', installSatir: installKonum >= 0 ? satirNo(ana.c.src, installKonum) : 'yok',
      yuklemeKaldirSatir: yuklemeKaldir >= 0 ? satirNo(ana.c.src, yuklemeKaldir) : 'yok', menuGosterSatir: menuGoster >= 0 ? satirNo(ana.c.src, menuGoster) : 'yok' } };
  return { zm, zm2 };
}

// Sinyal sunucusu kuralı (K9-20; A2-G-02). GERÇEK js/net/net.js'teki GERI_DONGU ve testSinyali() kaynak metni ayıklanır, node:vm'de
// taklit testParam ile (test kipi açık; testParam'ın kendisi DT/TP tablosunda sınanır) koşulur. Kabul edilen seçenekler
// vendor/peerjs/peerjs.min.js'teki GERÇEK yol normalleştirme ve URL kurma ifadeleriyle (metinden ayıklanıp) /peerjs/id ve WebSocket
// adreslerine çevrilir; kurulabilen her adresin konağı geri döngü olmalıdır (kurulamayan adres bağlantı kurmaz). Yapı denetimi:
// testParam('peer…') yalnız testSinyali içinde okunur, GERI_DONGU başka yerde kullanılmaz ve dışa aktarılmaz, peerOpts ve
// sinyalSunucusu testSinyali()'ni kullanır, oyun kodundaki her new (window.)Peer(…) seçeneği peerOpts()'tan alır.
// Durum listesi A2 güvenlik incelemesinin şablonundan (peerhost_sinama.mjs, 34 durum) + 'peerhost yok'. Beklenen: 'kabul' (geri döngü
// konağıyla kabul edilmeli), 'red' (yok sayılmalı: varsayılan PeerJS sunucusu), 'guvenli' (yok sayılabilir ya da geri döngü konağıyla
// kabul edilebilir; yol/kapı hileleri). tam: kabul edilen seçeneğin tam değeri.
const NET = 'js/net/net.js';
const PEERJS = 'vendor/peerjs/peerjs.min.js';
const GERI_DONGU_KONAK = new Set(['127.0.0.1', 'localhost', '[::1]']);
const SINYAL_DURUMLARI = [
  ['peerhost=127.0.0.1&peerport=9000', 'kabul', { host: '127.0.0.1', port: 9000, path: '/', secure: false }], ['peerhost=localhost', 'kabul', { host: 'localhost', port: 9000, path: '/', secure: false }],
  ['peerhost=%5B%3A%3A1%5D', 'kabul'], ['peerhost=::1', 'guvenli'], ['', 'red'],
  ['peerhost=127.0.0.1.kotu.ornek', 'red'], ['peerhost=localhost.kotu.ornek', 'red'], ['peerhost=LOCALHOST', 'red'], ['peerhost=Localhost', 'red'], ['peerhost=localhost.', 'red'],
  ['peerhost=0x7f000001', 'red'], ['peerhost=2130706433', 'red'], ['peerhost=127.1', 'red'], ['peerhost=0177.0.0.1', 'red'], ['peerhost=%5B%3A%3Affff%3A127.0.0.1%5D', 'red'],
  ['peerhost=%5B0%3A0%3A0%3A0%3A0%3A0%3A0%3A1%5D', 'red'], ['peerhost=localhost%3A80%40kotu.ornek', 'red'], ['peerhost=kotu.ornek%23127.0.0.1', 'red'], ['peerhost=127.0.0.1%2Fkotu.ornek', 'red'],
  ['peerhost=%20127.0.0.1', 'red'], ['peerhost=127.0.0.1%00', 'red'], ['peerhost=10.9.9.9', 'red'], ['peerhost=kotu.ornek', 'red'], ['peerhost=kotu.ornek&peerhost=127.0.0.1', 'red'],
  ['peerhost=127.0.0.1&peerhost=kotu.ornek', 'guvenli'],
  ['peerhost=127.0.0.1&peerport=9000&peerpath=%40kotu.ornek%2F', 'guvenli'], ['peerhost=127.0.0.1&peerpath=%2F%2Fkotu.ornek%2F', 'guvenli'], ['peerhost=127.0.0.1&peerpath=%5C%5Ckotu.ornek%2F', 'guvenli'],
  ['peerhost=127.0.0.1&peerpath=..%2F..%2F%40kotu.ornek', 'guvenli'], ['peerhost=127.0.0.1&peerpath=%3F%40kotu.ornek', 'guvenli'], ['peerhost=localhost&peerport=80%40kotu.ornek', 'guvenli'],
  ['peerhost=localhost&peerport=443%2Fkotu.ornek', 'guvenli'], ['peerhost=localhost&peerport=0x1BB', 'guvenli'], ['peerhost=localhost&peerport=1e3', 'guvenli'], ['peerhost=localhost&peerport=-1', 'guvenli'],
  ['peerhost=127.0.0.1&peersecure=1&peerpath=%40kotu.ornek', 'guvenli'],
];
let peerjsAdres = null;   // { norm, http, ws } ya da { hata }
{
  let k = null;
  try { k = fs.readFileSync(path.join(AGAC, PEERJS), 'utf8'); } catch (e) { peerjsAdres = { hata: `${PEERJS} okunamadı: ${e.message}` }; }
  if (k !== null) {
    const norm = /this\._options\.path&&\("\/"!==this\._options\.path\[0\]&&\(this\._options\.path="\/"\+this\._options\.path\),"\/"!==this\._options\.path\[this\._options\.path\.length-1\]&&\(this\._options\.path\+="\/"\)\)/.exec(k);
    const http = /new URL\(`\$\{t\}:\/\/\$\{n\}:\$\{r\}\$\{i\}\$\{s\}\/\$\{e\}`\)/.exec(k);
    const ws = /\(e\?"wss:\/\/":"ws:\/\/"\)\+t\+":"\+n\+r\+"peerjs\?key="\+i/.exec(k);
    if (!norm || !http || !ws) peerjsAdres = { hata: `${PEERJS}: yol normalleştirme/URL kurma ifadesi bulunamadı (${[!norm && 'yol', !http && 'http', !ws && 'ws'].filter(Boolean).join(', ')}); PeerJS sürümü değiştiyse bu denetimi güncelleyin` };
    else {
      const bag = vm.createContext({ URL });
      peerjsAdres = {
        norm: vm.runInContext(`(function () { ${norm[0]}; return this._options; })`, bag),
        http: vm.runInContext(`(function (t, n, r, i, s, e) { return ${http[0]}; })`, bag),
        ws: vm.runInContext(`(function (e, t, n, r, i) { return ${ws[0]}; })`, bag),
      };
    }
  }
}
function fonksiyonlar(d, ad) {   // function <ad>(…) { … } aralıkları (maskelenmiş kodda)
  const out = [];
  const re = new RegExp(`\\bfunction\\s+${ad}\\s*\\(`, 'g');
  let m;
  while ((m = re.exec(d.c.kod))) { const ac = d.c.kod.indexOf('{', m.index + m[0].length); const kapa = ac >= 0 ? esi(d.c.kod, ac) : -1; if (kapa > 0) out.push({ bas: m.index, govde: ac, son: kapa + 1 }); }
  return out;
}
function sinyalDenetimi(liste) {
  const bul = dosyaBul(liste);
  const oyun = liste.filter((d) => !testModuluMu(d.yol));
  const yapi = [];
  const sonuc = { yapi, durumlar: [], ihlal: [] };
  const net = bul(NET);
  if (!net || !cozulebilir(net)) { yapi.push(`${NET} yok ya da çözümlenemedi`); sonuc.ihlal.push(...yapi); return sonuc; }
  const k = net.c.kod;
  const gdBildirim = [];
  const reGd = /\b(export\s+)?const\s+GERI_DONGU\s*=\s*new\s+Set\s*\(/g;
  let m;
  while ((m = reGd.exec(k))) { const esitK = k.indexOf('=', m.index); const r = sagTaraf(net.c, esitK); gdBildirim.push({ bas: m.index, son: r.son + 1, disari: !!m[1] }); }
  const ts = fonksiyonlar(net, 'testSinyali');
  const po = fonksiyonlar(net, 'peerOpts');
  const ss = fonksiyonlar(net, 'sinyalSunucusu');
  if (gdBildirim.length !== 1) yapi.push(`${NET}: const GERI_DONGU = new Set(…) bildirimi ${gdBildirim.length} kez (1 olmalı)`);
  else if (gdBildirim[0].disari) yapi.push(`${NET}: GERI_DONGU dışa aktarılıyor (başka modül değiştirebilir)`);
  if (ts.length !== 1) yapi.push(`${NET}: function testSinyali() ${ts.length} kez (1 olmalı)`);
  if (po.length !== 1) yapi.push(`${NET}: function peerOpts() ${po.length} kez (1 olmalı)`);
  else if (!/\btestSinyali\s*\(\s*\)/.test(k.slice(po[0].govde, po[0].son))) yapi.push(`${NET}: peerOpts() testSinyali()'ni kullanmıyor`);
  if (ss.length !== 1 || !/\btestSinyali\s*\(\s*\)/.test(k.slice(ss[0].govde, ss[0].son))) yapi.push(`${NET}: sinyalSunucusu() tanısı testSinyali()'ni kullanmıyor`);
  const tsAralik = ts.length === 1 ? ts[0] : null;
  const tsIcinde = (d, x) => d.yol === NET && tsAralik && tsAralik.govde < x && x < tsAralik.son;
  for (const d of oyun) {
    if (d.yol === TESTMODE) continue;
    const kk = d.c.kod;
    const reG = /\bGERI_DONGU\b/g;
    while ((m = reG.exec(kk))) if (!(d.yol === NET && gdBildirim.some((b) => b.bas <= m.index && m.index < b.son)) && !tsIcinde(d, m.index)) yapi.push(`${yer(d, m.index)} GERI_DONGU testSinyali() dışında kullanılıyor`);
    if (/\btestParam\s+as\b/.test(kk)) yapi.push(`${d.yol}: testParam başka adla içe aktarılıyor (doğrulanamaz)`);
    const reT = /\btestParam\s*\(/g;
    while ((m = reT.exec(kk))) {
      const j = ilkAnlamliKaynak(d.c.src, m.index + m[0].length);
      const s = d.c.dizgeler.find((x) => x.bas === j && (x.tur === 'tek' || x.tur === 'cift'));
      if (!s || !/^\s*\)/.test(kk.slice(s.son))) { yapi.push(`${yer(d, m.index)} testParam(…) değişmez olmayan adla çağrılıyor (doğrulanamaz)`); continue; }
      if (/^peer/i.test(s.deger) && !tsIcinde(d, m.index)) yapi.push(`${yer(d, m.index)} testParam('${s.deger}') testSinyali() dışında okunuyor (geri döngü denetimi atlanır)`);
    }
    const reP = /\bnew\s+(?:window\s*\.\s*)?Peer\s*\(/g;
    while ((m = reP.exec(kk))) {
      const ac = m.index + m[0].length - 1, kapa = esi(kk, ac);
      const arg = kapa > 0 ? ustDuzeyBol(kk, ac + 1, kapa) : [];
      const son = arg.length ? normal(kk.slice(arg[arg.length - 1][0], arg[arg.length - 1][1])) : '';
      if (son !== 'peerOpts()') yapi.push(`${yer(d, m.index)} new Peer(…) seçeneği peerOpts()'tan alınmıyor (${son || 'seçenek yok'})`);
    }
  }
  if (peerjsAdres && peerjsAdres.hata) yapi.push(peerjsAdres.hata);
  if (gdBildirim.length === 1 && tsAralik && !(peerjsAdres && peerjsAdres.hata)) {
    let fn = null;
    try { fn = new vm.Script(`(function () {\n${net.c.src.slice(gdBildirim[0].bas, gdBildirim[0].son)}\n${net.c.src.slice(tsAralik.bas, tsAralik.son)}\n;return testSinyali; })()`, { filename: NET + ' (GERI_DONGU + testSinyali)' }); }
    catch (e) { yapi.push(`${NET}: testSinyali ayıklanıp derlenemedi: ${e.message}`); }
    if (fn) {
      for (const [q, beklenen, tam] of SINYAL_DURUMLARI) {
        const sp = new URLSearchParams('test=1' + (q ? '&' + q : ''));
        let s, hata = null;
        try { s = fn.runInContext(vm.createContext({ testParam: (ad) => sp.get(ad) }))(); } catch (e) { hata = e.message; }
        const ayr = { sorgu: q || '(peerhost yok)', beklenen };
        let guvenliAdres = true;
        if (hata) { ayr.hata = hata; guvenliAdres = false; }
        else if (s === null || s === undefined) ayr.sonuc = 'yok sayıldı (varsayılan PeerJS sunucusu)';
        else {
          ayr.sonuc = { host: s.host, port: s.port, path: s.path, secure: s.secure };
          if (!GERI_DONGU_KONAK.has(s.host) && s.host !== '::1') guvenliAdres = false;
          const o = peerjsAdres.norm.call({ _options: { ...s, key: 'peerjs' } });
          const adresler = {};
          for (const [tur, kur] of [['http', () => peerjsAdres.http(o.secure ? 'https' : 'http', o.host, o.port, o.path, o.key, 'id')], ['ws', () => new URL(peerjsAdres.ws(o.secure, o.host, o.port, o.path, o.key))]]) {
            let u = null;
            try { u = kur(); } catch (e) { adresler[tur] = `kurulamadı (${e.message}): bağlantı yok`; continue; }
            adresler[tur] = `${u.href} (konak ${u.hostname})`;
            if (!GERI_DONGU_KONAK.has(u.hostname)) guvenliAdres = false;
          }
          ayr.adresler = adresler;
        }
        const red = !hata && (s === null || s === undefined);
        let ok = beklenen === 'red' ? red : beklenen === 'kabul' ? (!red && guvenliAdres) : (red || guvenliAdres);
        if (ok && tam && JSON.stringify(ayr.sonuc) !== JSON.stringify(tam)) { ok = false; ayr.tam = tam; }
        sonuc.durumlar.push({ sorgu: q, beklenen, ok, ayr });
      }
    }
  }
  sonuc.ihlal = [...yapi, ...sonuc.durumlar.filter((x) => !x.ok).map((x) => `durum ${x.sorgu || '(peerhost yok)'}: beklenen ${x.beklenen}, sonuç ${kisa(x.ayr.sonuc || x.ayr.hata, 120)}`)];
  return sonuc;
}

// ---------------------------------------------------------------- (iii) API eşliği ve zamanlama
let tabanSrc = null;
const tabanKaynak = TABAN_MAIN ? path.resolve(TABAN_MAIN) : `git show ${TABAN}:js/main.js`;
try { tabanSrc = TABAN_MAIN ? fs.readFileSync(path.resolve(TABAN_MAIN), 'utf8') : execFileSync('git', ['-C', AGAC, 'show', `${TABAN}:js/main.js`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 24 }); } catch (e) { tabanSrc = null; }
const yardimciGovdeleri = (c) => {
  const out = {};
  for (const a of atamalar(c, /\b(?:window)\s*\.\s*DK/)) (out[a.ad] = out[a.ad] || []).push(a);
  return out;
};
if (!tabanSrc) {
  ekle('AP1', `Taban (${TABAN}) window.DK anahtarları`, false, `${tabanKaynak} okunamadı`);
} else {
  const tc = cozumle(tabanSrc);
  const m = /\bwindow\s*\.\s*DK\s*=\s*\{/.exec(tc.kod);
  const tabanNesne = m ? nesneAnahtarlari(tc, tc.kod.indexOf('{', m.index)) : null;
  const tabanAnahtar = tabanNesne ? tabanNesne.anahtarlar : [];
  ekle('AP1', `Taban (${TABAN}) main.js window.DK nesnesi: 49 anahtar`, tc.hatalar.length === 0 && !!tabanNesne && tabanAnahtar.length === 49 && !tabanNesne.yayilimlar.length && !tabanNesne.tanimsiz.length,
    tabanNesne ? { kaynak: tabanKaynak, sayi: tabanAnahtar.length, satir: satirNo(tc.src, m.index) } : `window.DK = { … } bulunamadı (${tabanKaynak})`);
  const tabanGovde = yardimciGovdeleri(tc);
  const tabanYardimci = YARDIMCILAR.filter((a) => tabanGovde[a] && tabanGovde[a].length === 1);
  ekle('AP1b', `Taban main.js'te 5 yardımcı (${YARDIMCILAR.join(', ')}) birer kez atanıyor (satır 136-152)`, tabanYardimci.length === 5 && YARDIMCILAR.every((a) => tabanGovde[a][0].satir >= 136 && tabanGovde[a][0].satir <= 152),
    Object.fromEntries(YARDIMCILAR.map((a) => [a, tabanGovde[a] ? tabanGovde[a].map((x) => x.satir) : null])));

  const kanc = dosya(KANCALAR);
  const ana = dosya(MAIN);
  const sorun = [];
  let kurulan = null;
  if (!kanc) sorun.push(`${KANCALAR} yok`);
  else if (!cozulebilir(kanc)) sorun.push(`${KANCALAR} çözümlenemedi`);
  if (!ana) sorun.push(`${MAIN} yok`);
  else if (!cozulebilir(ana)) sorun.push(`${MAIN} çözümlenemedi`);
  let apiAnahtar = null, installKonum = -1;
  if (!sorun.length) {
    const mi = /\binstall\s*\(\s*\{/.exec(ana.c.kod);
    if (!mi) sorun.push(`${MAIN}: install({ … }) çağrısı yok`);
    else {
      installKonum = mi.index;
      const n = nesneAnahtarlari(ana.c, ana.c.kod.indexOf('{', mi.index));
      if (!n || n.yayilimlar.length || n.tanimsiz.length) sorun.push(`${MAIN}: install nesnesi çözümlenemedi (${kisa(n)})`);
      else apiAnahtar = n.anahtarlar;
    }
    const mk = /\bwindow\s*\.\s*DK\s*=\s*\{/.exec(kanc.c.kod);
    const pm = /\bexport\s+function\s+install\s*\(\s*([A-Za-z_$][\w$]*)/.exec(kanc.c.kod);
    if (!mk) sorun.push(`${KANCALAR}: window.DK = { … } yok`);
    if (!pm) sorun.push(`${KANCALAR}: export function install(<api>) yok`);
    if (mk && pm && apiAnahtar) {
      const n = nesneAnahtarlari(kanc.c, kanc.c.kod.indexOf('{', mk.index));
      if (!n || n.tanimsiz.length || n.yayilimlar.some((y) => y !== pm[1])) sorun.push(`${KANCALAR}: window.DK nesnesi çözümlenemedi ya da install parametresi dışında yayılım var (${kisa(n)})`);
      else {
        const govde = yardimciGovdeleri(kanc.c);
        kurulan = new Set([...(n.yayilimlar.includes(pm[1]) ? apiAnahtar : []), ...n.anahtarlar, ...Object.keys(govde)]);
        // köşeli parantezli atama: window.DK['ad'] = …
        for (const s of kanc.c.dizgeler) if ((s.tur === 'tek' || s.tur === 'cift') && /\bwindow\s*\.\s*DK\s*\[\s*$/.test(kanc.c.kod.slice(Math.max(0, s.bas - 16), s.bas)) && /^\s*\]\s*=(?![=>])/.test(kanc.c.kod.slice(s.son, s.son + 8))) kurulan.add(s.deger);
      }
    }
  }
  if (sorun.length || !kurulan) {
    ekle('AP2', 'API eşliği: taban 49 alan + 5 yardımcı eksiksiz; fazla tam olarak audio, mod, __sayac', false, sorun.length ? sorun : 'kurulan anahtarlar çıkarılamadı');
  } else {
    const beklenen = [...tabanAnahtar, ...YARDIMCILAR];
    const eksik = beklenen.filter((a) => !kurulan.has(a));
    const fazla = [...kurulan].filter((a) => !beklenen.includes(a));
    const izinsiz = fazla.filter((a) => !IZINLI_FAZLA.includes(a));
    const eksikIzinli = IZINLI_FAZLA.filter((a) => !fazla.includes(a));
    ekle('AP2', 'API eşliği: taban 49 alan + 5 yardımcı eksiksiz; fazla tam olarak audio, mod, __sayac', eksik.length === 0 && izinsiz.length === 0 && eksikIzinli.length === 0,
      { eksik, fazla, izinsizFazla: izinsiz, kurulmayanEk: eksikIzinli, kurulanSayi: kurulan.size, apiSirasiAyni: apiAnahtar.slice(0, 49).join() === tabanAnahtar.join() });
  }
  // gövdeler
  if (!kanc || !cozulebilir(kanc)) ekle('AP3', 'snap/snapFrom/sim/tap/press gövdeleri taban main.js:136-152 ile aynı', false, `${KANCALAR} yok ya da çözümlenemedi`);
  else {
    const kg = yardimciGovdeleri(kanc.c);
    const ayr = {};
    let ok = true;
    for (const a of YARDIMCILAR) {
      const t = tabanGovde[a] && tabanGovde[a][0];
      const y = kg[a] || [];
      if (!t) { ok = false; ayr[a] = 'tabanda yok'; continue; }
      if (y.length !== 1) { ok = false; ayr[a] = `kancalar.js'te window.DK.${a} = … ataması ${y.length} kez (1 olmalı)`; continue; }
      const esit = normal(y[0].sag) === normal(t.sag);
      if (!esit) ok = false;
      ayr[a] = esit ? `aynı (taban satır ${t.satir}, kancalar satır ${y[0].satir})` : { taban: normal(t.sag).slice(0, 300), kancalar: normal(y[0].sag).slice(0, 300) };
    }
    // gövdelerin serbest adları install parametresinden alınmalı (main.js'teki aynı nesneler)
    const pm = /\bexport\s+function\s+install\s*\(\s*([A-Za-z_$][\w$]*)/.exec(kanc.c.kod);
    const SERBEST = ['post', 'engine', 'game', 'hud', 'net', 'input'];
    let bagli = [];
    if (pm) {
      const re = new RegExp('\\b(?:const|let)\\s*\\{([^}]*)\\}\\s*=\\s*' + pm[1] + '\\b', 'g');
      let m2;
      while ((m2 = re.exec(kanc.c.kod))) bagli.push(...m2[1].split(',').map((s) => s.trim().split(/\s*:\s*/)[0]).filter(Boolean));
    }
    const baglanmayan = SERBEST.filter((s) => !bagli.includes(s));
    if (baglanmayan.length) { ok = false; ayr.serbestAdlar = `install parametresinden alınmayan: ${baglanmayan.join(', ')}`; }
    else ayr.serbestAdlar = `${SERBEST.join(', ')} install(${pm[1]}) parametresinden`;
    ekle('AP3', 'snap/snapFrom/sim/tap/press gövdeleri taban main.js:136-152 ile aynı (boşluk normalleştirilerek)', ok, ayr);
  }
  // zamanlama (§5.7-2) ve görünür açılış hatası (A2-UY-02): bkz. zamanlama()
  if (!ana || !cozulebilir(ana)) {
    ekle('ZM', 'Zamanlama: install bekleniyor (await import) ve window.__ready ondan sonra yazılıyor', false, `${MAIN} yok ya da çözümlenemedi`);
    ekle('ZM2', 'Kancalar yükleme ekranı kaldırılmadan ve menü açılmadan önce bekleniyor ve kuruluyor', false, `${MAIN} yok ya da çözümlenemedi`);
  } else {
    const z = zamanlama(ana);
    ekle('ZM', 'Zamanlama: kancalar modülünün sözü bekleniyor (await), install ondan sonra, window.__ready install\'dan sonra yazılıyor', z.zm.ok, z.zm.ayr);
    ekle('ZM2', 'Kancalar boot() içinde yükleme ekranı kaldırılmadan ve menü açılmadan ÖNCE bekleniyor ve kuruluyor (yükleme/kurulum hatası görünür yükleme ekranında kalır; A2-UY-02)', z.zm2.ok, z.zm2.ayr);
  }
}

// ---------------------------------------------------------------- (iv) sinyal sunucusu kuralı (K9-20; A2-G-02)
const SINYAL = sinyalDenetimi(dosyalar);
ekle('SN00', 'Sinyal kuralının yapısı: GERI_DONGU yalnız testSinyali()\'nde, testParam(\'peer…\') yalnız testSinyali()\'nde, peerOpts/sinyalSunucusu testSinyali()\'ni kullanıyor, her new Peer(…) seçeneği peerOpts()\'tan; PeerJS URL ifadeleri bulundu',
  SINYAL.yapi.length === 0, SINYAL.yapi.length ? SINYAL.yapi : `${SINYAL.durumlar.length} durum koşuldu`);
SINYAL.durumlar.forEach((x, i) => ekle(`SN${String(i + 1).padStart(2, '0')}`, `testSinyali (gerçek net.js + gerçek PeerJS adres kurma): ?${x.sorgu || '(peerhost yok)'} → ${x.beklenen}`, x.ok, x.ayr));

// ---------------------------------------------------------------- (v) öz-sınama: bilinen ihlal biçimleri kuralları gerçekten kırmızıya çeviriyor mu?
// A2 incelemesinin mutasyonları (güvenlik G1–G7 ve K-08 mutantı; uyumluluk M1–M9) ve düzelticinin ekleri bellekte, dosyanın bozulmuş
// bir kopyasıyla kurallara verilir. Beklenen kural(lar)ın ihlal sayısı ağacın kendisine göre ARTMALIDIR; artmazsa öz-sınama KALIR (kural
// o biçimi kaçırıyor). Mutasyon noktası kaynakta bulunamazsa da KALIR (kaynak değişti: öz-sınama güncellenmeli). Dosyalara yazılmaz.
const OZ_SINAMA = [
  { id: 'NS01', ad: 'K-08 mutantı: peerOpts ?peerhost\'u document.URL\'den okur (v0.4 net.js:52; inceleme R3/R4)', dosya: NET, degistir: ['  if (s) { o.host = s.host; o.port = s.port; o.path = s.path; o.secure = s.secure; }\n  return o;', "  if (s) { o.host = s.host; o.port = s.port; o.path = s.path; o.secure = s.secure; }\n  const q = new URL(document.URL).searchParams;\n  if (q.get('peerhost')) { o.host = q.get('peerhost'); o.port = +(q.get('peerport') || 9000); o.path = q.get('peerpath') || '/'; o.secure = q.get('peersecure') === '1'; }\n  return o;"], beklenen: ['K4'] },
  { id: 'NS02', ad: 'G1 ?terrain test kipi dışında new URL(location.href).searchParams ile', dosya: 'js/world/terrain.js', degistir: ["this.mode = TEST ? (window.__DK_TERRAIN_MODE || testParam('terrain') || '') : '';", "this.mode = new URL(location.href).searchParams.get('terrain') || '';"], beklenen: ['K4'] },
  { id: 'NS03', ad: 'G2 peerhost new URL(document.URL).searchParams ile', dosya: NET, degistir: ['  const s = testSinyali();', "  const u = new URL(document.URL).searchParams; const s = u.get('peerhost') ? { host: u.get('peerhost'), port: +(u.get('peerport') || 443), path: '/', secure: true } : testSinyali();"], beklenen: ['K4'] },
  { id: 'NS04', ad: "G3 peerhost new URLSearchParams(location['search']) ile", dosya: NET, degistir: ['  const s = testSinyali();', "  const q = new URLSearchParams(location['search']); const s = q.get('peerhost') ? { host: q.get('peerhost'), port: 443, path: '/', secure: true } : testSinyali();"], beklenen: ['K4'] },
  { id: 'NS05', ad: 'G4 window.__DK_TERRAIN_MODE test kipi koruması olmadan', dosya: 'js/world/terrain.js', degistir: ["this.mode = TEST ? (window.__DK_TERRAIN_MODE || testParam('terrain') || '') : '';", "this.mode = window.__DK_TERRAIN_MODE || testParam('terrain') || '';"], beklenen: ['K5'] },
  { id: 'NS06', ad: 'G5 if (TEST !== undefined) (TEST false iken de doğru)', dosya: MAIN, hepsi: true, degistir: ['if (TEST) {', 'if (TEST !== undefined) {'], beklenen: ['K2'] },
  { id: 'NS07', ad: 'G6 testSinyali\'nde geri döngü denetimi kaldırıldı (if (!h) return null)', dosya: NET, degistir: ['if (!h || !GERI_DONGU.has(h)) return null;', 'if (!h) return null;'], beklenen: ['SN'] },
  { id: 'NS08', ad: 'G7 Object.assign(window, { DK: … }) (oyun kodu)', dosya: 'js/game/game.js', ekle: 'Object.assign(window, { DK: { G: 1 } });', beklenen: ['K1'] },
  { id: 'NS09', ad: 'M1 window?.DK?.G', dosya: 'js/ui/hud.js', ekle: 'export function _m1() { return window?.DK?.G; }', beklenen: ['K3'] },
  { id: 'NS10', ad: 'M2 const { DK } = window (yıkıcı atama)', dosya: 'js/ui/hud.js', ekle: 'export function _m2() { const { DK } = window; return DK && DK.G; }', beklenen: ['K3'] },
  { id: 'NS11', ad: 'M3 top.DK.G', dosya: 'js/ui/hud.js', ekle: 'export function _m3() { return top.DK.G; }', beklenen: ['K3'] },
  { id: 'NS12', ad: "M4 import('/js/test/kancalar.js') if (TEST) dışında (kökten belirteç)", dosya: 'js/ui/hud.js', ekle: "export function _m4() { return import('/js/test/kancalar.js'); }", beklenen: ['K2'] },
  { id: 'NS13', ad: "M5 import { install } from '/js/test/kancalar.js' (statik, kökten belirteç)", dosya: 'js/ui/hud.js', bas: "import { install as _kur } from '/js/test/kancalar.js';", beklenen: ['K2'] },
  { id: 'NS14', ad: "M6 new URL(location.href).searchParams.get('peerhost')", dosya: NET, ekle: "export function _m6() { return new URL(location.href).searchParams.get('peerhost'); }", beklenen: ['K4'] },
  { id: 'NS15', ad: "M7 import('../test/kancalar.js') if (TEST) dışında (denetim örneği)", dosya: 'js/ui/hud.js', ekle: "export function _m7() { return import('../test/kancalar.js'); }", beklenen: ['K2'] },
  { id: 'NS16', ad: 'M8 window.DK && window.DK.G (denetim örneği)', dosya: 'js/ui/hud.js', ekle: 'export function _m8() { return window.DK && window.DK.G; }', beklenen: ['K3'] },
  { id: 'NS17', ad: "M9 new URLSearchParams(document.URL.split('?')[1])", dosya: NET, ekle: "export function _m9() { return new URLSearchParams(document.URL.split('?')[1]).get('peerhost'); }", beklenen: ['K4'] },
  { id: 'NS18', ad: "Reflect.set(window, 'DK', …)", dosya: 'js/game/game.js', ekle: "Reflect.set(window, 'DK', {});", beklenen: ['K1', 'K3'] },
  { id: 'NS19', ad: "import('http://localhost:8081/js/test/kancalar.js') (tam adres)", dosya: 'js/ui/hud.js', ekle: "export function _n19() { return import('http://localhost:8081/js/test/kancalar.js'); }", beklenen: ['K2'] },
  { id: 'NS20', ad: 'location.hash okuması', dosya: 'js/ui/menu.js', ekle: 'export function _n20() { return location.hash; }', beklenen: ['K4'] },
  { id: 'NS21', ad: "peerOpts'ta testParam('peerhost') (test kipinde geri döngü denetimini atlar, K9-20)", dosya: NET, degistir: ['  if (s) { o.host = s.host;', "  if (testParam('peerhost')) o.host = testParam('peerhost');\n  if (s) { o.host = s.host;"], beklenen: ['SN'] },
  { id: 'NS22', ad: 'if (TEST, 1) (virgül işleci: her zaman doğru)', dosya: MAIN, hepsi: true, degistir: ['if (TEST) {', 'if (TEST, 1) {'], beklenen: ['K2'] },
  { id: 'NS23', ad: 'yükleme ekranı kancalar kurulmadan kaldırılıyor (A2-UY-02 öncesi sıra)', dosya: MAIN, degistir: ['  settings.load();', "  document.getElementById('loading').classList.remove('active');\n  settings.load();"], beklenen: ['ZM2'] },
  { id: 'NS24', ad: 'TEST && window.__DK_YENI_KANCA (izin verilen iki biçimin dışında)', dosya: 'js/world/terrain.js', ekle: 'export const _n24 = () => TEST && window.__DK_YENI_KANCA;', beklenen: ['K5'] },
];
function kuralSayilari(liste) {
  const r = kurallar(liste);
  const ana = dosyaBul(liste)(MAIN);
  const z = ana && cozulebilir(ana) ? zamanlama(ana) : null;
  return { ...Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v.length])), SN: sinyalDenetimi(liste).ihlal.length, ZM2: z && z.zm2.ok ? 0 : 1 };
}
const tabanSayilari = kuralSayilari(dosyalar);
for (const t of OZ_SINAMA) {
  const d = dosya(t.dosya);
  const ayr = { dosya: t.dosya, beklenen: t.beklenen };
  let yeni = null, ok = false;
  if (!d) ayr.sorun = `${t.dosya} yok`;
  else if (t.ekle !== undefined) yeni = d.c.src.replace(/\n?$/, '\n') + t.ekle + '\n';
  else if (t.bas !== undefined) yeni = t.bas + '\n' + d.c.src;
  else if (!d.c.src.includes(t.degistir[0])) ayr.sorun = `mutasyon noktası bulunamadı (${kisa(t.degistir[0], 90)}): kaynak değişti, öz-sınamayı güncelleyin`;
  else yeni = t.hepsi ? d.c.src.split(t.degistir[0]).join(t.degistir[1]) : d.c.src.replace(t.degistir[0], () => t.degistir[1]);
  if (yeni !== null) {
    const c = cozumle(yeni);
    if (c.hatalar.length) ayr.sorun = `bozulmuş kopya çözümlenemedi: ${c.hatalar.join('; ')}`;
    else {
      const say = kuralSayilari(dosyalar.map((x) => (x.yol === t.dosya ? { yol: x.yol, c } : x)));
      ayr.yakalayan = Object.keys(say).filter((k) => say[k] > tabanSayilari[k]);
      ok = t.beklenen.every((k) => ayr.yakalayan.includes(k));
    }
  }
  ekle(t.id, `Öz-sınama: ${t.ad} → ${t.beklenen.join(' + ')} kırmızı`, ok, ayr);
}

// ---------------------------------------------------------------- sonuç
const gecen = denetimler.filter((d) => d.ok).length;
for (const d of denetimler) console.log(`${d.ok ? 'GECTI' : 'KALDI'} ${d.id} ${d.ad}${d.ayrinti !== undefined ? ' — ' + kisa(d.ayrinti, 1200) : ''}`);
const durum = gecen === denetimler.length ? 'GECTI' : 'KALDI';
console.log(`SONUC: ${durum} (${gecen}/${denetimler.length} denetim)${durum === 'KALDI' ? ' | kalan: ' + denetimler.filter((d) => !d.ok).map((d) => d.id).join(', ') : ''}`);
if (RAPOR) {
  let commit = null;
  try { commit = execFileSync('git', ['-C', AGAC, 'rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch (e) { /* git yok */ }
  let kirli = null;
  try { kirli = execFileSync('git', ['-C', AGAC, 'status', '--porcelain', '--', 'js', 'tests/node/test_kipi.mjs'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim().length > 0; } catch (e) { /* git yok */ }
  fs.mkdirSync(path.dirname(path.resolve(RAPOR)), { recursive: true });
  fs.writeFileSync(RAPOR, JSON.stringify({ arac: 'tests/node/test_kipi.mjs', tur: 'node', agac: AGAC, taban: TABAN, commit, kirli, tarih: new Date().toISOString(), node: process.version,
    sonuc: { durum, gecen, toplam: denetimler.length, kalan: denetimler.filter((d) => !d.ok).map((d) => d.id) }, denetimler }, null, 1));
}
process.exit(durum === 'GECTI' ? 0 : 1);
