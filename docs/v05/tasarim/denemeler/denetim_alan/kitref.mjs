import fs from 'fs';
const src = ['js/world/islands.js', 'js/world/hazards.js', 'js/world/port.js', 'js/world/props.js', 'js/world/cave.js'].map(f => { try { return fs.readFileSync('/home/user/SON-HAZ-NE-w2/' + f, 'utf8'); } catch { return ''; } }).join('\n');
const refs = new Set();
for (const m of src.matchAll(/kk:(dungeon|graveyard|town|furniture|weapons):([A-Za-z0-9_]+)/g)) refs.add(m[1] + ':' + m[2]);
// template refs like `kk:town:${ring[i]}_${col}` -> expand
const ring = ['tavern', 'market', 'home_A', 'blacksmith', 'home_B', 'church', 'barracks', 'lumbermill', 'windmill', 'tower_A', 'well', 'flag'];
for (const r of ring) for (const c of ['red', 'blue']) refs.add('town:' + r + '_' + c);
for (const b of ['destroyed', 'home_A_red', 'scaffolding', 'home_B_red', 'tavern_red', 'blacksmith_red']) refs.add('town:' + b);
for (const m of src.matchAll(/kk\.part\('(\w+)',\s*'([A-Za-z0-9_]+)'\)/g)) refs.add(m[1] + ':' + m[2]);
for (const m of src.matchAll(/_kitMesh\('(\w+)',\s*'([A-Za-z0-9_]+)'/g)) refs.add(m[1] + ':' + m[2]);
for (const n of ['box_large', 'box_small', 'box_stacked']) refs.add('dungeon:' + n);
const names = {};
for (const kit of ['dungeon', 'graveyard', 'town', 'furniture', 'weapons']) {
  const buf = fs.readFileSync(`/home/user/SON-HAZ-NE-w2/assets/models/kk/kit_${kit}.glb`);
  const len = buf.readUInt32LE(12); const j = JSON.parse(buf.slice(20, 20 + len).toString());
  names[kit] = new Set(j.nodes.map(n => n.name));
}
const missing = [...refs].filter(r => { const [k, n] = r.split(':'); return !names[k]?.has(n); });
console.log('başvuru', refs.size, 'eksik', missing.length, JSON.stringify(missing));
