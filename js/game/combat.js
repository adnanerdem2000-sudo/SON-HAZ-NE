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
const _f = new THREE.Vector3();

// Yakın dövüş saldırıları: animasyon, oynatma hızı, süre, vuruş anı, zincirleme anı, hasar çarpanı,
// menzil, yay açısı (radyan), geri itme, dayanıklılık bedeli, öne atılım ve özel etkiler
export const SWORD_MOVES = {
  1: { anim: 'Atk1', speed: 1.45, dur: 0.66, hitAt: 0.25, chainAt: 0.4, mult: 1.0, range: 2.5, arc: 1.25, kb: 1, stam: 7, lunge: 1.4 },
  2: { anim: 'Atk2', speed: 1.5, dur: 0.66, hitAt: 0.27, chainAt: 0.42, mult: 1.1, range: 2.6, arc: 1.6, kb: 1, stam: 7, lunge: 1.4 },
  3: { anim: 'Atk3', speed: 1.3, dur: 0.82, hitAt: 0.36, chainAt: 0.82, mult: 1.6, range: 2.6, arc: 1.0, kb: 2.4, stam: 9, lunge: 2.2, finisher: true },
  heavy: { anim: 'AtkHeavy', speed: 1.15, dur: 1.1, hitAt: 0.6, chainAt: 1.1, mult: 2.3, range: 2.9, arc: 0.95, kb: 3.2, stam: 22, lunge: 2.6, heavy: true, guardBreak: true, aoe: 1.6 },
  counter: { anim: 'Counter', speed: 1.4, dur: 0.72, hitAt: 0.26, chainAt: 0.72, mult: 2.6, range: 2.7, arc: 1.3, kb: 2.6, stam: 0, lunge: 1.8, counter: true },
};
export const FIST_MOVES = {
  1: { anim: 'Punch', speed: 1.7, dur: 0.6, hitAt: 0.24, chainAt: 0.36, mult: 1, range: 1.7, arc: 1.1, kb: 0.8, stam: 4, lunge: 1 },
  2: { anim: 'Punch2', speed: 1.8, dur: 0.62, hitAt: 0.26, chainAt: 0.38, mult: 1.1, range: 1.7, arc: 1.1, kb: 0.8, stam: 4, lunge: 1 },
  3: { anim: 'Kick', speed: 1.15, dur: 0.72, hitAt: 0.34, chainAt: 0.72, mult: 1.5, range: 2.0, arc: 1.0, kb: 3, stam: 8, lunge: 1.2, finisher: true },
};

// Hasar alabilen hedefler: düşmanlar, hayvanlar, köpekbalıkları vb.
export const combat = {
  name: 'combat',
  targets: new Set(),
  lastCombat: -99,
  time: 0,
  stepNoiseT: 0,

  addTarget(t) { this.targets.add(t); return t; },
  removeTarget(t) { this.targets.delete(t); },

  init() {
    G.on('fireCannon', (e) => this.fireCannon(e.ship, e.index, e.by));
    G.on('explosion', (e) => {
      bodies.impulse(e.pos, e.radius * 2.2, 9);
      this.noise(e.pos, 70, 'explosion');
      for (const t of this.targets) {
        if (!t.alive) continue;
        const d = t.pos.distanceTo(e.pos);
        if (d < e.radius + t.radius) t.hurt(e.dmg * (1 - d / (e.radius + t.radius + 0.01)), { kind: 'explosion', pos: e.pos, kb: 4 });
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
    // savunma kıvılcımları
    const swordTip = (pos, yaw) => _v.set(pos.x + Math.sin(yaw) * 0.55, pos.y + 1.25, pos.z + Math.cos(yaw) * 0.55);
    G.on('blockSpark', (e) => { const q = swordTip(e.pos, e.yaw); effects.sparks(q.x, q.y, q.z, 10, [1, 0.9, 0.6]); });
    G.on('parry', (e) => { const q = swordTip(e.pos, e.yaw); effects.sparks(q.x, q.y, q.z, 26, [1, 1, 0.85]); effects.glitter(q.x, q.y, q.z, [1, 0.95, 0.6]); });
  },

  markCombat() { this.lastCombat = this.time; },

  // Ses olayı: düşman yapay zekâsının "duyma" algısı için (yarıçap metre)
  noise(pos, radius, kind) {
    if (!pos) return;
    G.emit('noise', { x: pos.x, y: pos.y, z: pos.z, radius, kind, t: this.time });
  },

  update(dt) {
    this.time += dt;
    G.inCombat = this.time - this.lastCombat < 6;
    const p = G.player;
    if (!p || p.dead || p.downed || G.uiOpen) return;
    // ayak sesi: koşu ve depar uzaktan duyulur, eğilerek yürümek neredeyse sessiz
    this.stepNoiseT -= dt;
    if (this.stepNoiseT <= 0 && p.mode === 'ground') {
      this.stepNoiseT = 0.45;
      const hs = Math.hypot(p.vel.x, p.vel.z);
      const r = hs < 0.4 ? 0 : p.crouch ? 1.2 : p.sprinting ? 11 : hs > 3 ? 6.5 : 3.5;
      if (r > 0) this.noise(p.pos, r * (p.carrying ? 1.4 : 1), 'step');
    }
    if (!['ground', 'deck'].includes(p.mode) || p.carrying || p.busy) { p.charge = null; p.pendingAtk = null; return; }
    if (p.equipped === 'sword' || p.equipped === 'none') this._meleeInput(p, dt);
    else if (input.pressed('saldiri') && (!p.action || p.action.type === 'land')) {
      if (p.equipped === 'pistol') this.shoot(p);
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
    if (a && a.type === 'atk' && !a.hitDone && a.t >= a.hitAt) {
      a.hitDone = true;
      this._meleeHit(p, a);
    }
    if (a && (a.type === 'slash' || a.type === 'punch') && !a.hitDone && a.t > (a.type === 'slash' ? 0.22 : 0.18)) {
      a.hitDone = true;
      this._meleeHit(p, a.type === 'slash' ? SWORD_MOVES[1] : FIST_MOVES[1]);
    }
  },

  // Basılı tutma → ağır saldırı; kısa tıklama → hafif saldırı (kombo zinciri); tampon: erken basış sıraya alınır
  _meleeInput(p, dt) {
    const sword = p.equipped === 'sword';
    if (input.pressed('saldiri')) p.charge = { t: 0 };
    if (p.charge) {
      p.charge.t += dt;
      const down = input.isDown('saldiri');
      if (sword && down && p.charge.t >= 0.3) { p.pendingAtk = { kind: 'heavy', ttl: 0.7 }; p.charge = null; }
      else if (!down) { p.pendingAtk = { kind: 'light', ttl: 0.7 }; p.charge = null; }
    }
    if (p.pendingAtk) {
      p.pendingAtk.ttl -= dt;
      const cur = p.action;
      const free = !cur || cur.type === 'land' || cur.type === 'parry' || (cur.type === 'atk' && cur.t >= cur.chainAt) || (cur.type === 'dodge' && cur.t > cur.dur * 0.7);
      if (free && !p.blocking) { const k = p.pendingAtk.kind; p.pendingAtk = null; this._attack(p, k); }
      else if (p.pendingAtk.ttl <= 0) p.pendingAtk = null;
    }
  },

  _attack(p, kind) {
    const sword = p.equipped === 'sword';
    let D;
    const chaining = p.combo.grace > 0 || (p.action?.type === 'atk' && !p.action.heavy && !p.action.counter);
    if (sword && p.counterT > 0) { D = SWORD_MOVES.counter; p.counterT = 0; p.combo.step = 0; }
    else if (sword && kind === 'heavy') { D = SWORD_MOVES.heavy; p.combo.step = 0; }
    else {
      const T = sword ? SWORD_MOVES : FIST_MOVES;
      const step = chaining ? (p.combo.step % 3) + 1 : 1;
      D = T[step];
      p.combo.step = D.finisher ? 0 : step;
    }
    if (p.stamina < D.stam * 0.6) { G.notify('Çok yorgunsun — biraz soluklan.', 'warn', 1000); return; }
    p.stamina -= D.stam;
    p.combo.grace = 0;
    p.action = null;
    p.startAction('atk', D.dur, {
      ...D, lockYaw: this._softLock(p, D.range + 1.4),
      onDone: () => { if (!D.finisher && !D.heavy && !D.counter) p.combo.grace = 0.45; },
    });
    audio.tone(D.heavy ? 180 : 320, D.heavy ? 0.2 : 0.12, 'sawtooth', 0.04, null, 0.4);
    G.emit('netAction', { a: 'atk', anim: D.anim });
    this.noise(p.pos, 9, 'melee');
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

  // eski API (balıkçılık vb.)
  slash(p) { if (p.equipped !== 'sword') return; this._attack(p, 'light'); },
  punch(p) { this._attack(p, 'light'); },

  _meleeHit(p, D) {
    const base = p.equipped === 'sword' ? p.weaponDamage() : 9;
    const hitSet = new Set();
    let any = false, blocked = false;
    for (const t of this.targets) {
      if (!t.alive) continue;
      _v.copy(t.pos).sub(p.pos);
      const dy = _v.y;
      _v.y = 0;
      const d = _v.length();
      if (d > D.range + t.radius || dy > 2.5 || dy < -2) continue;
      const ang = Math.abs(wrapAngle(Math.atan2(_v.x, _v.z) - p.yaw));
      if (ang > D.arc && d > t.radius + 0.4) continue;
      const res = t.hurt(base * D.mult, { kind: 'melee', pos: p.pos, by: G.myId, heavy: !!D.heavy, finisher: !!D.finisher, counter: !!D.counter, guardBreak: !!D.guardBreak, kb: D.kb, attacker: p, yaw: p.yaw });
      hitSet.add(t);
      if (res === 'dodged') continue;
      if (res === 'blocked') { blocked = true; effects.sparks(t.pos.x, t.pos.y + t.height * 0.55, t.pos.z, 12, [1, 0.9, 0.6]); }
      else { effects.sparks(t.pos.x, t.pos.y + t.height * 0.6, t.pos.z, D.heavy || D.counter ? 14 : 6, t.bloodColor || [1, 0.85, 0.5]); any = true; }
      this.markCombat();
    }
    // ağır vuruş: yere çarpma halkası
    if (D.aoe) {
      _f.set(p.pos.x + Math.sin(p.yaw) * 1.7, p.pos.y, p.pos.z + Math.cos(p.yaw) * 1.7);
      effects.dirt(_f.x, terrain.heightAt(_f.x, _f.z) + 0.1, _f.z, 16);
      tpCamera.addShake(0.3);
      for (const t of this.targets) {
        if (!t.alive || hitSet.has(t)) continue;
        if (Math.hypot(t.pos.x - _f.x, t.pos.z - _f.z) < D.aoe + t.radius && Math.abs(t.pos.y - p.pos.y) < 2) {
          t.hurt(base * D.mult * 0.45, { kind: 'melee', pos: _f, by: G.myId, kb: 2, attacker: p });
          any = true;
        }
      }
    }
    if (any) {
      audio.play('hit', { vol: D.heavy || D.counter ? 0.85 : 0.6, pos: p.pos, rate: D.heavy ? 0.75 : 1 });
      G.emit('hitMarker');
      if (D.heavy || D.counter || D.finisher) { G.hitStop = Math.max(G.hitStop || 0, D.counter ? 0.09 : 0.06); tpCamera.addShake(0.2); }
    }
    if (blocked && !any) {
      // kalkana çarptı: kılıç geri seker
      audio.play('hit', { vol: 0.7, pos: p.pos, rate: 1.6 });
      if (!D.heavy) { p.action = null; p.startAction('blockhit', 0.35); }
    }
    G.emit('meleeSwing', { pos: p.pos.clone(), yaw: p.yaw, dmg: base * D.mult, range: D.range });
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
    this.noise(p.pos, 45, 'gunshot');
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
    this.noise(muzzle, 90, 'cannon');
    // geri tepme
    const piv = ship.model.cannons[i].mesh.userData.pivot;
    piv.position.z -= 0.25;
    setTimeout(() => { piv.position.z += 0.25; }, 260);
    this.markCombat();
    G.emit('cannonFired', { ship: ship.id, index: i, by });
  },
};
