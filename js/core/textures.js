import * as THREE from 'three';
import { rng } from './util.js';

// Prosedürel (kodla çizilen) dokular
const cache = new Map();

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function finish(c, repeatX = 1, repeatY = 1) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function shade(hex, f) {
  const c = new THREE.Color(hex);
  c.multiplyScalar(f);
  return '#' + c.getHexString();
}

export function woodPlanks(base = '#8a5a32', seed = 1, planks = 8) {
  const key = 'planks' + base + seed + planks;
  if (cache.has(key)) return cache.get(key);
  const r = rng(seed);
  const W = 256, H = 256;
  const c = canvas(W, H), g = c.getContext('2d');
  const ph = H / planks;
  for (let i = 0; i < planks; i++) {
    g.fillStyle = shade(base, 0.82 + r() * 0.32);
    g.fillRect(0, i * ph, W, ph);
    // damarlar
    for (let k = 0; k < 14; k++) {
      g.strokeStyle = `rgba(40,20,5,${0.05 + r() * 0.12})`;
      g.lineWidth = 1 + r();
      g.beginPath();
      const y = i * ph + r() * ph;
      g.moveTo(0, y);
      for (let x = 0; x <= W; x += 32) g.lineTo(x, y + Math.sin(x * 0.05 + k) * 1.5);
      g.stroke();
    }
    // derz
    g.fillStyle = 'rgba(25,12,4,0.65)';
    g.fillRect(0, i * ph, W, 2);
    const cut = r() * W;
    g.fillRect(cut, i * ph, 2, ph);
    // çiviler
    g.fillStyle = 'rgba(30,30,30,0.6)';
    g.fillRect((cut + 8) % W, i * ph + 5, 3, 3);
    g.fillRect((cut + 8) % W, i * ph + ph - 7, 3, 3);
  }
  const t = finish(c);
  cache.set(key, t);
  return t;
}

export function roofTiles(base = '#a8452c', seed = 2) {
  const key = 'roof' + base + seed;
  if (cache.has(key)) return cache.get(key);
  const r = rng(seed);
  const W = 256, H = 256;
  const c = canvas(W, H), g = c.getContext('2d');
  g.fillStyle = shade(base, 0.6);
  g.fillRect(0, 0, W, H);
  const rows = 10, cols = 8;
  for (let j = 0; j < rows; j++) {
    for (let i = -1; i < cols + 1; i++) {
      const x = i * (W / cols) + (j % 2) * (W / cols / 2);
      const y = j * (H / rows);
      g.fillStyle = shade(base, 0.8 + r() * 0.35);
      g.beginPath();
      g.ellipse(x + W / cols / 2, y + H / rows * 0.75, W / cols / 2 - 1, H / rows * 0.8, 0, 0, Math.PI);
      g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.25)';
      g.stroke();
    }
  }
  const t = finish(c);
  cache.set(key, t);
  return t;
}

export function thatch(seed = 3) {
  const key = 'thatch' + seed;
  if (cache.has(key)) return cache.get(key);
  const r = rng(seed);
  const W = 256, H = 256;
  const c = canvas(W, H), g = c.getContext('2d');
  g.fillStyle = '#9c8350';
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 1400; i++) {
    const x = r() * W, y = r() * H;
    g.strokeStyle = `rgba(${150 + r() * 70},${120 + r() * 60},${60 + r() * 30},0.8)`;
    g.lineWidth = 1 + r() * 1.5;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 6, y + 14 + r() * 18); g.stroke();
  }
  for (let j = 0; j < 6; j++) { g.fillStyle = 'rgba(60,40,15,0.35)'; g.fillRect(0, j * 43, W, 3); }
  const t = finish(c);
  cache.set(key, t);
  return t;
}

export function stone(base = '#8d8578', seed = 4) {
  const key = 'stone' + base + seed;
  if (cache.has(key)) return cache.get(key);
  const r = rng(seed);
  const W = 256, H = 256;
  const c = canvas(W, H), g = c.getContext('2d');
  g.fillStyle = shade(base, 0.55);
  g.fillRect(0, 0, W, H);
  const rows = 6;
  for (let j = 0; j < rows; j++) {
    let x = -r() * 40;
    const y = j * (H / rows);
    while (x < W) {
      const w = 30 + r() * 40;
      g.fillStyle = shade(base, 0.8 + r() * 0.4);
      const rr = 6;
      g.beginPath();
      g.roundRect(x + 2, y + 2, w - 4, H / rows - 4, rr);
      g.fill();
      x += w;
    }
  }
  const t = finish(c);
  cache.set(key, t);
  return t;
}

export function cloth(base = '#efe6d0', stripes = null, seed = 5) {
  const key = 'cloth' + base + stripes + seed;
  if (cache.has(key)) return cache.get(key);
  const r = rng(seed);
  const W = 128, H = 128;
  const c = canvas(W, H), g = c.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, W, H);
  if (stripes) {
    g.fillStyle = stripes;
    for (let i = 0; i < W; i += 32) g.fillRect(i, 0, 16, H);
  }
  // dokuma
  for (let i = 0; i < 2500; i++) {
    g.fillStyle = `rgba(0,0,0,${r() * 0.05})`;
    g.fillRect(r() * W, r() * H, 1, 2);
  }
  for (let y = 0; y < H; y += 3) { g.fillStyle = 'rgba(255,255,255,0.03)'; g.fillRect(0, y, W, 1); }
  const t = finish(c);
  cache.set(key, t);
  return t;
}

export function parchmentCanvas(W, H, seed = 7) {
  const r = rng(seed);
  const c = canvas(W, H), g = c.getContext('2d');
  const grad = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.7);
  grad.addColorStop(0, '#f1e2bd');
  grad.addColorStop(0.7, '#e2c995');
  grad.addColorStop(1, '#b08a52');
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) {
    g.fillStyle = `rgba(120,80,30,${r() * 0.06})`;
    g.beginPath();
    g.arc(r() * W, r() * H, 10 + r() * 60, 0, Math.PI * 2);
    g.fill();
  }
  return c;
}

export function flagTexture(kind = 'skull', bg = '#111111', fg = '#f2efe6') {
  const key = 'flag' + kind + bg + fg;
  if (cache.has(key)) return cache.get(key);
  const W = 256, H = 160;
  const c = canvas(W, H), g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.fillStyle = fg; g.strokeStyle = fg;
  const cx = W / 2, cy = H / 2 - 8;
  if (kind === 'skull' || kind === 'dagger') {
    // kafatası
    g.beginPath(); g.ellipse(cx, cy, 30, 27, 0, 0, Math.PI * 2); g.fill();
    g.fillRect(cx - 18, cy + 14, 36, 18);
    g.fillStyle = bg;
    g.beginPath(); g.ellipse(cx - 11, cy, 8, 9, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(cx + 11, cy, 8, 9, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(cx, cy + 8); g.lineTo(cx - 4, cy + 15); g.lineTo(cx + 4, cy + 15); g.fill();
    for (let i = -2; i <= 2; i++) g.fillRect(cx + i * 7 - 1, cy + 22, 2, 10);
    g.fillStyle = fg;
    if (kind === 'skull') {
      g.lineWidth = 9; g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx - 60, cy + 30); g.lineTo(cx + 60, cy + 68); g.stroke();
      g.beginPath(); g.moveTo(cx + 60, cy + 30); g.lineTo(cx - 60, cy + 68); g.stroke();
    } else {
      // hançer
      g.fillStyle = '#c0392b';
      g.beginPath(); g.moveTo(cx + 70, cy - 40); g.lineTo(cx + 78, cy - 40); g.lineTo(cx + 76, cy + 50); g.lineTo(cx + 72, cy + 50); g.fill();
      g.fillRect(cx + 62, cy + 50, 24, 5);
    }
  } else if (kind === 'compass') {
    g.lineWidth = 6;
    g.beginPath(); g.arc(cx, cy + 8, 40, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(cx, cy - 45); g.lineTo(cx + 10, cy + 8); g.lineTo(cx, cy + 61); g.lineTo(cx - 10, cy + 8); g.fill();
  } else if (kind === 'kraken') {
    g.beginPath(); g.ellipse(cx, cy - 10, 26, 30, 0, 0, Math.PI * 2); g.fill();
    g.lineWidth = 8; g.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      g.beginPath(); g.moveTo(cx - 18 + i * 7, cy + 12);
      g.quadraticCurveTo(cx - 50 + i * 20, cy + 50, cx - 40 + i * 16, cy + 60); g.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, t);
  return t;
}

export function makeLabelTexture(text, opts = {}) {
  const W = opts.w || 512, H = opts.h || 128;
  const c = canvas(W, H), g = c.getContext('2d');
  g.fillStyle = opts.bg || '#5a3a1e';
  g.fillRect(0, 0, W, H);
  g.strokeStyle = opts.border || '#2b1a0c';
  g.lineWidth = 10;
  g.strokeRect(5, 5, W - 10, H - 10);
  g.fillStyle = opts.color || '#f3d27a';
  g.font = `${opts.size || 60}px "Pirata One", serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, W / 2, H / 2 + 4);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
