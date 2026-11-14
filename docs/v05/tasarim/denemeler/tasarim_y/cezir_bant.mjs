// Salt-okur: kaldera profili + cezir alanı — geçiş bandında (140–180 m) boşaltılmış su yüzeyi her açıda araziden alçak mı?
const U = await import('/home/user/SON-HAZ-NE-w2/js/core/util.js');
const { fbm, noise2, smoothstep, lerp } = U;
const I = { x: 300, z: -2100, r: 260, h: 34, seed: 1662, coast: 0.12, saddle: { a: Math.PI, w: 0.35, h: 6 } };
function kaldera(x, z) {
  const dx = x - I.x, dz = z - I.z; const dist = Math.hypot(dx, dz); const a = Math.atan2(dz, dx);
  const rn = fbm(Math.cos(a) * 1.3 + I.seed, Math.sin(a) * 1.3 + I.seed * 0.7, 3) * I.coast + noise2(x / 45 + I.seed, z / 45) * 0.05;
  const Re = I.r * (1 + rn); const d = dist / Re; if (d >= 1) return -1;
  const beach = 1.5 * smoothstep(1.0, 0.9, d);
  const da = Math.abs(((a - I.saddle.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI); const sad = smoothstep(I.saddle.w, 0, da);
  const rimH = lerp(I.h * (0.8 + 0.2 * fbm(x / 70 + I.seed, z / 70, 3)), I.saddle.h, sad);
  const lag = lerp(-6, -2.2, smoothstep(0.12, 0.5, d)) + fbm(x / 18, z / 18, 2) * 0.25;
  const inner = smoothstep(0.5, 0.58, d), outer = smoothstep(1.0, 0.8, d);
  return d < 0.5 ? lag : Math.max(lerp(lag, 0, inner), beach + rimH * Math.min(inner, outer));
}
const water = (r, drop = 9, r0 = 150, r1 = 175) => -drop * smoothstep(r1, r0, r);
let worst = Infinity, at = null;
for (let k = 0; k < 360; k++) { const a = k * Math.PI / 180; for (let r = 120; r <= 190; r += 0.5) { const x = I.x + Math.cos(a) * r, z = I.z + Math.sin(a) * r; const g = kaldera(x, z) - water(r); if (g < worst) { worst = g; at = [k, r, +kaldera(x, z).toFixed(2), +water(r).toFixed(2)]; } } }
console.log('en küçük (arazi − boşaltılmış su) payı', worst.toFixed(2), 'm  @ [açı°, r, arazi, su]', JSON.stringify(at));
for (const r of [150, 160, 170]) { let mn = Infinity; for (let k = 0; k < 360; k++) { const a = k * Math.PI / 180; mn = Math.min(mn, kaldera(I.x + Math.cos(a) * r, I.z + Math.sin(a) * r)); } console.log(`r=${r}: su ${water(r).toFixed(2)} m, en alçak arazi ${mn.toFixed(2)} m`); }
