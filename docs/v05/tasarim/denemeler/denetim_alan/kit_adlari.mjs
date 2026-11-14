import { readFileSync } from 'node:fs';
const base = '/home/user/SON-HAZ-NE-w2/';
const kits = {};
for (const k of ['dungeon','graveyard','town','furniture','weapons']) {
  const buf = readFileSync(base + `assets/models/kk/kit_${k}.glb`);
  const len = buf.readUInt32LE(12); const json = JSON.parse(buf.slice(20, 20 + len).toString('utf8'));
  const scene = json.scenes[json.scene || 0];
  kits[k] = new Set(scene.nodes.map(i => json.nodes[i].name));
}
const src = ['js/world/islands.js','js/world/hazards.js','js/game/bosses.js','js/world/port.js'].map(f => [f, readFileSync(base + f, 'utf8')]);
const refs = new Map();
for (const [f, s] of src) {
  for (const m of s.matchAll(/kk:(\w+):([\w${}]+)/g)) refs.set(`${m[1]}:${m[2]}`, f);
  for (const m of s.matchAll(/(?:kk\.part|_kitMesh)\('(\w+)',\s*'(\w+)'/g)) refs.set(`${m[1]}:${m[2]}`, f);
}
// şablonlu adlar (`kk:town:${ring[i]}_${col}`) elle genişlet
const ring = ['tavern', 'market', 'home_A', 'blacksmith', 'home_B', 'church', 'barracks', 'lumbermill', 'windmill', 'tower_A', 'well', 'flag'];
for (const b of ring) for (const c of ['red','blue']) refs.set(`town:${b}_${c}`, 'js/world/islands.js(sablon)');
for (const b of ['destroyed', 'home_A_red', 'scaffolding', 'home_B_red', 'tavern_red', 'blacksmith_red']) refs.set(`town:${b}`, 'js/world/islands.js(ruinedTown)');
const missing = [];
for (const [r, f] of refs) { if (r.includes('$')) continue; const [k, n] = r.split(':'); if (!kits[k] || !kits[k].has(n)) missing.push(r + '  <- ' + f); }
console.log('referans', refs.size, 'eksik', missing.length); console.log(missing.join('\n'));
