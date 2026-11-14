// Hakem: Yitik Ufuk aday konumlarının çevresi (salt-okur)
const W = '/home/user/SON-HAZ-NE-w2/js/world/';
const D = await import(W + 'worldData.js');
const A = await import(W + 'archipelago.js');
const cands = [
  { ad: 'A (300,-2100) sis r760', x: 300, z: -2100, R: 760 },
  { ad: 'B (5000,7100) Perde R1000', x: 5000, z: 7100, R: 1000 },
];
for (const c of cands) {
  console.log('==', c.ad);
  const isl = D.ISLANDS.map((I) => ({ id: I.id, d: Math.hypot(I.x - c.x, I.z - c.z), r: I.r, reach: I.r * 2.6 * Math.max(I.ex || 1, I.ez || 1) }))
    .map((o) => ({ ...o, kiyi: o.d - o.r, etkiPay: o.d - o.reach, halkaKiyiPay: o.d - o.r - c.R }))
    .sort((a, b) => a.d - b.d).slice(0, 6);
  for (const o of isl) console.log(' ada', o.id, 'merkez', o.d.toFixed(0), 'kiyi', o.kiyi.toFixed(0), 'etki alanina pay', o.etkiPay.toFixed(0), 'halka->kiyi pay', o.halkaKiyiPay.toFixed(0));
  const near = (arr, nm, rr = 0) => arr.map((o) => ({ id: o.id, d: Math.hypot(o.x - c.x, o.z - c.z) - (o.r || 0) })).filter((o) => o.d < c.R + 600).sort((a, b) => a.d - b.d).slice(0, 5).forEach((o) => console.log(' ', nm, o.id, o.d.toFixed(0)));
  near(D.DIG_SITES, 'kazi'); near(D.WRECKS, 'batik'); near(D.POIS, 'poi'); near(D.FISH_ZONES, 'balik'); near(A.BOSS_SITES, 'boss');
  console.log(' bolge', A.regionAt(c.x, c.z));
}
// Kırlangıç limanından A konumuna, Fener Kayası'ndan A'ya
console.log('Kirlangic->A', Math.hypot(300, -2100).toFixed(0), 'Fener->A', Math.hypot(300 + 1250, -2100 + 1950).toFixed(0));
console.log('Tapinak->B', Math.hypot(5000 - 1900, 7100 - 7400).toFixed(0), 'ZumrutKoy->B', Math.hypot(5000 + 300, 7100 - 5300).toFixed(0), 'BatikSehir->B', Math.hypot(5000 - 3300, 7100 - 5600).toFixed(0));
