const geo = await import('/home/user/SON-HAZ-NE-w2/js/world/geo.js');
const W = await import('/home/user/SON-HAZ-NE-w2/js/world/worldData.js');
const bad = [];
for (const s of W.DIG_SITES) {
  const h = geo.computeHeight(s.x, s.z);
  const lim = s.tide ? -0.6 : 0.2;
  if (h < lim) bad.push([s.id, s.island, +h.toFixed(2), s.tide ? 'gelgit' : '', s.tier]);
}
console.log('kazilamaz', bad.length, JSON.stringify(bad));
// sinira yakin
const near = W.DIG_SITES.map(s => [s.id, +geo.computeHeight(s.x, s.z).toFixed(2)]).filter(([, h]) => h >= 0.2 && h < 0.8);
console.log('sinirda (0.2-0.8)', near.length, JSON.stringify(near));
