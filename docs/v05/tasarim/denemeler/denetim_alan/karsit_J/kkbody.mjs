import fs from 'node:fs';
for (const id of ['barbarian','knight','mage','rogue','rogue_hooded','sk_minion','sk_warrior']) {
  const b = fs.readFileSync(`/home/user/SON-HAZ-NE-w2/assets/models/kk/kk_${id}.glb`);
  const j = JSON.parse(b.slice(20, 20 + b.readUInt32LE(12)).toString('utf8'));
  let skTris=0, skPrims=0, other={};
  for (const n of j.nodes||[]) {
    if (n.mesh===undefined) continue;
    let t=0, p=0;
    for (const pr of j.meshes[n.mesh].primitives) { p++; const cnt = pr.indices!==undefined? j.accessors[pr.indices].count : j.accessors[pr.attributes.POSITION].count; t+=cnt/3; }
    if (n.skin!==undefined) { skTris+=t; skPrims+=p; } else other[n.name]=[t,p];
  }
  console.log(id, 'skinned tris', skTris, 'prims', skPrims, JSON.stringify(other));
}
