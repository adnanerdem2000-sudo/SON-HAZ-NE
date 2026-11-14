// props.js build() dağılımının Node kopyası (terrain.heightAt yerine analitik computeHeight) — salt sayım
import { computeHeight } from '/home/user/SON-HAZ-NE-w2/js/world/geo.js';
import { CORE_ISLANDS as ISLANDS, CORE_DIG_SITES as DIG_SITES } from '/home/user/SON-HAZ-NE-w2/js/world/worldData.js';
import { rng, noise2 } from '/home/user/SON-HAZ-NE-w2/js/core/util.js';
const H = (x,z)=>computeHeight(x,z);
const normalY = (x,z)=>{ const e=1.5; const hl=H(x-e,z), hr=H(x+e,z), hd=H(x,z-e), hu=H(x,z+e); const nx=hl-hr, ny=2*e, nz=hd-hu; return ny/Math.hypot(nx,ny,nz); };
function clearAt(x, z) {
  if (Math.hypot(x - 10, z - 222) < 92) return false;
  if (Math.hypot(x + 40, z + 228) < 38) return false;
  if (Math.hypot(x - 205, z + 30) < 18) return false;
  for (const d of DIG_SITES) if (Math.hypot(x - d.x, z - d.z) < 9) return false;
  return true;
}
for (const quality of ['high','medium','low']) {
const R = rng(4242);
const dens = quality === 'low' ? 0.45 : quality === 'medium' ? 0.75 : 1;
const L = { palms:[], trees:[], ferns:[], bushes:[], rocks:[], rocksTall:[], grass:[], flowers:[], dead:[], stumps:[], mush:[] };
for (const I of ISLANDS) {
  const ghost = I.biome === 'hayalet';
  const count = Math.floor((I.r * I.r) / 8 * dens);
  for (let i = 0; i < count; i++) {
    const a = R() * Math.PI * 2, rr = Math.sqrt(R()) * I.r * 1.2;
    const x = I.x + Math.cos(a) * rr, z = I.z + Math.sin(a) * rr;
    const h = H(x, z);
    if (h < 0.9) continue;
    if (!clearAt(x, z)) continue;
    const ny = normalY(x, z);
    const n = noise2(x / 60 + I.seed, z / 60);
    const t = R();
    const tag = {x,z,isl:I.id};
    if (ghost) {
      if (t < 0.03 && ny > 0.8) { L.dead.push(tag); R(); R(); }
      else if (t < 0.05) { L.rocks.push(tag); R(); R(); }
      else if (t < 0.07) { L.stumps.push(tag); R(); R(); }
      else if (t < 0.09) { L.mush.push(tag); R(); R(); }
      else if (t < 0.2 && ny > 0.85) { L.grass.push(tag); R(); R(); R(); }
      continue;
    }
    if (h < 3.4) {
      if (t < 0.07) { L.palms.push(tag); R();R();R();R(); }
      else if (t < 0.085) { L.rocks.push(tag); R();R(); }
      continue;
    }
    if (ny < 0.72) {
      if (t < 0.08) { L.rocks.push(tag); R();R(); }
      else if (t < 0.09) { L.rocksTall.push(tag); R();R(); }
      continue;
    }
    const jungle = n > -0.15 && h > 5;
    if (jungle) {
      if (t < 0.16) { L.trees.push(tag); R();R();R(); }
      else if (t < 0.2) { L.palms.push(tag); R();R();R();R(); }
      else if (t < 0.36) { L.ferns.push(tag); R();R(); }
      else if (t < 0.44) { L.bushes.push(tag); R();R(); }
      else if (t < 0.52) { L.grass.push(tag); R();R(); }
      else if (t < 0.535) { L.flowers.push(tag); R();R(); }
    } else {
      if (t < 0.04) { L.palms.push(tag); R();R();R();R(); }
      else if (t < 0.065) { L.trees.push(tag); R();R(); }
      else if (t < 0.1) { L.bushes.push(tag); R();R(); }
      else if (t < 0.2) { L.grass.push(tag); R();R(); }
      else if (t < 0.215) { L.flowers.push(tag); R();R(); }
      else if (t < 0.225) { L.rocks.push(tag); R();R(); }
    }
  }
}
const out = {};
for (const k in L) { out[k] = L[k].length; }
// limana (10,222) uzaklık dağılımı
const near = {}; for (const k in L) { near[k] = [L[k].filter(o=>Math.hypot(o.x-10,o.z-222)<300).length, L[k].filter(o=>Math.hypot(o.x-10,o.z-222)<850).length]; }
console.log(quality, JSON.stringify(out), 'toplam', Object.values(out).reduce((a,b)=>a+b,0));
if (quality==='high') console.log('liman <300m / <850m:', JSON.stringify(near));
}
