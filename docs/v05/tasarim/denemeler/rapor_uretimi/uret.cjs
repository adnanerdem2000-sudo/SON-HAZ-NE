// Faz 0 rapor üreticisi: raw.json + kararlar.cjs → denetim_bulgulari.json, AUDIT_CURRENT.md, KNOWN_ISSUES.md
// Kullanım: node uret.cjs            → scratch/out/ altına yazar (deneme)
//           node uret.cjs --final    → yalnız üç hedef dosyaya yazar
'use strict';
const fs = require('fs');
const path = require('path');
const d = require('./raw.json');
const K = require('./kararlar.cjs');
const { targets } = require('./map_refs.cjs');

const FINAL = process.argv.includes('--final');
const OUT = FINAL
  ? { json: '/home/user/SON-HAZ-NE-w2/docs/v05/denetim_bulgulari.json', audit: '/home/user/SON-HAZ-NE-w2/AUDIT_CURRENT.md', ki: '/home/user/SON-HAZ-NE-w2/KNOWN_ISSUES.md' }
  : { json: path.join(__dirname, 'out/denetim_bulgulari.json'), audit: path.join(__dirname, 'out/AUDIT_CURRENT.md'), ki: path.join(__dirname, 'out/KNOWN_ISSUES.md') };

// ---------- etiketler ----------
const PRI_RANK = { kritik: 0, yuksek: 1, orta: 2, dusuk: 3 };
const PRI_LBL = { kritik: 'kritik', yuksek: 'yüksek', orta: 'orta', dusuk: 'düşük' };
const PRI_CAP = { kritik: 'Kritik', yuksek: 'Yüksek', orta: 'Orta', dusuk: 'Düşük' };
const ST_LBL = { dogrulandi: 'Doğrulandı', kismen_duzeltildi: 'Kısmen doğrulandı, düzeltildi', belirsiz: 'Belirsiz', curutuldu: 'Çürütüldü' };
const ST_KISA = { dogrulandi: 'doğrulandı', kismen_duzeltildi: 'kısmen düzeltildi', belirsiz: 'belirsiz', curutuldu: 'çürütüldü' };
const TUR_LBL = { dogrudan: 'doğrudan karşı doğrulama', dolayli: 'dolaylı doğrulama', iki_kaynak: 'iki bağımsız kaynak', tasarim: 'faz tasarım belgesinde yeniden sınama', yok: 'karşı doğrulama yok' };
const SURUM_LBL = { v03_ve_v04: 'v0.3 ve v0.4', yalniz_v04: 'yalnız v0.4', yalniz_v03: 'yalnız v0.3 (canlı dal); v0.4 dalında giderilmiş' };
const SYS_LBL = {
  calisiyor_test_edilmis: 'Çalışıyor ve test edilmiş', calisiyor_gelistirilmeli: 'Çalışıyor ancak geliştirilmeli',
  hatali_kararsiz: 'Hatalı veya kararsız', eksik: 'Eksik veya uygulanmamış', dogrulanmamis: 'Kodda var ama oynanışta doğrulanmamış',
};
const SYS_ORDER = ['calisiyor_test_edilmis', 'calisiyor_gelistirilmeli', 'hatali_kararsiz', 'eksik', 'dogrulanmamis'];
const REQ_LBL = { karsilaniyor: 'Karşılanıyor', kismen: 'Kısmen', yok: 'Yok' };
const UC_LBL = { dogru: 'Doğru', kismen: 'Kısmen', yanlis: 'Yanlış' };
const DOC_LBL = { dogru: 'Doğru', kismen: 'Kısmen doğru', yanlis: 'Yanlış', dogrulanamadi: 'Doğrulanamadı' };
const VER_LBL = { dogrulandi: 'doğrulandı', kismen: 'kısmen', curutuldu: 'çürütüldü' };
const CONF_LBL = { kesin: 'kesin', yuksek: 'yüksek', orta: 'orta' };
const FIELD_LBL = { title: 'başlık', file: 'dosya', rootCause: 'kök neden', impact: 'oyuncuya etkisi', fix: 'önerilen çözüm', repro: 'tekrar üretme', acceptance: 'kabul testi', knownAs: 'bilinen kimlik', priority: 'öncelik' };
const AREAS = 'ABCDEFGHIJK';

// ---------- yardımcılar ----------
const pad2 = (n) => String(n).padStart(2, '0');
const pad3 = (n) => String(n).padStart(3, '0');
const norm = (s) => String(s ?? '').replace(/\s*\n\s*/g, ' ').trim();
function escLt(s) {
  s = norm(s);
  const parts = s.split('`');
  if (parts.length % 2 === 1) return parts.map((p, i) => (i % 2 ? p : p.replace(/</g, '&lt;'))).join('`');
  return s.replace(/</g, '&lt;');
}
const md = (s) => escLt(s);
const cell = (s) => escLt(s).replace(/\|/g, '\\|');
function trunc(s, n) {
  s = norm(s);
  if (s.length <= n) return s;
  let t = s.slice(0, n);
  const sp = t.lastIndexOf(' ');
  if (sp > n * 0.6) t = t.slice(0, sp);
  if ((t.split('`').length - 1) % 2 === 1) t = t.replace(/`[^`]*$/, '');
  return t.replace(/[\s,;:(]+$/, '') + ' …';
}
function idKey(id) {
  const m = id.match(/^([A-K])-(M?)(\d+)$/);
  if (!m) throw new Error('kimlik biçimi: ' + id);
  return [AREAS.indexOf(m[1]), m[2] ? 1 : 0, +m[3]];
}
function cmpId(a, b) { const x = idKey(a), y = idKey(b); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; }
const primFaz = (f) => (String(f).match(/F\d/) || ['F9'])[0];
const fazAdi = (f) => String(f).replace(/F(\d)/g, 'Faz $1');
const fail = (m) => { throw new Error(m); };

// ---------- birleştirme ----------
const items = [];
const byId = {};
const alanlar = [];

function mkItem(a, raw, kaynak, v) {
  const id = raw.id;
  const it = {
    id, alan: a.key, kaynak,
    title: raw.title, file: raw.file, func: raw.func, rootCause: raw.rootCause, impact: raw.impact,
    priority: raw.priority, fix: raw.fix, repro: raw.repro, acceptance: raw.acceptance,
    presentIn: raw.presentIn ?? null, presentIn_not: raw.presentIn_not || null,
    confidence: raw.confidence ?? null, knownAs: raw.knownAs ?? null,
  };
  if (kaynak === 'dogrulama_kacan') {
    const mm = K.MISSED_META[id] || fail('MISSED_META eksik: ' + id);
    it.presentIn = mm.presentIn;
    if (K.TAKMA[id]) it.knownAs = K.TAKMA[id];
    it.presentIn_not = mm.presentIn ? (mm.cikarim ? 'karşı doğrulama metninden çıkarım; açıkça belirtilmedi' : 'karşı doğrulama metnine göre') : 'karşı doğrulama metninde belirtilmedi';
  }
  if (!['kritik', 'yuksek', 'orta', 'dusuk'].includes(it.priority)) fail('öncelik: ' + id + ' ' + it.priority);
  const ozgun = {};
  const uyg = [];
  const dz = K.DUZELTME[id];
  if (dz) {
    for (const f of Object.keys(dz)) {
      if (!(f in FIELD_LBL)) fail('bilinmeyen alan ' + id + '.' + f);
      const c = dz[f];
      let val = it[f] ?? '';
      ozgun[f] = it[f] ?? null;
      if (c.r !== undefined) { val = c.r; uyg.push({ alan: f, tur: 'degistirildi' }); }
      if (c.sub) {
        for (const [o, n] of c.sub) { if (!val.includes(o)) fail(`parça bulunamadı ${id}.${f}: ${o.slice(0, 80)}`); val = val.replace(o, n); }
        uyg.push({ alan: f, tur: 'parca_degistirildi' });
      }
      if (c.e) { val = (val ? val + ' ' : '') + c.e; uyg.push({ alan: f, tur: 'eklendi' }); }
      it[f] = val;
    }
  }
  it.oncelik_denetim = raw.priority;
  if (K.ONCELIK[id]) {
    if (K.ONCELIK[id] === raw.priority) fail('gereksiz öncelik düzeltmesi ' + id);
    it.priority = K.ONCELIK[id];
    uyg.push({ alan: 'priority', tur: 'degistirildi', eski: raw.priority, yeni: K.ONCELIK[id] });
  }
  if (v && K.DOLAYLI[id]) fail('hem doğrudan hem dolaylı: ' + id);
  if (K.BELIRSIZ_NOT[id] && (v || K.DOLAYLI[id])) fail('belirsiz notu çakışıyor: ' + id);
  if (v) {
    it.dogrulama = { ref: v.ref, hukum: v.verdict, kanit: v.evidence, duzeltme: v.correction || null };
    it.final_status = v.verdict === 'dogrulandi' ? 'dogrulandi' : v.verdict === 'kismen' ? 'kismen_duzeltildi' : 'curutuldu';
    it.dogrulama_turu = 'dogrudan';
    it.dogrulama_notu = null;
    if (v.correction && !dz && !K.ONCELIK[id]) fail('düzeltmesi uygulanmamış hüküm: ' + id);
    if (v.verdict === 'kismen' && !dz && !K.ONCELIK[id]) fail('kısmen hükmü uygulanmamış: ' + id);
  } else if (K.DOLAYLI[id]) {
    const [tur, durum, not] = K.DOLAYLI[id];
    it.dogrulama = null; it.final_status = durum; it.dogrulama_turu = tur; it.dogrulama_notu = not;
  } else {
    it.dogrulama = null; it.final_status = 'belirsiz'; it.dogrulama_turu = 'yok'; it.dogrulama_notu = K.BELIRSIZ_NOT[id] || null;
  }
  it.ek_dogrulama = null;
  const f7 = K.TASARIM_DOG[id];
  if (f7) {
    const [belge, tip, not] = f7;
    const hk = tip === 'kismen' ? 'kısmen doğru' : tip === 'dogru_duzeltme' ? 'doğru (düzeltmeyle)' : 'doğru';
    const metin = `${belge}: ${hk}. ${not || 'Kod okumasıyla; satırlar belgenin ilgili bölümlerinde.'}`;
    if (it.final_status === 'belirsiz') {
      const kd = tip === 'kismen' || tip === 'dogru_duzeltme';
      if (kd && !dz) fail('tasarım belgesi kısmen hükmü uygulanmamış: ' + id);
      it.final_status = kd ? 'kismen_duzeltildi' : 'dogrulandi';
      it.dogrulama_turu = 'tasarim';
      it.dogrulama_notu = metin + (it.dogrulama_notu ? ' ' + it.dogrulama_notu : '');
    } else it.ek_dogrulama = metin;
  }
  it.hedef_faz = raw.hedef_faz || K.FAZ[id] || K.ALAN_FAZ[a.key];
  it.uygulanan_duzeltmeler = uyg;
  it.ozgun = Object.keys(ozgun).length ? ozgun : null;
  if (raw.kaynak_ref) it.kaynak_ref = raw.kaynak_ref;
  return it;
}

for (const a of d) {
  const t = targets(a);
  const au = a.audit, ve = a.verify;
  const vByRef = {};
  for (const v of ve.verdicts) {
    if (vByRef[v.ref]) fail('çift hüküm ' + a.key + '/' + v.ref);
    if (!t[v.ref]) fail('çözülemeyen hüküm ' + a.key + '/' + v.ref);
    vByRef[v.ref] = v;
  }
  const hatalar = [];
  for (const i of au.issues) hatalar.push(mkItem(a, i, 'denetim', vByRef[i.id] || null));
  ve.missed.forEach((m, j) => hatalar.push(mkItem(a, { id: a.key + '-M' + pad2(j + 1), ...m }, 'dogrulama_kacan', null)));
  for (const e of K.EK_MADDELER.filter((x) => x.alan === a.key)) {
    const n = +e.id.split('-M')[1];
    const maxM = Math.max(0, ...hatalar.filter((x) => x.id.includes('-M')).map((x) => +x.id.split('-M')[1]));
    if (n !== maxM + 1) fail('ek madde numarası ' + e.id);
    hatalar.push(mkItem(a, e, 'dogrulama_duzeltmesi', null));
  }
  for (const it of hatalar) { if (byId[it.id]) fail('çift kimlik ' + it.id); byId[it.id] = it; items.push(it); }

  // sistemler
  const sysT = au.systems.map((s, i) => i).filter((i) => au.systems[i].status === 'calisiyor_test_edilmis');
  const sKar = K.SYS_KARAR[a.key] || {};
  for (const ref of Object.keys(sKar)) if (!vByRef[ref]) fail('SYS kararı hükümsüz: ' + a.key + '/' + ref);
  const sistemler = [];
  au.systems.forEach((s, idx) => {
    const ord = sysT.indexOf(idx);
    const ref = ord >= 0 ? 'SYS' + (ord + 1) : null;
    const v = ref ? vByRef[ref] : null;
    const kar = ref ? sKar[ref] : null;
    if (v && v.verdict !== 'dogrulandi' && !kar) fail('SYS kısmen/çürütüldü kararsız: ' + a.key + '/' + ref);
    const base = { ref, ad: s.name, denetci_durumu: s.status, kanit: s.evidence, not: s.note || null, dogrulama: v ? { hukum: v.verdict, kanit: v.evidence, duzeltme: v.correction || null } : null };
    if (kar && kar.split) kar.split.forEach(([parca, st]) => sistemler.push({ ...base, ad: s.name + ' — ' + parca, parca, kategori: st, bolunmus: true }));
    else sistemler.push({ ...base, kategori: kar && kar.to ? kar.to : s.status, bolunmus: false });
  });

  // gereksinimler
  const reqK = au.requirements.map((r, i) => i).filter((i) => au.requirements[i].status === 'karsilaniyor');
  const gereksinimler = au.requirements.map((r, idx) => {
    const ord = reqK.indexOf(idx);
    const ref = ord >= 0 ? 'REQ' + (ord + 1) : null;
    const v = ref ? vByRef[ref] : null;
    if (v && v.verdict === 'curutuldu') fail('REQ çürütüldü beklenmiyordu');
    return { ref, gereksinim: r.req, durum: v && v.verdict === 'kismen' ? 'kismen' : r.status, denetci_durumu: r.status, kanit: r.evidence, plan: r.plan, dogrulama: v ? { hukum: v.verdict, kanit: v.evidence, duzeltme: v.correction || null } : null };
  });

  // kullanıcı iddiaları
  const uKar = K.UC_KARAR[a.key] || {};
  const kullanici_iddialari = au.userClaims.map((u, i) => {
    const ref = 'UC' + (i + 1);
    const v = vByRef[ref] || null;
    const kar = uKar[ref] || {};
    if (v && v.verdict === 'kismen' && !uKar[ref] && !(a.key === 'G' && ref === 'UC1')) fail('UC kısmen kararsız: ' + a.key + '/' + ref);
    return { ref, iddia: u.claim, v03: kar.v03 || u.v03, v04: kar.v04 || u.v04, denetci_v03: u.v03, denetci_v04: u.v04, kanit: u.evidence, dogrulama: v ? { hukum: v.verdict, kanit: v.evidence, duzeltme: v.correction || null } : null };
  });

  // belge iddiaları
  const docY = au.docClaims.map((x, i) => i).filter((i) => au.docClaims[i].verdict === 'yanlis');
  const belge_iddialari = au.docClaims.map((x, idx) => {
    const ord = docY.indexOf(idx);
    const ref = ord >= 0 ? 'DOC' + (ord + 1) : null;
    const v = ref ? vByRef[ref] : null;
    return { ref, belge: x.doc, iddia: x.claim, hukum: v && v.verdict === 'kismen' ? 'kismen' : x.verdict, denetci_hukmu: x.verdict, kanit: x.evidence, dogrulama: v ? { hukum: v.verdict, kanit: v.evidence, duzeltme: v.correction || null } : null };
  });

  alanlar.push({ key: a.key, ad: a.ad, hedef_faz: K.ALAN_FAZ[a.key], audit: au, verify: ve, birlestirme: { hatalar, sistemler, gereksinimler, kullanici_iddialari, belge_iddialari } });
}

// ---------- bilinen sorunlar ----------
const inFull = new Map();
for (const c of K.KUMELER) for (const id of c.uyeler) { if (!byId[id]) fail('küme üyesi yok ' + id); if (inFull.has(id)) fail('iki kümede ' + id); inFull.set(id, c); }
for (const c of K.KUMELER) for (const id of c.kismi || []) if (!byId[id]) fail('kısmi üye yok ' + id);
for (const id of Object.keys(K.KISMI_TEKIL)) { if (!byId[id]) fail('KISMI_TEKIL yok ' + id); for (const x of K.KISMI_TEKIL[id]) if (!byId[x]) fail('KISMI_TEKIL üye yok ' + x); }
for (const id of K.KI_DISI) if (!byId[id]) fail('KI_DISI yok ' + id);
for (const id of [...Object.keys(K.DUZELTME), ...Object.keys(K.ONCELIK), ...Object.keys(K.DOLAYLI), ...Object.keys(K.BELIRSIZ_NOT), ...Object.keys(K.FAZ), ...Object.keys(K.MISSED_META)]) if (!byId[id]) fail('karar tablosunda bilinmeyen kimlik ' + id);

const maxPri = (ids) => ids.map((i) => byId[i].priority).sort((x, y) => PRI_RANK[x] - PRI_RANK[y])[0];
const kiList = [];
for (const c of K.KUMELER) {
  const uy = [...c.uyeler];
  kiList.push({ tip: 'kume', kume: c.kod, uyeler: uy, kismi: c.kismi || [], baslik: c.baslik || byId[uy[0]].title, oncelik: maxPri(uy), hedef_faz: c.faz, birincil: uy[0] });
}
for (const it of items) {
  if (inFull.has(it.id) || K.KI_DISI.includes(it.id)) continue;
  kiList.push({ tip: 'tekil', kume: null, uyeler: [it.id], kismi: K.KISMI_TEKIL[it.id] || [], baslik: it.title, oncelik: it.priority, hedef_faz: it.hedef_faz, birincil: it.id });
}
kiList.sort((x, y) => PRI_RANK[x.oncelik] - PRI_RANK[y.oncelik] || cmpId(x.birincil, y.birincil));
kiList.forEach((k, i) => { k.ki = 'KI-' + pad3(i + 1); });
for (const it of items) { it.known_issue = null; it.ilgili_known_issues = []; }
for (const k of kiList) {
  for (const id of k.uyeler) byId[id].known_issue = k.ki;
  for (const id of k.kismi) byId[id].ilgili_known_issues.push(k.ki);
}
for (const it of items) if (!it.known_issue && !it.ilgili_known_issues.length) fail('KI bağlantısı yok ' + it.id);
for (const k of kiList) {
  const ids = [...k.uyeler, ...k.kismi];
  k.alanlar = [...new Set(ids.map((i) => byId[i].alan))];
  const files = [];
  for (const id of k.uyeler) { const f = norm(byId[id].file).split(/;\s*/)[0]; if (f && !files.includes(f)) files.push(f); }
  k.dosya = files.join('; ');
  k.durum = k.uyeler.map((id) => K.DURUM_NOT[id]).find(Boolean) || (k.uyeler.every((id) => byId[id].presentIn === 'yalniz_v03') ? 'Açık (yalnız canlı v0.3 dalında; v0.4 dalında giderildi)' : 'Açık');
  k.dogrulama = Object.fromEntries(ids.map((id) => [id, byId[id].final_status]));
  k.bilinen_kimlikler = k.uyeler.map((id) => byId[id].knownAs).filter(Boolean);
}
const kiById = Object.fromEntries(kiList.map((k) => [k.ki, k]));

// ---------- sayımlar ----------
function sayAlan(key) {
  const al = alanlar.find((x) => x.key === key);
  const h = al.birlestirme.hatalar;
  const c = { denetim: 0, kacan: 0, ek: 0, toplam: h.length, dogrulandi: 0, dogrudan: 0, dolayli: 0, iki_kaynak: 0, tasarim: 0, kismen_duzeltildi: 0, belirsiz: 0, curutuldu: 0, kritik: 0, yuksek: 0, orta: 0, dusuk: 0,
    denetim_dogrulanan: 0, denetim_curutulen: 0, denetim_belirsiz: 0, denetim_kismen: 0 };
  for (const it of h) {
    if (it.kaynak === 'denetim') c.denetim++; else if (it.kaynak === 'dogrulama_kacan') c.kacan++; else c.ek++;
    c[it.final_status]++;
    if (it.final_status === 'dogrulandi') c[it.dogrulama_turu]++;
    c[it.priority]++;
    if (it.kaynak === 'denetim') {
      if (it.final_status === 'dogrulandi' || it.final_status === 'kismen_duzeltildi') c.denetim_dogrulanan++;
      if (it.final_status === 'kismen_duzeltildi') c.denetim_kismen++;
      if (it.final_status === 'curutuldu') c.denetim_curutulen++;
      if (it.final_status === 'belirsiz') c.denetim_belirsiz++;
    }
  }
  c.sistem = Object.fromEntries(SYS_ORDER.map((s) => [s, al.birlestirme.sistemler.filter((x) => x.kategori === s).length]));
  c.sistem_satir = al.birlestirme.sistemler.length;
  c.sistem_curutulen = al.birlestirme.sistemler.filter((x) => x.dogrulama && x.dogrulama.hukum === 'curutuldu' && !x.bolunmus).length;
  c.gereksinim = Object.fromEntries(['karsilaniyor', 'kismen', 'yok'].map((s) => [s, al.birlestirme.gereksinimler.filter((x) => x.durum === s).length]));
  return c;
}
const sayilar = Object.fromEntries(AREAS.split('').map((k) => [k, sayAlan(k)]));
const toplam = {};
for (const k of AREAS) for (const [f, v] of Object.entries(sayilar[k])) {
  if (typeof v === 'number') toplam[f] = (toplam[f] || 0) + v;
  else { toplam[f] = toplam[f] || {}; for (const [g, w] of Object.entries(v)) toplam[f][g] = (toplam[f][g] || 0) + w; }
}
alanlar.forEach((al) => { al.birlestirme.sayilar = sayilar[al.key]; });
const kiPri = { kritik: 0, yuksek: 0, orta: 0, dusuk: 0 };
kiList.forEach((k) => kiPri[k.oncelik]++);

// ---------- JSON ----------
const META = {
  baslik: 'Deniz Korsanları: Son Hazine — Faz 0 denetim bulguları (birleştirilmiş veri)',
  tarih: '2026-11-14',
  surumler: {
    v03: { rol: 'canlı (GitHub Pages)', commit: '762f1c76674cad279931e28b5148a94933832b43', kisa: '762f1c7', dal: 'claude/hopeful-cray-o1jw6w' },
    v04: { rol: 'geliştirme; denetlenen kod', commit: '44d548cf0011c51158d6aaf3bcc79304c157f3ba', kisa: '44d548c', dal: 'claude/denetim-v0.4' },
    v05_dal: { dal: 'claude/v0.5-saglamlastirma', taban: '44d548c', rapor_head: 'a47f88c', not: "44d548c'den sonraki commit'ler (e194d59, 3725aac, 7858a89, 8d8fb8a, f80f205, a47f88c) yalnız docs/ altında değişiklik içeriyor; oyun kodu v0.4 ile aynı." },
  },
  yontem: "11 alan (A–K). Her alanda bir denetçi statik kod okuması ve Node'da salt-okur kopyalarla hesap/hata enjeksiyonu yaptı; bağımsız bir karşı doğrulayıcı kritik/yüksek hataları, 'çalışıyor ve test edilmiş' sistemleri, 'karşılanıyor' gereksinimleri, 'yanlış' belge iddialarını ve kullanıcı iddialarını yeniden sınadı ve gözden kaçan hataları ekledi. H, I ve J maddeleri ile K-09 ayrıca faz tasarım belgelerinin doğrulama tablolarında (Faz 7 §0.5, Faz 8 Ek A, Faz 9 §0.2) yeniden sınandı; bu sonuçlar ek doğrulama kaynağı olarak işlendi. Tarayıcı testleri ayrı bir taban koşusunda yürütüldü; sonuçları AUDIT_CURRENT.md §9'a ana oturum ekleyecek.",
  sinirlar: ['Gerçek GPU yok (taban koşusu headless Chromium + SwiftShader).', 'Gerçek ağ yok (yerel PeerJS sunucusu, loopback; NAT/TURN denenmedi).', 'Kod değiştirilmedi; kanıt betikleri /tmp/denetim_alan altında geçici.'],
  final_status_tanimlari: {
    dogrulandi: 'Ana kusur ikinci bir kaynakla doğrulandı: doğrudan karşı doğrulama hükmü, başka bir hükmün açık kanıtı (dolaylı), iki bağımsız denetçi/doğrulayıcı ya da faz tasarım belgesindeki yeniden sınama (H, I, J, K-09). Sınanmayan alt iddialar dogrulama_notu alanında.',
    kismen_duzeltildi: "Karşı doğrulama bulguyu kabul etti ama kapsamını, sayılarını, mekanizmasını ya da önceliğini düzeltti; düzeltme alanlara uygulandı (uygulanan_duzeltmeler, ozgun).",
    belirsiz: 'Tek kaynaklı; karşı doğrulama bu maddeyi sınamadı. Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli.',
    curutuldu: 'Karşı doğrulama bulguyu çürüttü. (Bu denetimde hiçbir hata maddesi çürütülmedi; çürütülen tek iddia H alanındaki bir sistem iddiası.)',
  },
  dogrulama_turu_tanimlari: { dogrudan: 'Maddenin kendi karşı doğrulama hükmü var.', dolayli: 'Başka bir hüküm (sistem, gereksinim, kullanıcı/belge iddiası ya da başka hata) bu kusuru açıkça doğruluyor.', iki_kaynak: 'İki bağımsız denetçi ya da doğrulayıcı aynı kusuru ayrı ayrı buldu.', tasarim: "Karşı doğrulaması olmayan madde, faz tasarım belgesinin madde bazındaki doğrulama tablosunda yeniden sınandı: H ve I için Faz 7 §0.5, J için Faz 8 Ek A, K-09 için Faz 9 §0.2 (kod okuması, salt-okur Node denemeleri, tarayıcı ölçümleri). 'Kısmen doğru' ya da düzeltmeli sonuçlar alanlara uygulandı. Başka kaynakla zaten doğrulanmış maddelerde bu sınama ek_dogrulama alanında.", yok: 'Karşı doğrulama yok.' },
  kimlik_semasi: { '<alan>-NN': 'denetçi bulgusu (A-01 … K-20)', '<alan>-Mxx': "karşı doğrulayıcının gözden kaçan bulgusu; doğrulama düzeltmelerinden çıkarılan ek maddeler de aynı numaralamayı sürdürür (kaynak: 'dogrulama_duzeltmesi')", 'KI-xxx': 'KNOWN_ISSUES.md kimliği; eski 02_HATA_LISTESI ve tasarım karar numaralarıyla çakışmayı önlemek için yeni ad alanı', 'UCn/SYSn/REQn/DOCn': "karşı doğrulama başvuruları: UCn = n. kullanıcı iddiası; SYSn = 'çalışıyor ve test edilmiş' sistemlerin n.'si; REQn = 'karşılanıyor' gereksinimlerin n.'si; DOCn = 'yanlış' belge iddialarının n.'si (alan içinde, sırayla)" },
  oncelik_degerleri: ['kritik', 'yuksek', 'orta', 'dusuk'],
  sistem_kategorileri: SYS_LBL,
  sayilar: { alan: sayilar, toplam, known_issues: { toplam: kiList.length, ...kiPri } },
  uretim: 'Bu dosya, denetim ve karşı doğrulama ham verisinden rapor yazımı sırasında betikle üretildi. AUDIT_CURRENT.md ve KNOWN_ISSUES.md aynı birleştirmeden üretildi.',
};
const JSON_OUT = {
  meta: META,
  alanlar: alanlar.map((al) => ({ key: al.key, ad: al.ad, hedef_faz: al.hedef_faz, audit: al.audit, verify: al.verify, birlestirme: al.birlestirme })),
  known_issues: kiList.map((k) => ({ ki: k.ki, baslik: k.baslik, oncelik: k.oncelik, alanlar: k.alanlar, dosya: k.dosya, hedef_faz: k.hedef_faz, durum: k.durum, uyeler: k.uyeler, kismi_uyeler: k.kismi, kume: k.kume, dogrulama: k.dogrulama, bilinen_kimlikler: k.bilinen_kimlikler })),
  capraz_kumeler: K.KUMELER.map((c) => ({ kod: c.kod, ki: byId[c.uyeler[0]].known_issue, uyeler: c.uyeler, kismi_uyeler: c.kismi || [], hedef_faz: c.faz, baslik: c.baslik || byId[c.uyeler[0]].title })),
};

// ---------- AUDIT_CURRENT.md ----------
const L = [];
const P = (...x) => L.push(...x);
const alanAd = Object.fromEntries(alanlar.map((a) => [a.key, a.ad]));
const kiRef = (it) => {
  const r = [];
  if (it.known_issue) r.push(it.known_issue);
  for (const k of it.ilgili_known_issues) r.push(k + ' (ilgili)');
  return r.join(', ');
};
const surum = (it) => (it.presentIn ? SURUM_LBL[it.presentIn] : 'belirtilmedi') + (it.presentIn_not ? ` (${it.presentIn_not})` : '');
function dogrulamaMetni(it) {
  const p = [`**${ST_LBL[it.final_status]}** (${TUR_LBL[it.dogrulama_turu]}).`];
  if (it.dogrulama) {
    p.push(`Karşı doğrulama hükmü: ${VER_LBL[it.dogrulama.hukum]}. Kanıt: ${md(it.dogrulama.kanit)}`);
    if (it.dogrulama.duzeltme) {
      const f = [...new Set(it.uygulanan_duzeltmeler.map((u) => FIELD_LBL[u.alan]))];
      p.push(`Düzeltme/ek: ${md(it.dogrulama.duzeltme)}${f.length ? ` (uygulanan alanlar: ${f.join(', ')})` : ''}`);
    }
  } else if (it.dogrulama_notu) p.push(md(it.dogrulama_notu));
  if (it.final_status === 'belirsiz') {
    if (it.kaynak === 'denetim') p.push(`Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: ${CONF_LBL[it.confidence] || '—'}). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli.`);
    else if (it.kaynak === 'dogrulama_kacan') p.push('Karşı doğrulayıcının kendi bulgusu (gözden kaçan madde); ayrı bir kaynakla sınanmadı. Düzeltmeden önce yeniden üretilmeli.');
    else p.push(`${it.kaynak_ref} karşı doğrulama düzeltmesinden rapor yazımında ayrı madde olarak çıkarıldı; önerilen çözüm, tekrar üretme ve kabul testi rapor yazımında yazıldı ve ayrıca sınanmadı.`);
  } else if (it.kaynak === 'denetim' && it.confidence) p.push(`Denetçi güveni: ${CONF_LBL[it.confidence]}.`);
  if (it.ek_dogrulama) p.push(`Ek doğrulama: ${md(it.ek_dogrulama)}`);
  p.push(`Bilinen sorun: ${kiRef(it)}.`);
  return p.join(' ');
}

P('# AUDIT_CURRENT — Güncel Kod Denetimi (Faz 0)', '');
P("Tarih: 14 Kasım 2026 · Dal: `claude/v0.5-saglamlastirma` · Denetlenen kod: v0.4 (`44d548c`). Bu belge kod değiştirilmeden hazırlandı. Birleştirilmiş makine verisi: `docs/v05/denetim_bulgulari.json`; açık sorunlar listesi: `KNOWN_ISSUES.md`.", '');

// §1
P('## 1. Kapsam ve taban', '', '### 1.1 Sürümler', '');
P('| Sürüm | Commit | Dal | Not |', '|---|---|---|---|');
P("| v0.3 — canlı | `762f1c7` (762f1c76674cad279931e28b5148a94933832b43, 31 Ekim 2026) | `claude/hopeful-cray-o1jw6w` | Varsayılan dal; GitHub Pages bu daldan yayında. Karşılaştırmalar bu commit'in ayrı kopyasıyla yapıldı. |");
P("| v0.4 — geliştirme | `44d548c` (44d548cf0011c51158d6aaf3bcc79304c157f3ba, 9 Kasım 2026) | `claude/denetim-v0.4` | Denetlenen kod. |");
P("| v0.5 — yeni dal | taban `44d548c`; rapor yazımında HEAD `a47f88c` | `claude/v0.5-saglamlastirma` | 44d548c'den sonraki commit'ler (e194d59, 3725aac, 7858a89, 8d8fb8a, f80f205, a47f88c) yalnız `docs/` altında değişiklik içeriyor; oyun kodu v0.4 ile aynı. Depoda `main` dalı yok. |", '');
P('### 1.2 Yöntem', '');
P(`- **11 alan:** ${alanlar.map((a) => `${a.key} — ${a.ad}`).join('; ')}.`);
P("- **Statik okuma:** her alanda bir denetçi kodu satır düzeyinde okudu; hesap gerektiren iddiaları Node'da kodun salt-okur kopyalarıyla (hata enjeksiyonu, geometri ve zaman modeli) sınadı. v0.3 karşılaştırmaları canlı commit'in kopyası üzerinde yapıldı.");
P("- **Karşı doğrulama:** her alanda bağımsız bir doğrulayıcı kritik ve yüksek öncelikli hataları, 'çalışıyor ve test edilmiş' sistem iddialarını, 'karşılanıyor' gereksinimleri, 'yanlış' belge iddialarını ve tüm kullanıcı iddialarını yeniden sınadı; gözden kaçan hataları ekledi (kimlik `<alan>-Mxx`).");
P("- **Birleştirme:** her hata maddesine bir son durum verildi (§1.4). 'Kısmen' hükümlerinin düzeltmeleri ilgili alanlara uygulandı ve maddede '[Doğrulama düzeltmesi]' ya da '[Doğrulamayla düzeltildi]' ile işaretlendi; özgün metinler JSON'da `ozgun` alanında duruyor. Aynı kusurun farklı alanlardaki kayıtları KNOWN_ISSUES.md'de tek KI altında birleştirildi.");
P("- **Ek doğrulama kaynağı:** H ve I alanlarının denetim maddeleri Faz 7 tasarım belgesinin §0.5 bölümünde (`docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md`), J alanınınkiler Faz 8 tasarım belgesinin Ek A bölümünde (`FAZ8_PERFORMANS_TASARIM.md`), K-09 Faz 9 tasarım belgesinin §0.2 bölümünde (`FAZ9_YAYIN_GUVENLIGI_TASARIM.md`, N9-2) kod okuması, salt-okur Node denemeleri ve tarayıcı ölçümleriyle yeniden sınandı. Bu sonuçlar 'faz tasarım belgesinde yeniden sınama' türüyle işlendi; 'kısmen doğru' ya da düzeltmeli bulunan maddelerin düzeltmeleri uygulandı. Faz 2–6 tasarım belgelerinde madde bazında doğrulama tablosu yok; bunlar doğrulama kaynağı olarak kullanılmadı. Tasarım belgelerinin ilk kez kaydettiği bulgular (ör. Faz 7 N-1…N-19, Faz 9 N9-x) bu raporun madde listesinde yok; Faz 7 N-11, H-M04 ile aynı kusurdur.");
P('- **Tarayıcı testleri:** ayrı bir taban koşusunda yürütüldü; sonuçlarını ana oturum §9\'a ekleyecek. Bu raporda taban koşusu sonuçları yalnız denetim maddelerinin kendi kanıtında anıldığı kadarıyla geçer.', '');
P('### 1.3 Sınırlar', '');
P("- Gerçek GPU yok: taban koşusu headless Chromium ve SwiftShader ile yapıldı; performans maddeleri gerçek GPU'da ölçülmedi.");
P('- Gerçek ağ yok: co-op testleri yerel PeerJS sunucusu ve loopback üzerinde; gerçek sinyal sunucusu, NAT ve TURN denenmedi.');
P('- Karşı doğrulama orta ve düşük öncelikli maddelerin çoğunu sınamadı. H, I ve J alanlarında bu boşluğu Faz 7 ve Faz 8 tasarım belgelerinin yeniden sınaması kapattı; diğer alanlarda ikinci kaynağı olmayan maddeler "Belirsiz" olarak işaretlendi. Ayrıntılar §11\'de.', '');
P('### 1.4 Durum etiketleri ve kimlikler', '');
P('| Son durum | Anlamı |', '|---|---|');
for (const [k, v] of Object.entries(META.final_status_tanimlari)) P(`| ${ST_LBL[k]} (\`${k}\`) | ${cell(v)} |`);
P('');
P('| Doğrulama türü | Anlamı |', '|---|---|');
for (const [k, v] of Object.entries(META.dogrulama_turu_tanimlari)) P(`| ${TUR_LBL[k]} (\`${k}\`) | ${cell(v)} |`);
P('');
P("- **Kimlikler:** `A-01`…`K-20` denetçi bulguları; `<alan>-Mxx` karşı doğrulayıcının gözden kaçan bulguları (C-M05, D-M03, J-M03 ve J-M04 doğrulama düzeltmelerinden rapor yazımında ayrı madde yapıldı); `KI-xxx` KNOWN_ISSUES.md kimlikleri. `UCn`, `SYSn`, `REQn`, `DOCn` karşı doğrulama başvurularıdır (alan içinde n. kullanıcı iddiası, n. 'test edilmiş' sistem, n. 'karşılanıyor' gereksinim, n. 'yanlış' belge iddiası). Eski 02_HATA_LISTESI kimlikleri (D-04, F-04, H07 …) ve tasarım karar numaraları (K-1 …) ayrı ad alanlarıdır.");
P("- **Öncelik:** kritik, yüksek, orta, düşük. Değerler denetçilerin görev tanımından çıkardığı ölçeğe göre verildi; karşı doğrulamanın öncelik düzeltmeleri uygulandı (§6.1).");
P("- **Sürüm:** 'v0.3 ve v0.4' = canlı sürümde de var; 'yalnız v0.4' = v0.4'te ortaya çıktı ya da v0.4 dalına özgü; 'yalnız v0.3' = canlı dalda var, v0.4 dalında giderilmiş.", '');

// §2
P('## 2. Yönetici özeti', '');
P(`Denetim ${toplam.denetim} denetçi bulgusu, karşı doğrulamada eklenen ${toplam.kacan} gözden kaçan madde ve doğrulama düzeltmelerinden çıkarılan ${toplam.ek} ek madde olmak üzere ${toplam.toplam} hata maddesi içeriyor. Son önceliklere göre ${toplam.kritik} kritik, ${toplam.yuksek} yüksek, ${toplam.orta} orta ve ${toplam.dusuk} düşük madde var. ${toplam.dogrulandi} madde doğrulandı (${toplam.dogrudan} doğrudan karşı doğrulama, ${toplam.dolayli} dolaylı, ${toplam.iki_kaynak} iki bağımsız kaynak, ${toplam.tasarim} faz tasarım belgesinde yeniden sınama), ${toplam.kismen_duzeltildi} madde düzeltilerek kabul edildi, ${toplam.belirsiz} madde tek kaynaklı olduğu için belirsiz kaldı; hiçbir hata maddesi çürütülmedi. Aynı kusurun farklı alanlardaki kayıtları birleştirildiğinde ${kiList.length} açık bilinen sorun kalıyor: ${kiPri.kritik} kritik, ${kiPri.yuksek} yüksek, ${kiPri.orta} orta, ${kiPri.dusuk} düşük (KNOWN_ISSUES.md).`, '');
{
  const kr = items.filter((it) => it.priority === 'kritik').map((it) => it.id).sort(cmpId);
  const tek = ['D-01', 'G-01'];
  for (const id of tek) if (!kr.includes(id)) fail('tek oyunculu kritik beklenen ' + id);
  const coop = kr.filter((id) => !tek.includes(id));
  const coop04 = coop.filter((id) => byId[id].presentIn !== 'v03_ve_v04');
  P(`Kritik maddelerin ${coop.length}'i (${coop.join(', ')}) co-op ağ güvenliği ve co-op dünya kalıcılığıyla ilgili; ${coop04.length ? coop04.join(', ') + ' dışında' : 'hepsi'} canlı v0.3'te de var. Tek oyunculu oyunda da geçerli kritik madde tutsak ödülünün sınırsız tekrarı (D-01/G-01). Tek oyunculu oyunu etkileyen diğer ağır maddeler: ana hikâyenin 5. aşamada bitmesi (F-03), kayıt bütünlüğü (D-04, D-M01, D-M02), top nişanının kare hızına bağlı olması (C-03) ve Kraken dokunacının kılıçla çoğu durumda kesilememesi (H-01).`, '');
}
P('### 2.1 Sayılar', '');
P('| Alan | Denetim | Kaçan (M) | Ek | Toplam | Doğrulandı (doğrudan/dolaylı/iki kaynak/tasarım) | Kısmen düzeltildi | Belirsiz | Çürütüldü | Kritik | Yüksek | Orta | Düşük |', '|---|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|');
for (const k of AREAS) { const c = sayilar[k]; P(`| ${k} — ${alanAd[k]} | ${c.denetim} | ${c.kacan} | ${c.ek} | ${c.toplam} | ${c.dogrulandi} (${c.dogrudan}/${c.dolayli}/${c.iki_kaynak}/${c.tasarim}) | ${c.kismen_duzeltildi} | ${c.belirsiz} | ${c.curutuldu} | ${c.kritik} | ${c.yuksek} | ${c.orta} | ${c.dusuk} |`); }
P(`| **Toplam** | **${toplam.denetim}** | **${toplam.kacan}** | **${toplam.ek}** | **${toplam.toplam}** | **${toplam.dogrulandi} (${toplam.dogrudan}/${toplam.dolayli}/${toplam.iki_kaynak}/${toplam.tasarim})** | **${toplam.kismen_duzeltildi}** | **${toplam.belirsiz}** | **${toplam.curutuldu}** | **${toplam.kritik}** | **${toplam.yuksek}** | **${toplam.orta}** | **${toplam.dusuk}** |`, '');
P("Öncelikler karşı doğrulama düzeltmelerinden sonraki değerlerdir. KI kümelerinde bir kümenin önceliği en ağır üyesininkidir; bu yüzden örneğin E-04 (yüksek) kritik bir KI'nin, D-02 (yüksek) kritik bir KI'nin üyesidir.", '');
P('### 2.2 Sistem kategorileri', '');
P("Karşı doğrulamanın kategori düzeltmeleri uygulandıktan sonraki sayılar. Bir sistemin bir kısmı test edilmiş, kalanı doğrulanmamışsa sistem iki satıra bölündü; bu yüzden satır sayısı denetçinin sistem sayısından fazladır.", '');
P(`| Alan | ${SYS_ORDER.map((s) => SYS_LBL[s]).join(' | ')} | Satır | Gereksinim (karşılanıyor/kısmen/yok) |`, `|---|${SYS_ORDER.map(() => '---:').join('|')}|---:|---|`);
for (const k of AREAS) { const c = sayilar[k]; P(`| ${k} | ${SYS_ORDER.map((s) => c.sistem[s]).join(' | ')} | ${c.sistem_satir} | ${c.gereksinim.karsilaniyor}/${c.gereksinim.kismen}/${c.gereksinim.yok} |`); }
P(`| **Toplam** | ${SYS_ORDER.map((s) => '**' + toplam.sistem[s] + '**').join(' | ')} | **${toplam.sistem_satir}** | **${toplam.gereksinim.karsilaniyor}/${toplam.gereksinim.kismen}/${toplam.gereksinim.yok}** |`, '');
P('### 2.3 En önemli bulgular', '');
K.ONEMLI.forEach((o, i) => {
  for (const id of o.ids) if (!byId[id]) fail('ONEMLI kimlik ' + id);
  const kis = [...new Set(o.ids.map((id) => byId[id].known_issue).filter(Boolean))];
  const pr = o.ids.map((id) => byId[id].priority).sort((x, y) => PRI_RANK[x] - PRI_RANK[y])[0];
  const ver = o.ids.map((id) => `${id} ${ST_KISA[byId[id].final_status]}`).join(', ');
  const sur = [...new Set(o.ids.map((id) => (byId[id].presentIn ? SURUM_LBL[byId[id].presentIn] : 'belirtilmedi')))].join(' / ');
  P(`${i + 1}. **${PRI_CAP[pr]}** — ${md(o.metin)} *Maddeler: ${ver}. Sürüm: ${sur}. KI: ${kis.join(', ')}.*`);
});
P('');
P('### 2.4 v0.4\'te giderilenler ve açık kalanlar', '');
P("**v0.4'te giderilmiş ya da kısmen giderilmiş (kullanıcı iddiaları ve karşı doğrulama, §3):**", '');
for (const x of K.V04_GIDERILEN) P(`- ${x}`);
P('');
const acikIki = items.filter((it) => it.presentIn === 'v03_ve_v04');
const acikIkiKritik = acikIki.filter((it) => it.priority === 'kritik').map((it) => it.id).sort(cmpId);
P(`**Hâlâ açık, canlı v0.3'te de var:** ${acikIki.length} madde 'v0.3 ve v0.4' olarak işaretli. Bunlardan kritik olanlar (${acikIkiKritik.length}): ${acikIkiKritik.join(', ')}.`, '');
const yalniz04 = items.filter((it) => it.presentIn === 'yalniz_v04').sort((x, y) => PRI_RANK[x.priority] - PRI_RANK[y.priority] || cmpId(x.id, y.id));
P(`**Yalnız v0.4'te bulunan maddeler (gerilemeler ve v0.4 dalına özgü sorunlar): ${yalniz04.length} madde.**`, '');
for (const pr of ['kritik', 'yuksek', 'orta']) {
  const xs = yalniz04.filter((it) => it.priority === pr);
  if (!xs.length) continue;
  P(`- ${PRI_CAP[pr]} (${xs.length}): ${xs.map((it) => `${it.id} — ${md(trunc(it.title, 110))}`).join('; ')}`);
}
const yd = yalniz04.filter((it) => it.priority === 'dusuk');
if (yd.length) P(`- Düşük (${yd.length}): ${yd.map((it) => it.id).join(', ')}`);
P('');
const y03 = items.filter((it) => it.presentIn === 'yalniz_v03');
P(`**Yalnız canlı v0.3'te:** ${y03.map((it) => `${it.id} — ${md(it.title)} (${PRI_LBL[it.priority]})`).join('; ')}. v0.4 dalında giderildi, canlı dalda açık.`, '');
P('### 2.5 Kritik ve yüksek öncelikli bilinen sorunlar', '');
P('| KI | Öncelik | Başlık | Maddeler (son durum) | Hedef faz |', '|---|---|---|---|---|');
for (const k of kiList.filter((x) => x.oncelik === 'kritik' || x.oncelik === 'yuksek')) {
  const m = [...k.uyeler.map((id) => `${id} (${ST_KISA[byId[id].final_status]}, ${PRI_LBL[byId[id].priority]})`), ...k.kismi.map((id) => `ilgili: ${id}`)].join('; ');
  P(`| ${k.ki} | ${PRI_LBL[k.oncelik]} | ${cell(k.baslik)} | ${cell(m)} | ${fazAdi(k.hedef_faz)} |`);
}
P('');

// §3
P('## 3. Kullanıcının kod iddiaları', '');
P("Kullanıcının denetime verdiği kod iddiaları, iki sürümdeki hükümleriyle. Hüküm iddianın o sürümde doğru olup olmadığını söyler: bir hata iddiasında 'Yanlış' hatanın o sürümde olmadığı, bir özellik iddiasında özelliğin olmadığı anlamına gelir. Tüm iddialar karşı doğrulamadan geçti; hükmü değişenlerde denetçinin özgün hükmü parantez içinde.", '');
P('| İddia | v0.3 | v0.4 | Kanıt (dosya:satır) | Doğrulama |', '|---|---|---|---|---|');
for (const al of alanlar) for (const u of al.birlestirme.kullanici_iddialari) {
  const h = (cur, den) => UC_LBL[cur] + (cur !== den ? ` (denetçi: ${UC_LBL[den]}; karşı doğrulamayla düzeltildi)` : '');
  let dv = u.dogrulama ? `${VER_LBL[u.dogrulama.hukum][0].toUpperCase() + VER_LBL[u.dogrulama.hukum].slice(1)}.` : 'Karşı doğrulama yok.';
  if (u.dogrulama && u.dogrulama.duzeltme) dv += ' ' + u.dogrulama.duzeltme;
  P(`| **${al.key}/${u.ref}** — ${cell(u.iddia)} | ${h(u.v03, u.denetci_v03)} | ${h(u.v04, u.denetci_v04)} | ${cell(u.kanit)} | ${cell(dv)} |`);
}
P('');

// §4
P('## 4. Sistem durumu', '');
P("Kategoriler: **Çalışıyor ve test edilmiş**, **Çalışıyor ancak geliştirilmeli**, **Hatalı veya kararsız**, **Eksik veya uygulanmamış**, **Kodda var ama oynanışta doğrulanmamış**. Karşı doğrulama yalnız denetçinin 'Çalışıyor ve test edilmiş' dediği sistemleri sınadı; diğer kategoriler denetçinin değerlendirmesidir. Karşı doğrulamanın kategori düzeltmeleri uygulandı; bir sistemin bir kısmı test edilmiş, kalanı doğrulanmamışsa sistem iki satıra bölündü.", '');
for (const al of alanlar) {
  P(`### 4.${al.key} Alan ${al.key} — ${al.ad}`, '');
  P('| Sistem | Kategori | Kanıt | Not |', '|---|---|---|---|');
  for (const s of al.birlestirme.sistemler) {
    let kat = SYS_LBL[s.kategori];
    if (s.kategori !== s.denetci_durumu) kat += ` (denetçi: ${SYS_LBL[s.denetci_durumu]})`;
    const not = [];
    if (s.not) not.push(s.not);
    if (s.dogrulama) {
      let t = `Karşı doğrulama (${s.ref}): ${VER_LBL[s.dogrulama.hukum]}.`;
      if (s.dogrulama.duzeltme) t += ' ' + s.dogrulama.duzeltme;
      not.push(t);
    }
    P(`| ${cell(s.ad)} | ${cell(kat)} | ${cell(s.kanit)} | ${cell(not.join(' ')) || '—'} |`);
  }
  P('');
}

// §5
P('## 5. Hatalar', '');
P("Her alanda önce denetçi maddeleri, sonra karşı doğrulamanın gözden kaçan maddeleri (`-Mxx`) listelenir. Çürütülen iddialar bu bölümde yer almaz (§6). 'Kısmen' hükümlerinin düzeltmeleri ilgili alana uygulandı ve köşeli parantezle işaretlendi. Doğrulama sonucu 'Belirsiz' olan maddeler tek kaynaklıdır ve düzeltmeden önce yeniden üretilmelidir.", '');
for (const al of alanlar) {
  const c = sayilar[al.key];
  P('---', '');
  P(`**5.${al.key} Alan ${al.key} — ${al.ad}** · ${c.denetim} denetim maddesi, ${c.kacan} kaçan madde${c.ek ? `, ${c.ek} ek madde` : ''} · varsayılan hedef faz: ${fazAdi(al.hedef_faz)}`, '');
  P(`Denetçi özeti: ${md(al.audit.summary)}`, '');
  const hs = [...al.birlestirme.hatalar].sort((x, y) => cmpId(x.id, y.id));
  for (const it of hs) {
    if (it.final_status === 'curutuldu') continue;
    P(`### ${it.id} — ${md(it.title)} (${PRI_LBL[it.priority]})`, '');
    P(`- **Dosya ve fonksiyon:** ${md(it.file)} — ${md(it.func)}`);
    P(`- **Kök neden:** ${md(it.rootCause)}`);
    P(`- **Oyuncuya etkisi:** ${md(it.impact)}`);
    P(`- **Öncelik:** ${PRI_LBL[it.priority]}${it.priority !== it.oncelik_denetim ? ` (denetçi: ${PRI_LBL[it.oncelik_denetim]}; karşı doğrulamayla düzeltildi)` : ''} · hedef faz: ${fazAdi(it.hedef_faz)}`);
    P(`- **Önerilen çözüm:** ${md(it.fix)}`);
    P(`- **Tekrar üretme:** ${md(it.repro)}`);
    P(`- **Kabul testi:** ${md(it.acceptance)}`);
    P(`- **Sürüm:** ${surum(it)}`);
    P(`- **Bilinen kimlik:** ${it.knownAs ? md(it.knownAs) : it.kaynak === 'denetim' ? '—' : '— (karşı doğrulamada eklendi)'}`);
    P(`- **Doğrulama sonucu:** ${dogrulamaMetni(it)}`, '');
  }
}

// §6
P('## 6. Çürütülen ya da belirsiz kalan iddialar', '');
P('### 6.1 Çürütülen ya da karşı doğrulamayla düzeltilen iddialar', '');
P("Hiçbir hata maddesi bütünüyle çürütülmedi. Çürütülen tek iddia bir sistem iddiasıdır; aşağıdaki diğer satırlar maddelerin çürütülen ya da düzeltilen alt iddialarıdır (düzeltmeler §5'te uygulandı).", '');
P('| Kimlik | İddia | Sonuç | Gerekçe (karşı doğrulama) |', '|---|---|---|---|');
for (const al of alanlar) for (const s of al.birlestirme.sistemler) if (s.dogrulama && s.dogrulama.hukum === 'curutuldu') P(`| ${al.key}/${s.ref} | ${cell(s.ad)} — '${SYS_LBL[s.denetci_durumu]}' | Çürütüldü | ${cell(s.dogrulama.duzeltme)} Kategori '${SYS_LBL[s.kategori]}' yapıldı. |`);
const ALT = [
  ['B-04 (4)', "64 KB'ı aşan 'st' her konuğa 15 Hz ile çoğaltılıyor (bant genişliği büyütme)", 'Mekanizma çürütüldü', "PeerJS 1.5.5 JSON kanalı 16 300 bayt ve üstünü göndermiyor; gerçek etki daha ağır: ~15 KB'lık 'st' bütün konukları düşürüyor (B-M01)."],
  ['E-04', "Büyük 'st' iletileri bant genişliğini tüketir; kabul testinde 50 KB'lık 'st'", 'Mekanizma çürütüldü', "50 KB'lık 'st' stok istemciyle üretilemez; risk 16 300 baytta oda düşmesi (E-M01). 'NaN düşman yapay zekâsına yayılır' kısmı E doğrulamasında sınanmadı."],
  ['B-09', "Hata yalıtımı B-02'yi de oturum çökmesinden korur", 'Çürütüldü', "B-02'deki kilitlenme istisna değil, seyrek dizinin dolaşılmasından gelen CPU kilidi; girdi doğrulaması gerekir. B-03'te input.endFrame yalnız anlık görüntü karelerinde atlanıyor."],
  ['E-02 (1)', 'Balık ambara konunca hiç ileti gitmiyor', 'Kısmen yanlış', "'Ambara koy' netHold yayınlıyor; iletisiz yollar yalnız fishing.js:248 ve panels.js:150-152. Balık silinmesi v0.4 gerilemesi (B-M05)."],
  ['F-02 (1)', "Oyuncu ölüp menüden 'Devam Et' derse boss doğmaz", 'Yanlış yol', 'Ölüm ekranı oyunu yeniden yüklemiyor; hata yalnız boss alanının 200 m içinde alınmış kayıt yüklenince çıkıyor.'],
  ['K-05', "Canlı sitede dalın ham Jekyll çıktısı, docs/ ve tests/ dahil yayında", 'Kısmen yanlış', "docs/ ve tests/ dahil olması dal yayınına özgü değil (iş akışı artifact'i de tüm depoyu yüklüyor, K-06); canlı commit'te tests/ yok ve iki yayının oyun içeriği bayt bayt aynı. Risk ileriye dönük."],
  ['K-01', "Kök tek dosya file:// data: işçisi dahil v0.4 düzeltmelerini içermiyor", 'Kısmen yanlış', 'Bugün oyuncuya etkisi yok; v0.3 tek dosyası işçiyi klasik işçi olarak kuruyor ve file:// altında açılıyor.'],
  ['I-01', "Koşuda ~1,2, sprintte ~3 m/sn kayma; önerilen Run≈3,7 / Sprint≈3,8 referansı", 'Sayılar ve öneri yanlış', "Temas noktası ölçümüyle koşuda 0,55–0,7, sprintte 2,1–2,3 m/sn; önerilen referanslar ayağı ters yönde kaydırır (doğrusu Run≈Sprint≈4,5). Tekrar üretme adımı yazıldığı gibi çalışmıyor."],
  ['J-01', "Karakter başına ~6 K üçgen; limanda ≈144 K üçgen; 'açık deniz 203 çağrısıyla tutarlı'", 'Abartılı / doğrulanamadı', '~4 K üçgen/karakter, limanda ≈100 K; 203 çağrı ifadesinin ölçüm betiği depoda yok. Kabul ölçütü gölge kutusundaki NPC\'lere uygulanamaz.'],
  ['J-02', 'Bitki InstancedMesh sınır küresi yarıçapı ~1 000 m', 'Sayı düzeltildi', '~610–780 m; sonuç değişmiyor.'],
  ['J-03', "Gerçek GPU'da saniyeler süren donma; 'ilk kare çizilmeden ölç' adımı", 'Etki ölçülmedi', 'Takılma oturum başına bir kez ve disk önbelleğiyle hafifliyor; tekrar üretme adımı güvenilir değil.'],
  ['H-01', 'Dokunacın vuruş hedefi ucun 5–14 m gerisinde', 'Sayı düzeltildi', "R=38 m'de 8,8–16,9 m (medyan 13), R=30 m'de 6,1–14,2 m; '5–14 m' yalnız evre 3'e uyuyor."],
  ['D-04', "İçe aktarma bütün yuvaları eziyor; bozuk dosya yuvayı okunamaz yapıyor", 'Abartılı', "Yalnız dosyadaki yuvalar eziliyor; '[object Object]' yazılan yuva .bak'a düşüyor. Daha ağır ek etki D-M02'de."],
  ['D-05', 'Yeni sandık kademesi ya da gemi tipi eski sürümde yüklemeyi çökertiyor', 'Bugün varsayımsal', 'Kademeler ve gemi tipleri iki sürümde aynı; risk yalnız sürüm geri dönüşü ve file:// paylaşımında.'],
  ['D-02', 'morvanSpawn/kizilSpawn sızıntısı kalıcı', 'Yanlış', '200 m uzaklaşınca sıfırlanıyor; kalıcı kilidi gunluk bayrağı yaratıyor.'],
  ['C/UC2, C-01', "Değişken FPS'te '15/20/30/60 FPS'te birebir aynı' sonuç", 'Kısmen yanlış', 'Yalnız tam dt değerleri için geçerli; gerçek rAF zaman damgalarıyla alt adım sayısı 60/30/15 Hz\'de salınıyor (doğrulayıcı: orta güven).'],
  ['C-02', "Alt adım salınımı yalnız 60 Hz'de", 'Kapsam dar', "30 ve 15 FPS'te de var; etkiler top nişanı, yapay zekâ ve CPU'ya uzanıyor."],
  ['G-02', '58 sabit ada sandığı', 'Sayı düzeltildi', '57 sandık + sunak; sunak G-03 nedeniyle erişilemiyor.'],
  ['B-11', "f=0 ile anında patlama", 'Küçük düzeltme', 'f=0 1,2 sn fitile dönüyor; anında patlama için negatif ya da çok küçük f gerekiyor.'],
  ['B-02 (a)', "shipCmd'de ileti oranı denetlenmiyor", 'Küçük düzeltme', 'Genel 120/sn sınırı uygulanıyor; eksik olan komut başına sınır. cannonFix yolunda kayıt bozulmuyor, hiç yazılamıyor.'],
  ['E-03 (d)', 'Keseler ev sahibi kaydına girer', 'Yanlış', 'Keseler kaydedilmiyor; kayda giren keseyi toplayanın altını.'],
  ['K-17', 'README v0.4 dalında güncellenmemiş', 'Kısmen yanlış', "Kontroller ve yeni bölümler güncellenmiş; bayat olan sürüm satırı ve 'Henüz olmayanlar' paragrafı."],
  ['H-02', 'Dev bossların hasarı vuruş animasyonundan 0,4–0,7 sn sonra', 'Sayı düzeltildi (Faz 7 §0.5)', 'Elin en ileri anına göre fark 0,33–0,57 sn (slam +0,43, süpürme +0,33); ilk ölçüm açısal hız tepesini kullanmıştı.'],
  ['H-09', 'Bıçaklamalarda (AtkStab, Stab2H, DualStab) hasar ~0,3 sn geç', 'Yapıntı (Faz 7 §0.5)', "Dürtmelerde en ileri erişim hitAt ile örtüşüyor; gerçek gecikmeler kesme/doğrama hamlelerinde 0,13–0,21 sn, DASH'te 0,33 sn."],
  ['H-20', "Kilidin kaynağı her hafif vuruştaki 0,45 sn'lik 'hit' durumu", 'Kök neden düzeltildi (Faz 7 §0.5)', "Asıl kilit bitirici vuruşun 1,0 sn'lik sersemliği; gerçek zincirde 10–11 saldırının 0'ı vuruş anına ulaşıyor."],
  ['I-10', 'Karşı saldırıda (Counter) hasar 0,14 sn erken', 'Yapıntı (Faz 7 §0.5)', "Block_Attack'ta sağ bilek neredeyse kıpırdamıyor; kılıç ucunun tepesi bugünkü değerle tolerans içinde."],
  ['I-01 (öneri)', 'Önerilen klip referansı Run≈Sprint≈4,5 m/sn (I karşı doğrulaması)', 'Çelişkili', 'Faz 7 tasarımı destek ayağı yöntemiyle 1,5 cm eşikte Running_A 3,75, Running_C 3,79 m/sn ölçtü; K7-9 ölçüm yöntemini karara bağladı, değerler Faz 7\'de kesinleşecek.'],
];
for (const [id, iddia, sonuc, ger] of ALT) P(`| ${id} | ${cell(iddia)} | ${sonuc} | ${cell(ger)} |`);
P('');
P('**Öncelik düzeltmeleri:**', '');
P('| Kimlik | Başlık | Denetçi | Son |', '|---|---|---|---|');
for (const id of Object.keys(K.ONCELIK).sort(cmpId)) P(`| ${id} | ${cell(trunc(byId[id].title, 140))} | ${PRI_LBL[byId[id].oncelik_denetim]} | ${PRI_LBL[byId[id].priority]} |`);
P('');
P('**Hükmü değişen kullanıcı ve belge iddiaları:**', '');
P('| Kimlik | İddia | Denetçi | Son | Gerekçe |', '|---|---|---|---|---|');
for (const al of alanlar) {
  for (const u of al.birlestirme.kullanici_iddialari) {
    const ch = [];
    if (u.v03 !== u.denetci_v03) ch.push(['v0.3', u.denetci_v03, u.v03]);
    if (u.v04 !== u.denetci_v04) ch.push(['v0.4', u.denetci_v04, u.v04]);
    for (const [s, x, y] of ch) P(`| ${al.key}/${u.ref} (${s}) | ${cell(trunc(u.iddia, 140))} | ${UC_LBL[x]} | ${UC_LBL[y]} | ${cell(trunc(u.dogrulama.duzeltme, 260))} |`);
  }
  for (const b of al.birlestirme.belge_iddialari) if (b.hukum !== b.denetci_hukmu) P(`| ${al.key}/${b.ref} | ${cell(trunc(b.belge + ' — ' + b.iddia, 160))} | ${DOC_LBL[b.denetci_hukmu]} | ${DOC_LBL[b.hukum]} | ${cell(trunc(b.dogrulama.duzeltme, 260))} |`);
}
P('');
P("### 6.2 'Test edilmiş' ya da 'karşılanıyor' iddiası düşürülenler", '');
P('| Kimlik | Sistem / gereksinim | Denetçi | Son |', '|---|---|---|---|');
for (const al of alanlar) {
  const seen = new Set();
  for (const s of al.birlestirme.sistemler) {
    if (!s.ref || seen.has(s.ref)) continue;
    const rows = al.birlestirme.sistemler.filter((x) => x.ref === s.ref);
    const changed = rows.length > 1 || rows[0].kategori !== rows[0].denetci_durumu;
    if (!changed) continue;
    seen.add(s.ref);
    const son = rows.length > 1 ? rows.map((x) => `${x.parca}: ${SYS_LBL[x.kategori]}`).join('; ') : SYS_LBL[rows[0].kategori];
    P(`| ${al.key}/${s.ref} | ${cell(al.audit.systems.find((x) => s.ad.startsWith(x.name)).name)} | ${SYS_LBL[s.denetci_durumu]} | ${cell(son)} |`);
  }
  for (const r of al.birlestirme.gereksinimler) if (r.durum !== r.denetci_durumu) P(`| ${al.key}/${r.ref} | ${cell(trunc(r.gereksinim, 150))} | ${REQ_LBL[r.denetci_durumu]} | ${REQ_LBL[r.durum]} |`);
}
P('');
P('### 6.3 Belirsiz kalanlar', '');
P(`${toplam.belirsiz} madde belirsiz kaldı: ne karşı doğrulama ne de başka bir kaynak bu maddeleri sınadı (alan başına: ${AREAS.split('').map((k) => `${k} ${sayilar[k].belirsiz}`).join(', ')}). Bunlar tek kaynaklıdır; §5'te her birinin Doğrulama sonucu satırında denetçi güveni yazılı. Aşağıda yalnız belgelerde 'doğrulanamadı' kalan iddialar, denetçi güveni 'orta' olan tek kaynaklı maddeler ve not taşıyan belirsiz maddeler (alt iddialarından biri başka bir kaynakla örtüşen ya da kök nedeni bilinmeyen) var.`, '');
P('| Kimlik | İddia ya da madde | Durum | Not |', '|---|---|---|---|');
for (const al of alanlar) for (const b of al.birlestirme.belge_iddialari) if (b.hukum === 'dogrulanamadi') P(`| ${al.key} belge | ${cell(trunc(b.belge + ' — ' + b.iddia, 170))} | Doğrulanamadı (denetçi) | ${cell(trunc(b.kanit, 220))} |`);
for (const it of [...items].sort((x, y) => cmpId(x.id, y.id))) if (it.final_status === 'belirsiz' && it.confidence === 'orta') P(`| ${it.id} | ${cell(trunc(it.title, 150))} | Belirsiz; denetçi güveni orta; öncelik ${PRI_LBL[it.priority]} | ${cell(it.dogrulama_notu ? trunc(it.dogrulama_notu, 200) : 'Tek kaynak; yeniden üretilmeli.')} |`);
for (const id of Object.keys(K.BELIRSIZ_NOT).sort(cmpId)) { const it = byId[id]; if (it.confidence === 'orta' || it.final_status !== 'belirsiz') continue; P(`| ${id} | ${cell(trunc(it.title, 150))} | Belirsiz; öncelik ${PRI_LBL[it.priority]} | ${cell(trunc(it.dogrulama_notu, 240))} |`); }
P('');

// §7
P('## 7. Belgeler ve gerçek kod', '');
P("Depodaki belgelerin kod hakkındaki iddiaları ve denetçinin hükmü. Karşı doğrulama yalnız 'Yanlış' hükümlerini sınadı; değişen hükümlerde denetçinin özgün hükmü parantez içinde.", '');
for (const al of alanlar) {
  if (!al.birlestirme.belge_iddialari.length) continue;
  P(`### 7.${al.key} Alan ${al.key} — ${al.ad}`, '');
  P('| Belge | İddia | Hüküm | Kanıt |', '|---|---|---|---|');
  for (const b of al.birlestirme.belge_iddialari) {
    let h = DOC_LBL[b.hukum];
    if (b.hukum !== b.denetci_hukmu) h += ` (denetçi: ${DOC_LBL[b.denetci_hukmu]}; karşı doğrulamayla düzeltildi)`;
    else if (b.dogrulama) h += ' (karşı doğrulandı)';
    let k = b.kanit;
    if (b.dogrulama && b.dogrulama.duzeltme) k += ` Karşı doğrulama: ${b.dogrulama.duzeltme}`;
    P(`| ${cell(b.belge)} | ${cell(b.iddia)} | ${h} | ${cell(k)} |`);
  }
  P('');
}

// §8
P('## 8. Gereksinim boşlukları ve faz planı', '');
P("Kullanıcının gereksinimleri, fazlara göre. Alan → faz: A → Faz 1, B → Faz 2, C → Faz 3, D → Faz 4, E → Faz 5, F ve G → Faz 6, H ve I → Faz 7, J → Faz 8, K'nin 'Aşama 12' yayın satırları → Faz 9. K'nin T1–T62 test satırları §10'da. Karşı doğrulama yalnız 'Karşılanıyor' satırlarını sınadı; düşürülenlerde denetçinin özgün durumu parantez içinde. Her fazın altında o faza birincil olarak atanan bilinen sorunlar listelenir.", '');
const FAZ_ALAN = { F1: ['A'], F2: ['B'], F3: ['C'], F4: ['D'], F5: ['E'], F6: ['F', 'G'], F7: ['H', 'I'], F8: ['J'], F9: ['K'] };
for (const f of Object.keys(FAZ_ALAN)) {
  P(`### ${K.FAZ_AD[f]}`, '');
  const kis = kiList.filter((k) => primFaz(k.hedef_faz) === f);
  const kp = { kritik: [], yuksek: [], orta: [], dusuk: [] };
  kis.forEach((k) => kp[k.oncelik].push(k.ki));
  P(`Bu faza birincil olarak atanan bilinen sorunlar: ${kis.length} (kritik ${kp.kritik.length}, yüksek ${kp.yuksek.length}, orta ${kp.orta.length}, düşük ${kp.dusuk.length}).${kp.kritik.length ? ` Kritik: ${kp.kritik.join(', ')}.` : ''}${kp.yuksek.length ? ` Yüksek: ${kp.yuksek.join(', ')}.` : ''} Senaryo ad aralığı: ${K.TEST_ADLARI[f]}.`, '');
  P('| Gereksinim | Durum | Kanıt | Plan |', '|---|---|---|---|');
  for (const ak of FAZ_ALAN[f]) {
    const al = alanlar.find((x) => x.key === ak);
    for (const r of al.birlestirme.gereksinimler) {
      if (ak === 'K' && !/^Aşama 12/.test(r.gereksinim)) continue;
      let dur = REQ_LBL[r.durum];
      if (r.durum !== r.denetci_durumu) dur += ` (denetçi: ${REQ_LBL[r.denetci_durumu]}; karşı doğrulama: ${r.dogrulama.duzeltme})`;
      else if (r.dogrulama) dur += ` (karşı doğrulandı${r.dogrulama.duzeltme ? '; not: ' + r.dogrulama.duzeltme : ''})`;
      P(`| ${ak} · ${cell(r.gereksinim)} | ${cell(dur)} | ${cell(r.kanit)} | ${cell(r.plan)} |`);
    }
  }
  P('');
}

// §9
P('## 9. Taban test koşusu', '', '(ana oturum tarafından doldurulacak)', '');

// §10
P('## 10. Test planı', '');
const kAlT = alanlar.find((x) => x.key === 'K').birlestirme.gereksinimler.filter((r) => /^T\d+\s/.test(r.gereksinim));
P(`Kullanıcının istediği 62 test (K alanının T1–T62 satırları). Durum: **var** = mevcut senaryo istenen davranışı sınıyor; **kısmen** = bir kısmı sınanıyor ya da kanıt zayıf; **yok** = senaryo yok. Karşı doğrulama 'var' satırlarını yeniden sınadı ve ${kAlT.filter((r) => r.durum !== r.denetci_durumu).length} tanesini 'kısmen'e düşürdü. Yazılacak senaryolar KARARLAR.md'deki faz ad aralıklarını kullanır.`, '');
P('| No | Test | Mevcut senaryo/kontrol | Durum | Yazılacak senaryo ve faz |', '|---:|---|---|---|---|');
const kAl = alanlar.find((x) => x.key === 'K');
const tRows = kAl.birlestirme.gereksinimler.filter((r) => /^T\d+\s/.test(r.gereksinim));
if (tRows.length !== 62) fail('T satırı sayısı ' + tRows.length);
tRows.forEach((r, i) => {
  const n = +r.gereksinim.match(/^T(\d+)/)[1];
  if (n !== i + 1) fail('T sırası ' + n);
  const ad = r.gereksinim.replace(/^T\d+\s*/, '');
  const DUR = { karsilaniyor: 'var', kismen: 'kısmen', yok: 'yok' };
  let dur = DUR[r.durum];
  if (r.durum !== r.denetci_durumu) dur += ` (denetçi: ${DUR[r.denetci_durumu]}; karşı doğrulama: ${r.dogrulama.duzeltme})`;
  else if (r.dogrulama) dur += ' (karşı doğrulandı)';
  const fz = K.tFaz(n);
  const pf = primFaz(fz);
  const yaz = `${r.durum === 'karsilaniyor' ? 'Yeni senaryo gerekmez; mevcut senaryo her faz regresyonunda koşulur. ' : ''}${r.plan} — **${fazAdi(fz)}**; ad aralığı: ${K.TEST_KISA[pf]}.`;
  P(`| ${n} | ${cell(ad)} | ${cell(r.kanit)} | ${cell(dur)} | ${cell(yaz)} |`);
});
P('');
const tSay = { var: 0, kismen: 0, yok: 0 };
tRows.forEach((r) => { tSay[{ karsilaniyor: 'var', kismen: 'kismen', yok: 'yok' }[r.durum]]++; });
P(`Özet: var ${tSay.var}, kısmen ${tSay.kismen}, yok ${tSay.yok}.`, '');

// §11
P('## 11. Riskler ve sınırlar', '', K.RISKLER, '');

// ---------- KNOWN_ISSUES.md ----------
const Q = [];
Q.push('# KNOWN_ISSUES — Açık Sorunlar', '');
Q.push("Bu liste `AUDIT_CURRENT.md`'den (Faz 0 denetimi, v0.4 `44d548c`) türetilmiştir ve fazlar ilerledikçe güncellenir. Düzeltilen maddeler bu listeden çıkarılıp `FIX_REPORT.md`'ye taşınır. Ayrıntılar (kök neden, tekrar üretme, kabul testi, doğrulama) `AUDIT_CURRENT.md` §5'te denetim kimliğiyle; makine verisi `docs/v05/denetim_bulgulari.json` içinde.", '');
Q.push("- **Kimlik:** `KI-xxx` bu listeye özgüdür; eski 02_HATA_LISTESI kimlikleri ve tasarım karar numaralarıyla çakışmaz. Kimlikler kalıcıdır, kapanan sorunun kimliği yeniden kullanılmaz.");
Q.push('- **Sıralama:** kritik → yüksek → orta → düşük; aynı öncelikte alan (A–K) ve denetim kimliği sırası.');
Q.push("- **Birleştirme:** bir KI aynı kusurun farklı alanlardaki kayıtlarını toplayabilir; önceliği en ağır üyesininkidir. 'ilgili' ile verilen maddeler kısmen örtüşen kayıtlardır ve kendi KI'lerinde de izlenir (E-03'ün içeriği yalnız ilgili madde olarak birden çok KI'ye dağıtıldı).");
Q.push("- **Kaynak:** denetim kimliği, parantez içinde Faz 0 son durumu (doğrulandı / kısmen düzeltildi / belirsiz) ve varsa eski bilinen kimlik. 'Belirsiz' tek kaynaklıdır; düzeltmeden önce yeniden üretilmeli.");
Q.push(`- **Hedef faz:** ${Object.entries(K.FAZ_AD).map(([k, v]) => `${k.replace('F', 'Faz ')} = ${v.replace(/^Faz \d — /, '')}`).join('; ')}. '(+Fn)' ikincil fazdır.`);
Q.push("- **Kapsam dışı kalan kayıtlar:** Faz tasarım belgelerinin ilk kez kaydettiği bulgular (ör. Faz 7 §0.5'teki N-1…N-19, Faz 9 §0.2'deki N9-x) bu listeye alınmadı; ilgili faz başlarken eklenmeli. Faz 7 N-11, burada H-M04 olarak var. Hedef fazlar KARARLAR.md'ye göre (K9-16: Faz 9'un Y1, Y3 ve Y9a adımları Faz 1'in başına alındı).");
Q.push("- **Alan:** A açılış ve arazi işçisi, B ağ güvenliği, C fizik, D kayıt, E co-op senkronu, F hikâye, G dünya ve keşif, H AI ve savaş, I karakter ve kamera, J performans, K yayın ve test altyapısı.", '');
const fazSay = {};
kiList.forEach((k) => { const f = primFaz(k.hedef_faz); fazSay[f] = (fazSay[f] || 0) + 1; });
Q.push(`**Özet:** ${kiList.length} açık sorun — kritik ${kiPri.kritik}, yüksek ${kiPri.yuksek}, orta ${kiPri.orta}, düşük ${kiPri.dusuk}. Birincil faza göre: ${Object.keys(K.FAZ_AD).map((f) => `${f.replace('F', 'Faz ')} ${fazSay[f] || 0}`).join(', ')}.`, '');
Q.push('| Kimlik | Başlık | Öncelik | Alan | Dosya | Hedef faz | Durum | Kaynak |', '|---|---|---|---|---|---|---|---|');
for (const k of kiList) {
  const src = [
    ...k.uyeler.map((id) => `${id} (${ST_KISA[byId[id].final_status]})`),
    ...k.kismi.map((id) => `ilgili: ${id} (${ST_KISA[byId[id].final_status]})`),
  ].join('; ');
  const eski = k.uyeler.map((id) => byId[id].knownAs).filter(Boolean).map((s) => trunc(s, 110));
  Q.push(`| ${k.ki} | ${cell(k.baslik)} | ${PRI_LBL[k.oncelik]} | ${k.alanlar.join(', ')} | ${cell(trunc(k.dosya, 170))} | ${fazAdi(k.hedef_faz)} | ${k.durum} | ${cell(src + (eski.length ? ' / eski: ' + eski.join('; ') : ''))} |`);
}
Q.push('');

// ---------- yaz ----------
fs.mkdirSync(path.dirname(OUT.json), { recursive: true });
fs.writeFileSync(OUT.json, JSON.stringify(JSON_OUT, null, 1) + '\n');
fs.writeFileSync(OUT.audit, L.join('\n'));
fs.writeFileSync(OUT.ki, Q.join('\n'));

// ---------- özet ----------
const ozet = {
  yazilan: OUT,
  boyut: Object.fromEntries(Object.entries(OUT).map(([k, f]) => [k, fs.statSync(f).size])),
  alan: Object.fromEntries(AREAS.split('').map((k) => [k, { denetim: sayilar[k].denetim, dogrulanan: sayilar[k].denetim_dogrulanan, kismen: sayilar[k].denetim_kismen, belirsiz: sayilar[k].denetim_belirsiz, curutulen: sayilar[k].denetim_curutulen, kacan: sayilar[k].kacan, ek: sayilar[k].ek, sistem_curutulen: sayilar[k].sistem_curutulen }])),
  kritik: items.filter((x) => x.priority === 'kritik').map((x) => x.id).sort(cmpId),
  yuksek: items.filter((x) => x.priority === 'yuksek').map((x) => x.id).sort(cmpId),
  ki: { toplam: kiList.length, ...kiPri, kritik_ki: kiList.filter((k) => k.oncelik === 'kritik').map((k) => k.ki + '=' + k.uyeler.join('+')), yuksek_ki: kiList.filter((k) => k.oncelik === 'yuksek').map((k) => k.ki + '=' + k.uyeler.join('+')) },
  toplam,
};
fs.writeFileSync(path.join(__dirname, 'ozet.json'), JSON.stringify(ozet, null, 1));
console.log(JSON.stringify(ozet, null, 1));
