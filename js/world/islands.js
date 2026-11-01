import * as THREE from 'three';
import { G } from '../game/ctx.js';
import { assets } from '../core/assets.js';
import { kk } from '../core/kk.js';
import { terrain } from './terrain.js';
import { physics } from './physics.js';
import { ocean } from './ocean.js';
import { sky } from './sky.js';
import { EXTRA_ISLANDS, BOSS_SITES } from './archipelago.js';
import { DIG_SITES } from './worldData.js';
import { ports } from './ports.js';
import { Ship } from '../ship/ship.js';
import { enemies } from '../game/enemies.js';
import { npcs } from '../game/npcs.js';
import { interact } from '../game/interact.js';
import { audio } from '../core/audio.js';
import { effects } from '../game/effects.js';
import { rng, clamp, smoothstep } from '../core/util.js';
import { rimAll } from '../core/rim.js';
import { woodPlanks } from '../core/textures.js';

// Büyük dünyanın adaları: oyuncu yaklaşınca (≈750 m) içerik kurulur, uzaklaşınca boşaltılır.
// Bitki örtüsü ve tekrarlanan yapı parçaları örneklenmiş (InstancedMesh) çizilir; çarpıştırıcılar ada
// etiketiyle eklenir ve boşaltmada kaldırılır. Her ada kendi tohumuyla her seferinde aynı kurulur.

const BUILD_D = 750, DROP_D = 1150;
// Ada içeriği arka planda karelere bölünerek kurulur: kare başına STEP_MS ms iş (tek karede 40–140 ms
// takılma yerine). Oyuncu adanın kıyısına NEAR_D m'den yakınsa (ışınlanma, kayıt yükleme, hızlı yolculuk)
// kurulum beklemeden aynı karede tamamlanır.
const STEP_MS = 3, NEAR_D = 250;

// Tapınak bulmacasının kalıcı durumu { seq, done }. Eski kayıtlarda (ve yeniden kurulmuş adalarda) çalışma zamanı sarmalayıcısı
// { state, gate, cx, ... } — iç içe olabilir — kaydedilmiş olabilir: en içteki durum çıkarılır.
function puzzleState(v) {
  let s = v;
  for (let i = 0; i < 16 && s && typeof s === 'object' && !Array.isArray(s.seq) && s.state; i++) s = s.state;
  return s && typeof s === 'object' && Array.isArray(s.seq) ? { seq: s.seq.filter((x) => x === 0 || x === 1 || x === 2), done: s.done === true } : { seq: [], done: false };
}
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _e = new THREE.Euler();
const _n = new THREE.Vector3();

// ---- model parçası önbelleği (geometri paylaşılır; adalar arasında yeniden kullanılır) ----
const PARTS = new Map();
function assetParts(name) {
  let p = PARTS.get('a:' + name);
  if (!p) {
    const parts = assets.meshParts(name);
    const box = new THREE.Box3();
    for (const q of parts) { q.geometry.computeBoundingBox(); box.union(q.geometry.boundingBox); }
    p = { parts: parts.map((q) => ({ geometry: q.geometry, material: q.material, local: null })), h: box.max.y - box.min.y || 1, box };
    PARTS.set('a:' + name, p);
  }
  return p;
}
function kitParts(kit, name) {
  const key = 'k:' + kit + ':' + name;
  let p = PARTS.get(key);
  if (!p) {
    const root = kk.part(kit, name);
    root.updateMatrixWorld(true);
    const parts = [];
    const box = new THREE.Box3();
    root.traverse((o) => { if (o.isMesh) { parts.push({ geometry: o.geometry, material: o.material, local: o.matrixWorld.clone() }); } });
    box.setFromObject(root);
    p = { parts, h: box.max.y - box.min.y || 1, box };
    PARTS.set(key, p);
  }
  return p;
}
function partsOf(id) {
  if (id.startsWith('kk:')) { const [, kit, name] = id.split(':'); return kitParts(kit, name); }
  return assetParts(id);
}

// ---- örneklenmiş çizim toplayıcı ----
// Örnekler 160 m'lik hücrelere bölünür: hücre başına ayrı InstancedMesh → görüş konisi ayıklaması ve
// uzaklığa göre gizleme/gölge kapatma (LOD) hücre düzeyinde yapılır.
const VCELL = 160;
class Batch {
  constructor() { this.map = new Map(); this.cells = []; }
  // h: istenen yükseklik (m) ya da s: doğrudan ölçek; small: yalnız yakında çizilen küçük süs
  add(id, x, y, z, { h = null, s = null, yaw = 0, rx = 0, rz = 0, tint = null, moss = null, boost = 1, shadow = true, small = false } = {}) {
    const P = partsOf(id);
    const sc = s ?? (h ? h / P.h : 1);
    const ci = Math.floor(x / VCELL), cj = Math.floor(z / VCELL);
    const key = id + (tint !== null ? '|' + tint : '') + (moss !== null ? '|m' + moss : '') + (boost !== 1 ? '|b' + boost : '') + '|' + ci + ',' + cj;
    let b = this.map.get(key);
    if (!b) this.map.set(key, (b = { id, P, tint, moss, boost, list: [], shadow, small, cx: (ci + 0.5) * VCELL, cz: (cj + 0.5) * VCELL }));
    b.list.push({ x, y, z, sc, yaw, rx, rz });
    return sc;
  }
  build(group, matsOut) { const it = this.steps(group, matsOut); while (!it.next().done); }
  // build'in adım adım hâli: her örnek grubundan sonra durulabilir (zaman dilimli ada kurulumu)
  *steps(group, matsOut) {
    const tinted = new Map();
    for (const b of this.map.values()) {
      for (const part of b.P.parts) {
        let mat = part.material;
        if (b.tint !== null || b.moss !== null || b.boost !== 1) {
          const tk = part.material.uuid + '|' + b.tint + '|' + b.moss + '|' + b.boost;
          mat = tinted.get(tk);
          if (!mat) {
            mat = part.material.clone();
            const c = mat.color;
            // yeşil (yosun/ot) parçalar biyoma göre kar/kum/kül rengine boyanır
            if (b.moss !== null && c.g > c.r * 1.15 && c.g > c.b * 1.15) c.set(b.moss);
            else if (b.tint !== null) c.multiply(new THREE.Color(b.tint));
            if (b.boost !== 1) c.multiplyScalar(b.boost);
            matsOut.push(mat); tinted.set(tk, mat);
          }
        }
        const im = new THREE.InstancedMesh(part.geometry, mat, b.list.length);
        b.list.forEach((t, i) => {
          _e.set(t.rx, t.yaw, t.rz); _q.setFromEuler(_e); _s.setScalar(t.sc); _p.set(t.x, t.y, t.z);
          _m.compose(_p, _q, _s);
          if (part.local) _m.multiply(part.local);
          im.setMatrixAt(i, _m);
        });
        im.castShadow = b.shadow; im.receiveShadow = true;
        im.computeBoundingSphere();
        im.userData.cell = { x: b.cx, z: b.cz, small: b.small, shadow: b.shadow };
        group.add(im);
        this.cells.push(im);
      }
      yield;
    }
  }
}

// ---- bitki örtüsü tabloları (yükseklik metre; col: çarpışma yarıçapı/yükseklik oranı) ----
const VEG = {
  tropik: [
    { a: 'tree_palm', w: 6, zone: 'beach', h: [6, 9], col: 0.05, tilt: 0.25 },
    { a: 'tree_palm', w: 2, zone: 'in', h: [7, 10], col: 0.05, tilt: 0.15 },
    { a: 'tree_fat', w: 4, zone: 'in', h: [5, 8], col: 0.08 },
    { a: 'tree_oak', w: 3, zone: 'in', h: [6, 9], col: 0.08 },
    { a: 'bush_large', w: 5, zone: 'in', h: [1.6, 2.8] },
    { a: 'bush', w: 6, zone: 'any', h: [0.8, 1.4] },
    { a: 'flower_red', w: 3, zone: 'in', h: [0.35, 0.5] },
    { a: 'rock_large', w: 1.5, zone: 'any', h: [0.45, 0.95], col: 1.4 },
    { a: 'rock_small', w: 2.5, zone: 'any', h: [0.3, 0.7] },
  ],
  cangil: [
    { a: 'tree_palm', w: 4, zone: 'beach', h: [7, 10], col: 0.05, tilt: 0.25 },
    { a: 'tree_fat', w: 7, zone: 'in', h: [7, 11], col: 0.08, tint: 0x9fd890 },
    { a: 'tree_oak', w: 5, zone: 'in', h: [8, 12], col: 0.08, tint: 0x88c080 },
    { a: 'bush_large', w: 8, zone: 'in', h: [2, 3.4], tint: 0x9ad08a },
    { a: 'bush', w: 6, zone: 'any', h: [1, 1.6] },
    { a: 'flower_red', w: 4, zone: 'in', h: [0.4, 0.6] },
    { a: 'mushroom_red', w: 2, zone: 'in', h: [0.3, 0.6] },
    { a: 'rock_large', w: 1, zone: 'any', h: [0.45, 0.95], col: 1.4, tint: 0xa0a890 },
  ],
  buzul: [
    { a: 'tree_pine', w: 6, zone: 'in', h: [6, 10], col: 0.06, tint: 0xd8e4ec },
    { a: 'tree_pine_tall', w: 4, zone: 'in', h: [9, 14], col: 0.06, tint: 0xd0dce6 },
    { a: 'rock_large', w: 3, zone: 'any', h: [0.45, 0.95], col: 1.4, tint: 0xb8c4d0, moss: 0xf2f6ff },
    { a: 'rock_tall', w: 1, zone: 'in', h: [4, 8], col: 0.42, tint: 0xb0bccb, moss: 0xf2f6ff, boost: 1.2 },
    { a: 'crystal_rock', w: 1.5, zone: 'any', h: [1, 2.2], col: 0.7, tint: 0xb8e8ff },
    { a: 'rock_small', w: 3, zone: 'any', h: [0.3, 0.8], tint: 0xc0c8d0, moss: 0xf2f6ff },
    { a: 'bush', w: 1.5, zone: 'in', h: [0.6, 1], tint: 0xa8b8a0 },
  ],
  volkan: [
    { a: 'tree_dark', w: 1, zone: 'in', h: [4, 7], col: 0.08, tint: 0x9a8a80 },
    { a: 'kk:graveyard:tree_dead_large', w: 3, zone: 'in', h: [4, 7], col: 0.06, tint: 0x7a6658 },
    { a: 'kk:graveyard:tree_dead_medium', w: 3, zone: 'any', h: [2.5, 4], tint: 0x7a6658 },
    { a: 'rock_large', w: 4, zone: 'any', h: [0.45, 0.95], col: 1.4, tint: 0x5a5452, moss: 0x5a504c },
    { a: 'rock_tall', w: 2, zone: 'in', h: [5, 10], col: 0.42, tint: 0x4a4444, moss: 0x6a3020 },
    { a: 'crystal_rock', w: 1.5, zone: 'in', h: [1, 2.4], col: 0.7, tint: 0x6a2a20 },
    { a: 'rock_small', w: 3, zone: 'any', h: [0.3, 0.8], tint: 0x5a5a5a, moss: 0x5a504c },
    { a: 'bush', w: 1.5, zone: 'in', h: [0.6, 1], tint: 0x8a8a50 },
  ],
  col: [
    { a: 'cactus', w: 5, zone: 'in', h: [2, 4.5], col: 0.12, boost: 1.5 },
    { a: 'rock_tall', w: 2, zone: 'in', h: [5, 12], col: 0.42, tint: 0xffb080, moss: 0xe0b878, boost: 1.35 },
    { a: 'rock_large', w: 3, zone: 'any', h: [0.45, 0.95], col: 1.4, tint: 0xffb088, moss: 0xe0c088, boost: 1.2 },
    { a: 'rock_small', w: 3, zone: 'any', h: [0.3, 0.8], tint: 0xffc0a0, moss: 0xe0c088, boost: 1.2 },
    { a: 'bush', w: 4, zone: 'in', h: [0.6, 1.1], tint: 0xc8b070 },
    { a: 'kk:graveyard:tree_dead_small', w: 1.5, zone: 'in', h: [2, 3.5], tint: 0x8a6a48 },
    { a: 'tree_palm', w: 1, zone: 'beach', h: [5, 7], col: 0.05, tilt: 0.2 },
  ],
  hayalet: [
    { a: 'tree_dark', w: 4, zone: 'in', h: [5, 8], col: 0.08, tint: 0x8a8a9a },
    { a: 'kk:graveyard:tree_dead_large', w: 3, zone: 'in', h: [4, 7], col: 0.06 },
    { a: 'kk:graveyard:tree_dead_medium', w: 3, zone: 'any', h: [2.5, 4] },
    { a: 'kk:graveyard:gravestone', w: 1.5, zone: 'in', h: [1, 1.5] },
    { a: 'kk:graveyard:grave_A_destroyed', w: 1, zone: 'in', h: [0.8, 1.2] },
    { a: 'rock_large', w: 2, zone: 'any', h: [0.45, 0.95], col: 1.4, tint: 0x9a9aa6, moss: 0x5a6a5a },
    { a: 'mushroom_red', w: 1.5, zone: 'in', h: [0.3, 0.6], tint: 0x90ffd0 },
  ],
};

// liman kasabası binaları (KayKit Medieval Hexagon, ×ölçek)
const TOWN_S = 6.2;
const NPC_NAMES = {
  general: ['Tüccar Kemal', 'Tüccar Ayla', 'Tüccar Recep', 'Tüccar Zehra', 'Tüccar Halim', 'Tüccar Nur'],
  treasure: ['Mücevherci Selma', 'Kuyumcu Davut', 'Sarraf Melek', 'Hazineci Oğuz', 'Kuyumcu Peri'],
  travel: ['Rota Kaptanı Fikret', 'Rota Kaptanı Deniz', 'Rota Kaptanı Gül', 'Rota Kaptanı Barbaros', 'Rota Kaptanı Ece'],
  shipwright: ['Usta Cemal', 'Usta Sevgi', 'Usta Rıfat', 'Usta Leyla', 'Usta Temel'],
  smuggler: ['Kaçakçı Gölge', 'Kaçakçı Tilki', 'Kaçakçı Yarasa'],
  prisoner: ['Tutsak Denizci Ali', 'Tutsak Topçu Hasan', 'Tutsak Gemici Elif'],
  gambler: ['Zarcı Şirin', 'Kumarbaz Tahsin', 'Zarcı Lütfiye', 'Kumarbaz Bekir', 'Zarcı Necmi'],
};
const LOOK_POOL = [
  { gender: 'm', body: 'kaba', skin: 3, hairColor: 2, beardColor: 2, hat: 'tricorn', hatColor: '#3a2a1a', shirtColor: '#e8dcc2', pantsColor: '#3b2a1a', coat: 'uzun', coatColor: '#2a4a6a' },
  { gender: 'f', body: 'cevik', skin: 2, hairColor: 5, hat: 'bandana', hatColor: '#2a7a5a', shirtColor: '#e8dcc2', pantsColor: '#4a2a4a', earring: 'altin' },
  { gender: 'm', body: 'subay', skin: 5, hairColor: 0, beard: 'biyik', beardColor: 0, hat: 'kaptan', hatColor: '#1a2a4a', shirtColor: '#2a3a5a', pantsColor: '#2a2a2a' },
  { gender: 'f', body: 'kahin', skin: 4, hairColor: 7, hat: 'yok', shirtColor: '#6a2a4a', coatColor: '#c8a040', necklace: 'altin' },
  { gender: 'm', body: 'kaba', skin: 6, hairColor: 1, beardColor: 1, hat: 'bandana', hatColor: '#a03020', shirtColor: '#5a3a2a', pantsColor: '#2a2a2a', build: 1.1 },
  { gender: 'f', body: 'cevik', skin: 1, hairColor: 3, hat: 'tricorn', hatColor: '#5a2a1a', shirtColor: '#3a5a3a', pantsColor: '#3a2a1a', coat: 'uzun', coatColor: '#5a2a1a' },
];

export const islands = {
  name: 'islands',
  built: new Map(),
  lamps: [],
  checkT: 0,
  interactables: [],
  lavas: [],

  init(scene) {
    this.scene = scene;
    // ışık havuzu: dinamik ışık sayısı sabit kalsın (gölgelendiriciler yeniden derlenmesin)
    this.pool = [];
    for (let i = 0; i < 4; i++) {
      const l = new THREE.PointLight(0xffa050, 0, 24, 1.6);
      l.position.set(0, -500, 0);
      scene.add(l);
      this.pool.push(l);
    }
    // düşman kampları: oyuncu yaklaşınca düşman modülü doldurur
    for (const I of EXTRA_ISLANDS) for (const f of I.features) {
      if (!f.enemies && !f.night) continue;
      enemies.addGroup({ id: f.id, x: f.x, z: f.z, r: Math.max(16, (f.r || 20) * 0.8), list: f.enemies || [], night: f.night || null, respawn: 420, fire: f.fire ? { x: f.x, z: f.z } : null, island: I.id });
    }
    interact.addProvider((ctx, out) => this._interactables(ctx, out));
    this.ready = true;
  },

  start(data) {
    // oturum başında tüm ada içeriği boşaltılır (yarım kalmış arka plan kurulumu dahil); yaklaşınca yeniden kurulur
    this._cancelJob();
    for (const id of [...this.built.keys()]) this._drop(id);
    this.failed = new Set();
    this.checkT = 0;
    // kalıcı ada durumu: açılmış sandıklar/sunaklar, kurtarılmış tutsaklar, çözülmüş tapınak mekanizmaları
    const d = data?.islands;
    this.opened = new Set(d?.opened || []);
    this.freed = new Set(d?.freed || []);
    // templeState yalnız kalıcı bulmaca durumunu ({ seq, done }) tutar; eski kayıtlardaki sarmalayıcı biçim onarılır
    this.templeState = {};
    for (const [id, v] of Object.entries(d?.temples || {})) this.templeState[id] = puzzleState(v);
    this.temples = {}; // çalışma zamanı: kapı, avlu konumu (bosslar okur); ada kurulunca dolar
  },
  stop() { this.start(null); },
  save() { return { opened: [...(this.opened || [])], freed: [...(this.freed || [])], temples: this.templeState || {} }; },

  update(dt) {
    if (!this.ready) return;
    const cam = G.player && G.state === 'playing' ? G.player.pos : (G.ship ? { x: G.ship.x, z: G.ship.z } : { x: 0, z: 0 });
    this.checkT -= dt;
    if (this.checkT <= 0) {
      this.checkT = 0.4;
      // en yakın kurulmamış ada önce (denetim başına en fazla bir yeni ada)
      const cand = [];
      for (const I of EXTRA_ISLANDS) {
        const d = Math.hypot(I.x - cam.x, I.z - cam.z) - I.r;
        const has = this.built.has(I.id);
        if (this.job?.I === I) { if (d > DROP_D) this._cancelJob(); }
        else if (!has && d < BUILD_D && !this.failed?.has(I.id)) cand.push([d, I]);
        else if (has && d > DROP_D) this._drop(I.id);
      }
      cand.sort((a, b) => a[0] - b[0]);
      const c = cand[0];
      // oyuncu adanın kıyısında/içinde (ışınlanma, yükleme): beklemeden kur; değilse arka planda (tek iş)
      if (c && c[0] < NEAR_D) {
        try { this._build(c[1]); } catch (e) { console.error('Ada kurulamadı', c[1].id, e); this.failed?.add(c[1].id); }
      } else if (c && !this.job) this.job = this._newJob(c[1]);
    }
    if (this.job) {
      const J = this.job;
      const near = Math.hypot(J.I.x - cam.x, J.I.z - cam.z) - J.I.r < NEAR_D;
      try {
        if (this._runJob(J, near ? Infinity : STEP_MS)) this.job = null;
      } catch (e) {
        // beklenmeyen hata: yarım içerik temizlenir, ada bu oturumda yeniden denenmez (her denetimde hata yağmuru olmasın)
        console.error('Ada kurulamadı', J.I.id, e);
        this._cancelJob();
        this.failed?.add(J.I.id);
      }
    }
    this._updateLamps(dt);
    this._updateLava(dt);
    this._cellLod(cam);
    for (const b of this.built.values()) for (const fn of b.tick) fn(dt);
  },

  // ---------------------------------------------------------------------------
  // Eşzamanlı kurulum (testler, ışınlanma/yükleme): aynı adanın yarım kalmış arka plan işi varsa o tamamlanır.
  // Hata olursa yarım içerik bırakılır ve hata yukarı iletilir (update yakalayıp adayı bu oturumda yeniden denemez).
  _build(I) {
    if (this.built.has(I.id)) return; // zaten kurulu: ikinci kopya kurulmaz
    let J = this.job;
    if (J?.I === I) this.job = null;
    else J = this._newJob(I);
    try {
      this._runJob(J, Infinity);
    } catch (e) {
      J.it.return();
      if (this.built.get(I.id) !== J.B) this._release(J.B);
      throw e;
    }
  },

  _newJob(I) {
    const group = new THREE.Group();
    group.name = 'island:' + I.id;
    const B = { I, group, batch: new Batch(), mats: [], tag: 'isl:' + I.id, obstacles: [], npcs: [], lamps: [], inter: [], tick: [], lavas: [], extras: [], defer: [], prof: {} };
    const J = { I, B, phase: 'veg', work: 0, frames: 0, maxFrame: 0 };
    J.it = this._buildGen(J);
    return J;
  },

  // Ada içeriği üreteci. Her `yield` bir bölünme noktasıdır: bitki örtüsü 64 örnekte bir, her yapı, her NPC,
  // her örnek grubu. Eşzamanlı kurulum aynı üreteci sonuna dek çalıştırdığından iki yolun sonucu (rastgele
  // sayı sırası, konumlar, çarpıştırıcılar) aynıdır. Grup sahneye yalnız iş bitince eklenir.
  *_buildGen(J) {
    const { I, B } = J;
    const R = rng(I.seed * 31 + 7);
    J.phase = 'veg';
    yield* this._vegetation(B, R);
    yield;
    for (const f of I.features) {
      J.phase = f.type;
      try { this._feature(B, f, R); } catch (e) { console.error('Ada yapısı kurulamadı', I.id, f.type, e); }
      yield;
      // karakter modelleri pahalıdır (tanesi 1–10 ms): her NPC ayrı adımda
      while (B.defer.length) {
        const fn = B.defer.shift();
        try { fn(); } catch (e) { console.error('Ada NPC kurulamadı', I.id, f.type, e); }
        yield;
      }
    }
    J.phase = 'dig'; this._digLandmarks(B); yield;
    J.phase = 'stacks'; this._seaStacks(B, R); yield;
    if (I.shape === 'volcano') { J.phase = 'lava'; this._lava(B); yield; }
    J.phase = 'batch';
    yield* B.batch.steps(B.group, B.mats);
    J.phase = 'rim';
    B.cells = B.batch.cells;
    rimAll(B.group);
  },

  // İşi bütçe (ms) dolana dek ilerletir; bittiyse adayı sahneye ekleyip true döner.
  _runJob(J, budget) {
    const t0 = performance.now();
    const prof = J.B.prof;
    let t = t0, done = false;
    J.frames++;
    for (;;) {
      done = J.it.next().done;
      const now = performance.now();
      // üreteç her evrenin başında J.phase'i ayarlar: adımın süresi o evreye yazılır
      prof[J.phase] = (prof[J.phase] || 0) + (now - t);
      t = now;
      if (done || now - t0 >= budget) break;
    }
    const spent = t - t0;
    J.work += spent;
    if (spent > J.maxFrame) J.maxFrame = spent;
    if (!done) return false;
    const { I, B } = J;
    if (this.job === J) this.job = null; // tamamlanan iş bekleyen iş olarak kalmasın (sonraki _drop onu iptal etmeye çalışmasın)
    for (const k in prof) prof[k] = Math.round(prof[k]);
    this.scene.add(B.group);
    this.built.set(I.id, B);
    this._lodT = 0; // yeni adanın uzak hücreleri/gölgeleri aynı karede ayıklansın (sonraki LOD geçişini beklemeden)
    B.ms = J.work; B.frames = J.frames; B.maxFrameMs = J.maxFrame;
    G.emit('islandBuilt', { id: I.id, ms: B.ms });
    return true;
  },

  _cancelJob() {
    const J = this.job;
    if (!J) return;
    this.job = null;
    J.it.return();
    this._release(J.B);
  },

  // hücre LOD: uzak hücreler gizlenir, gölgeler yalnız yakında
  _cellLod(cam) {
    this._lodT = (this._lodT || 0) - 1;
    if (this._lodT > 0) return;
    this._lodT = 15;
    for (const b of this.built.values()) for (const im of b.cells || []) {
      const c = im.userData.cell;
      const d = Math.hypot(c.x - cam.x, c.z - cam.z);
      im.visible = d < (c.small ? 240 : 850);
      im.castShadow = c.shadow && d < 220;
    }
  },

  _drop(id) {
    if (this.job?.I.id === id) this._cancelJob();
    const B = this.built.get(id);
    if (!B) return;
    this._release(B);
    this.built.delete(id);
    G.emit('islandDropped', { id });
  },

  // ada içeriğinin tüm kaynaklarını bırakır (kurulmuş ya da yarıda kesilmiş)
  _release(B) {
    this.scene.remove(B.group);
    B.group.traverse((o) => { if (o.isInstancedMesh) o.dispose(); else if (o.isMesh && o.userData.own) { o.geometry.dispose(); } });
    for (const m of B.mats) m.dispose();
    physics.removeTag(B.tag);
    if (B.obstacles.length) Ship.obstacles = Ship.obstacles.filter((o) => !B.obstacles.includes(o));
    for (const n of B.npcs) npcs.remove(n);
    for (const e of B.extras) e.dispose?.();
  },

  // ---- bitki örtüsü (üreteç: 64 örnekte bir durulabilir) ----
  *_vegetation(B, R) {
    const I = B.I;
    const table = VEG[I.biome] || VEG.tropik;
    const tot = table.reduce((s, v) => s + v.w, 0);
    const q = terrain.quality || 'high';
    const dens = q === 'low' ? 0.45 : q === 'medium' ? 0.75 : 1;
    const area = Math.PI * I.r * I.r * I.ex * I.ez;
    const n = Math.min(7000, Math.floor(area / 34 * dens * (I.shape === 'glacier' ? 0.55 : I.shape === 'volcano' ? 0.4 : I.biome === 'cangil' ? 1.25 : I.biome === 'col' ? 0.6 : 1)));
    const keep = I.features.filter((f) => f.r || f.type === 'port').map((f) => ({ x: f.x, z: f.z, r: (f.type === 'port' ? 58 * (f.size || 1) : f.r * 1.1) }));
    for (const s of DIG_SITES) if (s.island === I.id) keep.push({ x: s.x, z: s.z, r: 6 });
    const pp = ports.list.find((p) => p.island === I.id);
    for (let i = 0; i < n; i++) {
      if ((i & 63) === 63) yield;
      const a = R() * Math.PI * 2, rr = Math.sqrt(R()) * I.r * 1.15;
      const x = I.x + Math.cos(a) * rr * I.ex, z = I.z + Math.sin(a) * rr * I.ez;
      const h = terrain.heightAt(x, z);
      if (h < 0.7) continue;
      let blocked = false;
      for (const k of keep) if (Math.hypot(x - k.x, z - k.z) < k.r) { blocked = true; break; }
      if (blocked) continue;
      if (pp && this._nearSeg(x, z, pp.pierStart, pp.pierEnd) < 6) continue;
      const ny = terrain.normalAt(x, z, _n).y;
      if (ny < 0.62) continue;
      const beach = h < 3.2;
      let pick = R() * tot, v = table[0];
      for (const t of table) { pick -= t.w; if (pick <= 0) { v = t; break; } }
      if (v.zone === 'beach' && !beach) continue;
      if (v.zone === 'in' && beach) continue;
      // bataklık: sığ suyun yanında daha seyrek
      const hh = v.h[0] + R() * (v.h[1] - v.h[0]);
      const yaw = R() * 6.28;
      const tilt = v.tilt ? (R() - 0.5) * v.tilt : 0;
      B.batch.add(v.a, x, h - 0.15, z, { h: hh, yaw, rx: tilt, rz: v.tilt ? (R() - 0.5) * v.tilt : 0, tint: v.tint ?? null, moss: v.moss ?? null, boost: v.boost ?? 1, shadow: hh > 1.5, small: hh < 1.2 });
      if (v.col) physics.addCircle(x, z, Math.max(0.25, v.col * hh), h - 1, h + hh, B.tag);
    }
  },
  _nearSeg(x, z, a, b) {
    const abx = b.x - a.x, abz = b.z - a.z;
    const t = clamp(((x - a.x) * abx + (z - a.z) * abz) / (abx * abx + abz * abz), 0, 1);
    return Math.hypot(x - (a.x + abx * t), z - (a.z + abz * t));
  },

  // yapı parçası yerleştir (+ isteğe bağlı kutu çarpıştırıcı)
  _place(B, id, x, z, yaw, opts = {}) {
    const y = (opts.y ?? terrain.heightAt(x, z)) + (opts.dy || 0);
    const sc = B.batch.add(id, x, y, z, { s: opts.s ?? null, h: opts.h ?? null, yaw, tint: opts.tint ?? null, shadow: opts.shadow !== false });
    if (opts.col) {
      const P = partsOf(id);
      const bx = P.box;
      const hw = (bx.max.x - bx.min.x) * sc * 0.5 * (opts.colK || 0.9), hd = (bx.max.z - bx.min.z) * sc * 0.5 * (opts.colK || 0.9);
      // kutu merkezi modelin yerel ofsetine göre döndürülür
      const cx = (bx.max.x + bx.min.x) * 0.5 * sc, cz = (bx.max.z + bx.min.z) * 0.5 * sc;
      const wx = x + cx * Math.cos(yaw) + cz * Math.sin(yaw), wz = z - cx * Math.sin(yaw) + cz * Math.cos(yaw);
      physics.addBox(wx, wz, Math.max(0.2, hw), Math.max(0.2, hd), yaw, y - 2, y + (bx.max.y - bx.min.y) * sc, B.tag);
    }
    return { x, y, z, sc };
  },
  _lamp(B, x, y, z, opts = {}) {
    B.lamps.push({ x, y, z, color: opts.color ?? 0xffa050, power: opts.power ?? 14, range: opts.range ?? 22, flicker: opts.flicker ?? 0.25, night: opts.night !== false });
  },

  // ---------------------------------------------------------------------------
  _feature(B, f, R) {
    switch (f.type) {
      case 'port': return this._port(B, f, R);
      case 'camp': return this._camp(B, f, R);
      case 'fort': return this._fort(B, f, R);
      case 'ruin': return this._ruin(B, f, R);
      case 'graveyard': return this._graveyard(B, f, R);
      case 'temple': return this._temple(B, f, R);
      case 'mine': return this._mine(B, f, R);
      case 'market': return this._market(B, f, R);
      case 'ruined_town': return this._ruinedTown(B, f, R);
      case 'prison': return this._prison(B, f, R);
      case 'lighthouse': return this._lighthouse(B, f, R);
      case 'beach_wreck': return this._wreck(B, f, R);
      case 'sunken_city': return this._sunken(B, f, R);
      default: return null;
    }
  },

  _npc(B, role, x, z, yaw, R, extra = {}) {
    const names = NPC_NAMES[role] || ['Yerli'];
    const name = names[Math.floor(R() * names.length)];
    const look = { ...LOOK_POOL[Math.floor(R() * LOOK_POOL.length)], ...(extra.look || {}) };
    const id = `${B.I.id}_${role}_${Math.round(x)}_${Math.round(z)}`;
    const titles = { general: 'Genel Tüccar', treasure: 'Hazine Alıcısı', travel: 'Rota Kaptanı — hızlı yolculuk', shipwright: 'Gemi Ustası', smuggler: 'Gizli Pazar Kaçakçısı', prisoner: 'Tutsak', gambler: 'Zar Ustası — Korsan Zarı' };
    const spot = { id, role, name, title: extra.title || titles[role] || '', x, z, yaw, app: look, minY: -50, tag: B.tag, port: extra.port || null, anim: extra.anim, dynamic: true };
    // karakter modeli kurulum üretecinde ayrı bir adımda oluşturulur (B.defer); zemin yüksekliği şimdiki
    // çarpıştırıcılarla burada hesaplanır, böylece NPC eşzamanlı kurulumdakiyle aynı yere konur
    spot.y = Math.max(physics.groundAt(x, z), spot.minY);
    if (B.defer) B.defer.push(() => npcs.add(spot)); else npcs.add(spot);
    B.npcs.push(id);
    return id;
  },

  // ---- liman kasabası ----
  _port(B, f, R) {
    const P = ports.byId(f.id);
    const col = f.style === 'blue' ? 'blue' : 'red';
    const sea = f.angle;
    const S = TOWN_S * (f.size || 1) * 0.95;
    const cx = f.x, cz = f.z;
    // halka üzerinde binalar (deniz tarafı boş: iskele yolu)
    const ring = ['tavern', 'market', 'home_A', 'blacksmith', 'home_B', 'church', 'home_A', 'barracks', 'home_B', 'lumbermill'];
    const n = ring.length;
    for (let i = 0; i < n; i++) {
      const a = sea + 0.75 + (i / (n - 1)) * (Math.PI * 2 - 1.5);
      const rr = 27 + (i % 2) * 5 + R() * 3;
      const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr;
      const yaw = Math.atan2(cx - x, cz - z);
      this._place(B, `kk:town:${ring[i]}_${col}`, x, z, yaw, { s: S, col: true, colK: 0.78, dy: -0.15 });
      // kapı önü fener
      if (i % 3 === 0) { const lx = x + Math.sin(yaw) * 6, lz = z + Math.cos(yaw) * 6; this._place(B, 'kk:graveyard:post_lantern', lx, lz, yaw, { h: 3.2 }); this._lamp(B, lx, terrain.heightAt(lx, lz) + 3.1, lz); }
    }
    // dış halka: değirmen, gözcü kulesi
    const out = [['windmill', 1.2], ['tower_A', -1.1]];
    for (const [b, da] of out) {
      const a = sea + Math.PI + da, rr = 52;
      const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr;
      if (terrain.heightAt(x, z) > 1) this._place(B, `kk:town:${b}_${col}`, x, z, R() * 6.28, { s: S, col: true, colK: 0.6 });
    }
    // meydan: kuyu, tezgâhlar, fıçılar, sandıklar
    this._place(B, `kk:town:well_${col}`, cx, cz, R() * 6.28, { s: S * 0.7, col: true, colK: 0.7 });
    for (let i = 0; i < 6; i++) {
      const a = R() * 6.28, rr = 8 + R() * 10;
      const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr;
      this._place(B, R() < 0.5 ? 'kk:dungeon:barrel_large' : 'kk:dungeon:crates_stacked', x, z, R() * 6.28, { s: 0.9, col: true });
    }
    for (const da of [-0.5, 0.5]) {
      const x = cx + Math.cos(sea + da) * 16, z = cz + Math.sin(sea + da) * 16;
      this._place(B, 'kk:town:tent', x, z, Math.atan2(cx - x, cz - z), { s: 5.5, col: true, colK: 0.7 });
    }
    // iskele (yürünebilir platform) ve direkler
    this._pier(B, P.pierStart, P.pierEnd, 2.9);
    // NPC'ler: tüccar, hazine alıcısı, rota kaptanı, gemi ustası
    const fx = Math.cos(sea), fz = Math.sin(sea);
    const px = -fz, pz = fx;
    this._npc(B, 'general', cx + fx * 10 + px * 6, cz + fz * 10 + pz * 6, Math.atan2(-fx, -fz) + Math.PI, R, { port: f.id });
    this._npc(B, 'treasure', cx + fx * 10 - px * 6, cz + fz * 10 - pz * 6, Math.atan2(-fx, -fz) + Math.PI, R, { port: f.id });
    const ps = P.pierStart;
    this._npc(B, 'travel', ps.x + px * 4 - fx * 2, ps.z + pz * 4 - fz * 2, Math.atan2(fx, fz) + Math.PI, R, { port: f.id, look: { hat: 'kaptan', coat: 'uzun' } });
    this._npc(B, 'shipwright', ps.x - px * 4 - fx * 2, ps.z - pz * 4 - fz * 2, Math.atan2(fx, fz) + Math.PI, R, { port: f.id });
    // meyhane önünde zar masası
    { const a = sea + 0.75, gx = cx + Math.cos(a) * 19, gz = cz + Math.sin(a) * 19;
      this._place(B, 'kk:dungeon:barrel_large', gx + Math.cos(a + 1.57) * 1.3, gz + Math.sin(a + 1.57) * 1.3, a, { s: 0.75, col: true });
      this._npc(B, 'gambler', gx, gz, Math.atan2(cx - gx, cz - gz), R, { port: f.id }); }
    // bayraklar
    for (const da of [-0.35, 0.35]) {
      const x = cx + Math.cos(sea + da) * 22, z = cz + Math.sin(sea + da) * 22;
      this._place(B, `kk:town:flag_${col}`, x, z, sea, { s: 9 });
    }
  },

  _pier(B, a0, b, top) {
    // kara ucu, kum güverteye 0,3 m'den az kalana dek (en çok 12 m; kasaba yapılarına girmesin) kıyıya doğru uzatılır: kökte
    // 0,9–1,8 m'lik basamak vardı (B-07); kumdan iskeleye zıplamadan çıkılamıyordu. Kalan fark aşağıda basamakla aşılır.
    const L0 = Math.hypot(b.x - a0.x, b.z - a0.z) || 1;
    const nx = (b.x - a0.x) / L0, nz = (b.z - a0.z) / L0, qx = nz, qz = -nx; // eksen ve dik
    const sandAt = (x, z) => Math.min(terrain.heightAt(x + qx * 2.5, z + qz * 2.5), terrain.heightAt(x, z), terrain.heightAt(x - qx * 2.5, z - qz * 2.5));
    let ext = 0;
    for (let s = 0; s <= 12; s += 0.5) { ext = s; if (sandAt(a0.x - nx * s, a0.z - nz * s) >= top - 0.3) break; }
    const a = { x: a0.x - nx * ext, z: a0.z - nz * ext };
    const dx = b.x - a.x, dz = b.z - a.z;
    const L = Math.hypot(dx, dz);
    const yaw = Math.atan2(dx, dz);
    const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
    const g = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ map: woodPlanks('#6b4a2c', 61, 8), roughness: 0.95 });
    wood.map.wrapS = wood.map.wrapT = THREE.RepeatWrapping;
    wood.map.repeat.set(1, L / 4);
    B.mats.push(wood);
    const deck = new THREE.Mesh(new THREE.BoxGeometry(5, 0.4, L), wood);
    deck.userData.own = true;
    deck.position.y = top - 0.2;
    deck.castShadow = true; deck.receiveShadow = true;
    g.add(deck);
    const postGeo = new THREE.CylinderGeometry(0.18, 0.22, 7, 6);
    const posts = new THREE.InstancedMesh(postGeo, wood, Math.ceil(L / 4) * 2 + 2);
    posts.userData.own = true;
    let k = 0;
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    for (let t = 0; t <= L; t += 4) for (const sx of [-2.3, 2.3]) {
      _m.makeTranslation(sx, top - 3.7, t - L / 2); posts.setMatrixAt(k++, _m);
      // iskele ayağı çarpıştırıcısı (yüzücü için; güverte üstünde yürüyeni etkilemez, kamera çarpmaz)
      const wx = (a.x + b.x) / 2 + sx * cy + (t - L / 2) * sy, wz = (a.z + b.z) / 2 - sx * sy + (t - L / 2) * cy;
      physics.addCircle(wx, wz, 0.22, top - 7.2, top - 0.2, B.tag).noCam = true;
    }
    posts.count = k;
    posts.castShadow = true;
    g.add(posts);
    g.position.set(mx, 0, mz);
    g.rotation.y = yaw;
    B.group.add(g);
    B.extras.push({ dispose: () => postGeo.dispose() });
    physics.addPlatform(mx, mz, 2.5, L / 2, yaw, top, B.tag);
    // sığ kesimin (kum −1,95 m üstü) altı tam yükseklikte kapalı: kumda yürüyen/sığda yüzen oyuncu alçak güvertenin içine giremez
    let sSplit = 0;
    while (sSplit < L && sandAt(a.x + nx * sSplit, a.z + nz * sSplit) > -1.95) sSplit += 0.5;
    if (sSplit > 0) physics.addBox(a.x + nx * sSplit / 2, a.z + nz * sSplit / 2, 2.5, sSplit / 2, yaw, -50, top - 0.6, B.tag);
    // kökte kalan yükseklik farkı (12 m'de kum güverteye yetişmezse) ≤ 0,5 m'lik ahşap basamaklarla kara tarafına iner
    const gap = top - sandAt(a.x, a.z);
    if (gap > 0.55) {
      const K = Math.ceil(gap / 0.5) - 1, h = gap / (K + 1), tread = 0.8;
      for (let i = 1; i <= K; i++) {
        const st = top - i * h, sd = (i - 0.5) * tread;
        const cx = a.x - nx * sd, cz = a.z - nz * sd;
        const sand = sandAt(cx, cz);
        if (st <= sand + 0.05) break; // kum basamak hizasına çıktı
        const base = sand - 0.3;
        const m = new THREE.Mesh(new THREE.BoxGeometry(5, st - base, tread), wood);
        m.userData.own = true;
        m.position.set(cx, (st + base) / 2, cz);
        m.rotation.y = yaw;
        m.castShadow = true; m.receiveShadow = true;
        B.group.add(m);
        physics.addPlatform(cx, cz, 2.5, tread / 2, yaw, st, B.tag, false);
        physics.addBox(cx, cz, 2.5, tread / 2, yaw, base, st - 0.6, B.tag); // yandan basamağın içine girilmez
      }
    }
    // fenerler
    for (const t of [0.15, 0.95]) {
      const x = a.x + dx * t + Math.cos(yaw) * 2.2, z = a.z + dz * t - Math.sin(yaw) * 2.2;
      this._place(B, 'kk:graveyard:post_lantern', x, z, yaw, { y: top, h: 3 });
      this._lamp(B, x, top + 2.9, z, { power: 10 });
    }
  },

  // ---- haydut kampı ----
  _camp(B, f, R) {
    const cx = f.x, cz = f.z;
    const y = terrain.heightAt(cx, cz);
    B.batch.add('campfire', cx, y, cz, { h: 0.2 });
    this._lamp(B, cx, y + 1.2, cz, { color: 0xff8030, power: 22, range: 26, flicker: 0.5, night: false });
    B.tick.push(() => { if (Math.random() < 0.3) effects.smoke(cx, y + 1, cz, 1, 0.5, 0.3); });
    const nT = 3 + Math.floor(R() * 3);
    for (let i = 0; i < nT; i++) {
      const a = (i / nT) * 6.28 + R() * 0.4, rr = 8 + R() * 3;
      const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr;
      this._place(B, 'kk:town:tent', x, z, Math.atan2(cx - x, cz - z), { s: 5.5 + R(), col: true, colK: 0.75, tint: [0xffffff, 0xd8b090, 0xc0a080][i % 3] });
    }
    for (let i = 0; i < 6; i++) {
      const a = R() * 6.28, rr = 4 + R() * 8;
      const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr;
      const pick = ['kk:dungeon:barrel_small', 'kk:dungeon:box_large', 'kk:town:weaponrack', 'kk:dungeon:crates_stacked', 'log', 'kk:dungeon:keg'][i % 6];
      this._place(B, pick, x, z, R() * 6.28, pick === 'log' ? { h: 0.5 } : { s: pick.includes('weaponrack') ? 4 : 0.85, col: !pick.includes('weaponrack') });
    }
  },

  // ---- haydut kalesi ----
  _fort(B, f, R) {
    const cx = f.x, cz = f.z;
    const yaw = R() * 6.28;
    this._place(B, 'kk:town:castle_red', cx, cz, yaw, { s: 4.6, col: true, colK: 0.8, tint: 0xc8b8a8 });
    for (const s of [-1, 1]) {
      const x = cx + Math.cos(yaw) * 16 * s, z = cz - Math.sin(yaw) * 16 * s;
      this._place(B, 'kk:town:tower_A_red', x, z, yaw, { s: 4.8, col: true, colK: 0.75, tint: 0xc8b8a8 });
      this._lamp(B, x, terrain.heightAt(x, z) + 9, z, { power: 12 });
    }
    // ön duvarlar
    for (let i = -2; i <= 2; i++) {
      if (i === 0) continue;
      const fx = cx + Math.sin(yaw) * 14 + Math.cos(yaw) * i * 7.2, fz = cz + Math.cos(yaw) * 14 - Math.sin(yaw) * i * 7.2;
      this._place(B, 'kk:town:wall_straight', fx, fz, yaw, { s: 3.6, col: true, colK: 0.9 });
    }
    this._place(B, 'kk:town:flag_red', cx, cz, yaw, { s: 12, dy: 18 });
  },

  // ---- harabe (zindan kiti) ----
  _ruin(B, f, R) {
    const cx = f.x, cz = f.z;
    const yaw = R() * 6.28;
    const S = 1.25;
    const W = ['kk:dungeon:wall_broken', 'kk:dungeon:wall_cracked', 'kk:dungeon:wall_arched', 'kk:dungeon:wall_half', 'kk:dungeon:wall'];
    const tint = B.I.biome === 'col' ? 0xf0c090 : B.I.biome === 'buzul' ? 0xd8e4f0 : B.I.biome === 'hayalet' ? 0xa8a8b8 : B.I.biome === 'volkan' ? 0x8a7a70 : 0xd8d0b8;
    // kırık kare avlu
    for (let side = 0; side < 4; side++) {
      for (let k = -1; k <= 1; k++) {
        if (R() < 0.3) continue;
        const a = yaw + side * Math.PI / 2;
        const ox = Math.sin(a) * 12 + Math.cos(a) * k * 5 * S, oz = Math.cos(a) * 12 - Math.sin(a) * k * 5 * S;
        this._place(B, W[Math.floor(R() * W.length)], cx + ox, cz + oz, a, { s: S, col: true, colK: 0.95, tint });
      }
    }
    for (let i = 0; i < 6; i++) {
      const a = R() * 6.28, rr = 4 + R() * 9;
      this._place(B, R() < 0.5 ? 'kk:dungeon:pillar' : 'kk:dungeon:pillar_decorated', cx + Math.cos(a) * rr, cz + Math.sin(a) * rr, R() * 6.28, { s: S * (0.7 + R() * 0.5), col: true, colK: 0.8, tint });
    }
    this._place(B, 'kk:dungeon:rubble_large', cx + 4, cz - 3, R() * 6.28, { s: S, tint });
    for (let i = 0; i < 5; i++) this._place(B, 'kk:dungeon:floor_tile_large_rocks', cx + (R() - 0.5) * 14, cz + (R() - 0.5) * 14, R() * 6.28, { s: S, dy: 0.05, tint, shadow: false });
    // sandık: ganimet
    this._chest(B, cx, cz, yaw, f.id, B.I.region === 'hayalet' ? 'rich' : 'mid');
  },

  // ganimet sandığı (bir kez açılır; oturum boyunca)
  _chest(B, x, z, yaw, id, kind = 'mid') {
    const y = terrain.heightAt(x, z);
    this._place(B, kind === 'rich' ? 'kk:dungeon:chest_gold' : 'kk:dungeon:chest', x, z, yaw, { s: 0.9, col: true });
    const table = kind === 'rich' ? [['altin_para', 120, 260], ['altin_kulce', 0.7], ['yakut', 0.4], ['zumrut', 0.3], ['eski_mucevher', 0.6], ['usta_zipkin', 0.15], ['palet', 0.25]] : [['altin_para', 40, 110], ['gumus_kulce', 0.6], ['inci', 0.3], ['eski_mucevher', 0.25], ['zipkin', 0.15], ['dalis_maskesi', 0.15], ['hava_kesesi', 0.3]];
    B.inter.push({ id: 'chest:' + id, x, y: y + 0.8, z, r: 2.4, label: 'Sandığı aç', once: true, action: () => {
      if (this.opened?.has(id)) { G.notify('Sandık boş.'); return; }
      (this.opened || (this.opened = new Set())).add(id);
      G.emit('loot', { pos: new THREE.Vector3(x, y + 0.5, z), table, from: 'Eski sandık' });
      audio.play('coin', { vol: 0.6 });
    } });
  },

  // ---- mezarlık (Halloween kiti) ----
  _graveyard(B, f, R) {
    const cx = f.x, cz = f.z;
    const r = 22;
    const n = 26;
    const gate = R() * 6.28;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.28;
      if (Math.abs(((a - gate + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.12) continue;
      const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
      this._place(B, R() < 0.25 ? 'kk:graveyard:fence_broken' : 'kk:graveyard:fence', x, z, a, { s: 1.15, col: true, colK: 0.9 });
    }
    this._place(B, 'kk:graveyard:arch_gate', cx + Math.cos(gate) * r, cz + Math.sin(gate) * r, gate + Math.PI / 2, { s: 1.2 });
    this._place(B, 'kk:graveyard:crypt', cx, cz, gate + Math.PI, { s: 1.15, col: true, colK: 0.85 });
    const G0 = ['kk:graveyard:grave_A', 'kk:graveyard:grave_B', 'kk:graveyard:gravestone', 'kk:graveyard:gravemarker_A', 'kk:graveyard:gravemarker_B', 'kk:graveyard:grave_A_destroyed'];
    for (let row = -2; row <= 2; row++) for (let k = -3; k <= 3; k++) {
      if (Math.abs(row) < 1 && Math.abs(k) < 2) continue;
      const lx = k * 4.2 + (R() - 0.5), lz = row * 4.6 + (R() - 0.5);
      const x = cx + lx * Math.cos(gate) - lz * Math.sin(gate), z = cz + lx * Math.sin(gate) + lz * Math.cos(gate);
      if (Math.hypot(x - cx, z - cz) > r - 3) continue;
      this._place(B, G0[Math.floor(R() * G0.length)], x, z, gate + (R() - 0.5) * 0.3, { s: 1.0, col: R() < 0.5 });
    }
    for (let i = 0; i < 4; i++) {
      const a = gate + (i + 0.5) * Math.PI / 2, rr = r - 4;
      const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr;
      this._place(B, 'kk:graveyard:lantern_standing', x, z, a, { s: 1.4 });
      this._lamp(B, x, terrain.heightAt(x, z) + 1.2, z, { color: 0x80ffc0, power: 8, range: 16 });
    }
    this._place(B, 'kk:graveyard:tree_dead_large_decorated', cx + Math.cos(gate + 2) * 14, cz + Math.sin(gate + 2) * 14, R() * 6.28, { s: 1.5, col: true, colK: 0.3 });
    this._place(B, 'kk:graveyard:shrine_candles', cx + Math.cos(gate) * 8, cz + Math.sin(gate) * 8, gate + Math.PI, { s: 1.1 });
    this._chest(B, cx - Math.cos(gate) * 6, cz - Math.sin(gate) * 6, gate, f.id, 'rich');
  },

  // ---- kadim tapınak (bulmaca + boss) ----
  _temple(B, f, R) {
    const cx = f.x, cz = f.z;
    const yaw = 0; // giriş güneye (+z)
    const y0 = terrain.heightAt(cx, cz);
    const S = 1.6;
    const tint = 0xc8d0b0;
    // kenar duvarları (40×40), girişte kapı
    for (let side = 0; side < 4; side++) {
      const a = side * Math.PI / 2;
      for (let k = -4; k <= 4; k++) {
        if (side === 0 && Math.abs(k) < 1) continue;
        const ox = Math.sin(a) * 30 + Math.cos(a) * k * 6.4, oz = Math.cos(a) * 30 - Math.sin(a) * k * 6.4;
        this._place(B, (k + side) % 3 === 0 ? 'kk:dungeon:wall_pillar' : 'kk:dungeon:wall', cx + ox, cz + oz, a, { s: S, y: y0, col: true, colK: 1.0, tint });
      }
    }
    // kapı: üç levye ile açılır
    const gate = { x: cx, z: cz + 30, open: 0, opening: false };
    const gateObj = kk.part('dungeon', 'wall_gated');
    gateObj.scale.setScalar(S);
    gateObj.position.set(gate.x, y0, gate.z);
    gateObj.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.color.multiply(new THREE.Color(tint)); B.mats.push(o.material); o.castShadow = true; } });
    B.group.add(gateObj);
    const gateCol = physics.addBox(gate.x, gate.z, 3.3, 0.9, 0, y0 - 2, y0 + 7, B.tag);
    B.tick.push((dt) => {
      if (gate.opening && gate.open < 1) {
        gate.open = Math.min(1, gate.open + dt * 0.25);
        gateObj.position.y = y0 - gate.open * 6.2;
        if (gate.open >= 1) { gateCol.y1 = -999; G.notify('Tapınağın kapısı açıldı!', 'good', 3000); }
        if (Math.random() < 0.3) effects.dirt(gate.x + (Math.random() - 0.5) * 6, y0 + 0.2, gate.z, 3);
      }
    });
    // iç kutsal alan: sütun sıraları, merkezde basamaklı sunak
    for (let i = -2; i <= 2; i++) for (const sx of [-12, 12]) this._place(B, 'kk:dungeon:pillar_decorated', cx + sx, cz + i * 8, 0, { s: S, y: y0, col: true, colK: 0.7, tint });
    this._place(B, 'kk:dungeon:stairs_wide', cx, cz - 2, Math.PI, { s: S, y: y0, tint });
    physics.addPlatform(cx, cz - 12, 6, 6, 0, y0 + 5.1 * S * 0.98, B.tag);
    for (let i = 0; i < 9; i++) this._place(B, 'kk:dungeon:floor_tile_large', cx + ((i % 3) - 1) * 4 * S, cz - 12 + (Math.floor(i / 3) - 1) * 4 * S, 0, { s: S, y: y0 + 5.1 * S - 0.05, tint, shadow: false });
    this._place(B, 'kk:dungeon:chest_gold', cx, cz - 14, 0, { s: 1.4, y: y0 + 5.1 * S });
    for (const sx of [-5, 5]) { this._place(B, 'kk:dungeon:torch_mounted', cx + sx, cz - 18, 0, { s: 1.3, y: y0 + 5.1 * S + 1 }); this._lamp(B, cx + sx, y0 + 5.1 * S + 2.2, cz - 18, { color: 0xffa040, power: 16, night: false }); }
    // levyeler (avlu dışında üç köşede); doğru sıra: ipucu levhasında
    const order = [0, 1, 2].sort(() => R() - 0.5);
    const names = ['Güneş', 'Ay', 'Yıldız'];
    const levers = [[-26, 42], [26, 42], [0, 52]];
    const ts = this.templeState || (this.templeState = {});
    if (!ts[f.id] || !Array.isArray(ts[f.id].seq)) ts[f.id] = puzzleState(ts[f.id]);
    const state = ts[f.id];
    // yarım dizi kurulumlar arasında taşınmaz: levye sırası kurulumdaki arazi ayrıntı düzeyine bağlı değişebilir (bilinen #35)
    if (!state.done) state.seq = [];
    if (state.done) { gate.opening = true; gate.open = 1; gateObj.position.y = y0 - 6.2; gateCol.y1 = -999; } // kayıttan: kapı açık
    levers.forEach(([lx, lz], i) => {
      const x = cx + lx, z = cz + lz;
      const yy = terrain.heightAt(x, z);
      this._place(B, 'kk:dungeon:pillar', x, z, 0, { s: 0.55, col: true, colK: 0.8, tint });
      B.inter.push({ id: `lever:${f.id}:${i}`, x, y: yy + 1.2, z, r: 2.6, label: `${names[i]} taşını çevir`, action: () => {
        if (state.done) { G.notify('Mekanizma zaten çözüldü.'); return; }
        state.seq.push(i);
        audio.play('impact', { vol: 0.4, rate: 0.6 });
        effects.dirt(x, yy + 1, z, 6);
        const k = state.seq.length - 1;
        if (state.seq[k] !== order[k]) { state.seq = []; G.notify('Taşlar gıcırdayarak eski yerine döndü… Sıra yanlış.', 'warn', 2500); return; }
        if (state.seq.length === 3) { state.done = true; gate.opening = true; G.emit('templeOpened', { id: f.id }); }
        else G.notify(`${names[i]} taşı yerine oturdu (${state.seq.length}/3).`, 'info', 1800);
      } });
    });
    const px = cx + 8, pz = cz + 40;
    this._place(B, 'kk:graveyard:plaque', px, pz, Math.PI, { s: 1.3 });
    B.inter.push({ id: `plaque:${f.id}`, x: px, y: terrain.heightAt(px, pz) + 1, z: pz, r: 2.6, label: 'Yazıtı oku', action: () => {
      G.emit('openDialog', { name: 'Kadim Yazıt', title: 'Tapınak girişi', text: `Yosun tutmuş taşta şu satırlar okunuyor:<br><i>"Önce ${names[order[0]].toLowerCase()} doğar, ardından ${names[order[1]].toLowerCase()} yükselir; en son ${names[order[2]].toLowerCase()} yol gösterir. Kapı ancak böyle açılır."</i>`, options: [{ label: 'Kapat', close: true }] });
    } });
    // ödül: sunak sandığı (kapı açılınca)
    B.inter.push({ id: `altar:${f.id}`, x: cx, y: y0 + 5.1 * S + 0.8, z: cz - 14, r: 3, label: 'Sunak sandığını aç', cond: () => state.done, action: () => {
      if (this.opened?.has('altar' + f.id)) { G.notify('Sandık boş.'); return; }
      (this.opened || (this.opened = new Set())).add('altar' + f.id);
      G.emit('loot', { pos: new THREE.Vector3(cx, y0 + 5.1 * S + 0.5, cz - 13), table: [['altin_para', 400, 700], ['kraliyet_taci', 0.6], ['altin_heykelcik', 1], ['elmas', 0.5], ['antik_vazo', 1]], from: 'Kadim Tapınak' });
      G.emit('templeLooted', { id: f.id });
    } });
    // çalışma zamanı bilgisi (kapı, avlu) ayrı tutulur. Önce templeState[f.id] bu sarmalayıcıyla eziliyordu: ada yeniden
    // kurulunca (uzaklaşıp dönme, kayıt yükleme) bulmaca durumu yerine sarmalayıcı okunuyor, levyeler hata veriyordu.
    (this.temples || (this.temples = {}))[f.id] = { state, gate, cx, cz, y0, top: y0 + 5.1 * S };
    if (f.boss) BOSS_SITES.find((b) => b.id === f.boss) || BOSS_SITES.push({ id: f.boss, x: cx, z: cz - 6, island: B.I.id, land: true, temple: f.id });
  },

  // ---- maden ----
  _mine(B, f, R) {
    const cx = f.x, cz = f.z;
    const yaw = Math.atan2(B.I.x - cx, B.I.z - cz); // girişi adanın içine bakar
    this._place(B, 'kk:town:mine_red', cx + Math.sin(yaw) * 10, cz + Math.cos(yaw) * 10, yaw + Math.PI, { s: 6, col: true, colK: 0.8, tint: 0xb8a898 });
    this._place(B, 'kk:town:scaffolding', cx - Math.cos(yaw) * 12, cz + Math.sin(yaw) * 12, yaw, { s: 4.5, col: true, colK: 0.7 });
    // ocak ağzı: kemerli duvar + karanlık
    const ex = cx + Math.sin(yaw) * 18, ez = cz + Math.cos(yaw) * 18;
    this._place(B, 'kk:dungeon:wall_arched', ex, ez, yaw, { s: 1.5, col: false, tint: 0x9a8a7a });
    const dark = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 5.2), new THREE.MeshBasicMaterial({ color: 0x050302 }));
    dark.userData.own = true; B.mats.push(dark.material);
    dark.position.set(ex + Math.sin(yaw) * 0.6, terrain.heightAt(ex, ez) + 2.6, ez + Math.cos(yaw) * 0.6);
    dark.rotation.y = yaw + Math.PI;
    B.group.add(dark);
    for (let i = 0; i < 8; i++) {
      const a = R() * 6.28, rr = 5 + R() * 12;
      const pick = ['kk:town:resource_stone', 'kk:town:wheelbarrow', 'kk:dungeon:crates_stacked', 'kk:town:crate_long_A', 'kk:dungeon:rubble_half', 'kk:town:sack'][i % 6];
      this._place(B, pick, cx + Math.cos(a) * rr, cz + Math.sin(a) * rr, R() * 6.28, { s: pick.includes('dungeon') ? 0.9 : 4, col: true });
    }
    for (const s of [-1, 1]) { const lx = ex + Math.cos(yaw) * 3.5 * s, lz = ez - Math.sin(yaw) * 3.5 * s; this._place(B, 'kk:dungeon:torch_lit', lx, lz, yaw, { s: 1.3 }); this._lamp(B, lx, terrain.heightAt(lx, lz) + 2, lz, { power: 10, night: false }); }
    this._chest(B, ex - Math.sin(yaw) * 3, ez - Math.cos(yaw) * 3, yaw, f.id, 'mid');
  },

  // ---- gizli pazar (yalnız gece) ----
  _market(B, f, R) {
    const cx = f.x, cz = f.z;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * 6.28, rr = 9;
      const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr;
      this._place(B, 'kk:town:tent', x, z, Math.atan2(cx - x, cz - z), { s: 6, col: true, colK: 0.7, tint: [0x6a4a8a, 0x8a3a3a, 0x3a5a6a][i % 3] });
      this._place(B, 'kk:dungeon:table_small_decorated_A', cx + Math.cos(a) * 5.5, cz + Math.sin(a) * 5.5, a, { s: 0.9, col: true });
      if (i % 2 === 0) { const lx = cx + Math.cos(a + 0.6) * 7, lz = cz + Math.sin(a + 0.6) * 7; this._place(B, 'kk:graveyard:post_lantern', lx, lz, a, { h: 3 }); this._lamp(B, lx, terrain.heightAt(lx, lz) + 2.9, lz, { color: 0xffc070, power: 10 }); }
    }
    this._npc(B, 'smuggler', cx + 2, cz, -Math.PI / 2, R, { look: { hat: 'orijinal', body: 'kukuleta' } });
    this._npc(B, 'treasure', cx - 2, cz + 2, Math.PI / 2, R, { title: 'Sorgusuz Alıcı' });
  },

  // ---- yıkık korsan kasabası ----
  _ruinedTown(B, f, R) {
    const cx = f.x, cz = f.z;
    const items = ['destroyed', 'home_A_red', 'destroyed', 'scaffolding', 'home_B_red', 'destroyed', 'tavern_red', 'destroyed', 'blacksmith_red'];
    items.forEach((b, i) => {
      const a = (i / items.length) * 6.28 + R() * 0.2, rr = 24 + R() * 10;
      const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr;
      this._place(B, `kk:town:${b}`, x, z, Math.atan2(cx - x, cz - z) + (R() - 0.5) * 0.4, { s: TOWN_S, col: true, colK: 0.75, tint: b === 'destroyed' || b === 'scaffolding' ? null : 0x8a7a6a, dy: -0.2 });
    });
    for (let i = 0; i < 10; i++) {
      const a = R() * 6.28, rr = 6 + R() * 16;
      const pick = ['kk:dungeon:rubble_large', 'kk:dungeon:barrel_large', 'kk:town:fence_wood_straight', 'kk:dungeon:box_small', 'kk:dungeon:table_long_broken'][i % 5];
      this._place(B, pick, cx + Math.cos(a) * rr, cz + Math.sin(a) * rr, R() * 6.28, { s: pick.includes('town') ? 5 : 0.9, col: !pick.includes('fence') });
    }
    this._place(B, 'kk:town:stage_A', cx, cz, R() * 6.28, { s: 6 });
    this._chest(B, cx + 3, cz - 2, 0, f.id, 'mid');
  },

  // ---- korsan hapishanesi ----
  _prison(B, f, R) {
    const cx = f.x, cz = f.z;
    const yaw = R() * 6.28;
    const S = 4;
    // avlu duvarları
    for (let side = 0; side < 4; side++) {
      const a = yaw + side * Math.PI / 2;
      for (let k = -3; k <= 3; k++) {
        if (side === 0 && k === 0) continue;
        const ox = Math.sin(a) * 26 + Math.cos(a) * k * 7.6, oz = Math.cos(a) * 26 - Math.sin(a) * k * 7.6;
        this._place(B, 'kk:town:wall_straight', cx + ox, cz + oz, a, { s: S, col: true, colK: 0.95, tint: 0xa89888 });
      }
      const tx = cx + Math.sin(a) * 26 + Math.cos(a) * 27, tz = cz + Math.cos(a) * 26 - Math.sin(a) * 27;
      this._place(B, 'kk:town:tower_base_red', tx, tz, a, { s: 5, col: true, colK: 0.75, tint: 0x9a8a7a });
      this._lamp(B, tx, terrain.heightAt(tx, tz) + 8, tz, { power: 12 });
    }
    this._place(B, 'kk:town:barracks_red', cx - Math.sin(yaw) * 12, cz - Math.cos(yaw) * 12, yaw, { s: 5.5, col: true, colK: 0.8, tint: 0xa09080 });
    // hücreler: parmaklıklı duvarlar sırası, içlerinde tutsaklar
    for (let k = -1; k <= 1; k++) {
      const x = cx + Math.cos(yaw) * k * 6.5 + Math.sin(yaw) * 8, z = cz - Math.sin(yaw) * k * 6.5 + Math.cos(yaw) * 8;
      this._place(B, 'kk:dungeon:wall_gated', x, z, yaw, { s: 1.5, col: true, colK: 1 });
      const back = { x: x + Math.sin(yaw) * 5, z: z + Math.cos(yaw) * 5 };
      this._place(B, 'kk:dungeon:wall', back.x, back.z, yaw, { s: 1.5, col: true, colK: 1, tint: 0x8a8a8a });
      const nx = x + Math.sin(yaw) * 2.4, nz = z + Math.cos(yaw) * 2.4;
      if (!this.freed?.has(`${f.id}_${k}`)) {
        const nid = this._npc(B, 'prisoner', nx, nz, yaw + Math.PI, R, { anim: 'SitFloor', look: { hat: 'bandana', hatColor: '#555', shirtColor: '#8a8070', coat: 'kisa' } });
        B.inter.push({ id: `free:${f.id}:${k}`, x: x - Math.sin(yaw) * 0.8, y: terrain.heightAt(x, z) + 1.2, z: z - Math.cos(yaw) * 0.8, r: 2.4, hold: 2.5, label: 'Hücrenin kilidini kır', action: () => {
          const guards = enemies.list.filter((e) => e.alive && e.group === f.id).length;
          if (guards > 0) { G.notify(`Gardiyanlar hâlâ burada (${guards}). Önce onlarla ilgilen!`, 'warn', 2500); return; }
          (this.freed || (this.freed = new Set())).add(`${f.id}_${k}`);
          npcs.remove(nid);
          G.player.inv.gold += 120;
          G.notify('Tutsak denizci serbest kaldı: "Sağ ol kaptan! Al şu kesemi, saklamıştım." (+120 altın)', 'good', 4500);
          G.emit('prisonerFreed', { id: f.id, k });
          audio.play('confirm', { vol: 0.6 });
        } });
      }
    }
  },

  // ---- yıkık fener ----
  _lighthouse(B, f, R) {
    const x = f.x, z = f.z;
    const y = terrain.heightAt(x, z);
    const g = new THREE.Group();
    const white = new THREE.MeshStandardMaterial({ color: 0xe8e2d4, roughness: 0.8 });
    const red = new THREE.MeshStandardMaterial({ color: 0xa83020, roughness: 0.8 });
    B.mats.push(white, red);
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(2.6 - i * 0.22, 2.8 - i * 0.22, 3, 14), i % 2 ? red : white);
      m.userData.own = true; m.position.y = 1.5 + i * 3; m.castShadow = true; g.add(m);
    }
    const lampMat = new THREE.MeshStandardMaterial({ color: 0xffe0a0, emissive: 0xffc060, emissiveIntensity: 1.6 });
    B.mats.push(lampMat);
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 2, 10), lampMat);
    lamp.userData.own = true; lamp.position.y = 19.5; g.add(lamp);
    const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide });
    B.mats.push(beamMat);
    const beam = new THREE.Mesh(new THREE.ConeGeometry(6, 70, 16, 1, true), beamMat);
    beam.userData.own = true; beam.rotation.z = Math.PI / 2; beam.position.set(35, 19.5, 0);
    const pivot = new THREE.Group(); pivot.position.y = 0; pivot.add(beam); g.add(pivot);
    g.position.set(x, y - 0.5, z);
    B.group.add(g);
    physics.addCircle(x, z, 2.8, y - 2, y + 20, B.tag);
    this._lamp(B, x, y + 19.5, z, { color: 0xffe0a0, power: 40, range: 60, flicker: 0.05 });
    B.tick.push((dt) => { pivot.rotation.y += dt * 0.6; beam.visible = sky.isNight() || (sky.weather?.rain || 0) > 0.4; });
  },

  // ---- karaya oturmuş gemi enkazı ----
  _wreck(B, f, R) {
    const x = f.x, z = f.z;
    const y = Math.max(terrain.heightAt(x, z), -0.5);
    const g = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ map: woodPlanks('#4a3b2c', 41 + Math.floor(R() * 20), 10), roughness: 1, side: THREE.DoubleSide });
    B.mats.push(wood);
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 2.4, 17, 12, 1, true, 0, Math.PI * (0.7 + R() * 0.3)), wood);
    hull.userData.own = true;
    hull.rotation.z = Math.PI / 2; hull.rotation.x = 0.3 + R() * 0.5; hull.position.y = 1.3;
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 12, 6), wood);
    mast.userData.own = true; mast.rotation.z = 0.9 + R() * 0.5; mast.position.set(3, 3, 1.5);
    g.add(hull, mast);
    g.position.set(x, y, z);
    g.rotation.y = R() * 6.28;
    g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    B.group.add(g);
    // gövdenin 17 m'lik ekseni grubun yerel X'inde (silindir z ekseninde 90° döndürülmüş): çarpıştırıcı da öyle (önce 90° çapraz
    // duruyordu; oyuncu ve kamera gövdenin iki ucundan içeri giriyordu)
    physics.addBox(x, z, 8.5, 3.2, g.rotation.y, y - 2, y + 4, B.tag);
    for (let i = 0; i < 4; i++) this._place(B, i % 2 ? 'barrel' : 'crate', x + (R() - 0.5) * 12, z + (R() - 0.5) * 12, R() * 6.28, { h: 1 });
    this._chest(B, x + 4, z + 2, R() * 6.28, f.id, 'mid');
  },

  // ---- batık şehir (su altı) ----
  _sunken(B, f, R) {
    const cx = f.x, cz = f.z;
    const tint = 0x90b8b0;
    for (let i = 0; i < 26; i++) {
      const a = R() * 6.28, rr = 6 + R() * 70;
      const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr;
      const pick = ['kk:dungeon:pillar', 'kk:dungeon:wall_broken', 'kk:dungeon:wall_arched', 'kk:dungeon:pillar_decorated', 'kk:dungeon:rubble_large', 'kk:dungeon:column', 'kk:dungeon:stairs'][i % 7];
      this._place(B, pick, x, z, R() * 6.28, { s: 1.4 + R() * 0.6, col: true, colK: 0.85, tint });
    }
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * 6.28 + R(), rr = 20 + R() * 40;
      this._chest(B, cx + Math.cos(a) * rr, cz + Math.sin(a) * rr, R() * 6.28, f.id + '_' + i, i === 0 ? 'rich' : 'mid');
    }
  },

  // kazı noktası ipucu nesneleri (hazine haritalarında anlatılanlar)
  _digLandmarks(B) {
    for (const s of DIG_SITES) {
      if (s.island !== B.I.id || !s.gen) continue;
      for (const L of s.landmarks) {
        const y = terrain.heightAt(L.x, L.z);
        if (L.type === 'rock') B.batch.add('rock_large', L.x, y - 0.1, L.z, { h: 0.75, yaw: L.x });
        else if (L.type === 'deadtree') B.batch.add('kk:graveyard:tree_dead_large', L.x, y - 0.2, L.z, { h: 5, yaw: L.z });
        else if (L.type === 'column') B.batch.add('column_broken', L.x, y - 0.1, L.z, { h: 3.2, yaw: L.x * 0.7 });
        else if (L.type === 'campfire') B.batch.add('campfire', L.x, y, L.z, { h: 0.2 });
        else if (L.type === 'barrel') B.batch.add('barrel', L.x, y - 0.4, L.z, { h: 1.1, rz: 0.35 });
        else if (L.type === 'obelisk') B.batch.add('obelisk', L.x, y - 0.2, L.z, { h: 6.5, yaw: 0.3 });
        physics.addCircle(L.x, L.z, 0.5, y - 1, y + 2, B.tag);
      }
    }
  },

  // gemiler için deniz kayalıkları
  _seaStacks(B, R) {
    const I = B.I;
    const want = Math.min(4, Math.max(1, Math.floor(I.r / 70)));
    const pp = ports.list.find((p) => p.island === I.id);
    let made = 0;
    for (let tries = 0; tries < 60 && made < want; tries++) {
      const a = R() * Math.PI * 2, r = I.r * (1.12 + R() * 0.4);
      const x = I.x + Math.cos(a) * r * I.ex, z = I.z + Math.sin(a) * r * I.ez;
      const h = terrain.heightAt(x, z);
      if (h > -2.5 || h < -12) continue;
      if (pp && Math.hypot(x - pp.mooring.x, z - pp.mooring.z) < 120) continue;
      const hgt = 9 + R() * 14;
      const tint = I.biome === 'buzul' ? 0xb8c8d8 : I.biome === 'volkan' ? 0x403838 : I.biome === 'col' ? 0xd08a60 : 0x9a9088;
      const moss = I.biome === 'buzul' ? 0xf2f6ff : I.biome === 'volkan' ? 0x4a4440 : I.biome === 'col' ? 0xe0c088 : null;
      B.batch.add('rock_tall', x, h - 1, z, { h: hgt + 1 - h, yaw: R() * 6, tint, moss });
      const ob = { x, z, r: hgt * 0.32 };
      Ship.obstacles.push(ob);
      B.obstacles.push(ob);
      physics.addCircle(x, z, hgt * 0.3, h - 2, hgt, B.tag);
      made++;
    }
  },

  // ---- lav gölü (volkan kraterleri) ----
  _lava(B) {
    const I = B.I;
    const floor = terrain.heightAt(I.x, I.z);
    const rim = terrain.heightAt(I.x + I.r * 0.2, I.z);
    const ly = floor + Math.max(1.2, (rim - floor) * 0.18);
    const rad = I.r * 0.13;
    const mat = new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 } },
      vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: `uniform float uT; varying vec2 vP;
        float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
        float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
        void main(){ vec2 p = vP*0.12; float v = n(p*1.3 + vec2(uT*0.05, -uT*0.04)) * 0.6 + n(p*3.1 - vec2(uT*0.08, uT*0.03)) * 0.4;
          vec3 c = mix(vec3(0.35,0.03,0.0), vec3(1.0,0.45,0.05), smoothstep(0.35, 0.75, v)); c += vec3(1.0,0.8,0.3) * pow(smoothstep(0.7, 0.95, v), 3.0);
          gl_FragColor = vec4(c*1.6, 1.0);
          #include <colorspace_fragment>
        }`,
    });
    B.mats.push(mat);
    const m = new THREE.Mesh(new THREE.CircleGeometry(rad, 40), mat);
    m.userData.own = true;
    m.rotation.x = -Math.PI / 2;
    m.position.set(I.x, ly, I.z);
    B.group.add(m);
    this._lamp(B, I.x, ly + 4, I.z, { color: 0xff5010, power: 60, range: 70, flicker: 0.2, night: false });
    B.lavas.push({ x: I.x, z: I.z, y: ly, r: rad, mat });
    B.tick.push((dt) => { mat.uniforms.uT.value += dt; if (Math.random() < 0.15) effects.smoke(I.x + (Math.random() - 0.5) * rad, ly + 1, I.z + (Math.random() - 0.5) * rad, 1, 1.5, 0.35); });
  },

  _updateLava(dt) {
    const p = G.player;
    if (!p || G.state !== 'playing' || p.dead) return;
    for (const b of this.built.values()) for (const L of b.lavas) {
      if (Math.hypot(p.pos.x - L.x, p.pos.z - L.z) < L.r && p.pos.y < L.y + 0.6) {
        this._lavaT = (this._lavaT || 0) - dt;
        if (this._lavaT <= 0) { this._lavaT = 0.4; p.hurt(14, null, { cause: 'Lava seni yaktı' }); effects.smoke(p.pos.x, p.pos.y + 0.5, p.pos.z, 4, 0.8, 0.3); }
        if (p.pos.y < L.y - 0.3) p.pos.y = L.y - 0.3;
      }
    }
  },

  // ---- ışık havuzu: en yakın fenerlere sabit sayıda ışık ----
  _updateLamps(dt) {
    const cam = G.player?.pos || (G.ship ? { x: G.ship.x, y: 0, z: G.ship.z } : null);
    if (!cam) return;
    const night = 1 - smoothstep(0.15, 0.6, sky.lightLevel ?? 1);
    const cands = [];
    for (const b of this.built.values()) for (const L of b.lamps) {
      const k = L.night ? night : Math.max(0.35, night);
      if (k < 0.05) continue;
      const d = (L.x - cam.x) ** 2 + (L.z - cam.z) ** 2;
      if (d < 120 * 120) cands.push([d, L, k]);
    }
    cands.sort((a, b) => a[0] - b[0]);
    const t = performance.now() * 0.001;
    this.pool.forEach((l, i) => {
      const c = cands[i];
      if (!c) { l.intensity = 0; l.position.y = -500; return; }
      const [, L, k] = c;
      l.position.set(L.x, L.y, L.z);
      l.color.setHex(L.color);
      l.distance = L.range;
      l.intensity = L.power * k * (1 - L.flicker * 0.5 + L.flicker * 0.5 * Math.sin(t * 9 + L.x) * Math.sin(t * 13.7 + L.z));
    });
  },

  // ---- etkileşimler ----
  _interactables(ctx, out) {
    const p = ctx.player;
    if (p.mode !== 'ground' && p.mode !== 'swim') return;
    for (const b of this.built.values()) for (const it of b.inter) {
      if (Math.abs(it.x - p.pos.x) > it.r + 1 || Math.abs(it.z - p.pos.z) > it.r + 1) continue;
      if (it.cond && !it.cond()) continue;
      if (Math.hypot(it.x - p.pos.x, it.z - p.pos.z) > it.r || Math.abs(it.y - p.pos.y) > 3.5) continue;
      out.push({ id: it.id, pos: new THREE.Vector3(it.x, it.y, it.z), radius: it.r, priority: 1.5, label: it.label, hold: it.hold, action: it.action });
    }
  },

  // test/hata ayıklama
  stats() {
    let inst = 0, ms = 0;
    for (const b of this.built.values()) { b.group.traverse((o) => { if (o.isInstancedMesh) inst += o.count; }); ms += b.ms || 0; }
    return { built: [...this.built.keys()], instances: inst, buildMs: Math.round(ms), prof: [...this.built.values()].map((b) => b.prof) };
  },
};
