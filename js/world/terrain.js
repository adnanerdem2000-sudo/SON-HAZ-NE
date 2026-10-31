import * as THREE from 'three';
import { WORLD_SIZE, SEA_FLOOR } from './worldData.js';
import { computeHeight, islandAt as geoIslandAt, biomeAt as geoBiomeAt, rectMayHaveLand, colorSRGB, distToCavePath as geoCave } from './geo.js';

// Bölgesel (akışlı) arazi: dünya 160 m'lik karolara bölünür; kameraya uzaklığa göre ayrıntı düzeyi (LOD)
// seçilir ve karo geometrileri arka planda Web Worker'larda üretilir. Yakın karoların 2 m çözünürlüklü
// yükseklik ızgarası fizik/yerleşim sorguları için önbellek olarak kullanılır; diğer yerlerde analitik
// yükseklik fonksiyonu (geo.js) aynı sonucu verir.

export const TILE = 160;
const HALF = WORLD_SIZE / 2;
const NT = WORLD_SIZE / TILE;
const HI_SEG = 80; // 2 m
const LODS = [
  { d: 380, seg: HI_SEG },
  { d: 950, seg: 32 },
  { d: 1750, seg: 16 },
  { d: 2700, seg: 8 },
];
const DEEP_VIEW = 300; // derin deniz karoları yalnızca yakında (su altı görüşü)
const tkey = (i, j) => i * 1024 + j;

export function distToCavePath(x, z) { return geoCave(x, z); }

export const terrain = {
  HALF, TILE,
  tiles: new Map(),
  ready: false,
  uniforms: null,
  workers: [],
  _rid: 1,
  _cb: new Map(),
  _busy: 0,
  _queue: [],
  _upd: 0,
  center: { x: 0, z: 0 },

  // ---- işçiler ----
  _initWorkers() {
    if (this.workers.length) return;
    const n = Math.max(1, Math.min(3, (navigator.hardwareConcurrency || 2) - 1));
    for (let i = 0; i < n; i++) {
      let w;
      try { w = new Worker(new URL('./terrainWorker.js', import.meta.url), { type: 'module' }); }
      catch (e) { console.warn('Arazi işçisi başlatılamadı, ana iş parçacığında üretilecek', e); this.workers = []; return; }
      w.inflight = 0;
      w.onmessage = (e) => this._onMsg(w, e.data);
      w.onerror = (e) => console.error('Arazi işçisi hatası', e.message || e);
      this.workers.push(w);
    }
  },
  _onMsg(w, m) {
    if (m.t === 'ready') return;
    w.inflight = Math.max(0, w.inflight - 1);
    const cb = this._cb.get(m.id);
    this._cb.delete(m.id);
    if (m.t === 'error') { console.error('Arazi işçisi:', m.msg); cb?.reject?.(new Error(m.msg)); }
    else cb?.resolve(m);
    this._pump();
  },
  _request(msg, prio = 0) {
    return new Promise((resolve, reject) => {
      const id = this._rid++;
      msg.id = id;
      this._cb.set(id, { resolve, reject });
      this._queue.push({ msg, prio });
      this._pump();
    });
  },
  _pump() {
    if (!this._queue.length) return;
    if (!this.workers.length) {
      // yedek: ana iş parçacığında (yavaş ama güvenli)
      const job = this._queue.shift();
      setTimeout(() => this._localJob(job.msg), 0);
      return;
    }
    this._queue.sort((a, b) => a.prio - b.prio);
    for (const w of this.workers) {
      while (w.inflight < 2 && this._queue.length) {
        const job = this._queue.shift();
        w.inflight++;
        w.postMessage(job.msg);
      }
    }
  },
  async _localJob(msg) {
    // işçi yoksa aynı hesap burada (yalnız acil durum)
    const cb = this._cb.get(msg.id);
    this._cb.delete(msg.id);
    if (msg.t === 'tile') {
      const n = msg.seg + 1, step = msg.size / msg.seg;
      const heights = new Float32Array(n * n);
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) heights[j * n + i] = computeHeight(msg.x0 + i * step, msg.z0 + j * step);
      cb?.resolve({ t: 'tile', key: msg.key, seg: msg.seg, heights, local: true, maxH: Math.max(...heights), minH: Math.min(...heights) });
    }
    this._pump();
  },

  // ---- malzeme ----
  _material() {
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0.0 });
    // gelgit çizgisi, ıslak kum, kıyı köpüğü ve sığ sularda kostik ışık desenleri
    this.uniforms = { uTide: { value: 0 }, uTTime: { value: 0 }, uWet: { value: 0 }, uCaustic: { value: 1 }, uSnow: { value: 0 } };
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.uniforms);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nvarying float vSlope;')
        .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
vWPos = (modelMatrix * vec4(transformed,1.0)).xyz;
vec3 tWN = normalize(mat3(modelMatrix) * objectNormal);
vSlope = sqrt(max(1.0 - tWN.y*tWN.y, 0.0)) / max(tWN.y, 0.05);`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vWPos;
varying float vSlope;
uniform float uTide, uTTime, uWet, uCaustic, uSnow;
float th(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float tn(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f);
 return mix(mix(th(i),th(i+vec2(1,0)),f.x), mix(th(i+vec2(0,1)),th(i+vec2(1,1)),f.x), f.y); }
float tWet = 0.0;`)
        .replace('#include <color_fragment>', `#include <color_fragment>
float tnz = tn(vWPos.xz*0.9)*0.5 + tn(vWPos.xz*3.1)*0.3 + tn(vWPos.xz*0.13)*0.2;
diffuseColor.rgb *= 0.86 + 0.24*tnz;
float tAbove = vWPos.y - uTide;
// ıslak kum bandı (su çizgisinin hemen üstü, yatayda birkaç metre) ve yağmur ıslaklığı
float tSl = max(vSlope, 0.02);
float tBand = (1.0 - smoothstep(1.0, 4.5 + 2.5*tnz, tAbove / tSl)) * (1.0 - smoothstep(0.35, 0.9, tAbove)) * step(-0.6, tAbove);
tWet = clamp(max(tBand, uWet * 0.7), 0.0, 1.0);
diffuseColor.rgb *= 1.0 - 0.3 * tWet;
// kar yağışı birikintisi (buzul bölgesinde düz yüzeylere)
float tSnowK = uSnow * smoothstep(0.55, 0.25, vSlope) * smoothstep(0.8, 1.6, tAbove) * (0.75 + 0.25*tnz);
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.92, 0.95, 1.0), tSnowK);
`)
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
roughnessFactor = mix(roughnessFactor, 0.3, tWet * 0.85);`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
float tDepth = -tAbove;
if (tDepth > 0.05 && uCaustic > 0.01) {
  vec2 cp = vWPos.xz * 0.42;
  float c1 = 1.0 - abs(tn(cp + vec2(uTTime*0.35, uTTime*0.2))*2.0 - 1.0);
  float c2 = 1.0 - abs(tn(cp*1.6 - vec2(uTTime*0.25, -uTTime*0.31) + 4.7)*2.0 - 1.0);
  float ca = pow(c1 * c2, 6.0) * smoothstep(0.05, 0.8, tDepth) * (1.0 - smoothstep(3.0, 12.0, tDepth));
  totalEmissiveRadiance += vec3(0.55, 0.85, 0.9) * ca * uCaustic;
}`);
    };
    return mat;
  },

  // ---- kurulum ----
  init(scene, quality = 'high') {
    this.scene = scene;
    this.quality = quality;
    this.group = new THREE.Group();
    this.group.name = 'terrain';
    scene.add(this.group);
    this.material = this._material();
    this.lodScale = quality === 'low' ? 0.7 : quality === 'medium' ? 0.85 : 1;
    this._initWorkers();
    this.ready = true;
  },

  // eski API uyumluluğu
  build() {},
  buildMeshes(scene, quality) { this.init(scene, quality); },

  _wantSeg(i, j, cx, cz) {
    const x = -HALF + (i + 0.5) * TILE, z = -HALF + (j + 0.5) * TILE;
    const d = Math.max(0, Math.hypot(x - cx, z - cz) - TILE * 0.5);
    const land = this._land(i, j);
    if (!land) return d < DEEP_VIEW ? 8 : 0;
    for (const L of LODS) if (d < L.d * this.lodScale) return L.seg;
    return 0;
  },
  _land(i, j) {
    const k = tkey(i, j);
    let v = this._landCache?.get(k);
    if (v === undefined) {
      if (!this._landCache) this._landCache = new Map();
      const x0 = -HALF + i * TILE, z0 = -HALF + j * TILE;
      v = rectMayHaveLand(x0, z0, x0 + TILE, z0 + TILE);
      this._landCache.set(k, v);
    }
    return v;
  },

  // Kamera çevresindeki karoları iste / LOD değiştir / uzaktakileri boşalt
  update(cx, cz, force = false) {
    if (!this.ready) return;
    this._upd -= 1;
    if (this._upd > 0 && !force) return;
    this._upd = 12;
    this.center.x = cx; this.center.z = cz;
    const R = LODS[LODS.length - 1].d * this.lodScale + TILE;
    const i0 = Math.max(0, Math.floor((cx - R + HALF) / TILE)), i1 = Math.min(NT - 1, Math.floor((cx + R + HALF) / TILE));
    const j0 = Math.max(0, Math.floor((cz - R + HALF) / TILE)), j1 = Math.min(NT - 1, Math.floor((cz + R + HALF) / TILE));
    const want = new Set();
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const seg = this._wantSeg(i, j, cx, cz);
      if (!seg) continue;
      const k = tkey(i, j);
      want.add(k);
      let t = this.tiles.get(k);
      if (!t) { t = { i, j, k, x0: -HALF + i * TILE, z0: -HALF + j * TILE, seg: 0, mesh: null, heights: null, pending: 0 }; this.tiles.set(k, t); }
      // histerezis: yalnızca gerçekten farklıysa yeniden üret
      if (t.seg !== seg && t.pending !== seg) this._requestTile(t, seg, Math.hypot(t.x0 + TILE / 2 - cx, t.z0 + TILE / 2 - cz));
    }
    for (const [k, t] of this.tiles) {
      if (want.has(k)) continue;
      const d = Math.hypot(t.x0 + TILE / 2 - cx, t.z0 + TILE / 2 - cz);
      if (d > R + TILE * 2) this._drop(t);
    }
  },

  _requestTile(t, seg, dist) {
    t.pending = seg;
    const myReq = { seg };
    t.req = myReq;
    const prio = dist + (seg === HI_SEG ? -400 : 0);
    return this._request({ t: 'tile', key: t.k, x0: t.x0, z0: t.z0, size: TILE, seg, hires: seg === HI_SEG }, prio).then((m) => {
      if (t.req !== myReq || !this.tiles.has(t.k)) return;
      t.pending = 0;
      this._apply(t, m);
    }).catch(() => { t.pending = 0; });
  },

  _apply(t, m) {
    t.seg = m.seg;
    t.maxH = m.maxH; t.minH = m.minH;
    t.heights = m.heights || null;
    if (m.local) return; // yalnız yükseklik (yedek yol)
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(m.pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(m.nor, 3));
    g.setAttribute('color', new THREE.BufferAttribute(m.col, 3));
    g.setIndex(new THREE.BufferAttribute(m.idx, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(t.x0 + TILE / 2, (m.maxH + m.minH) / 2, t.z0 + TILE / 2), Math.hypot(TILE * 0.71, (m.maxH - m.minH) / 2 + 4));
    if (t.mesh) { t.mesh.geometry.dispose(); t.mesh.geometry = g; }
    else {
      t.mesh = new THREE.Mesh(g, this.material);
      t.mesh.matrixAutoUpdate = false;
      t.mesh.receiveShadow = true;
      this.group.add(t.mesh);
    }
    t.mesh.castShadow = m.maxH > 0 && m.seg >= 32;
  },

  _drop(t) {
    if (t.mesh) { this.group.remove(t.mesh); t.mesh.geometry.dispose(); }
    t.req = null;
    this.tiles.delete(t.k);
  },

  // Bir noktanın çevresini hazırla (yükleme ekranı / ışınlanma): yakın karolar ve okyanus derinliği
  async prepare(x, z, opts = {}) {
    if (!this.ready) return;
    this.update(x, z, true);
    const jobs = [];
    for (const t of this.tiles.values()) {
      const d = Math.hypot(t.x0 + TILE / 2 - x, t.z0 + TILE / 2 - z);
      if (t.pending && d < (opts.radius || 700)) jobs.push(new Promise((res) => { const iv = setInterval(() => { if (!t.pending || !this.tiles.has(t.k)) { clearInterval(iv); res(); } }, 30); }));
    }
    jobs.push(this.requestDepth(x, z, true));
    await Promise.all(jobs);
  },

  // ---- okyanus derinlik penceresi (kamerayla birlikte kayar) ----
  depthWin: null,
  requestDepth(x, z, force = false) {
    const size = 2400, res = 512;
    const w = this.depthWin;
    if (!force && w && Math.hypot(x - (w.x0 + size / 2), z - (w.z0 + size / 2)) < 520) return Promise.resolve();
    if (this._depthPending && !force) return this._depthPending;
    const x0 = Math.round((x - size / 2) / 40) * 40, z0 = Math.round((z - size / 2) / 40) * 40;
    const p = this._request({ t: 'depth', x0, z0, size, res }, force ? -1000 : 50).then((m) => {
      this.depthWin = { x0: m.x0, z0: m.z0, size: m.size };
      this._depthPending = null;
      this.onDepth?.(m);
    }).catch(() => { this._depthPending = null; });
    this._depthPending = p;
    return p;
  },

  // harita/minimap ızgarası (yükseklik + biyom)
  requestGrid(x0, z0, size, res, prio = 200) {
    return this._request({ t: 'grid', x0, z0, size, res }, prio);
  },

  // ---- sorgular ----
  heightAt(x, z) {
    const fi = (x + HALF) / TILE, fj = (z + HALF) / TILE;
    const i = Math.floor(fi), j = Math.floor(fj);
    const t = this.tiles.get(tkey(i, j));
    if (t && t.heights) {
      const n = t.seg + 1;
      const u = (fi - i) * t.seg, v = (fj - j) * t.seg;
      let a = Math.floor(u), b = Math.floor(v);
      if (a >= t.seg) a = t.seg - 1;
      if (b >= t.seg) b = t.seg - 1;
      const tx = u - a, tz = v - b;
      const H = t.heights;
      const h00 = H[b * n + a], h10 = H[b * n + a + 1], h01 = H[(b + 1) * n + a], h11 = H[(b + 1) * n + a + 1];
      return (h00 * (1 - tx) + h10 * tx) * (1 - tz) + (h01 * (1 - tx) + h11 * tx) * tz;
    }
    if (x < -HALF || z < -HALF || x > HALF || z > HALF) return SEA_FLOOR;
    return computeHeight(x, z);
  },

  normalAt(x, z, out = new THREE.Vector3()) {
    const e = 1.5;
    const hl = this.heightAt(x - e, z), hr = this.heightAt(x + e, z);
    const hd = this.heightAt(x, z - e), hu = this.heightAt(x, z + e);
    return out.set(hl - hr, 2 * e, hd - hu).normalize();
  },

  islandAt(x, z, margin = 1.25) { return geoIslandAt(x, z, margin); },
  biomeAt(x, z) { return geoBiomeAt(x, z); },

  colorAt(x, z, h, ny, out = new THREE.Color()) {
    const c = colorSRGB(x, z, h, ny, [0, 0, 0]);
    return out.setRGB(c[0], c[1], c[2], THREE.SRGBColorSpace);
  },

  stats() {
    let meshes = 0, hires = 0, tris = 0;
    for (const t of this.tiles.values()) { if (t.mesh) { meshes++; tris += t.mesh.geometry.index.count / 3; } if (t.heights) hires++; }
    return { tiles: this.tiles.size, meshes, hires, tris: Math.round(tris), queue: this._queue.length, workers: this.workers.length };
  },
};
