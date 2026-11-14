// GLB animasyon süreleri (salt-okur): JSON parçasındaki erişimci max değerleri
const fs = require('fs');
function anims(file) {
  const b = fs.readFileSync(file);
  const len = b.readUInt32LE(12); const json = JSON.parse(b.slice(20, 20 + len).toString('utf8'));
  return (json.animations || []).map((a) => { let mx = 0; for (const s of a.samplers) { const acc = json.accessors[s.input]; if (acc.max) mx = Math.max(mx, acc.max[0]); } return [a.name, +mx.toFixed(3)]; });
}
const f = process.argv[2]; const want = process.argv.slice(3);
const A = anims(f);
if (want.length) console.log(JSON.stringify(A.filter(([n]) => want.some((w) => n === w || n.endsWith('|' + w) || n.includes(w))), null, 0));
else console.log(JSON.stringify(A));
