// Karşıt denetim (A): rectMayHaveLand=false olan karolarda (derin deniz sayılanlar) gerçek yükseklik denetimi.
const ROOT = process.env.DK_ROOT;
const { computeHeight, rectMayHaveLand } = await import(ROOT + '/js/world/geo.js');
const { WORLD_SIZE } = await import(ROOT + '/js/world/worldData.js');
const TILE = 160, HALF = WORLD_SIZE / 2, NT = WORLD_SIZE / TILE;
let sea = 0, fnAbove0 = 0, fnAboveM5 = 0, worst = -1e9, worstAt = null;
const S = 16;
for (let i = 0; i < NT; i++) for (let j = 0; j < NT; j++) {
  const x0 = -HALF + i * TILE, z0 = -HALF + j * TILE;
  if (rectMayHaveLand(x0, z0, x0 + TILE, z0 + TILE)) continue;
  sea++;
  let mx = -1e9;
  for (let a = 0; a <= S; a++) for (let b = 0; b <= S; b++) { const h = computeHeight(x0 + a * TILE / S, z0 + b * TILE / S); if (h > mx) mx = h; }
  if (mx > 0) fnAbove0++;
  if (mx > -5) fnAboveM5++;
  if (mx > worst) { worst = mx; worstAt = [i, j, x0, z0]; }
}
console.log(JSON.stringify({ tilesTotal: NT * NT, seaTiles: sea, falseNeg_hAbove0: fnAbove0, seaTiles_hAboveMinus5: fnAboveM5, worstMaxH: +worst.toFixed(2), worstAt }));
process.exit(0);
