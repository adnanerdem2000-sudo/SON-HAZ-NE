const G = await import('/home/user/SON-HAZ-NE-w2/js/world/geo.js');
const cx = 1900, cz = 7400;
for (const [n, x, z] of [['merkez', cx, cz], ['kuzey duvar', cx, cz - 30], ['kuyu', cx, cz - 48], ['kuyu+10', cx, cz - 58], ['kuyu-10', cx, cz - 38], ['kuyu dogu', cx + 10, cz - 48], ['kuyu bati', cx - 10, cz - 48]])
  console.log(n.padEnd(12), x, z, G.computeHeight(x, z).toFixed(2));
// Fener Kayası çevresi
for (let r = 0; r <= 12; r += 2) console.log('fener r', r, G.computeHeight(-1243 + r, -1950).toFixed(2), G.computeHeight(-1243, -1950 + r).toFixed(2));
