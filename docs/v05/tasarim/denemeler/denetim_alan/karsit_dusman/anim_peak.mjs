// Bağımsız ölçüm: GLB animasyon kliplerinde kol/el kemiklerinin açısal hız tepesi (klip zamanı) — meshopt çözülerek
import fs from 'fs';
import { MeshoptDecoder } from '/home/user/SON-HAZ-NE-w2/vendor/three/addons/libs/meshopt_decoder.module.js';
await MeshoptDecoder.ready;
const f = process.argv[2];
const clipsWanted = process.argv.slice(3);
const b = fs.readFileSync(f);
const jlen = b.readUInt32LE(12);
const json = JSON.parse(b.slice(20, 20 + jlen).toString('utf8'));
const binStart = 20 + jlen + 8;
const bin = b.slice(binStart);
const views = json.bufferViews.map((bv, i) => {
  const ext = bv.extensions?.EXT_meshopt_compression;
  if (ext) {
    const src = new Uint8Array(bin.buffer, bin.byteOffset + (ext.byteOffset || 0), ext.byteLength);
    const out = new Uint8Array(ext.count * ext.byteStride);
    MeshoptDecoder.decodeGltfBuffer(out, ext.count, ext.byteStride, src, ext.mode, ext.filter || 'NONE');
    return { data: out, stride: ext.byteStride };
  }
  if (bv.buffer === 0 && json.buffers[0].uri === undefined) return { data: new Uint8Array(bin.buffer, bin.byteOffset + (bv.byteOffset || 0), bv.byteLength), stride: bv.byteStride };
  return null;
});
const CT = { 5120: [Int8Array, 1, 127], 5121: [Uint8Array, 1, 255], 5122: [Int16Array, 2, 32767], 5123: [Uint16Array, 2, 65535], 5126: [Float32Array, 4, 1] };
const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
function readAcc(i) {
  const a = json.accessors[i]; const v = views[a.bufferView]; const [T, sz, nm] = CT[a.componentType]; const nc = NC[a.type];
  const stride = v.stride || sz * nc; const dv = new DataView(v.data.buffer, v.data.byteOffset + (a.byteOffset || 0));
  const out = [];
  for (let k = 0; k < a.count; k++) { const row = []; for (let c = 0; c < nc; c++) { const off = k * stride + c * sz; let x;
    if (a.componentType === 5126) x = dv.getFloat32(off, true); else if (a.componentType === 5122) x = dv.getInt16(off, true); else if (a.componentType === 5123) x = dv.getUint16(off, true); else if (a.componentType === 5120) x = dv.getInt8(off); else x = dv.getUint8(off);
    if (a.normalized) x = a.componentType === 5122 || a.componentType === 5120 ? Math.max(x / nm, -1) : x / nm; row.push(x); } out.push(row); }
  return out;
}
const angle = (q1, q2) => { let d = Math.abs(q1[0]*q2[0]+q1[1]*q2[1]+q1[2]*q2[2]+q1[3]*q2[3]); const n1=Math.hypot(...q1), n2=Math.hypot(...q2); d = Math.min(1, d/(n1*n2)); return 2*Math.acos(d); };
for (const a of json.animations) {
  const short = a.name.split('|').pop();
  if (clipsWanted.length && !clipsWanted.includes(short)) continue;
  const rows = [];
  let dur = 0;
  for (const ch of a.channels) {
    if (ch.target.path !== 'rotation') continue;
    const node = json.nodes[ch.target.node].name;
    if (!/arm|hand|fist|shoulder|leg|foot|hips|body|torso|spine|chest|abdomen/i.test(node)) continue;
    const s = a.samplers[ch.sampler]; const t = readAcc(s.input).map((r) => r[0]); const q = readAcc(s.output);
    dur = Math.max(dur, t[t.length - 1]);
    let best = 0, bt = 0;
    for (let k = 1; k < t.length; k++) { const w = angle(q[k - 1], q[k]) / Math.max(1e-4, t[k] - t[k - 1]); if (w > best) { best = w; bt = (t[k] + t[k - 1]) / 2; } }
    rows.push({ node, peakT: +bt.toFixed(3), peakW: +best.toFixed(1), keys: t.length });
  }
  rows.sort((x, y) => y.peakW - x.peakW);
  console.log(`${short} dur=${dur.toFixed(3)}`); for (const r of rows.slice(0, 6)) console.log('   ', JSON.stringify(r));
}
