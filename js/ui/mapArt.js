import { terrain } from '../world/terrain.js';
import { ISLANDS, POIS, WORLD_SIZE } from '../world/worldData.js';
import { parchmentCanvas } from '../core/textures.js';
import { rng, clamp } from '../core/util.js';

// Resimli deniz haritası: sulu boya deniz ve kara, tepe gölgelendirme, eş yükselti eğrileri,
// kıyı mürekkep çizgileri, dalga işaretleri, deniz canavarı, kartuş ve çerçeve.
const N = 1000; // taban harita çözünürlüğü (piksel)
const M = 500; // yükseklik örnekleme ızgarası
let baseCache = null;

const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export function mapScale() { return N / WORLD_SIZE; }

export function renderMapBase() {
  if (baseCache) return baseCache;
  const WS = WORLD_SIZE;
  // 1) kaba ızgarada yükseklik ve biyom örnekle
  const G1 = M + 1;
  const grid = new Float32Array(G1 * G1);
  const ghostG = new Uint8Array(G1 * G1);
  const kemik = ISLANDS.filter((i) => i.biome === 'hayalet');
  for (let j = 0; j <= M; j++) for (let i = 0; i <= M; i++) {
    const x = -WS / 2 + (i / M) * WS, z = -WS / 2 + (j / M) * WS;
    grid[j * G1 + i] = terrain.heightAt(x, z);
    ghostG[j * G1 + i] = kemik.some((I) => Math.hypot(x - I.x, z - I.z) < I.r * 1.5) ? 1 : 0;
  }
  // 2) tam çözünürlüğe çift doğrusal büyütme
  const hs = new Float32Array(N * N);
  const ghost = new Uint8Array(N * N);
  for (let j = 0; j < N; j++) {
    const v = (j / (N - 1)) * M, j0 = Math.min(M - 1, Math.floor(v)), fv = v - j0;
    for (let i = 0; i < N; i++) {
      const u = (i / (N - 1)) * M, i0 = Math.min(M - 1, Math.floor(u)), fu = u - i0;
      const a = grid[j0 * G1 + i0], b = grid[j0 * G1 + i0 + 1], c = grid[(j0 + 1) * G1 + i0], d = grid[(j0 + 1) * G1 + i0 + 1];
      hs[j * N + i] = (a * (1 - fu) + b * fu) * (1 - fv) + (c * (1 - fu) + d * fu) * fv;
      ghost[j * N + i] = ghostG[Math.round(v) * G1 + Math.round(u)];
    }
  }
  const H = (i, j) => hs[clamp(j, 0, N - 1) * N + clamp(i, 0, N - 1)];
  const land = (i, j) => H(i, j) > 0;

  const c = parchmentCanvas(N, N, 3);
  const g = c.getContext('2d');
  const img = g.getImageData(0, 0, N, N);
  const D = img.data;
  const SAND = [232, 212, 158], GRASS = [148, 184, 98], FOREST = [104, 150, 78], ROCK = [152, 136, 104], PEAK = [222, 214, 196];
  const GH1 = [160, 158, 166], GH2 = [104, 102, 120];
  const SH = [132, 210, 202], MID = [84, 166, 196], DEEP = [46, 104, 156];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const k = (j * N + i) * 4;
    const h = hs[j * N + i];
    const par = [D[k], D[k + 1], D[k + 2]];
    let col;
    if (h > 0) {
      if (ghost[j * N + i]) col = mix3(GH1, GH2, smooth(2, 30, h));
      else {
        col = mix3(SAND, GRASS, smooth(0.7, 2.4, h));
        col = mix3(col, FOREST, smooth(8, 18, h));
        col = mix3(col, ROCK, smooth(24, 34, h));
        col = mix3(col, PEAK, smooth(40, 52, h));
      }
      // tepe gölgelendirme (ışık kuzeybatıdan)
      const nx = H(i + 1, j) - H(i - 1, j), nz = H(i, j + 1) - H(i, j - 1);
      const shade = clamp(1 + (nx + nz) * 0.045, 0.62, 1.28);
      col = [col[0] * shade, col[1] * shade, col[2] * shade];
      // eş yükselti eğrileri (10 m)
      if (h > 3 && (Math.floor(h / 10) !== Math.floor(H(i + 1, j) / 10) || Math.floor(h / 10) !== Math.floor(H(i, j + 1) / 10))) col = [col[0] * 0.78, col[1] * 0.74, col[2] * 0.7];
      // parşömen dokusu kısmen görünsün
      col = mix3(par, col, 0.82);
    } else {
      const d = -h;
      let sea = mix3(SH, MID, smooth(0.5, 8, d));
      sea = mix3(sea, DEEP, smooth(10, 34, d));
      col = mix3(par, sea, 0.5 + 0.2 * smooth(0, 30, d));
      // derinlik eğrileri
      if (Math.abs(h + 5) < 0.16) col = [col[0] * 0.88, col[1] * 0.9, col[2] * 0.94];
    }
    D[k] = col[0]; D[k + 1] = col[1]; D[k + 2] = col[2];
  }
  // kıyı mürekkebi ve açıktaki kıyı halkaları
  for (let j = 1; j < N - 1; j++) for (let i = 1; i < N - 1; i++) {
    const k = (j * N + i) * 4;
    const l = land(i, j);
    if (l !== land(i + 1, j) || l !== land(i, j + 1) || l !== land(i - 1, j) || l !== land(i, j - 1)) {
      D[k] = 64; D[k + 1] = 40; D[k + 2] = 20;
      continue;
    }
    if (l) continue;
    for (const [r, a] of [[4, 0.32], [8, 0.18]]) {
      const near = land(i + r, j) || land(i - r, j) || land(i, j + r) || land(i, j - r);
      const nearer = land(i + r - 1, j) || land(i - r + 1, j) || land(i, j + r - 1) || land(i, j - r + 1);
      if (near && !nearer) { D[k] *= 1 - a * 0.6; D[k + 1] *= 1 - a * 0.5; D[k + 2] *= 1 - a * 0.35; }
    }
  }
  g.putImageData(img, 0, 0);

  const R = rng(1453);
  const S = N / WS;
  const W2P = (x, z) => [(x + WS / 2) * S, (z + WS / 2) * S];
  // enlem/boylam ızgarası
  g.strokeStyle = 'rgba(90,60,30,0.14)'; g.lineWidth = 1;
  for (let v = -WS / 2; v <= WS / 2; v += 200) {
    const [p] = W2P(v, 0);
    g.beginPath(); g.moveTo(p, 0); g.lineTo(p, N); g.stroke();
    g.beginPath(); g.moveTo(0, p); g.lineTo(N, p); g.stroke();
  }
  // dalga işaretleri (açık deniz)
  g.strokeStyle = 'rgba(36,66,96,0.38)'; g.lineWidth = 1.3; g.lineCap = 'round';
  let placed = 0;
  for (let t = 0; t < 1400 && placed < 170; t++) {
    const i = Math.floor(R() * N), j = Math.floor(R() * N);
    if (H(i, j) > -14 || H(i + 14, j) > -6 || H(i - 14, j) > -6 || H(i, j + 10) > -6 || H(i, j - 10) > -6) continue;
    placed++;
    const w = 5 + R() * 4;
    g.beginPath(); g.moveTo(i - w, j); g.quadraticCurveTo(i - w / 2, j - 3.5, i, j); g.quadraticCurveTo(i + w / 2, j + 3.5, i + w, j); g.stroke();
    if (R() < 0.5) { g.beginPath(); g.moveTo(i - w * 0.6 + 3, j + 5); g.quadraticCurveTo(i, j + 2, i + w * 0.6 + 3, j + 5); g.stroke(); }
  }
  // deniz canavarı (güneydoğu açıkları) ve küçük bir yelkenli çizimi (batı)
  seaSerpent(g, ...W2P(860, 880), 1.25);
  shipSketch(g, ...W2P(-820, 640), 1.1);
  shipSketch(g, ...W2P(820, -880), 0.9);
  // kartuş
  cartouche(g, ...W2P(-880, -1080));
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
  baseCache = c;
  return c;
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
  g.font = '34px "Pirata One", serif'; g.fillText('Mavi Kırıklar', w / 2, 32);
  g.font = 'italic 14px "Crimson Text", serif'; g.fillText('Korsanlar Denizi · Ölçek: 200 kulaç', w / 2, 52);
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
    default:
      g.beginPath(); g.arc(0, 0, 3, 0, 6.3); g.fill();
  }
  g.restore();
}

// Keşif sisi: 64×64 hücre, yumuşak kenarlı ölçeklenmek üzere küçük bir tuval
export function fogCanvas(fog, color = [214, 196, 150], alpha = 236) {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  const img = g.createImageData(64, 64);
  for (let i = 0; i < 64 * 64; i++) {
    const k = i * 4;
    img.data[k] = color[0]; img.data[k + 1] = color[1]; img.data[k + 2] = color[2];
    img.data[k + 3] = fog[i] ? 0 : alpha;
  }
  g.putImageData(img, 0, 0);
  return c;
}

export { POIS };
