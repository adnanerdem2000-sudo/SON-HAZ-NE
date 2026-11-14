const A = await import('/home/user/SON-HAZ-NE-w2/js/world/archipelago.js');
const Gm = await import('/home/user/SON-HAZ-NE-w2/js/world/geo.js');
const H = (x, z) => Gm.computeHeight(x, z);
const I = A.EXTRA_ISLANDS.find((i) => i.id === 'ates_dagi');
for (const d of [0.28, 0.30, 0.32]) {
  const x = I.x - d * I.r, z = I.z;
  const ring = []; for (let k = 0; k < 8; k++) ring.push(H(x + Math.cos(k * 0.785) * 6, z + Math.sin(k * 0.785) * 6).toFixed(1));
  console.log('d', d, `(${x.toFixed(0)},${z})`, 'merkez', H(x, z).toFixed(1), 'r6 halkası', ring.join(' '), 'kratere uzaklık', (d * I.r).toFixed(0), 'tetik r', (0.24 * I.r).toFixed(0));
}
// Buzdişi zirvesi çevresi ve Fener Kayası çevresi
for (const [nm, x, z] of [['buz zirve', -1456, -7316], ['fener', -1243, -1950]]) {
  const ring = []; for (let k = 0; k < 8; k++) ring.push(H(x + Math.cos(k * 0.785) * 6, z + Math.sin(k * 0.785) * 6).toFixed(1));
  console.log(nm, H(x, z).toFixed(1), 'r6', ring.join(' '));
}
