// Salt-okur: önerilen hikâye mağaralarının yol noktaları, taban yükseklikleri ve üstteki örtü kalınlığı
const A = await import('/home/user/SON-HAZ-NE-w2/js/world/archipelago.js');
const G = await import('/home/user/SON-HAZ-NE-w2/js/world/geo.js');
const deg = Math.PI / 180;
const isl = (id) => A.EXTRA_ISLANDS.find(i => i.id === id);
// mağara: ada, yön (derece), [f, taban] dizisi (f = merkezden uzaklık / r), tünel yüksekliği H
const C = [
  ['kor_damari', 'ates_dagi', 141, [[0.64, 28], [0.56, 34], [0.47, 42], [0.40, 50], [0.36, 54]], 4.6, 'Kor Odası r=10'],
  ['kor_baca', 'ates_dagi', 141, [[0.36, 54], [0.28, 62], [0.20, 70], [0.12, 77], [0.07, 79]], 4.2, 'krater çıkışı'],
  ['obsidyen_ocagi', 'obsidyen', 205, [[0.42, 10.5], [0.34, 11], [0.26, 11.5], [0.18, 12]], 3.8, 'Selim salonu r=9'],
  ['buz_sarayi', 'buzdisi', 8, [[0.50, 40], [0.42, 42], [0.34, 44], [0.26, 46]], 4.4, 'Taht salonu r=16'],
  ['murettebat_mahzeni', 'korsan_mezarligi', 197, [[0.30, 14], [0.22, 9], [0.14, 4], [0.06, 1.5]], 3.6, 'Mahzen salonu r=11, havuz -3'],
];
for (const [id, iid, a0, pts, H, note] of C) {
  const I = isl(iid); const a = a0 * deg;
  const out = pts.map(([f, fl]) => { const x = I.x + Math.cos(a) * f * I.r * (I.ex || 1), z = I.z + Math.sin(a) * f * I.r * (I.ez || 1); const h = G.computeHeight(x, z); return `(${Math.round(x)},${Math.round(z)}) taban=${fl} yüzey=${h.toFixed(0)} örtü=${(h - fl - H).toFixed(0)}`; });
  // eğim: ardışık noktalar arası
  let maxS = 0; for (let i = 1; i < pts.length; i++) { const dl = Math.abs(pts[i][0] - pts[i - 1][0]) * I.r; maxS = Math.max(maxS, Math.atan2(Math.abs(pts[i][1] - pts[i - 1][1]), dl) / deg); }
  const k16 = ((a0 / 22.5) % 1 + 1) % 1; const rayOff = Math.min(k16, 1 - k16) * 22.5;
  console.log(`== ${id} @${iid} yön ${a0}° (D02b ışınına ${rayOff.toFixed(1)}°) en dik ${maxS.toFixed(1)}° — ${note}`);
  for (const o of out) console.log('   ', o);
}
// Gümüş Madeni ocak çukuru ve Kızıl Kanyon tepe
const gm = isl('gumus_madeni'); const ga = 104 * deg;
for (const f of [0.2, 0.25, 0.3]) { const x = gm.x + Math.cos(ga) * f * gm.r, z = gm.z + Math.sin(ga) * f * gm.r; console.log('ocak f', f, Math.round(x), Math.round(z), G.computeHeight(x, z).toFixed(1)); }
const kk = isl('kizil_kanyon'); for (const [dx, dz] of [[0, 0], [30, 0], [-30, 0], [0, 30], [0, -30], [60, 20]]) console.log('kanyon', kk.x + dx, kk.z + dz, G.computeHeight(kk.x + dx, kk.z + dz).toFixed(1));
const dk = isl('demirkapi'); for (const [dx, dz] of [[-30, 25], [-40, 40], [40, -30], [0, 60]]) console.log('demirkapi', dk.features[0].x + dx, dk.features[0].z + dz, G.computeHeight(dk.features[0].x + dx, dk.features[0].z + dz).toFixed(1));
