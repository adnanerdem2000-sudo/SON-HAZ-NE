// Salt-okur: Buzdişi buz mağarası ve Gümüş Madeni galerisi için ışın profilleri + genelleştirilmiş oyma (noktaya göre taban) denemesi
const A = await import('/home/user/SON-HAZ-NE-w2/js/world/archipelago.js');
const Gm = await import('/home/user/SON-HAZ-NE-w2/js/world/geo.js');
const H = (x, z) => Gm.computeHeight(x, z);
const I = A.EXTRA_ISLANDS.find((i) => i.id === 'buzdisi');
for (const a of [-0.25, -0.405, -0.55, -0.7]) {
  const o = []; for (let d = 0.6; d <= 1.12; d += 0.04) o.push(`${d.toFixed(2)}:${H(I.x + Math.cos(a) * d * I.r, I.z + Math.sin(a) * d * I.r).toFixed(0)}`);
  console.log('buzdisi açı', a, o.join(' '));
}
// aday buz mağarası: giriş kıyıdan içeri (d≈0.93, h≈4-6), oda d≈0.84 (taban -3, göl), batık geçit odadan iç tarafa d≈0.78 (taban -9) mabet nişi
const ang = -0.405, ux = Math.cos(ang), uz = Math.sin(ang);
const P = (d) => [I.x + ux * d * I.r, I.z + uz * d * I.r];
const path = [[0.95, 4.0], [0.92, 3.2], [0.89, 1.0], [0.86, -2.5], [0.84, -3.0], [0.80, -6.5], [0.775, -9.0]];
let o = [];
for (const [d, fl] of path) { const [x, z] = P(d); o.push(`d${d}:(${x.toFixed(0)},${z.toFixed(0)}) arazi=${H(x, z).toFixed(1)} taban=${fl}`); }
console.log('buz mağarası yolu', o.join(' | '));
// Gümüş Madeni galerisi: giriş ex,ez yaw 2.81
const M = A.EXTRA_ISLANDS.find((i) => i.id === 'gumus_madeni');
const f = M.features.find((q) => q.type === 'mine');
const yaw = Math.atan2(M.x - f.x, M.z - f.z);
const ex = f.x + Math.sin(yaw) * 18, ez = f.z + Math.cos(yaw) * 18;
o = [];
for (const k of [0, 6, 12, 20, 28, 36, 44, 52, 60]) { const x = ex + Math.sin(yaw) * k, z = ez + Math.cos(yaw) * k; o.push(`${k}m:(${x.toFixed(0)},${z.toFixed(0)}) arazi=${H(x, z).toFixed(1)}`); }
console.log('maden galerisi ekseni', o.join(' | '));
// yandaki mevcut nesneler: kazı noktaları ve özellikler 80 m içinde
const W = await import('/home/user/SON-HAZ-NE-w2/js/world/worldData.js');
for (const [nm, cx, cz] of [['buz', ...P(0.85)], ['maden', ex + Math.sin(yaw) * 40, ez + Math.cos(yaw) * 40]]) {
  const near = [];
  for (const s of W.DIG_SITES) if (Math.hypot(s.x - cx, s.z - cz) < 90) near.push(s.id + '@' + Math.round(Math.hypot(s.x - cx, s.z - cz)));
  for (const J of A.EXTRA_ISLANDS) for (const g of J.features) if (Math.hypot(g.x - cx, g.z - cz) < 90) near.push(g.id + '@' + Math.round(Math.hypot(g.x - cx, g.z - cz)));
  console.log('yakın nesneler', nm, near.join(', ') || '-');
}
