// Node testi: archipelago.js çıktısı v0.3 sabitiyle (tests/fixtures/archipelago_v03.json) karşılaştırılır.
// Kural: ada konum/şekil/tohum ve v0.3 özellikleri birebir; kazı noktaları, balık bölgeleri, boss alanları birebir;
// v0.3 batık/POI/düzlük kayıtları kimliğiyle aynı değerde bulunur (yeni kayıtlar eklenebilir).
// Çalıştırma: node tests/node/archipelago_sabit.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
const fx = JSON.parse(readFileSync(join(here, '..', 'fixtures', 'archipelago_v03.json'), 'utf8'));
const A = await import('../../js/world/archipelago.js');
const fails = [];
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// adalar
const isl = A.EXTRA_ISLANDS;
if (isl.length !== fx.islands.length) fails.push(`ada sayısı ${isl.length} != ${fx.islands.length}`);
for (const [k, I0] of fx.islands.entries()) {
  const I = isl[k];
  if (!I) { fails.push(`ada yok: ${I0.id}`); continue; }
  const cur = { id: I.id, x: I.x, z: I.z, r: I.r, h: I.h, shape: I.shape || null, seed: I.seed, hill: I.hill, coast: I.coast, biome: I.biome, region: I.region };
  const ref = { ...I0 }; delete ref.features;
  if (!eq(cur, ref)) fails.push(`ada farklı: ${I0.id}`);
  const old = I.features.filter((f) => !f.auto).map((f) => ({ id: f.id, type: f.type, x: f.x, z: f.z, dist: f.dist ?? null, angle: f.angle ?? null, r: f.r ?? null }));
  if (!eq(old, I0.features)) fails.push(`v0.3 özellikleri farklı: ${I0.id}`);
}
// birebir diziler
for (const [k, key] of [['digSites', 'EXTRA_DIG_SITES'], ['fishZones', 'EXTRA_FISH_ZONES'], ['bossSites', 'BOSS_SITES']]) {
  if (!eq(A[key], fx[k])) {
    const n = Math.max(A[key].length, fx[k].length); let d = 0; for (let i = 0; i < n; i++) if (!eq(A[key][i], fx[k][i])) d++;
    fails.push(`${key} farklı: ${d} kayıt (uzunluk ${A[key].length}/${fx[k].length})`);
  }
}
// kimlikle eşleşen diziler (yeni kayıt serbest)
const byId = (arr, keyFn) => new Map(arr.map((o) => [keyFn(o), o]));
const checks = [
  ['wrecks', 'EXTRA_WRECKS', (o) => o.id],
  ['pois', 'EXTRA_POIS', (o) => o.id],
  ['mods', 'EXTRA_MODS', (o) => `${o.type}:${o.x}:${o.z}`],
];
for (const [k, key, kf] of checks) {
  const cur = byId(A[key], kf); let missing = 0, diff = 0;
  for (const o of fx[k]) { const c = cur.get(kf(o)); if (!c) missing++; else if (!eq(c, o)) diff++; }
  if (missing || diff) fails.push(`${key}: v0.3 kayıtlarından ${missing} eksik, ${diff} farklı`);
}
const added = { wrecks: A.EXTRA_WRECKS.length - fx.wrecks.length, pois: A.EXTRA_POIS.length - fx.pois.length, mods: A.EXTRA_MODS.length - fx.mods.length };
console.log(fails.length ? 'KALDI' : 'GEÇTİ', JSON.stringify({ islands: isl.length, autoFeatures: isl.reduce((s, i) => s + i.features.filter((f) => f.auto).length, 0), added, fails }));
process.exit(fails.length ? 1 : 0);
