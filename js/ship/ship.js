import * as THREE from 'three';
import { buildShipModel, SHIP_TYPES, hullHalfWidth, deckHeight, rowboatMesh } from './shipModel.js';
import { ocean } from '../world/ocean.js';
import { terrain } from '../world/terrain.js';
import { sky } from '../world/sky.js';
import { clamp, damp, dampAngle, lerp, wrapAngle, uid } from '../core/util.js';
import { WORLD_HALF } from '../world/archipelago.js';

const _v = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _e = new THREE.Euler(0, 0, 0, 'YXZ');
const _q = new THREE.Quaternion();

export class Ship {
  static obstacles = [];
  static dock = null; // limandaki demirleme noktası {x, z, yaw, r}
  constructor(scene, typeId = 'sloop', opts = {}) {
    this.id = opts.id || uid('ship');
    this.type = SHIP_TYPES[typeId];
    this.typeId = typeId;
    this.name = opts.name || 'Martı';
    this.look = opts.look || {};
    this.owner = opts.owner || 'player';
    this.ai = opts.ai || null;
    this.scene = scene;
    this._build();
    this.x = opts.x || 0; this.z = opts.z || 0; this.yaw = opts.yaw || 0;
    this.y = 0; this.pitch = 0; this.roll = 0;
    this.speed = 0; this.side = 0; this.rudder = 0; this.rudderInput = 0;
    this.sail = 0; this.sailTarget = 0;
    this.anchored = true; this.anchorState = 'down'; this.anchorT = 1;
    this.upg = opts.upg || { hull: 0, sails: 0, cannons: 0 };
    this.maxHp = this.type.hp * (1 + this.upg.hull * 0.25);
    this.hp = opts.hp ?? this.maxHp;
    this.water = opts.water || 0;
    this.holes = opts.holes || [];
    this.sinking = 0;
    this.sunk = false;
    this.cannonState = this.model.cannons.map(() => ({ reload: 0 }));
    // bölgesel hasar: gövde bölümleri, dümen, yelken bezi, direkler, toplar; yangınlar
    this.parts = { pruva: 100, kic: 100, iskele: 100, sancak: 100, dumen: 100, yelken: 100, ...(opts.parts || {}) };
    this.mastHp = opts.mastHp ? [...opts.mastHp] : this.type.masts.map(() => 100);
    this.cannonHp = opts.cannonHp ? [...opts.cannonHp] : this.model.cannons.map(() => 100);
    this.fires = [];
    this.hold = opts.hold || { items: {}, chests: [] };
    this.cannonballs = opts.cannonballs ?? 20;
    this.planks = opts.planks ?? 6;
    this.occupants = {};
    this.rowboat = null;
    this.events = [];
    this._prevX = this.x; this._prevZ = this.z;
    this.updateTransform(0);
    this._applyDamageVisuals(true);
  }

  _build() {
    if (this.model) this.scene.remove(this.model.root);
    this.model = buildShipModel(this.type, this.look);
    this.root = this.model.root;
    this.scene.add(this.root);
    this.holeMeshes = new THREE.Group();
    this.root.add(this.holeMeshes);
  }

  rebuild(look) {
    this.look = { ...this.look, ...look };
    this._build();
    this.cannonState = this.model.cannons.map(() => ({ reload: 0 }));
    this._fallen = null;
    this._syncHoles();
    this.updateTransform(0);
    this._applyDamageVisuals(true);
  }

  // ---- bölgesel hasar ----
  _region(lp) {
    const L = this.T.L;
    return lp.z > L * 0.22 ? 'pruva' : lp.z < -L * 0.22 ? 'kic' : lp.x >= 0 ? 'iskele' : 'sancak';
  }
  _partHits(amount, lp, kind) {
    const T = this.T, P = this.parts;
    const reg = this._region(lp);
    P[reg] = Math.max(0, P[reg] - amount * 1.5);
    if (lp.z < -T.L * 0.36) P.dumen = Math.max(0, P.dumen - amount * 2.2);
    const high = (lp.y ?? 0) > T.deckY + 1.6;
    T.masts.forEach((M, i) => {
      if (this.mastHp[i] <= 0) return;
      if (Math.abs(lp.z - M.z) < 2.6 && (high || Math.random() < 0.3)) {
        this.mastHp[i] = Math.max(0, this.mastHp[i] - amount * 2.4);
        if (this.mastHp[i] <= 0) { this.events.push({ t: 'mastBroken', i }); this._applyDamageVisuals(); }
      }
    });
    if (high || Math.random() < 0.3 || kind === 'fire') { P.yelken = Math.max(0, P.yelken - amount * 1.0); this._applyDamageVisuals(); }
    this.model.cannons.forEach((c, i) => {
      if (this.cannonHp[i] > 0 && Math.hypot(c.local.x - lp.x, c.local.z - lp.z) < 1.9) {
        this.cannonHp[i] = Math.max(0, this.cannonHp[i] - amount * 4);
        if (this.cannonHp[i] <= 0) this.events.push({ t: 'cannonBroken', i });
      }
    });
    if ((kind === 'fire' || (kind === 'hit' && amount >= 10 && Math.random() < 0.14)) && this.fires.length < 6) this.ignite(lp.x, lp.z);
  }
  ignite(lx, lz) {
    const c = { x: lx, z: lz };
    this.clampDeck(c, 0.6);
    if (this.fires.some((f) => Math.hypot(f.x - c.x, f.z - c.z) < 1.2)) return;
    this.fires.push({ id: uid('fire'), x: c.x, z: c.z, s: 0.6, t: 0 });
    this.events.push({ t: 'fire' });
  }
  extinguish(id) { this.fires = this.fires.filter((f) => f.id !== id); }
  // yelken gücü çarpanı: direkler ve bez
  sailFactor() {
    const T = this.T;
    let a = 0;
    T.masts.forEach((M, i) => { const h = this.mastHp[i]; a += h <= 0 ? 0 : h < 30 ? 0.55 : 1; });
    return (a / T.masts.length) * (0.35 + 0.65 * this.parts.yelken / 100);
  }
  // kırık direklerin devrilmesi ve yırtık yelken görünümü
  _applyDamageVisuals(instant = false) {
    const M = this.model;
    if (!M.masts) return;
    if (!this._fallen) this._fallen = [];
    M.masts.forEach((g, i) => {
      if (!g || this._fallen[i] || this.mastHp[i] > 0) return;
      const piv = new THREE.Group();
      piv.position.set(0, g.y, g.z);
      this.root.add(piv);
      piv.updateMatrixWorld(true);
      for (const o of g.objs) piv.attach(o);
      const side = (i % 2 ? -1 : 1);
      this._fallen[i] = { piv, t: instant ? 1 : 0, side };
      if (this.root.userData.rigging) this.root.userData.rigging.visible = false;
      for (const sl of M.sails) if (sl.mast === i) sl.broken = true;
    });
    // yelken bezi: yırtık deseni (alfa haritası)
    const lvl = this.parts.yelken > 70 ? 0 : this.parts.yelken > 40 ? 1 : this.parts.yelken > 15 ? 2 : 3;
    if (M.sailMat && this._tearLvl !== lvl) {
      this._tearLvl = lvl;
      M.sailMat.alphaMap = lvl ? tearTexture(lvl) : null;
      M.sailMat.alphaTest = lvl ? 0.5 : 0;
      M.sailMat.needsUpdate = true;
    }
  }
  _updateDamage(dt) {
    // devrilen direkler
    if (this._fallen) for (const f of this._fallen) {
      if (!f || f.t >= 1) { if (f) f.piv.rotation.z = f.side * 1.35; continue; }
      f.t = Math.min(1, f.t + dt * 0.7);
      f.piv.rotation.z = f.side * 1.35 * f.t * f.t;
      if (f.t >= 1) this.events.push({ t: 'mastFell' });
    }
    // yangınlar: büyür, yayılır, gövdeyi yakar; yağmur söndürür
    if (this.fires.length) {
      const rain = sky.weather.rain;
      for (const f of this.fires) {
        f.t += dt;
        f.s = Math.min(2.2, f.s + dt * (0.05 - rain * 0.12));
        if (!this.kinematic) this.hp = Math.max(0, this.hp - dt * 0.35 * f.s);
        if (f.s > 1.6 && Math.random() < dt * 0.06 && this.fires.length < 6) this.ignite(f.x + (Math.random() - 0.5) * 3, f.z + (Math.random() - 0.5) * 3);
        if (Math.random() < dt * 0.4) this.parts.yelken = Math.max(0, this.parts.yelken - 0.5);
      }
      this.fires = this.fires.filter((f) => f.s > 0.1);
      if (this.hp <= 0 && !this.sinking) this.water = Math.max(this.water, 100);
    }
  }

  get T() { return this.type; }

  // ---- yerel/dünya dönüşümleri ----
  localToWorld(v, out = new THREE.Vector3()) { return out.copy(v).applyMatrix4(this.root.matrixWorld); }
  worldToLocal(v, out = new THREE.Vector3()) {
    _m.copy(this.root.matrixWorld).invert();
    return out.copy(v).applyMatrix4(_m);
  }
  // Güverte yüksekliği (yerel)
  deckAt(lx, lz) { return deckHeight(this.T, lz); }
  // Güverte içinde mi? (küpeşte iç sınırı)
  insideDeck(lx, lz, margin = 0.35) {
    const L = this.T.L;
    if (lz < -L / 2 + margin || lz > L / 2 - margin * 0.5) return false;
    return Math.abs(lx) < hullHalfWidth(this.T, lz) - margin;
  }
  // Yerel noktayı güverte içine kıstır
  clampDeck(p, margin = 0.38) {
    const L = this.T.L;
    p.z = clamp(p.z, -L / 2 + margin, L / 2 - 1.0);
    const hw = Math.max(0.1, hullHalfWidth(this.T, p.z) - margin);
    p.x = clamp(p.x, -hw, hw);
    // direk ve donanım engelleri
    for (const M of this.T.masts) {
      const dx = p.x, dz = p.z - M.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.45) { const k = 0.45 / Math.max(d, 1e-4); p.x = dx * k; p.z = M.z + dz * k; }
    }
    return p;
  }

  heading(out = new THREE.Vector3()) { return out.set(Math.sin(this.yaw), 0, Math.cos(this.yaw)); }

  windEfficiency() {
    const hx = Math.sin(this.yaw), hz = Math.cos(this.yaw);
    const wx = Math.cos(sky.windDir), wz = Math.sin(sky.windDir);
    const a = hx * wx + hz * wz;
    return 0.3 + 0.7 * clamp(0.55 + 0.45 * a + 0.25 * (1 - a * a), 0, 1);
  }

  // ---- kontroller ----
  setRudder(v) { this.rudderInput = clamp(v, -1, 1); }
  adjustSail(d) { this.sailTarget = clamp(this.sailTarget + d, 0, 1); }
  toggleSails() { this.sailTarget = this.sailTarget > 0.5 ? 0 : 1; }
  toggleAnchor() {
    if (this.anchorState === 'down' || this.anchorState === 'lowering') { this.anchorState = 'raising'; return 'raising'; }
    this.anchorState = 'lowering';
    return 'lowering';
  }

  addHole(localPos, size = 1) {
    if (this.holes.length >= 8) { this.holes[Math.floor(Math.random() * this.holes.length)].size += 0.5; return; }
    const z = clamp(localPos.z, -this.T.L / 2 + 1.5, this.T.L / 2 - 2);
    const s = localPos.x >= 0 ? 1 : -1;
    const hw = hullHalfWidth(this.T, z);
    this.holes.push({ id: uid('h'), x: s * (hw - 0.55), z, size });
    this._syncHoles();
  }
  repairHole(id) {
    const i = this.holes.findIndex((h) => h.id === id);
    if (i >= 0) {
      this.holes.splice(i, 1);
      this.hp = Math.min(this.maxHp, this.hp + 12);
      this._syncHoles();
      return true;
    }
    return false;
  }
  _syncHoles() {
    while (this.holeMeshes.children.length) this.holeMeshes.remove(this.holeMeshes.children[0]);
    for (const h of this.holes) {
      const g = new THREE.Group();
      const dark = new THREE.Mesh(new THREE.CircleGeometry(0.35 * Math.min(1.6, h.size), 7), new THREE.MeshBasicMaterial({ color: 0x0a0604 }));
      dark.rotation.x = -Math.PI / 2;
      dark.position.y = 0.02;
      g.add(dark);
      for (let i = 0; i < 4; i++) {
        const sp = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.5), new THREE.MeshStandardMaterial({ color: 0x5a3c22 }));
        sp.position.set(Math.cos(i * 1.6) * 0.3, 0.06, Math.sin(i * 1.6) * 0.3);
        sp.rotation.set(0.4, i * 1.6, 0.2);
        g.add(sp);
      }
      g.position.set(h.x, this.deckAt(h.x, h.z), h.z);
      this.holeMeshes.add(g);
    }
  }

  damage(amount, localPos = null, kind = 'hit') {
    if (this.sunk || this.kinematic) return;
    amount *= this.dmgTakenMul || 1;
    this.hp = Math.max(0, this.hp - amount);
    if (localPos && amount >= 6) this.addHole(localPos, amount > 20 ? 1.4 : 1);
    if (localPos) this._partHits(amount, localPos, kind);
    this.events.push({ t: 'damage', amount });
    if (this.hp <= 0) this.water = Math.max(this.water, 100);
  }

  // ---- güncelleme (fizik) ----
  get mass() { return this.T.mass || (this.typeId === 'brigantine' ? 2.2 : 1); }

  update(dt) {
    const T = this.T;
    if (this.sunk) return;
    // betikle yönetilen gemiler (ticaret gemisi): konum dışarıdan verilir, yalnız kaldırma/görsel
    if (this.kinematic) { this.updateTransform(dt); return; }
    // çapa
    if (this.anchorState === 'lowering') {
      this.anchorT = Math.min(1, this.anchorT + dt / 2.2);
      if (this.anchorT >= 1) { this.anchorState = 'down'; this.events.push({ t: 'anchorDown' }); this._setAnchorPoint(); }
    } else if (this.anchorState === 'raising') {
      this.anchorT = Math.max(0, this.anchorT - dt / 2.8);
      if (this.anchorT <= 0) { this.anchorState = 'up'; this.events.push({ t: 'anchorUp' }); this.anchorPt = null; }
    }
    this.anchored = this.anchorState === 'down' || (this.anchorState === 'lowering' && this.anchorT > 0.6);
    if (this.anchored && !this.anchorPt) this._setAnchorPoint();

    // yelken ve dümen
    const sailSpeed = 0.35 + this.upg.sails * 0.1;
    this.sail = damp(this.sail, this.sailTarget, 1.2 + this.upg.sails * 0.25, dt);
    if (Math.abs(this.sail - this.sailTarget) < 0.01) this.sail = this.sailTarget;
    this.rudder = damp(this.rudder, this.rudderInput, 2.6, dt);

    // su alma (yağmur ve fırtına dalgaları güverteden su doldurur)
    const waveSpill = Math.max(0, sky.weather.waves - 1.6) * 0.12 * (1 - this.sail * 0.3);
    const leak = this.holes.reduce((a, h) => a + h.size * (this.parts[this._region(h)] < 25 ? 1.5 : 1), 0) * 0.9 + (sky.weather.rain > 0.6 ? 0.08 : 0) + waveSpill;
    this._updateDamage(dt);
    this.water = clamp(this.water + leak * dt, 0, 100);
    if (this.water >= 100 && !this.sinking) { this.sinking = 0.0001; this.events.push({ t: 'sinking' }); }

    const m = this.mass;
    const hx = Math.sin(this.yaw), hz = Math.cos(this.yaw); // baş yönü
    const px = Math.cos(this.yaw), pz = -Math.sin(this.yaw); // iskele (sol) yönü
    let vx = this.vx || 0, vz = this.vz || 0;
    let fwd = vx * hx + vz * hz;
    let lat = vx * px + vz * pz;

    // yelken itkisi: hedef hıza doğru ivmelenme (ağır gemi daha yavaş hızlanır)
    const hullF = (0.55 + 0.45 * (this.hp / this.maxHp)) * (1 - this.water / 160) * (0.72 + 0.28 * this.parts.pruva / 100) * this.sailFactor();
    const windF = 0.45 + 0.75 * sky.windStrength;
    const stormF = sky.weather.waves > 1.8 ? 0.85 : 1;
    let target = T.maxSpeed * (1 + this.upg.sails * 0.08) * (this.speedMul || 1) * this.sail * this.windEfficiency() * windF * hullF * stormF;
    if (this.anchored || this.sinking) target = 0;
    if (this.backing && this.sail < 0.1 && !this.anchored) target = -1.4;
    const accRate = (target > fwd ? T.accel * (1 + sailSpeed * 0.2) * 0.5 : (this.anchored ? 1.1 : 0.32)) / Math.pow(m, 0.35);
    fwd += (target - fwd) * (1 - Math.exp(-accRate * dt));
    // dalga yüzeyinde kayma (dalga sırtından inerken hızlanma)
    const L2 = T.L * 0.45;
    const hb = ocean.heightAt(this.x + hx * L2, this.z + hz * L2), hs = ocean.heightAt(this.x - hx * L2, this.z - hz * L2);
    fwd += ((hs - hb) / (2 * L2)) * 9.8 * 0.35 * dt;
    // omurga: yanal kaymaya güçlü direnç; rüzgâr yan kuvveti (sürüklenme)
    lat *= Math.exp(-2.4 * dt);
    const wxv = Math.cos(sky.windDir), wzv = Math.sin(sky.windDir);
    const windSide = wxv * px + wzv * pz;
    lat += windSide * (0.25 + this.sail * 0.75) * sky.windStrength * 0.9 * dt;
    vx = hx * fwd + px * lat;
    vz = hz * fwd + pz * lat;

    // limanda demirliyken halatlar: gemi iskeleye paralel, yerinde kalır (iskeleye sürüklenmez)
    const D = Ship.dock;
    const docked = this.anchored && D && Math.hypot(this.x - D.x, this.z - D.z) < D.r;
    if (docked) {
      vx += (D.x - this.x) * 0.8 * dt; vz += (D.z - this.z) * 0.8 * dt;
      vx *= Math.exp(-2.5 * dt); vz *= Math.exp(-2.5 * dt);
      let wy = D.yaw;
      if (Math.abs(wrapAngle(wy - this.yaw)) > Math.PI / 2) wy += Math.PI;
      this.yawRate = ((this.yawRate || 0) + wrapAngle(wy - this.yaw) * 0.6 * dt) * Math.exp(-2 * dt);
    } else if (this.anchored && this.anchorPt) {
      // çapa zinciri: zincir gerilince gemiyi çeker; rüzgâra karşı döner
      const bowX = this.x + hx * T.L * 0.42, bowZ = this.z + hz * T.L * 0.42;
      const dx = this.anchorPt.x - bowX, dz = this.anchorPt.z - bowZ;
      const d = Math.hypot(dx, dz);
      const chain = this.anchorPt.chain;
      vx += wxv * sky.windStrength * 0.35 * dt; vz += wzv * sky.windStrength * 0.35 * dt;
      if (d > chain) {
        const pull = (d - chain) * 1.6 * dt;
        vx += (dx / d) * pull; vz += (dz / d) * pull;
        vx *= Math.exp(-1.2 * dt); vz *= Math.exp(-1.2 * dt);
      }
      vx *= Math.exp(-0.25 * dt); vz *= Math.exp(-0.25 * dt);
      // baş rüzgâra döner
      if (sky.windStrength > 0.25) {
        const want = Math.atan2(-wxv, -wzv);
        this.yawRate = (this.yawRate || 0) + wrapAngle(want - this.yaw) * 0.04 * sky.windStrength * dt;
      }
    }

    // dönüş: dümen torku hızla artar, açısal sönüm ve atalet
    const sF = clamp(0.2 + Math.abs(fwd) / T.maxSpeed, 0.2, 1.15);
    const yawTarget = this.rudder * T.turnRate * sF * (fwd >= -0.2 ? 1 : -0.6) * (this.anchored ? 0.15 : 1) * (0.3 + 0.7 * this.parts.dumen / 100);
    this.yawRate = (this.yawRate || 0) + (yawTarget - (this.yawRate || 0)) * (1 - Math.exp(-(1.5 / Math.sqrt(m)) * dt));
    // fırtınada savrulma
    const storm = Math.max(0, sky.weather.waves - 1.3);
    if (storm > 0 && !this.anchored) this.yawRate += Math.sin(ocean.time * 0.7 + this.x * 0.01) * storm * 0.05 * dt;
    this.yaw = wrapAngle(this.yaw + this.yawRate * dt);

    this._prevX = this.x; this._prevZ = this.z;
    this.x += vx * dt; this.z += vz * dt;
    this.vx = vx; this.vz = vz;
    this.speed = fwd; this.lateral = lat;

    // çarpışmalar: kara ve deniz kayalıkları
    this._grounding(dt);
    this._obstacles(dt);
    // dünya sınırı (20×20 km haritanın kenarı)
    const lim = WORLD_HALF - 250;
    if (Math.abs(this.x) > lim || Math.abs(this.z) > lim) {
      this.x = clamp(this.x, -lim, lim); this.z = clamp(this.z, -lim, lim);
      this.vx *= 0.5; this.vz *= 0.5;
      if (!this._edgeWarned) { this._edgeWarned = true; this.events.push({ t: 'edge' }); }
    } else if (Math.abs(this.x) < lim - 30 && Math.abs(this.z) < lim - 30) this._edgeWarned = false;
    this.updateTransform(dt);
  }

  _setAnchorPoint() {
    const T = this.T;
    const bx = this.x + Math.sin(this.yaw) * T.L * 0.42, bz = this.z + Math.cos(this.yaw) * T.L * 0.42;
    const depth = Math.max(2, -terrain.heightAt(bx, bz));
    this.anchorPt = { x: bx, z: bz, chain: 3 + depth * 0.45 };
  }

  // çarpışma tepkisi: normal yönünde yansıyan hız, sürtünme, açısal itki, darbe hasarı
  _collide(nx, nz, pen, cx, cz, dt, what = 'kara') {
    const nl = Math.hypot(nx, nz) || 1;
    nx /= nl; nz /= nl;
    this.x += nx * Math.min(pen, 1.5) * 0.6;
    this.z += nz * Math.min(pen, 1.5) * 0.6;
    const vn = this.vx * nx + this.vz * nz;
    if (vn < 0) {
      const e = 0.25;
      this.vx -= (1 + e) * vn * nx; this.vz -= (1 + e) * vn * nz;
      // teğetsel sürtünme
      const tx = -nz, tz = nx;
      const vt = this.vx * tx + this.vz * tz;
      this.vx -= vt * tx * 0.15; this.vz -= vt * tz * 0.15;
      // çarpma noktasının merkeze göre konumu dönme momenti yaratır
      const rx = cx - this.x, rz = cz - this.z;
      const J = -(1 + e) * vn;
      this.yawRate = (this.yawRate || 0) + ((rx * nz - rz * nx) * J) / (this.T.L * this.T.L * 0.12 * this.mass);
      const impact = Math.abs(vn);
      if (impact > 1.6) {
        this.damage(impact * 4.2, this.worldToLocal(new THREE.Vector3(cx, this.y, cz)));
        this.events.push({ t: 'crash', impact, what });
      }
    }
    this.grounded = true;
  }

  _grounding(dt) {
    const T = this.T;
    const hx = Math.sin(this.yaw), hz = Math.cos(this.yaw);
    const px = Math.cos(this.yaw), pz = -Math.sin(this.yaw);
    const draft = 1.3 + (this.mass - 1) * 0.4;
    const pts = [
      [0, T.L / 2 - 0.5], [0, T.L / 2 + 1.5], [0, -T.L / 2 + 0.5], [T.B / 2 - 0.3, 0], [-T.B / 2 + 0.3, 0], [T.B / 2 - 0.5, T.L / 4], [-T.B / 2 + 0.5, T.L / 4], [T.B / 2 - 0.5, -T.L / 4], [-T.B / 2 + 0.5, -T.L / 4],
    ];
    let worst = 0, wx = 0, wz = 0;
    for (const [lx, lz] of pts) {
      const x = this.x + px * lx + hx * lz, z = this.z + pz * lx + hz * lz;
      const pen = terrain.heightAt(x, z) - ocean.tide + draft;
      if (pen > worst) { worst = pen; wx = x; wz = z; }
    }
    this.grounded = false;
    if (worst > 0) {
      const e = 2;
      let gx = terrain.heightAt(wx + e, wz) - terrain.heightAt(wx - e, wz);
      let gz = terrain.heightAt(wx, wz + e) - terrain.heightAt(wx, wz - e);
      if (Math.hypot(gx, gz) < 1e-4) { gx = wx - this.x; gz = wz - this.z; }
      this._collide(-gx, -gz, worst * 0.5, wx, wz, dt, 'kara');
    }
  }

  // deniz kayalıkları gibi dairesel engeller
  _obstacles(dt) {
    const list = Ship.obstacles;
    if (!list || !list.length) return;
    const T = this.T;
    const hx = Math.sin(this.yaw), hz = Math.cos(this.yaw);
    const ax = this.x - hx * T.L * 0.4, az = this.z - hz * T.L * 0.4;
    const bx = this.x + hx * T.L * 0.4, bz = this.z + hz * T.L * 0.4;
    const r = T.B * 0.45;
    for (const o of list) {
      if (Math.abs(o.x - this.x) > T.L + o.r || Math.abs(o.z - this.z) > T.L + o.r) continue;
      const abx = bx - ax, abz = bz - az;
      const t = clamp(((o.x - ax) * abx + (o.z - az) * abz) / (abx * abx + abz * abz), 0, 1);
      const cx = ax + abx * t, cz = az + abz * t;
      const dx = cx - o.x, dz = cz - o.z;
      const d = Math.hypot(dx, dz);
      if (d < r + o.r) this._collide(dx, dz, r + o.r - d, cx - (dx / (d || 1)) * r, cz - (dz / (d || 1)) * r, dt, 'kaya');
    }
  }

  // Gemi-gemi çarpışmaları (kapsül-kapsül), kütle oranına göre itki
  static collideAll(ships, dt) {
    for (let i = 0; i < ships.length; i++) for (let j = i + 1; j < ships.length; j++) {
      const a = ships[i], b = ships[j];
      if (a.sunk || b.sunk) continue;
      if (Math.hypot(a.x - b.x, a.z - b.z) > (a.T.L + b.T.L) * 0.6) continue;
      const seg = (s) => { const hx = Math.sin(s.yaw) * s.T.L * 0.4, hz = Math.cos(s.yaw) * s.T.L * 0.4; return [s.x - hx, s.z - hz, s.x + hx, s.z + hz]; };
      const [a1x, a1z, a2x, a2z] = seg(a), [b1x, b1z, b2x, b2z] = seg(b);
      // segmentler arası en yakın noktalar (örnekleyerek)
      let best = 1e9, pa = null, pb = null;
      for (let s = 0; s <= 6; s++) {
        const t = s / 6;
        const qx = a1x + (a2x - a1x) * t, qz = a1z + (a2z - a1z) * t;
        const ex = b2x - b1x, ez = b2z - b1z;
        const u = clamp(((qx - b1x) * ex + (qz - b1z) * ez) / (ex * ex + ez * ez), 0, 1);
        const rx = b1x + ex * u, rz = b1z + ez * u;
        const d = Math.hypot(qx - rx, qz - rz);
        if (d < best) { best = d; pa = [qx, qz]; pb = [rx, rz]; }
      }
      const R = a.T.B * 0.45 + b.T.B * 0.45;
      if (best >= R) continue;
      let nx = pa[0] - pb[0], nz = pa[1] - pb[1];
      const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
      const pen = R - best;
      // betikli (kinematik) gemiler sonsuz kütleli kabul edilir
      const ma = a.kinematic ? 1e6 : a.mass, mb = b.kinematic ? 1e6 : b.mass;
      a.x += nx * pen * (mb / (ma + mb)); a.z += nz * pen * (mb / (ma + mb));
      b.x -= nx * pen * (ma / (ma + mb)); b.z -= nz * pen * (ma / (ma + mb));
      const vrel = (a.vx - b.vx) * nx + (a.vz - b.vz) * nz;
      if (vrel < 0) {
        const e = 0.3;
        const J = -(1 + e) * vrel / (1 / ma + 1 / mb);
        a.vx += (J / ma) * nx; a.vz += (J / ma) * nz;
        b.vx -= (J / mb) * nx; b.vz -= (J / mb) * nz;
        const cx = (pa[0] + pb[0]) / 2, cz = (pa[1] + pb[1]) / 2;
        a.yawRate = (a.yawRate || 0) + (((cx - a.x) * nz - (cz - a.z) * nx) * J) / (a.T.L * a.T.L * 0.12 * ma);
        b.yawRate = (b.yawRate || 0) - (((cx - b.x) * nz - (cz - b.z) * nx) * J) / (b.T.L * b.T.L * 0.12 * mb);
        if (a.kinematic) { a.vx = a.vz = 0; a.yawRate = 0; }
        if (b.kinematic) { b.vx = b.vz = 0; b.yawRate = 0; }
        if (Math.abs(vrel) > 1.5) {
          a.damage(Math.abs(vrel) * 5 * (mb / ma), a.worldToLocal(new THREE.Vector3(cx, a.y, cz)));
          b.damage(Math.abs(vrel) * 5 * (ma / mb), b.worldToLocal(new THREE.Vector3(cx, b.y, cz)));
          a.events.push({ t: 'crash', impact: Math.abs(vrel), what: 'gemi' });
          b.events.push({ t: 'crash', impact: Math.abs(vrel), what: 'gemi' });
        }
      }
    }
  }

  // Kaldırma kuvveti: gövde boyunca 8 noktada su yüksekliği; yalpa ve baş-kıç vurma yay-sönüm dinamiği
  updateTransform(dt) {
    const T = this.T;
    const m = this.mass;
    const hx = Math.sin(this.yaw), hz = Math.cos(this.yaw);
    const px = Math.cos(this.yaw), pz = -Math.sin(this.yaw);
    const L = T.L * 0.42, B = T.B * 0.45;
    const P = [[0, L], [0, -L], [B, 0], [-B, 0], [B * 0.8, L * 0.55], [-B * 0.8, L * 0.55], [B * 0.8, -L * 0.55], [-B * 0.8, -L * 0.55]];
    let sum = 0, fore = 0, aft = 0, port = 0, star = 0;
    const w = [];
    for (const [lx, lz] of P) {
      const h = ocean.heightAt(this.x + px * lx + hx * lz, this.z + pz * lx + hz * lz);
      w.push(h); sum += h;
      if (lz > 0) fore += h; else if (lz < 0) aft += h;
      if (lx > 0) port += h; else if (lx < 0) star += h;
    }
    const avg = sum / P.length;
    let ty = avg - this.water / 100 * 0.8 - (m - 1) * 0.15;
    let tp = -Math.atan2(fore / 3 - aft / 3, 2 * L) * 0.95;
    // rüzgârla yatma (rüzgâr altına) + dönüşte dışa yatma
    const wxv = Math.cos(sky.windDir), wzv = Math.sin(sky.windDir);
    const windSide = wxv * px + wzv * pz;
    const heel = -windSide * this.sail * sky.windStrength * 0.16 / Math.sqrt(m) - (this.yawRate || 0) * clamp(this.speed / T.maxSpeed, -0.5, 1) * 0.25;
    let tr = Math.atan2(port / 3 - star / 3, 2 * B) * 0.85 + heel;
    tr += Math.sin(ocean.time * 0.9 + this.x * 0.05) * 0.012 * ocean.waveScale;
    if (this.sinking) {
      this.sinking += dt;
      ty -= this.sinking * this.sinking * 0.12;
      tp += this.sinking * 0.03;
      tr += this.sinking * 0.02;
      if (this.sinking > 14 && !this.sunk) { this.sunk = true; this.root.visible = false; this.events.push({ t: 'sunk' }); }
    }
    if (dt > 0) {
      // yay-sönüm: ağır gemiler daha yavaş ve daha az salınır
      const kH = 10 / m, cH = 4.2 / Math.sqrt(m);
      this.vy = (this.vy || 0) + ((ty - this.y) * kH - (this.vy || 0) * cH) * dt;
      this.y += this.vy * dt;
      const kA = 7.5 / Math.sqrt(m), cA = 3.0 / Math.pow(m, 0.25);
      this.pitchV = (this.pitchV || 0) + ((tp - this.pitch) * kA - (this.pitchV || 0) * cA) * dt;
      this.rollV = (this.rollV || 0) + ((tr - this.roll) * kA * 0.8 - (this.rollV || 0) * cA * 0.9) * dt;
      this.pitch += this.pitchV * dt;
      this.roll += this.rollV * dt;
      this.pitch = clamp(this.pitch, -0.6, 0.6);
      this.roll = clamp(this.roll, -0.7, 0.7);
    } else { this.y = ty; this.pitch = tp; this.roll = tr; this.vy = 0; this.pitchV = 0; this.rollV = 0; }
    this.root.position.set(this.x, this.y, this.z);
    _e.set(this.pitch, this.yaw, this.roll, 'YXZ');
    this.root.quaternion.setFromEuler(_e);
    this.root.updateMatrixWorld(true);
    this._animate(dt);
  }

  // Ağdan gelen durumu yumuşak takip (konuk tarafı)
  clientUpdate(dt) {
    const t = this.netTarget;
    if (t) {
      const age = (performance.now() - t.at) / 1000;
      const ex = t.x + t.vx * Math.min(age, 0.25), ez = t.z + t.vz * Math.min(age, 0.25);
      const far = Math.hypot(ex - this.x, ez - this.z) > 12;
      this.x = far ? ex : damp(this.x, ex, 8, dt);
      this.z = far ? ez : damp(this.z, ez, 8, dt);
      this.yaw = dampAngle(this.yaw, t.yaw + (t.yawRate || 0) * Math.min(age, 0.25), 8, dt);
      this.vx = t.vx; this.vz = t.vz; this.yawRate = t.yawRate;
    }
    this.updateTransform(dt);
    if (this._fallen) this._updateDamageVisualOnly(dt);
  }
  _updateDamageVisualOnly(dt) {
    for (const f of this._fallen) { if (!f) continue; f.t = Math.min(1, f.t + dt * 0.7); f.piv.rotation.z = f.side * 1.35 * f.t * f.t; }
  }

  _animate(dt) {
    const M = this.model;
    const amt = Math.max(0.06, this.sail);
    // rüzgârın gemiye göre yönü
    const rel = wrapAngle(sky.windDir - (Math.PI / 2 - this.yaw));
    const sideSign = Math.sin(rel) >= 0 ? 1 : -1;
    const billow = (0.25 + sky.windStrength * 0.9) * this.sail;
    const t = ocean.time;
    for (const s of M.sails) {
      if (s.type === 'gaff') {
        const uv = s.geo.userData.uv01, d = s.geo.userData.dims, p = s.geo.attributes.position;
        const h = d.h * amt;
        for (let i = 0; i < p.count; i++) {
          const u = uv[i * 3], v = uv[i * 3 + 1];
          const w = d.w0 + (d.w1 - d.w0) * v;
          const bz = Math.sin(Math.PI * u) * Math.sin(Math.PI * Math.min(1, v * 1.05)) * billow * 0.9 * sideSign;
          const flutter = Math.sin(t * 6 + u * 8 + v * 5) * 0.03 * (1 - this.sail * 0.6);
          p.setXYZ(i, u * w, v * h, bz + flutter);
        }
        p.needsUpdate = true;
        s.geo.computeVertexNormals();
        s.gaff.position.y = h;
        // bumba rüzgâr altına açılır
        const target = -sideSign * (0.25 + 0.35 * this.sail) * (this.sail > 0.05 ? 1 : 0.2);
        s.pivot.rotation.y = damp(s.pivot.rotation.y, target, 1.5, dt || 0.016);
      } else if (s.type === 'jib') {
        const base = s.geo.userData.base, uvs = s.geo.userData.uvs, p = s.geo.attributes.position;
        const a = s.top, b = s.bowTip;
        for (let i = 0; i < p.count; i++) {
          const bx = base[i * 3], by = base[i * 3 + 1], bz = base[i * 3 + 2];
          const u = uvs[i * 2], v = uvs[i * 2 + 1];
          // istinga çizgisine yansıt
          const fx = a.x + (b.x - a.x) * (u / Math.max(1e-3, u + (1 - u - v))) * 1;
          const k = u + v < 1e-3 ? 0 : u / (1 - v + 1e-4);
          const sx = a.x + (b.x - a.x) * k, sy = a.y + (b.y - a.y) * k, sz = a.z + (b.z - a.z) * k;
          const bil = Math.sin(Math.PI * Math.min(1, v * 1.6)) * Math.sin(Math.PI * Math.min(1, k)) * billow * 0.6 * sideSign;
          p.setXYZ(i, lerp(sx, bx, amt) + bil, lerp(sy, by, amt), lerp(sz, bz, amt));
          void fx;
        }
        p.needsUpdate = true;
        s.geo.computeVertexNormals();
      } else if (s.type === 'square') {
        const uv = s.geo.userData.uv01, d = s.geo.userData.dims, p = s.geo.attributes.position;
        const h = d.h * amt;
        for (let i = 0; i < p.count; i++) {
          const u = uv[i * 3], v = uv[i * 3 + 1];
          const w = d.w0 + (d.w1 - d.w0) * v;
          const bz = Math.sin(Math.PI * u) * Math.sin(Math.PI * v) * billow * 0.8;
          p.setXYZ(i, u * w - (w - d.w1) / 2, d.h - (1 - v) * h, bz);
        }
        p.needsUpdate = true;
        s.geo.computeVertexNormals();
        s.pivot.rotation.y = damp(s.pivot.rotation.y, -sideSign * 0.35 * this.sail, 1.2, dt || 0.016);
      }
    }
    // dümen çarkı
    M.wheel.rotation.z = -this.rudder * 2.4;
    // çapa
    const rest = M.anchorRest;
    const seabed = terrain.heightAt(this.x, this.z);
    const depthLocal = Math.max(rest.y - 25, seabed - this.y + 0.5);
    M.anchor.position.set(rest.x, lerp(rest.y, depthLocal, this.anchorT), rest.z);
    const cp = M.chain.geometry.attributes.position;
    cp.setXYZ(0, rest.x - 0.1, rest.y + 0.8, rest.z);
    cp.setXYZ(1, M.anchor.position.x, M.anchor.position.y + 0.6, M.anchor.position.z);
    cp.needsUpdate = true;
    M.chain.visible = this.anchorT > 0.02;
    // bayrak dalgalanması
    if (M.flag) {
      const fp = M.flag.geometry.attributes.position;
      if (!M.flag.userData.base) M.flag.userData.base = Float32Array.from(fp.array);
      const b = M.flag.userData.base;
      for (let i = 0; i < fp.count; i++) {
        const x = b[i * 3];
        fp.setZ(i, Math.sin(t * 7 - x * 3) * 0.12 * x);
      }
      fp.needsUpdate = true;
      M.flag.rotation.y = -(rel + Math.PI / 2) + Math.PI;
    }
    // gece feneri
    M.lampMat.emissiveIntensity = (1 - sky.lightLevel) * 2.5;
  }

  // ---- toplar ----
  cannonWorld(i) {
    const c = this.model.cannons[i];
    const pivot = c.mesh.userData.pivot;
    const muzzle = pivot.localToWorld(c.mesh.userData.muzzleLocal.clone());
    const dir = new THREE.Vector3(0, 0, 1).transformDirection(pivot.matrixWorld);
    return { muzzle, dir };
  }
  aimCannon(i, yawOff, pitch) {
    const c = this.model.cannons[i];
    const pv = c.mesh.userData.pivot;
    pv.rotation.set(-clamp(pitch, -0.15, 0.35), clamp(yawOff, -0.6, 0.6), 0);
    c.mesh.updateMatrixWorld(true);
  }
  canFire(i) { return this.cannonState[i].reload <= 0 && this.cannonballs > 0 && (this.cannonHp?.[i] ?? 100) > 0; }
  tickCannons(dt) { for (const s of this.cannonState) s.reload = Math.max(0, s.reload - dt); }

  // ---- ambar ----
  holdWeight(items) {
    let w = 0;
    for (const c of this.hold.chests) w += c.weight || 20;
    for (const id in this.hold.items) w += (items[id]?.weight || 1) * this.hold.items[id];
    return w;
  }
  holdCapacity() { return this.T.holdWeight * (1 + this.upg.hull * 0.15); }

  // ---- ağ / kayıt ----
  serialize() {
    return {
      id: this.id, typeId: this.typeId, name: this.name, look: this.look, upg: this.upg,
      x: this.x, z: this.z, yaw: this.yaw, hp: this.hp, water: this.water, holes: this.holes,
      hold: this.hold, cannonballs: this.cannonballs, planks: this.planks, sailTarget: this.sailTarget,
      parts: this.parts, mastHp: this.mastHp, cannonHp: this.cannonHp,
      anchorState: this.anchorState === 'lowering' ? 'down' : this.anchorState === 'raising' ? 'up' : this.anchorState,
    };
  }
  netState() {
    const P = this.parts;
    return [+this.x.toFixed(2), +this.z.toFixed(2), +this.yaw.toFixed(4), +this.speed.toFixed(2), +this.rudder.toFixed(2), +this.sail.toFixed(2), this.sailTarget, +this.anchorT.toFixed(2), this.anchorState, Math.round(this.hp), Math.round(this.water), this.sinking, +(this.vx || 0).toFixed(2), +(this.vz || 0).toFixed(2), +(this.yawRate || 0).toFixed(3),
      [P.pruva, P.kic, P.iskele, P.sancak, P.dumen, P.yelken].map(Math.round), this.mastHp.map(Math.round), this.cannonHp.map(Math.round), this.fires.map((f) => [+f.x.toFixed(1), +f.z.toFixed(1), +f.s.toFixed(2), f.id])];
  }
  applyNet(s) {
    this.netTarget = { x: s[0], z: s[1], yaw: s[2], vx: s[12] || 0, vz: s[13] || 0, yawRate: s[14] || 0, at: performance.now() };
    if (this.x === undefined || Math.hypot(this.x - s[0], this.z - s[1]) > 30) { this.x = s[0]; this.z = s[1]; this.yaw = s[2]; }
    this.speed = s[3]; this.rudder = s[4];
    this.sail = s[5]; this.sailTarget = s[6]; this.anchorT = s[7]; this.anchorState = s[8]; this.hp = s[9]; this.water = s[10];
    this.sinking = s[11];
    this.anchored = this.anchorState === 'down';
    if (s[15]) { const [a, b, c, d, e, f] = s[15]; Object.assign(this.parts, { pruva: a, kic: b, iskele: c, sancak: d, dumen: e, yelken: f }); }
    if (s[16]) { const was = this.mastHp.join(); this.mastHp = s[16]; if (was !== this.mastHp.join()) this._applyDamageVisuals(); }
    if (s[17]) this.cannonHp = s[17];
    if (s[18]) this.fires = s[18].map(([x, z, sz, id]) => ({ x, z, s: sz, id, t: 0 }));
    this._applyDamageVisuals();
  }

  dispose() { this.scene.remove(this.root); }
}

// ---- Kürek sandalı ----
export class Rowboat {
  constructor(scene, ship) {
    this.scene = scene;
    this.ship = ship;
    this.mesh = rowboatMesh();
    scene.add(this.mesh);
    this.x = 0; this.z = 0; this.yaw = 0; this.speed = 0; this.turn = 0;
    this.y = 0;
    this.state = 'docked'; // docked | water
    this.driver = null;
    this.cargo = [];
    this.rowPhase = 0;
    this.mesh.visible = true;
    this.updateDocked();
  }
  updateDocked() {
    const p = this.ship.localToWorld(this.ship.model.davitPos.clone());
    this.mesh.position.copy(p);
    this.mesh.quaternion.copy(this.ship.root.quaternion);
    this.x = p.x; this.z = p.z; this.yaw = this.ship.yaw;
  }
  launch() {
    const s = this.ship;
    const back = -s.T.L / 2 - 3.5;
    this.x = s.x + Math.sin(s.yaw) * back + Math.cos(s.yaw) * 1.5;
    this.z = s.z + Math.cos(s.yaw) * back - Math.sin(s.yaw) * 1.5;
    this.yaw = s.yaw;
    this.speed = 0; this.vx = s.vx || 0; this.vz = s.vz || 0; this.yawRate = 0; this.y = undefined;
    this.state = 'water';
  }
  dock() {
    this.state = 'docked';
    this.speed = 0;
    this.driver = null;
    this.updateDocked();
  }
  control(fwd, turn, dt) {
    // kürek darbeleri: ileri itki ve dönüş torku
    this.thrust = fwd;
    this.turn = damp(this.turn, turn, 4, dt);
    if (Math.abs(fwd) > 0.1 || Math.abs(turn) > 0.1) this.rowPhase += dt * 4.5;
  }
  update(dt) {
    if (this.state === 'docked') { this.updateDocked(); return; }
    const hx = Math.sin(this.yaw), hz = Math.cos(this.yaw);
    const px = Math.cos(this.yaw), pz = -Math.sin(this.yaw);
    let vx = this.vx || 0, vz = this.vz || 0;
    let fwd = vx * hx + vz * hz, lat = vx * px + vz * pz;
    // kürek çekme ritmi: darbe anında itki
    const stroke = Math.max(0, Math.sin(this.rowPhase)) * 1.6 + 0.4;
    fwd += ((this.thrust || 0) * 3.8 - fwd) * (1 - Math.exp(-(Math.abs(this.thrust || 0) > 0.05 ? 1.3 * stroke : 0.45) * dt));
    lat *= Math.exp(-3.0 * dt);
    // rüzgâr ve akıntı hafifçe sürükler
    lat += (Math.cos(sky.windDir) * px + Math.sin(sky.windDir) * pz) * sky.windStrength * 0.25 * dt;
    vx = hx * fwd + px * lat; vz = hz * fwd + pz * lat;
    this.yawRate = damp(this.yawRate || 0, (this.turn || 0) * 1.15 * (0.5 + Math.min(1, Math.abs(fwd) / 2)), 3, dt);
    this.yaw = wrapAngle(this.yaw + this.yawRate * dt);
    const nx = this.x + vx * dt, nz = this.z + vz * dt;
    const ground = terrain.heightAt(nx, nz) - ocean.tide;
    if (ground < -0.25) { this.x = nx; this.z = nz; this.beached = false; }
    else { vx *= -0.2; vz *= -0.2; this.beached = true; }
    this.vx = vx; this.vz = vz; this.speed = fwd;
    // gemi gövdesinden uzak dur (çarpınca geri sek)
    const s = this.ship;
    const dx = this.x - s.x, dz = this.z - s.z;
    const lx = dx * Math.cos(s.yaw) - dz * Math.sin(s.yaw), lz = dx * Math.sin(s.yaw) + dz * Math.cos(s.yaw);
    if (Math.abs(lz) < s.T.L / 2 + 1 && Math.abs(lx) < hullHalfWidth(s.T, clamp(lz, -s.T.L / 2, s.T.L / 2)) + 1.0) {
      const sgn = lx >= 0 ? 1 : -1;
      const nlx = sgn * (hullHalfWidth(s.T, clamp(lz, -s.T.L / 2, s.T.L / 2)) + 1.0);
      this.x = s.x + nlx * Math.cos(s.yaw) + lz * Math.sin(s.yaw);
      this.z = s.z - nlx * Math.sin(s.yaw) + lz * Math.cos(s.yaw);
      // yalnızca gövdeye doğru hız bileşenini sönümle; gövde boyunca kürek çekmek serbest
      const onx = Math.cos(s.yaw) * sgn, onz = -Math.sin(s.yaw) * sgn;
      const rvx = this.vx - (s.vx || 0), rvz = this.vz - (s.vz || 0);
      const vn = rvx * onx + rvz * onz;
      if (vn < 0.25) { this.vx += (0.25 - vn) * onx; this.vz += (0.25 - vn) * onz; }
    }
    // kaldırma: üç noktada dalga, yay-sönüm ile yalpa
    const h = ocean.heightAt(this.x, this.z);
    const hb = ocean.heightAt(this.x + hx * 1.4, this.z + hz * 1.4);
    const hs = ocean.heightAt(this.x - hx * 1.4, this.z - hz * 1.4);
    const hp = ocean.heightAt(this.x + px * 0.6, this.z + pz * 0.6), hst = ocean.heightAt(this.x - px * 0.6, this.z - pz * 0.6);
    const ty = Math.max(h, terrain.heightAt(this.x, this.z) + 0.25) + 0.05;
    this.vy = (this.vy || 0) + ((ty - (this.y || ty)) * 22 - (this.vy || 0) * 6) * dt;
    this.y = (this.y || ty) + this.vy * dt;
    const tp = -Math.atan2(hb - hs, 2.8) * 0.85, tr = Math.atan2(hp - hst, 1.2) * 0.7 - (this.yawRate || 0) * 0.08;
    this.pV = (this.pV || 0) + ((tp - (this.p || 0)) * 16 - (this.pV || 0) * 5) * dt; this.p = (this.p || 0) + this.pV * dt;
    this.rV = (this.rV || 0) + ((tr - (this.r || 0)) * 14 - (this.rV || 0) * 4.5) * dt; this.r = (this.r || 0) + this.rV * dt;
    this.mesh.position.set(this.x, this.y, this.z);
    _e.set(this.p, this.yaw, this.r, 'YXZ');
    this.mesh.quaternion.setFromEuler(_e);
    const oars = this.mesh.userData.oars;
    if (oars) oars.forEach((o, i) => { o.rotation.y = Math.sin(this.rowPhase) * 0.5 * (i ? -1 : 1); o.rotation.z = (Math.cos(this.rowPhase) * 0.2 + 0.15) * (i ? -1 : 1); });
  }
  seatWorld(out = new THREE.Vector3()) {
    return out.set(0, 0.2, -0.1).applyQuaternion(this.mesh.quaternion).add(this.mesh.position);
  }
}

// yırtık yelken deseni (alfa haritası): 1-3 düzey
const _tears = {};
function tearTexture(lvl) {
  if (_tears[lvl]) return _tears[lvl];
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#000';
  let seed = lvl * 977;
  const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const n = lvl * 7;
  for (let i = 0; i < n; i++) {
    const x = r() * 128, y = r() * 128, w = 4 + r() * 10 * lvl, h = 3 + r() * 8 * lvl;
    g.beginPath(); g.ellipse(x, y, w, h, r() * 3, 0, Math.PI * 2); g.fill();
  }
  // alt kenar saçakları
  for (let x = 0; x < 128; x += 4) { const hh = r() * 6 * lvl; g.fillRect(x, 128 - hh, 3, hh); }
  const t = new THREE.CanvasTexture(c);
  return (_tears[lvl] = t);
}
