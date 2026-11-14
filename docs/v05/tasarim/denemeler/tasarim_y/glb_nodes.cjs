// GLB JSON parçasından kök düğüm adlarını listeler (salt-okur)
const fs = require('fs');
for (const f of process.argv.slice(2)) {
  const b = fs.readFileSync(f);
  const len = b.readUInt32LE(12);
  const json = JSON.parse(b.slice(20, 20 + len).toString('utf8'));
  const scene = json.scenes[json.scene || 0];
  const roots = scene.nodes.map((i) => json.nodes[i].name);
  // kökler tek bir düğümse çocukları
  let names = roots;
  if (roots.length <= 2) { const n = json.nodes[scene.nodes[0]]; if (n.children) names = n.children.map((i) => json.nodes[i].name); }
  console.log('==', f.split('/').pop(), names.length);
  console.log(names.join(' '));
  if (json.animations) console.log('ANIMS', json.animations.length, json.animations.map(a=>a.name).join(' '));
}
