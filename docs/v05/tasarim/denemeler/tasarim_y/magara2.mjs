// Salt-okur: genelleştirilmiş mağara oyması (nokta başına taban) prototipi — Buz Mağarası (Buzdişi) ve Derin Galeri (Gümüş Madeni)
const A = await import('/home/user/SON-HAZ-NE-w2/js/world/archipelago.js');
const Gm = await import('/home/user/SON-HAZ-NE-w2/js/world/geo.js');
const H0 = (x, z) => Gm.computeHeight(x, z);
const lerp = (a, b, t) => a + (b - a) * t;
const ss = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
function segDist(px, pz, ax, az, bx, bz) { const abx = bx - ax, abz = bz - az; const t = Math.max(0, Math.min(1, ((px - ax) * abx + (pz - az) * abz) / (abx * abx + abz * abz))); return [Math.hypot(px - (ax + abx * t), pz - (az + abz * t)), t]; }
function carve(C, x, z, h) {
  // yol: [x,z,taban] noktaları; genişlik W; oda {x,z,r,floor, gol:{r,floor}, cukur:{r,floor}}
  let best = Infinity, fl = 0;
  for (let i = 0; i < C.path.length - 1; i++) { const [a, b] = [C.path[i], C.path[i + 1]]; const [d, t] = segDist(x, z, a[0], a[1], b[0], b[1]); if (d < best) { best = d; fl = lerp(a[2], b[2], t); } }
  const cw = C.width + 0.4;
  if (best < cw + 3) h = lerp(h, fl, ss(cw + 3, cw, best));
  const ch = C.chamber, dc = Math.hypot(x - ch.x, z - ch.z);
  if (dc < ch.r + 3) h = lerp(h, ch.floor, ss(ch.r + 3, ch.r, dc));
  if (ch.gol && dc < ch.gol.r + 1.5) h = lerp(h, ch.gol.floor, ss(ch.gol.r + 1.5, ch.gol.r, dc));
  if (ch.cukur && dc < ch.cukur.r + 1) h = lerp(h, ch.cukur.floor, ss(ch.cukur.r + 1, ch.cukur.r, dc));
  if (C.kanal) { const k = C.kanal; const [d] = segDist(x, z, k[0][0], k[0][1], k[1][0], k[1][1]); if (d < k[2] + 2) h = Math.min(h, lerp(h, k[3], ss(k[2] + 2, k[2], d))); }
  return h;
}
const B = A.EXTRA_ISLANDS.find((i) => i.id === 'buzdisi');
const ang = -0.405, ux = Math.cos(ang), uz = Math.sin(ang);
const Pd = (d) => [B.x + ux * d * B.r, B.z + uz * d * B.r];
const [ex, ez] = Pd(0.70), [m1x, m1z] = Pd(0.745), [cx, cz] = Pd(0.81), [kx, kz] = Pd(1.0);
const BUZ = { id: 'buz', path: [[ex, ez, 9.5], [m1x, m1z, 5.0], [cx - ux * 13, cz - uz * 13, 0.8]], width: 3.4, height: 4.4,
  chamber: { x: cx, z: cz, r: 12, floor: 0.8, gol: { r: 6.5, floor: -4 }, cukur: { r: 2.4, floor: -9 } }, kanal: [[cx + ux * 8, cz + uz * 8], [kx, kz], 3.0, -4] };
const M = A.EXTRA_ISLANDS.find((i) => i.id === 'gumus_madeni');
const f = M.features.find((q) => q.type === 'mine');
const yaw = Math.atan2(M.x - f.x, M.z - f.z), sx = Math.sin(yaw), sz = Math.cos(yaw);
const mx = f.x + sx * 18, mz = f.z + sz * 18;
const MAD = { id: 'maden', path: [[mx, mz, 10.2], [mx + sx * 20, mz + sz * 20, 9.8], [mx + sx * 38, mz + sz * 38, 9.0]], width: 3.2, height: 4.4,
  chamber: { x: mx + sx * 52, z: mz + sz * 52, r: 14, floor: 9.0 } };
for (const C of [BUZ, MAD]) {
  console.log(`\n# ${C.id} giriş (${C.path[0][0].toFixed(0)},${C.path[0][1].toFixed(0)}) oda (${C.chamber.x.toFixed(0)},${C.chamber.z.toFixed(0)}) r=${C.chamber.r}`);
  const rows = [];
  const pts = [...C.path.map((p) => [p[0], p[1], p[2], 'yol']), [C.chamber.x, C.chamber.z, C.chamber.floor, 'oda']];
  for (const [x, z, fl, k] of pts) {
    const h = H0(x, z), roof = fl + C.height;
    rows.push(`${k}: arazi=${h.toFixed(1)} taban=${fl} tavan=${roof.toFixed(1)} → yarık derinliği=${Math.max(0, h - roof).toFixed(1)} m, tüp dışarıda=${Math.max(0, roof - h).toFixed(1)} m`);
  }
  const domeTop = C.chamber.floor - 0.4 + (C.chamber.r + 1) * 0.62;
  rows.push(`oda kubbesi tepe=${domeTop.toFixed(1)} m; oda çevresi arazi (r+4 halkası) = ${[0, 1, 2, 3, 4, 5, 6, 7].map((k) => H0(C.chamber.x + Math.cos(k * 0.785) * (C.chamber.r + 4), C.chamber.z + Math.sin(k * 0.785) * (C.chamber.r + 4)).toFixed(0)).join(' ')}`);
  console.log(rows.join('\n'));
  // taban eğimi (yol boyunca, en dik)
  let worst = 0; for (let i = 0; i < C.path.length - 1; i++) { const a = C.path[i], b = C.path[i + 1]; const run = Math.hypot(b[0] - a[0], b[1] - a[1]); worst = Math.max(worst, Math.atan(Math.abs(b[2] - a[2]) / run) * 180 / Math.PI); }
  console.log('yol tabanı en dik eğim', worst.toFixed(1), '°');
  // oyma sonrası örnek: göl, çukur, kanal
  if (C.chamber.gol) { console.log('göl merkezi', carve(C, C.chamber.x, C.chamber.z, H0(C.chamber.x, C.chamber.z)).toFixed(1), 'göl kenarı r=8', carve(C, C.chamber.x + 8, C.chamber.z, H0(C.chamber.x + 8, C.chamber.z)).toFixed(1), 'kanal ortası', carve(C, (C.kanal[0][0] + C.kanal[1][0]) / 2, (C.kanal[0][1] + C.kanal[1][1]) / 2, H0((C.kanal[0][0] + C.kanal[1][0]) / 2, (C.kanal[0][1] + C.kanal[1][1]) / 2)).toFixed(1)); }
  // etkilenen alan içinde mevcut nesne var mı (özellik/kazı/batık)
  const W = await import('/home/user/SON-HAZ-NE-w2/js/world/worldData.js');
  let hit = [];
  const near = (x, z) => { let d = Infinity; for (let i = 0; i < C.path.length - 1; i++) d = Math.min(d, segDist(x, z, C.path[i][0], C.path[i][1], C.path[i + 1][0], C.path[i + 1][1])[0]); d = Math.min(d, Math.hypot(x - C.chamber.x, z - C.chamber.z) - C.chamber.r); if (C.kanal) d = Math.min(d, segDist(x, z, C.kanal[0][0], C.kanal[0][1], C.kanal[1][0], C.kanal[1][1])[0]); return d; };
  for (const s of W.DIG_SITES) if (near(s.x, s.z) < 30) hit.push(s.id);
  for (const J of A.EXTRA_ISLANDS) for (const g of J.features) if (near(g.x, g.z) < (g.r || 10) + 25) hit.push(g.id + '@' + near(g.x, g.z).toFixed(0));
  console.log('30 m içinde mevcut nesne', hit.join(', ') || 'yok');
  const I = C.id === 'buz' ? B : M;
  const dMax = Math.max(...[...C.path.map((p) => Math.hypot(p[0] - I.x, p[1] - I.z)), Math.hypot(C.chamber.x - I.x, C.chamber.z - I.z) + C.chamber.r + 3, C.kanal ? Math.hypot(C.kanal[1][0] - I.x, C.kanal[1][1] - I.z) + 5 : 0]) / I.r;
  console.log('ada merkezine en uzak oyma noktası / r =', dMax.toFixed(3), '(deniz kayalığı halkası 1.12–1.52 r dışında kalmalı)');
}
