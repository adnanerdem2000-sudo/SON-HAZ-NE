import * as THREE from 'three';
import { G } from './ctx.js';
import { disposeTree } from '../core/dispose.js';
import { combat } from './combat.js';
import { effects } from './effects.js';
import { enemies } from './enemies.js';
import { audio } from '../core/audio.js';
import { Animated } from '../player/character.js';
import { Ship } from '../ship/ship.js';
import { terrain } from '../world/terrain.js';
import { ocean } from '../world/ocean.js';
import { sky } from '../world/sky.js';
import { BOSS_SITES, EXTRA_ISLANDS } from '../world/archipelago.js';
import { islands } from '../world/islands.js';
import { tpCamera } from '../player/camera.js';
import { time } from '../world/time.js';
import { clamp, damp, dampAngle, wrapAngle, lerp } from '../core/util.js';

// Efsanevi bosslar: Kraken, Derinlik Yılanı, Taş Muhafız, Lanetli Amiral, Volkanik Dev.
// Her biri evreli, saldırıları önceden işaretlenen (kırmızı halka/parıltı) ve zayıf noktası olan
// karşılaşmalardır. Oda sahibi yönetir; konuklar anlık görüntüyle izler. Co-op'ta can artar.

export const BOSS_DEFS = {
  kraken: { name: 'Kraken', hp: 3000, sea: true, reward: [['altin_para', 900, 1300], ['kraliyet_taci', 1], ['elmas', 2], ['inci', 4]], title: 'Kara Girdabın Efendisi' },
  derinlik_yilani: { name: 'Derinlik Yılanı', hp: 2400, sea: true, reward: [['altin_para', 700, 1000], ['zumrut', 2], ['elmas', 1], ['antik_vazo', 1]], title: 'Buzların Altındaki Kraliçe' },
  tas_muhafiz: { name: 'Taş Muhafız', hp: 2200, land: true, reward: [['altin_para', 600, 900], ['altin_heykelcik', 2], ['yakut', 2], ['antik_vazo', 1]], title: 'Kadim Tapınağın Bekçisi' },
  lanetli_amiral: { name: 'Lanetli Amiral', hp: 1400, sea: true, reward: [['altin_para', 900, 1400], ['korsan_madalyonu', 2], ['kraliyet_taci', 1]], title: 'Sisin İçindeki Filo' },
  volkanik_dev: { name: 'Volkanik Dev', hp: 3200, land: true, reward: [['altin_para', 1000, 1500], ['yakut', 3], ['elmas', 2], ['altin_kulce', 3]], title: 'Ateşin Bekçisi' },
};

const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _s = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

function players() {
  const out = [];
  const p = G.player;
  if (p && !p.dead && !p.downed) out.push({ id: G.myId, ref: p, pos: p.pos });
  for (const [id, r] of G.remotes) if (!r.downed) out.push({ id, ref: r, pos: r.pos });
  return out;
}
function hitPlayer(t, dmg, from, cause, opts = {}) {
  if (t.id === G.myId) G.player.hurt(dmg, from, { cause, melee: !!opts.melee, unblockable: opts.unblockable !== false });
  else G.emit('netHurtPlayer', { id: t.id, dmg, from: [from.x, from.y, from.z], cause, unblockable: opts.unblockable !== false, melee: !!opts.melee, kb: opts.kb || 0 });
  if (t.id === G.myId && opts.kb && from) { const dx = t.pos.x - from.x, dz = t.pos.z - from.z, d = Math.hypot(dx, dz) || 1; G.player.knock = { x: dx / d * opts.kb, z: dz / d * opts.kb }; }
}
// kemiğe dünya ölçeğinden bağımsız boyutta nesne bağla (model uzayında verilen konuma)
function attachToBone(boss, obj, re, worldOffset, size) {
  const root = boss.root;
  root.position.copy(boss.pos); root.rotation.y = boss.yaw || 0;
  root.updateMatrixWorld(true);
  let bone = null;
  root.traverse((o) => { if (o.isBone && !bone && re.test(o.name)) bone = o; });
  const host = bone || root;
  const wp = root.localToWorld(worldOffset.clone());
  scene_attach(host, obj, wp);
  (boss.attached || (boss.attached = [])).push(obj); // kemiğe bağlanan prosedürel parça: dispose'ta ayrıca bırakılır (glb alt ağacı atlanır)
  const ws = host.getWorldScale(new THREE.Vector3());
  obj.scale.setScalar(size / Math.max(1e-4, ws.x));
}
function scene_attach(host, obj, worldPos) {
  host.add(obj);
  obj.position.copy(host.worldToLocal(worldPos.clone()));
}
// yer halkası (telgraf)
function ring(scene, color = 0xff3020) {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide }));
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 4;
  m.visible = false;
  scene.add(m);
  return m;
}

// ---------------------------------------------------------------------------
// Ortak taban
// ---------------------------------------------------------------------------
class BossBase {
  constructor(id, site, scene) {
    this.id = id;
    this.site = site;
    this.def = BOSS_DEFS[id];
    this.scene = scene;
    this.name = this.def.name;
    this.T = { name: this.def.name, boss: true };
    const coop = G.online ? 1 + 0.5 * G.remotes.size : 1;
    this.maxHp = this.def.hp * coop;
    this.hp = this.maxHp;
    this.alive = true;
    this.big = true;
    this.radius = 3;
    this.height = 5;
    this.pos = new THREE.Vector3(site.x, 0, site.z);
    this.bloodColor = [0.9, 0.5, 0.3];
    this.phase = 1;
    this.t = 0;
    this.atkT = 3;
    this.rings = [];
    this.parts = [];
  }
  hurt(dmg, info = {}) {
    if (!this.alive) return null;
    if (G.online && !G.isHost) { G.emit('netHurtBoss', { id: this.id, dmg, kind: info.kind, pos: info.pos ? [info.pos.x, info.pos.y, info.pos.z] : null }); return 'hit'; }
    return this.applyDamage(dmg, info);
  }
  applyDamage(dmg, info = {}) {
    if (!this.alive) return null;
    const k = this.damageMul(info);
    if (k <= 0) { effects.sparks(this.pos.x, this.pos.y + this.height * 0.6, this.pos.z, 6, [0.6, 0.8, 1]); return 'blocked'; }
    const d = dmg * k;
    this.hp -= d;
    G.emit('dmgNumber', { pos: _v.copy(info.pos || this.pos).setY((info.pos?.y || this.pos.y) + 2.5), dmg: Math.round(d), crit: k > 1.3 });
    combat.markCombat();
    if (this.hp <= 0) { this.hp = 0; this.die(); }
    else this.onPhase?.();
    return 'hit';
  }
  damageMul() { return 1; }
  die() {
    this.alive = false;
    this.deadT = 0;
    audio.play('big_kill', { vol: 1 });
    G.notify(`${this.name} yenildi!`, 'boss', 5000);
    bosses.victory(this);
  }
  dispose() {
    combat.removeTarget(this);
    for (const r of this.rings) { this.scene.remove(r); r.geometry.dispose(); r.material.dispose(); }
    // prosedürel parçaların geometri/malzemeleri bırakılır (Kraken temizlenince 32 geometri kalıyordu); glb klonunun geometrisi
    // varlık önbelleğiyle paylaşımlıdır → o alt ağaç atlanır, onun malzeme/iskeleti Animated.dispose ile bırakılır
    for (const o of this.parts) { this.scene.remove(o); disposeTree(o, { skip: this.anim?.model || null }); }
    for (const o of this.attached || []) { o.parent?.remove(o); disposeTree(o); } // Taş Muhafız kristali, Volkanik Dev çekirdeği
    this.anim?.dispose?.(); // animasyonlu model (Animated): klon malzemeler + kemik dokusu
  }
  net() { return { id: this.id, hp: Math.round(this.hp), max: Math.round(this.maxHp), x: +this.pos.x.toFixed(1), y: +this.pos.y.toFixed(1), z: +this.pos.z.toFixed(1), ph: this.phase, a: this.alive ? 1 : 0, ...(this.netExtra?.() || {}) }; }
  applyNet(s) { this.hp = s.hp; this.maxHp = s.max; this.phase = s.ph; this.alive = !!s.a; this.netT = s; this.applyNetExtra?.(s); }
}

// ---------------------------------------------------------------------------
// KRAKEN — dokunaçlar güverteye iner; dokunaç kırılınca baş açığa çıkar (zayıf nokta: göz)
// ---------------------------------------------------------------------------
const TSEG = 18;
class Kraken extends BossBase {
  constructor(site, scene) {
    super('kraken', site, scene);
    this.radius = 6; this.height = 8;
    this.bloodColor = [0.3, 0.1, 0.4];
    const ship = G.ship;
    const a = Math.random() * 6.28;
    this.pos.set((ship?.x ?? site.x) + Math.cos(a) * 40, -8, (ship?.z ?? site.z) + Math.sin(a) * 40);
    this.headY = -8;
    // baş (manto) ve gözler
    const g = new THREE.Group();
    const skin = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.45, metalness: 0.05, emissive: 0x1a0408 });
    // manto: üstte şişkin, altta etek gibi açılan, benekli deri
    const mg = new THREE.SphereGeometry(1, 28, 22);
    const mp = mg.attributes.position;
    const cols = new Float32Array(mp.count * 3);
    for (let i = 0; i < mp.count; i++) {
      let x = mp.getX(i), y = mp.getY(i), z = mp.getZ(i);
      const k = y > 0 ? 1 + y * 0.35 : 1 + (-y) * 0.25;
      x *= k; z *= k;
      const bump = Math.sin(x * 9) * Math.sin(y * 7) * Math.sin(z * 8) * 0.04;
      mp.setXYZ(i, x * (1 + bump), y, z * (1 + bump));
      const spot = Math.sin(x * 13.1 + z * 5.3) * Math.sin(y * 11.7 - x * 3.1) > 0.55;
      const under = y < -0.2 ? 0.35 : 0;
      cols[i * 3] = spot ? 0.62 : 0.42 + under; cols[i * 3 + 1] = spot ? 0.14 : 0.07 + under * 0.5; cols[i * 3 + 2] = spot ? 0.22 : 0.16 + under * 0.4;
    }
    mg.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    mg.computeVertexNormals();
    const mantle = new THREE.Mesh(mg, skin);
    mantle.scale.set(5.5, 9, 5.5); mantle.position.y = 6;
    const eyeM = new THREE.MeshStandardMaterial({ color: 0xffd040, emissive: 0x806010, emissiveIntensity: 1.2 });
    const pupM = new THREE.MeshBasicMaterial({ color: 0x050505 });
    for (const sx of [-1, 1]) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(1.1, 14, 10), eyeM); e.position.set(sx * 3.2, 2.6, 3.6);
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.4, 0.3), pupM); p.position.set(sx * 3.35, 2.6, 4.6);
      g.add(e, p);
    }
    g.add(mantle);
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    scene.add(g);
    this.head = g; this.skin = skin;
    this.parts.push(g);
    // dokunaçlar: tek örneklenmiş çizim
    this.tentacles = [];
    const segGeo = new THREE.CylinderGeometry(1, 1, 1, 8, 1); segGeo.translate(0, 0.5, 0);
    // dokunaç: iki renkli (alt yüzde açık vantuz tonu)
    const sc = new Float32Array(segGeo.attributes.position.count * 3);
    for (let i = 0; i < segGeo.attributes.position.count; i++) { const zz = segGeo.attributes.position.getZ(i); const u = zz > 0.3 ? 1 : 0; sc[i * 3] = u ? 0.85 : 0.5; sc[i * 3 + 1] = u ? 0.55 : 0.12; sc[i * 3 + 2] = u ? 0.5 : 0.2; }
    segGeo.setAttribute('color', new THREE.BufferAttribute(sc, 3));
    this.tMesh = new THREE.InstancedMesh(segGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.45, emissive: 0x1a0408 }), 6 * TSEG);
    this.tMesh.castShadow = true; this.tMesh.frustumCulled = false;
    scene.add(this.tMesh); this.parts.push(this.tMesh);
    for (let i = 0; i < 6; i++) {
      const ten = { i, ang: (i / 6) * 6.28, state: 'idle', st: 0, hp: 220, maxHp: 220, tip: new THREE.Vector3(), aim: new THREE.Vector3(), local: null, regrow: 0 };
      ten.tip.copy(this.pos).add(_v.set(Math.cos(ten.ang) * 9, -2, Math.sin(ten.ang) * 9));
      // dövüş hedefi (yalnız güvertedeyken/havadayken vurulabilir)
      ten.target = { pos: new THREE.Vector3(), radius: 1.3, height: 2, big: true, alive: false, bloodColor: [0.4, 0.1, 0.5], T: { name: 'Kraken dokunacı' },
        hurt: (dmg, info) => this._hurtTentacle(ten, dmg, info) };
      combat.addTarget(ten.target);
      this.tentacles.push(ten);
    }
    this.markers = this.tentacles.map(() => ring(scene));
    this.rings.push(...this.markers);
    combat.addTarget(this);
    G.notify('Deniz kaynıyor… KRAKEN uyandı! Dokunaçlar güverteye inmeden kaç ya da kes!', 'boss', 6000);
    audio.play('boss', { vol: 1 });
  }
  damageMul(info) {
    if (info.kind === 'tentacle') return 1;
    if (this.headY < -3) return info.kind === 'explosion' ? 0.2 : 0; // derindeyken baş korunur
    let k = 1;
    if (this.exposed > 0) k *= 2; // göz açığa çıktı
    return k;
  }
  _hurtTentacle(ten, dmg, info) {
    if (ten.state === 'gone' || !this.alive) return null;
    if (G.online && !G.isHost) { G.emit('netHurtBoss', { id: this.id, dmg, ten: ten.i }); return 'hit'; }
    const k = ten.state === 'stuck' || ten.state === 'grab' ? 1.5 : 1;
    ten.hp -= dmg * k;
    G.emit('dmgNumber', { pos: ten.target.pos.clone().setY(ten.target.pos.y + 1.5), dmg: Math.round(dmg * k), crit: k > 1 });
    effects.sparks(ten.target.pos.x, ten.target.pos.y + 1, ten.target.pos.z, 8, [0.5, 0.1, 0.6]);
    if (ten.hp <= 0) {
      ten.state = 'gone'; ten.st = 0; ten.regrow = 22;
      this.applyDamage(260 * (G.online ? 1 + 0.5 * G.remotes.size : 1), { kind: 'tentacle' });
      this.exposed = 6;
      G.notify('Dokunaç koptu! Kraken acıyla yükseliyor — gözüne nişan al!', 'good', 3000);
      if (this.grabbing) this.grabbing = null;
    }
    return 'hit';
  }
  onPhase() {
    const f = this.hp / this.maxHp;
    if (this.phase === 1 && f < 0.6) { this.phase = 2; G.notify('Kraken yüzeye çıktı! Toplarla başını hedef al.', 'boss', 4000); this._ink(); }
    if (this.phase === 2 && f < 0.3) { this.phase = 3; G.notify('Kraken öfkelendi — bir girdap gemiyi içine çekiyor!', 'boss', 4500); }
  }
  _ink() {
    for (let i = 0; i < 40; i++) effects.smoke(this.pos.x + (Math.random() - 0.5) * 20, 0.5, this.pos.z + (Math.random() - 0.5) * 20, 1, 3, 0.05);
  }
  update(dt) {
    this.t += dt;
    const ship = G.ship && !G.ship.sunk ? G.ship : null;
    this.exposed = Math.max(0, (this.exposed || 0) - dt);
    // gemiyi çevreler (yavaşça) — evre 2+ yüzeyde
    if (ship && this.alive) {
      this.orbit = (this.orbit ?? Math.atan2(this.pos.z - ship.z, this.pos.x - ship.x)) + dt * 0.05;
      const R = this.phase === 3 ? 30 : 38;
      this.pos.x = damp(this.pos.x, ship.x + Math.cos(this.orbit) * R, 0.5, dt);
      this.pos.z = damp(this.pos.z, ship.z + Math.sin(this.orbit) * R, 0.5, dt);
      // girdap: gemiyi kendine çeker
      if (this.phase === 3) {
        const dx = this.pos.x - ship.x, dz = this.pos.z - ship.z, d = Math.hypot(dx, dz) || 1;
        ship.x += dx / d * 1.2 * dt; ship.z += dz / d * 1.2 * dt;
        if (Math.random() < 0.4) effects.spawn(this.pos.x + Math.cos(this.t * 2 + Math.random()) * 14, 0.3, this.pos.z + Math.sin(this.t * 2 + Math.random()) * 14, 0, 0.5, 0, 1, 0.8, 0.9, 0.95, 1, 0, 1);
      }
      // tutunma: gemi hareket edemez
      if (this.grabbing) { ship.speed *= Math.exp(-3 * dt); ship.sail = Math.min(ship.sail, 0.2); }
    }
    const wantY = !this.alive ? -14 : this.exposed > 0 ? 2 : this.phase >= 2 ? -0.5 : -8;
    this.headY = damp(this.headY, wantY, this.alive ? 1.2 : 0.4, dt);
    this.pos.y = this.headY;
    this.head.position.set(this.pos.x, this.headY + Math.sin(this.t * 0.8) * 0.4, this.pos.z);
    if (ship) this.head.rotation.y = Math.atan2(ship.x - this.pos.x, ship.z - this.pos.z);
    this.skin.emissive.setHex(this.exposed > 0 ? 0x501020 : 0x1a0408);
    // saldırı seçimi
    if (this.alive && ship && (!G.online || G.isHost)) {
      this.atkT -= dt;
      if (this.atkT <= 0) {
        const free = this.tentacles.filter((t) => t.state === 'idle');
        if (free.length) {
          const ten = free[Math.floor(Math.random() * free.length)];
          if (this.phase >= 2 && !this.grabbing && Math.random() < 0.25) this._startGrab(ten, ship);
          else this._startSlam(ten, ship);
        }
        this.atkT = (this.phase === 3 ? 2.2 : this.phase === 2 ? 3.2 : 4.4) * (0.8 + Math.random() * 0.4);
      }
    }
    this._updateTentacles(dt, ship);
    if (!this.alive) { this.deadT += dt; if (this.deadT > 8) this.remove = true; }
  }
  _startSlam(ten, ship) {
    // hedef: güvertedeki oyunculardan birinin yakını ya da rastgele güverte noktası
    const onDeck = players().filter((p) => p.ref.ship === ship);
    let lx = (Math.random() - 0.5) * ship.T.B * 0.6, lz = (Math.random() - 0.5) * ship.T.L * 0.7;
    if (onDeck.length && Math.random() < 0.75) { const l = ship.worldToLocal(onDeck[Math.floor(Math.random() * onDeck.length)].pos.clone()); lx = l.x; lz = l.z; }
    ten.local = new THREE.Vector3(clamp(lx, -ship.T.B * 0.35, ship.T.B * 0.35), 0, clamp(lz, -ship.T.L * 0.42, ship.T.L * 0.42));
    ten.state = 'rise'; ten.st = 0;
    audio.tone(90, 0.6, 'sawtooth', 0.05, this.pos, 0.8);
  }
  _startGrab(ten, ship) {
    const side = Math.random() < 0.5 ? -1 : 1;
    ten.local = new THREE.Vector3(side * ship.T.B * 0.5, 0, (Math.random() - 0.5) * ship.T.L * 0.5);
    ten.state = 'grabRise'; ten.st = 0;
  }
  _updateTentacles(dt, ship) {
    const base = _w;
    for (const ten of this.tentacles) {
      ten.st += dt;
      const m = this.markers[ten.i];
      base.set(this.pos.x + Math.cos(ten.ang + this.t * 0.1) * 6, -1.5, this.pos.z + Math.sin(ten.ang + this.t * 0.1) * 6);
      let target = null, speed = 3;
      const deckPt = () => ship && ten.local ? ship.localToWorld(_v.set(ten.local.x, ship.deckAt(ten.local.x, ten.local.z), ten.local.z), new THREE.Vector3()) : null;
      if (ten.state === 'gone') {
        target = base.clone().setY(-10); speed = 2;
        ten.regrow -= dt;
        if (ten.regrow <= 0 && this.alive) { ten.state = 'idle'; ten.hp = ten.maxHp; }
      } else if (!this.alive || !ship) {
        target = base.clone().setY(-12); speed = 1.5; ten.state = this.alive ? 'idle' : 'dead';
      } else if (ten.state === 'idle') {
        // boşta: sudan kıvrılarak yükselen dokunaçlar
        target = base.clone().add(_s.set(Math.cos(ten.ang + this.t * 0.6) * 7, 6 + Math.sin(this.t * 1.1 + ten.i * 1.7) * 3.5, Math.sin(ten.ang + this.t * 0.6) * 7));
        speed = 2.2;
      } else if (ten.state === 'rise' || ten.state === 'grabRise') {
        const dp = deckPt();
        target = dp.clone().setY(dp.y + 10 + Math.sin(this.t * 3) * 0.5);
        speed = 5;
        if (m) { m.visible = true; const r = 2.8; m.scale.setScalar(r * (0.5 + 0.5 * Math.min(1, ten.st / 2))); m.position.set(dp.x, dp.y + 0.12, dp.z); m.material.opacity = 0.35 + 0.35 * Math.abs(Math.sin(ten.st * 8)); }
        if (ten.st > (this.phase === 3 ? 1.5 : 2.0)) { ten.state = ten.state === 'grabRise' ? 'grabSlam' : 'slam'; ten.st = 0; }
      } else if (ten.state === 'slam' || ten.state === 'grabSlam') {
        target = deckPt(); speed = 14;
        if (ten.tip.distanceTo(target) < 1.2 || ten.st > 0.5) {
          const grab = ten.state === 'grabSlam';
          ten.state = grab ? 'grab' : 'stuck'; ten.st = 0;
          if (m) m.visible = false;
          if (!G.online || G.isHost) {
            ship.damage(grab ? 6 : 10, ten.local.clone());
            for (const p of players()) if (p.pos.distanceTo(target) < 3.4) hitPlayer(p, 22, target, 'Kraken dokunacı seni ezdi', { kb: 6 });
          }
          tpCamera.addShake(0.6);
          effects.splash(target.x, target.z, 2.2);
          audio.boom(0.9, target);
          if (grab) { this.grabbing = ten; G.notify('Kraken gemini yakaladı! Dokunacı kes ki kurtulasın!', 'warn', 3500); }
        }
      } else if (ten.state === 'stuck' || ten.state === 'grab') {
        target = deckPt(); speed = 20;
        if (ten.st > (ten.state === 'grab' ? 9 : 3.2)) { if (this.grabbing === ten) this.grabbing = null; ten.state = 'retract'; ten.st = 0; }
      } else if (ten.state === 'retract') {
        target = base.clone().setY(2); speed = 4;
        if (ten.st > 1.5) ten.state = 'idle';
      } else target = base.clone();
      if (!target) target = base.clone();
      ten.tip.lerp(target, 1 - Math.exp(-speed * dt));
      // eğri: taban → kontrol → uç
      const ctrl = _s.copy(base).lerp(ten.tip, 0.35); ctrl.y = Math.max(base.y, ten.tip.y) + 4 + (ten.state === 'rise' ? 5 : 0);
      const thick = 1.45;
      let prev = base.clone();
      for (let k = 0; k < TSEG; k++) {
        const u = (k + 1) / TSEG;
        const a = 1 - u;
        const p = new THREE.Vector3(a * a * base.x + 2 * a * u * ctrl.x + u * u * ten.tip.x, a * a * base.y + 2 * a * u * ctrl.y + u * u * ten.tip.y, a * a * base.z + 2 * a * u * ctrl.z + u * u * ten.tip.z);
        const dir = p.clone().sub(prev);
        const len = dir.length() || 0.01;
        _q.setFromUnitVectors(UP, dir.normalize());
        const r = thick * (1 - (k / TSEG) * 0.82);
        _m.compose(prev, _q, _s.set(r, len * 1.08, r));
        this.tMesh.setMatrixAt(ten.i * TSEG + k, _m);
        if (k === TSEG - 6) ten.target.pos.copy(p).setY(p.y - 1);
        prev = p;
      }
      ten.target.alive = this.alive && ten.state !== 'gone' && ten.state !== 'idle' && ten.target.pos.y > -1;
    }
    this.tMesh.instanceMatrix.needsUpdate = true;
  }
  dispose() { super.dispose(); for (const t of this.tentacles) combat.removeTarget(t.target); }
  netExtra() { return { tn: this.tentacles.map((t) => [+t.tip.x.toFixed(1), +t.tip.y.toFixed(1), +t.tip.z.toFixed(1), t.state === 'gone' ? 0 : 1]), hy: +this.headY.toFixed(1), ex: this.exposed > 0 ? 1 : 0 }; }
  applyNetExtra(s) {
    if (s.tn) s.tn.forEach((a, i) => { const t = this.tentacles[i]; if (!t) return; t.netTip = a; });
    this.netHead = s;
  }
  clientUpdate(dt) {
    this.t += dt;
    const s = this.netHead;
    if (s) { this.pos.x = damp(this.pos.x, s.x, 6, dt); this.pos.z = damp(this.pos.z, s.z, 6, dt); this.headY = damp(this.headY, s.hy, 6, dt); this.exposed = s.ex ? 1 : 0; }
    this.head.position.set(this.pos.x, this.headY, this.pos.z);
    for (const t of this.tentacles) if (t.netTip) { t.state = t.netTip[3] ? 'net' : 'gone'; t.local = null; }
    // uçları ağdan izle
    for (const t of this.tentacles) if (t.netTip) t.tip.lerp(_v.set(t.netTip[0], t.netTip[1], t.netTip[2]), 1 - Math.exp(-8 * dt));
    const ship = G.ship;
    this._updateTentacles(0, null);
    // konuk: dokunaç hedefleri ağdaki duruma göre canlı kalır (yerel güncelleme onları 'gone' sayıp vurulamaz yapıyordu)
    for (const t of this.tentacles) if (t.netTip && t.target) t.target.alive = this.alive && !!t.netTip[3];
    void ship;
  }
}

// ---------------------------------------------------------------------------
// DERİNLİK YILANI — gemiyi çevreler, toslar, zehir tükürür, alttan fırlar (zayıf nokta: toslamadan sonra baş)
// ---------------------------------------------------------------------------
const NSEG = 30;
class SeaSerpent extends BossBase {
  constructor(site, scene) {
    super('derinlik_yilani', site, scene);
    this.radius = 2.4; this.height = 3;
    this.bloodColor = [0.2, 0.5, 0.5];
    const ship = G.ship;
    const a = Math.random() * 6.28;
    this.pos.set((ship?.x ?? site.x) + Math.cos(a) * 60, -4, (ship?.z ?? site.z) + Math.sin(a) * 60);
    this.yaw = 0; this.speed = 9; this.mode = 'circle'; this.mt = 0;
    this.trail = Array.from({ length: NSEG * 3 }, () => this.pos.clone());
    const skin = new THREE.MeshStandardMaterial({ color: 0x1f5a5a, roughness: 0.4, metalness: 0.15, emissive: 0x041212 });
    const belly = new THREE.MeshStandardMaterial({ color: 0xc8c070, roughness: 0.6 });
    this.bMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 10), skin, NSEG);
    this.bMesh.castShadow = true; this.bMesh.frustumCulled = false;
    scene.add(this.bMesh); this.parts.push(this.bMesh);
    // baş: uzun burun, çene, gözler, boynuzlar, yüzgeç
    const h = new THREE.Group();
    const skull = new THREE.Mesh(new THREE.SphereGeometry(1.6, 14, 10), skin); skull.scale.set(1, 0.8, 1.4);
    const snout = new THREE.Mesh(new THREE.ConeGeometry(1.1, 3.4, 10), skin); snout.rotation.x = Math.PI / 2; snout.position.set(0, -0.1, 2.6);
    const jaw = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3, 10), belly); jaw.rotation.x = Math.PI / 2; jaw.position.set(0, -0.8, 2.3);
    const eyeM = new THREE.MeshStandardMaterial({ color: 0xff3010, emissive: 0xff2000, emissiveIntensity: 1.6 });
    for (const sx of [-1, 1]) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), eyeM); e.position.set(sx * 0.9, 0.5, 1.2);
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.25, 2.4, 6), belly); horn.position.set(sx * 0.8, 1.2, -0.8); horn.rotation.set(-0.9, 0, sx * 0.3);
      h.add(e, horn);
    }
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.15, 2.6, 4), new THREE.MeshStandardMaterial({ color: 0x3a8a7a, side: THREE.DoubleSide }));
    fin.scale.set(1, 1, 6); fin.position.set(0, 1.2, -1.2);
    h.add(skull, snout, jaw, fin);
    h.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    this.jaw = jaw; this.headG = h;
    scene.add(h); this.parts.push(h);
    this.mark = ring(scene, 0x60ff40); this.rings.push(this.mark);
    combat.addTarget(this);
    G.notify('Sular soğudu… DERİNLİK YILANI yüzeye çıkıyor!', 'boss', 6000);
    audio.play('boss', { vol: 1 });
  }
  damageMul(info) {
    if (this.pos.y < -2.5) return info.kind === 'explosion' ? 0.3 : 0;
    return this.mode === 'stunned' || this.mode === 'spit' ? 2 : 1;
  }
  onPhase() {
    const f = this.hp / this.maxHp;
    if (this.phase === 1 && f < 0.5) { this.phase = 2; G.notify('Derinlik Yılanı hırçınlaştı!', 'boss', 3000); }
    if (this.phase === 2 && f < 0.2) { this.phase = 3; G.notify('Derinlik Yılanı son gücüyle saldırıyor!', 'boss', 3000); }
  }
  update(dt) {
    this.t += dt; this.mt += dt;
    const ship = G.ship && !G.ship.sunk ? G.ship : null;
    const host = !G.online || G.isHost;
    const spd = this.phase >= 2 ? 1.3 : 1;
    let goal = null, wantY = -1.5, sp = this.speed * spd;
    if (!this.alive) { wantY = -20; sp = 3; goal = this.pos.clone().add(_v.set(Math.sin(this.yaw) * 10, 0, Math.cos(this.yaw) * 10)); }
    else if (ship) {
      const toShip = Math.atan2(ship.x - this.pos.x, ship.z - this.pos.z);
      const d = Math.hypot(ship.x - this.pos.x, ship.z - this.pos.z);
      switch (this.mode) {
        case 'circle': {
          this.orb = (this.orb ?? Math.atan2(this.pos.z - ship.z, this.pos.x - ship.x)) + dt * 0.18 * spd;
          goal = _v.set(ship.x + Math.cos(this.orb) * 48, 0, ship.z + Math.sin(this.orb) * 48).clone();
          wantY = -1.5 + Math.sin(this.t * 0.9) * 2.5;
          if (host && this.mt > (this.phase === 3 ? 3 : 5.5)) {
            const r = Math.random();
            this.mode = r < 0.4 ? 'lineup' : r < 0.75 ? 'spit' : 'dive'; this.mt = 0; this.spits = 0;
          }
          break;
        }
        case 'lineup': { // yüzeye çıkar, kükrer, hedef alır
          goal = this.pos.clone().add(_v.set(Math.sin(toShip) * 2, 0, Math.cos(toShip) * 2)); sp = 2; wantY = 0.6;
          this.yaw = dampAngle(this.yaw, toShip, 3, dt);
          if (this.mt > 1.6) { this.mode = 'charge'; this.mt = 0; this.chargeTo = new THREE.Vector3(ship.x, 0, ship.z); audio.tone(70, 0.8, 'sawtooth', 0.06, this.pos, 0.9); }
          break;
        }
        case 'charge': {
          goal = this.chargeTo; sp = 19 * spd; wantY = 0.2;
          const lp = ship.worldToLocal(this.pos.clone());
          if (Math.abs(lp.z) < ship.T.L / 2 + 2 && Math.abs(lp.x) < ship.T.B / 2 + 2.5) {
            if (host) {
              ship.damage(22, lp.clone());
              const dx = ship.x - this.pos.x, dz = ship.z - this.pos.z, dd = Math.hypot(dx, dz) || 1;
              ship.x += dx / dd * 2.5; ship.z += dz / dd * 2.5;
              for (const p of players()) if (p.ref.ship === ship && Math.random() < 0.6) hitPlayer(p, 14, this.pos, 'Derinlik Yılanı gemiye tosladı', { kb: 4 });
            }
            tpCamera.addShake(0.8); audio.boom(1, this.pos); effects.splash(this.pos.x, this.pos.z, 3);
            this.mode = 'stunned'; this.mt = 0;
            G.notify('Yılan sersemledi — başına vur!', 'good', 2200);
          } else if (this.mt > 4 || this.pos.distanceTo(this.chargeTo) < 2) { this.mode = 'circle'; this.mt = 0; }
          break;
        }
        case 'stunned': goal = this.pos.clone(); sp = 0.5; wantY = 1.2; if (this.mt > 3.2) { this.mode = 'circle'; this.mt = 0; } break;
        case 'spit': { // şahlanır, güverteye zehir topları
          goal = this.pos.clone().add(_v.set(Math.sin(toShip), 0, Math.cos(toShip)).multiplyScalar(d > 30 ? 3 : -2)); sp = 4; wantY = 3.5;
          this.yaw = dampAngle(this.yaw, toShip, 3, dt);
          const n = this.phase >= 2 ? 5 : 3;
          if (host && this.mt > 1.2 + this.spits * 0.7 && this.spits < n) {
            this.spits++;
            const lx = (Math.random() - 0.5) * ship.T.B * 0.6, lz = (Math.random() - 0.5) * ship.T.L * 0.7;
            const to = ship.localToWorld(_v.set(lx, ship.deckAt(lx, lz), lz), new THREE.Vector3());
            enemies.lob({ kind: 'venom', from: this.headG.position.clone().add(_s.set(0, 1, 0)), to, time: 1.3, dmg: 12, shipDmg: 3, aoe: 2.4, owner: this, ship });
            audio.tone(300, 0.2, 'triangle', 0.05, this.pos, 0.6);
          }
          if (this.mt > 1.6 + n * 0.7) { this.mode = 'circle'; this.mt = 0; }
          break;
        }
        case 'dive': { // dalar, geminin yanında köpük halkası, sonra fırlar
          if (!this.diveAt) { const side = Math.random() < 0.5 ? -1 : 1; this.diveLocal = new THREE.Vector3(side * (ship.T.B / 2 + 3), 0, (Math.random() - 0.5) * ship.T.L * 0.5); this.diveAt = true; }
          const tgt = ship.localToWorld(_v.set(this.diveLocal.x, 0, this.diveLocal.z), new THREE.Vector3());
          goal = tgt; sp = 14; wantY = -9;
          this.mark.visible = true; this.mark.position.set(tgt.x, ocean.heightAt(tgt.x, tgt.z) + 0.2, tgt.z); this.mark.scale.setScalar(4.5); this.mark.material.opacity = 0.3 + 0.4 * Math.abs(Math.sin(this.mt * 6));
          if (Math.random() < 0.5) effects.bubbles(tgt.x + (Math.random() - 0.5) * 6, -0.5, tgt.z + (Math.random() - 0.5) * 6);
          if (this.mt > 2.2) {
            this.mark.visible = false; this.diveAt = false;
            this.pos.copy(tgt).setY(-1);
            if (host) {
              ship.damage(16, this.diveLocal.clone());
              for (const p of players()) if (p.pos.distanceTo(tgt) < 6.5) hitPlayer(p, 22, tgt, 'Derinlik Yılanı alttan saldırdı', { kb: 7 });
            }
            effects.splash(tgt.x, tgt.z, 3.5); audio.boom(1, tgt); tpCamera.addShake(0.7);
            this.mode = 'stunned'; this.mt = 0.8;
          }
          break;
        }
        default: this.mode = 'circle';
      }
    }
    if (goal) {
      const dx = goal.x - this.pos.x, dz = goal.z - this.pos.z;
      if (Math.hypot(dx, dz) > 0.5 && this.mode !== 'lineup' && this.mode !== 'spit') this.yaw = dampAngle(this.yaw, Math.atan2(dx, dz), 2.2, dt);
      const v = Math.min(sp, Math.hypot(dx, dz) * 2);
      // karaya oturma yok: 12 m ilerisi sığ/kara ise ±35°/±70° sapmalı yönlerden suda olanı seç, hiçbiri değilse dur
      const ahead = (a) => terrain.heightAt(this.pos.x + Math.sin(a) * 12, this.pos.z + Math.cos(a) * 12) < ocean.tide - 3;
      if (!ahead(this.yaw)) {
        const alt = [this.yaw + 0.6, this.yaw - 0.6, this.yaw + 1.2, this.yaw - 1.2].find(ahead);
        if (alt !== undefined) this.yaw = dampAngle(this.yaw, alt, 4, dt);
      }
      const nx = this.pos.x + Math.sin(this.yaw) * v * dt, nz = this.pos.z + Math.cos(this.yaw) * v * dt;
      if (terrain.heightAt(nx, nz) < ocean.tide - 2) { this.pos.x = nx; this.pos.z = nz; }
    }
    this.pos.y = damp(this.pos.y, wantY, 2, dt);
    this._pose(dt);
    if (!this.alive) { this.deadT += dt; if (this.deadT > 8) this.remove = true; }
  }
  _pose(dt) {
    // iz: baş konumları; gövde iz boyunca dalgalanır
    const last = this.trail[0];
    if (last.distanceTo(this.pos) > 0.7) { this.trail.pop(); this.trail.unshift(this.pos.clone()); }
    this.headG.position.copy(this.pos);
    this.headG.rotation.set(this.mode === 'spit' || this.mode === 'lineup' ? -0.5 : 0, this.yaw, 0);
    this.jaw.rotation.x = Math.PI / 2 + (this.mode === 'spit' || this.mode === 'charge' ? 0.35 + Math.sin(this.t * 10) * 0.1 : 0.05);
    for (let i = 0; i < NSEG; i++) {
      const p = this.trail[Math.min(this.trail.length - 1, i * 2 + 2)];
      const r = 1.3 * (1 - (i / NSEG) * 0.75);
      const wave = Math.sin(this.t * 2 - i * 0.5) * (this.mode === 'circle' ? 1.6 : 0.6);
      _m.compose(_v.set(p.x, p.y + wave - i * 0.05, p.z), _q.identity(), _s.set(r, r * 0.9, r * 1.3));
      this.bMesh.setMatrixAt(i, _m);
    }
    this.bMesh.instanceMatrix.needsUpdate = true;
  }
  netExtra() { return { yw: +this.yaw.toFixed(2), md: this.mode }; }
  clientUpdate(dt) {
    this.t += dt;
    const s = this.netT;
    if (s) { this.pos.x = damp(this.pos.x, s.x, 6, dt); this.pos.y = damp(this.pos.y, s.y, 6, dt); this.pos.z = damp(this.pos.z, s.z, 6, dt); this.yaw = dampAngle(this.yaw, s.yw, 6, dt); this.mode = s.md; }
    this._pose(dt);
  }
}

// ---------------------------------------------------------------------------
// Kara bossları için ortak: animasyonlu dev gövde + telgraflı saldırılar
// ---------------------------------------------------------------------------
class GiantBase extends BossBase {
  constructor(id, site, scene, model, height, tint, emissive) {
    super(id, site, scene);
    this.anim = new Animated(model, height);
    // iskelet ölçekli modellerde bağlama pozu kutusu yanıltıcı: gerçek (pozlanmış) boya göre düzelt
    const mdl = this.anim.model;
    mdl.updateMatrixWorld(true);
    const pb = new THREE.Box3().setFromObject(mdl, true);
    const ph = pb.max.y - pb.min.y;
    if (ph > 0.01) {
      mdl.scale.multiplyScalar(height / ph);
      mdl.updateMatrixWorld(true);
      const pb2 = new THREE.Box3().setFromObject(mdl, true);
      mdl.position.y -= pb2.min.y;
    }
    this.anim.tint(tint, emissive);
    this.root = this.anim.root;
    scene.add(this.root);
    this.parts.push(this.root);
    this.radius = height * 0.18; this.height = height;
    this.yaw = 0;
    this.state = 'idle'; this.st = 0;
    this.ringA = ring(scene); this.rings.push(this.ringA);
    this.anim.play('Idle', 0);
    combat.addTarget(this);
  }
  nearest() {
    let best = null, bd = 1e9;
    for (const p of players()) { const d = p.pos.distanceTo(this.pos); if (d < bd) { bd = d; best = p; } }
    return best ? { ...best, d: bd } : null;
  }
  behindMul(info, k) {
    if (!info.pos) return 1;
    const a = Math.abs(wrapAngle(Math.atan2(info.pos.x - this.pos.x, info.pos.z - this.pos.z) - this.yaw));
    return a > 2.0 ? k : 1;
  }
  telegraph(cx, cz, r, t, arc = null) {
    const m = this.ringA;
    m.visible = true;
    m.position.set(cx, this.groundAt(cx, cz) + 0.12, cz);
    m.scale.setScalar(r * (0.35 + 0.65 * clamp(this.st / t, 0, 1)));
    m.material.opacity = 0.35 + 0.35 * Math.abs(Math.sin(this.st * 9));
    void arc;
  }
  groundAt(x, z) { return terrain.heightAt(x, z); }
  aoe(cx, cz, r, dmg, cause, opts = {}) {
    for (const p of players()) {
      if (Math.hypot(p.pos.x - cx, p.pos.z - cz) > r) continue;
      if (opts.jumpable && p.ref.onGround === false) continue;
      if (opts.arc !== undefined) {
        const a = Math.abs(wrapAngle(Math.atan2(p.pos.x - this.pos.x, p.pos.z - this.pos.z) - this.yaw));
        if (a > opts.arc) continue;
      }
      hitPlayer(p, dmg, this.pos, cause, { kb: opts.kb || 6, melee: !!opts.melee, unblockable: opts.unblockable });
    }
    effects.dirt(cx, this.groundAt(cx, cz) + 0.2, cz, 20);
    tpCamera.addShake(0.5);
    audio.boom(0.8, _v.set(cx, this.pos.y, cz));
  }
  face(tgt, dt, rate = 3) { if (tgt) this.yaw = dampAngle(this.yaw, Math.atan2(tgt.pos.x - this.pos.x, tgt.pos.z - this.pos.z), rate, dt); }
  place() { this.root.position.copy(this.pos); this.root.rotation.y = this.yaw; }
  netExtra() { return { yw: +this.yaw.toFixed(2), an: this.anim.currentName, s: this.state }; }
  clientUpdate(dt) {
    const s = this.netT;
    this.anim.update(dt);
    if (!s) return;
    this.pos.x = damp(this.pos.x, s.x, 8, dt); this.pos.y = damp(this.pos.y, s.y, 8, dt); this.pos.z = damp(this.pos.z, s.z, 8, dt);
    this.yaw = dampAngle(this.yaw, s.yw, 8, dt);
    if (s.an && this.anim.currentName !== s.an) this.anim.play(s.an, 0.15, { once: /Punch|Weapon|Jump|Wave|Death|Yes|HitReact/.test(s.an) });
    this.place();
  }
}

// TAŞ MUHAFIZ — yumruk, süpürme, kaya fırlatma, tepinme; evre 2'de rün sütunları kalkan verir; sırtındaki kristal zayıf nokta
class StoneGuardian extends GiantBase {
  constructor(site, scene) {
    super('tas_muhafiz', site, scene, 'orc_brute', 6.6, null, 0x0a2830);
    // taş görünümü: gri, hafif mavi parıltı
    this.anim.model.traverse((o) => { if (o.isMesh) { const ms = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ms) { m.color.setHex(0xb4b0a4); m.roughness = 0.95; m.flatShading = true; m.needsUpdate = true; } } });
    const ts = islands.templeState?.[site.temple];
    this.arena = ts ? { x: ts.cx, z: ts.cz, y: ts.y0 } : { x: site.x, z: site.z, y: terrain.heightAt(site.x, site.z) };
    this.pos.set(this.arena.x, this.arena.y, this.arena.z - 4);
    this.yaw = 0;
    // sırt kristali
    const cr = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), new THREE.MeshStandardMaterial({ color: 0x60f0ff, emissive: 0x30c0ff, emissiveIntensity: 1.2 }));
    attachToBone(this, cr, /Torso|Chest|Spine|Body/i, new THREE.Vector3(0, this.height * 0.62, -this.height * 0.14), 1.8);
    this.crystal = cr;
    this.pillars = [];
    this.place();
    G.notify('Taş gözler parladı… TAŞ MUHAFIZ uyandı! Sırtındaki kristal zayıf noktası.', 'boss', 6000);
    audio.play('boss', { vol: 1 });
  }
  groundAt() { return this.arena.y; }
  damageMul(info) {
    let k = this.behindMul(info, 2.2);
    if (this.state === 'stuck') k *= 1.5;
    if (this.pillars.some((p) => p.alive)) k *= 0.2;
    return k;
  }
  onPhase() {
    const f = this.hp / this.maxHp;
    if (this.phase === 1 && f < 0.55) {
      this.phase = 2;
      G.notify('Taş Muhafız rün kalkanını uyandırdı! Üç rün sütununu kır.', 'boss', 5000);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * 6.28 + 0.5;
        const x = this.arena.x + Math.cos(a) * 14, z = this.arena.z + Math.sin(a) * 14;
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1, 4, 6), new THREE.MeshStandardMaterial({ color: 0x5ad8ff, emissive: 0x1a8aff, emissiveIntensity: 1.4, flatShading: true }));
        m.position.set(x, this.arena.y + 2, z); m.castShadow = true;
        this.scene.add(m); this.parts.push(m);
        const pil = { pos: new THREE.Vector3(x, this.arena.y, z), radius: 1.1, height: 4, big: true, alive: true, hp: 90 * (G.online ? 1 + 0.5 * G.remotes.size : 1), mesh: m, bloodColor: [0.4, 0.8, 1], T: { name: 'Rün sütunu' },
          hurt: (dmg) => {
            if (!pil.alive) return null;
            pil.hp -= dmg; effects.sparks(x, this.arena.y + 2, z, 8, [0.5, 0.9, 1]);
            if (pil.hp <= 0) { pil.alive = false; this.scene.remove(m); effects.glitter(x, this.arena.y + 2, z, [0.5, 0.9, 1]); audio.play('gem', { vol: 0.7, rate: 0.6 }); if (!this.pillars.some((p) => p.alive)) G.notify('Rün kalkanı çöktü!', 'good', 2500); }
            return 'hit';
          } };
        combat.addTarget(pil);
        this.pillars.push(pil);
      }
    }
    if (this.phase === 2 && f < 0.25) { this.phase = 3; this.anim.tint(null, 0x103a50); G.notify('Taş Muhafız öfkeyle sarsılıyor!', 'boss', 3000); }
  }
  update(dt) {
    this.t += dt; this.st += dt;
    this.anim.update(dt);
    const tgt = this.nearest();
    const fast = this.phase === 3 ? 1.35 : 1;
    const shield = this.pillars.some((p) => p.alive);
    this.crystal.material.emissiveIntensity = shield ? 0.5 : 2 + Math.sin(this.t * 6) * 0.6;
    if (!this.alive) { this.deadT += dt; if (this.deadT > 1.2 && this.deadT < 3) effects.dirt(this.pos.x + (Math.random() - 0.5) * 4, this.pos.y + 1, this.pos.z + (Math.random() - 0.5) * 4, 4); if (this.deadT > 10) this.remove = true; this.ringA.visible = false; return; }
    switch (this.state) {
      case 'idle': case 'walk': {
        if (!tgt) break;
        this.face(tgt, dt, 2.5);
        this.atkT -= dt;
        if (tgt.d > 4.5 && tgt.d < 40) {
          // arenadan ayrılmaz
          const nx = this.pos.x + Math.sin(this.yaw) * 2.4 * fast * dt, nz = this.pos.z + Math.cos(this.yaw) * 2.4 * fast * dt;
          if (Math.hypot(nx - this.arena.x, nz - this.arena.z) < 24) { this.pos.x = nx; this.pos.z = nz; }
          if (this.anim.currentName !== 'Walk') this.anim.play('Walk', 0.3, { speed: 0.7 * fast });
        } else if (this.anim.currentName !== 'Idle') this.anim.play('Idle', 0.3);
        if (this.atkT <= 0) {
          const r = Math.random();
          if (tgt.d > 11) this._go('throw');
          else if (tgt.d < 5 && r < 0.35) this._go('stomp');
          else if (r < 0.65) this._go('slam');
          else this._go('sweep');
        }
        break;
      }
      case 'slam': {
        const cx = this.pos.x + Math.sin(this.yaw) * 4.2, cz = this.pos.z + Math.cos(this.yaw) * 4.2;
        const T = 1.1 / fast;
        if (this.st < T) { this.face(tgt, dt, 1.2); this.telegraph(cx, cz, 3.6, T); }
        else if (!this.done) { this.done = true; this.ringA.visible = false; this.aoe(cx, cz, 3.6, 46, 'Taş Muhafız seni ezdi', { kb: 8 }); this.state = 'stuck'; this.st = 0; G.notify('Yumruğu yere saplandı — saldır!', 'good', 1500); }
        break;
      }
      case 'stuck': if (this.st > 1.8 / fast) this._go('idle'); break;
      case 'sweep': {
        const T = 0.9 / fast;
        if (this.st < T) { this.face(tgt, dt, 2); this.telegraph(this.pos.x, this.pos.z, 6.5, T); }
        else if (!this.done) { this.done = true; this.ringA.visible = false; this.aoe(this.pos.x, this.pos.z, 6.5, 34, 'Taş Muhafız seni savurdu', { kb: 9, arc: 1.25, melee: true, unblockable: false }); }
        if (this.st > T + 0.7) this._go('idle');
        break;
      }
      case 'stomp': {
        const T = 1.4 / fast;
        if (this.st < T) this.telegraph(this.pos.x, this.pos.z, 7.5, T);
        else if (!this.done) { this.done = true; this.ringA.visible = false; this.aoe(this.pos.x, this.pos.z, 7.5, 30, 'Taş Muhafızın sarsıntısı', { kb: 10, jumpable: true }); G.notify('İpucu: sarsıntı dalgasından zıplayarak kaçabilirsin.', 'info', 1800); }
        if (this.st > T + 0.8) this._go('idle');
        break;
      }
      case 'throw': {
        this.face(tgt, dt, 3);
        if (this.st > 0.9 / fast && !this.done && tgt) {
          this.done = true;
          const to = tgt.pos.clone(); to.y = terrain.heightAt(to.x, to.z);
          enemies.lob({ kind: 'boulder', from: this.pos.clone().add(_v.set(0, this.height * 0.9, 0)), to, time: 1.5, dmg: 38, aoe: 2.6, kb: 7, owner: this, spin: true, scale: 1.4 });
        }
        if (this.st > 1.8) this._go('idle');
        break;
      }
      default: this._go('idle');
    }
    this.place();
  }
  _go(s) {
    this.state = s; this.st = 0; this.done = false;
    const fast = this.phase === 3 ? 1.35 : 1;
    if (s === 'slam') this.anim.play('Punch', 0.1, { once: true, restart: true, speed: 0.75 * fast });
    else if (s === 'sweep') this.anim.play('Weapon', 0.1, { once: true, restart: true, speed: 0.8 * fast });
    else if (s === 'stomp') this.anim.play('Jump', 0.1, { once: true, restart: true, speed: 0.4 * fast });
    else if (s === 'throw') this.anim.play('Wave', 0.1, { once: true, restart: true, speed: 1.2 });
    else if (s === 'idle') { this.atkT = (this.phase === 3 ? 1.2 : 2) * (0.7 + Math.random() * 0.6); this.anim.play('Idle', 0.3); }
  }
  _hitPlayer(id, pl, dmg, mv) { hitPlayer({ id, ref: pl, pos: pl.pos }, dmg, this.pos, 'Taş Muhafızın kayası', { kb: mv?.kb || 6 }); }
  die() {
    super.die();
    this.anim.play('Death', 0.2, { once: true });
    G.emit('loot', { pos: this.pos.clone().add(_v.set(0, 1, 2)), table: this.def.reward, from: this.name });
    for (const p of this.pillars) { this.scene.remove(p.mesh); combat.removeTarget(p); }
  }
  dispose() { super.dispose(); for (const p of this.pillars) combat.removeTarget(p); }
}

// VOLKANİK DEV — lav topu yağmuru (yanan alanlar), ateş halkası şok dalgası, süpürme; atıştan sonra göğüs çekirdeği açığa çıkar
class VolcanicGiant extends GiantBase {
  constructor(site, scene) {
    super('volkanik_dev', site, scene, 'demon', 9.5, 0x5a3a30, 0x601808);
    const I = EXTRA_ISLANDS.find((i) => i.id === site.island);
    this.crater = { x: I ? I.x : site.x, z: I ? I.z : site.z, r: I ? I.r * 0.13 : 60 };
    this.lavaY = islands.built.get(site.island)?.lavas?.[0]?.y ?? terrain.heightAt(this.crater.x, this.crater.z) + 1.5;
    this.pos.set(this.crater.x, this.lavaY - 10, this.crater.z);
    this.rise = 0;
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 10), new THREE.MeshStandardMaterial({ color: 0xffd080, emissive: 0xffa020, emissiveIntensity: 1 }));
    attachToBone(this, core, /Torso|Chest|Spine|Body/i, new THREE.Vector3(0, this.height * 0.6, this.height * 0.12), 1.7);
    this.core = core;
    this.wave = new THREE.Mesh(new THREE.TorusGeometry(1, 0.35, 8, 48), new THREE.MeshBasicMaterial({ color: 0xff6010, transparent: true, opacity: 0.85 }));
    this.wave.rotation.x = Math.PI / 2; this.wave.visible = false;
    scene.add(this.wave); this.parts.push(this.wave);
    G.notify('Lav kabarıyor… VOLKANİK DEV kraterden doğuyor!', 'boss', 6000);
    audio.play('boss', { vol: 1 });
  }
  groundAt(x, z) { return Math.max(terrain.heightAt(x, z), Math.hypot(x - this.crater.x, z - this.crater.z) < this.crater.r ? this.lavaY : -99); }
  damageMul(info) {
    let k = 1;
    if (this.exposed > 0) {
      const a = info.pos ? Math.abs(wrapAngle(Math.atan2(info.pos.x - this.pos.x, info.pos.z - this.pos.z) - this.yaw)) : 0;
      if (a < 1.3) k *= 2.2; // önden, açık çekirdeğe
    }
    if (this.rise < 1) k *= 0.3;
    return k;
  }
  onPhase() {
    const f = this.hp / this.maxHp;
    if (this.phase === 1 && f < 0.6) { this.phase = 2; G.notify('Volkanik Dev kükrüyor — lav yağmuru sıklaşıyor!', 'boss', 3000); }
    if (this.phase === 2 && f < 0.3) { this.phase = 3; G.notify('Krater patlıyor! Gökten ateş yağıyor!', 'boss', 4000); }
  }
  update(dt) {
    this.t += dt; this.st += dt;
    this.anim.update(dt);
    this.exposed = Math.max(0, (this.exposed || 0) - dt);
    this.core.material.emissiveIntensity = this.exposed > 0 ? 4 + Math.sin(this.t * 12) : 1;
    if (Math.random() < 0.5) effects.spawn(this.pos.x + (Math.random() - 0.5) * 4, this.pos.y + Math.random() * this.height, this.pos.z + (Math.random() - 0.5) * 4, 0, 1.5, 0, 1.2, 0.35, 1, 0.45, 0.1, 0.4, 0.5);
    if (!this.alive) { this.deadT += dt; this.pos.y -= dt * 1.2; this.place(); this.wave.visible = false; this.ringA.visible = false; if (this.deadT > 10) this.remove = true; return; }
    // kraterden yükseliş
    if (this.rise < 1) { this.rise = Math.min(1, this.rise + dt * 0.25); this.pos.y = lerp(this.lavaY - 10, this.lavaY - 1.5, this.rise); this.place(); return; }
    const tgt = this.nearest();
    const fast = this.phase >= 2 ? 1.25 : 1;
    // evre 3: gökten ateş yağmuru
    if (this.phase === 3 && (!G.online || G.isHost)) {
      this.metT = (this.metT || 1.5) - dt;
      if (this.metT <= 0 && tgt) {
        this.metT = 1.4;
        const to = tgt.pos.clone().add(_v.set((Math.random() - 0.5) * 10, 0, (Math.random() - 0.5) * 10)); to.y = this.groundAt(to.x, to.z);
        enemies.lob({ kind: 'lava', from: to.clone().add(_v.set(0, 40, 0)), to, time: 1.6, gravity: 9.8, dmg: 26, aoe: 3, owner: this, pool: true });
      }
    }
    switch (this.state) {
      case 'idle': case 'walk': {
        if (!tgt) break;
        this.face(tgt, dt, 1.8);
        this.atkT -= dt;
        if (tgt.d > 9 && tgt.d < 70) {
          const nx = this.pos.x + Math.sin(this.yaw) * 2.6 * fast * dt, nz = this.pos.z + Math.cos(this.yaw) * 2.6 * fast * dt;
          if (Math.hypot(nx - this.crater.x, nz - this.crater.z) < this.crater.r + 30) { this.pos.x = nx; this.pos.z = nz; }
          if (this.anim.currentName !== 'Walk') this.anim.play('Walk', 0.3, { speed: 0.6 * fast });
        } else if (this.anim.currentName !== 'Idle') this.anim.play('Idle', 0.3);
        this.pos.y = this.groundAt(this.pos.x, this.pos.z) - (Math.hypot(this.pos.x - this.crater.x, this.pos.z - this.crater.z) < this.crater.r ? 1.5 : 0);
        if (this.atkT <= 0) {
          const r = Math.random();
          if (tgt.d > 14 || r < 0.4) this._go('barrage');
          else if (r < 0.75) this._go('slam');
          else this._go('sweep');
        }
        break;
      }
      case 'barrage': {
        this.face(tgt, dt, 2);
        const n = this.phase >= 2 ? 5 : 3;
        if ((!G.online || G.isHost) && this.st > 0.6 + (this.thrown || 0) * 0.45 && (this.thrown || 0) < n) {
          this.thrown = (this.thrown || 0) + 1;
          for (const p of players()) {
            const lead = p.ref.vel ? _w.set(p.ref.vel.x, 0, p.ref.vel.z).multiplyScalar(1.2) : _w.set(0, 0, 0);
            const to = p.pos.clone().add(lead).add(_v.set((Math.random() - 0.5) * 4, 0, (Math.random() - 0.5) * 4)); to.y = this.groundAt(to.x, to.z);
            enemies.lob({ kind: 'lava', from: this.pos.clone().add(_v.set(0, this.height * 0.95, 0)), to, time: 1.7, dmg: 34, aoe: 3, kb: 5, owner: this, pool: true });
          }
          this.anim.play('Punch', 0.1, { once: true, restart: true, speed: 1.4 });
        }
        if (this.st > 1 + n * 0.45) { this.exposed = 3.2; G.notify('Devin göğsündeki çekirdek açıldı — önden vur!', 'good', 2000); this._go('idle'); }
        break;
      }
      case 'slam': {
        const T = 1.2 / fast;
        if (this.st < T) { this.face(tgt, dt, 1); this.telegraph(this.pos.x, this.pos.z, 6, T); }
        else {
          if (!this.done) { this.done = true; this.ringA.visible = false; this.waveR = 2; this.wave.visible = true; audio.boom(1, this.pos); tpCamera.addShake(0.6); this.waveHit = new Set(); }
          // genişleyen ateş halkası: zıplayan kaçar
          this.waveR += dt * 16;
          const y = this.groundAt(this.pos.x, this.pos.z) + 0.4;
          this.wave.position.set(this.pos.x, y, this.pos.z);
          this.wave.scale.setScalar(this.waveR);
          this.wave.material.opacity = clamp(1 - this.waveR / 28, 0, 0.85);
          for (const p of players()) {
            const d = Math.hypot(p.pos.x - this.pos.x, p.pos.z - this.pos.z);
            if (!this.waveHit.has(p.id) && Math.abs(d - this.waveR) < 1.2 && p.ref.onGround !== false) { this.waveHit.add(p.id); hitPlayer(p, 30, this.pos, 'Ateş halkası seni yaktı', { kb: 6 }); }
          }
          if (this.waveR > 28) { this.wave.visible = false; this._go('idle'); }
        }
        break;
      }
      case 'sweep': {
        const T = 1.0 / fast;
        if (this.st < T) { this.face(tgt, dt, 2); this.telegraph(this.pos.x, this.pos.z, 9, T); }
        else if (!this.done) { this.done = true; this.ringA.visible = false; this.aoe(this.pos.x, this.pos.z, 9, 40, 'Volkanik Dev seni savurdu', { kb: 11, arc: 1.3, melee: true, unblockable: false }); }
        if (this.st > T + 0.8) this._go('idle');
        break;
      }
      default: this._go('idle');
    }
    this.place();
  }
  _go(s) {
    this.state = s; this.st = 0; this.done = false; this.thrown = 0;
    const fast = this.phase >= 2 ? 1.25 : 1;
    if (s === 'slam') this.anim.play('Jump', 0.1, { once: true, restart: true, speed: 0.45 * fast });
    else if (s === 'sweep') this.anim.play('Weapon', 0.1, { once: true, restart: true, speed: 0.7 * fast });
    else if (s === 'barrage') this.anim.play('Yes', 0.1, { once: true, restart: true, speed: 1.2 });
    else if (s === 'idle') { this.atkT = (this.phase === 3 ? 1.4 : 2.4) * (0.7 + Math.random() * 0.6); this.anim.play('Idle', 0.3); }
  }
  _hitPlayer(id, pl, dmg, mv) { hitPlayer({ id, ref: pl, pos: pl.pos }, dmg, this.pos, 'Lav topu seni yaktı', { kb: mv?.kb || 5 }); }
  die() {
    super.die();
    this.anim.play('Death', 0.2, { once: true });
    const at = this.pos.clone(); at.y = this.groundAt(at.x + 12, at.z) + 1;
    G.emit('loot', { pos: at.set(at.x + 12, at.y, at.z), table: this.def.reward, from: this.name });
  }
}

// ---------------------------------------------------------------------------
// LANETLİ AMİRAL — hayalet gemi yan yatıp yaylım ateşi açar; yarı canında gemiye çatar ve Amiral
// tayfasıyla güverteye çıkar (bordalama). Amiral düşünce lanet kalkar.
// ---------------------------------------------------------------------------
class CursedAdmiral extends BossBase {
  constructor(site, scene) {
    super('lanetli_amiral', site, scene);
    this.radius = 7; this.height = 6;
    this.bloodColor = [0.5, 1, 0.9];
    const ship = G.ship;
    const a = Math.random() * 6.28;
    const gs = new Ship(scene, 'brigantine', { id: 'ghost_ship', name: 'Lanetli Ruh', look: { hull: '#1a3a34', stripe: '#2a6a5a', sail: '#9ad8c0', sailStripe: '#3a6a5a', flag: 'skull' }, x: (ship?.x ?? site.x) + Math.cos(a) * 140, z: (ship?.z ?? site.z) + Math.sin(a) * 140, yaw: a });
    gs.kinematic = true; gs.anchored = false; gs.anchorState = 'up'; gs.anchorT = 0; gs.sail = gs.sailTarget = 1;
    gs.root.traverse((o) => {
      if (!o.isMesh) return;
      const ms = Array.isArray(o.material) ? o.material : [o.material];
      o.material = ms.map((m) => { const c = m.clone(); c.transparent = true; c.opacity = 0.58; c.depthWrite = false; c.color?.lerp(new THREE.Color(0x80ffd0), 0.5); if (c.emissive) { c.emissive.setHex(0x1a6a50); c.emissiveIntensity = 0.8; } return c; });
      if (o.material.length === 1) o.material = o.material[0];
      o.castShadow = false;
    });
    this.gship = gs;
    this.pos.set(gs.x, 2, gs.z);
    this.boarded = false;
    this.volleyT = 6;
    combat.addTarget(this);
    G.notify('Sisin içinden yeşil bir ışık… LANETLİ AMİRAL\'in hayalet gemisi!', 'boss', 6000);
    audio.play('boss', { vol: 1 });
  }
  damageMul(info) { return this.boarded ? 0 : info.kind === 'cannon' || info.kind === 'explosion' ? 1 : 0.35; }
  onPhase() {
    if (!this.boarded && this.hp / this.maxHp < 0.5) this._board();
  }
  _board() {
    const ship = G.ship;
    if (!ship || ship.sunk) return;
    this.boarded = true;
    this.hp = this.maxHp * 0.5;
    G.notify('Hayalet gemi bordaya yanaştı — Lanetli Amiral güverteye çıkıyor!', 'boss', 5000);
    if (!G.online || G.isHost) {
      this.admiral = enemies.spawn('lanetli_amiral', ship.x, ship.z, { ship, lx: 0, lz: -2, role: 'patrol', noLoot: true }); // ödül boss sonunda bir kez
      this.admiral.awareness = 1; this.admiral.target = null;
      for (const lz of [2.5, 4.5]) enemies.spawn('hayalet', ship.x, ship.z, { ship, lx: (Math.random() - 0.5) * 2, lz, role: 'patrol' });
    }
  }
  update(dt) {
    this.t += dt;
    const ship = G.ship && !G.ship.sunk ? G.ship : null;
    const gs = this.gship;
    const host = !G.online || G.isHost;
    if (!this.alive) {
      this.deadT += dt;
      gs.sinking = Math.max(gs.sinking || 0.01, 0.01);
      gs.updateTransform(dt);
      if (this.deadT > 12) this.remove = true;
      return;
    }
    if (ship) {
      const dx = ship.x - gs.x, dz = ship.z - gs.z, d = Math.hypot(dx, dz) || 1;
      let wantYaw, sp;
      if (this.boarded) {
        // bordada: yanına yanaşıp hızına uyar
        if (!this.sideSign) { const lp = ship.worldToLocal(_v.set(gs.x, ship.y, gs.z)); this.sideSign = lp.x >= 0 ? 1 : -1; }
        const side = new THREE.Vector3(Math.cos(ship.yaw), 0, -Math.sin(ship.yaw)).multiplyScalar(this.sideSign * (ship.T.B / 2 + gs.T.B / 2 + 2.5));
        const tx = ship.x + side.x, tz = ship.z + side.z;
        gs.x = damp(gs.x, tx, 1.2, dt); gs.z = damp(gs.z, tz, 1.2, dt);
        gs.yaw = dampAngle(gs.yaw, ship.yaw, 1.5, dt);
        // Amiral düşerse lanet biter
        if (host && this.admiral && !this.admiral.alive) { this.hp = 0; this.die(); }
        if (host && this.admiral && this.admiral.alive) this.hp = this.admiral.hp / this.admiral.maxHp * this.maxHp * 0.5;
      } else {
        // yan yatıp yaylım ateşi için 45 m'lik daire
        const ang = Math.atan2(gs.z - ship.z, gs.x - ship.x) + dt * 0.12;
        const tx = ship.x + Math.cos(ang) * 46, tz = ship.z + Math.sin(ang) * 46;
        wantYaw = Math.atan2(tx - gs.x, tz - gs.z);
        sp = d > 70 ? 11 : 7;
        gs.yaw = dampAngle(gs.yaw, wantYaw, 0.6, dt);
        // hayalet gemi karaya oturmaz: 25 m ilerisi sığ/kara ise açık denize doğru sapar, bir sonraki konum karaysa durur
        if (terrain.heightAt(gs.x + Math.sin(gs.yaw) * 25, gs.z + Math.cos(gs.yaw) * 25) > ocean.tide - 4) gs.yaw = dampAngle(gs.yaw, Math.atan2(gs.x - ship.x, gs.z - ship.z), 1.5, dt);
        const gnx = gs.x + Math.sin(gs.yaw) * sp * dt, gnz = gs.z + Math.cos(gs.yaw) * sp * dt;
        if (terrain.heightAt(gnx, gnz) < ocean.tide - 3) { gs.x = gnx; gs.z = gnz; }
        // yaylım ateşi: yeşil parıltı → hayalet gülleler
        this.volleyT -= dt;
        if (this.volleyT < 1.6 && !this.glow) { this.glow = true; G.notify('Hayalet gemi topları parlıyor — yaylım ateşi geliyor!', 'warn', 1500); }
        if (this.glow && Math.random() < 0.6) {
          const sideSign = Math.sign(Math.sin(Math.atan2(dx, dz) - gs.yaw)) || 1;
          const p = gs.localToWorld(_v.set(sideSign * gs.T.B * 0.55, gs.T.deckY + 0.6, (Math.random() - 0.5) * gs.T.L * 0.7), new THREE.Vector3());
          effects.spawn(p.x, p.y, p.z, 0, 0.6, 0, 0.6, 0.5, 0.5, 1, 0.8, 0, 1);
        }
        if (host && this.volleyT <= 0) {
          this.glow = false;
          this.volleyT = (this.hp / this.maxHp < 0.75 ? 6 : 8) * (0.85 + Math.random() * 0.3);
          const sideSign = Math.sign(Math.sin(Math.atan2(dx, dz) - gs.yaw)) || 1;
          for (let i = 0; i < 4; i++) {
            const from = gs.localToWorld(_v.set(sideSign * gs.T.B * 0.55, gs.T.deckY + 0.8, -gs.T.L * 0.3 + i * gs.T.L * 0.2), new THREE.Vector3());
            const lx = (Math.random() - 0.5) * ship.T.B * 0.7, lz = (Math.random() - 0.5) * ship.T.L * 0.8;
            const to = ship.localToWorld(_v.set(lx, ship.deckAt(lx, lz), lz), new THREE.Vector3());
            enemies.lob({ kind: 'ghostball', from, to, time: 1.4 + i * 0.12, dmg: 14, shipDmg: 5, aoe: 2.2, owner: this, ship });
          }
          audio.boom(1, gs.root.position);
        }
        if (this.t > 75 && host) this._board(); // uzun sürerse yine de çatar
      }
    }
    gs.updateTransform(dt);
    this.pos.set(gs.x, gs.y + 3, gs.z);
  }
  _hitPlayer(id, pl, dmg) { hitPlayer({ id, ref: pl, pos: pl.pos }, dmg, this.pos, 'Hayalet gülle', { kb: 4 }); }
  die() {
    if (!this.alive) return;
    super.die();
    for (const e of enemies.list) if (e.ship && e.T.faction === 'hayalet' && e.alive) { e.noLoot = true; e.applyDamage(9999, {}); } // temizlik: ganimet/XP yok
    G.player.inv.gold += 0;
  }
  dispose() { super.dispose(); this.gship.dispose(); }
  netExtra() { return { gx: +this.gship.x.toFixed(1), gz: +this.gship.z.toFixed(1), gy: +this.gship.yaw.toFixed(2), b: this.boarded ? 1 : 0 }; }
  clientUpdate(dt) {
    const s = this.netT;
    const gs = this.gship;
    if (s) { gs.x = damp(gs.x, s.gx, 5, dt); gs.z = damp(gs.z, s.gz, 5, dt); gs.yaw = dampAngle(gs.yaw, s.gy, 5, dt); this.boarded = !!s.b; }
    if (!this.alive) gs.sinking = Math.max(gs.sinking || 0.01, 0.01);
    gs.updateTransform(dt);
    this.pos.set(gs.x, gs.y + 3, gs.z);
  }
}

const CLASSES = { kraken: Kraken, derinlik_yilani: SeaSerpent, tas_muhafiz: StoneGuardian, volkanik_dev: VolcanicGiant, lanetli_amiral: CursedAdmiral };

// ---------------------------------------------------------------------------
export const bosses = {
  name: 'bosses',
  saveKey: 'bosses',
  active: null,
  defeated: {},
  checkT: 0,

  init(scene) {
    this.scene = scene;
    G.on('netHurtBossApply', (m) => {
      const b = this.active;
      if (!b || b.id !== m.id) return;
      if (m.ten !== undefined && b.tentacles?.[m.ten]) b._hurtTentacle(b.tentacles[m.ten], m.dmg, {});
      else b.applyDamage(m.dmg, { kind: m.kind, pos: m.pos ? new THREE.Vector3(...m.pos) : null });
    });
  },
  start(data) {
    this._clear();
    this.defeated = { ...(data?.bosses?.defeated || {}) };
  },
  stop() { this._clear(); },
  save() { return { defeated: this.defeated }; },
  _clear() { if (this.active) { this.active.dispose(); this.active = null; } },

  spawn(id, site = null) {
    if (this.active) return this.active;
    const s = site || BOSS_SITES.find((b) => b.id === id) || { id, x: G.player.pos.x + 30, z: G.player.pos.z };
    const C = CLASSES[id];
    if (!C) return null;
    this.active = new C(s, this.scene);
    G.emit('bossSpawn', { enemy: this.active });
    return this.active;
  },

  victory(b) {
    this.defeated[b.id] = true;
    const def = b.def;
    // deniz bossları: ganimet doğrudan ambara/çantaya
    if (def.sea) {
      G.emit('loot', { pos: (G.ship ? new THREE.Vector3(G.ship.x, G.ship.y + 2, G.ship.z) : G.player.pos.clone()), table: def.reward, from: def.name });
    }
    G.emit('bossDefeated', { id: b.id, name: def.name });
    time.addLog(`${def.name} (${def.title}) yenildi`, 'boss');
  },

  _check() {
    const p = G.player;
    if (!p) return;
    const pts = [p, ...G.remotes.values()].filter((x) => x && !x.dead);
    for (const site of BOSS_SITES) {
      if (this.defeated[site.id] || this.active) continue;
      const def = BOSS_DEFS[site.id];
      if (!def) continue;
      let trig = false;
      for (const q of pts) {
        const d = Math.hypot(q.pos.x - site.x, q.pos.z - site.z);
        if (site.id === 'tas_muhafiz') { const ts = islands.templeState?.[site.temple]; trig = trig || (ts && ts.state.done && d < 26 && Math.abs(q.pos.y - ts.y0) < 8); }
        else if (site.id === 'volkanik_dev') { const I = EXTRA_ISLANDS.find((i) => i.id === site.island); trig = trig || (I && Math.hypot(q.pos.x - I.x, q.pos.z - I.z) < I.r * 0.24); }
        else if (def.sea) trig = trig || (d < 240 && G.ship && !G.ship.sunk && (q.mode === 'deck' || q.mode === 'helm' || q.mode === 'cannon' || q.mode === 'swim'));
      }
      if (trig) { this.spawn(site.id, site); break; }
    }
    // herkes uzaklaştıysa boss geri çekilir (canı yenilenir)
    const b = this.active;
    if (b && b.alive) {
      const far = pts.every((q) => Math.hypot(q.pos.x - b.pos.x, q.pos.z - b.pos.z) > 650);
      if (far) { G.notify(`${b.name} derinlere çekildi…`, 'info', 3000); this._clear(); }
    }
  },

  update(dt) {
    if (G.state !== 'playing') return;
    const host = !G.online || G.isHost;
    if (host) {
      this.checkT -= dt;
      if (this.checkT <= 0) { this.checkT = 0.5; this._check(); }
    }
    const b = this.active;
    if (!b) return;
    if (host) b.update(dt); else b.clientUpdate?.(dt);
    if (b.remove) { b.dispose(); this.active = null; G.emit('bossBar', null); return; }
    if (b.alive) G.emit('bossBar', { name: b.name, hp: b.hp / b.maxHp });
    if (b.alive) combat.markCombat();
  },

  // ağ (oda sahibi → konuklar)
  netSnapshot() { return this.active ? this.active.net() : null; },
  applySnapshot(s) {
    if (!s) { if (this.active) this._clear(); return; }
    if (!this.active || this.active.id !== s.id) { this._clear(); this.spawn(s.id, BOSS_SITES.find((b) => b.id === s.id)); }
    this.active?.applyNet(s);
  },
};
void sky;
