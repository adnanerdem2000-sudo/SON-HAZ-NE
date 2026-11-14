// Hakem: Yitik Ufuk (A'nın kaldera önerisi) güney dış resifinde -9…-11 m'lik batık yeri ve sunak/kamp yükseklikleri
const U = await import('/home/user/SON-HAZ-NE-w2/js/core/util.js');
const { fbm, noise2, smoothstep, lerp } = U;
const SEA_FLOOR = -30;
const I = { x: 300, z: -2100, r: 260, h: 34, seed: 1662, coast: 0.12, saddle: { a: Math.PI, w: 0.35, h: 6 } };
function kaldera(x, z) {
  const dx = x - I.x, dz = z - I.z; const dist = Math.hypot(dx, dz);
  if (dist > I.r * 2.6) return -Infinity;
  const a = Math.atan2(dz, dx);
  const rn = fbm(Math.cos(a) * 1.3 + I.seed, Math.sin(a) * 1.3 + I.seed * 0.7, 3) * I.coast + noise2(x / 45 + I.seed, z / 45) * 0.05;
  const Re = I.r * (1 + rn); const d = dist / Re;
  if (d >= 1) { const t = smoothstep(1.0, 2.1, d); return SEA_FLOOR * Math.pow(t, 1.25) + fbm(x / 22, z / 22, 2) * 0.9 * (1 - t) * smoothstep(1.0, 1.3, d); }
  const beach = 1.5 * smoothstep(1.0, 0.9, d);
  const da = Math.abs(((a - I.saddle.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
  const sad = smoothstep(I.saddle.w, 0, da);
  const rimH = lerp(I.h * (0.8 + 0.2 * fbm(x / 70 + I.seed, z / 70, 3)), I.saddle.h, sad);
  const lag = lerp(-6, -2.2, smoothstep(0.12, 0.5, d)) + fbm(x / 18, z / 18, 2) * 0.25;
  const inner = smoothstep(0.5, 0.58, d), outer = smoothstep(1.0, 0.8, d);
  return d < 0.5 ? lag : Math.max(lerp(lag, 0, inner), beach + rimH * Math.min(inner, outer));
}
// güney (+z) ekseni boyunca profil
for (let r = 240; r <= 460; r += 20) console.log('güney r', r, kaldera(300, -2100 + r).toFixed(1));
// -9…-11 m bandında, düz (6 m içinde ±1,5 m) noktalar, güney yayında (±35°)
const out = [];
for (let deg = 55; deg <= 125; deg += 5) for (let r = 300; r <= 470; r += 5) {
  const a = deg * Math.PI / 180, x = I.x + Math.cos(a) * r, z = I.z + Math.sin(a) * r, h = kaldera(x, z);
  if (h > -11 && h < -9) { let lo = Infinity, hi = -Infinity; for (let k = 0; k < 12; k++) { const q = kaldera(x + Math.cos(k / 12 * 6.283) * 8, z + Math.sin(k / 12 * 6.283) * 8); lo = Math.min(lo, q); hi = Math.max(hi, q); } if (hi - lo < 4) out.push([deg, r, Math.round(x), Math.round(z), h.toFixed(1), (hi - lo).toFixed(1)]); }
}
console.log('aday batık yerleri [açı, r, x, z, h, 8m eğim farkı]:', JSON.stringify(out.slice(0, 6)), '… toplam', out.length);
for (const [k, x, z] of [['sunak (482,-2100)', 482, -2100], ['kamp (300,-2282)', 300, -2282], ['POI filo (300,-1853)', 300, -1853], ['batı eyeri (40,-2100)', 40, -2100], ['batı eyeri iç (100,-2100)', 100, -2100], ['merkez', 300, -2100]]) console.log(k, kaldera(x, z).toFixed(1));
