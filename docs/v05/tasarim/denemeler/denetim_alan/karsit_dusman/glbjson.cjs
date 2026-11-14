const fs = require('fs');
const f = process.argv[2];
const b = fs.readFileSync(f);
const jlen = b.readUInt32LE(12);
const json = JSON.parse(b.slice(20, 20 + jlen).toString('utf8'));
console.log(f, 'extUsed=', json.extensionsUsed, 'anims=', (json.animations||[]).length, 'nodes=', json.nodes.length);
for (const a of json.animations || []) {
  let maxT = 0;
  for (const s of a.samplers) { const acc = json.accessors[s.input]; if (acc.max) maxT = Math.max(maxT, acc.max[0]); }
  console.log('  ', a.name, 'dur=', maxT.toFixed(3), 'channels=', a.channels.length);
}
