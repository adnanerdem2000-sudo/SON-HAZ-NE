import fs from 'node:fs';
for (const id of ['barbarian','knight','mage','rogue','rogue_hooded','sk_minion','sk_warrior']) {
  const b = fs.readFileSync(`/home/user/SON-HAZ-NE-w2/assets/models/kk/kk_${id}.glb`);
  const j = JSON.parse(b.slice(20, 20 + b.readUInt32LE(12)).toString('utf8'));
  const names = (j.nodes||[]).filter(n=>n.mesh!==undefined).map(n=>n.name + (n.skin!==undefined?'*':''));
  console.log(id, names.length, names.join(', '));
}
