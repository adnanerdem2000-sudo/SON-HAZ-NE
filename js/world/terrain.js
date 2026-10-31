import * as THREE from 'three';
import { ISLANDS, TERRAIN_MODS, CAVE, WORLD_SIZE, SEA_FLOOR } from './worldData.js';
import { fbm, noise2, smoothstep, lerp, clamp } from '../core/util.js';

// Ek tepe (mağaranın içine oyulduğu tepe)
const BUMPS = [
  { x: 172, z: -58, r: 48, h: 24 },
  { x: -545, z: -470, r: 40, h: 14 },
];

const HALF = WORLD_SIZE / 2;
const CELL = 2; // metre
const N = WORLD_SIZE / CELL + 1;

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

// Analitik yükseklik fonksiyonu (önbelleğe alınır)
function computeHeight(x, z) {
  let h = SEA_FLOOR + fbm(x / 260, z / 260, 3) * 4;
  for (let i = 0; i < ISLANDS.length; i++) {
    const I = ISLANDS[i];
    const dx = x - I.x, dz = z - I.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > I.r * 2.6) continue;
    const a = Math.atan2(dz, dx);
    const rn = fbm(Math.cos(a) * 1.3 + I.seed, Math.sin(a) * 1.3 + I.seed * 0.7, 3) * 0.3 + noise2(x / 45 + I.seed, z / 45) * 0.05;
    const Re = I.r * (1 + rn);
    const d = dist / Re;
    let ih;
    if (d < 1) {
      const beach = 1.5 * smoothstep(1.0, 0.9, d);
      const inner = smoothstep(0.97, 0.0, d);
      const mount = (I.h - 1.5) * Math.pow(inner, 1.5) * (0.62 + 0.38 * fbm(x / 95 + I.seed, z / 95, 3));
      const hills = fbm(x / 48 + I.seed * 3, z / 48, 3) * 6 * I.hill * smoothstep(0.95, 0.6, d);
      ih = beach + Math.max(0, mount + hills);
    } else {
      const t = smoothstep(1.0, 2.1, d);
      ih = SEA_FLOOR * Math.pow(t, 1.25) + fbm(x / 22, z / 22, 2) * 0.9 * (1 - t);
    }
    if (ih > h) h = ih;
  }
  for (const B of BUMPS) {
    const d = Math.hypot(x - B.x, z - B.z);
    if (d < B.r) {
      const k = smoothstep(B.r, 0, d);
      h += B.h * k * k * (0.85 + 0.15 * noise2(x / 12, z / 12));
    }
  }
  for (const M of TERRAIN_MODS) {
    const d = Math.hypot(x - M.x, z - M.z);
    if (M.type === 'flatten') {
      if (d < M.r + M.blend) {
        const k = smoothstep(M.r + M.blend, M.r, d);
        h = lerp(h, M.h, k);
      }
    } else if (M.type === 'dig') {
      if (d < M.r + M.blend) {
        const k = smoothstep(M.r + M.blend, M.r * 0.5, d);
        h = Math.min(h, lerp(h, M.depth, k));
      }
    }
  }
  // Mağara: yol boyunca taban düzleştirilir
  const cd = distToCavePath(x, z);
  const cw = CAVE.width + 0.4;
  if (cd < cw + 3) {
    const k = smoothstep(cw + 3, cw, cd);
    h = lerp(h, CAVE.floor, k);
  }
  const ch = CAVE.chamber;
  const chd = Math.hypot(x - ch.x, z - ch.z);
  if (chd < ch.r + 3) {
    const k = smoothstep(ch.r + 3, ch.r, chd);
    h = lerp(h, CAVE.floor, k);
  }
  return h;
}

export const terrain = {
  grid: null,
  N, CELL, HALF,
  ready: false,

  build(onProgress) {
    // Yükseklik ızgarası (2 m çözünürlük)
    const grid = new Float32Array(N * N);
    for (let j = 0; j < N; j++) {
      const z = -HALF + j * CELL;
      for (let i = 0; i < N; i++) {
        const x = -HALF + i * CELL;
        grid[j * N + i] = computeHeight(x, z);
      }
      if (onProgress && j % 120 === 0) onProgress(j / N);
    }
    this.grid = grid;
    this.ready = true;
  },

  heightAt(x, z) {
    const fx = (x + HALF) / CELL, fz = (z + HALF) / CELL;
    if (fx < 0 || fz < 0 || fx >= N - 1 || fz >= N - 1) return SEA_FLOOR;
    const i = Math.floor(fx), j = Math.floor(fz);
    const tx = fx - i, tz = fz - j;
    const g = this.grid;
    const a = g[j * N + i], b = g[j * N + i + 1], c = g[(j + 1) * N + i], d = g[(j + 1) * N + i + 1];
    return (a * (1 - tx) + b * tx) * (1 - tz) + (c * (1 - tx) + d * tx) * tz;
  },

  normalAt(x, z, out = new THREE.Vector3()) {
    const e = 1.5;
    const hl = this.heightAt(x - e, z), hr = this.heightAt(x + e, z);
    const hd = this.heightAt(x, z - e), hu = this.heightAt(x, z + e);
    return out.set(hl - hr, 2 * e, hd - hu).normalize();
  },

  islandAt(x, z, margin = 1.25) {
    let best = null, bd = Infinity;
    for (const I of ISLANDS) {
      const d = Math.hypot(x - I.x, z - I.z) / I.r;
      if (d < margin && d < bd) { bd = d; best = I; }
    }
    return best;
  },

  biomeAt(x, z) {
    const I = this.islandAt(x, z, 2.2);
    return I ? I.biome : 'deniz';
  },

  // Görsel arazi parçaları
  buildMeshes(scene, quality = 'high') {
    const group = new THREE.Group();
    group.name = 'terrain';
    const TILE = 160;
    const tilesPer = Math.ceil(WORLD_SIZE / TILE);
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0.0 });
    mat.onBeforeCompile = (sh) => {
      // Hafif yüzey dokusu: dünya konumuna bağlı gürültü
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWPos = (modelMatrix * vec4(transformed,1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vWPos;
float th(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float tn(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f);
 return mix(mix(th(i),th(i+vec2(1,0)),f.x), mix(th(i+vec2(0,1)),th(i+vec2(1,1)),f.x), f.y); }`)
        .replace('#include <color_fragment>', `#include <color_fragment>
float tnz = tn(vWPos.xz*0.9)*0.5 + tn(vWPos.xz*3.1)*0.3 + tn(vWPos.xz*0.13)*0.2;
diffuseColor.rgb *= 0.86 + 0.24*tnz;`);
    };
    this.material = mat;
    const hiSeg = quality === 'low' ? 40 : quality === 'medium' ? 64 : 80;
    for (let tj = 0; tj < tilesPer; tj++) {
      for (let ti = 0; ti < tilesPer; ti++) {
        const x0 = -HALF + ti * TILE, z0 = -HALF + tj * TILE;
        // Kara var mı?
        let maxH = -999;
        for (let s = 0; s <= 8; s++) for (let t = 0; t <= 8; t++) {
          maxH = Math.max(maxH, this.heightAt(x0 + (s / 8) * TILE, z0 + (t / 8) * TILE));
        }
        const seg = maxH > -24 ? hiSeg : 6;
        const geo = this._tileGeo(x0, z0, TILE, seg);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.receiveShadow = true;
        mesh.castShadow = maxH > 0;
        mesh.matrixAutoUpdate = false;
        mesh.updateMatrix();
        group.add(mesh);
      }
    }
    scene.add(group);
    this.group = group;
    return group;
  },

  _tileGeo(x0, z0, size, seg) {
    const verts = (seg + 1) * (seg + 1);
    const pos = new Float32Array(verts * 3);
    const nor = new Float32Array(verts * 3);
    const col = new Float32Array(verts * 3);
    const n = new THREE.Vector3();
    const c = new THREE.Color();
    let k = 0;
    for (let j = 0; j <= seg; j++) {
      for (let i = 0; i <= seg; i++) {
        const x = x0 + (i / seg) * size, z = z0 + (j / seg) * size;
        const h = this.heightAt(x, z);
        pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z;
        this.normalAt(x, z, n);
        nor[k * 3] = n.x; nor[k * 3 + 1] = n.y; nor[k * 3 + 2] = n.z;
        this.colorAt(x, z, h, n.y, c);
        col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b;
        k++;
      }
    }
    const idx = new (verts > 65535 ? Uint32Array : Uint16Array)(seg * seg * 6);
    let q = 0;
    for (let j = 0; j < seg; j++) for (let i = 0; i < seg; i++) {
      const a = j * (seg + 1) + i, b = a + 1, d = a + seg + 1, e = d + 1;
      idx[q++] = a; idx[q++] = d; idx[q++] = b;
      idx[q++] = b; idx[q++] = d; idx[q++] = e;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeBoundingSphere();
    return g;
  },

  colorAt(x, z, h, ny, out) {
    const biome = this.biomeAt(x, z);
    const n1 = noise2(x / 30, z / 30), n2 = noise2(x / 7 + 40, z / 7);
    const ghost = biome === 'hayalet';
    const sand = ghost ? [0.70, 0.68, 0.60] : [0.95, 0.87, 0.66];
    const wetSand = ghost ? [0.52, 0.5, 0.45] : [0.80, 0.70, 0.50];
    const grassA = ghost ? [0.30, 0.36, 0.28] : [0.33, 0.62, 0.20];
    const grassB = ghost ? [0.25, 0.27, 0.24] : [0.18, 0.45, 0.14];
    const rock = ghost ? [0.36, 0.34, 0.38] : [0.55, 0.50, 0.44];
    const dirt = [0.55, 0.43, 0.28];
    let r, g, b;
    if (h < -0.4) {
      // Deniz tabanı: kum + mercan lekeleri
      const depth = -h;
      const t = clamp(depth / 26, 0, 1);
      r = lerp(0.88, 0.45, t); g = lerp(0.80, 0.48, t); b = lerp(0.60, 0.45, t);
      if (depth > 1.2 && depth < 10 && !ghost) {
        const coral = noise2(x / 6, z / 6);
        if (coral > 0.45) {
          const pick = noise2(x / 3 + 9, z / 3);
          if (pick > 0.2) { r = 0.95; g = 0.45; b = 0.50; }
          else if (pick > -0.3) { r = 0.98; g = 0.62; b = 0.25; }
          else { r = 0.62; g = 0.38; b = 0.75; }
        } else if (coral > 0.3) { r *= 0.7; g *= 0.8; b *= 0.7; }
      }
      if (n2 > 0.55) { r *= 0.85; g *= 0.9; b *= 0.85; }
    } else if (h < 1.0) {
      const t = smoothstep(-0.4, 1.0, h);
      r = lerp(wetSand[0], sand[0], t); g = lerp(wetSand[1], sand[1], t); b = lerp(wetSand[2], sand[2], t);
    } else if (h < 2.3 + n1 * 0.5) {
      r = sand[0]; g = sand[1]; b = sand[2];
      const t = smoothstep(1.6 + n1 * 0.5, 2.3 + n1 * 0.5, h);
      r = lerp(r, grassA[0], t); g = lerp(g, grassA[1], t); b = lerp(b, grassA[2], t);
    } else {
      const t = clamp(n1 * 0.5 + 0.5, 0, 1);
      r = lerp(grassA[0], grassB[0], t); g = lerp(grassA[1], grassB[1], t); b = lerp(grassA[2], grassB[2], t);
      if (n2 > 0.5) { r = lerp(r, dirt[0], 0.5); g = lerp(g, dirt[1], 0.5); b = lerp(b, dirt[2], 0.5); }
      const rockT = smoothstep(0.82, 0.68, ny) + smoothstep(38, 52, h) * 0.8;
      const rt = clamp(rockT, 0, 1);
      r = lerp(r, rock[0], rt); g = lerp(g, rock[1], rt); b = lerp(b, rock[2], rt);
    }
    // Liman çevresi patika
    const pd = Math.hypot(x - 10, z - 215);
    if (pd < 75 && h > 1.5) {
      const t = smoothstep(75, 55, pd) * (0.55 + 0.25 * n2);
      r = lerp(r, 0.62, t); g = lerp(g, 0.52, t); b = lerp(b, 0.36, t);
    }
    // Mağara tabanı
    if (distToCavePath(x, z) < CAVE.width + 1 || Math.hypot(x - CAVE.chamber.x, z - CAVE.chamber.z) < CAVE.chamber.r + 1) {
      r = 0.36; g = 0.32; b = 0.28;
    }
    out.setRGB(r, g, b, THREE.SRGBColorSpace);
    return out;
  },

  // Su shader'ı için yükseklik dokusu
  heightTexture(res = 512) {
    const data = new Uint16Array(res * res);
    for (let j = 0; j < res; j++) for (let i = 0; i < res; i++) {
      const x = -HALF + (i + 0.5) / res * WORLD_SIZE;
      const z = -HALF + (j + 0.5) / res * WORLD_SIZE;
      data[j * res + i] = THREE.DataUtils.toHalfFloat(this.heightAt(x, z));
    }
    const tex = new THREE.DataTexture(data, res, res, THREE.RedFormat, THREE.HalfFloatType);
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    return tex;
  },
};
