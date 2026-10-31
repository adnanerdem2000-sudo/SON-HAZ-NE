import * as THREE from 'three';
import { terrain } from '../world/terrain.js';
import { ocean } from '../world/ocean.js';
import { clamp, damp, lerp } from '../core/util.js';

// Üçüncü şahıs kamera: oyuncunun arkasında, akıcı takip
export const tpCamera = {
  yaw: Math.PI, pitch: 0.25, dist: 4.6, targetDist: 4.6,
  fov: 70, baseFov: 70,
  shake: 0, shakeEnabled: true,
  pos: new THREE.Vector3(),
  look: new THREE.Vector3(),
  _focus: new THREE.Vector3(),
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
