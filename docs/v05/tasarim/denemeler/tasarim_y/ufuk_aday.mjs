// Salt-okur: Yitik Ufuk aday merkezinin çevresindeki ada/kazı/batık/balık bölgeleri
const W = await import('/home/user/SON-HAZ-NE-w2/js/world/worldData.js');
const G = await import('/home/user/SON-HAZ-NE-w2/js/world/geo.js');
for (const [cx, cz] of [[300, -2100], [250, -2000], [400, -2200]]) {
  const near = W.ISLANDS.map(I => ({ id: I.id, d: Math.round(Math.hypot(I.x - cx, I.z - cz)), r: I.r, reach: Math.round(I.r * 2.6) })).sort((a, b) => a.d - b.d).slice(0, 6);
  console.log(`== (${cx},${cz}) en yakın adalar:`, near.map(n => `${n.id} d=${n.d} r=${n.r} etki=${n.reach}`).join(' | '));
  const dig = W.DIG_SITES.filter(s => Math.hypot(s.x - cx, s.z - cz) < 1500).map(s => s.id);
  const wr = W.WRECKS.filter(s => Math.hypot(s.x - cx, s.z - cz) < 1500).map(s => s.id);
  const fz = W.FISH_ZONES.filter(s => Math.hypot(s.x - cx, s.z - cz) < 1200 + s.r).map(s => s.id + ':' + s.r);
  console.log('  kazı<1500:', dig.join(',') || '-', '| batık<1500:', wr.join(',') || '-', '| balık:', fz.join(','));
  const hs = [];
  for (let r = 0; r <= 900; r += 150) for (let a = 0; a < 6.28; a += 1.57) hs.push(G.computeHeight(cx + Math.cos(a) * r, cz + Math.sin(a) * r));
  console.log('  arazi min/max (r≤900):', Math.min(...hs).toFixed(1), Math.max(...hs).toFixed(1));
}
// Fener Kayası ile aday arasındaki doğru üzerinde arazi
const F = { x: -1243, z: -1950 };
const row = [];
for (let t = 0; t <= 1.0001; t += 0.1) row.push(G.computeHeight(F.x + (300 - F.x) * t, F.z + (-2100 - F.z) * t).toFixed(0));
console.log('Fener→aday hattı yükseklik:', row.join(' '));
