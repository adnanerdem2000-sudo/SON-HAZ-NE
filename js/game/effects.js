import * as THREE from 'three';
import { G } from './ctx.js';
import { ocean } from '../world/ocean.js';
import { terrain } from '../world/terrain.js';
import { audio } from '../core/audio.js';

// Parçacık efektleri (su sıçraması, duman, kıvılcım, toprak) ve mermiler (gülle)
const MAX = 900;

export const effects = {
  name: 'effects',
  init(scene) {
    this.scene = scene;
    const geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(MAX * 3);
    this.col = new Float32Array(MAX * 3);
    this.size = new Float32Array(MAX);
    this.alpha = new Float32Array(MAX);
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(this.size, 1));
    geo.setAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      vertexShader: `attribute float size; attribute float alpha; attribute vec3 color; varying vec3 vC; varying float vA;
        void main(){ vC=color; vA=alpha; vec4 mv = modelViewMatrix*vec4(position,1.0); gl_PointSize = size * 300.0 / -mv.z; gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `varying vec3 vC; varying float vA; void main(){ vec2 d = gl_PointCoord-0.5; float r = length(d); if(r>0.5) discard; gl_FragColor = vec4(vC, vA*(1.0-r*1.8)); }`,
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
    scene.add(this.points);
    this.parts = [];
    this.balls = [];
    this.ballGeo = new THREE.SphereGeometry(0.16, 8, 6);
    this.ballMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.6, roughness: 0.4 });
    // dalış izi / kazı izleri
    this.decals = [];
    G.on('splash', (e) => this.splash(e.x, e.z, e.size || 1));
  },

  spawn(x, y, z, vx, vy, vz, life, size, r, g, b, grav = -9.8, drag = 0.5, grow = 0) {
    if (this.parts.length >= MAX) this.parts.shift();
    this.parts.push({ x, y, z, vx, vy, vz, life, max: life, size, r, g, b, grav, drag, grow });
  },

  splash(x, z, size = 1) {
    const y = ocean.heightAt(x, z);
    const n = Math.floor(18 * size);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = Math.random() * 2.5 * size;
      this.spawn(x, y, z, Math.cos(a) * s, 3 + Math.random() * 5 * size, Math.sin(a) * s, 0.9 + Math.random() * 0.6, 0.25 * size + Math.random() * 0.2, 0.85, 0.95, 1.0);
    }
    if (size > 1.2) audio.splash(Math.min(0.8, size * 0.3));
  },

  smoke(x, y, z, n = 12, size = 1, dark = 0.5) {
    for (let i = 0; i < n; i++) {
      const c = dark + Math.random() * 0.2;
      this.spawn(x, y, z, (Math.random() - 0.5) * 2, 1 + Math.random() * 2, (Math.random() - 0.5) * 2, 1.5 + Math.random(), 0.6 * size, c, c, c, 0.3, 1.2, 0.9);
    }
  },

  flash(x, y, z, dir) {
    for (let i = 0; i < 10; i++) {
      this.spawn(x, y, z, dir.x * (6 + Math.random() * 8) + (Math.random() - 0.5) * 2, dir.y * 6 + Math.random() * 2, dir.z * (6 + Math.random() * 8) + (Math.random() - 0.5) * 2, 0.25, 0.5, 1, 0.75, 0.3, 0, 3);
    }
    this.smoke(x, y, z, 14, 1.1, 0.75);
  },

  sparks(x, y, z, n = 8, color = [1, 0.85, 0.5]) {
    for (let i = 0; i < n; i++) {
      this.spawn(x, y, z, (Math.random() - 0.5) * 6, Math.random() * 4, (Math.random() - 0.5) * 6, 0.35, 0.12, color[0], color[1], color[2], -9.8, 1);
    }
  },

  blood(x, y, z, color = [0.6, 0.05, 0.05]) {
    for (let i = 0; i < 8; i++) this.spawn(x, y, z, (Math.random() - 0.5) * 3, Math.random() * 3, (Math.random() - 0.5) * 3, 0.5, 0.12, color[0], color[1], color[2]);
  },

  dirt(x, y, z, n = 10) {
    for (let i = 0; i < n; i++) this.spawn(x, y, z, (Math.random() - 0.5) * 3, 2 + Math.random() * 3, (Math.random() - 0.5) * 3, 0.8, 0.18, 0.55, 0.42, 0.28);
  },

  bubbles(x, y, z) {
    this.spawn(x + (Math.random() - 0.5) * 0.3, y, z + (Math.random() - 0.5) * 0.3, 0, 1.2, 0, 1.5, 0.06, 0.8, 0.95, 1, 0.8, 0.2);
  },

  glitter(x, y, z, color = [1, 0.9, 0.4]) {
    for (let i = 0; i < 16; i++) this.spawn(x, y + 0.5, z, (Math.random() - 0.5) * 2, 2 + Math.random() * 3, (Math.random() - 0.5) * 2, 1.2, 0.14, color[0], color[1], color[2], -4, 0.8);
  },

  // Gülle
  cannonball(origin, vel, owner, dmg = 1) {
    const m = new THREE.Mesh(this.ballGeo, this.ballMat);
    m.position.copy(origin);
    m.castShadow = true;
    this.scene.add(m);
    // çevrimiçi konukta gülleler yalnızca görseldir; hasarı oda sahibi hesaplar
    const visual = (G.online && !G.isHost) || !!G.visualOnlyBalls;
    this.balls.push({ m, vel: vel.clone(), owner, t: 0, dmg, visual });
  },

  update(dt) {
    // parçacıklar
    const P = this.parts;
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i];
      p.life -= dt;
      if (p.life <= 0) { P.splice(i, 1); continue; }
      p.vy += p.grav * dt;
      const d = Math.exp(-p.drag * dt);
      p.vx *= d; p.vz *= d;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      p.size += p.grow * dt;
    }
    const n = Math.min(P.length, MAX);
    for (let i = 0; i < n; i++) {
      const p = P[i];
      this.pos[i * 3] = p.x; this.pos[i * 3 + 1] = p.y; this.pos[i * 3 + 2] = p.z;
      this.col[i * 3] = p.r; this.col[i * 3 + 1] = p.g; this.col[i * 3 + 2] = p.b;
      this.size[i] = p.size;
      this.alpha[i] = Math.min(1, p.life / p.max * 1.5);
    }
    for (let i = n; i < MAX; i++) this.alpha[i] = 0;
    const g = this.points.geometry;
    g.setDrawRange(0, MAX);
    g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true;
    g.attributes.size.needsUpdate = true; g.attributes.alpha.needsUpdate = true;

    // gülleler
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const b = this.balls[i];
      b.t += dt;
      b.vel.y -= 9.8 * dt;
      const prev = b.m.position.clone();
      b.m.position.addScaledVector(b.vel, dt);
      const p = b.m.position;
      if (b.t > 0.05 && Math.random() < 0.5) this.spawn(p.x, p.y, p.z, 0, 0.3, 0, 0.6, 0.25, 0.7, 0.7, 0.7, 0, 1, 0.5);
      let hit = null;
      // gemiler
      for (const s of G.ships) {
        if (s === b.owner || s.sunk) continue;
        const lp = s.worldToLocal(p.clone());
        if (Math.abs(lp.z) < s.T.L / 2 + 0.3 && Math.abs(lp.x) < s.T.B / 2 + 0.2 && lp.y > -1.5 && lp.y < s.T.deckY + 2.5) { hit = { type: 'ship', ship: s, local: lp }; break; }
      }
      if (!hit) G.emit('projectileTest', { pos: p, prev, ball: b, out: (h) => { hit = hit || h; } });
      const th = terrain.heightAt(p.x, p.z);
      const wh = ocean.heightAt(p.x, p.z);
      if (hit) {
        this._explode(p, hit, b);
      } else if (p.y < th) {
        this.dirt(p.x, th + 0.2, p.z, 20); this.smoke(p.x, th + 0.5, p.z, 10, 1.2, 0.4);
        audio.boom(0.4, p);
        if (!b.visual) G.emit('explosion', { pos: p.clone(), radius: 3.5, dmg: 40 * b.dmg, owner: b.owner });
        this._removeBall(i);
        continue;
      } else if (p.y < wh) {
        this.splash(p.x, p.z, 1.6);
        this._removeBall(i);
        continue;
      }
      if (hit) { this._removeBall(i); continue; }
      if (b.t > 8) this._removeBall(i);
    }
  },

  _explode(p, hit, b) {
    this.sparks(p.x, p.y, p.z, 14);
    this.smoke(p.x, p.y, p.z, 14, 1.2, 0.35);
    audio.boom(0.7, p);
    if (b.visual) return;
    if (hit.type === 'ship') {
      hit.ship.damage(14 * b.dmg, hit.local);
      G.emit('shipHit', { ship: hit.ship, by: b.owner });
    } else if (hit.apply) hit.apply(b);
  },

  _removeBall(i) {
    const b = this.balls[i];
    this.scene.remove(b.m);
    this.balls.splice(i, 1);
  },
};
