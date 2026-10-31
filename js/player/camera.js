import * as THREE from 'three';
import { terrain } from '../world/terrain.js';
import { ocean } from '../world/ocean.js';
import { physics } from '../world/physics.js';
import { clamp, damp, lerp } from '../core/util.js';

const CAM_LOS = { tMin: 0.05, tMax: 1, rScale: 1 };
const _cq = new THREE.Vector3();

// Üçüncü şahıs kamera: oyuncunun arkasında, akıcı takip
export const tpCamera = {
  yaw: Math.PI, pitch: 0.25, dist: 4.6, targetDist: 4.6,
  fov: 70, baseFov: 70,
  shake: 0, shakeEnabled: true,
  pos: new THREE.Vector3(),
  look: new THREE.Vector3(),
  _focus: new THREE.Vector3(),
  _col: Infinity, // çarpışma nedeniyle kısaltılmış mesafe (içeri anında, dışarı yumuşak)
  mode: 'normal',

  rotate(dx, dy) {
    this.yaw -= dx;
    this.pitch = clamp(this.pitch + dy, -1.25, 1.2);
  },

  zoom(d) { this.targetDist = clamp(this.targetDist + d * 0.6, 1.8, 11); },

  addShake(a) { if (this.shakeEnabled) this.shake = Math.min(1.2, this.shake + a); },

  // focus: dünya noktası (karakter başı), opts: {dist, shoulder, height}
  update(camera, focus, dt, opts = {}) {
    const dist = opts.dist ?? this.targetDist;
    this.dist = damp(this.dist, dist, 6, dt);
    this._focus.lerp(focus, opts.snap ? 1 : 1 - Math.exp(-18 * dt));
    const f = this._focus;
    const cp = Math.cos(this.pitch);
    const dir = new THREE.Vector3(Math.sin(this.yaw) * cp, -Math.sin(this.pitch), Math.cos(this.yaw) * cp);
    const right = new THREE.Vector3(-Math.cos(this.yaw), 0, Math.sin(this.yaw));
    const shoulder = opts.shoulder || 0;
    let p = f.clone().addScaledVector(dir, -this.dist).addScaledVector(right, shoulder);
    p.y += opts.height || 0;
    // nesne çarpışması: baş→kamera doğrusu kaya/duvar/bina çarpıştırıcısına giriyorsa mesafe ikili aramayla kısaltılır
    if (opts.collide !== false) {
      const at = (d, out) => { out.copy(f).addScaledVector(dir, -d).addScaledVector(right, shoulder); out.y += opts.height || 0; return out; };
      let hit = this.dist + 1;
      if (physics.lineBlocked(f.x, f.y, f.z, p.x, p.y, p.z, CAM_LOS)) {
        let lo = 0.4, hi = this.dist;
        for (let i = 0; i < 6; i++) { const mid = (lo + hi) / 2; at(mid, _cq); if (physics.lineBlocked(f.x, f.y, f.z, _cq.x, _cq.y, _cq.z, CAM_LOS)) hi = mid; else lo = mid; }
        hit = Math.max(0.4, lo - 0.1);
      }
      this._col = hit < this._col ? hit : damp(this._col, hit, 5, dt);
      if (this._col < this.dist) at(this._col, p);
    }
    // arazi çarpışması (kamera zeminin altına girmesin)
    const ground = terrain.heightAt(p.x, p.z);
    if (p.y < ground + 0.4) p.y = ground + 0.4;
    // su yüzeyinin hemen üstü/altı titremesini engelle
    if (!opts.underwater) {
      const wh = ocean.heightAt(p.x, p.z);
      if (p.y < wh + 0.35 && f.y > wh) p.y = wh + 0.35;
    }
    if (opts.ceiling !== undefined && p.y > opts.ceiling) p.y = opts.ceiling;
    this.pos.copy(p);
    camera.position.copy(p);
    const look = f.clone().addScaledVector(right, shoulder);
    if (this.shake > 0) {
      const s = this.shake * 0.25;
      camera.position.x += (Math.random() - 0.5) * s;
      camera.position.y += (Math.random() - 0.5) * s;
      this.shake = Math.max(0, this.shake - dt * 2.5);
    }
    camera.lookAt(look);
    const targetFov = opts.fov || this.baseFov;
    this.fov = damp(this.fov, targetFov, 8, dt);
    if (Math.abs(camera.fov - this.fov) > 0.01) { camera.fov = this.fov; camera.updateProjectionMatrix(); }
  },

  forward() { return new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw)); },
  right() { return new THREE.Vector3(-Math.cos(this.yaw), 0, Math.sin(this.yaw)); },
  // kameranın baktığı yön (dünya, birim)
  lookDir() {
    const cp = Math.cos(this.pitch);
    return new THREE.Vector3(Math.sin(this.yaw) * cp, -Math.sin(this.pitch), Math.cos(this.yaw) * cp).normalize();
  },
};
