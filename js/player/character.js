import * as THREE from 'three';
import { assets } from '../core/assets.js';
import { SKIN_TONES, HAIR_COLORS, EYE_COLORS } from './appearance.js';
import { woodPlanks } from '../core/textures.js';
import { clamp, lerp } from '../core/util.js';

const C = (hex) => new THREE.Color(hex);
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o });

function shadowAll(o) {
  o.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
  return o;
}

// ---------- Prosedürel aksesuarlar (model uzayında, metre) ----------
function tricorn(color) {
  const g = new THREE.Group();
  const m = std(color, { roughness: 0.9 });
  const brim = new THREE.CylinderGeometry(0.25, 0.25, 0.025, 36, 1);
  const p = brim.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const a = Math.atan2(z, x);
    const r = Math.hypot(x, z);
    const up = Math.pow(Math.max(0, Math.cos(3 * (a - Math.PI / 2))), 2) * 0.1 * (r / 0.25);
    p.setY(i, p.getY(i) + up);
  }
  brim.computeVertexNormals();
  const b = new THREE.Mesh(brim, m);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.135, 0.13, 20), m);
  crown.position.y = 0.06;
  const trim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.008, 4, 36), std('#c9a227', { metalness: 0.6, roughness: 0.4 }));
  trim.rotation.x = Math.PI / 2;
  g.add(b, crown);
  return g;
}
function captainHat(color) {
  const g = new THREE.Group();
  const m = std(color, { roughness: 0.9 });
  const brim = new THREE.CylinderGeometry(0.27, 0.27, 0.025, 36);
  const p = brim.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    p.setY(i, p.getY(i) + Math.pow(Math.abs(x) / 0.27, 1.5) * 0.15);
    p.setZ(i, z * 0.75);
  }
  brim.computeVertexNormals();
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.135, 0.15, 20), m);
  crown.position.y = 0.07;
  const gold = std('#d4af37', { metalness: 0.7, roughness: 0.35 });
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.012, 6, 24), gold);
  band.rotation.x = Math.PI / 2; band.position.y = 0.02;
  const feather = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.42, 6), std('#f2efe6'));
  feather.position.set(0.1, 0.18, -0.05); feather.rotation.set(0.3, 0, -0.9);
  const badge = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), gold);
  badge.position.set(0, 0.08, 0.13);
  g.add(new THREE.Mesh(brim, m), crown, band, feather, badge);
  return g;
}
function pirateHat(color) {
  // geniş kenarlı, kıvrık korsan şapkası
  const g = new THREE.Group();
  const m = std(color, { roughness: 0.95 });
  const brim = new THREE.CylinderGeometry(0.3, 0.3, 0.02, 36);
  const p = brim.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const r = Math.hypot(x, z) / 0.3;
    p.setY(i, p.getY(i) + (Math.abs(x) > 0.15 ? Math.pow(r, 3) * 0.12 : 0) - (z > 0.1 ? 0.04 * r : 0));
  }
  brim.computeVertexNormals();
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), m);
  crown.scale.set(1, 1.1, 1.05);
  const skull = new THREE.Mesh(new THREE.CircleGeometry(0.035, 12), std('#f2efe6'));
  skull.position.set(0, 0.07, 0.15);
  g.add(new THREE.Mesh(brim, m), crown, skull);
  return g;
}
function bandana(color) {
  const g = new THREE.Group();
  const m = std(color, { roughness: 0.95, side: THREE.DoubleSide });
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.135, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), m);
  cap.scale.set(1.04, 1.0, 1.1);
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), m);
  knot.position.set(0, -0.02, -0.14);
  const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.012), m);
  t1.position.set(0.03, -0.1, -0.15); t1.rotation.set(0.25, 0, -0.2);
  const t2 = t1.clone(); t2.position.x = -0.03; t2.rotation.z = 0.2;
  g.add(cap, knot, t1, t2);
  return g;
}

function hairMesh(style, color) {
  const g = new THREE.Group();
  const m = std(color, { roughness: 0.95 });
  if (style === 'uzun') {
    const back = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.22, 4, 10), m);
    back.scale.set(1.25, 1, 0.55);
    back.position.set(0, -0.12, -0.08);
    g.add(back);
  } else if (style === 'atkuyrugu') {
    const tie = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), m);
    tie.position.set(0, 0.04, -0.13);
    const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.22, 4, 8), m);
    tail.position.set(0, -0.1, -0.16); tail.rotation.x = 0.25;
    g.add(tie, tail);
  } else if (style === 'orgulu') {
    for (const s of [-1, 1]) {
      for (let i = 0; i < 6; i++) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.032 - i * 0.002, 8, 6), m);
        b.position.set(s * 0.1, -0.04 - i * 0.055, -0.06 + i * 0.01);
        g.add(b);
      }
    }
  } else if (style === 'daginik') {
    for (let i = 0; i < 9; i++) {
      const s = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.1, 5), m);
      const a = (i / 9) * Math.PI * 2;
      s.position.set(Math.cos(a) * 0.08, 0.1, Math.sin(a) * 0.08 - 0.02);
      s.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9);
      g.add(s);
    }
  }
  return g;
}

function beardMesh(style, color) {
  const g = new THREE.Group();
  const m = std(color, { roughness: 0.95 });
  if (style === 'uzun') {
    const b = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.24, 10), m);
    b.rotation.x = Math.PI; b.position.set(0, -0.12, 0.09);
    g.add(b);
  } else if (style === 'orgulu') {
    for (let i = 0; i < 5; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.03 - i * 0.003, 8, 6), m);
      s.position.set(0, -0.06 - i * 0.045, 0.1 - i * 0.005);
      g.add(s);
    }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.006, 4, 10), std('#d4af37', { metalness: 0.7, roughness: 0.3 }));
    ring.rotation.x = Math.PI / 2; ring.position.set(0, -0.2, 0.095);
    g.add(ring);
  } else if (style === 'kisa') {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.105, 14, 8, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.4), m);
    b.scale.set(1, 1.05, 1.0); b.position.set(0, -0.0, 0.0);
    g.add(b);
  }
  if (style === 'biyik' || style === 'uzun' || style === 'orgulu') {
    for (const s of [-1, 1]) {
      const mu = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.06, 3, 6), m);
      mu.position.set(s * 0.035, -0.035, 0.115); mu.rotation.z = s * 1.2;
      g.add(mu);
    }
  }
  return g;
}

export function makeSword() {
  const g = new THREE.Group();
  const steel = std('#c8ccd2', { metalness: 0.85, roughness: 0.25 });
  const gold = std('#c9a227', { metalness: 0.7, roughness: 0.35 });
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.75, 0.012), steel);
  blade.position.y = 0.48;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.1, 4), steel);
  tip.position.y = 0.9; tip.scale.z = 0.4;
  const guard = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 5, 12, Math.PI), gold);
  guard.position.y = 0.08; guard.rotation.z = Math.PI;
  const cross = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.025, 0.03), gold);
  cross.position.y = 0.1;
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.13, 8), std('#3b2516'));
  grip.position.y = 0.03;
  const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), gold);
  pommel.position.y = -0.04;
  g.add(blade, tip, guard, cross, grip, pommel);
  return shadowAll(g);
}
export function makePistol() {
  const g = new THREE.Group();
  const wood = std('#5a3418', { roughness: 0.6 });
  const metal = std('#3a3a3a', { metalness: 0.8, roughness: 0.35 });
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.32, 8), metal);
  barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.06, 0.16);
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.22), wood);
  stock.position.set(0, 0.06, 0.04);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.13, 0.05), wood);
  grip.position.set(0, -0.01, -0.06); grip.rotation.x = -0.4;
  const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.04, 0.02), metal);
  hammer.position.set(0, 0.1, -0.02);
  g.add(barrel, stock, grip, hammer);
  g.userData.muzzle = new THREE.Vector3(0, 0.06, 0.33);
  return shadowAll(g);
}
export function makeShovel() {
  const g = new THREE.Group();
  const wood = std('#8a6238');
  const metal = std('#7a7a7a', { metalness: 0.6, roughness: 0.4 });
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.0, 6), wood);
  handle.position.y = 0.3;
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.26, 0.02), metal);
  blade.position.y = 0.9;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.08, 4), metal);
  tip.rotation.y = Math.PI / 4; tip.scale.z = 0.15; tip.position.y = 1.06;
  const t = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.03), wood);
  t.position.y = -0.2;
  g.add(handle, blade, tip, t);
  return shadowAll(g);
}
export function makeRod() {
  const g = new THREE.Group();
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.016, 1.8, 6), std('#6b4a2c'));
  rod.position.y = 0.8;
  const reel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 10), std('#888', { metalness: 0.6 }));
  reel.rotation.z = Math.PI / 2; reel.position.set(0.03, 0.1, 0);
  g.add(rod, reel);
  g.userData.tip = new THREE.Vector3(0, 1.7, 0);
  return shadowAll(g);
}
export function makeTorch() {
  const g = new THREE.Group();
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.5, 6), std('#5a3418'));
  stick.position.y = 0.15;
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.1, 8), std('#2a1a0a'));
  head.position.y = 0.42;
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 8), new THREE.MeshBasicMaterial({ color: 0xffa030 }));
  flame.position.y = 0.53;
  const light = new THREE.PointLight(0xffa050, 18, 16, 1.8);
  light.position.y = 0.6;
  g.add(stick, head, flame, light);
  g.userData.flame = flame;
  g.userData.light = light;
  return g;
}

// ---------- Karakter ----------
const BASE = { m: 'adventurer', f: 'hooded_adventurer' };

export class Character {
  constructor(appearance, opts = {}) {
    this.root = new THREE.Group();
    this.root.name = 'character';
    this.opts = opts;
    this.held = null;
    this.heldType = null;
    this.overlay = {};
    this.build(appearance);
  }

  build(app) {
    this.app = { ...app };
    if (this.model) this.root.remove(this.model);
    const name = BASE[app.gender] || 'adventurer';
    const model = assets.clone(name);
    this.model = model;
    this.root.add(model);
    this.bones = {};
    model.traverse((o) => {
      if (o.isBone) this.bones[o.name] = o;
      if (o.isMesh) {
        o.castShadow = true; o.receiveShadow = true;
        o.frustumCulled = false;
        if (Array.isArray(o.material)) o.material = o.material.map((m) => m.clone());
        else o.material = o.material.clone();
        if (o.name.startsWith('Backpack') || o.name.startsWith('Sword')) o.visible = false;
      }
    });
    this.mixer = new THREE.AnimationMixer(model);
    this.clips = {};
    for (const c of assets.animations(name)) this.clips[c.name.split('|').pop()] = c;
    this.actions = {};
    this.current = null;
    this._applyColors();
    this._accessories();
    this._bodyShape();
    this.play('Idle', 0);
  }

  _matsByName(meshFilter, name) {
    const out = [];
    this.model.traverse((o) => {
      if (!o.isMesh || (meshFilter && !meshFilter(o.name))) return;
      const ms = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of ms) if (m.name === name) out.push(m);
    });
    return out;
  }

  _applyColors() {
    const a = this.app;
    const skin = C(SKIN_TONES[a.skin] || SKIN_TONES[2]);
    let hair = C(HAIR_COLORS[a.hairColor] || HAIR_COLORS[1]);
    // yaş: saçlar kırlaşır
    hair.lerp(C('#c8c8c8'), clamp((a.age - 0.55) * 1.8, 0, 0.85));
    const eye = C(EYE_COLORS[a.eyeColor] || EYE_COLORS[0]);
    const shirt = C(a.coat === 'uzun' ? a.coatColor : a.shirtColor);
    const shirt2 = C(a.coat === 'yelek' ? '#4a2e18' : a.coat === 'uzun' ? a.coatColor : a.shirtColor).multiplyScalar(0.85);
    const pants = C(a.pantsColor), boots = C(a.bootsColor);
    const set = (filter, name, col) => this._matsByName(filter, name).forEach((m) => m.color.copy(col));
    if (a.gender === 'm') {
      set(null, 'Skin', skin);
      set(null, 'Hair', a.hairStyle === 'kel' ? skin.clone().multiplyScalar(0.92) : hair);
      set(null, 'Eyebrows', hair.clone().multiplyScalar(0.8));
      set(null, 'Eye', eye.clone().multiplyScalar(0.6));
      set(null, 'Green', shirt2);
      set(null, 'LightGreen', shirt);
      set((n) => n.startsWith('Adventurer_Legs'), 'Brown2', pants.clone().multiplyScalar(0.85));
      set((n) => n.startsWith('Adventurer_Legs'), 'Brown', pants);
      set(null, 'Black', boots);
      set(null, 'Grey', boots.clone().multiplyScalar(1.4));
    } else {
      const head = (n) => n.startsWith('Medieval_Head');
      const body = (n) => n.startsWith('Medieval_Body');
      set(null, 'Skin', skin);
      set(head, 'White', a.hairStyle === 'kel' ? skin : hair);
      // başlık: saç rengine boyanır (gür saç gibi görünür) ya da bandana
      set(head, 'DarkBrown', a.hairStyle === 'kel' ? skin.clone().multiplyScalar(0.95) : hair.clone().multiplyScalar(0.9));
      set(head, 'Black', hair.clone().multiplyScalar(0.6));
      set(head, 'Brown', eye.clone().multiplyScalar(0.6));
      set(body, 'LightBrown', shirt);
      set(body, 'DarkBrown', shirt2);
      set(body, 'Black', C(a.shirtColor).multiplyScalar(0.5));
      set(body, 'Metal', C(a.coat === 'uzun' ? a.coatColor : '#5a3a20').multiplyScalar(0.9));
      set((n) => n.startsWith('Medieval_Legs'), 'Black', pants);
      set((n) => n.startsWith('Medieval_Feet'), 'LightBrown', boots.clone().multiplyScalar(1.3));
      set((n) => n.startsWith('Medieval_Feet'), 'DarkBrown', boots);
    }
  }

  // Aksesuarları dinlenme pozunda model uzayında konumlandırıp kemiğe bağlar
  _accessories() {
    const a = this.app;
    const model = this.model;
    // dinlenme pozunu kesinleştir
    // (yeni kopyalanmış model zaten dinlenme pozunda; skeleton.pose() ölçekli iskelette bozar)
    model.updateMatrixWorld(true);
    const head = this.bones.Head, chest = this.bones.Chest || this.bones.Torso, hips = this.bones.Hips;
    const headPos = new THREE.Vector3();
    head.getWorldPosition(headPos);
    // root dönüşümünden bağımsız model uzayı
    const inv = new THREE.Matrix4().copy(model.matrixWorld).invert();
    headPos.applyMatrix4(inv);
    const hc = headPos.clone().add(new THREE.Vector3(0, 0.13, 0.0)); // kafa merkezi
    const f = a.gender === 'f' ? 0.96 : 1;
    const attach = (bone, obj, x, y, z) => {
      obj.position.set(x, y, z);
      model.add(obj);
      obj.updateMatrixWorld(true);
      bone.attach(obj);
      return obj;
    };
    const hairCol = C(HAIR_COLORS[a.hairColor] || HAIR_COLORS[1]).lerp(C('#c8c8c8'), clamp((a.age - 0.55) * 1.8, 0, 0.85));
    const beardCol = C(HAIR_COLORS[a.beardColor] ?? HAIR_COLORS[1]).lerp(C('#c8c8c8'), clamp((a.age - 0.5) * 1.8, 0, 0.9));
    // şapka
    if (a.hat !== 'yok') {
      const hat = a.hat === 'tricorn' ? tricorn(a.hatColor) : a.hat === 'kaptan' ? captainHat(a.hatColor) : a.hat === 'korsan' ? pirateHat(a.hatColor) : bandana(a.hatColor);
      const yOff = a.hat === 'bandana' ? 0.0 : 0.08;
      hat.scale.setScalar(f * (a.gender === 'f' && a.hat !== 'bandana' ? 1.08 : 1));
      attach(head, shadowAll(hat), hc.x, hc.y + yOff + (a.gender === 'f' ? 0.025 : 0), hc.z - 0.01);
    }
    // saç
    if (a.hairStyle !== 'kel' && a.hairStyle !== 'kisa') {
      const h = hairMesh(a.hairStyle, '#' + hairCol.getHexString());
      attach(head, shadowAll(h), hc.x, hc.y, hc.z);
    }
    // sakal
    if (a.beard !== 'yok' && a.gender === 'm') {
      const b = beardMesh(a.beard, '#' + beardCol.getHexString());
      attach(head, shadowAll(b), hc.x, hc.y - 0.07, hc.z + 0.0);
    }
    // göz bandı
    if (a.eyepatch !== 'yok') {
      const g = new THREE.Group();
      const black = std('#111', { roughness: 0.7 });
      const s = a.eyepatch === 'sol' ? 1 : -1;
      const patch = new THREE.Mesh(new THREE.CircleGeometry(0.03, 12), black);
      patch.position.set(s * 0.04, 0.01, 0.118);
      const strap = new THREE.Mesh(new THREE.TorusGeometry(0.118, 0.005, 4, 32), black);
      strap.rotation.set(Math.PI / 2 - 0.25 * s, 0, 0.35 * s);
      strap.scale.set(1.0, 1.08, 1);
      g.add(patch, strap);
      attach(head, g, hc.x, hc.y + 0.0, hc.z);
    }
    // yara izi / yüz işaretleri
    if (a.scar !== 'yok') {
      const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.012, a.scar === 'alin' ? 0.05 : 0.08), std('#7a2a22', { roughness: 1 }));
      if (a.scar === 'yanak') sc.position.set(-0.06, -0.04, 0.105), sc.rotation.set(0, -0.5, 0.4);
      else if (a.scar === 'goz') sc.position.set(0.042, 0.015, 0.12), sc.rotation.set(0, 0.25, 0.15);
      else sc.position.set(0.02, 0.08, 0.12), sc.rotation.set(-0.3, 0, 1.2);
      const g = new THREE.Group(); g.add(sc);
      attach(head, g, hc.x, hc.y, hc.z);
    }
    if (a.facemark === 'boya') {
      const g = new THREE.Group();
      for (const s of [-1, 1]) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.012), std('#1a1a40', { roughness: 1 }));
        m.position.set(s * 0.06, -0.02, 0.108); m.rotation.y = s * 0.55;
        g.add(m);
      }
      attach(head, g, hc.x, hc.y, hc.z);
    } else if (a.facemark === 'cil') {
      const g = new THREE.Group();
      const mat = std('#8a5a3a', { roughness: 1 });
      for (let i = 0; i < 10; i++) {
        const s = i % 2 ? 1 : -1;
        const m = new THREE.Mesh(new THREE.CircleGeometry(0.004, 5), mat);
        m.position.set(s * (0.03 + (i % 5) * 0.008), -0.02 + (i % 3) * 0.008, 0.112);
        m.rotation.y = s * 0.4;
        g.add(m);
      }
      attach(head, g, hc.x, hc.y, hc.z);
    }
    // küpe
    if (a.earring !== 'yok') {
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.003, 4, 10), std(a.earring === 'altin' ? '#d4af37' : '#d0d4d8', { metalness: 0.8, roughness: 0.25 }));
      r.rotation.y = Math.PI / 2;
      attach(head, r, hc.x - 0.105 * f, hc.y - 0.04, hc.z - 0.01);
    }
    // burun/çene şekli (küçük ek hacimler)
    if (a.nose !== 'normal') {
      const n = new THREE.Mesh(new THREE.ConeGeometry(a.nose === 'iri' ? 0.022 : 0.016, 0.04, 6), std(SKIN_TONES[a.skin], { roughness: 0.8 }));
      if (a.nose === 'kanca') { n.rotation.x = Math.PI / 2 + 0.5; n.position.set(0, -0.005, 0.135); }
      else if (a.nose === 'kalkik') { n.rotation.x = Math.PI / 2 - 0.5; n.position.set(0, -0.015, 0.13); }
      else { n.rotation.x = Math.PI / 2; n.position.set(0, -0.01, 0.13); n.scale.set(1.3, 1, 1.1); }
      const g = new THREE.Group(); g.add(n);
      attach(head, g, hc.x, hc.y, hc.z);
    }
    // kolye
    if (a.necklace !== 'yok') {
      const g = new THREE.Group();
      const gold = std('#d4af37', { metalness: 0.75, roughness: 0.3 });
      const chain = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.005, 4, 24), gold);
      chain.rotation.x = Math.PI / 2 + 0.5;
      g.add(chain);
      const pend = new THREE.Mesh(a.necklace === 'madalyon' ? new THREE.CylinderGeometry(0.03, 0.03, 0.008, 14) : new THREE.SphereGeometry(0.018, 8, 6), a.necklace === 'madalyon' ? std('#b8860b', { metalness: 0.8, roughness: 0.3, emissive: '#3a2a00' }) : std('#c0392b', { roughness: 0.3 }));
      pend.rotation.x = Math.PI / 2;
      pend.position.set(0, -0.06, 0.07);
      g.add(pend);
      attach(chest, g, hc.x, hc.y - 0.27, hc.z + 0.0);
    }
    // ceket etekleri
    if (a.coat === 'uzun') {
      const m = std(a.coatColor, { roughness: 0.9, side: THREE.DoubleSide });
      const g = new THREE.Group();
      for (const s of [-1, 1]) {
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.55, 0.02), m);
        tail.position.set(s * 0.1, -0.3, -0.1); tail.rotation.set(0.12, 0, s * 0.06);
        g.add(tail);
        const side = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.5, 0.16), m);
        side.position.set(s * 0.17, -0.27, 0.0); side.rotation.z = s * 0.08;
        g.add(side);
      }
      const gold = std('#d4af37', { metalness: 0.7, roughness: 0.3 });
      for (let i = 0; i < 3; i++) {
        const btn = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), gold);
        btn.position.set(0.07, 0.25 - i * 0.09, 0.13);
        g.add(btn);
      }
      attach(hips, shadowAll(g), 0, (this.bones.Hips.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv)).y, 0);
    }
    // kemer / kuşak
    {
      const hipY = this.bones.Hips.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv).y;
      const g = new THREE.Group();
      const belt = new THREE.Mesh(new THREE.TorusGeometry(0.15, a.belt === 'kusak' ? 0.03 : 0.018, 6, 24), std(a.belt === 'kusak' ? a.coatColor : a.beltColor, { roughness: 0.8 }));
      belt.rotation.x = Math.PI / 2; belt.scale.set(1, 0.72, 1);
      g.add(belt);
      if (a.belt === 'kemer') {
        const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.01), std('#c9a227', { metalness: 0.7, roughness: 0.3 }));
        buckle.position.set(0, 0, 0.11);
        g.add(buckle);
      }
      // kın
      const sheath = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.62, 0.05), std('#2a1a0a'));
      sheath.position.set(-0.16, -0.22, -0.04); sheath.rotation.set(0.35, 0, 0.18);
      g.add(sheath);
      this.sheath = sheath;
      attach(hips, shadowAll(g), 0, hipY + 0.06 * (a.gender === 'f' ? 0.8 : 1), 0.0);
    }
    // dövmeler
    if (a.tattoo !== 'yok') {
      const arms = a.tattoo === 'iki' ? ['UpperArmL', 'UpperArmR'] : ['UpperArmR'];
      for (const an of arms) {
        const b = this.bones[an];
        if (!b) continue;
        const bp = b.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv);
        const child = this.bones[an.replace('Upper', 'Lower')];
        const cp = child.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv);
        const mid = bp.clone().lerp(cp, 0.55);
        const band = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.009, 4, 14), std('#1d2f55', { roughness: 0.9 }));
        const dir = cp.clone().sub(bp).normalize();
        band.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
        attach(b, band, mid.x, mid.y, mid.z);
      }
    }
    // eldivenler
    if (a.gloves === 'deri') {
      for (const an of ['WristL', 'WristR']) {
        const b = this.bones[an];
        if (!b) continue;
        const bp = b.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv);
        const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.038, 0.08, 10), std('#4a2e18'));
        const lower = this.bones[an.replace('Wrist', 'LowerArm')].getWorldPosition(new THREE.Vector3()).applyMatrix4(inv);
        cuff.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), bp.clone().sub(lower).normalize());
        attach(b, cuff, bp.x, bp.y, bp.z);
      }
    }
    // el bağlantı noktası (silah/alet)
    const wr = this.bones['WristR'];
    const wp = wr.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv);
    const lr = this.bones['LowerArmR'].getWorldPosition(new THREE.Vector3()).applyMatrix4(inv);
    const handDir = wp.clone().sub(lr).normalize();
    const socket = new THREE.Group();
    socket.name = 'handR';
    // avuç: bileğin biraz ilerisi, yön: önkol doğrultusu = -Y yerel eksen
    socket.position.copy(wp).addScaledVector(handDir, 0.07);
    socket.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), handDir);
    model.add(socket);
    socket.updateMatrixWorld(true);
    wr.attach(socket);
    this.handR = socket;
    const wl = this.bones['WristL'];
    const wlp = wl.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv);
    const ll = this.bones['LowerArmL'].getWorldPosition(new THREE.Vector3()).applyMatrix4(inv);
    const ldir = wlp.clone().sub(ll).normalize();
    const socketL = new THREE.Group();
    socketL.position.copy(wlp).addScaledVector(ldir, 0.07);
    socketL.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), ldir);
    model.add(socketL);
    socketL.updateMatrixWorld(true);
    wl.attach(socketL);
    this.handL = socketL;
    // sırt bağlantısı (kürek/olta taşımak için)
    const back = new THREE.Group();
    back.position.set(0, (chest.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv)).y, -0.16);
    model.add(back); back.updateMatrixWorld(true); chest.attach(back);
    this.back = back;
    if (this.heldType) { const t = this.heldType; this.heldType = null; this.hold(t); }
  }

  _bodyShape() {
    const a = this.app;
    this.root.scale.setScalar(a.height || 1);
    const b = a.build || 1;
    const fs = { oval: [1, 1, 1], genis: [1.08, 0.97, 1.02], ince: [0.93, 1.05, 0.98], koseli: [1.05, 1.0, 1.05] }[a.face] || [1, 1, 1];
    const chin = a.chin === 'sivri' ? 0.98 : a.chin === 'genis' ? 1.04 : 1;
    const tz = lerp(1, b, 0.7);
    // kemik ölçek çarpanları (mixer'dan sonra her karede uygulanır)
    this.shape = [];
    const add = (name, x, y, z) => {
      const bone = this.bones[name];
      if (bone) this.shape.push({ bone, base: bone.scale.clone(), f: new THREE.Vector3(x, y, z) });
    };
    add('Torso', b, 1, tz);
    add('Hips', lerp(1, b, 0.5), 1, lerp(1, b, 0.5));
    add('Head', (fs[0] * chin) / b, fs[1], fs[2] / tz);
  }

  // Eldeki eşya
  hold(type) {
    if (this.heldType === type) return;
    if (this.held) { this.held.parent?.remove(this.held); this.held = null; }
    if (this.backItem) { this.backItem.parent?.remove(this.backItem); this.backItem = null; }
    this.heldType = type;
    if (this.sheath) this.sheath.visible = type !== 'sword';
    let o = null;
    if (type === 'sword') o = makeSword();
    else if (type === 'pistol') o = makePistol();
    else if (type === 'shovel') o = makeShovel();
    else if (type === 'rod') o = makeRod();
    else if (type === 'torch') o = makeTorch();
    if (o) {
      // yerel: el soketi -Y = önkol yönü; eşyalar +Y boyunca uzanır, avuçta kavranır
      if (type === 'sword') { o.rotation.set(Math.PI / 2, 0, 0); o.position.set(0, 0, 0); }
      else if (type === 'pistol') { o.rotation.set(Math.PI / 2, 0, 0); o.position.set(0, 0.0, -0.02); }
      else if (type === 'shovel') { o.rotation.set(Math.PI / 2, 0, 0); o.position.set(0, 0, -0.25); }
      else if (type === 'rod') { o.rotation.set(Math.PI / 2 - 0.3, 0, 0); o.position.set(0, 0, -0.1); }
      else if (type === 'torch') { o.rotation.set(Math.PI / 2 - 0.4, 0, 0); }
      this.handR.add(o);
      this.held = o;
    }
  }

  play(name, fade = 0.2, opts = {}) {
    const clip = this.clips[name];
    if (!clip) return null;
    let action = this.actions[name];
    if (!action) action = this.actions[name] = this.mixer.clipAction(clip);
    if (this.current === action && !opts.restart) { if (opts.speed) action.timeScale = opts.speed; return action; }
    action.reset();
    action.enabled = true;
    action.setEffectiveWeight(1);
    action.timeScale = opts.speed || 1;
    if (opts.once) { action.setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true; }
    else action.setLoop(THREE.LoopRepeat, Infinity);
    if (this.current && fade > 0) action.crossFadeFrom(this.current, fade, false);
    else if (this.current) this.current.stop();
    action.play();
    this.current = action;
    this.currentName = name;
    return action;
  }

  setSpeed(s) { if (this.current) this.current.timeScale = s; }

  // Prosedürel ek pozlar (taşıma, kürek çekme, dümen vb.) — mixer güncellemesinden sonra uygulanır
  update(dt) {
    if (this.shape) for (const sh of this.shape) sh.bone.scale.copy(sh.base);
    this.mixer.update(dt);
    if (this.shape) for (const sh of this.shape) sh.bone.scale.multiply(sh.f);
    const o = this.overlay;
    const B = this.bones;
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const rot = (bone, x, y, z) => {
      if (!bone) return;
      q.setFromEuler(e.set(x, y, z));
      bone.quaternion.multiply(q);
    };
    if (o.carry) {
      // kollar öne uzanır, sandık kavranır
      rot(B['UpperArmL'], -1.1, 0, 0.35);
      rot(B['UpperArmR'], -1.1, 0, -0.35);
      rot(B['LowerArmL'], -0.5, 0, 0);
      rot(B['LowerArmR'], -0.5, 0, 0);
    }
    if (o.helm) {
      rot(B['UpperArmL'], -0.9, 0, 0.25);
      rot(B['UpperArmR'], -0.9, 0, -0.25);
    }
    if (o.row) {
      const t = (o.rowPhase || 0);
      const s = Math.sin(t) * 0.7;
      rot(B['UpperArmL'], -0.8 + s, 0, 0.2);
      rot(B['UpperArmR'], -0.8 + s, 0, -0.2);
      rot(B['Torso'], 0.3 * Math.sin(t + 0.4), 0, 0);
    }
    if (o.crouch) {
      rot(B['UpperLegL'], -0.9, 0, 0);
      rot(B['UpperLegR'], -0.9, 0, 0);
      rot(B['LowerLegL'], 1.4, 0, 0);
      rot(B['LowerLegR'], 1.4, 0, 0);
      rot(B['Torso'], 0.35, 0, 0);
    }
    if (o.air) {
      const k = o.air;
      rot(B['UpperLegL'], -0.7 * k, 0, 0);
      rot(B['UpperLegR'], -0.25 * k, 0, 0);
      rot(B['LowerLegL'], 1.1 * k, 0, 0);
      rot(B['LowerLegR'], 0.5 * k, 0, 0);
      rot(B['UpperArmL'], -0.3 * k, 0, 0.6 * k);
      rot(B['UpperArmR'], -0.3 * k, 0, -0.6 * k);
    }
    if (o.swim) {
      const t = o.swimPhase || 0;
      rot(B['UpperArmL'], -1.6 + Math.sin(t) * 1.2, 0, 0.3);
      rot(B['UpperArmR'], -1.6 - Math.sin(t) * 1.2, 0, -0.3);
      rot(B['UpperLegL'], Math.sin(t * 1.5) * 0.35, 0, 0);
      rot(B['UpperLegR'], -Math.sin(t * 1.5) * 0.35, 0, 0);
      rot(B['Head'], -0.9 * (o.swimLift || 1), 0, 0);
    }
    if (o.tread) {
      const t = o.swimPhase || 0;
      rot(B['UpperArmL'], -0.4, 0, 0.9 + Math.sin(t) * 0.3);
      rot(B['UpperArmR'], -0.4, 0, -0.9 - Math.sin(t) * 0.3);
      rot(B['UpperLegL'], -0.3 + Math.sin(t * 1.3) * 0.3, 0, 0);
      rot(B['UpperLegR'], -0.3 - Math.sin(t * 1.3) * 0.3, 0, 0);
    }
    if (o.climb) {
      const t = o.climbPhase || 0;
      rot(B['UpperArmL'], -2.6 + Math.sin(t) * 0.4, 0, 0.2);
      rot(B['UpperArmR'], -2.6 - Math.sin(t) * 0.4, 0, -0.2);
      rot(B['UpperLegL'], -0.6 + Math.sin(t) * 0.5, 0, 0);
      rot(B['UpperLegR'], -0.6 - Math.sin(t) * 0.5, 0, 0);
      rot(B['LowerLegL'], 0.9, 0, 0);
      rot(B['LowerLegR'], 0.9, 0, 0);
    }
    if (o.fish) {
      rot(B['UpperArmR'], -0.9 + (o.reel || 0) * 0.2, 0, -0.1);
      rot(B['LowerArmR'], -0.6, 0, 0);
      rot(B['UpperArmL'], -0.7, 0, 0.3);
    }
    if (o.lookPitch) rot(B['Neck'], o.lookPitch, 0, 0);
    if (this.held && this.heldType === 'torch') {
      const fl = this.held.userData.flame;
      fl.scale.y = 0.85 + Math.random() * 0.3;
      this.held.userData.light.intensity = 15 + Math.random() * 5;
    }
  }

  dispose() {
    this.root.parent?.remove(this.root);
    this.mixer.stopAllAction();
  }
}

// Genel animasyonlu model (iskelet, korsan NPC, hayalet vb.)
export class Animated {
  constructor(name, height = null) {
    this.root = new THREE.Group();
    const m = assets.clone(name);
    if (height) {
      const b = new THREE.Box3().setFromObject(m);
      m.scale.setScalar(height / (b.max.y - b.min.y));
    }
    m.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
        o.material = Array.isArray(o.material) ? o.material.map((x) => x.clone()) : o.material.clone();
      }
    });
    this.model = m;
    this.root.add(m);
    this.mixer = new THREE.AnimationMixer(m);
    this.clips = {};
    for (const c of assets.animations(name)) {
      const parts = c.name.split('|');
      let n = parts[parts.length - 1];
      const known = c.name.match(/\|(Death|Duck|HitReact|Idle|Jump_Idle|Jump_Land|Jump|No|Punch|Run|Sword|Walk|Wave|Yes)\|/);
      if (known) n = known[1];
      n = n.replace(/^(Skeleton_|Bat_|Frog_)/, '');
      if (!this.clips[n]) this.clips[n] = c;
    }
    this.actions = {};
    this.current = null;
  }
  has(n) { return !!this.clips[n]; }
  play(name, fade = 0.2, opts = {}) {
    const clip = this.clips[name];
    if (!clip) return null;
    let a = this.actions[name] || (this.actions[name] = this.mixer.clipAction(clip));
    if (this.current === a && !opts.restart) return a;
    a.reset();
    a.timeScale = opts.speed || 1;
    if (opts.once) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; } else a.setLoop(THREE.LoopRepeat, Infinity);
    if (this.current && fade > 0) a.crossFadeFrom(this.current, fade, false); else if (this.current) this.current.stop();
    a.play();
    this.current = a;
    this.currentName = name;
    return a;
  }
  tint(color, emissive = null, opacity = null) {
    this.model.traverse((o) => {
      if (!o.isMesh) return;
      const ms = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of ms) {
        if (color) m.color.multiply(new THREE.Color(color));
        if (emissive) { m.emissive = new THREE.Color(emissive); m.emissiveIntensity = 0.6; }
        if (opacity !== null) { m.transparent = true; m.opacity = opacity; m.depthWrite = false; }
      }
    });
  }
  update(dt) { this.mixer.update(dt); }
}
