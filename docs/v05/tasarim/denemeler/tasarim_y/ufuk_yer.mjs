// Salt-okur: Yitik Ufuk için aday merkez (r=300, perde yarıçapı 950 m); tüm adaların etki alanından (r*2.6) uzak
const W = await import('/home/user/SON-HAZ-NE-w2/js/world/worldData.js');
const A = await import('/home/user/SON-HAZ-NE-w2/js/world/archipelago.js');
const R = 300, REACH = R * 2.6, PERDE = 950;
const isl = W.ISLANDS;
const best = [];
for (let x = -9000; x <= 9000; x += 50) for (let z = -9000; z <= 9000; z += 50) {
  if (Math.abs(x) + 0 > 9300 - R || Math.abs(z) > 9300 - R) continue;
  let minReach = Infinity, minPerde = Infinity, who = null;
  for (const I of isl) {
    const d = Math.hypot(x - I.x, z - I.z);
    const reachI = I.r * 2.6 * Math.max(I.ex || 1, I.ez || 1);
    const a = d - reachI - REACH; // >0: etki alanları kesişmiyor
    const b = d - I.r * 1.3 - PERDE; // >0: perde halkası başka adanın kıyısına (1,3r) değmiyor
    if (a < minReach) { minReach = a; who = I.id; }
    if (b < minPerde) minPerde = b;
  }
  const mods = W.TERRAIN_MODS.some((M) => Math.hypot(x - M.x, z - M.z) < M.r + M.blend + REACH);
  if (minReach > 100 && minPerde > 100 && !mods) best.push({ x, z, reg: A.regionAt(x, z), minReach: Math.round(minReach), minPerde: Math.round(minPerde), who });
}
const byReg = {};
for (const b of best) (byReg[b.reg] ||= []).push(b);
for (const [reg, list] of Object.entries(byReg)) {
  list.sort((a, b) => b.minReach - a.minReach);
  console.log(reg, list.length, JSON.stringify(list.slice(0, 4)));
}
// özel adaylar
for (const [x, z] of [[4700, 8900], [4600, 8700], [5200, 8500], [4300, 8800], [-4800, 8800], [8800, -5600], [8800, 3600]]) {
  let m = Infinity, w = null; for (const I of isl) { const d = Math.hypot(x - I.x, z - I.z) - I.r * 2.6 * Math.max(I.ex || 1, I.ez || 1) - REACH; if (d < m) { m = d; w = I.id; } }
  console.log('aday', x, z, A.regionAt(x, z), 'payı', Math.round(m), w);
}
