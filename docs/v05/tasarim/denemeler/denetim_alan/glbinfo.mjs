import fs from 'fs';
const f = process.argv[2];
const buf = fs.readFileSync(f);
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString('utf8'));
const out = [];
for (const a of json.animations || []) {
  let dur = 0;
  for (const s of a.samplers) { const acc = json.accessors[s.input]; if (acc.max) dur = Math.max(dur, acc.max[0]); }
  out.push(a.name + ':' + dur.toFixed(3));
}
console.log(out.length, 'clips');
console.log(out.join('\n'));
console.log('nodes:', (json.nodes||[]).length, 'skins:', (json.skins||[]).length);
