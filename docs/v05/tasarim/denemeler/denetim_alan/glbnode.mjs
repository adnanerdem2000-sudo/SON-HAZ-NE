import fs from 'fs';
const [,, file, ...names] = process.argv;
const buf = fs.readFileSync(file);
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString('utf8'));
const nodes = json.nodes;
function boxOfMesh(mi) {
  const m = json.meshes[mi];
  let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const p of m.primitives) {
    const acc = json.accessors[p.attributes.POSITION];
    for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], acc.min[k]); max[k] = Math.max(max[k], acc.max[k]); }
  }
  return { min, max };
}
for (const n of names) {
  const idx = nodes.findIndex((x) => x.name === n);
  if (idx < 0) { console.log(n, 'YOK'); continue; }
  const node = nodes[idx];
  console.log(n, 'node', JSON.stringify({ t: node.translation, r: node.rotation, s: node.scale, mesh: node.mesh, children: node.children }));
  if (node.mesh !== undefined) console.log('  box', JSON.stringify(boxOfMesh(node.mesh)));
  for (const c of node.children || []) { const cn = nodes[c]; console.log('  child', cn.name, JSON.stringify({ t: cn.translation, s: cn.scale, mesh: cn.mesh })); if (cn.mesh !== undefined) console.log('    box', JSON.stringify(boxOfMesh(cn.mesh))); }
}
