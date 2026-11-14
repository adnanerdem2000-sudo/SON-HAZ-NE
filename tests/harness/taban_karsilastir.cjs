// Faz kapısı karşılaştırması (Faz 9 tasarımı §7.3-2, §5.7-3): v0.4 taban koşusu (eski koşucu) ile yeni bir koşunun
// raporlarını KONTROL KONTROL karşılaştırır. Eşleme: aynı rapor adı + aynı kontrol etiketi.
// Ölçüt: tabanda geçen her kontrol yeni koşuda da geçer; tabanda tümüyle geçen her koşu yeni koşuda GECTI/OLCUM olur.
// 09_performans ve coop_06c kararsız diye kayıtlı: sonuçları yazılır, ama yine de tabanda GEÇEN kontrolleri sayılır.
//
//   node tests/harness/taban_karsilastir.cjs <taban_dizini> <yeni_dizin> [--json cikti.json] [--esle yeniAd=tabanAd]...
// Çıkış 0: regresyon, kayıp ve eksik resmî koşu yok; 1: en az biri var; 2: kullanım hatası.
// Dizinlerdeki taban_karsilastirma*.json (bu aracın kendi çıktısı) rapor sayılmaz.
const fs = require('fs'), path = require('path');
const argv = process.argv.slice(2);
const [tabanDizin, yeniDizin] = argv.filter((a, i) => !a.startsWith('--') && !(argv[i - 1] || '').startsWith('--'));
const opt = (ad) => { const i = argv.indexOf('--' + ad); return i >= 0 ? argv[i + 1] : null; };
const esle = {};
argv.forEach((a, i) => { if (a === '--esle') { const [y, t] = argv[i + 1].split('='); esle[y] = t; } });
if (!tabanDizin || !yeniDizin) { console.error('Kullanım: node tests/harness/taban_karsilastir.cjs <taban_dizini> <yeni_dizin> [--json cikti.json] [--esle yeniAd=tabanAd]'); process.exit(2); }

const oku = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const kontroller = (r) => r.checks
  ? r.checks.map((c) => ({ etiket: c.label, ok: c.ok === true, deger: c.detail }))
  : (r.steps || []).filter((s) => s.expect).map((s) => ({ etiket: s.expect.label || null, ok: s.expect.ok === true, deger: s.expect.value ?? s.expect.error }));
const KARARSIZ = new Set(['09_performans', 'coop_06c']);
// Resmî taban kümesi (25 koşu): taban dizinindeki summary.txt'te adı geçen tarayıcı koşuları; ötekiler (ör. işçisiz kipler) 'ek'
let RESMI = null;
try { RESMI = new Set(fs.readFileSync(path.join(tabanDizin, 'summary.txt'), 'utf8').split('\n').map((l) => (l.match(/^\d\d:\d\d:\d\d (\S+) rc=/) || [])[1]).filter((a) => a && !a.startsWith('node_'))); } catch (e) { /* yok */ }

const raporMu = (f) => f.endsWith('.json') && !f.startsWith('taban_karsilastirma');
const tabanlar = fs.readdirSync(tabanDizin).filter(raporMu).map((f) => f.slice(0, -5));
const yeniler = fs.readdirSync(yeniDizin).filter(raporMu).map((f) => f.slice(0, -5));
const satirlar = [];
let tabanGecenKontrol = 0, korunan = 0, regresyon = 0, kayip = 0, tabanTamKosu = 0, tamKorunanKosu = 0;
const ek = { tabanGecenKontrol: 0, korunan: 0, tabanTamKosu: 0, tamKorunanKosu: 0 };
const regresyonlar = [];
for (const y of yeniler) {
  const t = esle[y] || y;
  if (!tabanlar.includes(t)) { satirlar.push({ yeni: y, taban: null, not: 'tabanda karşılığı yok (yeni koşu)' }); continue; }
  let T, Y;
  try { T = oku(path.join(tabanDizin, t + '.json')); Y = oku(path.join(yeniDizin, y + '.json')); } catch (e) { satirlar.push({ yeni: y, taban: t, not: 'okunamadı: ' + e.message }); continue; }
  const tk = kontroller(T), yk = kontroller(Y);
  const tabanTam = tk.every((k) => k.ok) && !T.harnessError && !T.timeout && !(T.fails > 0) && !((T.pageErrors || []).length);
  const durum = Y.sonuc ? Y.sonuc.durum : (Y.fails || (Y.pageErrors || []).length ? 'KALDI?' : 'GECTI?');
  const resmi = !RESMI || RESMI.has(t);
  const k = { yeni: y, taban: t, resmi, kararsiz: KARARSIZ.has(t), tabanGecen: 0, tabanToplam: tk.length, yeniGecen: yk.filter((x) => x.ok).length, yeniToplam: yk.length,
    durum, cikis: Y.sonuc ? Y.sonuc.cikisKodu : null, neden: Y.sonuc ? Y.sonuc.neden : null,
    izinsizKonsol: Y.sonuc ? Y.sonuc.izinsizKonsol : null, izinsizAg: Y.sonuc ? Y.sonuc.izinsizAg : null, izinliKonsol: Y.sonuc ? Y.sonuc.izinliKonsol : null, izinliAg: Y.sonuc ? Y.sonuc.izinliAg : null,
    evalErrors: Array.isArray(Y.evalErrors) ? Y.evalErrors.length : Y.evalErrors, kapaliAtlama: Y.kapaliAtlama, tur: Y.sonuc ? Y.sonuc.turSayim : null,
    regresyon: [], kayip: [], duzelen: [], fazla: [] };
  const kullanildi = new Set();
  for (const a of tk) {
    // aynı etiketli birden çok kontrol olabilir: sırayla eşle
    const bi = yk.findIndex((b, i) => !kullanildi.has(i) && b.etiket === a.etiket);
    const b = bi >= 0 ? yk[bi] : null;
    if (bi >= 0) kullanildi.add(bi);
    if (a.ok) {
      k.tabanGecen++; if (resmi) tabanGecenKontrol++; else ek.tabanGecenKontrol++;
      if (!b) { kayip++; k.kayip.push(a.etiket); regresyonlar.push(`${y}: KAYIP — ${a.etiket}`); }
      else if (b.ok) { if (resmi) korunan++; else ek.korunan++; }
      else { regresyon++; k.regresyon.push({ etiket: a.etiket, tabanDeger: a.deger, yeniDeger: b.deger }); regresyonlar.push(`${y}: REGRESYON — ${a.etiket} (taban ${JSON.stringify(a.deger)?.slice(0, 80)} → yeni ${JSON.stringify(b.deger)?.slice(0, 120)})`); }
    } else if (b && b.ok) k.duzelen.push(a.etiket);
  }
  yk.forEach((b, i) => { if (!kullanildi.has(i)) k.fazla.push({ etiket: b.etiket, ok: b.ok }); });
  if (tabanTam) {
    if (resmi) tabanTamKosu++; else ek.tabanTamKosu++;
    const tam = (durum === 'GECTI' || durum === 'OLCUM') && k.regresyon.length === 0 && k.kayip.length === 0;
    if (tam) { if (resmi) tamKorunanKosu++; else ek.tamKorunanKosu++; } else regresyonlar.push(`${y}: tabanda tümüyle geçen koşu yeni koşuda ${durum}${k.neden && k.neden.length ? ' (' + k.neden.join('; ') + ')' : ''}`);
    k.tabanTam = true; k.tamKorundu = tam;
  }
  satirlar.push(k);
}
const eksik = tabanlar.filter((t) => !yeniler.some((y) => (esle[y] || y) === t));
const eksikResmi = eksik.filter((t) => !RESMI || RESMI.has(t));
for (const s of satirlar) {
  if (!s.taban) { console.log(`${s.yeni.padEnd(28)} ${s.not}`); continue; }
  if (s.not) { console.log(`${s.yeni.padEnd(28)} ${s.not}`); continue; }
  console.log(`${(s.resmi ? '' : '[ek] ') + s.yeni}`.padEnd(28) + ` taban ${s.tabanGecen}/${s.tabanToplam}  yeni ${s.yeniGecen}/${s.yeniToplam}  ${String(s.durum).padEnd(13)} çıkış ${s.cikis}  izinsiz k/a ${s.izinsizKonsol}/${s.izinsizAg}  izinli k/a ${s.izinliKonsol}/${s.izinliAg}` +
    (s.kapaliAtlama !== undefined ? `  kapaliAtlama ${s.kapaliAtlama} evalErr ${s.evalErrors}` : '') + (s.kararsiz ? '  [kararsız diye kayıtlı]' : ''));
  for (const r of s.regresyon) console.log(`    REGRESYON: ${r.etiket}`);
  for (const r of s.kayip) console.log(`    KAYIP: ${r}`);
  for (const r of s.duzelen) console.log(`    düzeldi (taban KALDI → yeni GEÇTİ): ${r}`);
  for (const r of s.fazla) console.log(`    yeni kontrol: ${r.ok ? 'GEÇTİ' : 'KALDI'} ${r.etiket}`);
  if (s.neden && s.neden.length && s.durum !== 'GECTI' && s.durum !== 'OLCUM') console.log(`    neden: ${s.neden.join('; ')}`);
}
if (eksik.length) console.log(`\nYeni koşuda raporu OLMAYAN taban koşuları: ${eksik.join(', ')}`);
console.log(`\nÖZET (resmî taban kümesi${RESMI ? ', ' + RESMI.size + ' koşu' : ''}): tabanda tümüyle geçen ${tabanTamKosu} koşunun ${tamKorunanKosu}'i yeni koşuda da tümüyle geçti; tabanda geçen ${tabanGecenKontrol} kontrolün ${korunan}'i geçti.`);
console.log(`EK koşular (işçisiz kipler vb.): tümüyle geçen ${ek.tabanTamKosu} koşunun ${ek.tamKorunanKosu}'i; geçen ${ek.tabanGecenKontrol} kontrolün ${ek.korunan}'i. Toplam regresyon ${regresyon}, kayıp ${kayip}${eksikResmi.length ? `, raporu eksik resmî koşu ${eksikResmi.length}` : ''}.`);
if (regresyonlar.length) { console.log('SORUNLAR:'); for (const r of regresyonlar) console.log('  - ' + r); }
const json = opt('json');
if (json) fs.writeFileSync(json, JSON.stringify({ tabanDizin, yeniDizin, ozet: { tabanTamKosu, tamKorunanKosu, tabanGecenKontrol, korunan, ek, regresyon, kayip, eksik, eksikResmi }, sorunlar: regresyonlar, kosular: satirlar }, null, 1));
process.exit(regresyon || kayip || tamKorunanKosu < tabanTamKosu || ek.tamKorunanKosu < ek.tabanTamKosu || eksikResmi.length ? 1 : 0);
