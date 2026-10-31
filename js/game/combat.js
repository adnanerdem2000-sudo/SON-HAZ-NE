import * as THREE from 'three';
import { G } from './ctx.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import { effects } from './effects.js';
import { tpCamera } from '../player/camera.js';
import { terrain } from '../world/terrain.js';
import { engine } from '../core/engine.js';
import { wrapAngle } from '../core/util.js';
import { bodies } from '../world/bodies.js';

const _v = new THREE.Vector3();

// Hasar alabilen hedefler: düşmanlar, hayvanlar, köpekbalıkları vb.
export const combat = {
  name: 'combat',
  targets: new Set(),
  lastCombat: -99,
  time: 0,

  addTarget(t) { this.targets.add(t); return t; },
  removeTarget(t) { this.targets.delete(t); },

  init() {
    G.on('fireCannon', (e) => this.fireCannon(e.ship, e.index, e.by));
    G.on('explosion', (e) => {
      bodies.impulse(e.pos, e.radius * 2.2, 9);
      for (const t of this.targets) {
        if (!t.alive) continue;
        const d = t.pos.distanceTo(e.pos);
        if (d < e.radius + t.radius) t.hurt(e.dmg * (1 - d / (e.radius + t.radius + 0.01)), { kind: 'explosion', pos: e.pos });
      }
      const p = G.player;
      if (p && p.pos.distanceTo(e.pos) < e.radius && e.owner !== G.ship) p.hurt(e.dmg * 0.6, e.pos, { cause: 'Patlama' });
    });
    G.on('projectileTest', (e) => {
      for (const t of this.targets) {
        if (!t.alive || !t.big) continue;
        _v.copy(t.pos); _v.y += t.height * 0.5;
        if (_v.distanceTo(e.pos) < t.radius + 0.6) {
          e.out({ type: 'target', apply: (b) => t.hurt(60 * b.dmg, { kind: 'cannon', pos: e.pos }) });
          return;
        }
      }
    });
  },

  markCombat() { this.lastCombat = this.time; },

  update(dt) {
    this.time += dt;
    G.inCombat = this.time - this.lastCombat < 6;
    const p = G.player;
    if (!p || p.dead || p.downed || G.uiOpen) return;
    if (!['ground', 'deck'].includes(p.mode) || p.carrying || p.busy) return;
    // ateş/saldırı
    if (input.pressed('saldiri') && !p.action) {
      if (p.equipped === 'sword') this.slash(p);
      else if (p.equipped === 'pistol') this.shoot(p);
      else if (p.equipped === 'none') this.punch(p);
    }
    if (input.pressed('doldur') && p.equipped === 'pistol' && !p.loaded && p.reloadT <= 0) {
      if (p.inv.has('mermi')) {
        p.inv.remove('mermi', 1);
        p.reloadT = p.inv.has('usta_tabanca') ? 1.3 : 2.0;
        p.startAction('reload', p.reloadT * 0.9);
        audio.play('ui', { vol: 0.3, rate: 0.6 });
      } else G.notify('Mermin kalmadı!', 'warn');
    }
    // vuruş anı
    const a = p.action;
    if (a && (a.type === 'slash' || a.type === 'punch') && !a.hitDone && a.t > (a.type === 'slash' ? 0.22 : 0.18)) {
      a.hitDone = true;
      this._meleeHit(p, a.type === 'slash' ? p.weaponDamage() : 9, a.type === 'slash' ? 2.5 : 1.6);
    }
  },

  // Kamera yönündeki yakın hedefe yumuşak kilitlenme
  _softLock(p, range = 3.6, cone = 1.2) {
    let best = null, bd = 1e9;
    for (const t of this.targets) {
      if (!t.alive) continue;
      const dx = t.pos.x - p.pos.x, dz = t.pos.z - p.pos.z;
      const d = Math.hypot(dx, dz);
      if (d > range + t.radius || Math.abs(t.pos.y - p.pos.y) > 2.5) continue;
      const a = Math.abs(wrapAngle(Math.atan2(dx, dz) - tpCamera.yaw));
      if (a > cone) continue;
      const score = d + a * 1.5;
      if (score < bd) { bd = score; best = t; }
    }
    return best ? Math.atan2(best.pos.x - p.pos.x, best.pos.z - p.pos.z) : null;
  },

  slash(p) {
    if (p.stamina < 6) return;
    p.stamina -= 8;
    p.startAction('slash', 0.62, { lockYaw: this._softLock(p) });
    audio.tone(320, 0.12, 'sawtooth', 0.04, null, 0.4);
    G.emit('netAction', { a: 'slash' });
  },
  punch(p) {
    p.startAction('punch', 0.5, { lockYaw: this._softLock(p, 2.4) });
    G.emit('netAction', { a: 'punch' });
  },

  _meleeHit(p, dmg, range) {
    let any = false;
    for (const t of this.targets) {
      if (!t.alive) continue;
      _v.copy(t.pos).sub(p.pos);
      const dy = _v.y;
      _v.y = 0;
      const d = _v.length();
      if (d > range + t.radius || dy > 2.5 || dy < -2) continue;
      const ang = Math.abs(wrapAngle(Math.atan2(_v.x, _v.z) - p.yaw));
      if (ang > 1.2 && d > t.radius + 0.4) continue;
      t.hurt(dmg, { kind: 'melee', pos: p.pos, by: G.myId });
      effects.sparks(t.pos.x, t.pos.y + t.height * 0.6, t.pos.z, 6, t.bloodColor || [1, 0.85, 0.5]);
      any = true;
      this.markCombat();
    }
    if (any) { audio.play('hit', { vol: 0.6, pos: p.pos }); G.emit('hitMarker'); }
    G.emit('meleeSwing', { pos: p.pos.clone(), yaw: p.yaw, dmg, range });
  },

  // Tabanca: kamera merkezinden ışın
  shoot(p) {
    if (!p.loaded) {
      audio.tone(900, 0.05, 'square', 0.05);
      G.notify('Tabanca boş — R ile doldur.', 'warn', 1500);
      return;
    }
    p.loaded = false;
    p.startAction('shoot', 0.45);
    const cam = engine.camera;
    const origin = cam.position.clone();
    const dir = new THREE.Vector3();
    cam.getWorldDirection(dir);
    if (!p.aiming) { dir.x += (Math.random() - 0.5) * 0.08; dir.y += (Math.random() - 0.5) * 0.05; dir.z += (Math.random() - 0.5) * 0.08; dir.normalize(); }
    // namlu
    const muzzle = p.pos.clone().add(new THREE.Vector3(Math.sin(p.yaw) * 0.6, 1.45, Math.cos(p.yaw) * 0.6));
    effects.flash(muzzle.x, muzzle.y, muzzle.z, dir);
    audio.play('shoot', { vol: 0.8, pos: p.pos });
    tpCamera.addShake(0.25);
    const res = this.raycast(origin, dir, 80, p);
    if (res) {
      res.target.hurt(p.weaponDamage() * (res.head ? 1.5 : 1), { kind: 'bullet', pos: p.pos, by: G.myId });
      effects.sparks(res.point.x, res.point.y, res.point.z, 8, res.target.bloodColor || [1, 0.85, 0.5]);
      G.emit('hitMarker');
      this.markCombat();
    } else {
      // arazi/su izi
      for (let d = 2; d < 80; d += 1) {
        const q = origin.clone().addScaledVector(dir, d);
        if (q.y < terrain.heightAt(q.x, q.z)) { effects.dirt(q.x, q.y + 0.1, q.z, 6); break; }
        if (q.y < 0) { effects.splash(q.x, q.z, 0.4); break; }
      }
    }
    G.emit('netAction', { a: 'shoot', dir: dir.toArray() });
  },

  raycast(origin, dir, maxD, ignore) {
    let best = null;
    for (const t of this.targets) {
      if (!t.alive || t === ignore) continue;
      // dikey kapsül ~ küre zinciri
      const segs = Math.max(1, Math.round(t.height / (t.radius * 1.5)));
      for (let s = 0; s <= segs; s++) {
        _v.copy(t.pos); _v.y += (s / segs) * t.height;
        const oc = _v.clone().sub(origin);
        const proj = oc.dot(dir);
        if (proj < 0 || proj > maxD) continue;
        const perp = oc.addScaledVector(dir, -proj).length();
        if (perp < t.radius && (!best || proj < best.d)) {
          best = { target: t, d: proj, point: origin.clone().addScaledVector(dir, proj), head: s === segs };
        }
      }
    }
    if (best) {
      // arazi engeli
      for (let d = 1; d < best.d; d += 1.2) {
        const q = origin.clone().addScaledVector(dir, d);
        if (q.y < terrain.heightAt(q.x, q.z) - 0.2) return null;
      }
    }
    return best;
  },

  fireCannon(ship, i, by) {
    if (!ship.canFire(i)) return;
    ship.cannonballs--;
    ship.cannonState[i].reload = 3.5 / (1 + ship.upg.cannons * 0.2);
    const { muzzle, dir } = ship.cannonWorld(i);
    const vel = dir.clone().multiplyScalar(58).add(new THREE.Vector3(ship.vx || 0, 0, ship.vz || 0));
    effects.flash(muzzle.x, muzzle.y, muzzle.z, dir);
    effects.cannonball(muzzle, vel, ship, ship.T.cannonDamage * (1 + ship.upg.cannons * 0.15));
    audio.boom(0.9, muzzle);
    if (by === G.myId) tpCamera.addShake(0.6);
    // geri tepme
    const piv = ship.model.cannons[i].mesh.userData.pivot;
    piv.position.z -= 0.25;
    setTimeout(() => { piv.position.z += 0.25; }, 260);
    this.markCombat();
    G.emit('cannonFired', { ship: ship.id, index: i, by });
  },
};
