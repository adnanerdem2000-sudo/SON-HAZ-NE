import * as THREE from 'three';
import { G } from '../game/ctx.js';
import { kk } from '../core/kk.js';
import { assets } from '../core/assets.js';
import { terrain } from './terrain.js';
import { physics } from './physics.js';
import { ocean } from './ocean.js';
import { bodies } from './bodies.js';
import { EXTRA_ISLANDS } from './archipelago.js';
import { islands } from './islands.js';
import { effects } from '../game/effects.js';
import { combat } from '../game/combat.js';
import { interact } from '../game/interact.js';
import { audio } from '../core/audio.js';
import { tpCamera } from '../player/camera.js';
import { stone } from '../core/textures.js';
import { rng, clamp, damp } from '../core/util.js';

// Çevre etkileşimleri ve fizik bulmacaları:
//  - Barut fıçısı: vurulunca/ateşlenince fitili yanar, patlar; zincirleme patlama, savrulan cisimler
//  - Kırılabilir sandık: parçalanır, içinden erzak/altın çıkar
//  - Kaya tuzağı: takoz sökülünce kaya yokuş aşağı yuvarlanır, yolundakileri ezer
//  - Basınç plakası: ağır taş blok plakaya itilince kafes iner, gizli sandık açılır
//  - Buhar gayzeri (volkan adaları): düzenli fışkırır, üstündekini havaya fırlatır
// Adalar kurulunca doldurulur, boşaltılınca kaldırılır. Çevrimiçi oyunda olaylar (ateşleme,
// kırılma, yuvarlanma, çözüm) herkese iletilir; hasarı her istemci kendi oyuncusuna uygular.

const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _ax = new THREE.Vector3();
const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

// çekirdek takımadadaki Kızıl Hançer Kampı
const CORE_SETS = [
  { id: 'core_kamp', x: -40, z: -228, kegs: [[6.5, 2.5], [-5, 6.5], [1, -7]], crates: [[-6.5, -3], [4, 6.8]] },
];

let MAT = null;
let SULFUR = null;
function mats() {
  if (MAT) return MAT;
  const st = stone('#8a8478', 11);
  MAT = {
    stone: new THREE.MeshStandardMaterial({ map: st, color: 0xe2dccf, roughness: 0.95 }),
    plate: new THREE.MeshStandardMaterial({ map: st, color: 0x9a9284, roughness: 0.9 }),
    iron: new THREE.MeshStandardMaterial({ color: 0x2c2c30, roughness: 0.45, metalness: 0.75 }),
    rune: new THREE.MeshStandardMaterial({ color: 0x0a2a30, emissive: 0x30e0ff, emissiveIntensity: 0.25, roughness: 0.6 }),
    basalt: new THREE.MeshStandardMaterial({ color: 0x24201e, roughness: 0.95 }),
    vent: new THREE.MeshStandardMaterial({ color: 0x401000, emissive: 0xff5010, emissiveIntensity: 0.9 }),
    plank: new THREE.MeshStandardMaterial({ color: 0x7a5232, roughness: 0.9 }),
    flash: new THREE.MeshBasicMaterial({ color: 0xffc070, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }),
  };
  return MAT;
}

// Bu dosyada yaratılan (kit kopyası olmayan) geometri ve klon malzemeler: set sökülünce GPU kaynakları bırakılır (B14)
const OWN = new WeakSet();
const own = (r) => { OWN.add(r); return r; };

export const hazards = {
  name: 'hazards',
  sets: new Map(), // ada/kamp id -> nesne listesi
  byId: new Map(),
  solved: new Set(),
  looted: new Set(),
  flashes: [],
  debris: [],

  init(scene) {
    this.scene = scene;
    G.on('islandBuilt', (e) => this._buildIsland(e.id));
    G.on('islandDropped', (e) => this._dropSet(e.id));
    interact.addProvider((ctx, out) => this._interact(ctx, out));
  },

  start(data) {
    for (const id of [...this.sets.keys()]) this._dropSet(id);
    this.solved = new Set(data?.hazards?.solved || []);
    this.looted = new Set(data?.hazards?.looted || []);
    this.gone = new Set(data?.hazards?.gone || []); // patlamış fıçılar ve kırılmış sandıklar yüklemede yeniden kurulmaz
    for (const c of CORE_SETS) this._buildCore(c);
    // bu sistemden önce kurulmuş adalar
    for (const id of islands.built.keys()) this._buildIsland(id);
  },
  stop() { for (const id of [...this.sets.keys()]) this._dropSet(id); },
  save() { return { solved: [...this.solved], looted: [...this.looted], gone: [...(this.gone || [])] }; },
  saveKey: 'hazards',

  // ---- kurulum ---------------------------------------------------------------
  _set(id) { let s = this.sets.get(id); if (!s) { s = { id, list: [], group: new THREE.Group() }; this.scene.add(s.group); this.sets.set(id, s); } return s; },

  _dropSet(id) {
    const s = this.sets.get(id);
    if (!s) return;
    for (const h of s.list) {
      if (h.target) combat.removeTarget(h.target);
      if (h.tag) physics.removeTag(h.tag);
      this.byId.delete(h.id);
    }
    this.scene.remove(s.group);
    s.group.traverse((o) => { if (o.isMesh) { if (OWN.has(o.geometry)) o.geometry.dispose(); for (const m of [].concat(o.material)) if (OWN.has(m)) m.dispose(); } });
    this.sets.delete(id);
  },

  _buildCore(c) {
    const S = this._set(c.id);
    c.kegs.forEach(([ox, oz], i) => this._keg(S, `${c.id}_keg${i}`, c.x + ox, c.z + oz));
    c.crates.forEach(([ox, oz], i) => this._crate(S, `${c.id}_cr${i}`, c.x + ox, c.z + oz, i));
  },

  _buildIsland(id) {
    if (this.sets.has(id)) return;
    const I = EXTRA_ISLANDS.find((x) => x.id === id);
    if (!I) return;
    const S = this._set(id);
    const R = rng(hashStr(id) % 100000 + 17);
    for (const f of I.features) {
      if (f.type === 'camp' || f.type === 'fort' || f.type === 'mine') {
        const nk = f.type === 'fort' ? 4 : f.type === 'mine' ? 3 : 2;
        for (let i = 0; i < nk; i++) {
          const a = R() * 6.28, rr = (f.type === 'fort' ? 9 : 5) + R() * 3;
          this._keg(S, `${f.id}_keg${i}`, f.x + Math.cos(a) * rr, f.z + Math.sin(a) * rr);
        }
        for (let i = 0; i < (f.type === 'fort' ? 3 : 2); i++) {
          const a = R() * 6.28, rr = 4 + R() * 6;
          this._crate(S, `${f.id}_cr${i}`, f.x + Math.cos(a) * rr, f.z + Math.sin(a) * rr, i);
        }
        if (f.type !== 'fort') this._boulderSite(S, f, R);
      }
      if (f.type === 'ruin' && (hashStr(f.id) % 10) < 6) this._puzzleSite(S, f, R);
    }
    if (I.shape === 'volcano' || I.biome === 'volkan' && I.r > 150) {
      let made = 0;
      for (let t = 0; t < 40 && made < (I.shape === 'volcano' ? 5 : 3); t++) {
        const a = R() * 6.28, d = (0.3 + R() * 0.4) * I.r;
        const x = I.x + Math.cos(a) * d, z = I.z + Math.sin(a) * d;
        const h = terrain.heightAt(x, z);
        if (h < 2.5 || Math.hypot(x - I.x, z - I.z) < I.r * 0.2) continue;
        this._geyser(S, `${I.id}_gey${made}`, x, z, R);
        made++;
      }
    }
  },

  _register(S, h) {
    S.list.push(h);
    this.byId.set(h.id, h);
    return h;
  },

  _kitMesh(kit, name, s, tint = null) {
    const o = kk.part(kit, name);
    o.scale.setScalar(s);
    o.traverse((m) => {
      if (!m.isMesh) return;
      m.castShadow = true; m.receiveShadow = true;
      if (tint) { m.material = own(m.material.clone()); m.material.color.multiply(new THREE.Color(tint)); }
    });
    return o;
  },

  // ---- barut fıçısı ----
  _keg(S, id, x, z) {
    if (this.gone?.has(id)) return null;
    const y = terrain.heightAt(x, z);
    const g = new THREE.Group();
    // dik duran barut fıçısı (~1 m), kırmızı uyarı bandı ve fitil
    const body = this._kitMesh('dungeon', 'barrel_small', 1, 0x9a6a50);
    const bb = new THREE.Box3().setFromObject(body), sz = new THREE.Vector3(); bb.getSize(sz);
    const k = 1.0 / Math.max(0.01, sz.y);
    body.scale.multiplyScalar(k);
    const rad = Math.max(sz.x, sz.z) * k / 2;
    g.add(body);
    const band = new THREE.Mesh(own(new THREE.CylinderGeometry(rad * 0.97, rad * 0.97, 0.11, 16, 1, true)), new THREE.MeshStandardMaterial({ color: 0xa01810, roughness: 0.7, side: THREE.DoubleSide }));
    band.position.y = 0.62;
    const fuse = new THREE.Mesh(own(new THREE.CylinderGeometry(0.018, 0.018, 0.25, 5)), new THREE.MeshStandardMaterial({ color: 0x2a2018 }));
    fuse.position.set(rad * 0.35, 1.08, 0); fuse.rotation.z = 0.4;
    g.add(band, fuse);
    g.position.set(x, y, z);
    g.rotation.y = (hashStr(id) % 628) / 100;
    S.group.add(g);
    const tag = 'hz:' + id;
    physics.addCircle(x, z, rad, y - 1, y + 1.1, tag);
    const h = { type: 'keg', id, x, y, z, mesh: g, fuse, tag, state: 'idle', t: 0, S, fuseTop: 1.2 };
    h.target = combat.addTarget({
      pos: new THREE.Vector3(x, y, z), radius: rad + 0.05, height: 1.1, alive: true, bloodColor: [0.9, 0.7, 0.4], keg: true,
      hurt: (dmg, info = {}) => { this.ignite(h, info.kind === 'explosion' ? 0.25 + Math.random() * 0.35 : 1.6, true); return null; },
    });
    return this._register(S, h);
  },

  ignite(h, fuse = 1.6, net = false) {
    if (h.state !== 'idle') return;
    h.state = 'fuse'; h.t = fuse;
    h.target.alive = false;
    audio.tone(2400, fuse, 'sawtooth', 0.02, h, 0.5);
    if (net && G.online) G.emit('netHazard', { id: h.id, a: 'ignite', f: +fuse.toFixed(2) });
  },

  _explode(h) {
    h.state = 'gone';
    (this.gone || (this.gone = new Set())).add(h.id);
    h.mesh.visible = false;
    physics.removeTag(h.tag);
    const c = new THREE.Vector3(h.x, h.y + 0.6, h.z);
    const R = 7;
    // görsel: parlama küresi, kıvılcım, duman, toprak, tahta parçaları
    const fl = new THREE.Mesh(own(new THREE.SphereGeometry(1, 16, 10)), own(mats().flash.clone()));
    fl.position.copy(c);
    this.scene.add(fl);
    this.flashes.push({ m: fl, t: 0 });
    effects.sparks(c.x, c.y, c.z, 40, [1, 0.75, 0.35]);
    effects.smoke(c.x, c.y, c.z, 26, 2.4, 0.22);
    effects.dirt(c.x, h.y + 0.1, c.z, 24);
    bodies.impulse(c, R * 1.6, 16); // önce çevredeki cisimler; enkaz sonra doğar (120 m/s fırlamaz)
    this._debris(c, 7, 0x6a4428);
    audio.boom(1, c);
    const p = G.player;
    if (p) { const d = p.pos.distanceTo(c); if (d < 45) tpCamera.addShake(Math.min(1, 1.2 * (1 - d / 45))); }
    // hasar: yerel oyuncu her istemcide; düşman/hayvan/gemi yalnızca ev sahibinde
    if (p && !p.dead) {
      const d = p.pos.distanceTo(c);
      if (d < R) {
        const k = 1 - d / R;
        p.hurt(15 + 70 * k, c, { cause: 'Barut patlaması', unblockable: true });
        if (p.mode === 'ground') { _v.copy(p.pos).sub(c).setY(0).normalize(); p.vel.x += _v.x * 9 * k; p.vel.z += _v.z * 9 * k; p.vel.y = Math.max(p.vel.y, 5 * k); p.onGround = false; }
      }
    }
    const host = !G.online || G.isHost;
    for (const t of [...combat.targets]) {
      if (!t.alive || t === h.target) continue;
      const d = Math.max(0, Math.hypot(t.pos.x - c.x, (t.pos.y + (t.height || 1) * 0.5) - c.y, t.pos.z - c.z) - (t.radius || 0.5));
      if (d > R) continue;
      if (t.keg) { t.hurt(1, { kind: 'explosion', pos: c }); continue; } // zincirleme
      if (!host) continue;
      t.hurt((20 + 85 * (1 - d / R)), { kind: 'explosion', pos: c, by: G.myId, kb: 8, heavy: true, guardBreak: true });
    }
    if (host) for (const s of G.ships) {
      if (s.sunk) continue;
      const d = Math.hypot(s.x - c.x, s.z - c.z) - s.T.B / 2;
      if (d < R) s.damage(30 * (1 - Math.max(0, d) / R), s.worldToLocal(c.clone()), 'explosion');
    }
    combat.markCombat();
    combat.noise(c, 90, 'explosion');
  },

  _debris(c, n, color) {
    const m = mats().plank.clone();
    m.color.setHex(color);
    for (let i = 0; i < n; i++) {
      const mesh = new THREE.Mesh(own(new THREE.BoxGeometry(0.5 + Math.random() * 0.4, 0.06, 0.14)), m);
      mesh.castShadow = true;
      mesh.position.copy(c);
      this.scene.add(mesh);
      const a = Math.random() * 6.28, s = 3 + Math.random() * 5;
      const b = bodies.add(mesh, { pos: c.clone().add(new THREE.Vector3(Math.cos(a) * 0.3, 0.2, Math.sin(a) * 0.3)), vel: new THREE.Vector3(Math.cos(a) * s, 4 + Math.random() * 5, Math.sin(a) * s), angVel: new THREE.Vector3(Math.random() * 9, Math.random() * 9, Math.random() * 9), radius: 0.12, offsetY: 0.03, mass: 0.2, buoyancy: 1.6, restitution: 0.35, friction: 0.8 });
      this.debris.push({ mesh, b, t: 9 + Math.random() * 4 });
    }
  },

  // ---- kırılabilir sandık ----
  _crate(S, id, x, z, i) {
    if (this.gone?.has(id)) return null;
    const y = terrain.heightAt(x, z);
    const name = ['box_large', 'box_small', 'box_stacked'][i % 3];
    const mesh = this._kitMesh('dungeon', name, 1);
    { const bb = new THREE.Box3().setFromObject(mesh), sz = new THREE.Vector3(); bb.getSize(sz); mesh.scale.multiplyScalar((name === 'box_stacked' ? 1.3 : name === 'box_large' ? 0.95 : 0.6) / Math.max(0.01, sz.y)); }
    mesh.position.set(x, y, z);
    mesh.rotation.y = (hashStr(id) % 628) / 100;
    S.group.add(mesh);
    const tag = 'hz:' + id;
    physics.addCircle(x, z, 0.5, y - 1, y + 1, tag);
    const h = { type: 'crate', id, x, y, z, mesh, tag, state: 'idle', hp: 14, S };
    h.target = combat.addTarget({
      pos: new THREE.Vector3(x, y, z), radius: 0.55, height: 1, alive: true, bloodColor: [0.6, 0.45, 0.3],
      hurt: (dmg, info = {}) => { h.hp -= dmg; if (h.hp <= 0) this.breakCrate(h, info.kind !== 'explosion' || !G.online || G.isHost, true); return null; },
    });
    return this._register(S, h);
  },

  breakCrate(h, loot = true, net = false) {
    if (h.state !== 'idle') return;
    h.state = 'gone';
    (this.gone || (this.gone = new Set())).add(h.id);
    h.target.alive = false;
    h.mesh.visible = false;
    physics.removeTag(h.tag);
    const c = new THREE.Vector3(h.x, h.y + 0.5, h.z);
    this._debris(c, 6, 0x8a6038);
    effects.dirt(c.x, h.y + 0.2, c.z, 8);
    audio.play('impact', { pos: c, vol: 0.6, rate: 1.3 });
    if (loot) G.emit('loot', { pos: c, table: [['altin_para', 4, 18], ['ekmek', 0.35], ['mermi', 0.4], ['tahta', 0.3], ['baharat', 0.06]], from: 'Kırık sandık' });
    if (net && G.online) G.emit('netHazard', { id: h.id, a: 'break' });
  },

  // ---- kaya tuzağı ----
  _boulderSite(S, f, R) {
    const cy = terrain.heightAt(f.x, f.z);
    // kampa doğru sürekli inen bir yamaç ara: noktadan kampa her adımda yükseklik azalmalı
    let best = null;
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * 6.28 + R() * 0.15;
      for (const d of [22, 28, 34, 40]) {
        const x = f.x + Math.cos(a) * d, z = f.z + Math.sin(a) * d;
        const h = terrain.heightAt(x, z);
        if (h - cy < 4) continue;
        let mono = true, prev = h;
        for (let k = 1; k <= 8 && mono; k++) {
          const q = 1 - k / 8 * 0.75; // kampın 1/4'üne kadar
          const hh = terrain.heightAt(f.x + Math.cos(a) * d * q, f.z + Math.sin(a) * d * q);
          if (hh > prev + 0.15) mono = false;
          prev = hh;
        }
        if (!mono) continue;
        const score = (h - cy) / d;
        if (!best || score > best.score) best = { x, z, h, a, score };
      }
    }
    if (!best || best.score < 0.12) return;
    const id = f.id + '_kaya';
    const r = 1.35;
    const rock = assets.clone('rock_large');
    const b = new THREE.Box3().setFromObject(rock);
    const sz = new THREE.Vector3(); b.getSize(sz);
    rock.scale.setScalar((r * 2) / Math.max(sz.x, sz.y, sz.z));
    rock.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    const holder = new THREE.Group();
    const inner = new THREE.Group();
    const bb = new THREE.Box3().setFromObject(rock);
    rock.position.y -= (bb.min.y + bb.max.y) / 2; // merkezi orijine al
    inner.add(rock);
    holder.add(inner);
    holder.position.set(best.x, best.h + r * 0.85, best.z);
    // kampa doğru yön ve takoz
    const dx = -Math.cos(best.a), dz = -Math.sin(best.a);
    const wedge = assets.clone('log');
    const wb = new THREE.Box3().setFromObject(wedge); const ws = new THREE.Vector3(); wb.getSize(ws);
    wedge.scale.setScalar(1.6 / Math.max(ws.x, ws.y, ws.z));
    wedge.position.set(best.x + dx * (r + 0.3), terrain.heightAt(best.x + dx * (r + 0.3), best.z + dz * (r + 0.3)), best.z + dz * (r + 0.3));
    wedge.rotation.y = Math.atan2(dx, dz) + Math.PI / 2;
    S.group.add(holder, wedge);
    const tag = 'hz:' + id;
    physics.addCircle(best.x, best.z, r * 0.9, best.h - 1, best.h + r * 2, tag);
    return this._register(S, { type: 'boulder', id, x: best.x, z: best.z, y: best.h, r, mesh: holder, inner, wedge, tag, state: 'set', pos: holder.position.clone(), vel: new THREE.Vector3(dx * 3, 0, dz * 3), hit: new Set(), slowT: 0, S });
  },

  release(h, net = false) {
    if (h.state !== 'set') return;
    h.state = 'roll';
    physics.removeTag(h.tag);
    h.wedge.rotation.z = 1.2;
    h.wedge.position.y += 0.2;
    audio.play('impact', { pos: h.pos, vol: 0.7, rate: 0.5 });
    effects.dirt(h.pos.x, h.y + 0.2, h.pos.z, 10);
    if (net && G.online) G.emit('netHazard', { id: h.id, a: 'roll' });
  },

  _rollBoulder(h, dt) {
    const p = h.pos, v = h.vel, r = h.r;
    const e = 1.2;
    const gx = (terrain.heightAt(p.x + e, p.z) - terrain.heightAt(p.x - e, p.z)) / (2 * e);
    const gz = (terrain.heightAt(p.x, p.z + e) - terrain.heightAt(p.x, p.z - e)) / (2 * e);
    // yuvarlanan küre: eğim boyunca ivme (5/7 g), yuvarlanma sürtünmesi
    v.x += -gx * 9.8 * 0.71 * dt; v.z += -gz * 9.8 * 0.71 * dt;
    const k = Math.exp(-0.28 * dt);
    v.x *= k; v.z *= k;
    const sp = Math.hypot(v.x, v.z);
    if (sp > 22) { v.x *= 22 / sp; v.z *= 22 / sp; }
    const ox = p.x, oz = p.z;
    p.x += v.x * dt; p.z += v.z * dt;
    const g = terrain.heightAt(p.x, p.z);
    // ağaç/duvar çarpışması: geri sekme
    _v.set(p.x, 0, p.z);
    if (physics.resolve(_v, r * 0.85, g + 0.2, r * 1.6)) {
      const nx = _v.x - p.x, nz = _v.z - p.z, nl = Math.hypot(nx, nz) || 1;
      const vn = (v.x * nx + v.z * nz) / nl;
      if (vn < 0) { v.x -= 1.5 * vn * nx / nl; v.z -= 1.5 * vn * nz / nl; v.multiplyScalar(0.7); effects.dirt(p.x, g + 0.5, p.z, 6); audio.play('impact', { pos: p, vol: 0.5, rate: 0.6 }); }
      p.x = _v.x; p.z = _v.z;
    }
    // oyuncu kayanın içinde kalmaz: daireden dışarı itilir (ezme hasarı aşağıda ayrıca)
    const pl0 = G.player;
    if (pl0 && !pl0.dead && pl0.mode === 'ground' && Math.abs(pl0.pos.y - (p.y - r)) < 2.5) {
      const ddx = pl0.pos.x - p.x, ddz = pl0.pos.z - p.z, dd = Math.hypot(ddx, ddz), want = r + 0.4;
      if (dd < want && dd > 1e-4) { pl0.pos.x = p.x + (ddx / dd) * want; pl0.pos.z = p.z + (ddz / dd) * want; }
    }
    const wy = ocean.heightAt(p.x, p.z);
    p.y = Math.max(g + r * 0.85, g < wy - r ? g + r * 0.85 : -1e9);
    h.mesh.position.copy(p);
    // dönme: hareket yönüne dik eksen etrafında
    const dist = Math.hypot(p.x - ox, p.z - oz);
    if (dist > 1e-4) {
      _ax.set(p.z - oz, 0, -(p.x - ox)).normalize();
      _q.setFromAxisAngle(_ax, dist / r);
      h.inner.quaternion.premultiply(_q);
    }
    if (sp > 2 && Math.random() < dt * 8) effects.dirt(p.x, g + 0.1, p.z, 2);
    // ezme hasarı
    if (sp > 2.5) {
      const host = !G.online || G.isHost;
      for (const t of combat.targets) {
        if (!t.alive || h.hit.has(t)) continue;
        if (Math.hypot(t.pos.x - p.x, t.pos.z - p.z) < r + (t.radius || 0.5) && Math.abs(t.pos.y - (p.y - r)) < 2.5) {
          h.hit.add(t);
          if (t.keg) { t.hurt(1, { kind: 'explosion', pos: p }); continue; }
          if (host) t.hurt(Math.min(110, sp * 9), { kind: 'melee', pos: p.clone(), by: G.myId, kb: 9, heavy: true, guardBreak: true });
        }
      }
      const pl = G.player;
      if (pl && !pl.dead && !h.hit.has(pl) && Math.hypot(pl.pos.x - p.x, pl.pos.z - p.z) < r + 0.4 && Math.abs(pl.pos.y - (p.y - r)) < 2.5) {
        h.hit.add(pl);
        pl.hurt(Math.min(70, sp * 6), p, { cause: 'Yuvarlanan kaya', unblockable: true });
        _v.copy(pl.pos).sub(p).setY(0).normalize();
        pl.vel.x += _v.x * 7; pl.vel.z += _v.z * 7; pl.vel.y = 4; pl.onGround = false;
      }
    }
    if (g < wy - 1) { // denize düştü
      effects.splash(p.x, p.z, 2.5);
      h.state = 'rest'; h.mesh.position.y = g + r * 0.85;
      return;
    }
    h.slowT = sp < 0.35 ? h.slowT + dt : 0;
    if (h.slowT > 1.5) {
      h.state = 'rest';
      physics.addCircle(p.x, p.z, r * 0.9, g - 1, g + r * 2, h.tag);
    }
  },

  // ---- basınç plakası bulmacası ----
  _puzzleSite(S, f, R) {
    const id = f.id + '_bulmaca';
    // harabe avlusunun dışında, düz ve engelsiz bir yer bul
    for (let t = 0; t < 10; t++) {
      const a = R() * 6.28;
      const dx = Math.cos(a), dz = Math.sin(a), px = -dz, pz = dx;
      const C = { x: f.x + dx * 18, z: f.z + dz * 18 };
      const P = { x: C.x + px * 5, z: C.z + pz * 5 };
      const B0 = { x: P.x + px * 4.5, z: P.z + pz * 4.5 };
      let ok = true;
      for (let k = 0; k <= 10 && ok; k++) {
        const q = k / 10;
        for (const [x, z] of [[C.x + (B0.x - C.x) * q, C.z + (B0.z - C.z) * q]]) {
          _v.set(x, 0, z);
          if (physics.resolve(_v, 1.6, terrain.heightAt(x, z) + 0.2)) ok = false;
          const hh = terrain.heightAt(x, z);
          if (hh < 0.8 || Math.abs(hh - terrain.heightAt(C.x, C.z)) > 1.2) ok = false;
        }
      }
      if (!ok) continue;
      const M = mats();
      const yaw = Math.atan2(dx, dz);
      // kafes + sandık
      const cy = terrain.heightAt(C.x, C.z);
      const cage = new THREE.Group();
      const barG = own(new THREE.CylinderGeometry(0.035, 0.035, 2.2, 6));
      for (let side = 0; side < 4; side++) {
        for (let k = 0; k < 8; k++) {
          const u = -1.2 + (k + 0.5) * 0.3;
          const bar = new THREE.Mesh(barG, M.iron);
          const sx = [u, 1.2, -u, -1.2][side], sz = [1.2, u, -1.2, -u][side];
          bar.position.set(sx, 1.1, sz);
          bar.castShadow = true;
          cage.add(bar);
        }
      }
      for (const yy of [0.05, 2.2]) {
        const ring = new THREE.Mesh(own(new THREE.BoxGeometry(2.5, 0.08, 2.5)), M.iron);
        ring.position.y = yy;
        if (yy > 1) cage.add(ring);
        else { const fr = new THREE.Mesh(own(new THREE.BoxGeometry(2.5, 0.1, 0.1)), M.iron); for (const [x, z, r] of [[0, 1.2, 0], [0, -1.2, 0], [1.2, 0, 1], [-1.2, 0, 1]]) { const q = fr.clone(); q.position.set(x, 0.05, z); q.rotation.y = r * Math.PI / 2; cage.add(q); } }
      }
      cage.position.set(C.x, cy, C.z);
      cage.rotation.y = yaw;
      const chest = this._kitMesh('dungeon', 'chest_gold', 1);
      chest.position.set(C.x, cy, C.z);
      chest.rotation.y = yaw + Math.PI;
      // plaka
      const py = terrain.heightAt(P.x, P.z);
      const plate = new THREE.Group();
      const slab = new THREE.Mesh(own(new THREE.BoxGeometry(1.8, 0.14, 1.8)), M.plate);
      slab.position.y = 0.07; slab.receiveShadow = true;
      const rune = new THREE.Mesh(own(new THREE.RingGeometry(0.32, 0.46, 24)), own(M.rune.clone()));
      rune.rotation.x = -Math.PI / 2; rune.position.y = 0.145;
      const dot = new THREE.Mesh(own(new THREE.CircleGeometry(0.14, 16)), rune.material);
      dot.rotation.x = -Math.PI / 2; dot.position.y = 0.146;
      plate.add(slab, rune, dot);
      plate.position.set(P.x, py, P.z);
      plate.rotation.y = yaw;
      // taş blok
      const block = new THREE.Mesh(own(new THREE.BoxGeometry(1.5, 1.5, 1.5)), M.stone);
      block.castShadow = true; block.receiveShadow = true;
      const glyph = new THREE.Mesh(own(new THREE.CircleGeometry(0.28, 3)), rune.material);
      glyph.position.set(0, 0.1, 0.752);
      const glyph2 = glyph.clone(); glyph2.position.z = -0.752; glyph2.rotation.y = Math.PI;
      block.add(glyph, glyph2);
      const solved = this.solved.has(id);
      const bpos = solved ? new THREE.Vector3(P.x, py + 0.75 + 0.08, P.z) : new THREE.Vector3(B0.x, terrain.heightAt(B0.x, B0.z) + 0.75, B0.z);
      block.position.copy(bpos);
      block.rotation.y = yaw;
      S.group.add(cage, chest, plate, block);
      const tag = 'hz:' + id;
      if (!solved) physics.addBox(C.x, C.z, 1.3, 1.3, yaw, cy - 1, cy + 2.4, tag);
      else { cage.position.y = cy - 2.3; rune.material.emissiveIntensity = 2.2; }
      const h = this._register(S, { type: 'puzzle', id, yaw, C, P, cy, py, cage, chest, plate, rune: rune.material, block, bpos, tag, solved, sink: solved ? 1 : 0, S, ax: [px, pz], az: [dx, dz] });
      return h;
    }
  },

  solve(h, net = false) {
    if (h.solved) return;
    h.solved = true;
    this.solved.add(h.id);
    physics.removeTag(h.tag);
    h.rune.emissiveIntensity = 2.2;
    audio.play('level_up', { vol: 0.5 });
    audio.boom(0.3, { x: h.C.x, z: h.C.z });
    effects.dirt(h.C.x, h.cy + 0.2, h.C.z, 18);
    if (net) G.notify('Taş blok plakaya oturdu… kafes gıcırdayarak toprağa gömülüyor!', 'good', 4000);
    if (net && G.online) G.emit('netHazard', { id: h.id, a: 'solve' });
  },

  // oyuncu bloğu iter: yalnızca bloğun kendi eksenleri boyunca, ağır ve yavaş
  _pushBlock(h, dt) {
    const p = G.player;
    if (!p || p.mode !== 'ground' || h.solved && h.sink >= 1) return;
    const b = h.bpos, half = 0.75, pr = 0.36;
    const [ax, az] = h.ax, [fx, fz] = h.az;
    const dx = p.pos.x - b.x, dz = p.pos.z - b.z;
    const lx = dx * ax + dz * az, lz = dx * fx + dz * fz;
    if (Math.abs(lx) > half + pr || Math.abs(lz) > half + pr || p.pos.y > b.y + 0.9) return;
    // oyuncuyu bloğun dışına çıkar (en kısa eksen)
    const penX = half + pr - Math.abs(lx), penZ = half + pr - Math.abs(lz);
    let mvx = 0, mvz = 0;
    if (penX < penZ) { const s = Math.sign(lx) || 1; p.pos.x += ax * penX * s; p.pos.z += az * penX * s; mvx = -s; }
    else { const s = Math.sign(lz) || 1; p.pos.x += fx * penZ * s; p.pos.z += fz * penZ * s; mvz = -s; }
    if (h.solved) return;
    // itme: oyuncu bloğa doğru yürüyorsa blok o eksende kayar
    const vAlong = mvx ? (p.vel.x * ax + p.vel.z * az) * mvx : (p.vel.x * fx + p.vel.z * fz) * mvz;
    if (vAlong < 0.8) return;
    const step = Math.min(1.1, vAlong * 0.35) * dt;
    const nx = b.x + (mvx ? ax * mvx : fx * mvz) * step, nz = b.z + (mvx ? az * mvx : fz * mvz) * step;
    _v.set(nx, 0, nz);
    const gy = terrain.heightAt(nx, nz);
    if (physics.resolve(_v, 0.7, gy + 0.3) || Math.abs(gy - (b.y - 0.75)) > 0.6) return; // engel ya da basamak
    b.x = nx; b.z = nz; b.y = gy + 0.75;
    h.block.position.copy(b);
    h.scrapeT = (h.scrapeT || 0) - dt;
    if (h.scrapeT <= 0) { h.scrapeT = 0.45; audio.tone(70 + Math.random() * 30, 0.4, 'sawtooth', 0.025, b, 0.8); effects.dirt(b.x, b.y - 0.7, b.z, 3); }
    if (G.online) { h.netT = (h.netT || 0) - dt; if (h.netT <= 0) { h.netT = 0.2; G.emit('netHazard', { id: h.id, a: 'block', x: +b.x.toFixed(2), z: +b.z.toFixed(2) }); } }
    if (Math.hypot(b.x - h.P.x, b.z - h.P.z) < 0.55) {
      b.x = h.P.x; b.z = h.P.z; b.y = h.py + 0.75 + 0.08;
      h.block.position.copy(b);
      this.solve(h, true);
    }
  },

  // ---- buhar gayzeri ----
  _geyser(S, id, x, z, R) {
    const y = terrain.heightAt(x, z);
    const M = mats();
    const g = new THREE.Group();
    const ring = new THREE.Mesh(own(new THREE.TorusGeometry(1.1, 0.38, 8, 18)), M.basalt);
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.15; ring.castShadow = true; ring.receiveShadow = true;
    const vent = new THREE.Mesh(own(new THREE.CircleGeometry(0.85, 18)), M.vent);
    vent.rotation.x = -Math.PI / 2; vent.position.y = 0.12;
    g.add(ring, vent);
    for (let i = 0; i < 6; i++) { // çevresinde kükürt lekeleri
      const a = (i / 6) * 6.28 + R() * 0.5, d = 1.8 + R() * 1.2;
      const hy = terrain.heightAt(x + Math.cos(a) * d, z + Math.sin(a) * d);
      if (Math.abs(hy - y) > 0.5) continue; // dik yamaçta havada kalmasın
      const s = new THREE.Mesh(own(new THREE.CircleGeometry(0.25 + R() * 0.3, 8)), SULFUR || (SULFUR = new THREE.MeshStandardMaterial({ color: 0xc8b030, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 })));
      s.rotation.x = -Math.PI / 2; s.position.set(Math.cos(a) * d, hy - y + 0.03, Math.sin(a) * d);
      g.add(s);
    }
    g.position.set(x, y, z);
    S.group.add(g);
    return this._register(S, { type: 'geyser', id, x, y, z, mesh: g, state: 'idle', t: 3 + R() * 6, period: 7 + R() * 5, S });
  },

  _updateGeyser(h, dt) {
    h.t -= dt;
    const p = G.player;
    const near = p && Math.hypot(p.pos.x - h.x, p.pos.z - h.z) < 140;
    if (h.state === 'idle') {
      if (near && Math.random() < dt * 2) effects.spawn(h.x + (Math.random() - 0.5), h.y + 0.3, h.z + (Math.random() - 0.5), 0, 0.8 + Math.random(), 0, 1.6, 0.5, 0.8, 0.8, 0.82, 0.2, 0.5, 0.6);
      if (h.t <= 0) { h.state = 'rumble'; h.t = 1.3; if (near) audio.tone(55, 1.3, 'sawtooth', 0.04, h, 1.4); }
    } else if (h.state === 'rumble') {
      if (near && Math.random() < dt * 12) effects.spawn(h.x + (Math.random() - 0.5) * 0.8, h.y + 0.3, h.z + (Math.random() - 0.5) * 0.8, 0, 2 + Math.random() * 2, 0, 1, 0.6, 0.85, 0.85, 0.88, 0.5, 0.6, 0.8);
      if (h.t <= 0) { h.state = 'erupt'; h.t = 2.4; h.launched = false; if (near) { audio.splash(0.5); audio.tone(120, 2.4, 'sawtooth', 0.03, h, 0.6); } }
    } else if (h.state === 'erupt') {
      if (near) for (let i = 0; i < 5; i++) {
        const a = Math.random() * 6.28, s = Math.random() * 1.2;
        effects.spawn(h.x + Math.cos(a) * 0.3, h.y + 0.4, h.z + Math.sin(a) * 0.3, Math.cos(a) * s, 11 + Math.random() * 7, Math.sin(a) * s, 1.4 + Math.random() * 0.8, 0.6 + Math.random() * 0.5, 0.92, 0.93, 0.95, -6, 0.6, 1.4);
      }
      // üstündekini fırlat (yüksekten düşme hasarı almayacak kadar)
      if (p && !p.dead && p.mode === 'ground' && Math.hypot(p.pos.x - h.x, p.pos.z - h.z) < 1.5 && p.pos.y < h.y + 1.5 && !h.launched) {
        h.launched = true;
        p.vel.y = 16; p.onGround = false;
        p.hurt(4, null, { cause: 'Kaynar buhar', unblockable: true });
        G.notify('Buhar seni havaya fırlattı!', 'info', 1500);
      }
      bodies.force(_v.set(h.x, h.y, h.z), 1.6, 20, dt); // sürekli buhar kuvveti (kare hızından bağımsız)
      if (h.t <= 0) { h.state = 'idle'; h.t = h.period; }
    }
  },

  // ---- güncelleme ----
  update(dt) {
    if (!G.player || G.state !== 'playing') return;
    for (const S of this.sets.values()) for (const h of S.list) {
      if (h.type === 'keg' && h.state === 'fuse') {
        h.t -= dt;
        if (Math.random() < dt * 30) effects.sparks(h.x, h.y + h.fuseTop, h.z, 2, [1, 0.8, 0.3]);
        if (h.t <= 0) this._explode(h);
      } else if (h.type === 'boulder' && h.state === 'roll') this._rollBoulder(h, dt);
      else if (h.type === 'puzzle') {
        this._pushBlock(h, dt);
        if (h.solved && h.sink < 1) {
          h.sink = Math.min(1, h.sink + dt / 2.2);
          h.cage.position.y = h.cy - 2.3 * h.sink;
          if (Math.random() < dt * 10) effects.dirt(h.C.x + (Math.random() - 0.5) * 2.4, h.cy + 0.1, h.C.z + (Math.random() - 0.5) * 2.4, 2);
        }
        if (!h.solved) h.rune.emissiveIntensity = 0.25 + Math.sin(performance.now() * 0.003) * 0.12;
      } else if (h.type === 'geyser') this._updateGeyser(h, dt);
      if (h.target) h.target.pos.set(h.x, h.y, h.z);
    }
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const f = this.flashes[i];
      f.t += dt;
      f.m.scale.setScalar(1 + f.t * 22);
      f.m.material.opacity = Math.max(0, 0.9 - f.t * 3.6);
      if (f.t > 0.25) { this.scene.remove(f.m); f.m.geometry.dispose(); f.m.material.dispose(); this.flashes.splice(i, 1); }
    }
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i];
      d.t -= dt;
      if (d.t <= 0) { this.scene.remove(d.mesh); d.mesh.geometry.dispose(); bodies.remove(d.b); this.debris.splice(i, 1); }
    }
  },

  // ---- etkileşimler ----
  _interact(ctx, out) {
    const p = ctx.player;
    if (p.mode !== 'ground') return;
    for (const S of this.sets.values()) for (const h of S.list) {
      const d = Math.hypot(h.x !== undefined ? h.x - p.pos.x : 1e9, h.z !== undefined ? h.z - p.pos.z : 1e9);
      if (h.type === 'keg' && h.state === 'idle' && d < 1.9) {
        out.push({ id: 'keg:' + h.id, pos: new THREE.Vector3(h.x, h.y + 1, h.z), radius: 1.9, priority: 1, label: 'Fitili ateşle (kaç!)', action: () => this.ignite(h, 3.2, true) });
      } else if (h.type === 'boulder' && h.state === 'set' && Math.hypot(h.pos.x - p.pos.x, h.pos.z - p.pos.z) < h.r + 2) {
        out.push({ id: 'kaya:' + h.id, pos: h.pos.clone(), radius: h.r + 2, priority: 1, label: 'Takozu sök (kaya yuvarlanır)', hold: 0.8, action: () => this.release(h, true) });
      } else if (h.type === 'puzzle') {
        const dc = Math.hypot(h.C.x - p.pos.x, h.C.z - p.pos.z), dp = Math.hypot(h.P.x - p.pos.x, h.P.z - p.pos.z);
        if (h.solved && h.sink >= 1 && dc < 2.6) {
          out.push({ id: 'pzc:' + h.id, pos: new THREE.Vector3(h.C.x, h.cy + 0.8, h.C.z), radius: 2.6, priority: 1.6, label: 'Gizli sandığı aç', action: () => {
            if (this.looted.has(h.id)) { G.notify('Sandık boş.'); return; }
            this.looted.add(h.id);
            G.emit('lootToBag', { pos: new THREE.Vector3(h.C.x, h.cy + 0.6, h.C.z), table: [['altin_para', 140, 320], ['altin_kulce', 0.8], ['zumrut', 0.5], ['yakut', 0.4], ['antik_vazo', 0.5], ['eski_kilic', 0.25]], from: 'Gizli sandık' }); // doğrudan çantaya
            G.emit('puzzleLooted', { id: h.id });
            audio.play('coin', { vol: 0.7 });
          } });
        } else if (!h.solved && dc < 2.8) {
          out.push({ id: 'pzh:' + h.id, pos: new THREE.Vector3(h.C.x, h.cy + 1.2, h.C.z), radius: 2.8, priority: 0.5, label: 'Kafesi incele', action: () => {
            G.emit('openDialog', { name: 'Paslı Kafes', title: 'Eski bir kilit', text: 'Demir parmaklıkların ardında altın işlemeli bir sandık duruyor. Kafesin dibindeki yazı: <i>"Taşın ağırlığı mührü çözer."</i> Yakındaki plakadaki rün, aynı işaretin oyulduğu taş bloğa benziyor…', options: [{ label: 'Kapat', close: true }] });
          } });
        } else if (!h.solved && dp < 1.6) {
          out.push({ id: 'pzp:' + h.id, pos: new THREE.Vector3(h.P.x, h.py + 0.4, h.P.z), radius: 1.6, priority: 0.3, label: 'Basınç plakası (üzerine ağır bir şey koy)', action: () => G.notify('Plaka senin ağırlığınla kımıldamıyor. Daha ağır bir şey gerekli — belki şu runlu taş blok?', 'info', 3500) });
        }
      }
    }
  },

  // ---- ağ ----
  netApply(m) {
    const h = this.byId.get(m.id);
    if (!h) return;
    if (m.a === 'ignite') this.ignite(h, m.f || 1.2, false);
    else if (m.a === 'break') this.breakCrate(h, false, false);
    else if (m.a === 'roll') this.release(h, false);
    else if (m.a === 'block' && !h.solved) { h.bpos.x = m.x; h.bpos.z = m.z; h.bpos.y = terrain.heightAt(m.x, m.z) + 0.75; h.block.position.copy(h.bpos); }
    else if (m.a === 'solve') { h.bpos.set(h.P.x, h.py + 0.83, h.P.z); h.block.position.copy(h.bpos); this.solve(h, false); G.notify('Bir tayfa arkadaşın gizli kafesi açtı!', 'good', 3000); }
  },

  // test yardımcıları
  list(type) { const out = []; for (const S of this.sets.values()) for (const h of S.list) if (!type || h.type === type) out.push(h); return out; },
};
