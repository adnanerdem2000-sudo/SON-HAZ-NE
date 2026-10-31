import { terrain } from './terrain.js';

// Statik çarpışma dünyası: dikey silindirler (ağaç, kaya), yönlü kutular (duvar)
// ve üzerinde yürünebilir platformlar (iskele, güverte, zemin).
const CELL = 16;

export const physics = {
  cells: new Map(),
  platforms: new Map(),
  all: [],

  clear() {
    this.cells.clear();
    this.platforms.clear();
    this.all = [];
  },

  _key(i, j) { return i * 100003 + j; },

  _insert(map, obj, minX, minZ, maxX, maxZ) {
    const i0 = Math.floor(minX / CELL), i1 = Math.floor(maxX / CELL);
    const j0 = Math.floor(minZ / CELL), j1 = Math.floor(maxZ / CELL);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const k = this._key(i, j);
      let a = map.get(k);
      if (!a) map.set(k, (a = []));
      a.push(obj);
    }
  },

  addCircle(x, z, r, y0 = -50, y1 = 100, tag = null) {
    const c = { t: 'c', x, z, r, y0, y1, tag };
    this._insert(this.cells, c, x - r, z - r, x + r, z + r);
    this.all.push(c);
    return c;
  },

  addBox(x, z, hw, hd, yaw = 0, y0 = -50, y1 = 100, tag = null) {
    const c = { t: 'b', x, z, hw, hd, yaw, cos: Math.cos(yaw), sin: Math.sin(yaw), y0, y1, tag };
    const R = Math.hypot(hw, hd);
    this._insert(this.cells, c, x - R, z - R, x + R, z + R);
    this.all.push(c);
    return c;
  },

  // Yürünebilir kutu platformu (üst yüzey yüksekliği top)
  addPlatform(x, z, hw, hd, yaw, top, tag = null) {
    const p = { x, z, hw, hd, yaw, cos: Math.cos(yaw), sin: Math.sin(yaw), top, tag };
    const R = Math.hypot(hw, hd);
    this._insert(this.platforms, p, x - R, z - R, x + R, z + R);
    return p;
  },

  _local(b, x, z) {
    const dx = x - b.x, dz = z - b.z;
    // dünya -> yerel (yaw ters)
    return [dx * b.cos - dz * b.sin, dx * b.sin + dz * b.cos];
  },

  // Zemin yüksekliği: arazi ve ayakların altındaki platformlar
  groundAt(x, z, yFeet = 1e9, step = 0.6) {
    let g = terrain.heightAt(x, z);
    const a = this.platforms.get(this._key(Math.floor(x / CELL), Math.floor(z / CELL)));
    let onPlatform = null;
    if (a) for (const p of a) {
      if (p.top > yFeet + step) continue;
      const [lx, lz] = this._local(p, x, z);
      if (Math.abs(lx) <= p.hw && Math.abs(lz) <= p.hd && p.top > g) { g = p.top; onPlatform = p; }
    }
    this.lastPlatform = onPlatform;
    return g;
  },

  // Daireyi çarpıştırıcılardan dışarı iter. pos: {x,z}, y: ayak yüksekliği
  resolve(pos, radius, y, height = 1.8) {
    const i0 = Math.floor((pos.x - radius) / CELL), i1 = Math.floor((pos.x + radius) / CELL);
    const j0 = Math.floor((pos.z - radius) / CELL), j1 = Math.floor((pos.z + radius) / CELL);
    let hit = false;
    const seen = this._seen || (this._seen = new Set());
    seen.clear();
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const a = this.cells.get(this._key(i, j));
      if (!a) continue;
      for (const c of a) {
        if (seen.has(c)) continue;
        seen.add(c);
        if (y + height < c.y0 || y > c.y1) continue;
        if (c.t === 'c') {
          const dx = pos.x - c.x, dz = pos.z - c.z;
          const d = Math.hypot(dx, dz), m = radius + c.r;
          if (d < m && d > 1e-5) {
            pos.x = c.x + (dx / d) * m;
            pos.z = c.z + (dz / d) * m;
            hit = true;
          }
        } else {
          const [lx, lz] = this._local(c, pos.x, pos.z);
          const cx = Math.max(-c.hw, Math.min(c.hw, lx));
          const cz = Math.max(-c.hd, Math.min(c.hd, lz));
          let dx = lx - cx, dz = lz - cz;
          let d = Math.hypot(dx, dz);
          let nlx, nlz;
          if (d < 1e-5) {
            // merkez içeride: en yakın kenara it
            const px = c.hw - Math.abs(lx), pz = c.hd - Math.abs(lz);
            if (px < pz) { nlx = Math.sign(lx || 1) * (c.hw + radius); nlz = lz; }
            else { nlx = lx; nlz = Math.sign(lz || 1) * (c.hd + radius); }
          } else if (d < radius) {
            nlx = cx + (dx / d) * radius;
            nlz = cz + (dz / d) * radius;
          } else continue;
          // yerel -> dünya
          pos.x = c.x + nlx * c.cos + nlz * c.sin;
          pos.z = c.z - nlx * c.sin + nlz * c.cos;
          hit = true;
        }
      }
    }
    return hit;
  },

  // Basit ışın testi (yatay düzlemde) — mermi/görüş için
  segmentBlocked(ax, az, bx, bz, y) {
    const steps = Math.ceil(Math.hypot(bx - ax, bz - az) / 1.5);
    const p = { x: 0, z: 0 };
    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      p.x = ax + (bx - ax) * t; p.z = az + (bz - az) * t;
      if (terrain.heightAt(p.x, p.z) > y + 0.3) return true;
    }
    return false;
  },
};
