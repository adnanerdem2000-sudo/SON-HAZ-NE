import * as THREE from 'three';
import { WORLD_SIZE, SEA_FLOOR } from './worldData.js';
import { computeHeight, islandAt as geoIslandAt, biomeAt as geoBiomeAt, rectMayHaveLand, colorSRGB, distToCavePath as geoCave } from './geo.js';
import { generate } from './terrainGen.js';

// Bölgesel (akışlı) arazi: dünya 160 m'lik karolara bölünür; kameraya uzaklığa göre ayrıntı düzeyi (LOD)
// seçilir ve karo geometrileri arka planda Web Worker'larda üretilir. Yakın karoların 2 m çözünürlüklü
// yükseklik ızgarası fizik/yerleşim sorguları için önbellek olarak kullanılır; diğer yerlerde analitik
// yükseklik fonksiyonu (geo.js) aynı sonucu verir.
//
// Dayanıklılık: işçi başlatılamazsa, yüklenemezse, çökerse ya da yanıt vermezse işler kaybolmaz; aynı
// üretim kodu (terrainGen.js) ana iş parçacığında kareler arasına dilimlenerek çalışır. Hiçbir istek
// sonsuza kadar beklemez: iş başına zaman aşımı, sınırlı yeniden deneme, açık hata ile sonlanma.

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
const JOB_TIMEOUT = { tile: 20000, depth: 45000, grid: 60000 }; // ms; işçi bu sürede yanıt vermezse sağlıksız sayılır
const READY_TIMEOUT = 8000;
const MAX_TRIES = 3;
const LOCAL_BUDGET_MS = 10; // ana iş parçacığı yedeğinde dilim başına üretim süresi (yükleme ekranında artırılır)
// 0 gecikmeli makro görev: setTimeout(0) iç içe çağrılarda ≥4 ms'ye kırpılır; MessageChannel kırpılmaz
const _mc = typeof MessageChannel !== 'undefined' ? new MessageChannel() : null;
const _mcQueue = [];
if (_mc) _mc.port1.onmessage = () => { const f = _mcQueue.shift(); if (f) f(); };
const schedule = (fn) => { if (_mc) { _mcQueue.push(fn); _mc.port2.postMessage(0); } else setTimeout(fn, 0); };

export function distToCavePath(x, z) { return geoCave(x, z); }

export const terrain = {
  HALF, TILE,
  tiles: new Map(),
  ready: false,
  uniforms: null,
  workers: [],       // canlı işçi kayıtları { w, jobs: Map<id, job>, ready, dead, readyTimer }
  fallback: false,   // işçi kalmadı: üretim ana iş parçacığında
  failures: [],      // teşhis: işçi hataları
  mode: '',          // test kipleri: '' | 'noworker' | 'crash' | 'badurl'
  _rid: 1,
  _jobs: new Map(),  // id -> { id, msg, prio, tries, resolve, reject, timer, rec }
  _queue: [],
  _localBusy: false,
  localBudget: LOCAL_BUDGET_MS,
  focus: null,       // prepare() odağı: kamera uzaktayken bile bu çevredeki karolar korunur
  _upd: 0,
  center: { x: 0, z: 0 },

  // ---- işçiler ----
  _workerUrl() {
    // Tek dosya derlemesinde bu ifade blob adresiyle değiştirilir (tools/build-single-html.mjs); import.meta burada kalmaz.
    const url = String(new URL('./terrainWorker.js', import.meta.url));
    if (this.mode === 'badurl') return url.replace(/terrainWorker\.js$|$/, (m) => (m ? 'terrainWorker.missing.js' : '#missing')).replace(/^(blob:.*)#missing$/, '$1-missing');
    return url;
  },
  _initWorkers() {
    if (this.workers.length || this.mode === 'noworker') { if (this.mode === 'noworker') this._setFallback('test kipi: işçi yok'); return; }
    const n = Math.max(1, Math.min(3, (navigator.hardwareConcurrency || 2) - 1));
    for (let i = 0; i < n; i++) {
      let w;
      try { w = new Worker(this._workerUrl(), { type: 'module', name: this.mode === 'crash' ? 'test-crash' : 'arazi-' + i }); }
      catch (e) { this._setFallback('işçi oluşturulamadı: ' + (e.message || e)); return; }
      const rec = { w, jobs: new Map(), ready: false, dead: false, i };
      w.onmessage = (e) => this._onMsg(rec, e.data);
      w.onerror = (e) => { e.preventDefault?.(); this._workerFailed(rec, 'hata: ' + (e.message || 'yükleme/çalışma hatası')); };
      w.onmessageerror = () => this._workerFailed(rec, 'mesaj çözülemedi');
      rec.readyTimer = setTimeout(() => { if (!rec.ready && !rec.dead) this._workerFailed(rec, 'hazır sinyali gelmedi'); }, READY_TIMEOUT);
      this.workers.push(rec);
    }
  },
  _setFallback(why) {
    if (!this.fallback) console.warn('Arazi üretimi ana iş parçacığına alındı (' + why + ')');
    this.fallback = true;
    this.failures.push(why);
  },
  // işçi öldü ya da yanıt vermiyor: sonlandır, işlerini kurtar
  _workerFailed(rec, why) {
    if (rec.dead) return;
    rec.dead = true;
    clearTimeout(rec.readyTimer);
    this.failures.push(`işçi ${rec.i}: ${why}`);
    console.warn(`Arazi işçisi ${rec.i} devre dışı (${why}); ${rec.jobs.size} iş yeniden kuyruğa alınıyor`);
    try { rec.w.terminate(); } catch (e) { /* zaten kapalı */ }
    this.workers = this.workers.filter((r) => r !== rec);
    const jobs = [...rec.jobs.values()];
    rec.jobs.clear();
    for (const job of jobs) {
      clearTimeout(job.timer); job.timer = null; job.rec = null;
      if (job.tries >= MAX_TRIES) this._finish(job, null, new Error('Arazi işi ' + job.msg.t + ' tekrarlanan işçi hatası'));
      else this._queue.unshift(job);
    }
    if (!this.workers.length) this._setFallback(why);
    this._pump();
  },
  _onMsg(rec, m) {
    if (m.t === 'ready') { rec.ready = true; clearTimeout(rec.readyTimer); this._pump(); return; }
    const job = this._jobs.get(m.id);
    if (!job) return; // zaman aşımı/iptal sonrası geç yanıt
    rec.jobs.delete(m.id);
    if (m.t === 'error') { console.error('Arazi işçisi:', m.msg); this._finish(job, null, new Error(m.msg)); }
    else this._finish(job, m, null);
    this._pump();
  },
  _finish(job, result, err) {
    if (job.timer) clearTimeout(job.timer);
    this._jobs.delete(job.id);
    if (err) job.reject(err); else job.resolve(result);
  },
  _request(msg, prio = 0) {
    return new Promise((resolve, reject) => {
      const id = this._rid++;
      msg.id = id;
      const job = { id, msg, prio, tries: 0, resolve, reject, timer: null, rec: null };
      this._jobs.set(id, job);
      this._queue.push(job);
      this._pump();
    });
  },
  _pump() {
    if (!this._queue.length) return;
    this._queue.sort((a, b) => a.prio - b.prio);
    const live = this.workers.filter((r) => !r.dead);
    if (!live.length) { this._localPump(); return; }
    for (const rec of live) {
      while (rec.jobs.size < 2 && this._queue.length) {
        const job = this._queue.shift();
        job.tries++;
        job.rec = rec;
        rec.jobs.set(job.id, job);
        job.timer = setTimeout(() => this._workerFailed(rec, `${job.msg.t} işi ${JOB_TIMEOUT[job.msg.t] / 1000} sn içinde bitmedi`), JOB_TIMEOUT[job.msg.t] || 30000);
        try { rec.w.postMessage(job.msg); }
        catch (e) { this._workerFailed(rec, 'postMessage: ' + (e.message || e)); return; }
      }
    }
  },
  // Yedek: ana iş parçacığında, dilim başına sınırlı süreyle (üreteç ara sıra yield eder); dilim içinde birden çok iş bitebilir
  _localPump() {
    if (this._localBusy || !this._queue.length) return;
    this._localBusy = true;
    let job = null, gen = null;
    const next = () => {
      job = this._queue.shift() || null;
      if (!job) return false;
      job.tries++;
      try { gen = generate(job.msg); return true; }
      catch (e) { this._finish(job, null, e); return next(); }
    };
    if (!next()) { this._localBusy = false; return; }
    const step = () => {
      const t0 = performance.now();
      try {
        for (;;) {
          if (!this._jobs.has(job.id)) { if (!next()) break; continue; } // iptal edildi
          const r = gen.next();
          if (r.done) { this._finish(job, r.value.out, null); if (!next()) break; continue; }
          if (performance.now() - t0 > this.localBudget) { schedule(step); return; }
        }
      } catch (e) { this._finish(job, null, e); if (next()) { schedule(step); return; } }
      this._localBusy = false;
      this._pump();
    };
    schedule(step);
  },
  // test/hata ayıklama: tüm işçileri öldür (kurtarma yolu sınanır)
  killWorkers() { for (const rec of [...this.workers]) this._workerFailed(rec, 'test: işçi sonlandırıldı'); },

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
    // test kipleri: ?terrain=noworker|crash|badurl ya da window.__DK_TERRAIN_MODE
    try { this.mode = (typeof window !== 'undefined' && (window.__DK_TERRAIN_MODE || new URLSearchParams(location.search).get('terrain'))) || ''; } catch (e) { this.mode = ''; }
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
    // hazırlık odağı (ışınlanma/yükleme): kamera henüz gelmemişken bile odak çevresi istenir ve düşürülmez
    const F = this.focus;
    if (F && performance.now() < F.until) {
      const fi0 = Math.max(0, Math.floor((F.x - F.r + HALF) / TILE)), fi1 = Math.min(NT - 1, Math.floor((F.x + F.r + HALF) / TILE));
      const fj0 = Math.max(0, Math.floor((F.z - F.r + HALF) / TILE)), fj1 = Math.min(NT - 1, Math.floor((F.z + F.r + HALF) / TILE));
      for (let j = fj0; j <= fj1; j++) for (let i = fi0; i <= fi1; i++) {
        if (Math.hypot(-HALF + (i + 0.5) * TILE - F.x, -HALF + (j + 0.5) * TILE - F.z) > F.r) continue;
        const seg = this._wantSeg(i, j, F.x, F.z);
        if (!seg) continue;
        const k = tkey(i, j);
        want.add(k);
        let t = this.tiles.get(k);
        if (!t) { t = { i, j, k, x0: -HALF + i * TILE, z0: -HALF + j * TILE, seg: 0, mesh: null, heights: null, pending: 0 }; this.tiles.set(k, t); }
        if (t.seg !== seg && t.pending !== seg) this._requestTile(t, seg, Math.hypot(t.x0 + TILE / 2 - F.x, t.z0 + TILE / 2 - F.z) - 200);
      }
    } else if (F) this.focus = null;
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
    }).catch((e) => { if (t.req === myReq) t.pending = 0; this.failures.push('karo ' + t.k + ': ' + (e?.message || e)); });
  },

  _apply(t, m) {
    if (!m || !m.pos) return;
    t.seg = m.seg;
    t.maxH = m.maxH; t.minH = m.minH;
    t.heights = m.heights || null;
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

  // Bir noktanın çevresini hazırla (yükleme ekranı / ışınlanma): yakın karolar ve okyanus derinliği.
  // Asla asılı kalmaz: her karo isteği başarı/hata ile biter; toplam üst sınır 45 sn.
  async prepare(x, z, opts = {}) {
    if (!this.ready) return;
    // odak: hazırlık süresince ve sonrasında 12 sn boyunca bu çevre korunur (kamera gelene kadar düşürülmez)
    this.focus = { x, z, r: opts.radius || 700, until: performance.now() + 90000 };
    this.update(x, z, true);
    const timers = [];
    const jobs = [];
    for (const t of this.tiles.values()) {
      const d = Math.hypot(t.x0 + TILE / 2 - x, t.z0 + TILE / 2 - z);
      if (t.pending && d < (opts.radius || 700)) jobs.push(new Promise((res) => { const iv = setInterval(() => { if (!t.pending || !this.tiles.has(t.k)) { clearInterval(iv); res(); } }, 30); timers.push(iv); }));
    }
    jobs.push(this.requestDepth(x, z, true));
    let to;
    const timeout = new Promise((res) => { to = setTimeout(() => { console.warn('terrain.prepare: 45 sn zaman aşımı; eksik karolar arka planda tamamlanacak'); res('timeout'); }, opts.timeout || 45000); });
    await Promise.race([Promise.all(jobs), timeout]);
    clearTimeout(to);
    for (const iv of timers) clearInterval(iv);
    if (this.focus) this.focus.until = performance.now() + 12000;
  },

  // ---- okyanus derinlik penceresi (kamerayla birlikte kayar) ----
  depthWin: null,
  requestDepth(x, z, force = false) {
    const size = 2400, res = 512;
    const w = this.depthWin;
    if (!force && w && Math.hypot(x - (w.x0 + size / 2), z - (w.z0 + size / 2)) < 520) return Promise.resolve();
    if (this._depthPending && !force) return this._depthPending;
    const x0 = Math.round((x - size / 2) / 40) * 40, z0 = Math.round((z - size / 2) / 40) * 40;
    const seq = (this._depthSeq = (this._depthSeq || 0) + 1);
    const p = this._request({ t: 'depth', x0, z0, size, res }, force ? -1000 : 50).then((m) => {
      if (seq !== this._depthSeq) return; // daha yeni bir pencere istendi (ışınlanma): eski yanıt yeniyi ezmesin
      this.depthWin = { x0: m.x0, z0: m.z0, size: m.size };
      this._depthPending = null;
      this.onDepth?.(m);
    }).catch((e) => { if (seq === this._depthSeq) this._depthPending = null; this.failures.push('derinlik: ' + (e?.message || e)); });
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
      // çizilen ağla aynı üçgenleme (köşegen b–d: tx + tz = 1): dik yamaçta çizilen yüzeyle fizik yüzeyi aynıdır
      if (tx + tz <= 1) return h00 + (h10 - h00) * tx + (h01 - h00) * tz;
      return h11 + (h01 - h11) * (1 - tx) + (h10 - h11) * (1 - tz);
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
    return { tiles: this.tiles.size, meshes, hires, tris: Math.round(tris), queue: this._queue.length, jobs: this._jobs.size, workers: this.workers.length, fallback: this.fallback, failures: this.failures.length, mode: this.mode };
  },
};
