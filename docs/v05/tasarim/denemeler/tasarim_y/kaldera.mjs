// Salt-okur prototip: 'kaldera' ada profili (geo.js islandH için öneri) — eğim ve süreklilik ölçümü
const U = await import('/home/user/SON-HAZ-NE-w2/js/core/util.js');
const { fbm, noise2, smoothstep, lerp } = U;
const SEA_FLOOR = -30;
const I = { x: 300, z: -2100, r: 260, h: 34, seed: 1662, coast: 0.12, hill: 0.4, saddle: { a: Math.PI, w: 0.35, h: 6 } };
function kaldera(x, z) {
  const dx = x - I.x, dz = z - I.z; const dist = Math.hypot(dx, dz);
  if (dist > I.r * 2.6) return -Infinity;
  const a = Math.atan2(dz, dx);
  const rn = fbm(Math.cos(a) * 1.3 + I.seed, Math.sin(a) * 1.3 + I.seed * 0.7, 3) * I.coast + noise2(x / 45 + I.seed, z / 45) * 0.05;
  const Re = I.r * (1 + rn); const d = dist / Re;
  if (d >= 1) { const t = smoothstep(1.0, 2.1, d); return SEA_FLOOR * Math.pow(t, 1.25) + fbm(x / 22, z / 22, 2) * 0.9 * (1 - t) * smoothstep(1.0, 1.3, d); }
  const beach = 1.5 * smoothstep(1.0, 0.9, d);
  // batı eyeri (iniş yeri): sırt yüksekliği burada düşer
  let da = Math.abs(((a - I.saddle.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
  const sad = smoothstep(I.saddle.w, 0, da);
  const rimH = lerp(I.h * (0.8 + 0.2 * fbm(x / 70 + I.seed, z / 70, 3)), I.saddle.h, sad);
  const lag = lerp(-6, -2.2, smoothstep(0.12, 0.5, d)) + fbm(x / 18, z / 18, 2) * 0.25;
  const inner = smoothstep(0.5, 0.58, d);          // iç uçurum (dik)
  const outer = smoothstep(1.0, 0.8, d);           // dış yamaç
  const ridge = rimH * Math.min(inner, outer);
  return d < 0.5 ? lag : Math.max(lerp(lag, 0, inner), beach + ridge);
}
// eğim taraması
let maxIn = 0, maxOut = 0, maxSaddle = 0, maxJump = 0;
for (let k = 0; k < 360; k++) { const a = k * Math.PI / 180; let prev = null;
  for (let f = 0.3; f < 1.6; f += 0.0025) { const x = I.x + Math.cos(a) * f * I.r, z = I.z + Math.sin(a) * f * I.r; const h = kaldera(x, z);
    if (prev !== null) { const s = Math.atan2(Math.abs(h - prev), 0.0025 * I.r) * 180 / Math.PI; const da = Math.abs(((a - Math.PI + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      if (f < 0.75) maxIn = Math.max(maxIn, s); else if (da < 0.15) maxSaddle = Math.max(maxSaddle, s); else maxOut = Math.max(maxOut, s); maxJump = Math.max(maxJump, Math.abs(h - prev)); }
    prev = h; } }
console.log('iç uçurum en dik', maxIn.toFixed(1), '° | dış yamaç en dik', maxOut.toFixed(1), '° | batı eyeri en dik', maxSaddle.toFixed(1), '° | 0,65 m adımda en büyük sıçrama', maxJump.toFixed(2), 'm');
for (const deg of [0, 90, 180, 270]) { const a = deg * Math.PI / 180; const row = []; for (let f = 0; f <= 1.2001; f += 0.08) row.push(kaldera(I.x + Math.cos(a) * f * I.r, I.z + Math.sin(a) * f * I.r).toFixed(0)); console.log(`${String(deg).padStart(3)}°`, row.join(' ')); }
