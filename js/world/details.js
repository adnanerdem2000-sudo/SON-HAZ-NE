import * as THREE from 'three';
import { G } from '../game/ctx.js';
import { terrain } from './terrain.js';
import { ocean } from './ocean.js';
import { physics } from './physics.js';
import { sky } from './sky.js';
import { time } from './time.js';
import { port } from './port.js';
import { CORE_ISLANDS as ISLANDS, CORE_FISH_ZONES as FISH_ZONES } from './worldData.js';
import { assets } from '../core/assets.js';
import { audio } from '../core/audio.js';
import { interact } from '../game/interact.js';
import { effects } from '../game/effects.js';
import { Ship } from '../ship/ship.js';
import { rowboatMesh } from '../ship/shipModel.js';
import { Character } from '../player/character.js';
import { defaultAppearance } from '../player/appearance.js';
import { colorize, mergeGeos } from './props.js';
import { rng, clamp, lerp, damp, dampAngle, noise2, wrapAngle } from '../core/util.js';

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _e = new THREE.Euler();

function inst(scene, geo, mat, list, shadow = false) {
  if (!list.length) return null;
  const im = new THREE.InstancedMesh(geo, mat, list.length);
  list.forEach((t, i) => {
    _q.setFromEuler(_e.set(t.rx || 0, t.yaw || 0, t.rz || 0));
    _s.set(t.s * (t.sx || 1), t.s * (t.sy || 1), t.s * (t.sz || 1));
    im.setMatrixAt(i, _m.compose(_p.set(t.x, t.y, t.z), _q, _s));
    if (t.color) im.setColorAt(i, t.color);
  });
  im.castShadow = shadow; im.receiveShadow = true;
  im.computeBoundingSphere();
  scene.add(im);
  return im;
}

// ---- mercan ve yosun geometrileri ----
function branchCoral(seed) {
  const r = rng(seed), geos = [];
  for (let i = 0; i < 7; i++) {
    const h = 0.4 + r() * 0.7;
    const g = new THREE.CylinderGeometry(0.02, 0.06, h, 5);
    g.translate(0, h / 2, 0);
    g.rotateZ((r() - 0.5) * 1.1); g.rotateX((r() - 0.5) * 1.1);
    geos.push(colorize(g.toNonIndexed(), new THREE.Color(1, 1, 1)));
    const tip = new THREE.SphereGeometry(0.05, 5, 4);
    tip.translate(0, h, 0);
    geos.push(colorize(tip.toNonIndexed(), new THREE.Color(1.15, 1.15, 1.15)));
  }
  return mergeGeos(geos);
}
function brainCoral() {
  const g = new THREE.SphereGeometry(0.45, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 1 + Math.sin(x * 22 + Math.sin(z * 18) * 2) * 0.05;
    p.setXYZ(i, x * k, y * k * 0.75, z * k);
  }
  g.computeVertexNormals();
  return colorize(g.toNonIndexed(), new THREE.Color(1, 1, 1));
}
function fanCoral() {
  const g = new THREE.CircleGeometry(0.6, 12, 0, Math.PI);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 5) * 0.05);
  g.computeVertexNormals();
  return colorize(g.toNonIndexed(), new THREE.Color(1, 1, 1));
}
function kelp() {
  const g = new THREE.PlaneGeometry(0.28, 2.6, 1, 8);
  g.translate(0, 1.3, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) * (1 - p.getY(i) / 3.2));
  const g2 = g.clone(); g2.rotateY(Math.PI / 2);
  return mergeGeos([colorize(g.toNonIndexed(), new THREE.Color(1, 1, 1)), colorize(g2.toNonIndexed(), new THREE.Color(0.9, 0.9, 0.9))]);
}
function shellGeo() {
  const g = new THREE.SphereGeometry(0.08, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2);
  g.scale(1, 0.5, 1.2);
  return colorize(g.toNonIndexed(), new THREE.Color(1, 1, 1));
}
function starfishGeo() {
  const s = new THREE.Shape();
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * Math.PI * 2, r = i % 2 ? 0.05 : 0.14;
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r); else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  return colorize(g.toNonIndexed(), new THREE.Color(1, 1, 1));
}
function gullGeo() {
  // gövde + iki kanat (kanatlar köşe rengindeki işaretle kanat çırpar)
  const body = new THREE.CapsuleGeometry(0.09, 0.32, 3, 6);
  body.rotateX(Math.PI / 2);
  const geos = [colorize(body.toNonIndexed(), new THREE.Color(0.95, 0.95, 0.95))];
  for (const s of [-1, 1]) {
    const w = new THREE.PlaneGeometry(0.7, 0.18, 2, 1);
    w.translate(s * 0.38, 0, 0);
    w.rotateX(-Math.PI / 2);
    const g = w.toNonIndexed();
    const p = g.attributes.position;
    const c = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { const tip = Math.abs(p.getX(i)) > 0.5; c[i * 3] = tip ? 0.25 : 0.92; c[i * 3 + 1] = tip ? 0.25 : 0.92; c[i * 3 + 2] = tip ? 0.28 : 0.95; }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    geos.push(g);
  }
  const beak = new THREE.ConeGeometry(0.025, 0.08, 4); beak.rotateX(Math.PI / 2); beak.translate(0, 0, 0.25);
  geos.push(colorize(beak.toNonIndexed(), new THREE.Color(0.95, 0.75, 0.2)));
  return mergeGeos(geos);
}

// Dümen suyu izi: kıçtan genişleyen köpük şeridi
class Wake {
  constructor(scene, width = 3) {
    this.N = 48;
    this.width = width;
    this.pts = [];
    const geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(this.N * 2 * 3);
    this.alpha = new Float32Array(this.N * 2);
    this.uvs = new Float32Array(this.N * 2 * 2);
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1));
    geo.setAttribute('uv', new THREE.BufferAttribute(this.uvs, 2));
    const idx = [];
    for (let i = 0; i < this.N - 1; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    geo.setIndex(idx);
    this.mesh = new THREE.Mesh(geo, Wake.material());
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 3;
    scene.add(this.mesh);
    this.t = 0;
  }
  static material() {
    if (Wake._mat) return Wake._mat;
    Wake._mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, fog: true,
      uniforms: { uTime: { value: 0 }, uLight: { value: 1 }, fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 } },
      vertexShader: `attribute float alpha; varying float vA; varying vec2 vUv; varying float vFog;
        void main(){ vA = alpha; vUv = uv; vec4 mv = modelViewMatrix*vec4(position,1.0); vFog = -mv.z; gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `uniform float uTime, uLight; uniform vec3 fogColor; uniform float fogDensity; varying float vA; varying vec2 vUv; varying float vFog;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
        float n(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
        void main(){
          float edge = 1.0 - abs(vUv.x*2.0-1.0);
          float foam = n(vec2(vUv.x*6.0, vUv.y*0.8 - uTime*0.4)) * 0.6 + n(vec2(vUv.x*14.0, vUv.y*2.0))*0.4;
          float a = vA * smoothstep(0.0, 0.35, edge) * smoothstep(0.25, 0.65, foam + edge*0.3);
          vec3 c = vec3(0.92,0.97,1.0) * uLight;
          float fog = 1.0 - exp(-fogDensity*fogDensity*vFog*vFog);
          gl_FragColor = vec4(mix(pow(c, vec3(2.2)), fogColor, fog), a * 0.75);
          #include <colorspace_fragment>
        }`,
    });
    return Wake._mat;
  }
  update(dt, x, z, yaw, speed, halfW, sternOff) {
    this.t += dt;
    const sx = x - Math.sin(yaw) * sternOff, sz = z - Math.cos(yaw) * sternOff;
    if (speed > 0.6 && (this.t > 0.2 || !this.pts.length)) {
      this.t = 0;
      this.pts.unshift({ x: sx, z: sz, px: Math.cos(yaw), pz: -Math.sin(yaw), age: 0, w: halfW, s: Math.min(1, speed / 6) });
      if (this.pts.length > this.N) this.pts.pop();
    }
    for (const p of this.pts) { p.age += dt; p.w += dt * (0.6 + p.s * 0.9); }
    while (this.pts.length && this.pts[this.pts.length - 1].age > 9) this.pts.pop();
    const n = this.pts.length;
    for (let i = 0; i < this.N; i++) {
      const p = this.pts[Math.min(i, n - 1)];
      if (!p) { this.alpha[i * 2] = this.alpha[i * 2 + 1] = 0; continue; }
      const y = ocean.heightAt(p.x, p.z) + 0.06;
      this.pos.set([p.x + p.px * p.w, y, p.z + p.pz * p.w, p.x - p.px * p.w, y, p.z - p.pz * p.w], i * 6);
      const a = i < n ? clamp(1 - p.age / 9, 0, 1) * p.s : 0;
      this.alpha[i * 2] = this.alpha[i * 2 + 1] = a;
      this.uvs.set([0, p.age * 2, 1, p.age * 2], i * 4);
    }
    const g = this.mesh.geometry;
    g.attributes.position.needsUpdate = true; g.attributes.alpha.needsUpdate = true; g.attributes.uv.needsUpdate = true;
  }
  dispose(scene) { scene.remove(this.mesh); }
}

export const details = {
  name: 'details',

  init(scene) {
    this.scene = scene;
    const R = rng(2024);
    const coralMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, flatShading: false });
    const coralCols = [0xff6f91, 0xff9a3c, 0xb06ce0, 0xffd23f, 0x4fd1c5, 0xff4d6d].map((c) => new THREE.Color(c));
    const branch = [], brain = [], fans = [], kelps = [], shells = [], stars = [], drift = [];
    // mercan resifleri (sığ resif bölgeleri)
    for (const z of FISH_ZONES.filter((f) => f.type === 'reef')) {
      for (let i = 0; i < 260; i++) {
        const a = R() * Math.PI * 2, r = Math.sqrt(R()) * z.r;
        const x = z.x + Math.cos(a) * r, zz = z.z + Math.sin(a) * r;
        const h = terrain.heightAt(x, zz);
        if (h > -1.4 || h < -10) continue;
        const col = coralCols[Math.floor(R() * coralCols.length)].clone().multiplyScalar(0.85 + R() * 0.3);
        const t = R();
        if (t < 0.45) branch.push({ x, y: h - 0.05, z: zz, s: 0.8 + R() * 1.4, yaw: R() * 6.28, color: col });
        else if (t < 0.75) brain.push({ x, y: h - 0.1, z: zz, s: 0.6 + R() * 1.2, yaw: R() * 6.28, color: col });
        else fans.push({ x, y: h, z: zz, s: 0.7 + R() * 1.1, yaw: R() * 6.28, color: col });
      }
    }
    // deniz yosunu ve kumsal ayrıntıları
    for (const I of ISLANDS) {
      const n = Math.floor(I.r * 3.2);
      for (let i = 0; i < n; i++) {
        const a = R() * Math.PI * 2, r = I.r * (0.85 + R() * 0.75);
        const x = I.x + Math.cos(a) * r, z = I.z + Math.sin(a) * r;
        const h = terrain.heightAt(x, z);
        if (h < -1.2 && h > -12 && R() < 0.7) kelps.push({ x, y: h, z, s: 0.7 + R() * 1.2, yaw: R() * 6.28, color: new THREE.Color().setHSL(0.22 + R() * 0.08, 0.6, 0.22 + R() * 0.1) });
        else if (h > 0.15 && h < 1.6) {
          const t = R();
          if (t < 0.5) shells.push({ x, y: h, z, s: 0.7 + R() * 0.8, yaw: R() * 6.28, color: new THREE.Color().setHSL(0.05 + R() * 0.08, 0.5, 0.75 + R() * 0.15) });
          else if (t < 0.75) stars.push({ x, y: h + 0.01, z, s: 0.7 + R() * 0.7, yaw: R() * 6.28, color: new THREE.Color(R() < 0.5 ? 0xe86a3a : 0xd0405a) });
          else if (t < 0.85 && I.biome !== 'hayalet') drift.push({ x, y: h + 0.05, z, s: 1, sx: 0.6 + R() * 1.2, yaw: R() * 6.28, rz: 0, color: new THREE.Color(0.6, 0.5, 0.4) });
        }
      }
    }
    inst(scene, branchCoral(5), coralMat, branch);
    inst(scene, brainCoral(), coralMat, brain);
    const fanMat = coralMat.clone(); fanMat.side = THREE.DoubleSide;
    inst(scene, fanCoral(), fanMat, fans);
    const kelpMat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.8 });
    kelpMat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = { value: 0 };
      kelpMat.userData.shader = sh;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          { vec4 ip = vec4(0.0);
            #ifdef USE_INSTANCING
            ip = instanceMatrix[3];
            #endif
            float k = position.y / 2.6;
            transformed.x += sin(uTime*1.2 + ip.x*0.4 + position.y*1.5) * 0.25 * k * k;
            transformed.z += cos(uTime*0.9 + ip.z*0.4 + position.y*1.2) * 0.18 * k * k; }`);
    };
    this.kelpMat = kelpMat;
    inst(scene, kelp(), kelpMat, kelps);
    const beachMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 });
    inst(scene, shellGeo(), beachMat, shells);
    inst(scene, starfishGeo(), beachMat, stars);
    const driftGeo = new THREE.CylinderGeometry(0.12, 0.16, 1.6, 6);
    driftGeo.rotateZ(Math.PI / 2);
    inst(scene, colorize(driftGeo.toNonIndexed(), new THREE.Color(1, 1, 1)), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }), drift, true);

    // toplanabilir deniz kabukları ve istiridyeler
    this.collectibles = [];
    for (let i = 0; i < 46; i++) {
      const I = ISLANDS[i % ISLANDS.length];
      for (let tries = 0; tries < 20; tries++) {
        const a = R() * Math.PI * 2, r = I.r * (0.9 + R() * 0.25);
        const x = I.x + Math.cos(a) * r, z = I.z + Math.sin(a) * r;
        const h = terrain.heightAt(x, z);
        if (h > 0.2 && h < 1.4) {
          const oyster = R() < 0.3;
          const m = new THREE.Mesh(oyster ? new THREE.SphereGeometry(0.13, 10, 6) : new THREE.ConeGeometry(0.1, 0.22, 8), new THREE.MeshStandardMaterial({ color: oyster ? 0x7a7a6a : 0xf2d7c4, roughness: 0.4, metalness: oyster ? 0.1 : 0 }));
          if (oyster) m.scale.set(1.2, 0.45, 1);
          else m.rotation.z = Math.PI / 2.3;
          m.position.set(x, h + 0.06, z);
          scene.add(m);
          this.collectibles.push({ x, z, y: h, mesh: m, kind: oyster ? 'istiridye' : 'deniz_kabugu', taken: 0 });
          break;
        }
      }
    }
    interact.addProvider((ctx, out) => {
      const p = ctx.player;
      if (p.mode !== 'ground') return;
      for (const c of this.collectibles) {
        if (c.taken > 0) continue;
        const d = Math.hypot(c.x - p.pos.x, c.z - p.pos.z);
        if (d < 1.8) out.push({ id: 'shell' + c.x, pos: c.mesh.position, radius: 1.8, priority: 0.5, label: c.kind === 'istiridye' ? 'İstiridye topla' : 'Deniz kabuğu topla', action: () => this.collect(c) });
      }
    });

    // deniz kayalıkları (gemiler için engel)
    Ship.obstacles = [];
    const stackMat = null; void stackMat;
    let count = 0;
    for (const I of ISLANDS) {
      const want = Math.max(2, Math.floor(I.r / 40));
      for (let tries = 0; tries < 80 && want > 0; tries++) {
        const a = R() * Math.PI * 2, r = I.r * (1.1 + R() * 0.35);
        const x = I.x + Math.cos(a) * r, z = I.z + Math.sin(a) * r;
        const h = terrain.heightAt(x, z);
        if (h > -2.5 || h < -11) continue;
        if (Math.hypot(x - port.mooring.x, z - port.mooring.z) < 120) continue;
        if (Ship.obstacles.filter((o) => Math.hypot(o.x - x, o.z - z) < 40).length) continue;
        const hgt = 9 + R() * 14;
        const rock = assets.prop('rock_tall', hgt);
        rock.position.set(x, h - 1, z);
        rock.rotation.y = R() * 6;
        rock.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.color.multiplyScalar(0.8); o.castShadow = true; } });
        scene.add(rock);
        const rad = hgt * 0.32;
        Ship.obstacles.push({ x, z, r: rad });
        physics.addCircle(x, z, rad, h - 2, h + hgt, 'seastack');
        if (++count > 40) break;
        if (Ship.obstacles.filter((o) => Math.hypot(o.x - I.x, o.z - I.z) < I.r * 2).length >= want) break;
      }
    }

    // martı sürüleri
    const gullMat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.8 });
    gullMat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = { value: 0 };
      gullMat.userData.shader = sh;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          { float ph = 0.0;
            #ifdef USE_INSTANCING
            ph = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.21;
            #endif
            float ax = abs(position.x);
            if (ax > 0.1) transformed.y += sin(uTime*7.0 + ph) * (ax - 0.1) * 0.9; }`);
    };
    this.gullMat = gullMat;
    this.gulls = new THREE.InstancedMesh(gullGeo(), gullMat, 36);
    this.gulls.frustumCulled = false;
    this.gulls.castShadow = false;
    scene.add(this.gulls);
    this.flocks = [
      { cx: 40, cz: 250, r: 60, h: 22, n: 10, sp: 0.25, follow: false },
      { cx: 470, cz: 360, r: 70, h: 26, n: 8, sp: 0.2, follow: false },
      { cx: 0, cz: 0, r: 25, h: 18, n: 8, sp: 0.45, follow: true },
      { cx: -560, cz: 420, r: 40, h: 30, n: 10, sp: 0.18, follow: false },
    ];

    // şelale (lagün kuzeyindeki tepeden aşağı akan basamaklı su)
    this._waterfall(scene);

    // balıkçı tekneleri
    this.boats = [];
    for (let i = 0; i < 2; i++) {
      const b = rowboatMesh(i ? '#5a7a8a' : '#8a5a3a');
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.6, 5), new THREE.MeshStandardMaterial({ color: 0x5a3c22 }));
      mast.position.set(0, 1.4, 0.4);
      const sail = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.8), new THREE.MeshStandardMaterial({ color: i ? 0xd04a3a : 0xefe6d0, side: THREE.DoubleSide }));
      sail.position.set(0, 1.6, -0.1); sail.rotation.y = Math.PI / 2;
      const fisher = new Character({ ...defaultAppearance(i ? 'f' : 'm'), hat: 'bandana', hatColor: i ? '#2a5a7a' : '#c0392b' });
      fisher.root.scale.setScalar(0.95);
      fisher.root.position.set(0, -0.35, -0.6);
      fisher.play('Idle', 0);
      b.add(mast, sail, fisher.root);
      scene.add(b);
      this.boats.push({ mesh: b, fisher, t: i * 50, cx: i ? 260 : -120, cz: i ? 330 : 330, r: i ? 70 : 90, sp: 0.035 + i * 0.01 });
    }

    // dümen suyu izleri
    this.wakes = new Map();

    // ticaret gemisi (zaman çizelgesine bağlı)
    this.trader = null;
    interact.addProvider((ctx, out) => {
      const t = this.trader;
      if (!t || t.phase !== 'docked' || ctx.player.mode !== 'ground') return;
      const pos = t.npc.root.position;
      if (pos.distanceTo(ctx.pos) < 3) out.push({ id: 'trader', pos, radius: 3, priority: 2, label: 'Konuş: Halil Reis', sub: 'Ticaret gemisi tüccarı', action: () => G.emit('openShop', { role: 'trader' }) });
    });
  },

  start() {
    for (const c of this.collectibles) { c.taken = 0; c.mesh.visible = true; }
    this._removeTrader();
    for (const [, w] of this.wakes) w.dispose(this.scene);
    this.wakes.clear();
  },
  stop() { this.start(); },

  collect(c) {
    const p = G.player;
    c.taken = 240; // 4 dakika sonra yeniden belirir
    c.mesh.visible = false;
    if (c.kind === 'istiridye') {
      if (Math.random() < 0.25) { p.inv.add('inci', 1); G.notify('İstiridyenin içinden bir inci çıktı!', 'good'); audio.play('gem', { vol: 0.5 }); }
      else { p.inv.add('istiridye', 1); G.notify('İstiridye topladın.', 'info', 1800); }
    } else { p.inv.add('deniz_kabugu', 1); G.notify('Deniz kabuğu topladın.', 'info', 1500); }
    p.startAction('pickup', 0.6);
    audio.play('confirm', { vol: 0.3, rate: 1.4 });
  },

  _waterfall(scene) {
    // tepe üstünden lagüne kadar yüzeyi izleyen şerit
    const pts = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30;
      const x = -150 + Math.sin(t * 3) * 2, z = lerp(-4, 52, t);
      const h = terrain.heightAt(x, z);
      pts.push(new THREE.Vector3(x, h, z));
    }
    // su akışının görüleceği yer: tepe zirvesinden aşağı
    const W = 5;
    const pos = [], uv = [], idx = [];
    pts.forEach((p, i) => {
      const y = Math.max(p.y + 0.35, ocean.tide + 0.05);
      pos.push(p.x - W / 2, y, p.z, p.x + W / 2, y, p.z);
      uv.push(0, i / 30, 1, i / 30);
      if (i < pts.length - 1) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true,
      uniforms: { uTime: { value: 0 }, uLight: { value: 1 }, fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 } },
      vertexShader: 'varying vec2 vUv; varying float vFog; void main(){ vUv = uv; vec4 mv = modelViewMatrix*vec4(position,1.0); vFog = -mv.z; gl_Position = projectionMatrix*mv; }',
      fragmentShader: `uniform float uTime, uLight; uniform vec3 fogColor; uniform float fogDensity; varying vec2 vUv; varying float vFog;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
        float n(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
        void main(){
          float streak = n(vec2(vUv.x*14.0, vUv.y*18.0 - uTime*3.5));
          float foam = n(vec2(vUv.x*30.0, vUv.y*40.0 - uTime*6.0));
          vec3 c = mix(vec3(0.35,0.7,0.8), vec3(0.95,0.98,1.0), smoothstep(0.45, 0.9, streak*0.7 + foam*0.4)) * uLight;
          float edge = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x);
          float fog = 1.0 - exp(-fogDensity*fogDensity*vFog*vFog);
          gl_FragColor = vec4(mix(pow(c, vec3(2.2)), fogColor, fog), edge * 0.85);
          #include <colorspace_fragment>
        }`,
    });
    const mesh = new THREE.Mesh(g, mat);
    mesh.renderOrder = 3;
    scene.add(mesh);
    this.fall = { mesh, mat, bottom: pts[pts.length - 1], top: pts[0] };
    // şelalenin dibinde kayalar
    for (let i = 0; i < 5; i++) {
      const r = assets.prop('rock_large', 1.5 + Math.random());
      const b = pts[24 + i];
      r.position.set(b.x + (i % 2 ? 3.5 : -3.5), b.y - 0.3, b.z);
      r.scale.multiplyScalar(2.2);
      scene.add(r);
    }
  },

  // ---- ticaret gemisi ----
  _spawnTrader() {
    const m = port.mooring;
    const dock = { x: m.x - 26, z: m.z - 4, yaw: 0 };
    const ship = new Ship(this.scene, 'brigantine', { id: 'trader_ship', name: 'Altın Martı', look: { hull: '#5a3a24', stripe: '#b8860b', sail: '#f2e8d0', sailStripe: '#b8860b', flag: 'compass' }, x: dock.x - 60, z: dock.z + 420, yaw: Math.PI });
    ship.kinematic = true;
    ship.anchorState = 'up'; ship.anchorT = 0; ship.sail = ship.sailTarget = 1;
    G.ships.push(ship);
    const npc = new Character({ ...defaultAppearance('m'), name: 'Halil Reis', skin: 5, hairStyle: 'kisa', beard: 'uzun', beardColor: 7, hat: 'kaptan', hatColor: '#3a2a1a', coat: 'uzun', coatColor: '#5a2a5a', necklace: 'altin', earring: 'altin', age: 0.7 });
    npc.play('Idle', 0);
    npc.root.visible = false;
    this.scene.add(npc.root);
    this.trader = { ship, npc, dock, phase: 'arriving', start: new THREE.Vector3(ship.x, 0, ship.z) };
    G.notify('⛵ Ufukta altın şeritli bir ticaret gemisi göründü — limana yanaşıyor!', 'event', 5000);
  },
  _removeTrader() {
    const t = this.trader;
    if (!t) return;
    t.ship.dispose();
    G.ships = G.ships.filter((s) => s !== t.ship);
    this.scene.remove(t.npc.root);
    this.trader = null;
  },
  _updateTrader(dt) {
    const sched = time.scheduleFor(time.day).find((e) => e.id === 'ticaret_gemisi');
    const h = sky.hour;
    const want = sched && h >= 10 && h < 17;
    if (want && !this.trader && G.state === 'playing') this._spawnTrader();
    const t = this.trader;
    if (!t) return;
    const s = t.ship;
    if (t.phase === 'arriving') {
      const k = clamp((h - 10) / 1, 0, 1);
      const e = 1 - Math.pow(1 - k, 2);
      s.x = lerp(t.start.x, t.dock.x, e); s.z = lerp(t.start.z, t.dock.z, e);
      s.yaw = Math.atan2(t.dock.x - t.start.x, t.dock.z - t.start.z);
      s.sail = s.sailTarget = k < 0.85 ? 1 : 0;
      s.speed = 6 * (1 - k);
      if (k >= 1) { t.phase = 'docked'; s.sail = s.sailTarget = 0; t.npc.root.visible = true; s.yaw = 0; }
    } else if (t.phase === 'docked') {
      t.npc.root.position.set(port.boardingPoint.x - 8, port.pierTop, port.boardingPoint.z - 0.5);
      t.npc.root.rotation.y = Math.PI;
      t.npc.update(dt);
      s.speed = 0;
      if (h >= 16 || !want) { t.phase = 'leaving'; t.npc.root.visible = false; t.leaveFrom = new THREE.Vector3(s.x, 0, s.z); G.notify('⛵ Ticaret gemisi demir aldı ve yola çıkıyor.', 'info'); }
    } else if (t.phase === 'leaving') {
      const k = clamp((h - 16) / 1, 0, 1);
      const tx = t.dock.x - 380, tz = t.dock.z + 520;
      s.x = lerp(t.leaveFrom.x, tx, k * k); s.z = lerp(t.leaveFrom.z, tz, k * k);
      s.yaw = Math.atan2(tx - t.leaveFrom.x, tz - t.leaveFrom.z);
      s.sail = s.sailTarget = 1; s.speed = 6;
      if (k >= 1 || !want) this._removeTrader();
    }
  },

  update(dt) {
    // yosun ve martı animasyonları
    for (const m of [this.kelpMat, this.gullMat]) if (m.userData.shader) m.userData.shader.uniforms.uTime.value += dt;
    for (const c of this.collectibles) if (c.taken > 0) { c.taken -= dt; if (c.taken <= 0) c.mesh.visible = true; }
    // martılar
    const p = G.player;
    let k = 0;
    const t = performance.now() / 1000;
    for (const f of this.flocks) {
      let cx = f.cx, cz = f.cz;
      if (f.follow) {
        const s = G.ship;
        if (s && !s.sunk && Math.abs(s.speed) > 2) { cx = s.x; cz = s.z; f.vis = damp(f.vis || 0, 1, 0.5, dt); }
        else f.vis = damp(f.vis || 0, 0, 0.5, dt);
        f.cx = damp(f.cx, cx, 2, dt); f.cz = damp(f.cz, cz, 2, dt);
        cx = f.cx; cz = f.cz;
      }
      const night = sky.isNight();
      for (let i = 0; i < f.n && k < 36; i++, k++) {
        const a = t * f.sp * (1 + i * 0.05) + i * 0.7;
        const r = f.r * (0.6 + 0.4 * Math.sin(i * 1.7 + t * 0.1));
        const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
        const y = f.h + Math.sin(t * 0.8 + i) * 3 + Math.max(0, terrain.heightAt(x, z));
        const yaw = Math.atan2(-Math.sin(a), Math.cos(a));
        const vis = (f.follow ? f.vis : 1) * (night || sky.weather.rain > 0.6 ? 0 : 1);
        _q.setFromEuler(_e.set(0, yaw, Math.sin(a * 2) * 0.3));
        _s.setScalar(vis > 0.05 ? 1.2 : 0.0001);
        this.gulls.setMatrixAt(k, _m.compose(_p.set(x, y, z), _q, _s));
      }
    }
    this.gulls.count = k;
    this.gulls.instanceMatrix.needsUpdate = true;
    // şelale
    if (this.fall) {
      const u = this.fall.mat.uniforms;
      u.uTime.value += dt;
      u.uLight.value = 0.35 + 0.65 * sky.lightLevel;
      if (G.scene?.fog) { u.fogColor.value.copy(G.scene.fog.color); u.fogDensity.value = G.scene.fog.density; }
      const b = this.fall.bottom;
      if (p && p.pos.distanceTo(b) < 120 && Math.random() < 0.6) effects.spawn(b.x + (Math.random() - 0.5) * 5, ocean.heightAt(b.x, b.z) + 0.2, b.z - 2 + Math.random() * 3, (Math.random() - 0.5) * 1.5, 1 + Math.random() * 2, (Math.random() - 0.5) * 1.5, 1.4, 0.7, 0.92, 0.96, 1, -2, 0.8, 0.8);
      if (p) G.waterfallNear = Math.max(0, 1 - p.pos.distanceTo(b) / 60);
    }
    // balıkçı tekneleri
    for (const b of this.boats) {
      b.t += dt * b.sp;
      const x = b.cx + Math.cos(b.t) * b.r, z = b.cz + Math.sin(b.t) * b.r * 0.6;
      const yaw = Math.atan2(-Math.sin(b.t) * b.r, Math.cos(b.t) * b.r * 0.6);
      const y = ocean.heightAt(x, z) + 0.05;
      b.mesh.position.set(x, y, z);
      b.mesh.rotation.set(Math.sin(t * 1.3 + b.cx) * 0.05, yaw + Math.PI, Math.sin(t * 1.1) * 0.06);
      b.fisher.update(dt);
    }
    // ticaret gemisi
    this._updateTrader(dt);
    // dümen suyu izleri: gemiler ve kayık
    const list = [...G.ships];
    for (const s of list) {
      if (s.sunk) continue;
      let w = this.wakes.get(s);
      if (!w) { w = new Wake(this.scene); this.wakes.set(s, w); }
      w.update(dt, s.x, s.z, s.yaw, Math.abs(s.speed || 0), s.T.B * 0.45, s.T.L * 0.45);
      // pruva serpintisi
      if (Math.abs(s.speed) > 4 && Math.random() < dt * 8 * (0.5 + ocean.waveScale * 0.5)) {
        const bx = s.x + Math.sin(s.yaw) * s.T.L * 0.5, bz = s.z + Math.cos(s.yaw) * s.T.L * 0.5;
        const side = Math.random() < 0.5 ? 1 : -1;
        effects.spawn(bx + Math.cos(s.yaw) * side * 1.2, ocean.heightAt(bx, bz) + 0.3, bz - Math.sin(s.yaw) * side * 1.2, Math.cos(s.yaw) * side * 2.5 + (s.vx || 0) * 0.6, 2 + Math.random() * 2.5, -Math.sin(s.yaw) * side * 2.5 + (s.vz || 0) * 0.6, 0.9, 0.3, 0.92, 0.97, 1, -9, 0.6, 0.4);
      }
    }
    for (const [s, w] of this.wakes) if (!G.ships.includes(s) || s.sunk) { w.dispose(this.scene); this.wakes.delete(s); }
    const rb = G.rowboat;
    if (rb && rb.state === 'water') {
      if (!this.rbWake) this.rbWake = new Wake(this.scene);
      this.rbWake.update(dt, rb.x, rb.z, rb.yaw, Math.abs(rb.speed || 0) * 1.5, 0.5, 1.8);
    }
    const wm = Wake.material();
    wm.uniforms.uTime.value += dt;
    wm.uniforms.uLight.value = 0.3 + 0.7 * sky.lightLevel;
    if (G.scene?.fog) { wm.uniforms.fogColor.value.copy(G.scene.fog.color); wm.uniforms.fogDensity.value = G.scene.fog.density; }
  },
  menuUpdate(dt) { this.update(dt); },
};
