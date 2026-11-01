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
    if (obj.tag) obj._keys = [];
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const k = this._key(i, j);
      let a = map.get(k);
      if (!a) map.set(k, (a = []));
      a.push(obj);
      if (obj._keys) obj._keys.push(k);
    }
  },

  // Etiketli çarpıştırıcıları kaldır (ada içeriği boşaltılırken)
  removeTag(tag) {
    const drop = (map, list) => {
      for (const o of list) {
        for (const k of o._keys || []) {
          const a = map.get(k);
          if (!a) continue;
          const f = a.filter((x) => x !== o);
          if (f.length) map.set(k, f); else map.delete(k);
        }
      }
    };
    const cols = this.all.filter((o) => o.tag === tag);
    drop(this.cells, cols);
    this.all = this.all.filter((o) => o.tag !== tag);
    const plats = (this.platList || []).filter((o) => o.tag === tag);
    drop(this.platforms, plats);
    if (this.platList) this.platList = this.platList.filter((o) => o.tag !== tag);
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

  // Yürünebilir kutu platformu (üst yüzey yüksekliği top). sides=true: yan yüzler çarpıştırıcı olur, böylece
  // basamak sınırından (0.6 m) yüksek bir platforma yandan girilince bloğun içinde yürünmez; üstünden 0.6 m
  // içindeyken (basamak) engellenmez. Alçak güverteler (top ≤ 3) altından yüzülebilir (yan yüz yalnız üst 1 m).
  addPlatform(x, z, hw, hd, yaw, top, tag = null, sides = true) {
    const p = { x, z, hw, hd, yaw, cos: Math.cos(yaw), sin: Math.sin(yaw), top, tag };
    const R = Math.hypot(hw, hd);
    this._insert(this.platforms, p, x - R, z - R, x + R, z + R);
    (this.platList || (this.platList = [])).push(p);
    if (sides) p.side = this.addBox(x, z, hw, hd, yaw, top > 3 ? -50 : top - 1.0, top - 0.6, tag);
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

  // Kamera görüş hattı: a→b doğru parçası bir platform güvertesinin düzlemini (top − 0.15) platformun izdüşümü içinde kesiyor mu?
  // (lineBlocked platformları içermez; yapay zekâ/mermi görüşü değişmesin diye ayrı tutuldu)
  slabBlocked(ax, ay, az, bx, by, bz) {
    const i0 = Math.floor(Math.min(ax, bx) / CELL), i1 = Math.floor(Math.max(ax, bx) / CELL);
    const j0 = Math.floor(Math.min(az, bz) / CELL), j1 = Math.floor(Math.max(az, bz) / CELL);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const a = this.platforms.get(this._key(i, j));
      if (!a) continue;
      for (const p of a) {
        const py = p.top - 0.15;
        if ((ay - py) * (by - py) >= 0) continue; // iki uç düzlemin aynı tarafında
        const t = (py - ay) / (by - ay);
        const [lx, lz] = this._local(p, ax + (bx - ax) * t, az + (bz - az) * t);
        if (Math.abs(lx) <= p.hw && Math.abs(lz) <= p.hd) return true;
      }
    }
    return false;
  },

  // groundAt'ın yan etkisiz biçimi (lastPlatform'a dokunmaz; kamera gibi oyuncu dışı sorgular için):
  // arazi ve tepesi yMax'ı aşmayan, noktanın altındaki platformların en yükseği
  floorAt(x, z, yMax = 1e9) {
    let g = terrain.heightAt(x, z);
    const a = this.platforms.get(this._key(Math.floor(x / CELL), Math.floor(z / CELL)));
    if (a) for (const p of a) {
      if (p.top > yMax || p.top <= g) continue;
      const [lx, lz] = this._local(p, x, z);
      if (Math.abs(lx) <= p.hw && Math.abs(lz) <= p.hd) g = p.top;
    }
    return g;
  },

  // Daireyi çarpıştırıcılardan dışarı iter. pos: {x,z}, y: ayak yüksekliği.
  // Köşe/dar aralıkta bir engelden çıkarken diğerine gömülmemek için en çok 3 geçiş yapılır.
  resolve(pos, radius, y, height = 1.8) {
    let any = false;
    for (let pass = 0; pass < 3; pass++) {
      if (!this._resolveOnce(pos, radius, y, height)) break;
      any = true;
    }
    return any;
  },
  _resolveOnce(pos, radius, y, height) {
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

  // Görüş hattı: arazi + çarpıştırıcılar (kaya, ağaç gövdesi, duvar, bina). a ve b göz/hedef yükseklikleri.
  // Hücreler DDA ile yalnız doğrunun geçtiği sırayla gezilir: uzunluk sınırı yok (eski 64 hücre erken dönüşü kaldırıldı).
  // opts: { tMin, tMax, rScale, camera } — mermi süpürmesi için tMin=0, tMax=1, rScale=1 (uçlarda boşluk bırakılmaz);
  // camera: noCam işaretli ve 0,2 m'den ince çember engeller atlanır.
  lineBlocked(ax, ay, az, bx, by, bz, opts = null) {
    const tMin = opts?.tMin ?? 0.02, tMax = opts?.tMax ?? 0.98, rScale = opts?.rScale ?? 0.8;
    const dx = bx - ax, dy = by - ay, dz = bz - az;
    const len = Math.hypot(dx, dz);
    const steps = Math.max(1, Math.ceil(len / 1.5));
    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      if (terrain.heightAt(ax + dx * t, az + dz * t) > ay + dy * t + 0.15) return true;
    }
    if (len < 1e-3) return false;
    const seen = this._seenL || (this._seenL = new Set());
    seen.clear();
    const ux = dx / len, uz = dz / len;
    let ci = Math.floor(ax / CELL), cj = Math.floor(az / CELL);
    const ei = Math.floor(bx / CELL), ej = Math.floor(bz / CELL);
    const si = dx > 0 ? 1 : -1, sj = dz > 0 ? 1 : -1;
    let tMaxX = dx !== 0 ? (((dx > 0 ? ci + 1 : ci) * CELL - ax) / dx) : Infinity;
    let tMaxZ = dz !== 0 ? (((dz > 0 ? cj + 1 : cj) * CELL - az) / dz) : Infinity;
    const tDx = dx !== 0 ? Math.abs(CELL / dx) : Infinity, tDz = dz !== 0 ? Math.abs(CELL / dz) : Infinity;
    for (let n = 0; n < 4096; n++) {
      const a = this.cells.get(this._key(ci, cj));
      if (a) for (const c of a) {
        if (seen.has(c)) continue;
        seen.add(c);
        // kamera: ince/hareketli engeller (fener direği, iskele babası, NPC) görüşü kesmez; yoksa kamera bunlara çarpıp başın
        // dibine (0,4 m) çekiliyor, siyah şapka ekranı kaplıyordu ("arkama duvar geliyor, ekran kararıyor")
        if (opts?.camera && (c.noCam || (c.t === 'c' && c.r < 0.2))) continue;
        let t = -1;
        if (c.t === 'c') {
          // doğru parçasının çembere en yakın noktası
          const px = c.x - ax, pz = c.z - az;
          const proj = Math.max(0, Math.min(len, px * ux + pz * uz));
          const qx = ax + ux * proj - c.x, qz = az + uz * proj - c.z;
          if (qx * qx + qz * qz < c.r * c.r * rScale) t = proj / len;
        } else {
          // yerel uzayda dilim (slab) testi
          const [lax, laz] = this._local(c, ax, az), [lbx, lbz] = this._local(c, bx, bz);
          let t0 = 0, t1 = 1;
          const ddx = lbx - lax, ddz = lbz - laz;
          let ok = true;
          for (const [p0, d, h] of [[lax, ddx, c.hw], [laz, ddz, c.hd]]) {
            if (Math.abs(d) < 1e-6) { if (p0 < -h || p0 > h) { ok = false; break; } continue; }
            let ta = (-h - p0) / d, tb = (h - p0) / d;
            if (ta > tb) [ta, tb] = [tb, ta];
            t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
            if (t0 > t1) { ok = false; break; }
          }
          if (ok) t = t0;
        }
        if (t >= tMin && t <= tMax) {
          const y = ay + dy * t;
          if (y > c.y0 && y < c.y1) return true;
        }
      }
      if ((ci === ei && cj === ej) || Math.min(tMaxX, tMaxZ) > 1) break;
      if (tMaxX < tMaxZ) { ci += si; tMaxX += tDx; } else { cj += sj; tMaxZ += tDz; }
    }
    return false;
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
