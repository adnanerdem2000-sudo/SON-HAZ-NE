import * as THREE from 'three';
import { assets } from '../core/assets.js';
import { SKIN_TONES, HAIR_COLORS, EYE_COLORS } from './appearance.js';
import { woodPlanks } from '../core/textures.js';
import { clamp, lerp } from '../core/util.js';
import { rimAll } from '../core/rim.js';
import { kk, KK_ROLES } from '../core/kk.js';
import { Ragdoll } from './ragdoll.js';

const C = (hex) => new THREE.Color(hex);
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o });

function shadowAll(o) {
  o.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
  return o;
}

// ---------- Prosedürel aksesuarlar (model uzayında, metre) ----------
// tüy süsü: kavisli, sivrilen kuş tüyü
function feather(color, len = 0.36) {
  const g = new THREE.Group();
  const m = std(color, { roughness: 0.85, side: THREE.DoubleSide });
  const pts = [];
  for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new THREE.Vector2(Math.sin(t * Math.PI) * 0.045 * (1 - t * 0.35), t * len)); }
  const vane = new THREE.Mesh(new THREE.LatheGeometry(pts, 6), m);
  vane.scale.z = 0.18;
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.005, len, 4), std('#e8e2d0'));
  spine.position.y = len / 2;
  g.add(vane, spine);
  g.rotation.x = -0.25;
  return g;
}
function tricorn(color) {
  const g = new THREE.Group();
  const m = std(color, { roughness: 0.9 });
  const R = 0.25;
  const upAt = (a, r) => Math.pow(Math.max(0, Math.cos(3 * (a - Math.PI / 2))), 2) * 0.1 * (r / R);
  const brim = new THREE.CylinderGeometry(R, R, 0.025, 48, 1);
  const p = brim.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    p.setY(i, p.getY(i) + upAt(Math.atan2(z, x), Math.hypot(x, z)));
  }
  brim.computeVertexNormals();
  const b = new THREE.Mesh(brim, m);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.135, 0.13, 24), m);
  crown.position.y = 0.06;
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 6, 0, Math.PI * 2, 0, Math.PI / 2), m);
  top.scale.y = 0.3; top.position.y = 0.125;
  // kenar boyunca altın sırma
  const gold = std('#c9a227', { metalness: 0.65, roughness: 0.35 });
  const pts = [];
  for (let i = 0; i < 96; i++) { const a = (i / 96) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * R, upAt(a, R), Math.sin(a) * R)); }
  const trim = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 96, 0.008, 5, true), gold);
  // taç bandı, rozet ve tüy
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.137, 0.137, 0.025, 24, 1, true), std('#2a1a10', { roughness: 0.8 }));
  band.position.y = 0.012;
  const cockade = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.012, 14), std('#8a1a1a', { roughness: 0.7 }));
  cockade.rotation.z = Math.PI / 2; cockade.position.set(-0.14, 0.05, 0.04);
  const pin = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), gold);
  pin.position.set(-0.148, 0.05, 0.04);
  const f = feather('#f4efe2', 0.34);
  f.position.set(-0.13, 0.06, 0.0); f.rotation.set(-0.5, 0, 0.55);
  g.add(b, crown, top, trim, band, cockade, pin, f);
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
  const plume = feather('#f2efe6', 0.42);
  plume.position.set(0.08, 0.1, -0.02); plume.rotation.set(-0.7, 0, -0.75);
  const plume2 = feather('#c0392b', 0.3);
  plume2.position.set(0.06, 0.1, -0.04); plume2.rotation.set(-0.9, 0, -0.45);
  const badge = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), gold);
  badge.position.set(0, 0.08, 0.13);
  const trimPts = [];
  for (let i = 0; i < 64; i++) { const a = (i / 64) * Math.PI * 2; const x = Math.cos(a) * 0.27, z = Math.sin(a) * 0.27; trimPts.push(new THREE.Vector3(x, Math.pow(Math.abs(x) / 0.27, 1.5) * 0.15, z * 0.75)); }
  const trim = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(trimPts, true), 64, 0.007, 5, true), gold);
  g.add(new THREE.Mesh(brim, m), crown, band, plume, plume2, badge, trim);
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
  // kavisli korsan palası (cutlass): uca doğru genişleyen ağız, kabuk siper, sargılı kabza
  const g = new THREE.Group();
  const steel = std('#d4d9de', { metalness: 0.9, roughness: 0.22 });
  const gold = std('#c9a227', { metalness: 0.75, roughness: 0.3 });
  const sh = new THREE.Shape();
  sh.moveTo(-0.016, 0.1);
  sh.quadraticCurveTo(-0.026, 0.55, 0.012, 0.9);
  sh.quadraticCurveTo(0.05, 0.62, 0.026, 0.1);
  sh.lineTo(-0.016, 0.1);
  const bladeGeo = new THREE.ExtrudeGeometry(sh, { depth: 0.005, bevelEnabled: true, bevelThickness: 0.0025, bevelSize: 0.003, bevelSegments: 1, curveSegments: 12 });
  bladeGeo.translate(0, 0, -0.0025);
  const blade = new THREE.Mesh(bladeGeo, steel);
  // oluk (kan kanalı)
  const fuller = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.42, 0.009), std('#9aa2aa', { metalness: 0.9, roughness: 0.3 }));
  fuller.position.set(-0.004, 0.36, 0); fuller.rotation.z = 0.03;
  // kabuk siper + el koruması
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2.4), gold);
  shell.scale.set(1, 0.35, 0.75); shell.position.y = 0.085; shell.rotation.x = Math.PI;
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.007, 6, 16, Math.PI), gold);
  bow.position.set(0.02, 0.02, 0); bow.rotation.z = -Math.PI / 2;
  const quillon = new THREE.Mesh(new THREE.CapsuleGeometry(0.009, 0.07, 3, 6), gold);
  quillon.rotation.z = Math.PI / 2; quillon.position.set(-0.04, 0.09, 0);
  // sargılı kabza
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.019, 0.13, 10), std('#3b2516', { roughness: 0.85 }));
  grip.position.y = 0.025;
  for (let i = 0; i < 5; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.019, 0.003, 4, 10), std('#5a3a20', { roughness: 0.8 }));
    r.rotation.x = Math.PI / 2; r.position.y = -0.03 + i * 0.026;
    g.add(r);
  }
  const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 8), gold);
  pommel.position.y = -0.05; pommel.scale.y = 0.8;
  g.add(blade, fuller, shell, bow, quillon, grip, pommel);
  return shadowAll(g);
}
export function makePistol() {
  // çakmaklı tabanca: kavisli ceviz kundak, pirinç kakmalar, horoz ve tetik korkuluğu
  const g = new THREE.Group();
  const wood = std('#6b3a1a', { roughness: 0.55 });
  const brass = std('#c9a227', { metalness: 0.75, roughness: 0.3 });
  const iron = std('#3c3f44', { metalness: 0.85, roughness: 0.35 });
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.019, 0.3, 10), iron);
  barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.068, 0.17);
  const muzzle = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.005, 5, 12), brass);
  muzzle.position.set(0, 0.068, 0.318);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.004, 5, 12), brass);
  band.position.set(0, 0.066, 0.2);
  // kundak profili (Z-Y düzleminde), X yönünde kalınlık
  const s = new THREE.Shape();
  s.moveTo(0.24, 0.06); s.lineTo(0.24, 0.045);
  s.lineTo(0.02, 0.04);
  s.quadraticCurveTo(-0.03, 0.03, -0.075, -0.07);
  s.quadraticCurveTo(-0.085, -0.1, -0.11, -0.095);
  s.quadraticCurveTo(-0.115, -0.06, -0.06, 0.07);
  s.quadraticCurveTo(-0.04, 0.09, 0.0, 0.085);
  s.lineTo(0.24, 0.06);
  const stockGeo = new THREE.ExtrudeGeometry(s, { depth: 0.034, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, curveSegments: 8 });
  stockGeo.rotateY(-Math.PI / 2);
  stockGeo.translate(0.017, 0, 0);
  const stock = new THREE.Mesh(stockGeo, wood);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), brass);
  cap.scale.set(0.85, 0.8, 1); cap.position.set(0, -0.09, -0.105);
  const lock = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.026, 0.07), brass);
  lock.position.set(0.024, 0.06, 0.02);
  const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.045, 0.014), iron);
  hammer.position.set(0.026, 0.09, -0.005); hammer.rotation.x = -0.5;
  const frizzen = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.03, 0.01), iron);
  frizzen.position.set(0.026, 0.085, 0.04);
  const guard = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.004, 5, 12, Math.PI), brass);
  guard.rotation.set(0, Math.PI / 2, Math.PI); guard.position.set(0, 0.028, 0.0);
  const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.022, 0.005), iron);
  trigger.position.set(0, 0.025, -0.005); trigger.rotation.x = 0.3;
  g.add(barrel, muzzle, band, stock, cap, lock, hammer, frizzen, guard, trigger);
  g.userData.muzzle = new THREE.Vector3(0, 0.068, 0.33);
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

// ---------- Karakter (KayKit tabanlı) ----------
// Gövde tipleri: KayKit macera karakterleri. Doğrudan şablon kimliği (ör. iskelet düşmanlar) app.base ile verilebilir.
export const BODY_BASES = { kaba: 'barbarian', subay: 'knight', cevik: 'rogue', kukuleta: 'rogue_hooded', kahin: 'mage' };
export function baseOf(app) {
  if (app.base && kk.templates[app.base]) return app.base;
  return BODY_BASES[app.body] || (app.gender === 'f' ? 'rogue' : 'barbarian');
}
const TARGET_H = 1.8;
// eski (Quaternius) kemik adları → KayKit
const BONE_ALIAS = {
  Head: 'head', Neck: 'head', Chest: 'chest', Torso: 'chest', Abdomen: 'spine', Spine: 'spine', Hips: 'hips',
  UpperArmL: 'upperarml', UpperArmR: 'upperarmr', LowerArmL: 'lowerarml', LowerArmR: 'lowerarmr', WristL: 'wristl', WristR: 'wristr',
  UpperLegL: 'upperlegl', UpperLegR: 'upperlegr', LowerLegL: 'lowerlegl', LowerLegR: 'lowerlegr', FootL: 'footl', FootR: 'footr',
};

function colorsOf(app, id) {
  const roles = KK_ROLES[id];
  if (!roles) return null;
  const hair = C(HAIR_COLORS[app.hairColor] ?? HAIR_COLORS[1]).lerp(C('#c8c8c8'), clamp(((app.age ?? 0.2) - 0.55) * 1.8, 0, 0.85));
  const coat = app.coat === 'uzun' ? app.coatColor : app.shirtColor;
  const c = { skin: SKIN_TONES[app.skin] ?? SKIN_TONES[2], hair: '#' + hair.getHexString(), coat, pants: app.pantsColor, boots: app.bootsColor, leather: app.beltColor };
  if (roles.coatDark) c.coatDark = '#' + C(coat).multiplyScalar(0.72).getHexString();
  if (roles.accent) c.accent = app.coatColor;
  return c;
}

// ---- IK yardımcıları (dünya uzayında) ----
const _A = new THREE.Vector3(), _B = new THREE.Vector3(), _Cc = new THREE.Vector3(), _T = new THREE.Vector3(), _D = new THREE.Vector3(), _P = new THREE.Vector3(), _N = new THREE.Vector3();
const _q = new THREE.Quaternion(), _qw = new THREE.Quaternion(), _qp = new THREE.Quaternion();
function rotateBoneWorld(bone, from, to, w) {
  if (from.lengthSq() < 1e-8 || to.lengthSq() < 1e-8) return;
  _q.setFromUnitVectors(from.normalize(), to.normalize());
  if (w < 1) _q.slerp(_qp.identity(), 1 - w);
  bone.getWorldQuaternion(_qw);
  _qw.premultiply(_q);
  bone.parent.getWorldQuaternion(_qp);
  bone.quaternion.copy(_qp.invert().multiply(_qw));
  bone.updateMatrixWorld(true);
}
// iki kemikli analitik IK: uç (end) hedefe ulaşır, dirsek/diz kutup (pole) yönüne bükülür
function twoBoneIK(upper, lower, end, target, pole, w = 1) {
  upper.getWorldPosition(_A); lower.getWorldPosition(_B); end.getWorldPosition(_Cc);
  const l1 = _A.distanceTo(_B), l2 = _B.distanceTo(_Cc);
  _T.copy(target);
  _D.subVectors(_T, _A);
  const dist = clamp(_D.length(), Math.abs(l1 - l2) + 1e-3, l1 + l2 - 1e-3);
  _D.normalize();
  const cosA = clamp((l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist), -1, 1);
  const sinA = Math.sqrt(1 - cosA * cosA);
  _P.copy(pole).addScaledVector(_D, -pole.dot(_D));
  if (_P.lengthSq() < 1e-6) _P.set(0, 0, 1).addScaledVector(_D, -_D.z);
  _P.normalize();
  const want = _N.copy(_A).addScaledVector(_D, cosA * l1).addScaledVector(_P, sinA * l1);
  rotateBoneWorld(upper, _B.clone().sub(_A), want.clone().sub(_A), w);
  lower.getWorldPosition(_B); end.getWorldPosition(_Cc);
  rotateBoneWorld(lower, _Cc.clone().sub(_B), _T.clone().sub(_B), w);
}

export class Character {
  constructor(appearance, opts = {}) {
    this.root = new THREE.Group();
    this.root.name = 'character';
    this.opts = opts;
    this.held = null;
    this.heldType = null;
    this.overlay = {};
    this.ik = {};
    this.build(appearance);
  }

  build(app) {
    this.app = { ...app };
    if (this.model) { this.mixer?.stopAllAction(); this.root.remove(this.model); }
    const id = baseOf(app);
    this.baseId = id;
    const model = kk.clone(id);
    const info = kk.info[id];
    const s = TARGET_H / info.height;
    this.modelScale = s;
    model.scale.setScalar(s);
    model.position.y = -info.minY * s;
    this.baseY = model.position.y;
    this.model = model;
    this.root.add(model);
    // kemikler (+ eski adlar)
    this.bones = {};
    model.traverse((o) => { if (o.isBone) this.bones[o.name] = o; });
    for (const k in BONE_ALIAS) if (this.bones[BONE_ALIAS[k]]) this.bones[k] = this.bones[BONE_ALIAS[k]];
    // malzemeler ve renkler
    const tex = kk.texture(id, colorsOf(this.app, id));
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
      o.material = o.material.clone();
      if (o.isSkinnedMesh && tex) o.material.map = tex;
      if (/Cape$/.test(o.name) && tex) o.material.map = tex;
      if (/_Hat$|_Helmet$|_Hood$/.test(o.name) && !o.isSkinnedMesh) o.visible = app.hat === 'orijinal';
      if (/_Cape$/.test(o.name)) o.visible = app.cape === 'var';
    });
    this.mixer = new THREE.AnimationMixer(model);
    this.actions = {};
    this.current = null;
    this.currentName = null;
    this.upper = null;
    this.upperName = null;
    this.ragdoll = null;
    this._accessories();
    this._bodyShape();
    rimAll(this.root);
    this.play('Idle', 0);
  }

  has(name) { return !!kk.clip(name); }
  get clips() { return kk.clips; }

  _matsByName() { return []; }

  // Aksesuarlar: KayKit kafasına göre ölçeklenip kemiklere bağlanır
  _accessories() {
    const a = this.app;
    const model = this.model;
    const info = kk.info[this.baseId];
    model.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(model.matrixWorld).invert();
    const B = this.bones;
    const head = B.head, chest = B.chest, hips = B.hips;
    const hp = head.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv);
    const H = info.head;
    const hc = hp.clone().add(H.center); // kafa merkezi (model uzayı)
    const hs = H.size.x / 0.36; // eski aksesuar ölçüsüne oran (kafa genişliği; sakal/kulak payı dahil)
    const top = hp.y + H.top;
    const front = hp.z + H.front;
    const isSkel = /^sk_/.test(this.baseId);
    const attach = (bone, obj, x, y, z, sc = 1) => {
      obj.position.set(x, y, z);
      obj.scale.multiplyScalar(sc);
      model.add(obj);
      obj.updateMatrixWorld(true);
      bone.attach(obj);
      return obj;
    };
    const beardCol = C(HAIR_COLORS[a.beardColor] ?? HAIR_COLORS[1]).lerp(C('#c8c8c8'), clamp(((a.age ?? 0.2) - 0.5) * 1.8, 0, 0.9));
    // şapka
    if (a.hat && a.hat !== 'yok' && a.hat !== 'orijinal') {
      const hat = a.hat === 'tricorn' ? tricorn(a.hatColor) : a.hat === 'kaptan' ? captainHat(a.hatColor) : a.hat === 'korsan' ? pirateHat(a.hatColor) : bandana(a.hatColor);
      const yOff = a.hat === 'bandana' ? H.size.y * 0.2 : a.hat === 'korsan' ? H.size.y * 0.36 : H.size.y * 0.32;
      attach(head, shadowAll(hat), hc.x, hc.y + yOff, hc.z - H.size.z * 0.02, hs * (a.hat === 'bandana' ? 1.22 : 1.08));
    }
    // sakal (yerleşik sakalı olmayan gövdeler için)
    if (!isSkel && a.beard && a.beard !== 'yok' && this.baseId !== 'barbarian') {
      const b = beardMesh(a.beard, '#' + beardCol.getHexString());
      attach(head, shadowAll(b), hc.x, hc.y - H.size.y * 0.16, front - H.size.z * 0.4, hs * 1.35);
    }
    // göz bandı
    if (a.eyepatch && a.eyepatch !== 'yok') {
      const g = new THREE.Group();
      const black = std('#111', { roughness: 0.7 });
      const sgn = a.eyepatch === 'sol' ? 1 : -1;
      const patch = new THREE.Mesh(new THREE.CircleGeometry(0.03, 14), black);
      patch.position.set(sgn * 0.045, 0.0, 0.122);
      const strap = new THREE.Mesh(new THREE.TorusGeometry(0.122, 0.006, 4, 32), black);
      strap.rotation.set(Math.PI / 2 - 0.25 * sgn, 0, 0.35 * sgn);
      g.add(patch, strap);
      attach(head, g, hc.x, hc.y - H.size.y * 0.02, hc.z + (front - hc.z) - 0.122 * hs, hs);
    }
    // yara izi / yüz işaretleri
    if (a.scar && a.scar !== 'yok') {
      const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.012, a.scar === 'alin' ? 0.05 : 0.08), std('#7a2a22', { roughness: 1 }));
      if (a.scar === 'yanak') sc.position.set(-0.06, -0.04, 0.115), sc.rotation.set(0, -0.5, 0.4);
      else if (a.scar === 'goz') sc.position.set(0.042, 0.015, 0.124), sc.rotation.set(0, 0.25, 0.15);
      else sc.position.set(0.02, 0.07, 0.122), sc.rotation.set(-0.3, 0, 1.2);
      const g = new THREE.Group(); g.add(sc);
      attach(head, g, hc.x, hc.y, front - 0.125 * hs, hs);
    }
    if (a.facemark === 'boya') {
      const g = new THREE.Group();
      for (const sgn of [-1, 1]) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.012), std('#1a1a40', { roughness: 1 }));
        m.position.set(sgn * 0.06, -0.02, 0.115); m.rotation.y = sgn * 0.55;
        g.add(m);
      }
      attach(head, g, hc.x, hc.y, front - 0.12 * hs, hs);
    }
    // küpe
    if (a.earring && a.earring !== 'yok') {
      for (const sgn of [1, -1]) {
        const r = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.0035, 4, 12), std(a.earring === 'altin' ? '#d4af37' : '#d0d4d8', { metalness: 0.8, roughness: 0.25 }));
        r.rotation.y = Math.PI / 2;
        attach(head, r, hc.x + sgn * H.size.x * 0.49, hc.y - H.size.y * 0.12, hc.z, hs);
      }
    }
    // kolye
    if (a.necklace && a.necklace !== 'yok') {
      const g = new THREE.Group();
      const gold = std('#d4af37', { metalness: 0.75, roughness: 0.3 });
      const chain = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.006, 4, 24), gold);
      chain.rotation.x = Math.PI / 2 + 0.45;
      g.add(chain);
      const pend = new THREE.Mesh(a.necklace === 'madalyon' ? new THREE.CylinderGeometry(0.032, 0.032, 0.01, 14) : new THREE.SphereGeometry(0.02, 8, 6), a.necklace === 'madalyon' ? std('#b8860b', { metalness: 0.8, roughness: 0.3, emissive: '#3a2a00' }) : std('#c0392b', { roughness: 0.3 }));
      pend.rotation.x = Math.PI / 2; pend.position.set(0, -0.07, 0.08);
      g.add(pend);
      const cp = chest.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv);
      attach(chest, g, cp.x, hp.y - H.size.y * 0.05, cp.z + 0.06 * hs, hs * 1.15);
    }
    // ceket etekleri (uzun korsan ceketi)
    if (a.coat === 'uzun' && !isSkel) {
      const m = std(a.coatColor, { roughness: 0.9, side: THREE.DoubleSide });
      const g = new THREE.Group();
      for (const sgn of [-1, 1]) {
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.02), m);
        tail.position.set(sgn * 0.11, -0.3, -0.13); tail.rotation.set(0.14, 0, sgn * 0.08);
        g.add(tail);
      }
      const hy = hips.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv).y;
      attach(hips, shadowAll(g), 0, hy, 0, H.size.x / 0.42);
    }
    // kın (kalça)
    {
      const hy = hips.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv).y;
      const g = new THREE.Group();
      const sheath = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.62, 0.05), std('#2a1a0a'));
      sheath.position.set(-0.17, -0.2, -0.06); sheath.rotation.set(0.35, 0, 0.18);
      g.add(sheath);
      this.sheath = sheath;
      sheath.visible = !isSkel;
      attach(hips, shadowAll(g), 0, hy, 0, 1 / this.modelScale);
    }
    // el yuvaları (KayKit handslot kemikleri)
    this.handR = B.handslotr || B.wristr;
    this.handL = B.handslotl || B.wristl;
    const back = new THREE.Group();
    const cy = chest.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv).y;
    back.position.set(0, cy + 0.05, -0.25);
    model.add(back); back.updateMatrixWorld(true); chest.attach(back);
    this.back = back;
    if (this.heldType) { const t = this.heldType; this.heldType = null; this.hold(t); }
  }

  _bodyShape() {
    const a = this.app;
    this.root.scale.setScalar(a.height || 1);
    const b = a.build || 1;
    const fs = { oval: [1, 1, 1], genis: [1.07, 0.97, 1.02], ince: [0.94, 1.04, 0.98], koseli: [1.04, 1.0, 1.04] }[a.face] || [1, 1, 1];
    const tz = lerp(1, b, 0.7);
    this.shape = [];
    const add = (name, x, y, z) => {
      const bone = this.bones[name];
      if (bone) this.shape.push({ bone, base: bone.scale.clone(), f: new THREE.Vector3(x, y, z) });
    };
    add('chest', b, 1, tz);
    add('hips', lerp(1, b, 0.5), 1, lerp(1, b, 0.5));
    add('head', fs[0] / b, fs[1], fs[2] / tz);
  }

  // Eldeki eşya: korsan eşyaları (prosedürel) ya da KayKit silahları ("kk:" önekli adlar)
  hold(type) {
    if (this.heldType === type) return;
    if (this.held) { this.held.parent?.remove(this.held); this.held = null; }
    if (this.heldL) { this.heldL.parent?.remove(this.heldL); this.heldL = null; }
    this.heldType = type;
    if (this.sheath) this.sheath.visible = type !== 'sword' && !/^sk_/.test(this.baseId);
    if (!type) return;
    if (type.startsWith('kk:')) {
      const names = type.slice(3).split('+');
      names.forEach((n, i) => {
        const it = kk.item(n) || this._kitItem(n);
        if (!it) return;
        const slot = (it.slot === 'handslotl' || i > 0) ? this.handL : this.handR;
        slot.add(it.obj);
        rimAll(it.obj);
        if (i === 0) this.held = it.obj; else this.heldL = it.obj;
      });
      return;
    }
    let o = null;
    if (type === 'sword') o = makeSword();
    else if (type === 'pistol') o = makePistol();
    else if (type === 'shovel') o = makeShovel();
    else if (type === 'rod') o = makeRod();
    else if (type === 'torch') o = makeTorch();
    if (!o) return;
    // KayKit el yuvası: +Y avuçtan dışarı (bilek doğrultusu), +Z başparmak yönü
    const g = new THREE.Group();
    g.add(o);
    if (type === 'sword') { o.rotation.set(0, 0, 0); o.position.set(0, -0.04, 0); }
    else if (type === 'pistol') { o.rotation.set(-Math.PI / 2, 0, 0); o.position.set(0, 0.0, 0.02); }
    else if (type === 'shovel') { o.rotation.set(0, 0, 0); o.position.set(0, -0.3, 0); }
    else if (type === 'rod') { o.rotation.set(0.25, 0, 0); o.position.set(0, -0.15, 0); }
    else if (type === 'torch') { o.rotation.set(0.35, 0, 0); o.position.set(0, -0.1, 0); }
    g.scale.setScalar(1 / this.modelScale);
    rimAll(g);
    this.handR.add(g);
    this.held = g;
    o.userData && (g.userData = o.userData);
  }
  _kitItem(n) {
    if (!kk.kits.weapons?.[n]) return null;
    const obj = kk.part('weapons', n);
    obj.rotation.set(0, Math.PI, 0); obj.position.set(0, 0.033, 0);
    return { obj, slot: /Shield/.test(n) ? 'handslotl' : 'handslotr' };
  }

  // Temel katman: tam gövde; üst katman etkinken yalnız alt gövde (bacaklar) oynar
  play(name, fade = 0.2, opts = {}) {
    const lower = !!this.upper;
    const clip = lower ? kk.clipPart(name, 'L') : kk.clip(name);
    if (!clip) return null;
    let action = this.actions[clip.name];
    if (!action) action = this.actions[clip.name] = this.mixer.clipAction(clip);
    if (this.current === action && !opts.restart) { if (opts.speed) action.timeScale = opts.speed; return action; }
    action.reset();
    action.enabled = true;
    action.setEffectiveWeight(1);
    action.timeScale = opts.speed || 1;
    if (opts.once) { action.setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true; }
    else action.setLoop(THREE.LoopRepeat, Infinity);
    if (this.current && this.current !== action && fade > 0) action.crossFadeFrom(this.current, fade, false);
    else if (this.current && this.current !== action) this.current.stop();
    action.play();
    this.current = action;
    this.currentName = name;
    this.currentLower = lower;
    return action;
  }

  // Üst gövde katmanı: koşarken saldırı, nişan, blok, el sallama…
  playUpper(name, fade = 0.12, opts = {}) {
    const clip = kk.clipPart(name, 'U');
    if (!clip || this.ragdoll) return null;
    if (!this.upper) this._swapBase('L', fade);
    let a = this.actions[clip.name] || (this.actions[clip.name] = this.mixer.clipAction(clip));
    if (this.upper === a && !opts.restart) { if (opts.speed) a.timeScale = opts.speed; return a; }
    if (this.upper && this.upper !== a) this.upper.fadeOut(fade);
    a.reset();
    a.enabled = true;
    a.timeScale = opts.speed || 1;
    if (opts.once) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; } else a.setLoop(THREE.LoopRepeat, Infinity);
    a.setEffectiveWeight(1);
    a.fadeIn(fade);
    a.play();
    this.upper = a;
    this.upperName = name;
    this.upperOnce = !!opts.once;
    return a;
  }
  stopUpper(fade = 0.18) {
    if (!this.upper) return;
    this.upper.fadeOut(fade);
    this.upper = null;
    this.upperName = null;
    this._swapBase('F', fade);
  }
  // temel katmanı aynı zamanda tam/alt gövde sürümüne geçir (dikişsiz)
  _swapBase(part, fade) {
    const cur = this.current;
    if (!cur || !this.currentName) return;
    const clip = part === 'L' ? kk.clipPart(this.currentName, 'L') : kk.clip(this.currentName);
    if (!clip || clip === cur.getClip()) return;
    const a = this.actions[clip.name] || (this.actions[clip.name] = this.mixer.clipAction(clip));
    a.reset();
    a.enabled = true;
    a.setLoop(cur.loop, cur.repetitions);
    a.clampWhenFinished = cur.clampWhenFinished;
    a.timeScale = cur.timeScale;
    a.time = cur.time;
    a.setEffectiveWeight(1);
    a.play();
    if (part === 'L') cur.fadeOut(fade); // bacaklar aynı kalır, üst yarı yeni katmana devredilir
    else a.crossFadeFrom(cur, fade, false);
    this.current = a;
    this.currentLower = part === 'L';
  }

  setSpeed(s) { if (this.current) this.current.timeScale = s; }

  // Fizik tabanlı düşüş (ölüm, savrulma). opts: { ground(x,z,y), vel, impulse }
  startRagdoll(opts = {}) {
    if (this.ragdoll) { if (opts.impulse) this.ragdoll.push(opts.impulse); return this.ragdoll; }
    if (this.held && opts.dropWeapon !== false) this.held.visible = false;
    // noktalar önce ÖLÜM ANINDAKİ pozdan örneklenir (bind pozuna sıçrama yok), eylemler sonra durdurulur
    const rag = new Ragdoll(this, opts);
    this.mixer.stopAllAction();
    this.current = null;
    this.upper = null; this.upperName = null;
    this.currentName = 'Ragdoll';
    this.ragdoll = rag;
    return this.ragdoll;
  }
  stopRagdoll() {
    if (!this.ragdoll) return;
    this.ragdoll = null;
    if (this.held) this.held.visible = true;
    this.play('Idle', 0, { restart: true });
  }

  // Hayalet görünümü: yarı saydam, ışıyan malzeme
  ghostly(color = 0x8ff0e0, opacity = 0.6) {
    this.ghost = true;
    const c = C(color);
    this.root.traverse((o) => {
      if (!o.isMesh) return;
      const ms = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of ms) {
        m.transparent = true; m.opacity = opacity; m.depthWrite = false;
        m.color.lerp(c, 0.55);
        if (m.emissive) { m.emissive.copy(c).multiplyScalar(0.5); m.emissiveIntensity = 0.7; }
        m.needsUpdate = true;
      }
      o.castShadow = false;
    });
  }
  setOpacity(op) {
    this.root.traverse((o) => { if (o.isMesh) { const ms = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ms) m.opacity = op; } });
  }

  tint(color, emissive = null, opacity = null) {
    this.model.traverse((o) => {
      if (!o.isMesh) return;
      const m = o.material;
      if (color) m.color.multiply(C(color));
      if (emissive) { m.emissive = C(emissive); m.emissiveIntensity = 0.6; }
      if (opacity !== null) { m.transparent = true; m.opacity = opacity; m.depthWrite = false; }
    });
  }

  // karakter uzayındaki bir noktayı dünyaya çevir
  _w(x, y, z, out = new THREE.Vector3()) { return this.root.localToWorld(out.set(x, y, z)); }

  // Animasyondan sonra: gövde şekli, prosedürel pozlar ve IK
  update(dt) {
    if (this.ragdoll) { this.ragdoll.update(dt); this._torch(); return; }
    if (this.shape) for (const sh of this.shape) sh.bone.scale.copy(sh.base);
    if (this.upper && this.upperOnce && !this.upperHold && this.upper.time >= this.upper.getClip().duration - 0.02) this.stopUpper(0.2);
    this.mixer.update(dt);
    if (this.shape) for (const sh of this.shape) sh.bone.scale.multiply(sh.f);
    const o = this.overlay;
    this.model.position.y = this.baseY + (o.lift || 0); // yüzme kaldırması burada uygulanır (her kare sıfırlanmaz)
    const B = this.bones;
    const hasPose = o.carry || o.helm || o.row || o.crouch || o.swim || o.tread || o.climb || o.fish || o.lookPitch || this.ik.handR || this.ik.handL || this.ik.ground;
    if (!hasPose) { this._torch(); return; }
    this.root.updateMatrixWorld(true);
    const sc = (this.app.height || 1);
    const W = (x, y, z) => this._w(x, y * 1, z, new THREE.Vector3());
    const poleL = this.root.localToWorld(new THREE.Vector3(1, -0.4, -0.6)).sub(this.root.getWorldPosition(new THREE.Vector3()));
    const poleR = this.root.localToWorld(new THREE.Vector3(-1, -0.4, -0.6)).sub(this.root.getWorldPosition(new THREE.Vector3()));
    const kneeP = this.root.localToWorld(new THREE.Vector3(0, 0, 1)).sub(this.root.getWorldPosition(new THREE.Vector3()));
    const armL = (t, w = 1) => twoBoneIK(B.upperarml, B.lowerarml, B.wristl, t, poleL, w);
    const armR = (t, w = 1) => twoBoneIK(B.upperarmr, B.lowerarmr, B.wristr, t, poleR, w);
    if (o.crouch) {
      // kalça alçalır, ayaklar yerde kalır (bacak IK)
      const fl = B.footl.getWorldPosition(new THREE.Vector3()), fr = B.footr.getWorldPosition(new THREE.Vector3());
      this.model.position.y = this.baseY - 0.32 / sc;
      this.model.updateMatrixWorld(true);
      twoBoneIK(B.upperlegl, B.lowerlegl, B.footl, fl.add(this.root.localToWorld(new THREE.Vector3(0, 0, 0.12)).sub(this.root.getWorldPosition(new THREE.Vector3()))), kneeP);
      twoBoneIK(B.upperlegr, B.lowerlegr, B.footr, fr.add(this.root.localToWorld(new THREE.Vector3(0, 0, 0.12)).sub(this.root.getWorldPosition(new THREE.Vector3()))), kneeP);
      rotateBoneWorld(B.spine, new THREE.Vector3(0, 1, 0), this.root.localToWorld(new THREE.Vector3(0, 1, 0.35)).sub(this.root.getWorldPosition(new THREE.Vector3())), 0.6);
    }
    if (o.carry) {
      armL(W(0.3, 1.02, 0.42)); armR(W(-0.3, 1.02, 0.42));
    }
    if (o.helm && !this.ik.handR) {
      armL(W(0.24, 1.15, 0.5)); armR(W(-0.24, 1.15, 0.5));
    }
    if (o.row) {
      const t = o.rowPhase || 0;
      const r = Math.sin(t) * 0.22, u = Math.cos(t) * 0.06;
      armL(W(0.26, 0.92 + u, 0.42 + r)); armR(W(-0.26, 0.92 + u, 0.42 + r));
      rotateBoneWorld(B.spine, new THREE.Vector3(0, 1, 0), this.root.localToWorld(new THREE.Vector3(0, 1, 0.3 * Math.sin(t + 0.4))).sub(this.root.getWorldPosition(new THREE.Vector3())), 0.7);
    }
    if (o.swim) {
      const t = o.swimPhase || 0;
      armL(W(0.35 + Math.cos(t) * 0.15, 1.35 + Math.sin(t) * 0.3, 0.55 + Math.cos(t) * 0.25));
      armR(W(-0.35 - Math.cos(t) * 0.15, 1.35 - Math.sin(t) * 0.3, 0.55 - Math.cos(t) * 0.25));
      const k = Math.sin(t * 1.5) * 0.25;
      twoBoneIK(B.upperlegl, B.lowerlegl, B.footl, W(0.12, 0.08, -0.1 + k), kneeP.clone().negate());
      twoBoneIK(B.upperlegr, B.lowerlegr, B.footr, W(-0.12, 0.08, -0.1 - k), kneeP.clone().negate());
    }
    if (o.tread) {
      const t = o.swimPhase || 0;
      armL(W(0.62, 1.1 + Math.sin(t) * 0.08, 0.15 + Math.cos(t) * 0.15));
      armR(W(-0.62, 1.1 - Math.sin(t) * 0.08, 0.15 - Math.cos(t) * 0.15));
      twoBoneIK(B.upperlegl, B.lowerlegl, B.footl, W(0.13, 0.12 + Math.sin(t * 1.3) * 0.1, 0.05), kneeP);
      twoBoneIK(B.upperlegr, B.lowerlegr, B.footr, W(-0.13, 0.12 - Math.sin(t * 1.3) * 0.1, 0.05), kneeP);
    }
    if (o.climb) {
      const t = o.climbPhase || 0;
      armL(W(0.22, 1.85 + Math.sin(t) * 0.18, 0.3)); armR(W(-0.22, 1.85 - Math.sin(t) * 0.18, 0.3));
      twoBoneIK(B.upperlegl, B.lowerlegl, B.footl, W(0.14, 0.35 - Math.sin(t) * 0.18, 0.28), kneeP);
      twoBoneIK(B.upperlegr, B.lowerlegr, B.footr, W(-0.14, 0.35 + Math.sin(t) * 0.18, 0.28), kneeP);
    }
    if (o.fish) {
      armR(W(-0.18, 1.25 + (o.reel || 0) * 0.08, 0.5));
      armL(W(0.05, 1.05, 0.42));
    }
    // dış IK hedefleri (dümen dişleri, sandık kolları vb.)
    if (this.ik.handR) armR(this.ik.handR, this.ik.w ?? 1);
    if (this.ik.handL) armL(this.ik.handL, this.ik.w ?? 1);
    // ayak IK: eğimli zeminde ayaklar yere basar
    if (this.ik.ground && !o.crouch) {
      const fl = B.footl.getWorldPosition(new THREE.Vector3()), fr = B.footr.getWorldPosition(new THREE.Vector3());
      const sole = 0.07;
      const gl = this.ik.ground(fl.x, fl.z) + sole, gr = this.ik.ground(fr.x, fr.z) + sole;
      const root = this.root.getWorldPosition(new THREE.Vector3()).y;
      const dl = gl - fl.y, dr = gr - fr.y;
      const low = Math.min(dl, dr, 0);
      if (low > -0.45 && (Math.abs(dl) > 0.015 || Math.abs(dr) > 0.015)) {
        this.model.position.y = this.baseY + low / (this.root.scale.y * 1);
        this.model.updateMatrixWorld(true);
        const fl2 = B.footl.getWorldPosition(new THREE.Vector3()), fr2 = B.footr.getWorldPosition(new THREE.Vector3());
        if (gl > fl2.y - 0.2) twoBoneIK(B.upperlegl, B.lowerlegl, B.footl, fl2.setY(Math.max(fl2.y, gl)), kneeP, 0.9);
        if (gr > fr2.y - 0.2) twoBoneIK(B.upperlegr, B.lowerlegr, B.footr, fr2.setY(Math.max(fr2.y, gr)), kneeP, 0.9);
      }
      void root;
    }
    if (o.lookPitch) { _q.setFromEuler(new THREE.Euler(o.lookPitch * 0.6, 0, 0)); B.head.quaternion.multiply(_q); }
    this._torch();
  }

  _torch() {
    // sağ eldeki 'torch' eşyası ya da oyuncunun sol el meşalesi (_torchObj) titreşir
    const t = this.held && this.heldType === 'torch' ? this.held : this._torchObj && this._torchObj.visible ? this._torchObj : null;
    if (t) {
      const fl = t.userData.flame;
      if (fl) { fl.scale.y = 0.85 + Math.random() * 0.3; if (t.userData.light) t.userData.light.intensity = 15 + Math.random() * 5; }
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
    rimAll(m);
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
