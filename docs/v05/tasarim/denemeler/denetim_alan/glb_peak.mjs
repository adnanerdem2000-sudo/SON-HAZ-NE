// Meshopt sıkıştırmalı GLB animasyonunda kemik dönüşlerinin açısal hız tepe anı (vuruş karesi tahmini) — salt-okur
import fs from 'fs';
import { MeshoptDecoder } from '/home/user/SON-HAZ-NE-w2/vendor/three/addons/libs/meshopt_decoder.module.js';
const [file, ...clips] = process.argv.slice(2);
await MeshoptDecoder.ready;
const b = fs.readFileSync(file);
const jlen = b.readUInt32LE(12); const J = JSON.parse(b.slice(20, 20 + jlen).toString('utf8'));
const binLen = b.readUInt32LE(20 + jlen); const BIN = new Uint8Array(b.buffer, b.byteOffset + 20 + jlen + 8, binLen);
const views = new Map();
function view(i) {
  if (views.has(i)) return views.get(i);
  const bv = J.bufferViews[i]; const ext = bv.extensions?.EXT_meshopt_compression;
  let u8;
  if (ext) {
    const src = BIN.subarray(ext.byteOffset || 0, (ext.byteOffset || 0) + ext.byteLength);
    u8 = new Uint8Array(ext.count * ext.byteStride);
    MeshoptDecoder.decodeGltfBuffer(u8, ext.count, ext.byteStride, src, ext.mode, ext.filter || 'NONE');
  } else u8 = BIN.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength);
  views.set(i, u8); return u8;
}
function acc(i) {
  const a = J.accessors[i]; const n = { SCALAR: 1, VEC3: 3, VEC4: 4 }[a.type];
  const u8 = view(a.bufferView); const bv = J.bufferViews[a.bufferView];
  const stride = bv.extensions?.EXT_meshopt_compression?.byteStride || bv.byteStride || 0;
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const out = new Float32Array(a.count * n);
  const cs = { 5126: 4, 5122: 2, 5120: 1, 5123: 2, 5121: 1 }[a.componentType];
  const st = stride || n * cs;
  for (let k = 0; k < a.count; k++) for (let c = 0; c < n; c++) {
    const o = (a.byteOffset || 0) + k * st + c * cs;
    let v;
    switch (a.componentType) {
      case 5126: v = dv.getFloat32(o, true); break;
      case 5122: v = dv.getInt16(o, true); if (a.normalized) v = Math.max(v / 32767, -1); break;
      case 5120: v = dv.getInt8(o); if (a.normalized) v = Math.max(v / 127, -1); break;
      case 5123: v = dv.getUint16(o, true); if (a.normalized) v /= 65535; break;
      case 5121: v = dv.getUint8(o); if (a.normalized) v /= 255; break;
    }
    out[k * n + c] = v;
  }
  return out;
}
for (const clipName of clips) {
  const anim = J.animations.find((a) => a.name === clipName || a.name.endsWith('|' + clipName));
  if (!anim) { console.log('yok', clipName); continue; }
  const rows = [];
  for (const ch of anim.channels) {
    if (ch.target.path !== 'rotation') continue;
    const node = J.nodes[ch.target.node].name;
    const s = anim.samplers[ch.sampler]; const T = acc(s.input), Q = acc(s.output);
    let best = 0, bt = 0, total = 0;
    for (let k = 1; k < T.length; k++) {
      const q0 = [Q[(k-1)*4], Q[(k-1)*4+1], Q[(k-1)*4+2], Q[(k-1)*4+3]], q1 = [Q[k*4], Q[k*4+1], Q[k*4+2], Q[k*4+3]];
      const l0 = Math.hypot(...q0) || 1, l1 = Math.hypot(...q1) || 1;
      let dot = 0; for (let c = 0; c < 4; c++) dot += (q0[c] / l0) * (q1[c] / l1);
      const ang = 2 * Math.acos(Math.min(1, Math.abs(dot)));
      const w = ang / Math.max(1e-4, T[k] - T[k - 1]);
      total += ang; if (w > best) { best = w; bt = (T[k] + T[k - 1]) / 2; }
    }
    rows.push([node, +best.toFixed(1), +bt.toFixed(3), +total.toFixed(2)]);
  }
  rows.sort((a, b) => b[3] - a[3]);
  const end = Math.max(...anim.samplers.map((s) => J.accessors[s.input].max[0]));
  console.log(`${clipName} (klip ${end.toFixed(3)} s) — [kemik, tepe açısal hız, tepe anı s, toplam dönüş]`, JSON.stringify(rows.slice(0, 5)));
}
