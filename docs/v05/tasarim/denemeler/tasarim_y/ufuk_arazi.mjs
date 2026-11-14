// Salt-okur prototip: Yitik Ufuk'u (ayrı hikâye adası listesi) worldData dizilerine BELLEKTE ekleyip geo'yu sonra yükler.
// Kullanım: node ufuk_arazi.mjs [taban|hikaye]  → örnek noktaların yüksekliklerini yazdırır (karşılaştırma için)
const mode = process.argv[2] || 'hikaye';
const W = await import('/home/user/SON-HAZ-NE-w2/js/world/worldData.js');
const A = await import('/home/user/SON-HAZ-NE-w2/js/world/archipelago.js');
const CX = 5000, CZ = 7100;
const STORY_ISLANDS = [
  { id: 'yitik_ufuk', name: 'Yitik Ufuk', biome: 'cangil', x: CX, z: CZ, r: 300, h: 58, hill: 0.9, coast: 0.3, seed: 701, story: true, hidden: true },
  { id: 'ufuk_ignesi', name: 'Ufuk İğnesi', biome: 'hayalet', x: CX + 90, z: CZ - 70, r: 95, h: 150, hill: 1.2, coast: 0.2, seed: 703, shape: 'spire', story: true, hidden: true },
];
const STORY_MODS = [
  { type: 'flatten', x: CX - 280, z: CZ + 10, r: 26, h: 2.4, blend: 18, story: 'son_liman' },     // Son Liman (batı kıyısı)
  { type: 'dig', x: CX - 60, z: CZ + 170, r: 55, depth: -12, blend: 30, story: 'lagun' },         // Gelgit Kızı lagünü
  { type: 'flatten', x: CX - 20, z: CZ - 40, r: 32, h: null, blend: 18, story: 'mabet_meydani' }, // Mabet meydanı (iğnenin batı eteği)
];
if (mode === 'hikaye') {
  for (const I of STORY_ISLANDS) { I.features = []; I.region = A.regionAt(I.x, I.z); W.ISLANDS.push(I); }
  for (const M of STORY_MODS) W.TERRAIN_MODS.push(M);
}
const Gm = await import('/home/user/SON-HAZ-NE-w2/js/world/geo.js');
const H = (x, z) => Gm.computeHeight(x, z);
// 1) karşılaştırma örnekleri: tüm mevcut özellik/kazı/batık/liman noktaları + 40k sabit tohumlu rastgele nokta (Yitik Ufuk'un 1,6 km dışı)
const pts = [];
for (const I of A.EXTRA_ISLANDS) { pts.push([I.x, I.z]); for (const f of I.features) pts.push([f.x, f.z]); }
for (const s of W.DIG_SITES) pts.push([s.x, s.z]);
for (const w of W.WRECKS) pts.push([w.x, w.z]);
let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
while (pts.length < 40000) { const x = (rnd() * 2 - 1) * 9800, z = (rnd() * 2 - 1) * 9800; if (Math.hypot(x - CX, z - CZ) > 1600) pts.push([x, z]); }
let hsum = 0; const vals = pts.map(([x, z]) => H(x, z));
for (const v of vals) hsum = (hsum * 31 + Math.round(v * 1000)) % 1e15;
console.log(mode, 'örnek', pts.length, 'özet', hsum);
if (mode === 'hikaye') {
  // 2) adanın biçimi: zirve, meydan, liman, lagün
  let peak = { h: -1e9 };
  for (let x = CX - 330; x <= CX + 330; x += 5) for (let z = CZ - 330; z <= CZ + 330; z += 5) { const h = H(x, z); if (h > peak.h) peak = { x, z, h: +h.toFixed(1) }; }
  console.log('zirve', JSON.stringify(peak));
  for (const M of STORY_MODS) { const ring = []; for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; ring.push(H(M.x + Math.cos(a) * M.r * 0.8, M.z + Math.sin(a) * M.r * 0.8).toFixed(1)); } console.log(M.story, 'merkez', H(M.x, M.z).toFixed(1), 'r*0.8 halkası', ring.join(' ')); }
  // 3) kıyı sürekliliği (D02b benzeri; 16 ışın, 0.25 m adım, 0.4 m sıçrama + ikiye bölme)
  let seams = 0;
  for (const I of STORY_ISLANDS) for (let k = 0; k < 16; k++) {
    const a = k / 16 * 6.2832; const P = (d) => H(I.x + Math.cos(a) * d, I.z + Math.sin(a) * d);
    let p = null, pd = 0;
    for (let d = 0.3 * I.r; d < 1.6 * I.r; d += 0.25) { const h = P(d); if (p !== null && Math.abs(h - p) > 0.4) { let lo = pd, hi = d, hl = p, hh = h; for (let it = 0; it < 8; it++) { const m = (lo + hi) / 2, hm = P(m); if (Math.abs(hm - hl) > Math.abs(hh - hm)) { hi = m; hh = hm; } else { lo = m; hl = hm; } } if (Math.abs(hh - hl) > 0.3) seams++; } p = h; pd = d; }
  }
  console.log('kıyı süreksizliği', seams);
  // 4) radyal profil (batı: liman yönü; güney: lagün)
  for (const [nm, a] of [['batı', Math.PI], ['güney', Math.PI / 2], ['kuzeydoğu', -0.65]]) { const o = []; for (let d = 0; d <= 380; d += 20) o.push(`${d}:${H(CX + Math.cos(a) * d, CZ + Math.sin(a) * d).toFixed(0)}`); console.log('profil', nm, o.join(' ')); }
  // 5) en yakın mevcut ada kıyısına uzaklık
  let m = Infinity, who = null; for (const I of A.EXTRA_ISLANDS) { const d = Math.hypot(I.x - CX, I.z - CZ) - I.r; if (d < m) { m = d; who = I.id; } } console.log('en yakın ada kıyısı', Math.round(m), who);
}
