// Saf (THREE/DOM içermeyen) arazi geometrisi: yükseklik, biyom, bölge ve renk.
// Hem ana iş parçacığında (fizik, yerleşim) hem arazi işçisinde (terrainWorker.js) aynı sonucu üretir.
import { ISLANDS, TERRAIN_MODS, CAVE, SEA_FLOOR, BUMPS, WORLD_SIZE } from './worldData.js';
import { regionAt } from './archipelago.js';
import { fbm, noise2, smoothstep, lerp, clamp } from '../core/util.js';

export const HALF = WORLD_SIZE / 2;
export { SEA_FLOOR, regionAt };

// ---- uzamsal dizin: 1 km hücreler, her hücre etkilenen ada/düzenleme/tepeleri tutar ----
const IC = 1000;
const OFF = 64;
const index = new Map();
const ikey = (i, j) => (i + OFF) * 512 + (j + OFF);
function cellOf(x, z) { return index.get(ikey(Math.floor(x / IC), Math.floor(z / IC))); }
function insert(kind, obj, x, z, R) {
  const i0 = Math.floor((x - R) / IC), i1 = Math.floor((x + R) / IC);
  const j0 = Math.floor((z - R) / IC), j1 = Math.floor((z + R) / IC);
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
    const k = ikey(i, j);
    let c = index.get(k);
    if (!c) index.set(k, (c = { isl: [], mods: [], bumps: [] }));
    c[kind].push(obj);
  }
}
for (const I of ISLANDS) {
  I.ex = I.ex || 1; I.ez = I.ez || 1; I.rot = I.rot || 0; I.coast = I.coast ?? 0.3; I.hill = I.hill ?? 1;
  I._c = Math.cos(I.rot); I._s = Math.sin(I.rot);
  I.reach = I.r * 2.6 * Math.max(I.ex, I.ez);
  insert('isl', I, I.x, I.z, I.reach);
}
for (const B of BUMPS) insert('bumps', B, B.x, B.z, B.r);

// Adanın yükseklik katkısı (etki alanı dışında -Infinity)
function islandH(I, x, z) {
  let dx = x - I.x, dz = z - I.z;
  if (I.rot) { const rx = dx * I._c - dz * I._s, rz = dx * I._s + dz * I._c; dx = rx; dz = rz; }
  const qx = dx / I.ex, qz = dz / I.ez;
  const dist = Math.sqrt(qx * qx + qz * qz);
  if (dist > I.r * 2.6) return -Infinity;
  const a = Math.atan2(qz, qx);
  const rn = fbm(Math.cos(a) * 1.3 + I.seed, Math.sin(a) * 1.3 + I.seed * 0.7, 3) * I.coast + noise2(x / 45 + I.seed, z / 45) * 0.05;
  const Re = I.r * (1 + rn);
  const d = dist / Re;
  if (d >= 1) {
    const t = smoothstep(1.0, 2.1, d);
    return SEA_FLOOR * Math.pow(t, 1.25) + fbm(x / 22, z / 22, 2) * 0.9 * (1 - t);
  }
  const shape = I.shape || 'normal';
  const beachW = shape === 'glacier' || shape === 'spire' ? 0.6 : 1.5;
  const beach = beachW * smoothstep(1.0, 0.9, d);
  const inner = smoothstep(0.97, 0.0, d);
  const hills = fbm(x / 48 + I.seed * 3, z / 48, 3) * 6 * I.hill * smoothstep(0.95, 0.6, d);
  let mount;
  if (shape === 'volcano') {
    // koni + krater çukuru (krater tabanı lav gölü yüksekliği: h*0.62)
    const cone = Math.pow(inner, 1.12) * (0.86 + 0.14 * fbm(x / 70 + I.seed, z / 70, 3));
    const crater = smoothstep(0.2, 0.06, d);
    mount = (I.h - 1.5) * (cone - crater * 0.42);
    return beach + Math.max(0, mount + hills * 0.4);
  } else if (shape === 'mesa') {
    // basamaklı kızıl kayalar: yükseklik katlara bölünür, dik yamaçlar
    const m = (I.h - 1.5) * Math.pow(inner, 0.75) * (0.55 + 0.45 * fbm(x / 130 + I.seed, z / 130, 3));
    const step = I.terrace || 11;
    const k = m / step, fl = Math.floor(k), fr = k - fl;
    mount = (fl + smoothstep(0.72, 0.96, fr)) * step;
    return beach + Math.max(0, mount + hills * 0.25);
  } else if (shape === 'atoll') {
    // halka ada: içte sığ lagün
    if (d < 0.66) return lerp(-3.6, 0.4, smoothstep(0.42, 0.66, d)) + fbm(x / 18, z / 18, 2) * 0.4;
    const ring = smoothstep(0.66, 0.78, d) * smoothstep(1.0, 0.9, d);
    return beach * 0.6 + ring * (1.2 + I.h * 0.35 * (0.5 + 0.5 * fbm(x / 30 + I.seed, z / 30, 2)));
  } else if (shape === 'spire') {
    mount = (I.h - 1.5) * Math.pow(inner, 2.6) * (0.7 + 0.3 * fbm(x / 40 + I.seed, z / 40, 3));
  } else if (shape === 'glacier') {
    mount = (I.h - 1.5) * Math.pow(inner, 0.95) * (0.7 + 0.3 * fbm(x / 180 + I.seed, z / 180, 3));
  } else if (shape === 'swamp') {
    // alçak, düz ve su birikintileriyle delik deşik
    mount = 3 + (I.h - 3) * Math.pow(inner, 2) * 0.6;
    const pool = noise2(x / 38 + I.seed, z / 38);
    if (pool > 0.3 && d < 0.85) return lerp(beach + mount, -1.4, smoothstep(0.3, 0.42, pool));
    return beach + Math.max(0, mount + hills * 0.3);
  } else {
    mount = (I.h - 1.5) * Math.pow(inner, 1.5) * (0.62 + 0.38 * fbm(x / 95 + I.seed, z / 95, 3));
  }
  return beach + Math.max(0, mount + hills);
}

function distToSegment(px, pz, ax, az, bx, bz) {
  const abx = bx - ax, abz = bz - az;
  const t = clamp(((px - ax) * abx + (pz - az) * abz) / (abx * abx + abz * abz), 0, 1);
  const cx = ax + abx * t, cz = az + abz * t;
  return Math.hypot(px - cx, pz - cz);
}
export function distToCavePath(x, z) {
  let d = Infinity;
  const p = CAVE.path;
  for (let i = 0; i < p.length - 1; i++) d = Math.min(d, distToSegment(x, z, p[i][0], p[i][1], p[i + 1][0], p[i + 1][1]));
  return d;
}

// adalar + tepeler (düzenlemeler hariç)
export function baseHeight(x, z) {
  let h = SEA_FLOOR + fbm(x / 260, z / 260, 3) * 4;
  const c = cellOf(x, z);
  if (!c) return h;
  for (let i = 0; i < c.isl.length; i++) { const ih = islandH(c.isl[i], x, z); if (ih > h) h = ih; }
  for (const B of c.bumps) {
    const d = Math.hypot(x - B.x, z - B.z);
    if (d < B.r) { const k = smoothstep(B.r, 0, d); h += B.h * k * k * (0.85 + 0.15 * noise2(x / 12, z / 12)); }
  }
  return h;
}

// düzenlemeler: yüksekliği "yerel zemin" olarak bırakılanlar burada çözülür (h: null)
for (const M of TERRAIN_MODS) {
  if (M.h === null || M.h === undefined) M.h = Math.max(2.6, baseHeight(M.x, M.z) * 0.85);
  insert('mods', M, M.x, M.z, M.r + M.blend);
}
const CAVE_X0 = 140, CAVE_X1 = 230, CAVE_Z0 = -100, CAVE_Z1 = -15;

// Analitik yükseklik (metre)
export function computeHeight(x, z) {
  if (x < -HALF || z < -HALF || x > HALF || z > HALF) return SEA_FLOOR;
  let h = baseHeight(x, z);
  const c = cellOf(x, z);
  if (c) for (const M of c.mods) {
    const d = Math.hypot(x - M.x, z - M.z);
    if (M.type === 'flatten') {
      if (d < M.r + M.blend) h = lerp(h, M.h, smoothstep(M.r + M.blend, M.r, d));
    } else if (M.type === 'dig') {
      if (d < M.r + M.blend) h = Math.min(h, lerp(h, M.depth, smoothstep(M.r + M.blend, M.r * 0.5, d)));
    }
  }
  // Yankı Mağarası: yol boyunca taban düzleştirilir
  if (x > CAVE_X0 && x < CAVE_X1 && z > CAVE_Z0 && z < CAVE_Z1) {
    const cd = distToCavePath(x, z);
    const cw = CAVE.width + 0.4;
    if (cd < cw + 3) h = lerp(h, CAVE.floor, smoothstep(cw + 3, cw, cd));
    const ch = CAVE.chamber;
    const chd = Math.hypot(x - ch.x, z - ch.z);
    if (chd < ch.r + 3) h = lerp(h, CAVE.floor, smoothstep(ch.r + 3, ch.r, chd));
  }
  return h;
}

// En yakın ada (normalize uzaklık < margin)
export function islandAt(x, z, margin = 1.25) {
  const c = cellOf(x, z);
  if (!c) return null;
  let best = null, bd = Infinity;
  for (const I of c.isl) {
    const d = Math.hypot(x - I.x, z - I.z) / (I.r * Math.max(I.ex, I.ez));
    if (d < margin && d < bd) { bd = d; best = I; }
  }
  return best;
}
export function biomeAt(x, z) {
  const I = islandAt(x, z, 2.2);
  return I ? I.biome : 'deniz';
}
// karo dikdörtgeni içinde kara olabilir mi? (adanın deniz tabanı etkisi r*2.1'de biter)
export function rectMayHaveLand(x0, z0, x1, z1) {
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, hw = (x1 - x0) / 2, hd = (z1 - z0) / 2;
  for (let i = Math.floor(x0 / IC); i <= Math.floor(x1 / IC); i++) for (let j = Math.floor(z0 / IC); j <= Math.floor(z1 / IC); j++) {
    const c = index.get(ikey(i, j));
    if (!c) continue;
    for (const I of c.isl) {
      const R = I.r * 1.6 * Math.max(I.ex, I.ez);
      const dx = Math.max(0, Math.abs(I.x - cx) - hw), dz = Math.max(0, Math.abs(I.z - cz) - hd);
      if (dx * dx + dz * dz < R * R) return true;
    }
    if (c.mods.length) for (const M of c.mods) {
      const dx = Math.max(0, Math.abs(M.x - cx) - hw), dz = Math.max(0, Math.abs(M.z - cz) - hd);
      if (dx * dx + dz * dz < (M.r + M.blend) ** 2 && M.h > -20) return true;
    }
  }
  return false;
}

// ---- renkler (sRGB 0..1) ----
const PAL = {
  tropik: { sand: [0.95, 0.87, 0.66], wet: [0.80, 0.70, 0.50], gA: [0.33, 0.62, 0.20], gB: [0.18, 0.45, 0.14], rock: [0.55, 0.50, 0.44], dirt: [0.55, 0.43, 0.28], peak: null },
  cangil: { sand: [0.96, 0.86, 0.62], wet: [0.78, 0.66, 0.46], gA: [0.22, 0.56, 0.17], gB: [0.09, 0.36, 0.11], rock: [0.45, 0.42, 0.36], dirt: [0.52, 0.32, 0.20], peak: null },
  hayalet: { sand: [0.70, 0.68, 0.60], wet: [0.52, 0.50, 0.45], gA: [0.30, 0.36, 0.28], gB: [0.25, 0.27, 0.24], rock: [0.36, 0.34, 0.38], dirt: [0.34, 0.30, 0.26], peak: null },
  buzul: { sand: [0.66, 0.66, 0.64], wet: [0.46, 0.47, 0.48], gA: [0.93, 0.95, 0.98], gB: [0.82, 0.86, 0.93], rock: [0.42, 0.45, 0.50], dirt: [0.50, 0.50, 0.52], peak: [0.97, 0.98, 1.0] },
  volkan: { sand: [0.22, 0.20, 0.20], wet: [0.12, 0.11, 0.11], gA: [0.33, 0.31, 0.24], gB: [0.22, 0.21, 0.18], rock: [0.17, 0.15, 0.15], dirt: [0.34, 0.24, 0.18], peak: [0.40, 0.37, 0.35] },
  col: { sand: [0.93, 0.78, 0.52], wet: [0.78, 0.62, 0.40], gA: [0.66, 0.60, 0.36], gB: [0.54, 0.47, 0.30], rock: [0.72, 0.42, 0.28], dirt: [0.70, 0.50, 0.32], peak: null },
};
const lerp3 = (o, a, t) => { o[0] = lerp(o[0], a[0], t); o[1] = lerp(o[1], a[1], t); o[2] = lerp(o[2], a[2], t); };

// out: [r,g,b] sRGB. ny: normalin y bileşeni (eğim)
export function colorSRGB(x, z, h, ny, out) {
  const I = islandAt(x, z, 2.2);
  const biome = I ? I.biome : 'tropik';
  const P = PAL[biome] || PAL.tropik;
  const n1 = noise2(x / 30, z / 30), n2 = noise2(x / 7 + 40, z / 7);
  const ghost = biome === 'hayalet';
  if (h < -0.4) {
    const depth = -h;
    const t = clamp(depth / 26, 0, 1);
    out[0] = lerp(0.88, 0.45, t); out[1] = lerp(0.80, 0.48, t); out[2] = lerp(0.60, 0.45, t);
    if (biome === 'volkan') { out[0] *= 0.45; out[1] *= 0.42; out[2] *= 0.42; }
    else if (biome === 'buzul') { out[0] *= 0.78; out[1] *= 0.82; out[2] *= 0.86; }
    const lagoon = Math.hypot(x + 150, z - 70) < 64;
    if (lagoon) { const m = smoothstep(64, 40, Math.hypot(x + 150, z - 70)); lerp3(out, [0.4, 0.42, 0.28], m); }
    if (I && I.shape === 'swamp' && depth < 3) lerp3(out, [0.36, 0.38, 0.22], 0.7);
    const warm = biome === 'tropik' || biome === 'cangil';
    if (depth > 1.2 && depth < 10 && warm && !lagoon) {
      const coral = noise2(x / 6, z / 6);
      if (coral > 0.45) {
        const pick = noise2(x / 3 + 9, z / 3);
        if (pick > 0.2) { out[0] = 0.95; out[1] = 0.45; out[2] = 0.50; }
        else if (pick > -0.3) { out[0] = 0.98; out[1] = 0.62; out[2] = 0.25; }
        else { out[0] = 0.62; out[1] = 0.38; out[2] = 0.75; }
      } else if (coral > 0.3) { out[0] *= 0.7; out[1] *= 0.8; out[2] *= 0.7; }
    }
    if (n2 > 0.55) { out[0] *= 0.85; out[1] *= 0.9; out[2] *= 0.85; }
  } else if (h < 1.0) {
    const t = smoothstep(-0.4, 1.0, h);
    out[0] = lerp(P.wet[0], P.sand[0], t); out[1] = lerp(P.wet[1], P.sand[1], t); out[2] = lerp(P.wet[2], P.sand[2], t);
  } else if (h < 2.3 + n1 * 0.5) {
    out[0] = P.sand[0]; out[1] = P.sand[1]; out[2] = P.sand[2];
    lerp3(out, P.gA, smoothstep(1.6 + n1 * 0.5, 2.3 + n1 * 0.5, h));
  } else {
    const t = clamp(n1 * 0.5 + 0.5, 0, 1);
    out[0] = lerp(P.gA[0], P.gB[0], t); out[1] = lerp(P.gA[1], P.gB[1], t); out[2] = lerp(P.gA[2], P.gB[2], t);
    if (n2 > 0.5) lerp3(out, P.dirt, 0.5);
    let rockT = smoothstep(0.82, 0.68, ny) + smoothstep(38, 52, h) * 0.8;
    if (biome === 'col') {
      // kızıl kumtaşı katmanları
      rockT = smoothstep(0.86, 0.7, ny) + smoothstep(14, 30, h) * 0.6;
      const band = Math.sin(h * 0.55 + n1 * 0.8) * 0.5 + 0.5;
      const rk = [lerp(0.78, 0.6, band), lerp(0.5, 0.34, band), lerp(0.32, 0.22, band)];
      lerp3(out, rk, clamp(rockT, 0, 1));
    } else if (biome === 'buzul') {
      lerp3(out, P.rock, clamp(smoothstep(0.7, 0.5, ny), 0, 1));
      if (ny < 0.62 && n2 > 0.2) lerp3(out, [0.62, 0.78, 0.9], 0.6); // buz
    } else if (biome === 'volkan') {
      lerp3(out, P.rock, clamp(rockT + smoothstep(20, 40, h) * 0.6, 0, 1));
      if (I && I.shape === 'volcano') {
        const dd = Math.hypot(x - I.x, z - I.z) / I.r;
        if (dd < 0.3) lerp3(out, [0.42, 0.2, 0.12], smoothstep(0.3, 0.16, dd)); // kızgın krater ağzı
        lerp3(out, P.peak, smoothstep(I.h * 0.45, I.h * 0.8, h) * 0.5);
      }
    } else lerp3(out, P.rock, clamp(rockT, 0, 1));
    if (P.peak && biome === 'buzul') lerp3(out, P.peak, smoothstep(55, 90, h) * 0.8);
  }
  // Kırlangıç Limanı çevresi patika
  const pd = Math.hypot(x - 10, z - 215);
  if (pd < 75 && h > 1.5) lerp3(out, [0.62, 0.52, 0.36], smoothstep(75, 55, pd) * (0.55 + 0.25 * n2));
  // Yeni yerleşimler: kasaba/kamp/harabe düzlükleri toprak yol
  if (I && I.features && h > 1.2) {
    for (const f of I.features) {
      if (!f.r && f.type !== 'port') continue;
      const R = f.type === 'port' ? 50 * (f.size || 1) : f.r * 1.05;
      const d = Math.hypot(x - f.x, z - f.z);
      if (d < R) {
        const dirt = f.type === 'graveyard' ? [0.30, 0.27, 0.24] : biome === 'buzul' ? [0.74, 0.74, 0.76] : biome === 'volkan' ? [0.26, 0.22, 0.2] : [0.6, 0.5, 0.34];
        lerp3(out, dirt, smoothstep(R, R * 0.75, d) * (0.5 + 0.25 * n2));
      }
    }
  }
  // Mağara tabanı
  if (x > CAVE_X0 && x < CAVE_X1 && z > CAVE_Z0 && z < CAVE_Z1) {
    if (distToCavePath(x, z) < CAVE.width + 1 || Math.hypot(x - CAVE.chamber.x, z - CAVE.chamber.z) < CAVE.chamber.r + 1) { out[0] = 0.36; out[1] = 0.32; out[2] = 0.28; }
  }
  void ghost;
  return out;
}

export function srgbToLinear(c) { return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }

// IEEE yarım duyarlıklı sayı (okyanus derinlik dokusu için)
const _f32 = new Float32Array(1), _u32 = new Uint32Array(_f32.buffer);
export function toHalf(v) {
  _f32[0] = v;
  const x = _u32[0];
  const sign = (x >> 16) & 0x8000;
  let e = ((x >> 23) & 0xff) - 127 + 15;
  let m = x & 0x7fffff;
  if (e <= 0) return sign;
  if (e >= 31) return sign | 0x7c00;
  return sign | (e << 10) | (m >> 13);
}
