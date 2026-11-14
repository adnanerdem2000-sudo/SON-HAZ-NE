const G = await import('/home/user/SON-HAZ-NE-w2/js/world/geo.js');
const cx = 7700, cz = -900, r = 540, a = 141 * Math.PI / 180;
for (const [f, fl] of [[0.64, 24], [0.56, 33], [0.47, 44], [0.40, 55], [0.33, 64], [0.26, 80], [0.20, 96], [0.16, 118]]) {
  const x = cx + Math.cos(a) * f * r, z = cz + Math.sin(a) * f * r; const h = G.computeHeight(x, z);
  console.log(`f=${f} (${Math.round(x)},${Math.round(z)}) taban=${fl} yüzey=${h.toFixed(1)} örtü(H=4.6)=${(h - fl - 4.6).toFixed(1)} merkezden=${Math.round(f * r)} m`);
}
