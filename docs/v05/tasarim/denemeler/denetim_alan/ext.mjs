import fs from 'fs';
for (const f of process.argv.slice(2)) {
  const buf = fs.readFileSync(f);
  const json = JSON.parse(buf.slice(20, 20 + buf.readUInt32LE(12)).toString('utf8'));
  console.log(f.split('/').pop(), 'ext:', json.extensionsUsed, 'req:', json.extensionsRequired, 'images:', (json.images||[]).length, 'meshes:', (json.meshes||[]).length);
}
