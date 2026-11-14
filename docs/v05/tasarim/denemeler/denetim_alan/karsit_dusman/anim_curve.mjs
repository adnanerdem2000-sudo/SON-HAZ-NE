import fs from 'fs';
import { MeshoptDecoder } from '/home/user/SON-HAZ-NE-w2/vendor/three/addons/libs/meshopt_decoder.module.js';
await MeshoptDecoder.ready;
const [f, clip, ...bones] = process.argv.slice(2);
const b = fs.readFileSync(f); const jlen = b.readUInt32LE(12); const json = JSON.parse(b.slice(20, 20 + jlen).toString('utf8')); const bin = b.slice(20 + jlen + 8);
const views = json.bufferViews.map((bv) => { const ext = bv.extensions?.EXT_meshopt_compression; if (ext) { const src = new Uint8Array(bin.buffer, bin.byteOffset + (ext.byteOffset || 0), ext.byteLength); const out = new Uint8Array(ext.count * ext.byteStride); MeshoptDecoder.decodeGltfBuffer(out, ext.count, ext.byteStride, src, ext.mode, ext.filter || 'NONE'); return { data: out, stride: ext.byteStride }; } return { data: new Uint8Array(bin.buffer, bin.byteOffset + (bv.byteOffset || 0), bv.byteLength), stride: bv.byteStride }; });
const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }; const SZ = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5126: 4 };
function readAcc(i) { const a = json.accessors[i]; const v = views[a.bufferView]; const sz = SZ[a.componentType], nc = NC[a.type]; const stride = v.stride || sz * nc; const dv = new DataView(v.data.buffer, v.data.byteOffset + (a.byteOffset || 0)); const out = [];
  for (let k = 0; k < a.count; k++) { const row = []; for (let c = 0; c < nc; c++) { const off = k * stride + c * sz; let x = a.componentType === 5126 ? dv.getFloat32(off, true) : a.componentType === 5122 ? dv.getInt16(off, true) : a.componentType === 5123 ? dv.getUint16(off, true) : a.componentType === 5120 ? dv.getInt8(off) : dv.getUint8(off);
    if (a.normalized) x = a.componentType === 5122 ? Math.max(x / 32767, -1) : a.componentType === 5120 ? Math.max(x / 127, -1) : a.componentType === 5123 ? x / 65535 : x / 255; row.push(x); } out.push(row); } return out; }
const ang = (q1, q2) => { const n1 = Math.hypot(...q1), n2 = Math.hypot(...q2); return 2 * Math.acos(Math.min(1, Math.abs(q1[0]*q2[0]+q1[1]*q2[1]+q1[2]*q2[2]+q1[3]*q2[3]) / (n1 * n2))) * 180 / Math.PI; };
const a = json.animations.find((x) => x.name.split('|').pop() === clip);
for (const ch of a.channels) { if (ch.target.path !== 'rotation') continue; const node = json.nodes[ch.target.node].name; if (!bones.includes(node)) continue;
  const s = a.samplers[ch.sampler]; const t = readAcc(s.input).map((r) => r[0]); const q = readAcc(s.output);
  console.log(clip, node, t.map((tt, k) => `${tt.toFixed(3)}:${ang(q[0], q[k]).toFixed(0)}`).join(' ')); }
