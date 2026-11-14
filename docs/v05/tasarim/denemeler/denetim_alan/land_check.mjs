// rectMayHaveLand yanlış negatif taraması: "kara yok" denen karoda su üstü/sığ zemin var mı?
const ROOT = process.argv[2];
const geo = await import(ROOT + '/js/world/geo.js');
const { WORLD_SIZE } = await import(ROOT + '/js/world/worldData.js');
const TILE = 160, HALF = WORLD_SIZE / 2, NT = WORLD_SIZE / TILE, S = 8;
let falseNeg = [], landTiles = 0, checked = 0;
const t0 = Date.now();
for (let i = 0; i < NT; i++) for (let j = 0; j < NT; j++) {
  const x0 = -HALF + i * TILE, z0 = -HALF + j * TILE;
  const may = geo.rectMayHaveLand(x0, z0, x0 + TILE, z0 + TILE);
  if (may) { landTiles++; continue; }
  checked++;
  let mx = -1e9, at = null;
  for (let a = 0; a <= TILE; a += S) for (let b = 0; b <= TILE; b += S) { const h = geo.computeHeight(x0 + a, z0 + b); if (h > mx) { mx = h; at = [x0 + a, z0 + b]; } }
  if (mx > -3) falseNeg.push({ i, j, maxH: +mx.toFixed(2), at });
}
console.log(JSON.stringify({ ms: Date.now() - t0, landTiles, seaTilesChecked: checked, falseNegatives_maxH_gt_minus3: falseNeg.length, aboveWater: falseNeg.filter(f => f.maxH > 0).length, sample: falseNeg.sort((a, b) => b.maxH - a.maxH).slice(0, 8) }, null, 1));
