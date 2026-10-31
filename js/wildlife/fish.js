import * as THREE from 'three';
import { G } from '../game/ctx.js';
import { terrain } from '../world/terrain.js';
import { ocean } from '../world/ocean.js';
import { sky } from '../world/sky.js';
import { combat } from '../game/combat.js';
import { effects } from '../game/effects.js';
import { audio } from '../core/audio.js';
import { FISH_ZONES } from '../world/worldData.js';
import { clamp, damp, dampAngle, lerp, rng } from '../core/util.js';

// ---- Balık türleri: her birinin kendi gövde profili, yüzgeç yapısı, deseni, boyu ve davranışı var ----
// profile: gövde boyunca [0=burun..1=kuyruk] yükseklik (h) ve genişlik (w) çarpanları
export const FISH = {
  palyaco: {
    name: 'Palyaço Balığı', zone: 'reef', len: 0.11, depth: [1, 6], speed: 0.8, school: [4, 8], rarity: 'yaygin', value: 18, weight: [0.15, 0.3],
    colors: ['#ff7a1a', '#ffffff', '#111111'], pattern: 'bands3', profile: { h: 0.42, w: 0.22, tail: 'round' }, bait: ['solucan', 'karides'], time: 'gündüz', diet: 'Alg ve plankton', fins: { dorsal: 0.6, pect: 0.5 },
  },
  melek: {
    name: 'Melek Balığı', zone: 'reef', len: 0.22, depth: [2, 10], speed: 0.7, school: [2, 4], rarity: 'nadir', value: 55, weight: [0.4, 1.2],
    colors: ['#f2d22e', '#1f4fd0', '#0a1a40'], pattern: 'stripesV', profile: { h: 0.95, w: 0.12, tail: 'fan', tall: true }, bait: ['karides'], time: 'gündüz', diet: 'Süngerler', fins: { dorsal: 1.6, pect: 0.4 },
  },
  kelebek: {
    name: 'Kelebek Balığı', zone: 'reef', len: 0.15, depth: [1, 8], speed: 0.9, school: [3, 6], rarity: 'yaygin', value: 22, weight: [0.15, 0.4],
    colors: ['#fff2a0', '#202020', '#f0a020'], pattern: 'eyespot', profile: { h: 0.75, w: 0.12, tail: 'fan' }, bait: ['solucan'], time: 'gündüz', diet: 'Mercan polipleri', fins: { dorsal: 1.0, pect: 0.5 },
  },
  papagan: {
    name: 'Papağan Balığı', zone: 'reef', len: 0.45, depth: [2, 12], speed: 1.0, school: [2, 5], rarity: 'yaygin', value: 40, weight: [1.5, 4],
    colors: ['#2ec4a0', '#3a7ad0', '#f2a0c0'], pattern: 'scales', profile: { h: 0.4, w: 0.25, tail: 'fork', beak: true }, bait: ['karides'], time: 'gündüz', diet: 'Mercan ve alg (gagasıyla kazır)', fins: { dorsal: 0.4, pect: 0.5 },
  },
  cerrah: {
    name: 'Cerrah Balığı', zone: 'reef', len: 0.25, depth: [1, 10], speed: 1.2, school: [5, 10], rarity: 'yaygin', value: 26, weight: [0.3, 0.8],
    colors: ['#1d5fe0', '#0a1530', '#f6d32a'], pattern: 'tang', profile: { h: 0.6, w: 0.14, tail: 'fork' }, bait: ['solucan', 'karides'], time: 'gündüz', diet: 'Alg', fins: { dorsal: 0.5, pect: 0.4 },
  },
  balon: {
    name: 'Balon Balığı', zone: 'reef', len: 0.25, depth: [1, 8], speed: 0.5, school: [1, 2], rarity: 'nadir', value: 60, weight: [0.5, 1.5], puff: true,
    colors: ['#c8b080', '#ffffff', '#5a4a2a'], pattern: 'spots', profile: { h: 0.62, w: 0.55, tail: 'round', round: true }, bait: ['karides'], time: 'gece', diet: 'Kabuklular', fins: { dorsal: 0.3, pect: 0.6 },
  },
  aslan: {
    name: 'Aslan Balığı', zone: 'reef', len: 0.3, depth: [3, 14], speed: 0.45, school: [1, 2], rarity: 'nadir', value: 75, weight: [0.5, 1.2], venom: true,
    colors: ['#c0302a', '#fff2e0', '#601010'], pattern: 'stripesV', profile: { h: 0.45, w: 0.2, tail: 'fan' }, bait: ['yapay'], time: 'akşam', diet: 'Küçük balıklar', fins: { dorsal: 2.2, pect: 1.6, spiky: true },
  },
  snapper: {
    name: 'Kırmızı Snapper', zone: 'reef', len: 0.55, depth: [4, 20], speed: 1.2, school: [3, 6], rarity: 'yaygin', value: 45, weight: [2, 6],
    colors: ['#e0402a', '#ffb0a0', '#802010'], pattern: 'gradient', profile: { h: 0.42, w: 0.2, tail: 'fork' }, bait: ['karides', 'yapay'], time: 'her zaman', diet: 'Küçük balık ve karides', fins: { dorsal: 0.6, pect: 0.5 },
  },
  barakuda: {
    name: 'Baraküda', zone: 'open', len: 1.2, depth: [2, 18], speed: 3.2, school: [3, 6], rarity: 'nadir', value: 90, weight: [5, 15], predator: true,
    colors: ['#b8c4cc', '#3a4a58', '#e8eef2'], pattern: 'chevrons', profile: { h: 0.16, w: 0.12, tail: 'fork', long: true }, bait: ['yapay'], time: 'gündüz', diet: 'Sardalya ve resif balıkları', fins: { dorsal: 0.3, pect: 0.3 },
  },
  orkinos: {
    name: 'Orkinos', zone: 'open', len: 1.6, depth: [3, 25], speed: 3.8, school: [3, 7], rarity: 'epik', value: 260, weight: [40, 120], big: true,
    colors: ['#1a2a5a', '#c0c8d8', '#f2d040'], pattern: 'tuna', profile: { h: 0.28, w: 0.24, tail: 'crescent' }, bait: ['yapay'], time: 'şafak', diet: 'Uskumru ve sardalya', fins: { dorsal: 0.5, pect: 0.5, finlets: true },
  },
  sardalya: {
    name: 'Sardalya', zone: 'open', len: 0.16, depth: [1, 12], speed: 2.2, school: [24, 40], rarity: 'siradan', value: 6, weight: [0.05, 0.12],
    colors: ['#b8d0e0', '#2a5a7a', '#ffffff'], pattern: 'silver', profile: { h: 0.22, w: 0.12, tail: 'fork' }, bait: ['solucan'], time: 'her zaman', diet: 'Plankton', fins: { dorsal: 0.3, pect: 0.3 },
  },
  orfoz: {
    name: 'Dev Orfoz', zone: 'reef', len: 1.4, depth: [6, 26], speed: 0.6, school: [1, 1], rarity: 'epik', value: 320, weight: [40, 150], big: true,
    colors: ['#6a5a3a', '#3a2e1e', '#a89060'], pattern: 'mottled', profile: { h: 0.4, w: 0.32, tail: 'round', bigmouth: true }, bait: ['karides', 'yapay'], time: 'akşam', diet: 'Her şey', fins: { dorsal: 0.5, pect: 0.6 },
  },
};

// ---- Doku üretimi ----
function fishTexture(sp, seed) {
  const W = 128, H = 64;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const [a, b, d] = sp.colors;
  const r = rng(seed);
  // u: 0 burun -> 1 kuyruk (x), v: üst->alt (y)
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, sp.pattern === 'tuna' ? a : a);
  grad.addColorStop(sp.pattern === 'tuna' || sp.pattern === 'silver' ? 0.45 : 0.5, sp.pattern === 'tuna' || sp.pattern === 'silver' ? b : a);
  grad.addColorStop(1, sp.pattern === 'gradient' ? b : sp.pattern === 'tuna' || sp.pattern === 'silver' ? d : a);
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  switch (sp.pattern) {
    case 'bands3':
      for (const x of [0.22, 0.5, 0.78]) { g.fillStyle = d; g.fillRect(x * W - 9, 0, 18, H); g.fillStyle = b; g.fillRect(x * W - 6, 0, 12, H); }
      break;
    case 'stripesV':
      for (let i = 0; i < 9; i++) { g.fillStyle = i % 2 ? b : d; g.fillRect(i * W / 9, 0, W / 18, H); }
      break;
    case 'eyespot':
      g.fillStyle = d; g.fillRect(W * 0.12, 0, 8, H);
      g.beginPath(); g.arc(W * 0.72, H * 0.4, 8, 0, 6.3); g.fill();
      g.fillStyle = b; g.fillRect(W * 0.85, 0, 18, H);
      break;
    case 'scales':
      for (let y = 0; y < H; y += 6) for (let x = (y / 6) % 2 * 4; x < W; x += 8) { g.fillStyle = `rgba(255,255,255,${0.1 + r() * 0.15})`; g.beginPath(); g.arc(x, y, 3, 0, Math.PI); g.fill(); }
      g.fillStyle = d; g.globalAlpha = 0.5; g.fillRect(0, H * 0.4, W * 0.2, H * 0.3); g.globalAlpha = 1;
      break;
    case 'tang':
      g.fillStyle = b; g.beginPath(); g.ellipse(W * 0.5, H * 0.38, W * 0.32, H * 0.16, 0, 0, 6.3); g.fill();
      g.fillStyle = d; g.fillRect(W * 0.82, 0, W * 0.18, H);
      break;
    case 'spots':
      for (let i = 0; i < 40; i++) { g.fillStyle = d; g.beginPath(); g.arc(r() * W, r() * H * 0.6, 2 + r() * 2, 0, 6.3); g.fill(); }
      g.fillStyle = b; g.fillRect(0, H * 0.62, W, H * 0.38);
      break;
    case 'chevrons':
      g.strokeStyle = b; g.lineWidth = 3;
      for (let x = 10; x < W; x += 12) { g.beginPath(); g.moveTo(x, 4); g.lineTo(x - 6, H * 0.3); g.lineTo(x, H * 0.55); g.stroke(); }
      break;
    case 'tuna':
      g.fillStyle = d; for (let x = W * 0.6; x < W * 0.92; x += 6) g.fillRect(x, H * 0.08, 3, 5);
      break;
    case 'mottled':
      for (let i = 0; i < 70; i++) { g.fillStyle = r() < 0.5 ? b : d; g.globalAlpha = 0.6; g.beginPath(); g.arc(r() * W, r() * H, 3 + r() * 6, 0, 6.3); g.fill(); }
      g.globalAlpha = 1;
      break;
    case 'gradient':
      g.fillStyle = 'rgba(255,255,255,0.15)'; for (let y = 4; y < H; y += 7) g.fillRect(0, y, W, 1);
      break;
    case 'silver':
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, H * 0.45, W, 3);
      break;
  }
  // göz
  g.fillStyle = '#fff'; g.beginPath(); g.arc(W * 0.07, H * 0.38, 3.2, 0, 6.3); g.fill();
  g.fillStyle = '#000'; g.beginPath(); g.arc(W * 0.07, H * 0.38, 2, 0, 6.3); g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---- Geometri: profilden gövde + kuyruk + yüzgeçler ----
function fishGeometry(sp) {
  const P = sp.profile;
  const L = 1; // birim uzunluk, ölçek ile büyütülür
  const segs = 14, ring = 10;
  const pos = [], uv = [], idx = [];
  const H = P.h * 0.5 * L, Wd = P.w * 0.5 * L;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs; // 0 burun -> 1 kuyruk sapı
    let s = Math.sin(Math.PI * Math.pow(t, 0.75)) ;
    if (P.round) s = Math.sqrt(Math.max(0, 1 - Math.pow(t * 2 - 1, 2)));
    if (P.long) s = Math.pow(Math.sin(Math.PI * Math.pow(t, 0.6)), 0.6);
    if (t > 0.85) s *= lerp(1, 0.35, (t - 0.85) / 0.15);
    const z = (0.5 - t) * L * 0.8; // +Z burun
    for (let j = 0; j <= ring; j++) {
      const a = (j / ring) * Math.PI * 2;
      let y = Math.cos(a) * H * s * (P.tall ? (Math.cos(a) > 0 ? 1.1 : 1) : 1);
      const x = Math.sin(a) * Wd * s;
      if (P.bigmouth && t < 0.15 && Math.cos(a) < 0) y *= 1.25;
      pos.push(x, y, z);
      uv.push(t * 0.95, Math.cos(a) * 0.5 + 0.5);
    }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < ring; j++) {
    const a = i * (ring + 1) + j, b = a + 1, c = a + ring + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const addTri = (p1, p2, p3, u = 0.97) => {
    const base = pos.length / 3;
    pos.push(...p1, ...p2, ...p3); uv.push(u, 0.5, u, 0.2, u, 0.8);
    idx.push(base, base + 1, base + 2, base, base + 2, base + 1);
  };
  const tz = -0.4 * L;
  // kuyruk
  const th = H * 1.6;
  if (P.tail === 'fork' || P.tail === 'crescent') {
    const sp2 = P.tail === 'crescent' ? 1.8 : 1.2;
    addTri([0, 0, tz], [0, th * sp2 * 0.5, tz - 0.22], [0, th * 0.15, tz - 0.12]);
    addTri([0, 0, tz], [0, -th * 0.15, tz - 0.12], [0, -th * sp2 * 0.5, tz - 0.22]);
  } else if (P.tail === 'fan') {
    addTri([0, 0, tz], [0, th * 0.6, tz - 0.2], [0, -th * 0.6, tz - 0.2]);
  } else {
    addTri([0, 0, tz], [0, th * 0.45, tz - 0.16], [0, -th * 0.45, tz - 0.16]);
  }
  // sırt yüzgeci
  const F = sp.fins;
  const dh = H * F.dorsal;
  addTri([0, H * 0.8, 0.15], [0, H * 0.75 + dh, -0.05], [0, H * 0.7, -0.22], 0.5);
  if (sp.profile.tall) addTri([0, -H * 0.8, 0.05], [0, -H * 0.75 - dh * 0.8, -0.12], [0, -H * 0.6, -0.25], 0.5);
  // göğüs yüzgeçleri
  for (const s of [-1, 1]) addTri([s * Wd * 0.8, -H * 0.1, 0.18], [s * (Wd + 0.12 * F.pect), -H * 0.3, 0.02], [s * Wd * 0.7, -H * 0.3, 0.1], 0.3);
  if (F.spiky) {
    for (let k = 0; k < 7; k++) addTri([0, H * 0.7, 0.18 - k * 0.06], [0, H * 1.9, 0.2 - k * 0.07], [0, H * 0.7, 0.16 - k * 0.06], 0.5);
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) addTri([s * Wd, 0, 0.1 - k * 0.03], [s * (Wd + 0.3), -H * (0.2 + k * 0.3), 0.05 - k * 0.06], [s * Wd, -0.02, 0.08 - k * 0.03], 0.3);
  }
  if (P.beak) addTri([-0.03, -H * 0.05, 0.42], [0.03, -H * 0.05, 0.42], [0, -H * 0.2, 0.46], 0.02);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// Yüzme dalgası: kuyruğa doğru artan yanal kıvrım (örnek başı faz)
function swimMaterial(tex, opts = {}) {
  const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4, metalness: 0.15, side: THREE.DoubleSide });
  m.onBeforeCompile = (s) => {
    s.uniforms.uTime = { value: 0 };
    m.userData.shader = s;
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime; attribute float aPhase; attribute float aSpeed; attribute float aPuff;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float tailK = clamp(0.45 - position.z, 0.0, 1.4);
        transformed.x += sin(uTime * (4.0 + aSpeed*6.0) + aPhase - position.z*7.0) * 0.12 * tailK * tailK;
        transformed *= 1.0 + aPuff * 0.8 * smoothstep(-0.3, 0.3, position.z + 0.1);`);
  };
  return m;
}

export const fish = {
  name: 'fish',
  schools: [],
  shark: null,
  dummy: new THREE.Object3D(),

  init(scene) {
    this.scene = scene;
    this.species = {};
    let seed = 1;
    for (const key in FISH) {
      const sp = FISH[key];
      const geo = fishGeometry(sp);
      const maxN = 160;
      const phase = new Float32Array(maxN), speedA = new Float32Array(maxN), puff = new Float32Array(maxN);
      for (let i = 0; i < maxN; i++) phase[i] = Math.random() * 10;
      geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phase, 1));
      geo.setAttribute('aSpeed', new THREE.InstancedBufferAttribute(speedA, 1));
      geo.setAttribute('aPuff', new THREE.InstancedBufferAttribute(puff, 1));
      const mat = swimMaterial(fishTexture(sp, seed++));
      const im = new THREE.InstancedMesh(geo, mat, maxN);
      im.count = 0;
      im.frustumCulled = false;
      im.castShadow = false;
      scene.add(im);
      this.species[key] = { sp, im, mat, n: 0, speedA, puff };
    }
    this._buildShark(scene);
    this._buildBigCreatures(scene);
  },

  start() {
    this.schools = [];
    for (const k in this.species) this.species[k].im.count = 0;
    this.spawnT = 0;
    this.sharkState = { mode: 'patrol', t: 0, target: null, cd: 0 };
  },
  stop() { this.start(); },

  // Bölgeye göre balık sürüleri oluştur (oyuncu çevresinde)
  _populate() {
    const p = G.player;
    if (!p) return;
    const focus = p.pos;
    // uzak sürüleri kaldır
    this.schools = this.schools.filter((s) => s.center.distanceTo(focus) < 260);
    const want = 16;
    let guard = 0;
    while (this.schools.length < want && guard++ < 40) {
      const a = Math.random() * 6.28, r = 30 + Math.random() * 180;
      const x = focus.x + Math.cos(a) * r, z = focus.z + Math.sin(a) * r;
      const floor = terrain.heightAt(x, z);
      if (floor > -1.6) continue;
      let zoneType = 'open';
      for (const fz of FISH_ZONES) if (Math.hypot(x - fz.x, z - fz.z) < fz.r) { zoneType = fz.type; if (fz.type === 'reef') break; }
      if (floor > -9) zoneType = zoneType === 'open' && floor > -5 ? 'reef' : zoneType;
      const cands = Object.keys(FISH).filter((k) => FISH[k].zone === zoneType && -floor > FISH[k].depth[0]);
      if (!cands.length) continue;
      // nadir türler daha seyrek
      const weights = cands.map((k) => ({ siradan: 6, yaygin: 4, nadir: 1.6, epik: 0.5 }[FISH[k].rarity] || 1) * (FISH[k].time === 'gece' && !sky.isNight() ? 0.3 : 1));
      let tot = weights.reduce((x, y) => x + y, 0), pick = Math.random() * tot, key = cands[0];
      for (let i = 0; i < cands.length; i++) { pick -= weights[i]; if (pick <= 0) { key = cands[i]; break; } }
      const sp = FISH[key];
      const n = Math.floor(sp.school[0] + Math.random() * (sp.school[1] - sp.school[0] + 1));
      const depth = clamp(sp.depth[0] + Math.random() * (sp.depth[1] - sp.depth[0]), 0.8, -floor - 0.8);
      const center = new THREE.Vector3(x, -depth, z);
      const members = [];
      for (let i = 0; i < n; i++) {
        const size = sp.len * (0.75 + Math.random() * 0.5);
        members.push({
          p: center.clone().add(new THREE.Vector3((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 4)),
          v: new THREE.Vector3((Math.random() - 0.5), 0, (Math.random() - 0.5)).normalize().multiplyScalar(sp.speed),
          size, puff: 0, alive: true,
        });
      }
      this.schools.push({ key, sp, center, home: center.clone(), members, wander: new THREE.Vector3(), t: 0 });
    }
  },

  update(dt) {
    this.spawnT -= dt;
    if (this.spawnT <= 0) { this.spawnT = 2; this._populate(); }
    const p = G.player;
    const threats = [];
    if (p && (p.mode === 'swim')) threats.push(p.pos.clone().setY(p.pos.y + 1));
    if (this.shark && this.shark.visible) threats.push(this.shark.position);
    for (const k in this.species) this.species[k].n = 0;
    const tmp = new THREE.Vector3(), sep = new THREE.Vector3(), coh = new THREE.Vector3(), ali = new THREE.Vector3();
    for (const s of this.schools) {
      s.t += dt;
      const sp = s.sp;
      // sürü dolaşma hedefi
      if (s.t > 6 || !s.target) {
        s.t = 0;
        s.target = s.home.clone().add(new THREE.Vector3((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 30));
      }
      const alive = s.members.filter((m) => m.alive);
      coh.set(0, 0, 0); ali.set(0, 0, 0);
      for (const m of alive) { coh.add(m.p); ali.add(m.v); }
      if (alive.length) { coh.divideScalar(alive.length); ali.divideScalar(alive.length); }
      s.center.copy(coh);
      for (const m of alive) {
        const acc = new THREE.Vector3();
        acc.addScaledVector(tmp.copy(coh).sub(m.p), 0.4);
        acc.addScaledVector(tmp.copy(ali).sub(m.v), 0.5);
        acc.addScaledVector(tmp.copy(s.target).sub(m.p).normalize(), 0.6);
        // ayrılma
        sep.set(0, 0, 0);
        for (const o of alive) { if (o === m) continue; tmp.copy(m.p).sub(o.p); const d = tmp.length(); if (d < sp.len * 2.2 && d > 0) sep.addScaledVector(tmp, 1 / (d * d)); }
        acc.addScaledVector(sep, 0.04);
        // tehditlerden kaç
        let fleeing = false;
        for (const t of threats) {
          tmp.copy(m.p).sub(t);
          const d = tmp.length();
          if (d < 5.5) { acc.addScaledVector(tmp.normalize(), 6 * (1 - d / 5.5) + 2); fleeing = true; }
        }
        // balon balığı şişer
        if (sp.puff) m.puff = damp(m.puff, fleeing ? 1 : 0, 3, dt);
        // yırtıcı sürü: küçük balık avlar
        // zemin / yüzey / kara sınırları
        const floor = terrain.heightAt(m.p.x, m.p.z);
        const surf = ocean.heightAt(m.p.x, m.p.z) - 0.6;
        if (m.p.y < floor + 0.6) acc.y += 3;
        if (m.p.y > surf) acc.y -= 4;
        if (floor > -1.3) { tmp.copy(s.home).sub(m.p).setY(0).normalize(); acc.addScaledVector(tmp, 5); }
        const maxSp = sp.speed * (fleeing ? 2.6 : 1);
        m.v.addScaledVector(acc, dt * 2.2);
        const l = m.v.length();
        if (l > maxSp) m.v.multiplyScalar(maxSp / l);
        if (l < sp.speed * 0.3) m.v.multiplyScalar(1.2);
        m.p.addScaledVector(m.v, dt);
        m.p.y = clamp(m.p.y, floor + 0.35, surf);
      }
      // yırtıcılar
      if (sp.predator && alive.length && Math.random() < dt * 0.15) {
        const prey = this.schools.find((o) => o !== s && !o.sp.predator && o.sp.len < 0.3 && o.center.distanceTo(s.center) < 25);
        if (prey) { s.target = prey.center.clone(); const victim = prey.members.find((m) => m.alive && m.p.distanceTo(s.center) < 3); if (victim) { victim.alive = false; effects.bubbles(victim.p.x, victim.p.y, victim.p.z); } }
      }
      // örnekleri yaz
      const S = this.species[s.key];
      for (const m of alive) {
        if (S.n >= S.im.instanceMatrix.count) break;
        this.dummy.position.copy(m.p);
        this.dummy.rotation.set(0, Math.atan2(m.v.x, m.v.z), 0);
        this.dummy.rotateX(-Math.atan2(m.v.y, Math.hypot(m.v.x, m.v.z)) * 0.7);
        this.dummy.scale.setScalar(m.size);
        this.dummy.updateMatrix();
        S.im.setMatrixAt(S.n, this.dummy.matrix);
        S.speedA[S.n] = clamp(m.v.length() / 4, 0, 1);
        S.puff[S.n] = m.puff;
        S.n++;
      }
    }
    for (const k in this.species) {
      const S = this.species[k];
      S.im.count = S.n;
      S.im.instanceMatrix.needsUpdate = true;
      S.im.geometry.attributes.aSpeed.needsUpdate = true;
      S.im.geometry.attributes.aPuff.needsUpdate = true;
      const sh = S.mat.userData.shader;
      if (sh) sh.uniforms.uTime.value += dt;
    }
    this._updateShark(dt);
    this._updateBig(dt);
  },

  // Yakındaki türler (balıkçılık için)
  speciesNear(pos, radius = 30) {
    const out = new Map();
    for (const s of this.schools) if (s.center.distanceTo(pos) < radius) out.set(s.key, (out.get(s.key) || 0) + s.members.filter((m) => m.alive).length);
    return out;
  },

  // ---- Köpekbalığı (Kaplan köpekbalığı) ----
  _buildShark(scene) {
    const g = new THREE.Group();
    const sp = { profile: { h: 0.22, w: 0.2, tail: 'crescent', long: false }, fins: { dorsal: 1.4, pect: 1.8 } };
    const geo = fishGeometry(sp);
    const c = document.createElement('canvas'); c.width = 128; c.height = 64;
    const x = c.getContext('2d');
    const gr = x.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, '#4a5a66'); gr.addColorStop(0.55, '#6a7a86'); gr.addColorStop(0.6, '#e8eaec'); gr.addColorStop(1, '#f2f2f2');
    x.fillStyle = gr; x.fillRect(0, 0, 128, 64);
    x.fillStyle = 'rgba(30,40,50,0.5)'; for (let i = 0; i < 14; i++) x.fillRect(20 + i * 7, 4, 3, 18);
    x.fillStyle = '#000'; x.beginPath(); x.arc(9, 26, 2.5, 0, 6.3); x.fill();
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const mat = swimMaterial(tex);
    const geoInst = geo;
    geoInst.setAttribute('aPhase', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count).fill(0), 1));
    geoInst.setAttribute('aSpeed', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count).fill(0.3), 1));
    geoInst.setAttribute('aPuff', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count).fill(0), 1));
    const m = new THREE.Mesh(geoInst, mat);
    m.scale.setScalar(3.6);
    m.castShadow = true;
    g.add(m);
    g.visible = false;
    scene.add(g);
    this.shark = g;
    this.sharkMat = mat;
    this.sharkTarget = {
      pos: new THREE.Vector3(), radius: 0.9, height: 0.8, alive: true, big: true, hp: 160, maxHp: 160, bloodColor: [0.6, 0.05, 0.05],
      hurt: (dmg) => {
        const t = this.sharkTarget;
        if (!t.alive) return;
        t.hp -= dmg;
        effects.blood(t.pos.x, t.pos.y, t.pos.z);
        this.sharkState.mode = 'flee'; this.sharkState.t = 0;
        if (t.hp <= 0) { t.alive = false; this.shark.visible = false; G.notify('Köpekbalığını alt ettin!', 'good'); G.emit('seeAnimal', 'shark'); G.emit('loot', { pos: t.pos.clone().setY(ocean.heightAt(t.pos.x, t.pos.z)), table: [['altin_para', 0, 0]], from: 'Köpekbalığı' }); t.respawn = 180; }
      },
    };
    combat.addTarget(this.sharkTarget);
  },

  _updateShark(dt) {
    const s = this.shark, st = this.sharkState, T = this.sharkTarget;
    if (!s || !st) return;
    const p = G.player;
    if (!T.alive) { T.respawn -= dt; if (T.respawn <= 0) { T.alive = true; T.hp = T.maxHp; } return; }
    // açık ve derin suda dolaşır
    if (!s.visible) {
      if (p && Math.random() < dt * 0.05) {
        const a = Math.random() * 6.28, r = 50;
        const x = p.pos.x + Math.cos(a) * r, z = p.pos.z + Math.sin(a) * r;
        if (terrain.heightAt(x, z) < -8) { s.position.set(x, -4, z); s.visible = true; st.mode = 'patrol'; st.t = 0; }
      }
      return;
    }
    st.t += dt;
    st.cd -= dt;
    const pd = p ? s.position.distanceTo(p.pos) : 1e9;
    let target;
    if (st.mode === 'patrol') {
      const a = st.t * 0.25;
      target = new THREE.Vector3(s.position.x + Math.cos(a) * 10, -4 + Math.sin(st.t * 0.3), s.position.z + Math.sin(a) * 10);
      if (p && p.mode === 'swim' && pd < 30) { st.mode = 'hunt'; st.t = 0; G.notify('Suda bir gölge belirdi… Köpekbalığı!', 'warn'); audio.tone(110, 1.2, 'sine', 0.15, null, 0.7); G.emit('seeAnimal', 'shark'); }
      if (pd > 220) s.visible = false;
    } else if (st.mode === 'hunt') {
      target = p.pos.clone().add(new THREE.Vector3(0, 0.8, 0));
      if (p.mode !== 'swim') { st.mode = 'patrol'; }
      if (pd < 1.8 && st.cd <= 0) {
        st.cd = 2.8;
        p.hurt(24, s.position, { cause: 'Köpekbalığı saldırısı' });
        effects.blood(p.pos.x, p.pos.y + 1, p.pos.z);
        st.mode = 'circle'; st.t = 0;
        combat.markCombat();
      }
    } else if (st.mode === 'circle') {
      const a = st.t * 1.2;
      target = p.pos.clone().add(new THREE.Vector3(Math.cos(a) * 7, 0.5, Math.sin(a) * 7));
      if (st.t > 3.5) st.mode = p.mode === 'swim' ? 'hunt' : 'patrol';
    } else if (st.mode === 'flee') {
      target = s.position.clone().add(s.position.clone().sub(p.pos).setY(0).normalize().multiplyScalar(20));
      if (st.t > 5) { st.mode = 'patrol'; }
    }
    const dir = target.sub(s.position);
    const d = dir.length();
    dir.normalize();
    const speed = st.mode === 'hunt' ? 5.2 : st.mode === 'flee' ? 6 : 2.4;
    const fwd = new THREE.Vector3(Math.sin(s.rotation.y), 0, Math.cos(s.rotation.y));
    s.rotation.y = dampAngle(s.rotation.y, Math.atan2(dir.x, dir.z), 2.2, dt);
    s.position.addScaledVector(fwd, speed * dt);
    s.position.y = damp(s.position.y, s.position.y + dir.y * 2, 2, dt);
    const floor = terrain.heightAt(s.position.x, s.position.z);
    if (floor > -3) { s.rotation.y += dt * 2; }
    s.position.y = clamp(s.position.y, floor + 1, ocean.heightAt(s.position.x, s.position.z) - 0.4);
    T.pos.copy(s.position);
    const sh = this.sharkMat.userData.shader;
    if (sh) sh.uniforms.uTime.value += dt;
    void d;
  },

  // Büyük zararsız canlılar: manta, deniz kaplumbağası, yunus sürüsü
  _buildBigCreatures(scene) {
    this.big = [];
    // manta
    const manta = new THREE.Group();
    const mg = new THREE.BufferGeometry();
    const v = [0, 0, 0.8, -1.6, 0, -0.2, 0, 0.12, -0.4, 0, 0, 0.8, 0, 0.12, -0.4, 1.6, 0, -0.2, 0, 0, 0.8, -1.6, 0, -0.2, 0, -0.05, -0.4, 0, 0, 0.8, 0, -0.05, -0.4, 1.6, 0, -0.2];
    mg.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    mg.computeVertexNormals();
    const mm = new THREE.Mesh(mg, new THREE.MeshStandardMaterial({ color: 0x2a3540, side: THREE.DoubleSide, roughness: 0.6 }));
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.03, 1.4, 4), new THREE.MeshStandardMaterial({ color: 0x2a3540 }));
    tail.rotation.x = Math.PI / 2; tail.position.z = -1.0;
    manta.add(mm, tail);
    manta.scale.setScalar(1.8);
    scene.add(manta);
    this.big.push({ kind: 'manta', obj: manta, mesh: mm, base: Float32Array.from(v), center: new THREE.Vector3(470, -6, 420), r: 40, t: Math.random() * 10, depth: -6 });
    // kaplumbağa
    const turtle = new THREE.Group();
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x5a6a30, roughness: 0.6 }));
    shell.scale.set(1, 0.45, 1.25);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), new THREE.MeshStandardMaterial({ color: 0x8a9a5a }));
    head.position.set(0, 0, 0.7);
    const flippers = [];
    for (const [x, z] of [[-0.45, 0.3], [0.45, 0.3], [-0.35, -0.4], [0.35, -0.4]]) {
      const f = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.04, 0.18), new THREE.MeshStandardMaterial({ color: 0x8a9a5a }));
      f.position.set(x, 0, z);
      turtle.add(f); flippers.push(f);
    }
    turtle.add(shell, head);
    scene.add(turtle);
    this.big.push({ kind: 'turtle', obj: turtle, flippers, center: new THREE.Vector3(150, -3, 270), r: 50, t: Math.random() * 10, depth: -3 });
    const turtle2 = turtle.clone(true);
    scene.add(turtle2);
    this.big.push({ kind: 'turtle', obj: turtle2, flippers: turtle2.children.slice(0, 4), center: new THREE.Vector3(690, -4, -300), r: 60, t: 5, depth: -4 });
    // yunuslar
    const dolphinGeo = fishGeometry({ profile: { h: 0.22, w: 0.2, tail: 'crescent' }, fins: { dorsal: 1.2, pect: 1.2 } });
    for (const a of ['aPhase', 'aSpeed', 'aPuff']) dolphinGeo.setAttribute(a, new THREE.Float32BufferAttribute(new Float32Array(dolphinGeo.attributes.position.count).fill(a === 'aSpeed' ? 0.5 : 0), 1));
    const dmat = new THREE.MeshStandardMaterial({ color: 0x7a8a9a, roughness: 0.4, side: THREE.DoubleSide });
    const pod = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const d = new THREE.Mesh(dolphinGeo, dmat);
      d.rotation.y = Math.PI; d.scale.setScalar(2.2);
      const holder = new THREE.Group(); holder.add(d);
      holder.position.set((i % 2) * 3 - 1.5, 0, Math.floor(i / 2) * 3);
      pod.add(holder);
    }
    scene.add(pod);
    this.big.push({ kind: 'dolphin', obj: pod, center: new THREE.Vector3(200, 0, 520), r: 120, t: 0, depth: 0 });
  },

  _updateBig(dt) {
    const p = G.player;
    for (const b of this.big) {
      b.t += dt;
      const sp = b.kind === 'dolphin' ? 0.09 : 0.05;
      const a = b.t * sp;
      const x = b.center.x + Math.cos(a) * b.r, z = b.center.z + Math.sin(a * 1.3) * b.r * 0.7;
      const nx = b.center.x + Math.cos(a + 0.01) * b.r, nz = b.center.z + Math.sin((a + 0.01) * 1.3) * b.r * 0.7;
      let y = b.depth + Math.sin(b.t * 0.5) * 0.5;
      if (b.kind === 'dolphin') y = -0.8 + Math.max(0, Math.sin(b.t * 2.2)) * 1.6 - 0.6;
      const floor = terrain.heightAt(x, z);
      b.obj.visible = floor < y - 0.8;
      b.obj.position.set(x, Math.max(y, floor + 1), z);
      b.obj.rotation.y = Math.atan2(nx - x, nz - z);
      if (b.kind === 'dolphin') b.obj.rotation.x = -Math.cos(b.t * 2.2) * 0.4;
      if (b.kind === 'manta') {
        const pos = b.mesh.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) { const bx = b.base[i * 3]; pos.setY(i, b.base[i * 3 + 1] + Math.sin(b.t * 2 - Math.abs(bx) * 1.2) * 0.25 * Math.abs(bx)); }
        pos.needsUpdate = true;
      }
      if (b.kind === 'turtle') b.flippers.forEach((f, i) => { f.rotation.z = Math.sin(b.t * 2 + i) * 0.5; });
      if (p && b.obj.visible && b.obj.position.distanceTo(p.pos) < 25) G.emit('seeAnimal', b.kind);
    }
  },
};
