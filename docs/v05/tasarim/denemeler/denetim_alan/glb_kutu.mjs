import { readFileSync } from 'node:fs';
const buf = readFileSync('/home/user/SON-HAZ-NE-w2/assets/models/kk/kit_' + process.argv[2] + '.glb');
const len = buf.readUInt32LE(12); const J = JSON.parse(buf.slice(20, 20 + len).toString('utf8'));
const names = process.argv.slice(3);
function box(ni, M) {
  const n = J.nodes[ni]; const s = n.scale || [1,1,1], t = n.translation || [0,0,0];
  // yalnız ölçek+öteleme (döndürme varsa yaklaşık)
  const m = { s: [M.s[0]*s[0], M.s[1]*s[1], M.s[2]*s[2]], t: [M.t[0] + M.s[0]*t[0], M.t[1] + M.s[1]*t[1], M.t[2] + M.s[2]*t[2]], rot: M.rot || !!n.rotation };
  let mn = [Infinity,Infinity,Infinity], mx = [-Infinity,-Infinity,-Infinity];
  if (n.mesh !== undefined) for (const p of J.meshes[n.mesh].primitives) { const a = J.accessors[p.attributes.POSITION]; const q = a.normalized ? (a.componentType === 5122 ? 32767 : a.componentType === 5120 ? 127 : a.componentType === 5123 ? 65535 : 255) : 1; for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], m.t[k] + m.s[k]*a.min[k]/q); mx[k] = Math.max(mx[k], m.t[k] + m.s[k]*a.max[k]/q); } }
  for (const c of n.children || []) { const b = box(c, m); for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], b.mn[k]); mx[k] = Math.max(mx[k], b.mx[k]); } }
  return { mn, mx, rot: m.rot };
}
const scene = J.scenes[J.scene || 0];
for (const ni of scene.nodes) { const n = J.nodes[ni]; if (names.length && !names.includes(n.name)) continue; const b = box(ni, { s: [1,1,1], t: [0,0,0] }); console.log(n.name, 'min', b.mn.map(v=>v.toFixed(2)).join(','), 'max', b.mx.map(v=>v.toFixed(2)).join(','), b.rot ? '(dondurme var)' : ''); }
