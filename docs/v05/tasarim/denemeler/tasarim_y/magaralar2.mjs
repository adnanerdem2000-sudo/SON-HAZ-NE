const A = await import('/home/user/SON-HAZ-NE-w2/js/world/archipelago.js');
const G = await import('/home/user/SON-HAZ-NE-w2/js/world/geo.js');
const line = (name, x0, z0, x1, z1, floors, H) => {
  console.log('==', name);
  floors.forEach((fl, i) => { const t = i / (floors.length - 1); const x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t; const h = G.computeHeight(x, z); console.log(`   t=${t.toFixed(2)} (${Math.round(x)},${Math.round(z)}) taban=${fl} yüzey=${h.toFixed(1)} örtü=${(h - fl - H).toFixed(1)}`); });
};
// Obsidyen: maden ağzından ada merkezine
line('obsidyen_ocagi', 6370, 2670, 6300, 2700, [10.6, 11, 11.5, 12, 12.5, 13], 3.8);
// Buzdişi: 8° yönünde, f 0.34 → 0.12
{ const I = A.EXTRA_ISLANDS.find(i => i.id === 'buzdisi'); const a = 8 * Math.PI / 180; const P = (f) => [I.x + Math.cos(a) * f * I.r, I.z + Math.sin(a) * f * I.r];
  const [x0, z0] = P(0.36), [x1, z1] = P(0.12); line('buz_sarayi', x0, z0, x1, z1, [38, 40, 42, 44, 46], 4.4); }
// Mezarlık: mezarlık-1 mahzeninden ada merkezine
line('murettebat_mahzeni', -6708, -6372, -6800, -6400, [15, 11, 7, 3.5, 1.5], 3.6);
// Kor Damarı (141°) ağız f=0.64
{ const I = A.EXTRA_ISLANDS.find(i => i.id === 'ates_dagi'); const a = 141 * Math.PI / 180; const pts = [[0.64, 24], [0.56, 30], [0.47, 38], [0.40, 46], [0.36, 50], [0.28, 58], [0.20, 66], [0.12, 74], [0.07, 77]];
  console.log('== kor_damari+baca'); for (const [f, fl] of pts) { const x = I.x + Math.cos(a) * f * I.r, z = I.z + Math.sin(a) * f * I.r; const h = G.computeHeight(x, z); console.log(`   f=${f} (${Math.round(x)},${Math.round(z)}) taban=${fl} yüzey=${h.toFixed(1)} örtü=${(h - fl - 4.6).toFixed(1)}`); } }
