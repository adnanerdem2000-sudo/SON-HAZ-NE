import * as THREE from 'three';
import { buildShipModel, SHIP_TYPES, hullHalfWidth, deckHeight, rowboatMesh } from './shipModel.js';
import { ocean } from '../world/ocean.js';
import { terrain } from '../world/terrain.js';
import { sky } from '../world/sky.js';
import { clamp, damp, dampAngle, lerp, wrapAngle, uid } from '../core/util.js';

const _v = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _e = new THREE.Euler(0, 0, 0, 'YXZ');
const _q = new THREE.Quaternion();

export class Ship {
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
    this.hold = opts.hold || { items: {}, chests: [] };
    this.cannonballs = opts.cannonballs ?? 20;
    this.planks = opts.planks ?? 6;
    this.occupants = {};
    this.rowboat = null;
    this.events = [];
    this._prevX = this.x; this._prevZ = this.z;
    this.updateTransform(0);
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
    this._syncHoles();
    this.updateTransform(0);
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

  damage(amount, localPos = null) {
    if (this.sunk) return;
    this.hp = Math.max(0, this.hp - amount);
    if (localPos && amount >= 6) this.addHole(localPos, amount > 20 ? 1.4 : 1);
    this.events.push({ t: 'damage', amount });
    if (this.hp <= 0) this.water = Math.max(this.water, 100);
  }

  // ---- güncelleme ----
  update(dt) {
    const T = this.T;
    if (this.sunk) return;
    // çapa
    if (this.anchorState === 'lowering') {
      this.anchorT = Math.min(1, this.anchorT + dt / 2.2);
      if (this.anchorT >= 1) { this.anchorState = 'down'; this.events.push({ t: 'anchorDown' }); }
    } else if (this.anchorState === 'raising') {
      this.anchorT = Math.max(0, this.anchorT - dt / 2.8);
      if (this.anchorT <= 0) { this.anchorState = 'up'; this.events.push({ t: 'anchorUp' }); }
    }
    this.anchored = this.anchorState === 'down' || (this.anchorState === 'lowering' && this.anchorT > 0.6);

    // yelken
    const sailSpeed = 0.35 + this.upg.sails * 0.1;
    this.sail = damp(this.sail, this.sailTarget, 1.2, dt);
    if (Math.abs(this.sail - this.sailTarget) < 0.01) this.sail = this.sailTarget;
    this.rudder = damp(this.rudder, this.rudderInput, 2.6, dt);

    // su alma
    const leak = this.holes.reduce((a, h) => a + h.size, 0) * 0.9 + (sky.weather.rain > 0.6 ? 0.08 : 0);
    this.water = clamp(this.water + leak * dt, 0, 100);
    if (this.water >= 100 && !this.sinking) { this.sinking = 0.0001; this.events.push({ t: 'sinking' }); }

    // hız
    const hullF = (0.55 + 0.45 * (this.hp / this.maxHp)) * (1 - this.water / 160);
    const windF = 0.45 + 0.75 * sky.windStrength;
    const stormF = sky.weather.waves > 1.8 ? 0.85 : 1;
    let target = T.maxSpeed * (1 + this.upg.sails * 0.08) * this.sail * this.windEfficiency() * windF * hullF * stormF;
    if (this.anchored) target = 0;
    if (this.sinking) target = 0;
    // yelkenler toplu iken geri manevra (halat/kürekle)
    if (this.backing && this.sail < 0.1 && !this.anchored) target = -1.4;
    const acc = target > this.speed ? T.accel * (1 + sailSpeed * 0.2) : (this.anchored ? 2.2 : 0.6);
    this.speed = damp(this.speed, target, acc * 0.5, dt);
    // dönüş
    const sF = clamp(0.22 + Math.abs(this.speed) / T.maxSpeed, 0.22, 1.15);
    const yawRate = this.rudder * T.turnRate * sF * (this.anchored ? 0.15 : 1);
    this.yaw = wrapAngle(this.yaw + yawRate * dt);
    // fırtınada savrulma
    const storm = Math.max(0, sky.weather.waves - 1.3);
    if (storm > 0 && !this.anchored) this.yaw += Math.sin(ocean.time * 0.7 + this.x * 0.01) * storm * 0.06 * dt;
    // rüzgâr kayması
    const drift = this.anchored ? 0 : sky.windStrength * 0.25 * this.sail;
    const hx = Math.sin(this.yaw), hz = Math.cos(this.yaw);
    this._prevX = this.x; this._prevZ = this.z;
    this.x += (hx * this.speed + Math.cos(sky.windDir) * drift) * dt;
    this.z += (hz * this.speed + Math.sin(sky.windDir) * drift) * dt;
    this.vx = (this.x - this._prevX) / Math.max(dt, 1e-4);
    this.vz = (this.z - this._prevZ) / Math.max(dt, 1e-4);

    // karaya oturma
    this._grounding(dt);
    // dünya sınırı
    const lim = 1150;
    if (Math.abs(this.x) > lim || Math.abs(this.z) > lim) {
      this.x = clamp(this.x, -lim, lim); this.z = clamp(this.z, -lim, lim);
      this.speed *= 0.5;
    }
    this.updateTransform(dt);
  }

  _grounding(dt) {
    const T = this.T;
    const hx = Math.sin(this.yaw), hz = Math.cos(this.yaw);
    const px = Math.cos(this.yaw), pz = -Math.sin(this.yaw);
    const draft = 1.3;
    const pts = [
      [0, T.L / 2 - 0.5], [0, T.L / 2 + 1.5], [0, -T.L / 2 + 0.5], [T.B / 2 - 0.3, 0], [-T.B / 2 + 0.3, 0], [T.B / 2 - 0.5, T.L / 4], [-T.B / 2 + 0.5, T.L / 4],
    ];
    let worst = 0, wx = 0, wz = 0, wl = null;
    for (const [lx, lz] of pts) {
      const x = this.x + px * lx + hx * lz, z = this.z + pz * lx + hz * lz;
      const h = terrain.heightAt(x, z);
      const pen = h + draft;
      if (pen > worst) { worst = pen; wx = x; wz = z; wl = { x: lx, z: lz }; }
    }
    if (worst > 0) {
      // arazi eğiminin tersine it (karadan uzaklaş) ve hasar ver
      const e = 2;
      let gx = terrain.heightAt(wx + e, wz) - terrain.heightAt(wx - e, wz);
      let gz = terrain.heightAt(wx, wz + e) - terrain.heightAt(wx, wz - e);
      let gl = Math.hypot(gx, gz);
      if (gl < 1e-4) { gx = this.x - wx; gz = this.z - wz; gl = Math.hypot(gx, gz) || 1; }
      const push = Math.min(worst, 1.5) * 2.2 + 0.4;
      this.x = this._prevX - (gx / gl) * push * dt;
      this.z = this._prevZ - (gz / gl) * push * dt;
      const impact = Math.abs(this.speed);
      if (impact > 2.0) {
        this.damage(impact * 3.2, new THREE.Vector3(wl.x, 0, wl.z));
        this.events.push({ t: 'crash', impact });
      }
      this.speed *= -0.25;
      this.grounded = true;
    } else this.grounded = false;
  }

  updateTransform(dt) {
    const T = this.T;
    const hx = Math.sin(this.yaw), hz = Math.cos(this.yaw);
    const px = Math.cos(this.yaw), pz = -Math.sin(this.yaw);
    const hb = ocean.heightAt(this.x + hx * T.L * 0.4, this.z + hz * T.L * 0.4);
    const hs = ocean.heightAt(this.x - hx * T.L * 0.4, this.z - hz * T.L * 0.4);
    const hp = ocean.heightAt(this.x + px * T.B * 0.5, this.z + pz * T.B * 0.5);
    const hst = ocean.heightAt(this.x - px * T.B * 0.5, this.z - pz * T.B * 0.5);
    const avg = (hb + hs + hp + hst) / 4;
    let ty = avg - this.water / 100 * 0.7;
    let tp = -Math.atan2(hb - hs, T.L * 0.8) * 0.9;
    let tr = Math.atan2(hp - hst, T.B) * 0.8 - this.rudder * clamp(this.speed / T.maxSpeed, 0, 1) * 0.06;
    tr += Math.sin(ocean.time * 0.9 + this.x * 0.05) * 0.012 * ocean.waveScale;
    if (this.sinking) {
      this.sinking += dt;
      ty -= this.sinking * this.sinking * 0.12;
      tp += this.sinking * 0.03;
      tr += this.sinking * 0.02;
      if (this.sinking > 14 && !this.sunk) { this.sunk = true; this.root.visible = false; this.events.push({ t: 'sunk' }); }
    }
    if (dt > 0) {
      this.y = damp(this.y, ty, 4, dt);
      this.pitch = damp(this.pitch, tp, 3, dt);
      this.roll = damp(this.roll, tr, 3, dt);
    } else { this.y = ty; this.pitch = tp; this.roll = tr; }
    this.root.position.set(this.x, this.y, this.z);
    _e.set(this.pitch, this.yaw, this.roll, 'YXZ');
    this.root.quaternion.setFromEuler(_e);
    this.root.updateMatrixWorld(true);
    this._animate(dt);
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
  canFire(i) { return this.cannonState[i].reload <= 0 && this.cannonballs > 0; }
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
      anchorState: this.anchorState === 'lowering' ? 'down' : this.anchorState === 'raising' ? 'up' : this.anchorState,
    };
  }
  netState() {
    return [this.x, this.z, this.yaw, this.speed, this.rudder, this.sail, this.sailTarget, this.anchorT, this.anchorState, this.hp, this.water, this.sinking];
  }
  applyNet(s, alpha = 1) {
    this.x = s[0]; this.z = s[1]; this.yaw = s[2]; this.speed = s[3]; this.rudder = s[4];
    this.sail = s[5]; this.sailTarget = s[6]; this.anchorT = s[7]; this.anchorState = s[8]; this.hp = s[9]; this.water = s[10];
    this.sinking = s[11];
    this.anchored = this.anchorState === 'down';
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
    this.speed = 0;
    this.state = 'water';
  }
  dock() {
    this.state = 'docked';
    this.speed = 0;
    this.driver = null;
    this.updateDocked();
  }
  control(fwd, turn, dt) {
    this.speed = damp(this.speed, fwd * 3.6, 1.8, dt);
    this.turn = damp(this.turn, turn, 4, dt);
    if (Math.abs(fwd) > 0.1 || Math.abs(turn) > 0.1) this.rowPhase += dt * 4.5;
  }
  update(dt) {
    if (this.state === 'docked') { this.updateDocked(); return; }
    this.yaw = wrapAngle(this.yaw + this.turn * 1.1 * dt);
    const nx = this.x + Math.sin(this.yaw) * this.speed * dt;
    const nz = this.z + Math.cos(this.yaw) * this.speed * dt;
    const ground = terrain.heightAt(nx, nz);
    if (ground < -0.25) { this.x = nx; this.z = nz; this.beached = false; }
    else { this.speed *= 0.3; this.beached = true; }
    // gemi gövdesinden uzak dur
    const s = this.ship;
    const dx = this.x - s.x, dz = this.z - s.z;
    const lx = dx * Math.cos(s.yaw) - dz * Math.sin(s.yaw), lz = dx * Math.sin(s.yaw) + dz * Math.cos(s.yaw);
    if (Math.abs(lz) < s.T.L / 2 + 1 && Math.abs(lx) < hullHalfWidth(s.T, clamp(lz, -s.T.L / 2, s.T.L / 2)) + 1.0) {
      const sgn = lx >= 0 ? 1 : -1;
      const nlx = sgn * (hullHalfWidth(s.T, clamp(lz, -s.T.L / 2, s.T.L / 2)) + 1.0);
      this.x = s.x + nlx * Math.cos(s.yaw) + lz * Math.sin(s.yaw);
      this.z = s.z - nlx * Math.sin(s.yaw) + lz * Math.cos(s.yaw);
    }
    const h = ocean.heightAt(this.x, this.z);
    const hb = ocean.heightAt(this.x + Math.sin(this.yaw) * 1.4, this.z + Math.cos(this.yaw) * 1.4);
    const hs = ocean.heightAt(this.x - Math.sin(this.yaw) * 1.4, this.z - Math.cos(this.yaw) * 1.4);
    this.y = Math.max(h, terrain.heightAt(this.x, this.z) + 0.25) + 0.05;
    this.mesh.position.set(this.x, this.y, this.z);
    _e.set(-Math.atan2(hb - hs, 2.8) * 0.8, this.yaw, Math.sin(ocean.time * 1.3 + this.x) * 0.04, 'YXZ');
    this.mesh.quaternion.setFromEuler(_e);
    const oars = this.mesh.userData.oars;
    if (oars) oars.forEach((o, i) => { o.rotation.y = Math.sin(this.rowPhase) * 0.5 * (i ? -1 : 1); o.rotation.z = (Math.cos(this.rowPhase) * 0.2 + 0.15) * (i ? -1 : 1); });
  }
  seatWorld(out = new THREE.Vector3()) {
    return out.set(0, 0.2, -0.1).applyQuaternion(this.mesh.quaternion).add(this.mesh.position);
  }
}
