// GLB JSON bölümünden üçgen ve primitive (çizim çağrısı) sayısı — salt okuma
import fs from 'node:fs';
const dir = process.argv[2];
const names = process.argv.slice(3);
for (const n of names) {
  const f = `${dir}/${n}.glb`;
  if (!fs.existsSync(f)) { console.log(n, 'YOK'); continue; }
  const b = fs.readFileSync(f);
  const jsonLen = b.readUInt32LE(12);
  const j = JSON.parse(b.slice(20, 20 + jsonLen).toString('utf8'));
  let tris = 0, prims = 0, mats = new Set();
  // sahnede düğümlerle kullanılan örgüler (aynı örgü birden çok düğümde olabilir)
  const useCount = new Map();
  for (const node of j.nodes || []) if (node.mesh !== undefined) useCount.set(node.mesh, (useCount.get(node.mesh) || 0) + 1);
  for (const [mi, c] of useCount) {
    for (const p of j.meshes[mi].primitives) {
      prims += c;
      mats.add(p.material);
      const cnt = p.indices !== undefined ? j.accessors[p.indices].count : j.accessors[p.attributes.POSITION].count;
      tris += (cnt / 3) * c;
    }
  }
  const skinned = (j.skins || []).length;
  console.log(n.padEnd(16), 'üçgen', String(Math.round(tris)).padStart(6), 'primitive', prims, 'malzeme', mats.size, skinned ? 'iskeletli' : '', 'boyut', (b.length/1024).toFixed(0)+'KB');
}
