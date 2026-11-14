// Salt-okur: GLB JSON parçasındaki kök düğüm adlarını listeler
const fs = require('fs');
for (const f of process.argv.slice(2)) {
  const b = fs.readFileSync(f);
  const len = b.readUInt32LE(12);
  const j = JSON.parse(b.slice(20, 20 + len).toString('utf8'));
  const scene = j.scenes[j.scene || 0];
  const roots = scene.nodes.map((i) => j.nodes[i].name);
  // KayKit kitleri: kök tek düğüm olabilir; çocukları listele
  let names = roots;
  if (roots.length < 3) { const r = j.nodes[scene.nodes[0]]; names = (r.children || []).map((i) => j.nodes[i].name); }
  console.log('==', f.split('/').pop(), names.length);
  console.log(names.join(' '));
}
