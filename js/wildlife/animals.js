import * as THREE from 'three';
import { G } from '../game/ctx.js';
import { Animated } from '../player/character.js';
import { combat } from '../game/combat.js';
import { effects } from '../game/effects.js';
import { audio } from '../core/audio.js';
import { terrain } from '../world/terrain.js';
import { physics } from '../world/physics.js';
import { ocean } from '../world/ocean.js';
import { sky } from '../world/sky.js';
import { props } from '../world/props.js';
import { SPAWN_ZONES, CAVE } from '../world/worldData.js';
import { clamp, damp, dampAngle, lerp, rng, uid, wrapAngle } from '../core/util.js';

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, ...o });
const sh = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };

// ---------------- Prosedürel hayvan modelleri ----------------
function boarModel(seed) {
  const r = rng(seed);
  const g = new THREE.Group();
  const fur = std(new THREE.Color().setHSL(0.07, 0.35, 0.18 + r() * 0.06));
  const dark = std(0x231a12);
  const body = sh(new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), fur));
  body.scale.set(0.36, 0.36, 0.66); body.position.y = 0.58;
  const ridge = sh(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 1.0), dark));
  ridge.position.set(0, 0.92, -0.02);
  g.add(body, ridge);
  const head = new THREE.Group();
  head.position.set(0, 0.62, 0.62);
  const skull = sh(new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), fur));
  skull.scale.set(1, 0.95, 1.2);
  const snout = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.34, 10), fur));
  snout.rotation.x = Math.PI / 2 + 0.25; snout.position.set(0, -0.06, 0.28);
  const nose = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 12), std(0x7a4a40)));
  nose.rotation.x = Math.PI / 2 + 0.25; nose.position.set(0, -0.1, 0.45);
  const tuskMat = std(0xf2ead8, { roughness: 0.4 });
  for (const s of [-1, 1]) {
    const t = sh(new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.16, 6), tuskMat));
    t.position.set(s * 0.1, -0.08, 0.36); t.rotation.set(-0.5, 0, s * 0.4);
    const ear = sh(new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 5), fur));
    ear.position.set(s * 0.13, 0.17, -0.02); ear.rotation.z = s * -0.4;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), std(0x0a0a0a));
    eye.position.set(s * 0.1, 0.05, 0.17);
    head.add(t, ear, eye);
  }
  head.add(skull, snout, nose);
  g.add(head);
  const legs = [];
  for (const [x, z] of [[-0.18, 0.4], [0.18, 0.4], [-0.18, -0.4], [0.18, -0.4]]) {
    const leg = new THREE.Group();
    leg.position.set(x, 0.48, z);
    const l = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.45, 6), fur));
    l.position.y = -0.22;
    const hoof = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.06, 6), dark));
    hoof.position.y = -0.46;
    leg.add(l, hoof);
    g.add(leg);
    legs.push(leg);
  }
  const tail = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.22, 4), dark));
  tail.position.set(0, 0.72, -0.68); tail.rotation.x = 0.6;
  g.add(tail);
  return { root: g, head, legs, tail, body };
}

function monkeyModel(seed) {
  const r = rng(seed);
  const g = new THREE.Group();
  const fur = std(new THREE.Color().setHSL(0.08, 0.45, 0.24 + r() * 0.06));
  const face = std(0xc9a07a);
  const torso = new THREE.Group(); torso.position.y = 0.45; g.add(torso);
  const body = sh(new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), fur));
  body.scale.set(1, 1.3, 0.9);
  torso.add(body);
  const head = new THREE.Group(); head.position.set(0, 0.32, 0.04);
  const skull = sh(new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), fur));
  const muzzle = sh(new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 6), face));
  muzzle.scale.set(1.2, 0.9, 0.8); muzzle.position.set(0, -0.03, 0.1);
  for (const s of [-1, 1]) {
    const ear = sh(new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), face));
    ear.scale.z = 0.4; ear.position.set(s * 0.14, 0.02, 0);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 4), std(0x111111));
    eye.position.set(s * 0.045, 0.03, 0.125);
    head.add(ear, eye);
  }
  head.add(skull, muzzle);
  torso.add(head);
  const limbs = [];
  for (const [x, y, z, len] of [[-0.15, 0.12, 0.08, 0.42], [0.15, 0.12, 0.08, 0.42], [-0.1, -0.22, 0, 0.32], [0.1, -0.22, 0, 0.32]]) {
    const L = new THREE.Group(); L.position.set(x, y, z);
    const m = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, len, 6), fur));
    m.position.y = -len / 2;
    L.add(m);
    torso.add(L);
    limbs.push(L);
  }
  const tail = sh(new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.025, 5, 14, Math.PI * 1.4), fur));
  tail.position.set(0, -0.15, -0.25); tail.rotation.y = Math.PI / 2;
  torso.add(tail);
  return { root: g, torso, head, legs: limbs, tail };
}

function crocModel(seed) {
  const g = new THREE.Group();
  const skin = std(0x3f5a2a, { roughness: 0.75 });
  const belly = std(0x9a9a6a);
  const body = sh(new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.28, 1.4), skin));
  body.position.y = 0.22;
  g.add(body);
  for (let i = 0; i < 7; i++) {
    const sc = sh(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.12), std(0x2f4220)));
    sc.position.set(i % 2 ? 0.12 : -0.12, 0.38, -0.6 + i * 0.2);
    g.add(sc);
  }
  const head = new THREE.Group(); head.position.set(0, 0.22, 0.75);
  const upper = sh(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.7), skin));
  upper.position.set(0, 0.04, 0.32);
  const jaw = new THREE.Group();
  const lower = sh(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.66), belly));
  lower.position.set(0, -0.06, 0.32);
  jaw.add(lower);
  const toothMat = std(0xf0f0e0);
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) {
    const t = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.05, 4), toothMat);
    t.position.set(s * 0.15, -0.03, 0.1 + i * 0.1); t.rotation.x = Math.PI;
    head.add(t);
  }
  for (const s of [-1, 1]) {
    const eye = sh(new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), std(0xc8b040, { emissive: 0x302000 })));
    eye.position.set(s * 0.1, 0.13, 0.05);
    head.add(eye);
  }
  head.add(upper, jaw);
  g.add(head);
  const tail = [];
  let parent = g;
  let z = -0.7;
  for (let i = 0; i < 6; i++) {
    const seg = new THREE.Group();
    seg.position.set(0, i === 0 ? 0.2 : 0, i === 0 ? z : -0.32);
    const w = 0.42 - i * 0.065;
    const m = sh(new THREE.Mesh(new THREE.BoxGeometry(w, 0.2 - i * 0.025, 0.34), skin));
    m.position.z = -0.17;
    seg.add(m);
    parent.add(seg);
    tail.push(seg);
    parent = seg;
  }
  const legs = [];
  for (const [x, zz] of [[-0.32, 0.45], [0.32, 0.45], [-0.32, -0.45], [0.32, -0.45]]) {
    const L = new THREE.Group(); L.position.set(x, 0.18, zz);
    const m = sh(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.3), skin));
    m.position.set(x > 0 ? 0.1 : -0.1, -0.08, 0); m.rotation.z = x > 0 ? -0.6 : 0.6;
    L.add(m);
    g.add(L);
    legs.push(L);
  }
  return { root: g, head, jaw, tail, legs };
}

function parrotModel(seed) {
  const r = rng(seed);
  const palettes = [[0xd02a2a, 0x2a5ad0, 0xf0d020], [0x2a7ad0, 0xf0c020, 0x2a9a3a], [0x30b040, 0xd02a2a, 0x2a5ad0], [0xf0d020, 0x2a7ad0, 0xd02a2a]];
  const [c1, c2, c3] = palettes[Math.floor(r() * palettes.length)];
  const g = new THREE.Group();
  const body = sh(new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.16, 4, 8), std(c1)));
  body.rotation.x = Math.PI / 2 - 0.3;
  const head = sh(new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), std(c1)));
  head.position.set(0, 0.06, 0.15);
  const beak = sh(new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.07, 6), std(0x222222)));
  beak.position.set(0, 0.04, 0.22); beak.rotation.x = Math.PI / 2 + 0.6;
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), std(0xf2f2f2));
  face.position.set(0, 0.07, 0.19); face.scale.set(1.3, 0.8, 0.5);
  const tail = sh(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.01, 0.32), std(c2)));
  tail.position.set(0, -0.02, -0.26); tail.rotation.x = 0.2;
  const wings = [];
  for (const s of [-1, 1]) {
    const w = new THREE.Group(); w.position.set(s * 0.06, 0.02, 0.02);
    const m = sh(new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.01, 0.14), std(c2)));
    m.position.x = s * 0.16;
    const tip = sh(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.012, 0.1), std(c3)));
    tip.position.x = s * 0.3;
    w.add(m, tip);
    g.add(w);
    wings.push(w);
  }
  g.add(body, head, beak, face, tail);
  return { root: g, wings, head };
}

function snakeModel(seed) {
  const r = rng(seed);
  const g = new THREE.Group();
  const types = [[0x3a6a2a, 0xd0c040], [0x8a5a2a, 0x2a1a0a], [0xc03030, 0x1a1a1a]];
  const [a, b] = types[Math.floor(r() * types.length)];
  const segs = [];
  const N = 20;
  for (let i = 0; i < N; i++) {
    const rad = 0.06 * (1 - i / N * 0.75) * (i === 0 ? 1.15 : 1);
    const m = sh(new THREE.Mesh(new THREE.SphereGeometry(rad, 8, 6), std(i % 3 === 0 ? b : a)));
    m.scale.z = 1.6;
    g.add(m);
    segs.push(m);
  }
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), std(0xf0e040, { emissive: 0x303000 }));
    e.position.set(s * 0.035, 0.03, 0.05);
    segs[0].add(e);
  }
  return { root: g, segs };
}

// ---------------- Tür tanımları ----------------
export const SPECIES = {
  boar: { name: 'Yaban Domuzu', hp: 70, speed: 2.2, run: 7, aggro: 'cornered', dmg: 14, flee: 12, loot: [['hayvan_postu', 1]], desc: 'Ormanda yiyecek arar; köşeye sıkışırsa saldırır, sürü halinde dolaşır.' },
  monkey: { name: 'Maymun', hp: 35, speed: 2.5, run: 6.5, aggro: 'never', dmg: 0, flee: 6, curious: true, desc: 'Meraklı ve hırsız; yiyeceklerini çalabilir, uzaktan seni izler.' },
  croc: { name: 'Timsah', hp: 150, speed: 1.4, run: 5.5, aggro: 'territory', dmg: 26, flee: 0, loot: [['timsah_derisi', 1]], desc: 'Lagünde pusu kurar; suyun altında saklanıp ani saldırır.' },
  parrot: { name: 'Papağan', hp: 8, speed: 6, run: 9, aggro: 'never', flee: 10, fly: true, desc: 'Renkli tropik kuş; palmiyelere tüner, yaklaşınca uçar.' },
  snake: { name: 'Zehirli Yılan', hp: 22, speed: 1.2, run: 2.5, aggro: 'close', dmg: 8, poison: 8, flee: 0, desc: 'Otların arasında saklanır, fazla yaklaşanı ısırır ve zehirler.' },
  crab: { name: 'Yengeç', hp: 15, speed: 1.6, run: 3.5, aggro: 'never', flee: 4, glb: 'crab', scale: 0.45, desc: 'Sahillerde yan yan yürüyen küçük yengeçler.' },
  frog: { name: 'Lagün Kurbağası', hp: 6, speed: 1, run: 3, aggro: 'never', flee: 3, glb: 'frog', scale: 0.32, desc: 'Lagün kıyısında zıplar, geceleri vıraklar.' },
  bat: { name: 'Mağara Yarasası', hp: 10, speed: 5, run: 8, aggro: 'never', flee: 5, glb: 'bat', scale: 0.6, fly: true, desc: 'Yankı Mağarası\'nın karanlığında sürüler halinde uçar.' },
};

let _id = 0;
class Animal {
  constructor(scene, kind, x, z, zone, seed) {
    this.id = 'an' + (_id++);
    this.kind = kind;
    this.S = SPECIES[kind];
    this.scene = scene;
    this.zone = zone;
    this.home = new THREE.Vector3(x, 0, z);
    this.pos = new THREE.Vector3(x, terrain.heightAt(x, z), z);
    this.yaw = Math.random() * 6.28;
    this.hp = this.S.hp;
    this.alive = true;
    this.state = 'wander';
    this.t = 0; this.stateT = 0;
    this.phase = Math.random() * 10;
    this.speed = 0;
    this.radius = kind === 'croc' ? 0.6 : kind === 'boar' ? 0.45 : 0.25;
    this.height = kind === 'croc' ? 0.5 : kind === 'boar' ? 0.9 : 0.4;
    this.bloodColor = [0.6, 0.05, 0.05];
    if (this.S.glb) {
      this.anim = new Animated(this.S.glb, null);
      this.anim.model.scale.multiplyScalar(this.S.scale);
      this.root = this.anim.root;
      this.anim.play(kind === 'bat' ? 'Flying' : 'Idle', 0);
    } else {
      this.m = kind === 'boar' ? boarModel(seed) : kind === 'monkey' ? monkeyModel(seed) : kind === 'croc' ? crocModel(seed) : kind === 'parrot' ? parrotModel(seed) : snakeModel(seed);
      this.root = this.m.root;
      if (kind === 'croc') this.root.scale.setScalar(1.25);
    }
    if (kind === 'parrot' || kind === 'bat') { this.pos.y += 6; this.flyH = kind === 'bat' ? CAVE.floor + 2.5 : 8 + Math.random() * 6; }
    if (kind === 'snake') this.trail = Array.from({ length: 20 }, () => this.pos.clone());
    scene.add(this.root);
    combat.addTarget(this);
  }

  hurt(dmg, info = {}) {
    if (!this.alive) return;
    if (G.online && !G.isHost) { G.emit('netHurtAnimal', { id: this.id, dmg }); return; }
    this.applyDamage(dmg, info);
  }
  applyDamage(dmg, info) {
    this.hp -= dmg;
    if (info && info.pos) {
      const dx = this.pos.x - info.pos.x, dz = this.pos.z - info.pos.z;
      const d = Math.hypot(dx, dz) || 1;
      const k = Math.min(6, 1 + dmg * 0.08) / (this.kind === 'croc' ? 3 : 1);
      this.pos.x += (dx / d) * k * 0.15; this.pos.z += (dz / d) * k * 0.15;
      this.speed = -k * 0.3;
    }
    effects.blood(this.pos.x, this.pos.y + this.height * 0.6, this.pos.z);
    if (this.hp <= 0) { this.die(info); return; }
    this.hurtT = 0.3;
    const S = this.S;
    if (S.aggro === 'cornered' || S.aggro === 'territory' || S.aggro === 'close') { this.state = 'attack'; this.stateT = 0; }
    else { this.state = 'flee'; this.stateT = 0; }
    audio.tone(this.kind === 'boar' ? 180 : 600, 0.2, 'sawtooth', 0.06, null, 0.6);
  }
  die(info) {
    this.alive = false;
    this.state = 'dead';
    this.stateT = 0;
    combat.removeTarget(this);
    if (this.S.loot) G.emit('loot', { pos: this.pos.clone(), table: this.S.loot, from: this.S.name });
    G.emit('animalKilled', { kind: this.kind });
  }

  nearestPlayer() {
    let best = null, bd = 1e9;
    const check = (p, id) => { if (!p || p.dead) return; const d = p.pos.distanceTo(this.pos); if (d < bd) { bd = d; best = { p, id, d }; } };
    check(G.player, G.myId);
    for (const [id, r] of G.remotes) check(r, id);
    return best;
  }

  update(dt) {
    this.t += dt; this.stateT += dt;
    if (this.hurtT > 0) this.hurtT -= dt;
    if (this.state === 'dead') { this._deadPose(dt); return; }
    const np = this.nearestPlayer();
    const S = this.S;
    const night = sky.isNight();
    let target = null, sp = 0;
    const pd = np ? np.d : 1e9;
    // gözlem kaydı
    if (np && np.id === G.myId && pd < 18) G.emit('seeAnimal', this.kind);
    switch (this.state) {
      case 'wander': {
        if (!this.wp || this.pos.distanceTo(this.wp) < 1 || this.stateT > 12) {
          const a = Math.random() * 6.28, r = Math.random() * (this.zone?.r || 20) * 0.8;
          this.wp = new THREE.Vector3(this.home.x + Math.cos(a) * r, 0, this.home.z + Math.sin(a) * r);
          this.wp.y = this.pos.y;
          this.stateT = 0;
          if (Math.random() < 0.35 && !S.fly) { this.state = night ? 'sleep' : (Math.random() < 0.5 ? 'eat' : 'rest'); this.stateT = 0; }
        }
        target = this.wp; sp = S.speed;
        break;
      }
      case 'eat': case 'rest': case 'sleep':
        if (this.stateT > (this.state === 'sleep' ? 30 : 6 + Math.random() * 4)) { this.state = 'wander'; this.stateT = 0; }
        break;
      case 'flee': {
        if (np) {
          const away = this.pos.clone().sub(np.p.pos).setY(0).normalize().multiplyScalar(10).add(this.pos);
          target = away; sp = S.run;
        }
        if (this.stateT > 4 && pd > S.flee + 8) { this.state = 'wander'; this.stateT = 0; }
        break;
      }
      case 'attack': {
        if (!np || pd > 22 || np.p.mode !== 'ground' && this.kind !== 'croc') { this.state = 'wander'; break; }
        target = np.p.pos; sp = S.run;
        this.atkCd = (this.atkCd || 0) - dt;
        if (pd < this.radius + 1.0 && this.atkCd <= 0) {
          this.atkCd = this.kind === 'croc' ? 2.2 : 1.4;
          this.bite = 0.35;
          const dmg = S.dmg;
          if (np.id === G.myId) G.player.hurt(dmg, this.pos, { cause: S.name + ' saldırısı', poison: S.poison });
          else G.emit('netHurtPlayer', { id: np.id, dmg, from: [this.pos.x, this.pos.y, this.pos.z], cause: S.name });
          audio.play('hit', { pos: this.pos, vol: 0.6, rate: 0.6 });
          combat.markCombat();
          if (this.kind === 'boar' && Math.random() < 0.4) { this.state = 'flee'; this.stateT = 0; }
        }
        if (this.kind === 'snake' && this.stateT > 3) { this.state = 'wander'; this.stateT = 0; }
        break;
      }
      case 'ambush': {
        // timsah: suda bekler
        if (np && pd < 7 && np.p.mode !== 'deck') { this.state = 'attack'; this.stateT = 0; audio.splash(0.5); effects.splash(this.pos.x, this.pos.z, 1.2); }
        if (this.stateT > 20) { this.state = 'wander'; this.stateT = 0; }
        break;
      }
    }
    // tepkiler
    if (np && this.state !== 'attack' && this.state !== 'flee') {
      if (S.aggro === 'never' && pd < S.flee && !(S.curious && pd > 4)) { this.state = 'flee'; this.stateT = 0; }
      if (S.aggro === 'close' && pd < 2.2) { this.state = 'attack'; this.stateT = 0; audio.tone(1200, 0.4, 'sawtooth', 0.03, null, 0.6); G.notify('Bir yılan tısladı!', 'warn', 1500); }
      if (S.aggro === 'cornered' && pd < 2.2 && np.p.sprinting) { this.state = 'attack'; this.stateT = 0; }
      if (S.aggro === 'cornered' && pd < 6 && this.state !== 'attack' && Math.random() < dt * 0.3) { this.state = 'flee'; this.stateT = 0; }
      if (S.aggro === 'territory' && this.state === 'wander' && Math.random() < dt * 0.2 && this._inWater()) { this.state = 'ambush'; this.stateT = 0; }
      if (S.aggro === 'territory' && pd < 4) { this.state = 'attack'; this.stateT = 0; }
      // maymun: merak + muz hırsızlığı
      if (S.curious && pd < 14 && pd > 3 && this.state === 'wander') { target = np.p.pos; sp = S.speed; this.yaw = dampAngle(this.yaw, Math.atan2(np.p.pos.x - this.pos.x, np.p.pos.z - this.pos.z), 4, dt); }
      if (S.curious && pd < 2 && np.id === G.myId && G.player.inv.has('muz') && !this.stole) {
        G.player.inv.remove('muz', 1);
        this.stole = true;
        G.notify('Bir maymun muzunu kaptı ve kaçtı!', 'warn');
        audio.tone(900, 0.3, 'square', 0.04, null, 1.6);
        this.state = 'flee'; this.stateT = 0;
      }
    }
    // hareket
    if (S.fly) this._fly(dt, np);
    else if (target) this._walk(dt, target, sp);
    else this.speed = damp(this.speed, 0, 6, dt);
    this._pose(dt);
  }

  _inWater() { return terrain.heightAt(this.pos.x, this.pos.z) < -0.6; }

  _walk(dt, target, sp) {
    const dx = target.x - this.pos.x, dz = target.z - this.pos.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.3) { this.speed = damp(this.speed, 0, 6, dt); return; }
    this.yaw = dampAngle(this.yaw, Math.atan2(dx, dz), 5, dt);
    this.speed = damp(this.speed, sp, 4, dt);
    const nx = this.pos.x + Math.sin(this.yaw) * this.speed * dt;
    const nz = this.pos.z + Math.cos(this.yaw) * this.speed * dt;
    const h = terrain.heightAt(nx, nz);
    const water = this.kind === 'croc' || this.kind === 'frog';
    if ((h > 0.35 || water && h > -4) && (this.kind !== 'crab' || h < 3.5)) { this.pos.x = nx; this.pos.z = nz; }
    else { this.wp = null; this.yaw += 1.5; }
    physics.resolve(this.pos, this.radius, this.pos.y);
  }

  _fly(dt, np) {
    // daire çizerek uçuş, palmiyeye tünemek
    if (this.kind === 'bat') {
      const ch = CAVE.chamber;
      const a = this.t * 0.9 + this.phase;
      const r = 4 + Math.sin(this.t * 0.4 + this.phase) * 2.5;
      const tx = ch.x + Math.cos(a) * r, tz = ch.z + Math.sin(a) * r;
      const ty = CAVE.floor + 2.5 + Math.sin(this.t * 1.3 + this.phase) * 0.8;
      const fl = np && np.d < 4 ? 2 : 1;
      this.pos.x = damp(this.pos.x, tx, 2 * fl, dt); this.pos.z = damp(this.pos.z, tz, 2 * fl, dt); this.pos.y = damp(this.pos.y, ty, 2, dt);
      this.yaw = a + Math.PI / 2;
      return;
    }
    if (this.state === 'perch') {
      if (np && np.d < 9 || this.stateT > 25) { this.state = 'wander'; this.stateT = 0; audio.tone(1800, 0.15, 'square', 0.03, null, 1.4); }
      return;
    }
    if (!this.wp || this.pos.distanceTo(this.wp) < 2 || this.stateT > 15) {
      const zr = this.zone?.r || 40;
      if (Math.random() < 0.35 && props.palms?.length) {
        // yakındaki bir palmiyeye tüne
        let best = null, bd = 1e9;
        for (let i = 0; i < 40; i++) {
          const p = props.palms[Math.floor(Math.random() * props.palms.length)];
          const d = Math.hypot(p.x - this.home.x, p.z - this.home.z);
          if (d < zr && d < bd) { bd = d; best = p; }
        }
        if (best) { this.wp = new THREE.Vector3(best.x, best.y + best.s * 1.25, best.z); this.perchTarget = true; }
      } else {
        const a = Math.random() * 6.28, r = Math.random() * zr;
        this.wp = new THREE.Vector3(this.home.x + Math.cos(a) * r, 0, this.home.z + Math.sin(a) * r);
        this.wp.y = Math.max(terrain.heightAt(this.wp.x, this.wp.z), 0) + 6 + Math.random() * 10;
        this.perchTarget = false;
      }
      this.stateT = 0;
    }
    const dir = this.wp.clone().sub(this.pos);
    const d = dir.length();
    dir.normalize();
    const sp = this.state === 'flee' ? this.S.run : this.S.speed;
    this.pos.addScaledVector(dir, Math.min(d, sp * dt));
    this.yaw = dampAngle(this.yaw, Math.atan2(dir.x, dir.z), 3, dt);
    const ground = terrain.heightAt(this.pos.x, this.pos.z);
    if (this.pos.y < ground + 1.5 && !this.perchTarget) this.pos.y = ground + 1.5;
    if (this.perchTarget && d < 0.5) { this.state = 'perch'; this.stateT = 0; }
  }

  _pose(dt) {
    const k = this.kind;
    const sp = this.speed;
    this.phase += dt * (2 + sp * 2.2);
    const ph = this.phase;
    // zemin
    if (!this.S.fly) {
      let gy = physics.groundAt(this.pos.x, this.pos.z, this.pos.y + 1);
      if (k === 'croc' && gy < -0.3) {
        const wy = ocean.heightAt(this.pos.x, this.pos.z);
        gy = this.state === 'ambush' ? wy - 0.32 : Math.max(gy, wy - 0.25);
      }
      this.pos.y = gy;
    }
    this.root.position.copy(this.pos);
    this.root.rotation.y = this.yaw;
    if (this.anim) {
      this.anim.update(dt * (k === 'crab' ? 1.5 : 1));
      if (k === 'crab') { this.anim.play(sp > 0.3 ? 'Walk' : 'Idle', 0.2, { speed: 1.5 }); this.root.rotation.y = this.yaw + Math.PI / 2; }
      if (k === 'frog' && sp > 0.3 && this.anim.currentName !== 'Jump') this.anim.play('Jump', 0.1);
      else if (k === 'frog' && sp <= 0.3 && this.anim.currentName !== 'Idle') this.anim.play('Idle', 0.2);
      return;
    }
    const m = this.m;
    if (k === 'boar' || k === 'monkey') {
      const amp = clamp(sp / 4, 0, 0.9);
      m.legs.forEach((L, i) => { L.rotation.x = Math.sin(ph + (i === 0 || i === 3 ? 0 : Math.PI)) * amp * (k === 'monkey' && i < 2 ? 1.2 : 1); });
      if (k === 'boar') {
        m.body.position.y = 0.58 + Math.abs(Math.sin(ph)) * 0.03 * amp;
        const eat = this.state === 'eat' ? 0.5 + Math.sin(this.t * 4) * 0.1 : 0;
        m.head.rotation.x = damp(m.head.rotation.x, eat + (this.bite > 0 ? -0.4 : 0), 6, dt);
        m.tail.rotation.z = Math.sin(this.t * 6) * 0.4;
        if (this.state === 'sleep') { this.root.rotation.z = 1.3; this.root.position.y += 0.2; }
      } else {
        const sit = sp < 0.3 ? 1 : 0;
        m.torso.rotation.x = damp(m.torso.rotation.x, sit ? 0 : 1.1, 5, dt);
        m.torso.position.y = damp(m.torso.position.y, sit ? 0.35 : 0.4, 5, dt);
        m.head.rotation.x = sit ? Math.sin(this.t * 2) * 0.2 : -0.9;
        m.tail.rotation.x = Math.sin(this.t * 3) * 0.3;
        if (sit) m.legs[0].rotation.x = -1.5 + Math.sin(this.t * 7) * 0.3 * (this.state === 'rest' ? 1 : 0);
      }
    } else if (k === 'croc') {
      m.tail.forEach((s, i) => { s.rotation.y = Math.sin(this.t * (sp > 0.5 ? 6 : 1.5) - i * 0.6) * (0.08 + i * 0.03) * (sp > 0.5 ? 1.5 : 0.6); });
      m.legs.forEach((L, i) => { L.rotation.y = Math.sin(ph + i) * clamp(sp / 3, 0, 0.6); });
      if (this.bite > 0) { this.bite -= dt; m.jaw.rotation.x = Math.sin((0.35 - this.bite) / 0.35 * Math.PI) * 0.6; }
      else m.jaw.rotation.x = this.state === 'attack' ? 0.25 : 0.02;
    } else if (k === 'parrot') {
      const flying = this.state !== 'perch';
      m.wings.forEach((w, i) => { w.rotation.z = flying ? Math.sin(this.t * 18 + this.phase) * 0.9 * (i ? -1 : 1) : (i ? -0.1 : 0.1); });
      m.head.rotation.y = flying ? 0 : Math.sin(this.t * 1.5) * 0.6;
      this.root.rotation.x = flying ? -0.1 : 0;
    } else if (k === 'snake') {
      // izi takip eden gövde
      const tr = this.trail;
      const head = this.pos.clone();
      head.y += 0.06;
      if (tr[0].distanceTo(head) > 0.07) { tr.pop(); tr.unshift(head); }
      const coil = this.speed < 0.2;
      m.segs.forEach((s, i) => {
        let p;
        if (coil && this.state !== 'attack') {
          const a = i * 0.55, r = 0.08 + i * 0.012;
          p = new THREE.Vector3(this.pos.x + Math.cos(a) * r, this.pos.y + 0.06 + (i < 4 ? (4 - i) * 0.03 : 0), this.pos.z + Math.sin(a) * r);
        } else {
          p = tr[Math.min(tr.length - 1, i)].clone();
          const lat = Math.sin(this.t * 8 - i * 0.6) * 0.06 * (this.speed > 0.2 ? 1 : 0);
          p.x += Math.cos(this.yaw) * lat; p.z -= Math.sin(this.yaw) * lat;
        }
        s.position.copy(p).sub(this.pos);
        s.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), -this.yaw);
      });
    }
  }

  _deadPose(dt) {
    if (this.anim) { this.anim.update(dt); if (this.anim.has('Death') && this.anim.currentName !== 'Death') this.anim.play('Death', 0.1, { once: true }); }
    else this.root.rotation.z = damp(this.root.rotation.z, Math.PI / 2, 5, dt);
    if (this.S.fly) this.pos.y = damp(this.pos.y, terrain.heightAt(this.pos.x, this.pos.z) + 0.1, 4, dt);
    this.root.position.copy(this.pos);
    if (this.stateT > 30) this.remove = true;
  }

  dispose() { combat.removeTarget(this); this.scene.remove(this.root); }
  net() { return [this.id, this.kind, +this.pos.x.toFixed(2), +this.pos.y.toFixed(2), +this.pos.z.toFixed(2), +this.yaw.toFixed(2), +this.speed.toFixed(1), this.state, this.alive ? 1 : 0]; }
}

export const animals = {
  name: 'animals',
  list: [],
  zones: [],

  init(scene) {
    this.scene = scene;
    let zi = 0;
    for (const kind in SPAWN_ZONES) for (const z of SPAWN_ZONES[kind]) this.zones.push({ id: 'z' + zi++, kind, ...z, active: false, members: [], cooldown: 0 });
    this.zones.push({ id: 'bats', kind: 'bat', x: CAVE.chamber.x, z: CAVE.chamber.z, r: 8, n: 7, active: false, members: [], cooldown: 0 });
  },
  start() {
    for (const a of this.list) a.dispose();
    this.list = [];
    for (const z of this.zones) { z.active = false; z.members = []; z.cooldown = 0; }
  },
  stop() { this.start(); },

  _spawnZone(z) {
    z.active = true;
    for (let i = 0; i < z.n; i++) {
      let x = z.x, zz = z.z;
      for (let tries = 0; tries < 12; tries++) {
        const a = Math.random() * 6.28, r = Math.random() * z.r;
        x = z.x + Math.cos(a) * r; zz = z.z + Math.sin(a) * r;
        const h = terrain.heightAt(x, zz);
        if (z.kind === 'croc' ? h < -1.2 && h > -4 : z.beach ? h > 0.3 && h < 2.2 : h > 1.5) break;
      }
      const a = new Animal(this.scene, z.kind, x, zz, z, (Math.random() * 1e6) | 0);
      if (z.kind === 'croc') a.state = 'ambush';
      z.members.push(a);
      this.list.push(a);
    }
  },

  update(dt) {
    const p = G.player;
    if (!p) return;
    const pts = [p.pos, ...[...G.remotes.values()].map((r) => r.pos)];
    if (!G.online || G.isHost) {
      for (const z of this.zones) {
        const d = Math.min(...pts.map((f) => Math.hypot(f.x - z.x, f.z - z.z)));
        z.cooldown -= dt;
        if (!z.active && d < z.r + 150 && z.cooldown <= 0) this._spawnZone(z);
        else if (z.active && d > z.r + 230) {
          const dead = z.members.filter((m) => !m.alive).length;
          for (const m of z.members) { m.dispose(); m.remove = true; }
          z.members = [];
          z.active = false;
          z.cooldown = dead > 0 ? 120 : 0;
        }
      }
      for (const a of this.list) if (a.pos.distanceToSquared(p.pos) < 250 * 250 || G.online) a.update(dt);
    } else {
      for (const a of this.list) this._interp(a, dt);
    }
    const rm = this.list.filter((a) => a.remove);
    if (rm.length) { for (const a of rm) { a.dispose(); if (a.zone) a.zone.members = a.zone.members.filter((m) => m !== a); } this.list = this.list.filter((a) => !a.remove); }
  },

  _interp(a, dt) {
    const t = a.netTarget;
    if (!t) return;
    a.pos.x = damp(a.pos.x, t[2], 10, dt); a.pos.y = damp(a.pos.y, t[3], 10, dt); a.pos.z = damp(a.pos.z, t[4], 10, dt);
    a.yaw = dampAngle(a.yaw, t[5], 10, dt);
    a.speed = t[6]; a.state = t[7]; a.alive = !!t[8];
    a.t += dt;
    if (a.alive) a._pose(dt); else a._deadPose(dt);
  },

  netSnapshot() { return this.list.map((a) => a.net()); },
  applySnapshot(arr) {
    const seen = new Set();
    for (const s of arr) {
      seen.add(s[0]);
      let a = this.list.find((x) => x.id === s[0]);
      if (!a) { a = new Animal(this.scene, s[1], s[2], s[4], null, 1); a.id = s[0]; this.list.push(a); }
      a.netTarget = s;
    }
    for (const a of this.list) if (!seen.has(a.id)) { a.dispose(); a.remove = true; }
    this.list = this.list.filter((a) => !a.remove);
  },
  byId(id) { return this.list.find((a) => a.id === id); },
};
