// Bir klipteki kemik dönüş izlerinden en hızlı açısal değişim anını bulur (vuruş karesi tahmini) — salt-okur
const fs = require('fs');
const [file, clipName, filt] = process.argv.slice(2);
const b = fs.readFileSync(file);
const jlen = b.readUInt32LE(12); const J = JSON.parse(b.slice(20, 20 + jlen).toString('utf8'));
const binOff = 20 + jlen + 8; const BIN = b.slice(binOff);
function acc(i) {
  const a = J.accessors[i], bv = J.bufferViews[a.bufferView];
  const n = { SCALAR: 1, VEC3: 3, VEC4: 4 }[a.type];
  const off = (bv.byteOffset || 0) + (a.byteOffset || 0);
  const out = new Float32Array(a.count * n);
  const stride = bv.byteStride || n * 4;
  for (let k = 0; k < a.count; k++) for (let c = 0; c < n; c++) out[k * n + c] = BIN.readFloatLE(off + k * stride + c * 4);
  return { data: out, n, count: a.count };
}
const anim = J.animations.find((a) => a.name === clipName || a.name.endsWith('|' + clipName));
const res = [];
for (const ch of anim.channels) {
  if (ch.target.path !== 'rotation') continue;
  const node = J.nodes[ch.target.node].name;
  if (filt && !new RegExp(filt, 'i').test(node)) continue;
  const s = anim.samplers[ch.sampler]; const T = acc(s.input).data, Q = acc(s.output).data;
  let best = 0, bt = 0, total = 0;
  for (let k = 1; k < T.length; k++) {
    let dot = 0; for (let c = 0; c < 4; c++) dot += Q[k * 4 + c] * Q[(k - 1) * 4 + c];
    const ang = 2 * Math.acos(Math.min(1, Math.abs(dot)));
    const w = ang / Math.max(1e-4, T[k] - T[k - 1]);
    total += ang;
    if (w > best) { best = w; bt = (T[k] + T[k - 1]) / 2; }
  }
  res.push([node, +best.toFixed(2), +bt.toFixed(3), +total.toFixed(2), +T[T.length - 1].toFixed(3)]);
}
res.sort((a, b) => b[3] - a[3]);
console.log(clipName, 'en çok dönen kemikler [ad, tepe açısal hız rad/s, tepe anı s, toplam dönüş rad, klip sonu s]:');
console.log(JSON.stringify(res.slice(0, 6)));
