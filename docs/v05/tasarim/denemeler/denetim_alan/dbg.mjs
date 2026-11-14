const geo = await import('/home/user/SON-HAZ-NE-w2/js/world/geo.js');
const W = await import('/home/user/SON-HAZ-NE-w2/js/world/worldData.js');
const I = W.ISLANDS.find(i => i.id === process.argv[2]);
console.log(I.id, I.name, I.shape, 'r', I.r, 'h', I.h, 'features', JSON.stringify(I.features.map(f => ({ t: f.type, x: f.x, z: f.z, auto: f.auto, r: f.r }))));
for (const f of I.features) {
  // profile along ray from center through feature outward
  const a = Math.atan2(f.z - I.z, f.x - I.x);
  const prof = [];
  for (let d = 0; d <= I.r * 1.2; d += I.r / 20) prof.push(+geo.computeHeight(I.x + Math.cos(a) * d, I.z + Math.sin(a) * d).toFixed(1));
  console.log('ışın', f.type, prof.join(' '));
  console.log('merkez h', geo.computeHeight(f.x, f.z).toFixed(2));
}
