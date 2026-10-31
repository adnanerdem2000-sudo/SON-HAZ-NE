import { terrain } from '../world/terrain.js';
import { ISLANDS, POIS, WORLD_SIZE } from '../world/worldData.js';
import { REGIONS } from '../world/archipelago.js';
import { parchmentCanvas } from '../core/textures.js';
import { rng, clamp } from '../core/util.js';

// Resimli deniz haritası (20 × 20 km): arazi işçisinde hesaplanan yükseklik/biyom ızgaralarından
// sulu boya deniz ve kara, tepe gölgelendirme, eş yükselti eğrileri, kıyı mürekkebi.
// Dünya tabanı 1024 px (≈20 m/px); yakınlaştırınca 1250 m'lik ayrıntı karoları (≈2.4 m/px) istek üzerine çizilir.
const N = 1024;
const DT = 1250, DRES = 512, DN = WORLD_SIZE / DT;
let baseCache = null;
const detail = new Map();
const pendingDetail = new Set();
const listeners = new Set();

const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export function mapScale() { return N / WORLD_SIZE; }
export function onMapDetail(fn) { listeners.add(fn); return () => listeners.delete(fn); }

// biyom kimlikleri işçiyle aynı: 0 deniz, 1 tropik, 2 cangıl, 3 hayalet, 4 buzul, 5 volkan, 6 çöl
const LAND = {
  1: { sand: [232, 212, 158], g1: [148, 184, 98], g2: [104, 150, 78], rock: [152, 136, 104], peak: [222, 214, 196] },
  2: { sand: [232, 210, 150], g1: [118, 170, 82], g2: [70, 124, 62], rock: [128, 122, 100], peak: [200, 196, 176] },
  3: { sand: [176, 172, 160], g1: [160, 158, 166], g2: [104, 102, 120], rock: [96, 94, 108], peak: [140, 138, 150] },
  4: { sand: [196, 196, 192], g1: [236, 240, 246], g2: [214, 222, 234], rock: [150, 160, 176], peak: [250, 252, 255] },
  5: { sand: [92, 84, 80], g1: [118, 120, 92], g2: [86, 84, 74], rock: [70, 62, 60], peak: [126, 118, 114] },
  6: { sand: [236, 206, 150], g1: [210, 186, 128], g2: [196, 156, 104], rock: [196, 120, 80], peak: [222, 170, 120] },
};

// yükseklik + biyom ızgarasını parşömen üzerine boya (res × res piksel)
function paint(heights, biomes, res, worldPx, seed = 3) {
  const c = parchmentCanvas(res, res, seed);
  const g = c.getContext('2d');
  const img = g.getImageData(0, 0, res, res);
  const D = img.data;
  const H = (i, j) => heights[clamp(j, 0, res - 1) * res + clamp(i, 0, res - 1)];
  const land = (i, j) => H(i, j) > 0;
  const SH = [132, 210, 202], MID = [84, 166, 196], DEEP = [46, 104, 156];
  const shadeK = 0.045 * worldPx / 4.8; // eğim → gölge (piksel boyutuna göre)
  for (let j = 0; j < res; j++) for (let i = 0; i < res; i++) {
    const k = (j * res + i) * 4;
    const h = heights[j * res + i];
    const par = [D[k], D[k + 1], D[k + 2]];
    let col;
    if (h > 0) {
      const b = biomes[j * res + i] || 1;
      const P = LAND[b] || LAND[1];
      col = mix3(P.sand, P.g1, smooth(0.7, 2.4, h));
      col = mix3(col, P.g2, smooth(8, 18, h));
      if (b === 6) { const band = Math.sin(h * 0.55) * 0.5 + 0.5; col = mix3(col, mix3(P.rock, [222, 150, 100], band), smooth(10, 24, h)); }
      else col = mix3(col, P.rock, smooth(24, 34, h));
      col = mix3(col, P.peak, smooth(b === 4 ? 30 : 40, b === 4 ? 60 : 52, h));
      // tepe gölgelendirme (ışık kuzeybatıdan)
      const nx = H(i + 1, j) - H(i - 1, j), nz = H(i, j + 1) - H(i, j - 1);
      const shade = clamp(1 + (nx + nz) * shadeK / worldPx * 4.8, 0.62, 1.28);
      col = [col[0] * shade, col[1] * shade, col[2] * shade];
      // eş yükselti eğrileri (10 m)
      if (h > 3 && (Math.floor(h / 10) !== Math.floor(H(i + 1, j) / 10) || Math.floor(h / 10) !== Math.floor(H(i, j + 1) / 10))) col = [col[0] * 0.78, col[1] * 0.74, col[2] * 0.7];
      col = mix3(par, col, 0.82);
    } else {
      const d = -h;
      let sea = mix3(SH, MID, smooth(0.5, 8, d));
      sea = mix3(sea, DEEP, smooth(10, 34, d));
      col = mix3(par, sea, 0.5 + 0.2 * smooth(0, 30, d));
      if (Math.abs(h + 5) < 0.16 * Math.max(1, worldPx / 4.8)) col = [col[0] * 0.88, col[1] * 0.9, col[2] * 0.94];
    }
    D[k] = col[0]; D[k + 1] = col[1]; D[k + 2] = col[2];
  }
  // kıyı mürekkebi ve açıktaki kıyı halkaları
  for (let j = 1; j < res - 1; j++) for (let i = 1; i < res - 1; i++) {
    const k = (j * res + i) * 4;
    const l = land(i, j);
    if (l !== land(i + 1, j) || l !== land(i, j + 1) || l !== land(i - 1, j) || l !== land(i, j - 1)) { D[k] = 64; D[k + 1] = 40; D[k + 2] = 20; continue; }
    if (l) continue;
    for (const [r, a] of [[3, 0.32], [7, 0.18]]) {
      const near = land(i + r, j) || land(i - r, j) || land(i, j + r) || land(i, j - r);
      const nearer = land(i + r - 1, j) || land(i - r + 1, j) || land(i, j + r - 1) || land(i, j - r + 1);
      if (near && !nearer) { D[k] *= 1 - a * 0.6; D[k + 1] *= 1 - a * 0.5; D[k + 2] *= 1 - a * 0.35; }
    }
  }
  g.putImageData(img, 0, 0);
  return { c, H };
}

// Dünya tabanı (yükleme sırasında işçiden)
export async function initMapBase() {
  if (baseCache) return baseCache;
  const m = await terrain.requestGrid(-WORLD_SIZE / 2, -WORLD_SIZE / 2, WORLD_SIZE, N, -500);
  const { c, H } = paint(m.heights, m.biomes, N, WORLD_SIZE / N, 3);
  decorate(c, H);
  baseCache = c;
  return c;
}
export function renderMapBase() {
  if (baseCache) return baseCache;
  // henüz hazır değilse geçici boş parşömen
  return parchmentCanvas(64, 64, 3);
}

// Ayrıntı karosu (i, j): yoksa üretimi başlatır ve null döner
export function mapDetail(i, j) {
  if (i < 0 || j < 0 || i >= DN || j >= DN) return null;
  const key = i * 64 + j;
  const d = detail.get(key);
  if (d) { d.used = performance.now(); return d.c; }
  if (!pendingDetail.has(key) && pendingDetail.size < 3) {
    pendingDetail.add(key);
    const x0 = -WORLD_SIZE / 2 + i * DT, z0 = -WORLD_SIZE / 2 + j * DT;
    terrain.requestGrid(x0, z0, DT, DRES, 300).then((m) => {
      pendingDetail.delete(key);
      const { c } = paint(m.heights, m.biomes, DRES, DT / DRES, 5 + key);
      detail.set(key, { c, used: performance.now() });
      if (detail.size > 28) {
        let old = null;
        for (const [k, v] of detail) if (!old || v.used < old[1].used) old = [k, v];
        detail.delete(old[0]);
      }
      for (const fn of listeners) fn(i, j);
    }).catch(() => pendingDetail.delete(key));
  }
  return null;
}
export const DETAIL = { size: DT, n: DN };

// Bir görünüm dikdörtgenine (dünya koordinatı) düşen ayrıntı karolarını çiz
export function drawDetail(g, toPx, scale, x0, z0, x1, z1) {
  const i0 = Math.floor((x0 + WORLD_SIZE / 2) / DT), i1 = Math.floor((x1 + WORLD_SIZE / 2) / DT);
  const j0 = Math.floor((z0 + WORLD_SIZE / 2) / DT), j1 = Math.floor((z1 + WORLD_SIZE / 2) / DT);
  if ((i1 - i0 + 1) * (j1 - j0 + 1) > 16) return;
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const c = mapDetail(i, j);
    if (!c) continue;
    const wx = -WORLD_SIZE / 2 + i * DT, wz = -WORLD_SIZE / 2 + j * DT;
    const [px, py] = toPx(wx, wz);
    g.drawImage(c, px, py, DT * scale + 0.5, DT * scale + 0.5);
  }
}

function decorate(c, H) {
  const g = c.getContext('2d');
  const WS = WORLD_SIZE;
  const R = rng(1453);
  const S = N / WS;
  const W2P = (x, z) => [(x + WS / 2) * S, (z + WS / 2) * S];
  // ızgara (1 km)
  g.strokeStyle = 'rgba(90,60,30,0.12)'; g.lineWidth = 1;
  for (let v = -WS / 2; v <= WS / 2; v += 1000) {
    const [p] = W2P(v, 0);
    g.beginPath(); g.moveTo(p, 0); g.lineTo(p, N); g.stroke();
    g.beginPath(); g.moveTo(0, p); g.lineTo(N, p); g.stroke();
  }
  // dalga işaretleri (açık deniz)
  g.strokeStyle = 'rgba(36,66,96,0.34)'; g.lineWidth = 1.1; g.lineCap = 'round';
  let placed = 0;
  for (let t = 0; t < 4000 && placed < 420; t++) {
    const i = Math.floor(R() * N), j = Math.floor(R() * N);
    if (H(i, j) > -14 || H(i + 8, j) > -6 || H(i - 8, j) > -6 || H(i, j + 6) > -6 || H(i, j - 6) > -6) continue;
    placed++;
    const w = 3.5 + R() * 3;
    g.beginPath(); g.moveTo(i - w, j); g.quadraticCurveTo(i - w / 2, j - 2.5, i, j); g.quadraticCurveTo(i + w / 2, j + 2.5, i + w, j); g.stroke();
  }
  // bölge adları
  g.textAlign = 'center';
  const regionLabel = (txt, x, z, size = 30) => {
    const [px, py] = W2P(x, z);
    g.font = `italic ${size}px "Crimson Text", serif`;
    g.fillStyle = 'rgba(58,36,18,0.55)';
    g.fillText(txt.split('').join(String.fromCharCode(8202)), px, py);
  };
  regionLabel(REGIONS.buzul.name, 1500, -8800);
  regionLabel(REGIONS.tropik.name, 0, 9000);
  regionLabel(REGIONS.volkan.name, 8200, 3600);
  regionLabel(REGIONS.col.name, -8000, -3000);
  regionLabel(REGIONS.hayalet.name, -7300, -9300);
  regionLabel(REGIONS.merkez.name, 0, -2700, 24);
  // deniz canavarları ve gemiler
  seaSerpent(g, ...W2P(1800, -8000), 0.8);
  seaSerpent(g, ...W2P(-7000, -4600), 0.7);
  shipSketch(g, ...W2P(-3000, 2600), 0.7);
  shipSketch(g, ...W2P(4200, -3000), 0.6);
  shipSketch(g, ...W2P(3300, 8000), 0.6);
  // kartuş
  cartouche(g, ...W2P(4200, -9500));
  // çerçeve: çift çizgi ve dama kenar
  g.strokeStyle = '#3a2412'; g.lineWidth = 3; g.strokeRect(6, 6, N - 12, N - 12);
  g.lineWidth = 1; g.strokeRect(13, 13, N - 26, N - 26);
  for (let t = 0, n = 0; t < N - 26; t += (N - 26) / 24, n++) {
    if (n % 2) continue;
    g.fillStyle = '#3a2412';
    const L = (N - 26) / 24;
    g.fillRect(13 + t, 8, L, 4); g.fillRect(13 + t, N - 12, L, 4);
    g.fillRect(8, 13 + t, 4, L); g.fillRect(N - 12, 13 + t, 4, L);
  }
  void ISLANDS; void POIS;
}

function seaSerpent(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.lineWidth = 2; g.strokeStyle = '#2a3a2a'; g.fillStyle = 'rgba(70,110,80,0.85)';
  for (const [hx, hw] of [[-34, 18], [-6, 22], [24, 16]]) {
    g.beginPath(); g.moveTo(hx - hw / 2, 6); g.quadraticCurveTo(hx, -hw * 0.9, hx + hw / 2, 6); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(hx - hw / 4, -hw * 0.3); g.lineTo(hx - hw / 8, -hw * 0.62); g.lineTo(hx, -hw * 0.38); g.stroke();
  }
  // baş
  g.beginPath(); g.moveTo(-52, 6); g.quadraticCurveTo(-58, -22, -44, -24); g.quadraticCurveTo(-34, -22, -40, -8); g.quadraticCurveTo(-44, 2, -42, 6); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#f0e0b0'; g.beginPath(); g.arc(-46, -18, 2.2, 0, 6.3); g.fill();
  g.strokeStyle = '#a33'; g.beginPath(); g.moveTo(-56, -14); g.lineTo(-64, -12); g.lineTo(-60, -10); g.stroke();
  // kuyruk
  g.strokeStyle = '#2a3a2a'; g.beginPath(); g.moveTo(32, 6); g.quadraticCurveTo(46, -8, 50, -18); g.stroke();
  g.fillStyle = 'rgba(70,110,80,0.85)'; g.beginPath(); g.moveTo(50, -18); g.lineTo(58, -26); g.lineTo(56, -14); g.closePath(); g.fill(); g.stroke();
  // su çizgileri
  g.strokeStyle = 'rgba(36,66,96,0.5)'; g.lineWidth = 1.2;
  for (let i = -60; i < 60; i += 12) { g.beginPath(); g.moveTo(i, 9); g.quadraticCurveTo(i + 3, 6, i + 6, 9); g.stroke(); }
  g.restore();
}

function shipSketch(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.strokeStyle = '#3a2412'; g.lineWidth = 1.5; g.fillStyle = 'rgba(110,70,40,0.85)';
  g.beginPath(); g.moveTo(-22, 0); g.lineTo(22, 0); g.lineTo(16, 9); g.lineTo(-17, 9); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = 'rgba(244,234,210,0.95)';
  for (const [mx, h] of [[-6, 30], [8, 24]]) {
    g.beginPath(); g.moveTo(mx, 0); g.lineTo(mx, -h); g.stroke();
    g.beginPath(); g.moveTo(mx - 9, -h + 4); g.quadraticCurveTo(mx + 3, -h / 2 - 2, mx - 9, -4); g.lineTo(mx + 8, -4); g.quadraticCurveTo(mx + 13, -h / 2, mx + 8, -h + 4); g.closePath(); g.fill(); g.stroke();
  }
  g.fillStyle = '#111'; g.fillRect(-7, -34, 7, 4);
  g.strokeStyle = 'rgba(36,66,96,0.5)';
  for (let i = -26; i < 26; i += 9) { g.beginPath(); g.moveTo(i, 12); g.quadraticCurveTo(i + 3, 9, i + 6, 12); g.stroke(); }
  g.restore();
}

function cartouche(g, x, y) {
  g.save(); g.translate(x, y);
  const w = 250, h = 64;
  g.fillStyle = 'rgba(244,230,196,0.95)'; g.strokeStyle = '#3a2412'; g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, 8); g.quadraticCurveTo(-14, 0, -4, -8); g.lineTo(w + 4, -8); g.quadraticCurveTo(w + 14, 0, w, 8);
  g.lineTo(w, h - 8); g.quadraticCurveTo(w + 14, h, w + 4, h + 8); g.lineTo(-4, h + 8); g.quadraticCurveTo(-14, h, 0, h - 8); g.closePath();
  g.fill(); g.stroke();
  g.strokeStyle = 'rgba(58,36,18,.5)'; g.lineWidth = 1; g.strokeRect(6, -2, w - 12, h + 4);
  g.fillStyle = '#3a2412'; g.textAlign = 'center';
  g.font = '30px "Pirata One", serif'; g.fillText('Mavi Kırıklar ve Ötesi', w / 2, 32);
  g.font = 'italic 14px "Crimson Text", serif'; g.fillText('Korsanlar Denizi · Izgara: 1 kilometre', w / 2, 52);
  g.restore();
}

// POI simgeleri (dünya haritası ve mini harita)
export function drawPoiIcon(g, kind, x, y, s = 12) {
  g.save(); g.translate(x, y);
  const k = s / 12;
  g.scale(k, k);
  g.lineWidth = 1.6; g.strokeStyle = '#2a180b'; g.lineJoin = 'round'; g.lineCap = 'round';
  const disc = (fill) => { g.fillStyle = 'rgba(244,230,196,0.92)'; g.beginPath(); g.arc(0, 0, 11, 0, 6.3); g.fill(); g.strokeStyle = fill || '#2a180b'; g.stroke(); g.strokeStyle = '#2a180b'; };
  disc();
  g.fillStyle = '#2a180b';
  switch (kind) {
    case 'port': // çapa
      g.beginPath(); g.moveTo(0, -7); g.lineTo(0, 7); g.moveTo(-4, -4); g.lineTo(4, -4); g.stroke();
      g.beginPath(); g.arc(0, -8, 1.8, 0, 6.3); g.stroke();
      g.beginPath(); g.arc(0, 1, 6.5, 0.35, Math.PI - 0.35); g.stroke();
      break;
    case 'peak':
      g.fillStyle = '#7a6a4a'; g.beginPath(); g.moveTo(-8, 6); g.lineTo(-1, -7); g.lineTo(3, -1); g.lineTo(5, -4); g.lineTo(9, 6); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#f4f0e6'; g.beginPath(); g.moveTo(-3.5, -3); g.lineTo(-1, -7); g.lineTo(1.5, -3.5); g.closePath(); g.fill();
      break;
    case 'cave':
      g.fillStyle = '#7a6a5a'; g.beginPath(); g.moveTo(-9, 7); g.quadraticCurveTo(-9, -9, 0, -8); g.quadraticCurveTo(9, -9, 9, 7); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#1a1008'; g.beginPath(); g.moveTo(-4, 7); g.quadraticCurveTo(-4, -2, 0, -2); g.quadraticCurveTo(4, -2, 4, 7); g.closePath(); g.fill();
      break;
    case 'lagoon':
      g.strokeStyle = '#2a5a7a';
      for (const yy of [-3, 2]) { g.beginPath(); g.moveTo(-7, yy); g.quadraticCurveTo(-3.5, yy - 3, 0, yy); g.quadraticCurveTo(3.5, yy + 3, 7, yy); g.stroke(); }
      g.fillStyle = '#4a7a3a'; g.beginPath(); g.ellipse(0, 6, 6, 1.6, 0, 0, 6.3); g.fill();
      break;
    case 'camp':
      g.fillStyle = '#a33a2a'; g.beginPath(); g.moveTo(-8, 7); g.lineTo(0, -8); g.lineTo(8, 7); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#2a180b'; g.beginPath(); g.moveTo(-2, 7); g.lineTo(0, 1); g.lineTo(2, 7); g.closePath(); g.fill();
      break;
    case 'palm':
      g.strokeStyle = '#6a4a2a'; g.lineWidth = 2; g.beginPath(); g.moveTo(1, 8); g.quadraticCurveTo(-2, 0, 0, -5); g.stroke();
      g.strokeStyle = '#3a7a2a'; g.lineWidth = 2.2;
      for (const a of [-2.6, -1.9, -1.2, -0.5]) { g.beginPath(); g.moveTo(0, -5); g.quadraticCurveTo(Math.cos(a) * 5, -5 + Math.sin(a) * 6, Math.cos(a) * 9, -2 + Math.sin(a) * 3); g.stroke(); }
      break;
    case 'wreck':
      g.fillStyle = '#6b4a2c'; g.beginPath(); g.moveTo(-9, 2); g.lineTo(7, -2); g.lineTo(5, 5); g.lineTo(-7, 7); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(-1, 1); g.lineTo(3, -9); g.stroke();
      g.strokeStyle = '#2a5a7a'; g.beginPath(); g.moveTo(-9, 8); g.quadraticCurveTo(-5, 6, 0, 8); g.quadraticCurveTo(5, 10, 9, 8); g.stroke();
      break;
    case 'ruin':
      g.fillStyle = '#ece5d2'; g.beginPath(); g.arc(0, -2, 6, 0, 6.3); g.fill(); g.stroke();
      g.fillRect(-3.5, 2, 7, 4); g.strokeRect(-3.5, 2, 7, 4);
      g.fillStyle = '#2a180b'; g.beginPath(); g.arc(-2.2, -2, 1.5, 0, 6.3); g.arc(2.2, -2, 1.5, 0, 6.3); g.fill();
      break;
    case 'reef':
      g.strokeStyle = '#d0603a'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(0, 8); g.lineTo(0, -2); g.lineTo(-5, -7); g.moveTo(0, 1); g.lineTo(5, -6); g.moveTo(-3, 4); g.lineTo(-7, 0); g.stroke();
      break;
    case 'fort': // kale burçları
      g.fillStyle = '#8a7a6a';
      g.fillRect(-7, -3, 14, 10); g.strokeRect(-7, -3, 14, 10);
      for (const x of [-7, -2.5, 2]) { g.fillRect(x, -7, 3.2, 4); g.strokeRect(x, -7, 3.2, 4); }
      g.fillStyle = '#2a180b'; g.fillRect(-1.5, 2, 3, 5);
      break;
    case 'grave': // mezar taşı ve haç
      g.fillStyle = '#9a9aa8'; g.beginPath(); g.moveTo(-5, 8); g.lineTo(-5, -3); g.quadraticCurveTo(0, -9, 5, -3); g.lineTo(5, 8); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(0, -3); g.lineTo(0, 4); g.moveTo(-2.5, -0.5); g.lineTo(2.5, -0.5); g.stroke();
      break;
    case 'temple': // basamaklı tapınak
      g.fillStyle = '#c8b888';
      g.fillRect(-9, 3, 18, 4); g.strokeRect(-9, 3, 18, 4);
      g.fillRect(-6, -1, 12, 4); g.strokeRect(-6, -1, 12, 4);
      g.fillRect(-3, -6, 6, 5); g.strokeRect(-3, -6, 6, 5);
      break;
    case 'mine': // kazma ve kürek
      g.strokeStyle = '#4a3a2a'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(-7, 7); g.lineTo(6, -6); g.moveTo(7, 7); g.lineTo(-6, -6); g.stroke();
      g.lineWidth = 2.6; g.strokeStyle = '#7a7a80'; g.beginPath(); g.arc(6, -6, 4, Math.PI * 0.6, Math.PI * 1.4); g.stroke();
      break;
    case 'market': // çadır ve fener
      g.fillStyle = '#6a4a8a'; g.beginPath(); g.moveTo(-8, 6); g.lineTo(0, -7); g.lineTo(8, 6); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#ffd060'; g.beginPath(); g.arc(0, 2, 2, 0, 6.3); g.fill();
      break;
    case 'boss':
      g.fillStyle = '#a3241a'; g.font = 'bold 15px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('☠', 0, 1);
      break;
    default:
      g.beginPath(); g.arc(0, 0, 3, 0, 6.3); g.fill();
  }
  g.restore();
}

// Keşif sisi: FOG_N × FOG_N hücre, yumuşak kenarlı ölçeklenmek üzere küçük bir tuval
export const FOG_N = 256;
export function fogCanvas(fog, color = [214, 196, 150], alpha = 236) {
  const n = Math.round(Math.sqrt(fog.length));
  const c = document.createElement('canvas');
  c.width = n; c.height = n;
  const g = c.getContext('2d');
  const img = g.createImageData(n, n);
  for (let i = 0; i < n * n; i++) {
    const k = i * 4;
    img.data[k] = color[0]; img.data[k + 1] = color[1]; img.data[k + 2] = color[2];
    img.data[k + 3] = fog[i] ? 0 : alpha;
  }
  g.putImageData(img, 0, 0);
  return c;
}

export { POIS };
