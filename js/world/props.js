import * as THREE from 'three';
import { assets } from '../core/assets.js';
import { terrain } from './terrain.js';
import { physics } from './physics.js';
import { CORE_ISLANDS as ISLANDS, CORE_DIG_SITES as DIG_SITES, TERRAIN_MODS, CAVE, POIS } from './worldData.js';
import { rng, noise2, smoothstep } from '../core/util.js';
import { stone, woodPlanks } from '../core/textures.js';

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _p = new THREE.Vector3();
const _e = new THREE.Euler();

// Bir GLB modelini birden çok kopya halinde InstancedMesh olarak çizer
function instanced(name, transforms, scene, opts = {}) {
  if (!transforms.length) return [];
  const parts = assets.meshParts(name);
  const meshes = [];
  for (const part of parts) {
    let mat = part.material;
    if (opts.recolor && opts.recolor[mat.name]) {
      mat = mat.clone();
      mat.color.set(opts.recolor[mat.name]);
    }
    if (opts.tint) {
      mat = mat.clone();
      mat.color.multiply(new THREE.Color(opts.tint));
    }
    const im = new THREE.InstancedMesh(part.geometry, mat, transforms.length);
    transforms.forEach((t, i) => {
      _e.set(t.rx || 0, t.yaw || 0, t.rz || 0);
      _q.setFromEuler(_e);
      _s.set(t.s * (t.sx || 1), t.s * (t.sy || 1), t.s * (t.sz || 1));
      _p.set(t.x, t.y, t.z);
      _m.compose(_p, _q, _s);
      im.setMatrixAt(i, _m);
      if (t.color && im.setColorAt) im.setColorAt(i, t.color);
    });
    im.castShadow = opts.shadow !== false;
    im.receiveShadow = true;
    im.computeBoundingSphere();
    scene.add(im);
    meshes.push(im);
  }
  return meshes;
}

// Prosedürel tropik ağaç (gövde + yaprak kümeleri)
function jungleTreeGeometry(seed) {
  const r = rng(seed);
  const geos = [];
  const trunkH = 7 + r() * 5;
  const trunk = new THREE.CylinderGeometry(0.28, 0.55, trunkH, 7, 3);
  trunk.translate(0, trunkH / 2, 0);
  const pa = trunk.attributes.position;
  for (let i = 0; i < pa.count; i++) {
    const y = pa.getY(i);
    pa.setX(i, pa.getX(i) + Math.sin(y * 0.4 + seed) * 0.25);
  }
  colorize(trunk, new THREE.Color(0x6b4a2c));
  geos.push(trunk);
  const blobs = 4 + Math.floor(r() * 3);
  for (let b = 0; b < blobs; b++) {
    const s = 1.8 + r() * 1.6;
    const g = new THREE.IcosahedronGeometry(s, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const k = 1 + (r() - 0.5) * 0.35;
      p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.62, p.getZ(i) * k);
    }
    const a = (b / blobs) * Math.PI * 2 + r();
    const rad = b === 0 ? 0 : 1.6 + r() * 1.2;
    g.translate(Math.cos(a) * rad, trunkH - 0.5 + (b === 0 ? 1.2 : r() * 1.4), Math.sin(a) * rad);
    const c = new THREE.Color().setHSL(0.27 + r() * 0.06, 0.55 + r() * 0.2, 0.22 + r() * 0.12);
    colorize(g, c);
    geos.push(g.toNonIndexed());
  }
  return mergeGeos(geos.map((g) => (g.index ? g.toNonIndexed() : g)));
}

function fernGeometry(seed) {
  const r = rng(seed);
  const geos = [];
  const leaves = 7;
  for (let i = 0; i < leaves; i++) {
    const len = 1.1 + r() * 0.7;
    const g = new THREE.PlaneGeometry(0.42, len, 1, 4);
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const y = p.getY(k) + len / 2;
      const w = Math.sin((y / len) * Math.PI) ;
      p.setX(k, p.getX(k) * w);
      p.setY(k, y);
      p.setZ(k, -Math.pow(y / len, 2) * 0.6);
    }
    g.rotateX(-0.9);
    g.rotateY((i / leaves) * Math.PI * 2 + r() * 0.3);
    colorize(g, new THREE.Color().setHSL(0.28 + r() * 0.05, 0.6, 0.25 + r() * 0.1));
    geos.push(g.toNonIndexed());
  }
  return mergeGeos(geos);
}

function grassGeometry() {
  const geos = [];
  for (let i = 0; i < 6; i++) {
    const g = new THREE.PlaneGeometry(0.08, 0.6, 1, 2);
    g.translate(0, 0.3, 0);
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) if (p.getY(k) > 0.5) p.setX(k, 0);
    g.rotateZ((Math.random() - 0.5) * 0.5);
    g.rotateY((i / 6) * Math.PI);
    g.translate((Math.random() - 0.5) * 0.3, 0, (Math.random() - 0.5) * 0.3);
    colorize(g, new THREE.Color().setHSL(0.25, 0.55, 0.32));
    geos.push(g.toNonIndexed());
  }
  return mergeGeos(geos);
}

export function colorize(geo, color) {
  const n = geo.attributes.position.count;
  const c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { c[i * 3] = color.r; c[i * 3 + 1] = color.g; c[i * 3 + 2] = color.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return geo;
}

export function mergeGeos(geos) {
  let n = 0;
  for (const g of geos) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
  let o = 0;
  for (const g of geos) {
    if (!g.attributes.normal) g.computeVertexNormals();
    pos.set(g.attributes.position.array, o * 3);
    nor.set(g.attributes.normal.array, o * 3);
    if (g.attributes.color) col.set(g.attributes.color.array, o * 3);
    else col.fill(1, o * 3, (o + g.attributes.position.count) * 3);
    o += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.computeBoundingSphere();
  return out;
}

function clearAt(x, z, extraKeep = []) {
  // kasaba, kamp, mağara, kazı noktaları çevresi boş kalsın
  if (Math.hypot(x - 10, z - 222) < 92) return false;
  if (Math.hypot(x + 40, z + 228) < 38) return false;
  if (Math.hypot(x - 205, z + 30) < 18) return false;
  for (const d of DIG_SITES) if (Math.hypot(x - d.x, z - d.z) < 9) return false;
  for (const k of extraKeep) if (Math.hypot(x - k.x, z - k.z) < k.r) return false;
  return true;
}

export const props = {
  windMaterials: [],

  build(scene, quality = 'high') {
    const R = rng(4242);
    const dens = quality === 'low' ? 0.45 : quality === 'medium' ? 0.75 : 1;
    const palms = [], trees = [], ferns = [], bushes = [], rocks = [], rocksTall = [], grass = [], flowers = [], dead = [], stumps = [], mush = [];
    for (const I of ISLANDS) {
      const ghost = I.biome === 'hayalet';
      const count = Math.floor((I.r * I.r) / 8 * dens);
      for (let i = 0; i < count; i++) {
        const a = R() * Math.PI * 2, rr = Math.sqrt(R()) * I.r * 1.2;
        const x = I.x + Math.cos(a) * rr, z = I.z + Math.sin(a) * rr;
        const h = terrain.heightAt(x, z);
        if (h < 0.9) continue;
        if (!clearAt(x, z)) continue;
        const ny = terrain.normalAt(x, z).y;
        const n = noise2(x / 60 + I.seed, z / 60);
        const t = R();
        if (ghost) {
          if (t < 0.03 && ny > 0.8) dead.push({ x, y: h - 0.2, z, s: 0.8 + R() * 0.7, yaw: R() * 6.28 });
          else if (t < 0.05) rocks.push({ x, y: h - 0.2, z, s: 0.8 + R() * 1.8, yaw: R() * 6.28 });
          else if (t < 0.07) stumps.push({ x, y: h, z, s: 0.8 + R() * 0.6, yaw: R() * 6.28 });
          else if (t < 0.09) mush.push({ x, y: h, z, s: 0.5 + R() * 0.5, yaw: R() * 6.28 });
          else if (t < 0.2 && ny > 0.85) grass.push({ x, y: h, z, s: 0.8 + R() * 0.6, yaw: R() * 6.28, color: new THREE.Color().setHSL(0.2, 0.15, 0.3 + R() * 0.1) });
          continue;
        }
        if (h < 3.4) {
          // sahil şeridi: palmiyeler
          if (t < 0.07) palms.push({ x, y: h - 0.1, z, s: 3.8 + R() * 2.2, yaw: R() * 6.28, rx: (R() - 0.5) * 0.25, rz: (R() - 0.5) * 0.25 });
          else if (t < 0.085) rocks.push({ x, y: h - 0.3, z, s: 0.6 + R() * 1.2, yaw: R() * 6.28 });
          continue;
        }
        if (ny < 0.72) {
          if (t < 0.08) rocks.push({ x, y: h - 0.4, z, s: 1 + R() * 2.5, yaw: R() * 6.28 });
          else if (t < 0.09) rocksTall.push({ x, y: h - 0.5, z, s: 2 + R() * 3, yaw: R() * 6.28 });
          continue;
        }
        const jungle = n > -0.15 && h > 5;
        if (jungle) {
          if (t < 0.16) trees.push({ x, y: h - 0.2, z, s: 1.0 + R() * 0.9, yaw: R() * 6.28, color: new THREE.Color().setHSL(0.0, 0, 0.85 + R() * 0.3) });
          else if (t < 0.2) palms.push({ x, y: h - 0.1, z, s: 4.5 + R() * 2.5, yaw: R() * 6.28, rx: (R() - 0.5) * 0.2, rz: (R() - 0.5) * 0.2 });
          else if (t < 0.36) ferns.push({ x, y: h - 0.05, z, s: 0.8 + R() * 0.9, yaw: R() * 6.28 });
          else if (t < 0.44) bushes.push({ x, y: h - 0.1, z, s: 3.0 + R() * 3.5, yaw: R() * 6.28 });
          else if (t < 0.52) grass.push({ x, y: h, z, s: 0.9 + R() * 0.8, yaw: R() * 6.28 });
          else if (t < 0.535) flowers.push({ x, y: h, z, s: 0.5 + R() * 0.4, yaw: R() * 6.28 });
        } else {
          if (t < 0.04) palms.push({ x, y: h - 0.1, z, s: 4.2 + R() * 2.2, yaw: R() * 6.28, rx: (R() - 0.5) * 0.2, rz: (R() - 0.5) * 0.2 });
          else if (t < 0.065) trees.push({ x, y: h - 0.2, z, s: 0.8 + R() * 0.6, yaw: R() * 6.28 });
          else if (t < 0.1) bushes.push({ x, y: h - 0.1, z, s: 2.5 + R() * 3, yaw: R() * 6.28 });
          else if (t < 0.2) grass.push({ x, y: h, z, s: 0.9 + R() * 0.8, yaw: R() * 6.28 });
          else if (t < 0.215) flowers.push({ x, y: h, z, s: 0.5 + R() * 0.4, yaw: R() * 6.28 });
          else if (t < 0.225) rocks.push({ x, y: h - 0.3, z, s: 0.6 + R() * 1.4, yaw: R() * 6.28 });
        }
      }
    }

    // Kazı noktası işaretleri (ipuçlarında anlatılan nesneler gerçekten dünyada)
    for (const site of DIG_SITES) {
      for (const L of site.landmarks) {
        const h = terrain.heightAt(L.x, L.z);
        if (L.type === 'palm') palms.push({ x: L.x, y: h - 0.1, z: L.z, s: 5.2, yaw: (L.x * 13) % 6.28, rx: 0.08, rz: -0.06 });
        else if (L.type === 'bigrock') rocksTall.push({ x: L.x, y: h - 0.6, z: L.z, s: 7, yaw: 0.4 });
        else if (L.type === 'rock') rocks.push({ x: L.x, y: h - 0.2, z: L.z, s: 1.6, yaw: L.x });
        else if (L.type === 'log') this._placeProp(scene, 'log', L.x, h, L.z, 2.2, 0.5);
        else if (L.type === 'column') this._placeProp(scene, 'column_broken', L.x, h - 0.1, L.z, 3.2, L.x * 0.7);
        else if (L.type === 'obelisk') this._placeProp(scene, 'obelisk', L.x, h - 0.2, L.z, 6.5, 0.3);
        else if (L.type === 'campfire') this._placeProp(scene, 'campfire', L.x, h, L.z, 0.8, 0);
        else if (L.type === 'barrel') this._placeProp(scene, 'barrel', L.x, h - 0.4, L.z, 1.1, 0.3, 0.35);
        else if (L.type === 'statue') this._statue(scene, L.x, h, L.z, L.yaw);
        else if (L.type === 'grave') this._grave(scene, L.x, h, L.z, -Math.PI / 2);
        else if (L.type === 'deadtree') dead.push({ x: L.x, y: h - 0.2, z: L.z, s: 1.8, yaw: 0.5 });
      }
    }

    // Çarpıştırıcılar
    for (const p of palms) physics.addCircle(p.x, p.z, 0.32, p.y - 1, p.y + 8, 'palm');
    for (const t of trees) physics.addCircle(t.x, t.z, 0.5 * t.s, t.y - 1, t.y + 10, 'tree');
    for (const r of rocks) if (r.s > 1.2) physics.addCircle(r.x, r.z, 0.45 * r.s, r.y - 1, r.y + r.s * 0.3, 'rock');
    for (const r of rocksTall) physics.addCircle(r.x, r.z, 0.42 * r.s, r.y - 1, r.y + r.s * 1.2, 'rock');
    for (const d of dead) physics.addCircle(d.x, d.z, 0.35 * d.s, d.y - 1, d.y + 6, 'tree');
    this.palms = palms;
    this.trees = trees;

    instanced('tree_palm', palms, scene, { recolor: { leafsGreen: 0x4caf3c, woodBark: 0xb08860 } });
    const tg = jungleTreeGeometry(7);
    const tmat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true });
    this._addWind(tmat, 0.06);
    const tim = new THREE.InstancedMesh(tg, tmat, Math.max(1, trees.length));
    trees.forEach((t, i) => {
      _q.setFromEuler(_e.set(0, t.yaw, 0)); _s.setScalar(t.s); _p.set(t.x, t.y, t.z);
      tim.setMatrixAt(i, _m.compose(_p, _q, _s));
      if (t.color) tim.setColorAt(i, t.color);
    });
    tim.count = trees.length;
    tim.castShadow = true; tim.receiveShadow = true; tim.computeBoundingSphere();
    scene.add(tim);

    const fmat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.85 });
    this._addWind(fmat, 0.12);
    this._inst(scene, fernGeometry(3), fmat, ferns, false);
    const gmat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 1 });
    this._addWind(gmat, 0.18);
    this._inst(scene, grassGeometry(), gmat, grass, false);
    instanced('bush', bushes, scene, { tint: 0x9fd08a });
    instanced('rock_large', rocks, scene);
    instanced('rock_tall', rocksTall, scene);
    instanced('flower_red', flowers, scene, { shadow: false });
    instanced('stump', stumps, scene);
    instanced('mushroom_red', mush, scene, { shadow: false });
    this._deadTrees(scene, dead);

    this._kemikRuins(scene);
    this._camp(scene);
    this._wreck(scene);
  },

  _addWind(mat, amount) {
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = { value: 0 };
      sh.uniforms.uWind = { value: 1 };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime; uniform float uWind;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
        {
          vec4 ip = vec4(0.0);
          #ifdef USE_INSTANCING
          ip = instanceMatrix[3];
          #endif
          float sway = sin(uTime*1.6 + ip.x*0.37 + ip.z*0.21 + position.y*0.4) * ${amount.toFixed(3)} * uWind;
          transformed.x += sway * max(position.y, 0.0);
          transformed.z += sway * 0.6 * max(position.y, 0.0);
        }`);
      mat.userData.shader = sh;
    };
    this.windMaterials.push(mat);
  },

  _inst(scene, geo, mat, list, shadow) {
    if (!list.length) return;
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((t, i) => {
      _q.setFromEuler(_e.set(0, t.yaw, 0)); _s.setScalar(t.s); _p.set(t.x, t.y, t.z);
      im.setMatrixAt(i, _m.compose(_p, _q, _s));
      if (t.color) im.setColorAt(i, t.color);
    });
    im.castShadow = shadow; im.receiveShadow = true; im.computeBoundingSphere();
    scene.add(im);
    return im;
  },

  _placeProp(scene, name, x, y, z, height, yaw, sink = 0) {
    const o = assets.prop(name, height);
    o.position.set(x, y - sink, z);
    o.rotation.y = yaw;
    scene.add(o);
    const b = new THREE.Box3().setFromObject(o);
    const r = Math.max(b.max.x - b.min.x, b.max.z - b.min.z) * 0.42;
    if (name !== 'campfire' && r > 0.3) physics.addCircle(x, z, r, y - 1, y + height, name);
    return o;
  },

  _statue(scene, x, y, z, yaw) {
    // Kırık heykel: kaide + gövde + kırık kol, belirgin bakış yönü (göğüs kalkanı)
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ map: stone('#b8b09c', 9), roughness: 0.95 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 1.6), mat);
    base.position.y = 0.4;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 1.8, 8), mat);
    body.position.y = 1.7;
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.6, 0.55), mat);
    chest.position.set(0, 2.45, 0.04);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 1.1, 6), mat);
    arm.position.set(0.55, 2.35, 0.45); arm.rotation.x = Math.PI / 2.4;
    const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.34, 0), mat);
    head.position.set(-0.9, 0.3, 0.7);
    const plate = new THREE.Mesh(new THREE.CircleGeometry(0.22, 12), new THREE.MeshStandardMaterial({ color: 0x8c7a3a, roughness: 0.6, metalness: 0.3 }));
    plate.position.set(0, 2.45, 0.32);
    g.add(base, body, chest, arm, head, plate);
    g.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
    g.position.set(x, y - 0.1, z);
    g.rotation.y = yaw; // +Z yerel yönü bakış yönü
    scene.add(g);
    physics.addCircle(x, z, 0.9, y - 1, y + 3, 'statue');
  },

  _grave(scene, x, y, z, yaw) {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ map: stone('#9a958c', 12), roughness: 1 });
    const stoneM = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 0.22), mat);
    stoneM.position.y = 0.5;
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.22, 12, 1, false, 0, Math.PI), mat);
    top.rotation.z = Math.PI / 2; top.rotation.y = Math.PI / 2; top.position.y = 1.05;
    const mound = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x6d5a3d, roughness: 1 }));
    mound.scale.set(0.6, 0.25, 1.1); mound.position.set(0, 0, 1.1);
    g.add(stoneM, top, mound);
    g.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
    g.position.set(x, y - 0.05, z);
    g.rotation.y = yaw;
    scene.add(g);
    physics.addBox(x, z, 0.45, 0.2, yaw, y - 1, y + 1.2, 'grave');
    return g;
  },

  _deadTrees(scene, list) {
    if (!list.length) return;
    const geos = [];
    const trunk = new THREE.CylinderGeometry(0.15, 0.4, 5, 6);
    trunk.translate(0, 2.5, 0);
    geos.push(trunk.toNonIndexed());
    for (let i = 0; i < 5; i++) {
      const b = new THREE.CylinderGeometry(0.05, 0.12, 2, 5);
      b.translate(0, 1, 0);
      b.rotateZ(0.6 + (i % 2) * 0.3);
      b.rotateY((i / 5) * Math.PI * 2);
      b.translate(0, 2.4 + i * 0.5, 0);
      geos.push(b.toNonIndexed());
    }
    const geo = mergeGeos(geos.map((g) => colorize(g, new THREE.Color(0x4a4038))));
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true });
    this._inst(scene, geo, mat, list, true);
  },

  _kemikRuins(scene) {
    const cx = -520, cz = -440;
    const R = rng(77);
    const h0 = terrain.heightAt(cx, cz);
    // Taş zemin
    const floor = new THREE.Mesh(new THREE.CylinderGeometry(16, 16.5, 0.6, 24), new THREE.MeshStandardMaterial({ map: stone('#7b7682', 21), roughness: 1 }));
    floor.material.map.repeat.set(6, 6);
    floor.position.set(cx, h0 - 0.18, cz);
    floor.receiveShadow = true;
    scene.add(floor);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const x = cx + Math.cos(a) * 14, z = cz + Math.sin(a) * 14;
      const broken = R() < 0.5;
      this._placeProp(scene, broken ? 'column_broken' : 'column', x, h0, z, broken ? 2.5 + R() * 1.5 : 5.5, a);
    }
    this._placeProp(scene, 'obelisk', cx, h0, cz, 7.5, 0.2);
    // mezarlık
    for (let i = 0; i < 16; i++) {
      const x = cx - 60 + (i % 4) * 4.5 + R() * 1.5, z = cz - 30 + Math.floor(i / 4) * 5 + R();
      const h = terrain.heightAt(x, z);
      if (h > 1) this._grave(scene, x, h, z, R() * 0.4 - 0.2 + Math.PI);
    }
    // dört sütun (kazı ipucu)
  },

  _camp(scene) {
    // Kızıl Hançer kampı: çadırlar, ateş, sandık ve variller, kazık çit
    const cx = -40, cz = -228;
    const h = terrain.heightAt(cx, cz);
    this._placeProp(scene, 'campfire', cx, h, cz, 0.9, 0);
    const tents = [[-9, -6, 0.4], [8, -8, -0.5], [0, 10, 3.1], [-12, 6, 1.6]];
    for (const [dx, dz, yaw] of tents) this._placeProp(scene, 'tent', cx + dx, h, cz + dz, 2.6, yaw);
    for (let i = 0; i < 6; i++) this._placeProp(scene, i % 2 ? 'barrel' : 'crate', cx + 12 + (i % 3) * 1.3, h, cz + 4 + Math.floor(i / 3) * 1.3, 1.0, i);
    // çit kazıkları
    const stakeMat = new THREE.MeshStandardMaterial({ map: woodPlanks('#6b4a2c', 31, 4), roughness: 1 });
    const stakeGeo = new THREE.CylinderGeometry(0.16, 0.2, 2.6, 6);
    const stakes = new THREE.InstancedMesh(stakeGeo, stakeMat, 90);
    let n = 0;
    for (let i = 0; i < 90; i++) {
      const a = (i / 90) * Math.PI * 2;
      if (Math.abs(a - Math.PI * 0.5) < 0.22) continue; // giriş (güney)
      const x = cx + Math.cos(a) * 24, z = cz + Math.sin(a) * 24;
      const y = terrain.heightAt(x, z);
      _q.setFromEuler(_e.set(0, 0, 0)); _s.set(1, 1, 1); _p.set(x, y + 1.0, z);
      stakes.setMatrixAt(n++, _m.compose(_p, _q, _s));
      if (i % 2 === 0) physics.addCircle(x, z, 0.75, y - 1, y + 2.4, 'fence');
    }
    stakes.count = n;
    stakes.castShadow = true;
    scene.add(stakes);
  },

  _wreck(scene) {
    // Martı Batığı: deniz dibinde yan yatmış gövde, kırık direk
    const w = { x: 545, z: 470 };
    const y = terrain.heightAt(w.x, w.z);
    const g = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ map: woodPlanks('#4a3b2c', 41, 10), roughness: 1 });
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(3, 2.2, 16, 12, 1, true, 0, Math.PI), wood);
    hull.material.side = THREE.DoubleSide;
    hull.rotation.z = Math.PI / 2;
    hull.rotation.x = 0.5;
    hull.position.y = 1.2;
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 11, 6), wood);
    mast.rotation.z = 1.2; mast.position.set(4, 1.5, 3);
    g.add(hull, mast);
    for (let i = 0; i < 5; i++) {
      const b = assets.prop(i % 2 ? 'barrel' : 'crate', 1);
      b.position.set(-4 + i * 2, 0.3, 3 + (i % 3));
      b.rotation.set(i, i * 2, 0.4);
      g.add(b);
    }
    g.position.set(w.x, y, w.z);
    g.rotation.y = 0.6;
    g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    scene.add(g);
  },

  update(dt, windStrength) {
    for (const m of this.windMaterials) {
      const sh = m.userData.shader;
      if (sh) { sh.uniforms.uTime.value += dt; sh.uniforms.uWind.value = 0.5 + windStrength * 1.2; }
    }
  },
};
