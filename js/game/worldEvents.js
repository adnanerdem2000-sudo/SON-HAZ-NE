import * as THREE from 'three';
import { G } from './ctx.js';
import { Ship } from '../ship/ship.js';
import { effects } from './effects.js';
import { audio } from '../core/audio.js';
import { terrain } from '../world/terrain.js';
import { ocean } from '../world/ocean.js';
import { sky } from '../world/sky.js';
import { regionAt, EXTRA_ISLANDS } from '../world/archipelago.js';
import { tpCamera } from '../player/camera.js';
import { events } from './events.js';

// Bağlama duyarlı deniz olayları: bölge, saat, hava ve oyuncunun durumuna göre seçilir.
//  buzdağları (Buzul), hayalet ışıklar (Hayalet Denizleri, gece), gök taşı (açık gece),
//  volkanik bombardıman (Kül Adaları), ışıldayan plankton (ılık sular, gece), fırtına enkazı.

let GLOW = null;
let SMOKE = null;
function glowTex() {
  if (GLOW) return GLOW;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(200,255,240,.85)'); gr.addColorStop(1, 'rgba(120,255,220,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  GLOW = new THREE.CanvasTexture(c);
  return GLOW;
}

function icebergMesh(r, seed) {
  let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const g = new THREE.Group();
  const top = new THREE.IcosahedronGeometry(r, 1);
  const pos = top.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const k = 0.75 + rnd() * 0.5;
    pos.setXYZ(i, pos.getX(i) * k, y > 0 ? y * (0.55 + rnd() * 0.5) : y * 0.25, pos.getZ(i) * k);
  }
  top.computeVertexNormals();
  const m1 = new THREE.Mesh(top, new THREE.MeshStandardMaterial({ color: 0xeef7ff, roughness: 0.3, metalness: 0.05, flatShading: true }));
  m1.castShadow = true; m1.receiveShadow = true;
  const under = new THREE.Mesh(new THREE.IcosahedronGeometry(r * 1.35, 1), new THREE.MeshStandardMaterial({ color: 0x7ad0e8, roughness: 0.2, transparent: true, opacity: 0.55, flatShading: true }));
  under.scale.y = 0.6; under.position.y = -r * 0.75;
  g.add(m1, under);
  return g;
}

export const worldEvents = {
  name: 'worldEvents',
  icebergs: [],
  wisps: null,
  meteor: null,
  volcanic: null,
  plankton: null,

  init(scene) { this.scene = scene; },
  start() { this.clear(); },
  stop() { this.clear(); },
  clear() {
    for (const b of this.icebergs) { this.scene.remove(b.mesh); Ship.obstacles = Ship.obstacles.filter((o) => o !== b.ob); }
    this.icebergs = [];
    if (this.wisps) for (const w of this.wisps.orbs) this.scene.remove(w);
    if (this.meteor) this.scene.remove(this.meteor.mesh);
    if (this.volcanic?.plume) this.scene.remove(this.volcanic.plume.grp);
    this.wisps = this.meteor = this.volcanic = this.plankton = null;
  },

  context() {
    const p = G.player, s = G.ship;
    const at = s && p && (p.mode === 'deck' || p.mode === 'helm' || p.ship) ? { x: s.x, z: s.z } : p ? { x: p.pos.x, z: p.pos.z } : { x: 0, z: 0 };
    let volc = null, vd = 1e9;
    for (const I of EXTRA_ISLANDS) if (I.shape === 'volcano') { const d = Math.hypot(I.x - at.x, I.z - at.z) - I.r; if (d < vd) { vd = d; volc = I; } }
    return { at, reg: regionAt(at.x, at.z), night: sky.isNight(), calm: ['acik', 'parcali'].includes(sky.weatherKey), volc, vd, stormAgo: (performance.now() - (this.lastStorm || -1e9)) / 1000 };
  },

  // bu bağlamda olası yeni olayların ağırlıkları
  weights(c) {
    return [
      ['iceberg', c.reg === 'buzul' && !this.icebergs.length ? 2.2 : 0],
      ['wisps', c.reg === 'hayalet' && !this.wisps ? (c.night ? 2.4 : 0.5) : 0],
      ['meteor', c.night && c.calm && !this.meteor ? 0.7 : 0],
      ['volcanic', c.reg === 'volkan' && c.vd < 1600 && !this.volcanic ? 1.8 : 0],
      ['plankton', (c.reg === 'tropik' || c.reg === 'merkez') && c.night && !this.plankton ? 0.9 : 0],
      ['debris', c.stormAgo < 600 ? 2 : 0.15],
    ];
  },

  trigger(kind, c = this.context()) {
    switch (kind) {
      case 'iceberg': return this._icebergs(c);
      case 'wisps': return this._wisps(c);
      case 'meteor': return this._meteor(c);
      case 'volcanic': return this._volcanic(c);
      case 'plankton': this.plankton = { t: 150 }; G.notify('Deniz ışıl ışıl parlıyor — dalgalarda ışık saçan planktonlar!', 'event', 5000); return true;
      case 'debris': return this._debris(c);
    }
    return false;
  },

  _seaSpot(c, dmin, dmax, depth = -8) {
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * Math.PI * 2, d = dmin + Math.random() * (dmax - dmin);
      const x = c.at.x + Math.cos(a) * d, z = c.at.z + Math.sin(a) * d;
      if (terrain.heightAt(x, z) < depth) return new THREE.Vector3(x, 0, z);
    }
    return null;
  },

  // ---- buzdağları ----
  _icebergs(c) {
    const s = G.ship;
    const yaw = s ? s.yaw : Math.random() * 6.28;
    const hx = Math.sin(yaw), hz = Math.cos(yaw);
    const n = 3 + Math.floor(Math.random() * 4);
    let made = 0;
    for (let i = 0; i < n * 4 && made < n; i++) {
      const d = 90 + Math.random() * 170, lat = (Math.random() - 0.5) * 150;
      const x = c.at.x + hx * d + Math.cos(yaw) * lat, z = c.at.z + hz * d - Math.sin(yaw) * lat;
      if (terrain.heightAt(x, z) > -10 || this.icebergs.some((b) => Math.hypot(b.ob.x - x, b.ob.z - z) < 30)) continue;
      const r = 5 + Math.random() * 9, seed = 1 + Math.floor(Math.random() * 1e6);
      const mesh = icebergMesh(r, seed);
      mesh.position.set(x, ocean.heightAt(x, z), z);
      mesh.rotation.y = Math.random() * 6.28;
      this.scene.add(mesh);
      const ob = { x, z, r: r * 0.9 };
      Ship.obstacles.push(ob);
      this.icebergs.push({ mesh, ob, r, seed, t: 0, ph: Math.random() * 6 });
      made++;
    }
    if (made) G.notify('Gözcü: "Pruvada buzdağları! Dümene dikkat — gövdeyi parçalarlar!"', 'event', 5000);
    return made > 0;
  },

  // ---- hayalet ışıklar: seni bir sandığa götürür ----
  _wisps(c) {
    const to = this._seaSpot(c, 180, 260, -6);
    if (!to) return false;
    const dir = new THREE.Vector3(to.x - c.at.x, 0, to.z - c.at.z).normalize();
    const lead = new THREE.Vector3(c.at.x + dir.x * 55, 0, c.at.z + dir.z * 55);
    const orbs = [];
    const mat = new THREE.SpriteMaterial({ map: glowTex(), color: 0x9fffe0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    for (let i = 0; i < 5; i++) {
      const sp = new THREE.Sprite(mat);
      sp.scale.setScalar(1.6);
      this.scene.add(sp);
      orbs.push(sp);
    }
    this.wisps = { orbs, lead, to, t: 0, life: 300 };
    G.notify('Suyun üstünde soluk ışıklar dans ediyor… Seni bir yere çağırıyorlar.', 'event', 5500);
    audio.tone(660, 2.5, 'sine', 0.04, null, 1.5);
    return true;
  },
  _updateWisps(dt) {
    const W = this.wisps;
    W.t += dt;
    const p = G.player;
    const me = G.ship && (p.mode === 'deck' || p.mode === 'helm' || p.ship) ? { x: G.ship.x, z: G.ship.z } : p.pos;
    const dl = Math.hypot(W.lead.x - me.x, W.lead.z - me.z), dTo = Math.hypot(W.to.x - W.lead.x, W.to.z - W.lead.z);
    // oyuncu yaklaştıkça önden giderler, uzaklaşırsa beklerler
    if (dTo > 1 && dl < 75) { const k = Math.min(dTo, dt * 4.5) / dTo; W.lead.x += (W.to.x - W.lead.x) * k; W.lead.z += (W.to.z - W.lead.z) * k; }
    W.orbs.forEach((o, i) => {
      const a = W.t * 1.3 + i * 1.26;
      const x = W.lead.x + Math.cos(a) * (2 + i * 0.7), z = W.lead.z + Math.sin(a * 0.8) * (2 + i * 0.7);
      o.position.set(x, ocean.heightAt(x, z) + 1.6 + Math.sin(W.t * 2 + i) * 0.5, z);
      o.material.opacity = 0.75 + Math.sin(W.t * 3 + i) * 0.25;
    });
    if (Math.random() < dt * 6) effects.spawn(W.lead.x, ocean.heightAt(W.lead.x, W.lead.z) + 1.5, W.lead.z, (Math.random() - 0.5) * 0.6, 0.4, (Math.random() - 0.5) * 0.6, 1.6, 0.3, 0.55, 1, 0.85, 0, 0.4, 0.2);
    if (W.remote) { if (W.t > W.life) { for (const o of W.orbs) this.scene.remove(o); this.wisps = null; } return; }
    if (dTo < 1.5 && Math.hypot(W.to.x - me.x, W.to.z - me.z) < 30) {
      for (const o of W.orbs) this.scene.remove(o);
      effects.glitter(W.to.x, ocean.heightAt(W.to.x, W.to.z) + 1, W.to.z, [0.6, 1, 0.9]);
      events.spawnFloating('chest', W.to);
      G.notify('Işıklar bir anda söndü… yerlerinde dalgalarla sallanan eski bir sandık var!', 'good', 5000);
      G.emit('rareFind', { kind: 'wisps' });
      this.wisps = null;
    } else if (W.t > W.life) {
      for (const o of W.orbs) this.scene.remove(o);
      this.wisps = null;
    }
  },

  // ---- gök taşı ----
  _meteor(c) {
    const to = this._seaSpot(c, 220, 420, -5);
    if (!to) return false;
    const a = Math.random() * Math.PI * 2;
    const from = new THREE.Vector3(to.x + Math.cos(a) * 900, 650, to.z + Math.sin(a) * 900);
    const mesh = new THREE.Group();
    const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffd8a0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    head.scale.setScalar(26);
    mesh.add(head);
    mesh.position.copy(from);
    this.scene.add(mesh);
    this.meteor = { mesh, from, to, t: 0, dur: 3.2 };
    G.notify('Gökyüzünde bir yıldız kayıyor… hayır, bir şey düşüyor!', 'event', 4500);
    return true;
  },
  _updateMeteor(dt) {
    const M = this.meteor;
    M.t += dt;
    const k = Math.min(1, M.t / M.dur);
    const ty = ocean.heightAt(M.to.x, M.to.z);
    M.mesh.position.set(M.from.x + (M.to.x - M.from.x) * k, M.from.y + (ty - M.from.y) * k, M.from.z + (M.to.z - M.from.z) * k);
    const p = M.mesh.position;
    for (let i = 0; i < 3; i++) effects.spawn(p.x, p.y, p.z, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, 1.4, 4 + Math.random() * 4, 1, 0.7 + Math.random() * 0.2, 0.4, 0, 0.2, 2);
    if (k >= 1) {
      this.scene.remove(M.mesh);
      effects.splash(M.to.x, M.to.z, 4);
      effects.smoke(M.to.x, ty + 1, M.to.z, 30, 3, 0.85);
      audio.boom(0.9, M.to);
      const d = G.player.pos.distanceTo(M.to);
      if (d < 600) tpCamera.addShake(0.5 * (1 - d / 600));
      if (!M.remote) events.spawnFloating('meteor', M.to);
      G.notify('Gök taşı denize düştü! Işıldayan parçası suyun üstünde yüzüyor.', 'good', 5000);
      this.meteor = null;
    }
  },

  // ---- volkanik bombardıman: kraterden lav bombaları ----
  _plume(I) {
    // uzaktan görülen kül sütunu: büyük, yavaş yükselen duman billboard'ları ve krater parıltısı
    if (!SMOKE) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 64;
      const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 4, 32, 32, 32);
      gr.addColorStop(0, 'rgba(70,64,60,.95)'); gr.addColorStop(0.6, 'rgba(60,56,54,.55)'); gr.addColorStop(1, 'rgba(60,56,54,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      SMOKE = new THREE.CanvasTexture(cv);
    }
    const grp = new THREE.Group();
    const puffs = [];
    for (let i = 0; i < 14; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: SMOKE, color: 0x6a6460, transparent: true, depthWrite: false, opacity: 0, fog: false }));
      grp.add(sp);
      puffs.push({ sp, t: i / 14 });
    }
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xff6a20, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    glow.scale.setScalar(70);
    grp.add(glow);
    this.scene.add(grp);
    return { grp, puffs, glow };
  },

  _volcanic(c) {
    if (!c.volc) return false;
    this.volcanic = { t: 30, next: 0.5, I: c.volc };
    G.notify(`${c.volc.name} patlıyor! Lav bombaları yağıyor — açık denize kaç!`, 'boss', 5500);
    audio.boom(1, { x: c.volc.x, z: c.volc.z });
    tpCamera.addShake(0.35);
    return true;
  },
  _updateVolcanic(dt) {
    const V = this.volcanic;
    V.t -= dt; V.next -= dt;
    const I = V.I;
    if (V.rimY === undefined) { // krater ağzının en yüksek noktası: bombalar yamaca çarpmadan çıksın
      V.rimY = 0;
      for (const d of [0.08, 0.15, 0.22, 0.3]) for (let k = 0; k < 8; k++) V.rimY = Math.max(V.rimY, terrain.heightAt(I.x + Math.cos(k * 0.785) * I.r * d, I.z + Math.sin(k * 0.785) * I.r * d));
    }
    const top = new THREE.Vector3(I.x, V.rimY + 12, I.z);
    if (Math.random() < dt * 4) effects.smoke(top.x, top.y + 4, top.z, 2, 4, 0.18);
    if (!V.plume) V.plume = this._plume(I);
    const fade = Math.min(1, V.t / 4, (30 - V.t + 1) / 2);
    for (const q of V.plume.puffs) {
      q.t = (q.t + dt / 22) % 1;
      const h = q.t * 260, w = 40 + q.t * 160;
      q.sp.position.set(top.x + Math.sin(q.t * 9 + V.t) * 10 + Math.cos(sky.windDir) * h * 0.4, top.y + h, top.z + Math.sin(sky.windDir) * h * 0.4);
      q.sp.scale.setScalar(w);
      q.sp.material.opacity = Math.max(0, fade * 0.92 * Math.sin(q.t * Math.PI));
    }
    V.plume.glow.position.set(top.x, top.y - 8, top.z);
    V.plume.glow.material.opacity = fade * (0.7 + Math.sin(V.t * 7) * 0.2);
    if (V.next <= 0) {
      V.next = 0.5 + Math.random() * 0.9;
      const c = this.context();
      const T = 8 + Math.random() * 3; // yüksek kavis: önce göğe tırmanır
      // bombaların bir kısmı geminin gideceği yere düşer (önünü kestirmek gerekir)
      const s = G.ship, aim = s && Math.random() < 0.3;
      const spread = aim ? 16 : 120;
      const tgt = new THREE.Vector3((aim ? s.x + (s.vx || 0) * T : c.at.x) + (Math.random() - 0.5) * spread, 0, (aim ? s.z + (s.vz || 0) * T : c.at.z) + (Math.random() - 0.5) * spread);
      tgt.y = Math.max(ocean.heightAt(tgt.x, tgt.z), terrain.heightAt(tgt.x, tgt.z));
      const vel = new THREE.Vector3((tgt.x - top.x) / T, (tgt.y - top.y) / T + 0.5 * 9.8 * T, (tgt.z - top.z) / T);
      if (vel.length() < 400) { G.visualOnlyBalls = !!V.remote; effects.cannonball(top, vel, null, 0.6, { lava: true }); G.visualOnlyBalls = false; }
    }
    if (V.t <= 0 && !V.remote) { this.scene.remove(V.plume.grp); this.volcanic = null; G.notify('Volkan yatıştı; kül bulutu dağılıyor.', 'info', 3000); }
  },

  // ---- fırtına enkazı ----
  _debris(c) {
    const at = this._seaSpot(c, 60, 110, -4);
    if (!at) return false;
    const n = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const p = at.clone().add(new THREE.Vector3((Math.random() - 0.5) * 30, 0, (Math.random() - 0.5) * 30));
      if (terrain.heightAt(p.x, p.z) > -2) continue;
      events.spawnFloating(Math.random() < 0.25 ? 'chest' : 'barrel', p);
    }
    G.notify('Dalgalar bir enkaz alanı sürüklüyor: variller, sandıklar… Batan bir geminin kalıntıları.', 'event', 5500);
    return true;
  },

  // ---- ağ: ev sahibi olay durumunu gönderir, konuklar görselleri kurar ----
  netState() {
    return {
      ice: this.icebergs.map((b) => [Math.round(b.ob.x), Math.round(b.ob.z), +b.r.toFixed(1), b.seed]),
      wisp: this.wisps ? [Math.round(this.wisps.lead.x), Math.round(this.wisps.lead.z), Math.round(this.wisps.to.x), Math.round(this.wisps.to.z)] : null,
      met: this.meteor ? [Math.round(this.meteor.from.x), Math.round(this.meteor.from.y), Math.round(this.meteor.from.z), Math.round(this.meteor.to.x), Math.round(this.meteor.to.z), +this.meteor.t.toFixed(2)] : null,
      vol: this.volcanic ? this.volcanic.I.id : null,
      pl: this.plankton ? 1 : 0,
    };
  },
  applyNet(s) {
    if (!s) return;
    // buzdağları: tohumla aynı biçim
    const keep = new Set();
    for (const [x, z, r, seed] of s.ice || []) {
      let b = this.icebergs.find((q) => q.seed === seed);
      if (!b) {
        const mesh = icebergMesh(r, seed);
        this.scene.add(mesh);
        b = { mesh, ob: { x, z, r: r * 0.9 }, r, seed, t: 0, ph: Math.random() * 6, remote: true };
        Ship.obstacles.push(b.ob);
        this.icebergs.push(b);
      }
      b.ob.x = x; b.ob.z = z; b.t = 0;
      keep.add(seed);
    }
    for (const b of this.icebergs) if (!keep.has(b.seed)) b.gone = true;
    if (s.wisp && !this.wisps) {
      const c = this.context();
      this._wisps({ ...c, at: { x: s.wisp[0], z: s.wisp[1] } });
    }
    if (this.wisps && s.wisp) { this.wisps.lead.set(s.wisp[0], 0, s.wisp[1]); this.wisps.to.set(s.wisp[2], 0, s.wisp[3]); this.wisps.remote = true; }
    if (!s.wisp && this.wisps) { for (const o of this.wisps.orbs) this.scene.remove(o); this.wisps = null; }
    if (s.met && !this.meteor) {
      const [fx, fy, fz, tx, tz, t] = s.met;
      const mesh = new THREE.Group();
      mesh.add(new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffd8a0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));
      mesh.children[0].scale.setScalar(26);
      this.scene.add(mesh);
      this.meteor = { mesh, from: new THREE.Vector3(fx, fy, fz), to: new THREE.Vector3(tx, 0, tz), t, dur: 3.2, remote: true };
    }
    if (s.vol && !this.volcanic) { const I = EXTRA_ISLANDS.find((x) => x.id === s.vol); if (I) this.volcanic = { t: 30, next: 0.5, I, remote: true }; }
    if (!s.vol && this.volcanic) { if (this.volcanic.plume) this.scene.remove(this.volcanic.plume.grp); this.volcanic = null; }
    if (s.pl && !this.plankton) this.plankton = { t: 150 };
    if (!s.pl) this.plankton = null;
  },

  update(dt) {
    const p = G.player;
    if (!p || G.state !== 'playing') return;
    if (sky.weatherKey === 'firtina') this.lastStorm = performance.now();
    // buzdağları: rüzgârla sürüklenir, dalgayla sallanır
    for (const b of this.icebergs) {
      b.t += dt;
      b.ob.x += Math.cos(sky.windDir) * 0.12 * dt; b.ob.z += Math.sin(sky.windDir) * 0.12 * dt;
      b.mesh.position.set(b.ob.x, ocean.heightAt(b.ob.x, b.ob.z) - 0.4 + Math.sin(b.t * 0.5 + b.ph) * 0.15, b.ob.z);
      b.mesh.rotation.z = Math.sin(b.t * 0.4 + b.ph) * 0.02;
      if (b.t > 600 || Math.hypot(b.ob.x - p.pos.x, b.ob.z - p.pos.z) > 1400) b.gone = true;
    }
    if (this.icebergs.some((b) => b.gone)) {
      for (const b of this.icebergs.filter((x) => x.gone)) { this.scene.remove(b.mesh); Ship.obstacles = Ship.obstacles.filter((o) => o !== b.ob); }
      this.icebergs = this.icebergs.filter((b) => !b.gone);
    }
    if (this.wisps) this._updateWisps(dt);
    if (this.meteor) this._updateMeteor(dt);
    if (this.volcanic) this._updateVolcanic(dt);
    if (this.plankton) {
      const P = this.plankton;
      P.t -= dt;
      if (P.t <= 0 || !sky.isNight()) this.plankton = null;
      else {
        // geminin bordası ve dümen suyu boyunca mavi ışıltılar; yüzerken oyuncunun çevresinde
        const s = G.ship;
        const src = [];
        if (s && !s.sunk && Math.hypot(s.x - p.pos.x, s.z - p.pos.z) < 150) src.push([s.x, s.z, s.yaw, s.T.L, s.T.B, Math.abs(s.speed || 0)]);
        if (p.mode === 'swim') src.push([p.pos.x, p.pos.z, p.yaw, 1.5, 1.5, 2]);
        for (const [x, z, yaw, L, B, sp] of src) {
          const n = Math.min(10, 2 + sp * 1.2);
          for (let i = 0; i < n; i++) {
            const u = (Math.random() - 0.6) * L, side = (Math.random() < 0.5 ? -1 : 1) * (B / 2 + Math.random() * 1.5);
            const wx = x + Math.sin(yaw) * u + Math.cos(yaw) * side, wz = z + Math.cos(yaw) * u - Math.sin(yaw) * side;
            effects.spawn(wx, ocean.heightAt(wx, wz) + 0.05, wz, 0, 0.05, 0, 1.2 + Math.random(), 0.22 + Math.random() * 0.25, 0.25, 0.85, 1, 0, 1, 0.1);
          }
        }
      }
    }
  },
};
