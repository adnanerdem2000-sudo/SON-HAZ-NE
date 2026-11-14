const W = await import('/home/user/SON-HAZ-NE-w2/js/world/worldData.js');
const big = { port: 60, prison: 32, temple: 34, fort: 22, mine: 22, ruined_town: 40, market: 14, graveyard: 25, ruin: 14, camp: 14, lighthouse: 5, beach_wreck: 10 };
const out = [];
for (const s of W.DIG_SITES) {
  const I = W.ISLANDS.find(i => i.id === s.island);
  for (const f of I.features || []) {
    if (f.x === undefined || !big[f.type]) continue;
    const d = Math.hypot(s.x - f.x, s.z - f.z);
    if (d < big[f.type]) out.push([s.id, f.type, +d.toFixed(1), f.type === 'temple' ? [+(s.x - f.x).toFixed(1), +(s.z - f.z).toFixed(1)] : '']);
  }
}
console.log(out.length, JSON.stringify(out));
