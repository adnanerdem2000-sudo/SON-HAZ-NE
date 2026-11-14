const W = '/home/user/SON-HAZ-NE-w2/js/world/';
const geo = await import(W + 'geo.js');
const D = await import(W + 'worldData.js');
const out = [];
for (const s of D.DIG_SITES) {
  const I = D.ISLANDS.find(i => i.id === s.island);
  for (const f of I.features || []) {
    const R = f.type === 'port' ? 58 * (f.size || 1) : f.type === 'temple' ? 62 : f.r ? f.r * 1.1 : f.type === 'beach_wreck' ? 10 : f.type === 'lighthouse' ? 4 : 0;
    if (!R) continue;
    const d = Math.hypot(s.x - f.x, s.z - f.z);
    if (d < R) out.push(`${s.id} -> ${f.type}${f.auto ? '*' : ''} (${f.id}) mesafe ${d.toFixed(1)} m < ${R.toFixed(0)} m`);
  }
  if (I.shape === 'volcano') { const d = Math.hypot(s.x - I.x, s.z - I.z); if (d < I.r * 0.13 + 2) out.push(`${s.id} -> lav golu (r ${(I.r*0.13).toFixed(0)}) mesafe ${d.toFixed(1)}`); }
}
console.log(out.length); console.log(out.join('\n'));
