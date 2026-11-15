// Node testi (Faz 1 Adım B; 62 test listesi 4 "Arazi mesh oluşturulması", 5 "Harita derinliği"; FAZ1-2; KI-165/A-17,
// doğrulama turu SYS2/SYS6/REQ2): arazi üretim çekirdeğinin (js/world/terrainGen.js) veri sözleşmesi, işçi yolu (tek seferde
// runAll) ile dilimli yerel yolun bayt düzeyinde eşitliği ve fizik yükseklik sorgusunun (terrain.heightAt) çizilen ağın
// üçgenlemesiyle (terrainGen.js tileGen: (a,d,b)/(b,d,e), köşegen b–d) tutarlılığı.
//
//   node tests/node/arazi_sozlesme.mjs [--kok <ağaç>] [--rapor <özet.json>]
//
// --kok: modüllerin içe aktarılacağı ağaç (varsayılan: bu dosyanın bulunduğu ağaç, yani /home/user/SON-HAZ-NE-w2).
//        "Önce" ölçümü v0.4'e karşı: --kok /home/user/SON-HAZ-NE.
// Tarayıcı açmaz (kilit gerekmez). 'three' çıplak adı kök ağacın vendor/three dosyasına çözülür (module.registerHooks).
// Çıktı: her denetim için 'PASS <kimlik> …' ya da 'FAIL <kimlik> …' satırı, sonda 'SONUC: GECTI|KALDI …'. KALDI → çıkış 1.
//
// Denetimler (kimlik → kapsam):
//   SZ01–SZ09  tileGen sözleşmesi (alanlar, tipler, uzunluklar, ızgara konumları, normaller, renkler, indeksler, etek, min/max,
//              hires yükseklik ızgarası, aktarım listesi) — üç örnek karo: yüksek çözünürlüklü kara, orta LOD kara, derin deniz
//   SZ10–SZ11  depthGen sözleşmesi (yarım duyarlıklı kodlama computeHeight ile birebir, kod çözümü yaklaşık)
//   SZ12–SZ13  gridGen sözleşmesi (yükseklik + biyom kimlikleri birebir)
//   SZ14       generate bilinmeyen iş türünde açık hata verir
//   SZ15       işçi yolu (runAll) ↔ dilimli yol (iki üreteç dönüşümlü adımlanır) bayt düzeyinde eşit
//   SZ16       terrain.js'in GERÇEK yerel yolu (işçi yok → _localSlice şeritleri) çıktıları ↔ runAll bayt düzeyinde eşit
//   SZ17       terrain.js yerel yolu: üretilen karo ağları sahne grubunda, sonuç alanları ağ özniteliklerine aynen geçmiş
//   SZ18       heightAt ↔ çizilen ağ üçgeni (hires karolarda rastgele, köşe ve kenar noktaları) en büyük fark < 1 mm
import { registerHooks } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const sec = (ad, varsayilan) => { const i = argv.indexOf('--' + ad); return i >= 0 ? argv[i + 1] : varsayilan; };
const KOK = path.resolve(sec('kok', path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')));
const RAPOR = sec('rapor', null);
if (!fs.existsSync(path.join(KOK, 'js', 'world', 'terrainGen.js'))) { console.error(`--kok geçersiz: ${KOK}/js/world/terrainGen.js yok`); process.exit(2); }

// 'three' ve 'three/addons/…' çıplak adları kök ağacın vendor dosyalarına (tarayıcıdaki import map ile aynı eşleme)
const THREE_URL = pathToFileURL(path.join(KOK, 'vendor', 'three', 'three.module.js')).href;
if (typeof registerHooks !== 'function') { console.error('Bu Node sürümünde module.registerHooks yok (≥ 22.15 gerekli)'); process.exit(2); }
registerHooks({
  resolve(spec, ctx, next) {
    if (spec === 'three') return { url: THREE_URL, shortCircuit: true };
    if (spec.startsWith('three/addons/')) return { url: pathToFileURL(path.join(KOK, 'vendor', 'three', 'addons', spec.slice(13))).href, shortCircuit: true };
    return next(spec, ctx);
  },
});
const modUrl = (p) => pathToFileURL(path.join(KOK, 'js', p)).href;

// ---- çıktı
const sonuclar = [];
const kisa = (v, n = 220) => { let s; try { s = typeof v === 'string' ? v : JSON.stringify(v); } catch (e) { s = String(v); } return s && s.length > n ? s.slice(0, n) + '…' : s; };
function denetim(kimlik, aciklama, ok, deger) {
  sonuclar.push({ kimlik, aciklama, ok: !!ok, deger });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${kimlik} ${aciklama} → ${kisa(deger)}`);
}
const bilgi = (s) => console.log('BILGI ' + s);
// yakalanmamış hata: kalan denetimler koşmaz; KALDI ile biter (sessizce geçmez)
process.on('uncaughtException', (e) => { console.log('FAIL SZ-X test istisnası → ' + (e && e.stack || e)); bitir(1); });
process.on('unhandledRejection', (e) => { console.log('FAIL SZ-X yakalanmamış söz reddi → ' + (e && e.stack || e)); bitir(1); });

const Gen = await import(modUrl('world/terrainGen.js'));
const Geo = await import(modUrl('world/geo.js'));
const { SEA_FLOOR } = await import(modUrl('world/worldData.js'));
const { generate, runAll, BIOME_ID } = Gen;
const { computeHeight, toHalf, biomeAt } = Geo;
bilgi(`kök ${KOK}`);

const TILE = 160, HALF = 10000, SKIRT = 4;
// bayt düzeyinde karşılaştırma (tipli diziler: tür + uzunluk + baytlar; diğerleri: JSON)
const baytEsit = (a, b) => {
  if (ArrayBuffer.isView(a) || ArrayBuffer.isView(b)) {
    if (!ArrayBuffer.isView(a) || !ArrayBuffer.isView(b)) return false;
    if (a.constructor !== b.constructor || a.length !== b.length) return false;
    return Buffer.compare(Buffer.from(a.buffer, a.byteOffset, a.byteLength), Buffer.from(b.buffer, b.byteOffset, b.byteLength)) === 0;
  }
  return JSON.stringify(a) === JSON.stringify(b);
};
const ciktiFarki = (A, B) => {
  const fark = [];
  const anah = new Set([...Object.keys(A || {}), ...Object.keys(B || {})]);
  for (const k of anah) if (!baytEsit(A?.[k], B?.[k])) fark.push(k);
  return fark;
};
const decodeHalf = (h) => {
  const s = (h & 0x8000) ? -1 : 1, e = (h >> 10) & 0x1f, m = h & 0x3ff;
  if (e === 0) return s * m * 2 ** -24;
  if (e === 31) return m ? NaN : s * Infinity;
  return s * (1 + m / 1024) * 2 ** (e - 15);
};

// ---- örnek işler
const karo = (x, z, seg, id) => { const i = Math.floor((x + HALF) / TILE), j = Math.floor((z + HALF) / TILE); return { t: 'tile', id, key: i * 1024 + j, x0: -HALF + i * TILE, z0: -HALF + j * TILE, size: TILE, seg, hires: seg === 80 }; };
const ORNEK_KARO = [
  { ad: 'Kırlangıç Limanı (kara, seg 80, hires)', msg: karo(10, 222, 80, 101) },
  { ad: 'Tuz Pazarı (kara, seg 32)', msg: karo(1900, 950, 32, 102) },
  { ad: 'açık deniz z=-6200 (derin, seg 8)', msg: karo(0, -6200, 8, 103) },
];

// SZ01–SZ09: tileGen sözleşmesi
for (const [ornekNo, { ad, msg }] of ORNEK_KARO.entries()) {
  const ek = 'abc'[ornekNo];
  const { out: o, transfer } = runAll(generate({ ...msg }));
  const seg = msg.seg, n = seg + 1, step = TILE / seg, verts = n * n + 4 * seg, tri = seg * seg * 6 + 4 * seg * 6;
  const sorun = [];
  // SZ01 alanlar ve tipler
  const beklenenAlan = ['t', 'id', 'key', 'seg', 'pos', 'nor', 'col', 'idx', 'heights', 'maxH', 'minH'];
  const eksik = beklenenAlan.filter((k) => !(k in o));
  if (eksik.length) sorun.push('eksik alan ' + eksik.join(','));
  if (o.t !== 'tile' || o.id !== msg.id || o.key !== msg.key || o.seg !== seg) sorun.push(`kimlik alanları t/id/key/seg = ${o.t}/${o.id}/${o.key}/${o.seg}`);
  for (const k of ['pos', 'nor', 'col']) if (!(o[k] instanceof Float32Array) || o[k].length !== verts * 3) sorun.push(`${k} Float32Array(${verts * 3}) değil (${o[k]?.constructor?.name} ${o[k]?.length})`);
  const IdxT = verts > 65535 ? Uint32Array : Uint16Array;
  if (!(o.idx instanceof IdxT) || o.idx.length !== tri) sorun.push(`idx ${IdxT.name}(${tri}) değil (${o.idx?.constructor?.name} ${o.idx?.length})`);
  denetim('SZ01' + ek, `tileGen alanlar/tipler/uzunluklar — ${ad}`, sorun.length === 0, sorun.length ? sorun : { verts, tri, idx: o.idx.constructor.name });

  // SZ02 ızgara konumları ve yükseklikler (computeHeight ile birebir, Float32 yuvarlaması)
  let konumHata = 0, yukseklikHata = 0, enBuyukFark = 0;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const k = j * n + i;
    const x = msg.x0 + i * step, z = msg.z0 + j * step;
    if (o.pos[k * 3] !== Math.fround(x) || o.pos[k * 3 + 2] !== Math.fround(z)) konumHata++;
    const h = Math.fround(computeHeight(x, z));
    const f = Math.abs(o.pos[k * 3 + 1] - h);
    if (f > enBuyukFark) enBuyukFark = f;
    if (f !== 0) yukseklikHata++;
  }
  denetim('SZ02' + ek, `ana ızgara konumları adım ${step} m ve yükseklikler computeHeight ile birebir — ${ad}`, konumHata === 0 && yukseklikHata === 0, { konumHata, yukseklikHata, enBuyukFark });

  // SZ03 normaller birim uzunlukta, sonlu, ana ızgarada yukarı bakıyor
  let normalHata = 0, asagi = 0;
  for (let k = 0; k < verts; k++) {
    const x = o.nor[k * 3], y = o.nor[k * 3 + 1], z = o.nor[k * 3 + 2];
    const L = Math.hypot(x, y, z);
    if (!Number.isFinite(L) || Math.abs(L - 1) > 1e-5) normalHata++;
    if (k < n * n && !(y > 0)) asagi++;
  }
  denetim('SZ03' + ek, `normaller birim uzunlukta ve ana ızgarada ny > 0 — ${ad}`, normalHata === 0 && asagi === 0, { normalHata, asagi });

  // SZ04 renkler sonlu ve [0, 1] (doğrusal renk uzayı)
  let renkHata = 0;
  for (let k = 0; k < verts * 3; k++) { const c = o.col[k]; if (!Number.isFinite(c) || c < 0 || c > 1) renkHata++; }
  denetim('SZ04' + ek, `renkler sonlu ve [0,1] aralığında — ${ad}`, renkHata === 0, { renkHata });

  // SZ05 indeksler: hepsi < köşe sayısı; ana ızgarada hücre başına (a,d,b),(b,d,e) — köşegen b–d (heightAt bu üçgenlemeyi varsayar)
  let indeksTasma = 0, desenHata = 0, q = 0;
  for (let k = 0; k < o.idx.length; k++) if (o.idx[k] >= verts) indeksTasma++;
  for (let j = 0; j < seg; j++) for (let i = 0; i < seg; i++) {
    const a = j * n + i, b = a + 1, d = a + n, e = d + 1;
    const beklenen = [a, d, b, b, d, e];
    for (let r = 0; r < 6; r++) if (o.idx[q + r] !== beklenen[r]) { desenHata++; break; }
    q += 6;
  }
  denetim('SZ05' + ek, `indeksler köşe sayısı içinde; ana ızgara üçgenlemesi (a,d,b)/(b,d,e) — ${ad}`, indeksTasma === 0 && desenHata === 0, { indeksTasma, desenHata });

  // SZ06 etek: 4·seg köşe, kenar köşesinin SKIRT m altında kopyası (aynı x/z, normal, renk × 0,8)
  let etekHata = 0;
  const kenar = [];
  for (let i = 0; i < seg; i++) kenar.push(i);
  for (let j = 0; j < seg; j++) kenar.push(j * n + seg);
  for (let i = seg; i > 0; i--) kenar.push(seg * n + i);
  for (let j = seg; j > 0; j--) kenar.push(j * n);
  const base = n * n;
  for (let e = 0; e < 4 * seg; e++) {
    const s = kenar[e], v = base + e;
    if (o.pos[v * 3] !== o.pos[s * 3] || o.pos[v * 3 + 2] !== o.pos[s * 3 + 2] || o.pos[v * 3 + 1] !== Math.fround(o.pos[s * 3 + 1] - SKIRT)) etekHata++;
    if (o.col[v * 3] !== Math.fround(o.col[s * 3] * 0.8)) etekHata++;
  }
  denetim('SZ06' + ek, `etek köşeleri kenarın ${SKIRT} m altında, renk × 0,8 — ${ad}`, etekHata === 0, { etekHata, etek: 4 * seg });

  // SZ07 min/max: sonlu, minH ≤ maxH, ana ızgaradaki yüksekliklerin tam min/max'ı, makul aralıkta
  let mn = Infinity, mx = -Infinity;
  for (let k = 0; k < n * n; k++) { const h = o.pos[k * 3 + 1]; if (h < mn) mn = h; if (h > mx) mx = h; }
  const mmOk = Number.isFinite(o.maxH) && Number.isFinite(o.minH) && o.minH <= o.maxH && Math.fround(o.minH) === mn && Math.fround(o.maxH) === mx && o.minH >= SEA_FLOOR - 10 && o.maxH < 500;
  denetim('SZ07' + ek, `minH/maxH ana ızgaranın min/max'ı, sonlu, [${SEA_FLOOR - 10}, 500) içinde — ${ad}`, mmOk, { minH: o.minH, maxH: o.maxH, gercekMin: mn, gercekMax: mx });

  // SZ08 hires yükseklik ızgarası: yalnız hires işte, Float32Array(n²), ana ızgara yükseklikleriyle bayt bayt aynı
  let hOk;
  if (msg.hires) {
    hOk = o.heights instanceof Float32Array && o.heights.length === n * n;
    if (hOk) for (let k = 0; k < n * n; k++) if (o.heights[k] !== o.pos[k * 3 + 1]) { hOk = false; break; }
  } else hOk = o.heights === null;
  denetim('SZ08' + ek, `heights ${msg.hires ? 'Float32Array(n²) = ana ızgara yükseklikleri' : 'null (hires değil)'} — ${ad}`, hOk, msg.hires ? { tip: o.heights?.constructor?.name, uzunluk: o.heights?.length } : o.heights);

  // SZ09 aktarım listesi: pos/nor/col/idx (+heights) arabellekleri, yinelemesiz
  const bekl = [o.pos.buffer, o.nor.buffer, o.col.buffer, o.idx.buffer, ...(o.heights ? [o.heights.buffer] : [])];
  const tOk = Array.isArray(transfer) && transfer.length === bekl.length && bekl.every((b) => transfer.includes(b)) && new Set(transfer).size === transfer.length;
  denetim('SZ09' + ek, `aktarım listesi tüm arabellekleri yinelemesiz içeriyor — ${ad}`, tOk, { transfer: transfer?.length, beklenen: bekl.length });
}

// SZ10–SZ11: depthGen
{
  const msg = { t: 'depth', id: 201, x0: -1200, z0: -1200 + 470, size: 2400, res: 64 };
  const { out: o, transfer } = runAll(generate({ ...msg }));
  const sorun = [];
  for (const k of ['t', 'id', 'x0', 'z0', 'size', 'res']) if (o[k] !== (k === 't' ? 'depth' : msg[k])) sorun.push(`${k}=${o[k]}`);
  if (!(o.data instanceof Uint16Array) || o.data.length !== msg.res * msg.res) sorun.push(`data Uint16Array(${msg.res ** 2}) değil`);
  if (!transfer || transfer.length !== 1 || transfer[0] !== o.data?.buffer) sorun.push('aktarım listesi data.buffer değil');
  let kodHata = 0, enBuyuk = 0;
  if (!sorun.length) for (let j = 0; j < msg.res; j++) for (let i = 0; i < msg.res; i++) {
    const h = computeHeight(msg.x0 + (i + 0.5) / msg.res * msg.size, msg.z0 + (j + 0.5) / msg.res * msg.size);
    const v = o.data[j * msg.res + i];
    if (v !== toHalf(h)) kodHata++;
    const f = Math.abs(decodeHalf(v) - h);
    // yarım duyarlıkta göreli hata ≤ 2^-11 (kesme) — 30 m'de ~0,015 m
    if (f > Math.max(1e-3, Math.abs(h) * 2 ** -10)) enBuyuk = Math.max(enBuyuk, f);
  }
  denetim('SZ10', 'depthGen alanlar/tipler/uzunluk ve hücre merkezlerinde toHalf(computeHeight) birebir', sorun.length === 0 && kodHata === 0, sorun.length ? sorun : { kodHata });
  denetim('SZ11', 'depthGen yarım duyarlıklı değerler çözülünce computeHeight ile yarım duyarlık sınırında aynı', sorun.length === 0 && enBuyuk === 0, { sinirDisiEnBuyukFark: enBuyuk });
}

// SZ12–SZ13: gridGen
{
  const msg = { t: 'grid', id: 301, x0: -10000, z0: -10000, size: 20000, res: 64 };
  const { out: o, transfer } = runAll(generate({ ...msg }));
  const sorun = [];
  for (const k of ['t', 'id', 'x0', 'z0', 'size', 'res']) if (o[k] !== (k === 't' ? 'grid' : msg[k])) sorun.push(`${k}=${o[k]}`);
  if (!(o.heights instanceof Float32Array) || o.heights.length !== msg.res ** 2) sorun.push('heights Float32Array(res²) değil');
  if (!(o.biomes instanceof Uint8Array) || o.biomes.length !== msg.res ** 2) sorun.push('biomes Uint8Array(res²) değil');
  if (!transfer || transfer.length !== 2 || !transfer.includes(o.heights?.buffer) || !transfer.includes(o.biomes?.buffer)) sorun.push('aktarım listesi heights/biomes arabellekleri değil');
  let hHata = 0, bHata = 0, bAralik = 0;
  const maxId = Math.max(...Object.values(BIOME_ID));
  if (!sorun.length) for (let j = 0; j < msg.res; j++) for (let i = 0; i < msg.res; i++) {
    const x = msg.x0 + (i + 0.5) / msg.res * msg.size, z = msg.z0 + (j + 0.5) / msg.res * msg.size;
    if (o.heights[j * msg.res + i] !== Math.fround(computeHeight(x, z))) hHata++;
    const b = o.biomes[j * msg.res + i];
    if (b !== (BIOME_ID[biomeAt(x, z)] || 0)) bHata++;
    if (b > maxId) bAralik++;
  }
  denetim('SZ12', 'gridGen alanlar/tipler/uzunluklar; yükseklikler computeHeight ile birebir', sorun.length === 0 && hHata === 0, sorun.length ? sorun : { hHata });
  const cesit = new Set(o.biomes || []);
  denetim('SZ13', `gridGen biyom kimlikleri BIOME_ID[biomeAt] ile birebir ve 0..${maxId} aralığında (dünya ızgarasında ≥ 3 farklı biyom)`, sorun.length === 0 && bHata === 0 && bAralik === 0 && cesit.size >= 3, { bHata, bAralik, farkliBiyom: cesit.size });
}

// SZ14: bilinmeyen iş türü
{
  let hata = null;
  try { generate({ t: 'bilinmeyen', id: 1 }); } catch (e) { hata = e.message; }
  denetim('SZ14', 'generate bilinmeyen iş türünde açık hata verir', !!hata, hata);
}

// SZ15: işçi yolu ↔ dilimli yol (iki üreteç dönüşümlü: terrain._localSlice'taki iki şerit gibi)
{
  const isler = [
    ...ORNEK_KARO.map((x) => x.msg),
    { t: 'depth', id: 202, x0: -1080, z0: -730, size: 2400, res: 128 },
    { t: 'grid', id: 302, x0: -2000, z0: -2000, size: 4000, res: 128 },
  ];
  const fark = [];
  let adimToplam = 0;
  for (let a = 0; a < isler.length; a++) {
    const m1 = isler[a], m2 = isler[(a + 1) % isler.length];
    const tek = runAll(generate(structuredClone(m1))).out;
    const g1 = generate(structuredClone(m1)), g2 = generate(structuredClone(m2));
    let r1 = null, r2 = null, adim = 0;
    while (!r1) {
      const s = g1.next(); adim++;
      if (s.done) r1 = s.value.out;
      if (!r2) { const t = g2.next(); if (t.done) r2 = t.value.out; }
    }
    adimToplam += adim;
    const f = ciktiFarki(tek, r1);
    if (f.length) fark.push({ is: m1.t + '#' + m1.id, alanlar: f });
  }
  denetim('SZ15', 'işçi yolu (runAll, tek seferde) ile dilimli yol (dönüşümlü next) çıktıları bayt düzeyinde aynı (5 iş)', fark.length === 0, fark.length ? fark : { is: isler.length, toplamAdim: adimToplam });
}

// SZ16–SZ18: terrain.js'in gerçek yerel yolu (Node'da Worker yok → kurucu ReferenceError → ana iş parçacığı yedeği)
{
  const THREE = await import('three');
  const { terrain: T } = await import(modUrl('world/terrain.js') + '?sozlesme=1');
  const uyari = console.warn; console.warn = () => {};
  delete globalThis.Worker;
  T.init(new THREE.Scene(), 'high');
  console.warn = uyari;
  bilgi(`terrain.js yerel kip: workers ${T.workers.length}, fallback ${T.fallback}, failures ${JSON.stringify(T.failures)}`);
  // her işi ve sonucunu kaydet (_enqueue: v0.4'teki iç ad; yoksa SZ16 uygulanamaz → FAIL ile bildirilir)
  const kayit = [];
  const asil = T._enqueue;
  if (typeof asil === 'function') {
    T._enqueue = function (msg, prio) {
      const kopya = structuredClone(msg);
      const job = asil.call(this, msg, prio);
      kopya.id = msg.id;
      const k = { msg: kopya, sonuc: undefined, hata: null };
      kayit.push(k);
      job.promise.then((r) => { k.sonuc = r; }, (e) => { k.hata = String(e && e.message || e); });
      return job;
    };
  }
  const t0 = performance.now();
  await T.prepare(10, 222, { radius: 450 });
  const izgara = await T.requestGrid(-2000, -2000, 4000, 128, -500).catch((e) => ({ hata: e.message }));
  // kuyruk boşalana dek (en çok 20 sn)
  for (let i = 0; i < 400 && T.stats().jobs > 0; i++) await new Promise((r) => setTimeout(r, 50));
  bilgi(`yerel prepare + ızgara ${Math.round(performance.now() - t0)} ms; ${JSON.stringify(T.stats())}`);
  const fark = [];
  let karsilastirilan = 0;
  const tur = {};
  for (const k of kayit) {
    if (!k.sonuc || k.hata) continue;
    const ref = runAll(generate(structuredClone(k.msg))).out;
    const f = ciktiFarki(ref, k.sonuc);
    karsilastirilan++;
    tur[k.msg.t] = (tur[k.msg.t] || 0) + 1;
    if (f.length) fark.push({ is: k.msg.t + '#' + k.msg.id, alanlar: f });
  }
  const hatali = kayit.filter((k) => k.hata);
  denetim('SZ16', 'terrain.js yerel (dilimli şerit) yolunun her sonucu runAll çıktısıyla bayt düzeyinde aynı (karo + derinlik + ızgara)',
    typeof asil === 'function' && fark.length === 0 && hatali.length === 0 && (tur.tile || 0) >= 20 && (tur.depth || 0) >= 1 && (tur.grid || 0) >= 1 && !izgara?.hata,
    typeof asil !== 'function' ? '_enqueue bulunamadı (iç ad değişmiş; denetim uygulanamadı)' : { karsilastirilan, tur, fark: fark.slice(0, 5), hatali: hatali.slice(0, 3).map((k) => k.hata), izgara: izgara?.hata || 'tamam' });

  // SZ17: sonuçlar ağ özniteliklerine aynen geçmiş ve ağ sahne grubunda
  let agHata = 0, agSay = 0;
  for (const t of T.tiles.values()) {
    if (!t.mesh) continue;
    agSay++;
    const g = t.mesh.geometry;
    const kaynak = kayit.find((k) => k.msg.t === 'tile' && k.msg.key === t.k && k.sonuc && k.sonuc.pos === g.attributes.position.array);
    if (!kaynak || g.index.array !== kaynak.sonuc.idx || g.attributes.normal.array !== kaynak.sonuc.nor || g.attributes.color.array !== kaynak.sonuc.col || t.mesh.parent !== T.group) agHata++;
  }
  denetim('SZ17', 'yerel yolda üretilen her karo ağı sahne grubunda ve ağ öznitelikleri üretilen dizilerin kendisi', agSay >= 20 && agHata === 0, { ag: agSay, hata: agHata });

  // SZ18: heightAt ↔ çizilen ağın üçgeni (hires karolar)
  let rnd = 12345;
  const rasgele = () => { rnd = (rnd * 1103515245 + 12345) >>> 0; return rnd / 4294967296; };
  // ağın indeks tamponundaki q. üçgen (x,z)'yi XZ izdüşümünde içeriyorsa o noktadaki düzlem yüksekliği, içermiyorsa null
  const ucgenY = (g, q, x, z) => {
    const pos = g.attributes.position.array, idx = g.index.array;
    const ia = idx[q], ib = idx[q + 1], ic = idx[q + 2];
    const Ax = pos[ia * 3], Az = pos[ia * 3 + 2], Bx = pos[ib * 3], Bz = pos[ib * 3 + 2], Cx = pos[ic * 3], Cz = pos[ic * 3 + 2];
    const d1 = (x - Bx) * (Az - Bz) - (Ax - Bx) * (z - Bz);
    const d2 = (x - Cx) * (Bz - Cz) - (Bx - Cx) * (z - Cz);
    const d3 = (x - Ax) * (Cz - Az) - (Cx - Ax) * (z - Az);
    const eksi = d1 < -1e-9 || d2 < -1e-9 || d3 < -1e-9, arti = d1 > 1e-9 || d2 > 1e-9 || d3 > 1e-9;
    if (eksi && arti) return null;
    const det = (Bx - Ax) * (Cz - Az) - (Cx - Ax) * (Bz - Az);
    if (Math.abs(det) < 1e-12) return null;
    const u = ((x - Ax) * (Cz - Az) - (Cx - Ax) * (z - Az)) / det;
    const v = ((Bx - Ax) * (z - Az) - (x - Ax) * (Bz - Az)) / det;
    const ya = pos[ia * 3 + 1], yb = pos[ib * 3 + 1], yc = pos[ic * 3 + 1];
    return ya + u * (yb - ya) + v * (yc - ya);
  };
  let nokta = 0, enBuyuk = 0, bulunamayan = 0, karoSay = 0;
  for (const t of T.tiles.values()) {
    if (!t.heights || !t.mesh || t.seg !== 80) continue;
    karoSay++;
    const g = t.mesh.geometry;
    const seg = t.seg, step = TILE / seg;
    const noktalar = [];
    for (let r = 0; r < 60; r++) noktalar.push([t.x0 + rasgele() * TILE * 0.9999, t.z0 + rasgele() * TILE * 0.9999]);
    for (let r = 0; r < 10; r++) { const i = Math.floor(rasgele() * seg), j = Math.floor(rasgele() * seg); noktalar.push([t.x0 + i * step, t.z0 + j * step]); noktalar.push([t.x0 + (i + 0.5) * step, t.z0 + (j + 0.5) * step]); }
    for (const [x, z] of noktalar) {
      const h = T.heightAt(x, z);
      // hücre (a,b) üçgenleri: q = (b·seg + a)·6
      const a = Math.min(seg - 1, Math.floor((x - t.x0) / step)), b = Math.min(seg - 1, Math.floor((z - t.z0) / step));
      let y = ucgenY(g, (b * seg + a) * 6, x, z);
      if (y === null) y = ucgenY(g, (b * seg + a) * 6 + 3, x, z);
      if (y === null) { for (let q = 0; q < g.index.array.length && y === null; q += 3) y = ucgenY(g, q, x, z); }
      if (y === null) { bulunamayan++; continue; }
      nokta++;
      enBuyuk = Math.max(enBuyuk, Math.abs(h - y));
    }
  }
  denetim('SZ18', 'heightAt ile çizilen ağ üçgeninin düzlemi aynı (hires karolar, rastgele + köşe + hücre merkezi noktaları; fark < 1 mm)', karoSay >= 4 && nokta >= 300 && bulunamayan === 0 && enBuyuk < 1e-3, { karo: karoSay, nokta, bulunamayan, enBuyukFark_m: enBuyuk });
}

function bitir(kod) {
  const gecen = sonuclar.filter((s) => s.ok).length, kalan = sonuclar.length - gecen;
  const durum = kod === 0 && kalan === 0 && sonuclar.length > 0 ? 'GECTI' : 'KALDI';
  const cikis = durum === 'GECTI' ? 0 : 1;
  if (RAPOR) {
    try { fs.mkdirSync(path.dirname(path.resolve(RAPOR)), { recursive: true }); fs.writeFileSync(RAPOR, JSON.stringify({ test: 'arazi_sozlesme', kok: KOK, node: process.version, durum, cikis, gecen, kalan, denetimler: sonuclar }, null, 1)); }
    catch (e) { console.log('RAPOR YAZILAMADI ' + e.message); }
  }
  console.log(`SONUC: ${durum} (çıkış ${cikis}) denetim ${gecen}/${sonuclar.length}${kalan ? ' | kalan: ' + sonuclar.filter((s) => !s.ok).map((s) => s.kimlik).join(', ') : ''} | kök ${KOK}`);
  process.exit(cikis);
}
bitir(0);
