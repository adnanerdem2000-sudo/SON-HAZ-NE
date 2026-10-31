// Arazi işçisi: karo geometrisi (konum/normal/renk + yüksek çözünürlüklü yükseklik ızgarası),
// okyanus derinlik penceresi ve harita ızgaraları ana iş parçacığını yormadan burada üretilir.
import { computeHeight, colorSRGB, srgbToLinear, toHalf, biomeAt } from './geo.js';

const BIOME_ID = { deniz: 0, tropik: 1, cangil: 2, hayalet: 3, buzul: 4, volkan: 5, col: 6 };
const SKIRT = 4;

function tile(m) {
  const { x0, z0, size, seg, hires } = m;
  const n = seg + 1;
  const step = size / seg;
  const W = n + 2;
  // kenarlarda bir örnek taşma: normaller komşu karolarla aynı olsun
  const H = new Float32Array(W * W);
  let maxH = -1e9, minH = 1e9;
  for (let j = -1; j <= n; j++) for (let i = -1; i <= n; i++) {
    const h = computeHeight(x0 + i * step, z0 + j * step);
    H[(j + 1) * W + (i + 1)] = h;
    if (i >= 0 && j >= 0 && i < n && j < n) { if (h > maxH) maxH = h; if (h < minH) minH = h; }
  }
  // ana ızgara + etek (çatlakları gizleyen dikey şerit)
  const ring = 4 * seg;
  const verts = n * n + ring;
  const pos = new Float32Array(verts * 3), nor = new Float32Array(verts * 3), col = new Float32Array(verts * 3);
  const c = [0, 0, 0];
  let k = 0;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const h = H[(j + 1) * W + (i + 1)];
    const hl = H[(j + 1) * W + i], hr = H[(j + 1) * W + i + 2], hd = H[j * W + i + 1], hu = H[(j + 2) * W + i + 1];
    let nx = hl - hr, ny = 2 * step, nz = hd - hu;
    const L = Math.hypot(nx, ny, nz) || 1;
    nx /= L; ny /= L; nz /= L;
    const x = x0 + i * step, z = z0 + j * step;
    pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z;
    nor[k * 3] = nx; nor[k * 3 + 1] = ny; nor[k * 3 + 2] = nz;
    colorSRGB(x, z, h, ny, c);
    col[k * 3] = srgbToLinear(c[0]); col[k * 3 + 1] = srgbToLinear(c[1]); col[k * 3 + 2] = srgbToLinear(c[2]);
    k++;
  }
  // etek: kenar köşelerini sırayla dolaş (saat yönünde), her biri SKIRT metre aşağıda kopya
  const edge = [];
  for (let i = 0; i < seg; i++) edge.push(i);                       // üst kenar (j=0)
  for (let j = 0; j < seg; j++) edge.push(j * n + seg);             // sağ (i=seg)
  for (let i = seg; i > 0; i--) edge.push(seg * n + i);             // alt (j=seg)
  for (let j = seg; j > 0; j--) edge.push(j * n);                   // sol (i=0)
  const base = n * n;
  for (let e = 0; e < ring; e++) {
    const s = edge[e];
    pos[(base + e) * 3] = pos[s * 3]; pos[(base + e) * 3 + 1] = pos[s * 3 + 1] - SKIRT; pos[(base + e) * 3 + 2] = pos[s * 3 + 2];
    nor[(base + e) * 3] = nor[s * 3]; nor[(base + e) * 3 + 1] = nor[s * 3 + 1]; nor[(base + e) * 3 + 2] = nor[s * 3 + 2];
    col[(base + e) * 3] = col[s * 3] * 0.8; col[(base + e) * 3 + 1] = col[s * 3 + 1] * 0.8; col[(base + e) * 3 + 2] = col[s * 3 + 2] * 0.8;
  }
  const tri = seg * seg * 6 + ring * 6;
  const idx = verts > 65535 ? new Uint32Array(tri) : new Uint16Array(tri);
  let q = 0;
  for (let j = 0; j < seg; j++) for (let i = 0; i < seg; i++) {
    const a = j * n + i, b = a + 1, d = a + n, e = d + 1;
    idx[q++] = a; idx[q++] = d; idx[q++] = b;
    idx[q++] = b; idx[q++] = d; idx[q++] = e;
  }
  for (let e = 0; e < ring; e++) {
    const a = edge[e], b = edge[(e + 1) % ring], a2 = base + e, b2 = base + (e + 1) % ring;
    // dışa bakan yüzler (iki yönlü malzeme gerekmez: etek her iki yönden çizilsin diye çift üçgen)
    idx[q++] = a; idx[q++] = b; idx[q++] = a2;
    idx[q++] = b; idx[q++] = b2; idx[q++] = a2;
  }
  let heights = null;
  if (hires) {
    heights = new Float32Array(n * n);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) heights[j * n + i] = H[(j + 1) * W + (i + 1)];
  }
  const out = { t: 'tile', id: m.id, key: m.key, seg, pos, nor, col, idx, heights, maxH, minH };
  const tr = [pos.buffer, nor.buffer, col.buffer, idx.buffer];
  if (heights) tr.push(heights.buffer);
  self.postMessage(out, tr);
}

// okyanus için yükseklik penceresi (yarım duyarlıklı)
function depth(m) {
  const { x0, z0, size, res } = m;
  const data = new Uint16Array(res * res);
  for (let j = 0; j < res; j++) for (let i = 0; i < res; i++) {
    data[j * res + i] = toHalf(computeHeight(x0 + (i + 0.5) / res * size, z0 + (j + 0.5) / res * size));
  }
  self.postMessage({ t: 'depth', id: m.id, x0, z0, size, res, data }, [data.buffer]);
}

// harita ızgarası: yükseklik + biyom
function grid(m) {
  const { x0, z0, size, res } = m;
  const heights = new Float32Array(res * res), biomes = new Uint8Array(res * res);
  for (let j = 0; j < res; j++) for (let i = 0; i < res; i++) {
    const x = x0 + (i + 0.5) / res * size, z = z0 + (j + 0.5) / res * size;
    heights[j * res + i] = computeHeight(x, z);
    biomes[j * res + i] = BIOME_ID[biomeAt(x, z)] || 0;
  }
  self.postMessage({ t: 'grid', id: m.id, x0, z0, size, res, heights, biomes }, [heights.buffer, biomes.buffer]);
}

self.onmessage = (e) => {
  const m = e.data;
  try {
    if (m.t === 'tile') tile(m);
    else if (m.t === 'depth') depth(m);
    else if (m.t === 'grid') grid(m);
  } catch (err) {
    self.postMessage({ t: 'error', id: m.id, msg: String(err && err.stack || err) });
  }
};
self.postMessage({ t: 'ready' });
