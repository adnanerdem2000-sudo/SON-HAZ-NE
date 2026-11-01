import * as THREE from 'three';
import { terrain } from './terrain.js';
import { ocean } from './ocean.js';
import { physics } from './physics.js';
import { sky } from './sky.js';
import { clamp } from '../core/util.js';

// Basit rijit cisim motoru: yerçekimi, kaldırma kuvveti (yüzme), zemin/platform çarpışması,
// sürtünme ve sekme, cisimler arası çarpışma, devrilme ve yere oturma, patlama itkisi.
const _n = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _up = new THREE.Vector3(0, 1, 0);
const _ax = new THREE.Vector3();

export class Body {
  constructor(mesh, opts = {}) {
    this.mesh = mesh;
    this.pos = (opts.pos || mesh.position).clone();
    this.vel = opts.vel ? opts.vel.clone() : new THREE.Vector3();
    this.quat = mesh.quaternion.clone();
    this.angVel = opts.angVel ? opts.angVel.clone() : new THREE.Vector3();
    this.r = opts.radius ?? 0.4;
    this.offsetY = opts.offsetY ?? this.r; // modelin tabanı ile merkez arası
    this.mass = opts.mass ?? 1;
    this.buoy = opts.buoyancy ?? 1.0; // 1'den büyük: yüzer
    this.restitution = opts.restitution ?? 0.25;
    this.friction = opts.friction ?? 0.6;
    this.drift = opts.drift ?? 0.4; // rüzgâr/akıntı ile sürüklenme
    this.sleeping = false;
    this.sleepT = 0;
    this.grounded = false;
    this.inWater = 0;
    this.enabled = true;
    this.noPush = !!opts.noPush; // karakter/düşman itişi uygulanmaz (ganimet kesesi: oyuncu yürürken kese tekmelenip kaçmasın)
    this.onLand = opts.onLand || null;
  }
  wake() { this.sleeping = false; this.sleepT = 0; }
}

export const bodies = {
  name: 'bodies',
  list: [],
  start() { this.list = []; },
  stop() { this.list = []; },

  add(mesh, opts) {
    const b = new Body(mesh, opts);
    this.list.push(b);
    return b;
  },
  remove(b) { const i = this.list.indexOf(b); if (i >= 0) this.list.splice(i, 1); },
  clear() { this.list = []; },

  // Patlama / darbe: yarıçap içindeki cisimleri dışa doğru fırlat
  impulse(pos, radius, strength) {
    for (const b of this.list) {
      if (!b.enabled) continue;
      _n.copy(b.pos).sub(pos);
      const d = _n.length();
      if (d > radius) continue;
      const k = Math.min(14, (1 - d / radius) * strength / b.mass); // hafif cisimler (enkaz) 14 m/s'yi aşmaz
      _n.normalize();
      b.vel.addScaledVector(_n, k);
      b.vel.y += k * 0.6;
      b.angVel.set((Math.random() - 0.5) * k, (Math.random() - 0.5) * k, (Math.random() - 0.5) * k);
      b.wake();
    }
  },

  // Sürekli dikey kuvvet (buhar/gayzer): ivme = strength/kütle, dt ile ölçekli; kare hızından bağımsız
  force(pos, radius, strength, dt) {
    for (const b of this.list) {
      if (!b.enabled) continue;
      const d = Math.hypot(b.pos.x - pos.x, b.pos.y - pos.y, b.pos.z - pos.z);
      if (d > radius) continue;
      b.vel.y += (1 - d / radius) * strength / b.mass * dt;
      b.wake();
    }
  },

  // Karakter itişi: karakter dairesi cisme değiyorsa cisim itilir
  push(x, z, y, radius, vx, vz) {
    for (const b of this.list) {
      if (!b.enabled || b.noPush) continue;
      const dx = b.pos.x - x, dz = b.pos.z - z;
      const d = Math.hypot(dx, dz), m = radius + b.r * 0.9;
      if (d >= m || d < 1e-4 || Math.abs(b.pos.y - y - 0.5) > 1.6) continue;
      const nx = dx / d, nz = dz / d;
      const pen = m - d;
      b.pos.x += nx * pen * 0.8; b.pos.z += nz * pen * 0.8;
      const vn = (vx - b.vel.x) * nx + (vz - b.vel.z) * nz;
      if (vn > 0) { b.vel.x += nx * vn * 0.9 / b.mass; b.vel.z += nz * vn * 0.9 / b.mass; }
      b.wake();
    }
  },

  update(dt) {
    // sahneden kaldırılmış nesnelerin cisimlerini temizle
    if (this.list.some((b) => !b.mesh.parent)) this.list = this.list.filter((b) => b.mesh.parent);
    const steps = dt > 0.034 ? 2 : 1;
    const h = dt / steps;
    for (let s = 0; s < steps; s++) {
      for (const b of this.list) if (b.enabled && !b.sleeping) this._step(b, h);
      this._collidePairs();
    }
    for (const b of this.list) {
      if (!b.enabled) continue;
      b.mesh.position.set(b.pos.x, b.pos.y - b.offsetY, b.pos.z);
      b.mesh.quaternion.copy(b.quat);
    }
  },

  _step(b, dt) {
    const p = b.pos, v = b.vel;
    v.y -= 9.8 * dt;
    // su: batan oran kadar kaldırma kuvveti, sürükleme, dalga ve rüzgâr akıntısı
    const wh = ocean.heightAt(p.x, p.z);
    const sub = clamp((wh - (p.y - b.r)) / (2 * b.r), 0, 1);
    b.inWater = sub;
    if (sub > 0) {
      v.y += 9.8 * sub * b.buoy * 2 * dt;
      const drag = Math.exp(-(1.6 * sub) * dt);
      v.multiplyScalar(drag);
      ocean.normalAt(p.x, p.z, _n);
      v.x += (_n.x * 2.2 + Math.cos(sky.windDir) * sky.windStrength * b.drift) * sub * dt;
      v.z += (_n.z * 2.2 + Math.sin(sky.windDir) * sky.windStrength * b.drift) * sub * dt;
      // dalgayla sallanma
      _q.setFromUnitVectors(_up, _n);
      b.quat.slerp(_q2.copy(_q).multiply(this._yawOnly(b.quat)), 1 - Math.exp(-2.5 * sub * dt));
      b.angVel.multiplyScalar(Math.exp(-2 * dt));
    }
    const prevBottom = p.y - b.r;
    p.addScaledVector(v, dt);
    // zemin / platform (adım içinde geçilen platform da sayılır: hızlı cisim platformdan düşmez)
    const g = physics.groundAt(p.x, p.z, Math.max(prevBottom, p.y - b.r) + 0.3);
    if (p.y - b.r < g) {
      p.y = g + b.r;
      terrain.normalAt(p.x, p.z, _n);
      if (physics.lastPlatform) _n.set(0, 1, 0);
      const vn = v.dot(_n);
      if (vn < 0) {
        if (vn < -2.5 && b.onLand) b.onLand(-vn);
        v.addScaledVector(_n, -(1 + b.restitution) * vn);
        // sürtünme (teğetsel)
        const tvx = v.x - _n.x * v.dot(_n), tvz = v.z - _n.z * v.dot(_n);
        const f = Math.exp(-b.friction * 8 * dt);
        v.x = _n.x * v.dot(_n) + tvx * f; v.z = _n.z * v.dot(_n) + tvz * f;
      }
      // eğimde kayma: yerçekiminin yüzeye paralel bileşeni
      if (_n.y < 0.85) { v.x += _n.x * 9.8 * (1 - _n.y) * dt * 0.8; v.z += _n.z * 9.8 * (1 - _n.y) * dt * 0.8; }
      b.grounded = true;
      // yere otur: yukarı ekseni zemin normaline hizala
      _q.setFromUnitVectors(_up, _n);
      b.quat.slerp(_q2.copy(_q).multiply(this._yawOnly(b.quat)), 1 - Math.exp(-6 * dt));
      b.angVel.multiplyScalar(Math.exp(-6 * dt));
    } else b.grounded = false;
    // statik engeller (ağaç, kaya, bina)
    const before = { x: p.x, z: p.z };
    if (physics.resolve(p, b.r * 0.9, p.y - b.r, b.r * 2)) {
      const nx = p.x - before.x, nz = p.z - before.z;
      const l = Math.hypot(nx, nz);
      if (l > 1e-5) {
        const vn = (v.x * nx + v.z * nz) / l;
        if (vn < 0) { v.x -= (1 + b.restitution) * vn * nx / l; v.z -= (1 + b.restitution) * vn * nz / l; }
      }
    }
    // havada dönme
    if (b.angVel.lengthSq() > 1e-6) {
      const w = b.angVel.length();
      _ax.copy(b.angVel).divideScalar(w);
      _q.setFromAxisAngle(_ax, w * dt);
      b.quat.premultiply(_q).normalize();
    }
    // uyku
    if (b.grounded && sub === 0 && v.lengthSq() < 0.02 && b.angVel.lengthSq() < 0.01) {
      b.sleepT += dt;
      if (b.sleepT > 1.2) { b.sleeping = true; v.set(0, 0, 0); }
    } else b.sleepT = 0;
  },

  _yawOnly(q) {
    const e = new THREE.Euler().setFromQuaternion(q, 'YXZ');
    return new THREE.Quaternion().setFromAxisAngle(_up, e.y);
  },

  _collidePairs() {
    const L = this.list;
    for (let i = 0; i < L.length; i++) {
      const a = L[i];
      if (!a.enabled) continue;
      for (let j = i + 1; j < L.length; j++) {
        const b = L[j];
        if (!b.enabled || (a.sleeping && b.sleeping)) continue;
        _n.copy(a.pos).sub(b.pos);
        const d = _n.length(), m = a.r + b.r;
        if (d >= m || d < 1e-5) continue;
        _n.divideScalar(d);
        const pen = m - d, ia = 1 / a.mass, ib = 1 / b.mass;
        a.pos.addScaledVector(_n, pen * ia / (ia + ib));
        b.pos.addScaledVector(_n, -pen * ib / (ia + ib));
        if (pen > 1e-3) { if (a.sleeping) a.wake(); if (b.sleeping) b.wake(); } // itilen uyuyan cisim uyanır (havada asılı kalmaz)
        const vrel = (a.vel.x - b.vel.x) * _n.x + (a.vel.y - b.vel.y) * _n.y + (a.vel.z - b.vel.z) * _n.z;
        if (vrel < 0) {
          const J = -(1 + 0.3) * vrel / (ia + ib);
          a.vel.addScaledVector(_n, J * ia);
          b.vel.addScaledVector(_n, -J * ib);
          a.wake(); b.wake();
        }
      }
    }
  },
};
