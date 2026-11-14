const geo = await import('/home/user/SON-HAZ-NE-w2/js/world/geo.js');
const W = await import('/home/user/SON-HAZ-NE-w2/js/world/worldData.js');
const H = geo.computeHeight;
const I = W.ISLANDS.find(i => i.id === 'ada_volkan_6');
console.log(JSON.stringify({ id: I.id, name: I.name, shape: I.shape, r: I.r, h: I.h, x: I.x, z: I.z, hill: I.hill, features: I.features.map(f => ({ t: f.type, auto: f.auto, x: f.x, z: f.z })) }));
for (const s of W.DIG_SITES.filter(s => s.island === I.id)) {
  const d = Math.hypot(s.x - I.x, s.z - I.z);
  console.log(s.id, s.tier, 'd/r', (d / I.r).toFixed(2), 'h', H(s.x, s.z).toFixed(2), s.clue);
  const a = Math.atan2(s.z - I.z, s.x - I.x);
  const prof = []; for (let t = 0; t <= I.r * 1.15; t += I.r / 25) prof.push(H(I.x + Math.cos(a) * t, I.z + Math.sin(a) * t).toFixed(1));
  console.log(' ışın', prof.join(' '));
  // ny at site
  const e = 1.5, x = s.x, z = s.z; const A = H(x - e, z) - H(x + e, z), C = H(x, z - e) - H(x, z + e); console.log(' ny', (2 * e / Math.hypot(A, 2 * e, C)).toFixed(3));
}
// ada_merkez_6_kazi_0 kuru zemin
const s = W.DIG_SITES.find(s => s.id === 'ada_merkez_6_kazi_0');
let best = -9, bd = 0; for (let dx = -3.7; dx <= 3.7; dx += 0.1) for (let dz = -3.7; dz <= 3.7; dz += 0.1) { if (Math.hypot(dx, dz) > 3.7) continue; const hh = H(s.x + dx, s.z + dz); if (hh > best) { best = hh; bd = Math.hypot(dx, dz); } }
console.log('ada_merkez_6_kazi_0 3,7 m içinde en yüksek zemin', best.toFixed(2), 'uzaklık', bd.toFixed(2));
for (const id of ['ada_merkez_5_kazi_0', 'ada_tropik_1_kazi_0']) { const s = W.DIG_SITES.find(q => q.id === id); let best = -9, bd = 0; for (let dx = -3.7; dx <= 3.7; dx += 0.1) for (let dz = -3.7; dz <= 3.7; dz += 0.1) { if (Math.hypot(dx, dz) > 3.7) continue; const hh = H(s.x + dx, s.z + dz); if (hh > best) { best = hh; bd = Math.hypot(dx, dz); } } console.log(id, '3,7 m içinde en yüksek zemin', best.toFixed(2), 'uzaklık', bd.toFixed(2)); }
