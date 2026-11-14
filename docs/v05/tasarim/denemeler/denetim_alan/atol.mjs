const W = '/home/user/SON-HAZ-NE-w2/js/world/';
const geo = await import(W + 'geo.js');
const D = await import(W + 'worldData.js');
for (const I of D.ISLANDS.filter(i => i.shape === 'atoll')) for (const f of I.features) {
  if (!['camp','ruin','graveyard','mine'].includes(f.type)) continue;
  const ring = [0, 10, 20, 30, 40].map(r => { let mn = 1e9; for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283; mn = Math.min(mn, geo.computeHeight(f.x + Math.cos(a) * r, f.z + Math.sin(a) * r)); } return mn.toFixed(1); });
  console.log(I.id, f.type + (f.auto ? '*' : ''), 'd/r', (Math.hypot(f.x - I.x, f.z - I.z) / I.r).toFixed(2), 'f.r', f.r, 'min h @0/10/20/30/40m', ring.join(' / '));
}
