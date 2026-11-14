import * as THREE from 'three';
import { G } from '../game/ctx.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import { engine } from '../core/engine.js';
import { effects } from '../game/effects.js';
import { combat } from '../game/combat.js';
import { tpCamera } from '../player/camera.js';
import { ocean } from '../world/ocean.js';
import { terrain } from '../world/terrain.js';
import { physics } from '../world/physics.js';
import { props } from '../world/props.js';
import { interact } from '../game/interact.js';
import { sky } from '../world/sky.js';
import { regionAt } from '../world/worldData.js';
import { ITEMS } from '../economy/items.js';
import { FISH, fish, fishInRegion } from './fish.js';
import { fishing } from './fishing.js';
import { clamp, lerp } from '../core/util.js';

// Deniz ekipmanı:
//  - Zıpkın (6): su altında ya da kıyıdan/güverteden nişangâha doğru fırlatılır; yoldaki balığı vurur (çantaya), köpekbalığı
//    gibi savaş hedeflerine hasar verir, ipiyle geri çekilir.
//  - Balık ağı (7): kıyıdan/güverteden basılı tutup bırakınca suya atılır, batar, toplanır; içine giren sürü balıkları (en çok 6)
//    ya da sürü yoksa şansa bağlı birkaç kıyı balığı çıkar. Her atışta küçük yırtılma olasılığı.
//  - Dalış maskesi / yüzme paleti: çantada durdukça nefes ×1,6 ve su altı görüşü / yüzme hızı ×1,35 (player._updateSwim okur).
//  - Hava kesesi: nefes tükenmek üzereyken kendiliğinden kullanılır (+45), envanterden de kullanılabilir.
// Balıklar yerel benzetimdir (her istemcinin kendi sürüleri); yakalanan balık yerel oyuncunun çantasına girer (olta gibi).

const NET_R = 2.6; // açılmış ağın yarıçapı (m)
const NET_MAX = 6; // bir atışta en çok balık
const NET_TEAR = 0.05; // her toplayışta yırtılma olasılığı
const UP = new THREE.Vector3(0, 1, 0);
const _a = new THREE.Vector3(), _d = new THREE.Vector3(), _h = new THREE.Vector3(), _o = new THREE.Vector3();

function makeSpear() {
  // uç yerel başlangıçta (0,0,0), sap -Y yönünde: konum = uç noktası
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: '#7a5230', roughness: 0.85 });
  const metal = new THREE.MeshStandardMaterial({ color: '#b4bcc4', metalness: 0.7, roughness: 0.35 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.02, 1.3, 6), wood);
  shaft.position.y = -0.75;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.2, 6), metal);
  tip.position.y = -0.1;
  const barbA = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.09, 4), metal);
  barbA.position.set(0.03, -0.2, 0); barbA.rotation.z = Math.PI * 0.82;
  const barbB = barbA.clone(); barbB.position.x = -0.03; barbB.rotation.z = -Math.PI * 0.82;
  // uca takılan balık (vurulunca türün renginde görünür)
  const caught = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 6), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5 }));
  caught.position.y = -0.18;
  caught.visible = false;
  g.add(shaft, tip, barbA, barbB, caught);
  g.userData.caught = caught;
  g.traverse((c) => { if (c.isMesh) c.castShadow = true; });
  return g;
}

function makeNetMesh() {
  // birim yarıçaplı ağ: 12 ışınsal ip + 4 halka (çizgi parçaları) ve kenarda turuncu şamandıralar
  const g = new THREE.Group();
  const pts = [];
  const RAYS = 12, RINGS = 4, SEG = 24;
  for (let i = 0; i < RAYS; i++) { const a = (i / RAYS) * Math.PI * 2; pts.push(0, 0, 0, Math.cos(a), 0, Math.sin(a)); }
  for (let r = 1; r <= RINGS; r++) {
    const rr = r / RINGS;
    for (let i = 0; i < SEG; i++) {
      const a0 = (i / SEG) * Math.PI * 2, a1 = ((i + 1) / SEG) * Math.PI * 2;
      pts.push(Math.cos(a0) * rr, 0, Math.sin(a0) * rr, Math.cos(a1) * rr, 0, Math.sin(a1) * rr);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xe2d4ac, transparent: true, opacity: 0.9 }));
  lines.frustumCulled = false;
  g.add(lines);
  const fl = new THREE.MeshStandardMaterial({ color: '#d0602a', roughness: 0.6 });
  const fgeo = new THREE.SphereGeometry(0.06, 6, 4);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const f = new THREE.Mesh(fgeo, fl);
    f.position.set(Math.cos(a), 0.02, Math.sin(a));
    g.add(f);
  }
  return g;
}

// ağa girebilecek kıyı balıkları (sürü yokken): küçük, sıradan/yaygın, yırtıcı olmayan, bölgeye ve derinliğe uygun türler
function netSpecies(pos, depth) {
  const reg = regionAt(pos.x, pos.z);
  const keys = Object.keys(FISH).filter((k) => {
    const f = FISH[k];
    return f.weight[1] <= 3 && (f.rarity === 'siradan' || f.rarity === 'yaygin') && !f.predator && f.depth[0] <= depth + 1 && fishInRegion(k, reg);
  });
  return keys.length ? keys : ['sardalya'];
}

export const seagear = {
  name: 'seagear',

  init(scene) {
    this.scene = scene;
    this.spear = makeSpear();
    this.spear.visible = false;
    scene.add(this.spear);
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(12 * 3), 3));
    this.rope = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: 0xd8c08a, transparent: true, opacity: 0.85 }));
    this.rope.frustumCulled = false;
    this.rope.visible = false;
    scene.add(this.rope);
    this.netMesh = makeNetMesh();
    this.netMesh.visible = false;
    scene.add(this.netMesh);
    this.hints = {};
    this.wreckOpened = false;
    // Martı Batığı'ndaki sandık: dalınca E ile açılır (oturum başına bir kez), içerik doğrudan çantaya gider
    interact.addProvider((ctx, out) => {
      const c = props.wreckChest;
      const p = ctx.player;
      if (!c || this.wreckOpened || p.mode !== 'swim') return;
      const d = p.pos.distanceTo(c);
      if (d > 3.5) return;
      out.push({ id: 'wreckchest', pos: c, dist: d, priority: 1, label: 'Batık sandığını aç', action: () => this.openWreck(p) });
    });
    this.reset();
  },

  start() { this.reset(); this.wreckOpened = false; },

  openWreck(p = G.player) {
    const c = props.wreckChest;
    if (!c || this.wreckOpened) return false;
    this.wreckOpened = true;
    // içerik doğrudan çantaya (önce kese yüzeye süzülüyordu, nefes biterken yüzeyde ayrıca aranıyordu); sığmayan kısım kese olarak yüzer
    G.emit('lootToBag', { pos: c.clone().add(_o.set(0, 0.6, 0)), table: [['altin_para', 60, 140], ['dalis_maskesi', 0.6], ['palet', 0.5], ['hava_kesesi', 1, 2], ['zipkin', 0.35], ['inci', 0.5]], from: 'Batık sandığı' });
    effects.bubbles(c.x, c.y + 0.5, c.z);
    audio.play('coin', { vol: 0.6 });
    return true;
  },
  stop() { this.reset(); sky.maskClear = false; },

  reset() {
    this.h = { state: 'idle', cd: 0 }; // zıpkın
    this.n = { state: 'idle', power: 0 }; // ağ
    this._gearT = 0;
    this._lastMode = null;
    if (this.spear) { this.spear.visible = false; this.spear.userData.caught.visible = false; }
    if (this.rope) this.rope.visible = false;
    if (this.netMesh) this.netMesh.visible = false;
    const p = G.player;
    if (p?.char?.held) p.char.held.visible = true;
  },

  update(dt) {
    const p = G.player;
    if (!p) return;
    // çantadaki donanım: 0,5 s'de bir okunur (envanter taraması her karede yapılmaz)
    this._gearT -= dt;
    if (this._gearT <= 0) {
      this._gearT = 0.5;
      const st = p.inv.stacks;
      let air = 0;
      for (const s of st) if (s.id === 'hava_kesesi') air += s.n || 1;
      p.gear = { mask: st.some((s) => s.id === 'dalis_maskesi'), fins: st.some((s) => s.id === 'palet'), air };
    }
    sky.maskClear = !!p.gear?.mask && p.mode === 'swim';
    // ilk kez suya girince dalış ipucu (oturumda bir kez)
    if (p.mode === 'swim' && this._lastMode !== 'swim' && !this.hints.swim) {
      this.hints.swim = true;
      const br = Math.round(50 * (G.mods?.breath || 1) * (p.gear?.mask ? 1.6 : 1));
      G.notify(`Dalmak için ${this._key('egil')} basılı tut, çıkmak için ${this._key('zipla')} · nefes ≈ ${br} sn`, 'info', 6000);
    }
    this._lastMode = p.mode;
    // hava kesesi: nefes tükenmek üzereyken kendiliğinden
    if (p.mode === 'swim' && p.underwater && p.oxygen < 12 && p.gear?.air > 0 && !p.dead) this.useAir(p, true);
    this._updateHarpoon(dt, p);
    this._updateNet(dt, p);
  },

  _key(action) {
    const c = input.bindings[action] || '';
    return c.startsWith('Key') ? c.slice(3) : c === 'Space' ? 'Boşluk' : c;
  },

  // Hava kesesi kullan (auto: nefes azalınca kendiliğinden). true: kullanıldı
  useAir(p = G.player, auto = false) {
    if (!p.inv.has('hava_kesesi')) return false;
    if (!(p.mode === 'swim' && p.underwater)) { if (!auto) G.notify('Hava kesesi su altında kullanılır.', 'warn', 2000); return false; }
    p.inv.remove('hava_kesesi', 1);
    if (p.gear) p.gear.air = Math.max(0, (p.gear.air || 1) - 1);
    p.oxygen = Math.min(100, p.oxygen + ITEMS.hava_kesesi.air);
    const hp = this._handPos(p, _h);
    effects.bubbles(hp.x, hp.y + 0.3, hp.z);
    audio.play('confirm', { vol: 0.3, rate: 0.8 });
    G.notify(`Hava kesesinden nefes aldın (+${ITEMS.hava_kesesi.air}). Kalan: ${p.inv.count('hava_kesesi')}`, 'info', 2500);
    return true;
  },

  _handPos(p, out) {
    const hr = p.char?.handR;
    if (hr) { hr.getWorldPosition(out); return out; }
    return out.copy(p.pos).add(_o.set(Math.sin(p.yaw) * 0.4, p.mode === 'swim' ? 1.0 : 1.4, Math.cos(p.yaw) * 0.4));
  },

  // ---------------- Zıpkın ----------------
  harpoonDef(p = G.player) { return p.inv.has('usta_zipkin') ? ITEMS.usta_zipkin.harpoon : ITEMS.zipkin.harpoon; },

  _updateHarpoon(dt, p) {
    const h = this.h;
    h.cd = Math.max(0, h.cd - dt);
    if (h.state === 'idle') {
      const ready = p.equipped === 'harpoon' && (p.mode === 'swim' || p.mode === 'ground' || p.mode === 'deck') && !p.carrying && !G.uiOpen && !p.dead && !p.downed && !p.busy;
      if (ready && !this.hints.harpoon) { this.hints.harpoon = true; G.notify('Zıpkın: sağ tık nişan, sol tık fırlat. Su altında balığa, kıyıdan/güverteden suya atabilirsin.', 'info', 5500); }
      if (ready && h.cd <= 0 && input.pressed('saldiri')) this.fire(p);
      return;
    }
    if (h.state === 'fly') this._flySpear(dt, p);
    else if (h.state === 'back') this._retract(dt, p);
    if (h.state !== 'idle') this._drawRope(p);
  },

  // dir verilmezse nişangâh (kamera ışını) yönünde fırlatılır
  fire(p = G.player, dir = null) {
    const def = this.harpoonDef(p);
    const h = this.h;
    const hand = this._handPos(p, _h).clone();
    if (!dir) {
      const cam = engine.camera;
      cam.getWorldDirection(_d);
      const reach = cam.position.distanceTo(hand) + def.range;
      dir = _a.copy(cam.position).addScaledVector(_d, reach).sub(hand).normalize().clone();
    }
    const under = hand.y < ocean.heightAt(hand.x, hand.z);
    h.state = 'fly';
    h.pos = hand.clone(); h.prev = hand.clone();
    h.vel = dir.clone().normalize().multiplyScalar(under ? 20 : 24);
    h.travel = 0; h.range = def.range; h.dmg = def.dmg * (G.mods?.melee || 1); h.cd = def.reload;
    h.wet = under;
    this.spear.visible = true;
    this.spear.userData.caught.visible = false;
    this.rope.visible = true;
    if (p.char.held) p.char.held.visible = false;
    if (p.mode !== 'swim') p.startAction('throw', 0.45);
    audio.tone(300, 0.2, 'triangle', 0.05, null, 1.8);
    if (under) effects.bubbles(hand.x, hand.y, hand.z);
    this._orientSpear(h.vel);
  },

  _flySpear(dt, p) {
    const h = this.h;
    h.prev.copy(h.pos);
    const wasWet = h.pos.y < ocean.heightAt(h.pos.x, h.pos.z);
    if (wasWet) h.vel.multiplyScalar(Math.exp(-1.2 * dt)); // su direnci
    else h.vel.y -= 9.8 * dt; // havada yerçekimi
    h.pos.addScaledVector(h.vel, dt);
    const seg = h.pos.distanceTo(h.prev);
    h.travel += seg;
    const wy = ocean.heightAt(h.pos.x, h.pos.z);
    if (!wasWet && h.pos.y < wy) { effects.splash(h.pos.x, h.pos.z, 0.35); audio.splash(0.15); }
    // balık (en yakın vurulan)
    const f = this._sweepFish(h.prev, h.pos);
    if (f) { this._hitFish(p, f); return; }
    // savaş hedefleri (köpekbalığı vb.)
    if (seg > 1e-4) {
      _d.copy(h.pos).sub(h.prev).divideScalar(seg);
      const res = combat.raycast(h.prev, _d, seg, p);
      if (res) {
        res.target.hurt(h.dmg, { kind: 'harpoon', pos: p.pos, by: G.myId });
        effects.sparks(res.point.x, res.point.y, res.point.z, 8, res.target.bloodColor || [0.75, 0.1, 0.1]);
        G.emit('hitMarker');
        combat.markCombat();
        h.pos.copy(res.point);
        this._startBack();
        return;
      }
    }
    // zemin / çarpıştırıcı / menzil sonu
    const ground = terrain.heightAt(h.pos.x, h.pos.z);
    const hitGround = h.pos.y < ground + 0.05;
    if (hitGround || physics.lineBlocked(h.prev.x, h.prev.y, h.prev.z, h.pos.x, h.pos.y, h.pos.z) || h.travel >= h.range || h.vel.lengthSq() < 16) {
      if (hitGround) { h.pos.y = ground + 0.05; if (h.pos.y < wy) effects.bubbles(h.pos.x, h.pos.y, h.pos.z); else effects.dirt(h.pos.x, h.pos.y, h.pos.z, 4); }
      this._startBack();
      return;
    }
    this._orientSpear(h.vel);
  },

  // a→b doğru parçasına değen ilk canlı balık
  _sweepFish(a, b) {
    const abx = b.x - a.x, aby = b.y - a.y, abz = b.z - a.z;
    const L2 = abx * abx + aby * aby + abz * abz;
    if (L2 < 1e-8) return null;
    let best = null, bestT = 2;
    for (const s of fish.schools) {
      const cx = s.center.x - a.x, cz = s.center.z - a.z;
      if (cx * cx + cz * cz > 900) continue; // 30 m'den uzak sürüler
      for (const m of s.members) {
        if (!m.alive) continue;
        const px = m.p.x - a.x, py = m.p.y - a.y, pz = m.p.z - a.z;
        let t = (px * abx + py * aby + pz * abz) / L2;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        const dx = px - abx * t, dy = py - aby * t, dz = pz - abz * t;
        const r = 0.28 + m.size * 0.45;
        if (dx * dx + dy * dy + dz * dz < r * r && t < bestT) { bestT = t; best = { s, m }; }
      }
    }
    return best;
  },

  _hitFish(p, hit) {
    const { s, m } = hit;
    const h = this.h;
    m.alive = false;
    h.pos.copy(m.p);
    effects.bubbles(m.p.x, m.p.y, m.p.z);
    effects.sparks(m.p.x, m.p.y, m.p.z, 6, [0.75, 0.08, 0.08]);
    const sp = s.sp;
    // ağırlık balığın boyuna göre (büyük örnek ağır)
    const k = clamp((m.size / sp.len - 0.75) / 0.5, 0, 1);
    const w = lerp(sp.weight[0], sp.weight[1], k);
    const data = fishing.makeCatch(s.key, w, m.p, 'Zıpkın');
    const cm = this.spear.userData.caught;
    cm.material.color.set(sp.colors[0]);
    cm.scale.set(m.size * 0.25, m.size * 0.5, m.size * 0.12).multiplyScalar(2);
    cm.visible = true;
    const where = fishing.store(data);
    if (where) {
      G.notify(`Zıpkınla ${data.name} vurdun! ${data.len} cm, ${data.weight} kg → ${where}`, 'good', 4000);
      audio.play('level_up', { vol: 0.35 });
      G.emit('fishCaught', { data, how: 'harpoon' });
    } else {
      G.notify(`${data.name} vurdun ama çantan dolu — balık suya karıştı.`, 'warn');
      G.emit('fishCaught', { data, released: true });
    }
    this.lastCatch = data;
    this._startBack();
  },

  _startBack() {
    const h = this.h;
    h.state = 'back';
    h.backT = 0;
    h.from = h.pos.clone();
  },

  _retract(dt, p) {
    const h = this.h;
    h.backT += dt;
    const k = Math.min(1, h.backT / 0.35);
    const hand = this._handPos(p, _h);
    h.pos.lerpVectors(h.from, hand, k * k);
    _d.copy(h.pos).sub(hand);
    if (_d.lengthSq() > 0.01) this._orientSpear(_d); else this.spear.position.copy(h.pos);
    if (k >= 1) this._endHarpoon(p);
  },

  _endHarpoon(p) {
    this.h.state = 'idle';
    this.spear.visible = false;
    this.spear.userData.caught.visible = false;
    this.rope.visible = false;
    if (p.char?.held) p.char.held.visible = true;
  },

  _orientSpear(dir) {
    this.spear.position.copy(this.h.pos);
    _o.copy(dir);
    if (_o.lengthSq() > 1e-8) this.spear.quaternion.setFromUnitVectors(UP, _o.normalize());
  },

  _drawRope(p) {
    const hand = this._handPos(p, _h);
    const tail = _a.set(0, -1.4, 0).applyQuaternion(this.spear.quaternion).add(this.spear.position);
    const arr = this.rope.geometry.attributes.position;
    const n = arr.count;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      arr.setXYZ(i, lerp(hand.x, tail.x, t), lerp(hand.y, tail.y, t) - Math.sin(t * Math.PI) * 0.25, lerp(hand.z, tail.z, t));
    }
    arr.needsUpdate = true;
  },

  // ---------------- Balık ağı ----------------
  _updateNet(dt, p) {
    const n = this.n;
    const usable = p.equipped === 'net' && (p.mode === 'ground' || p.mode === 'deck') && !p.carrying && !G.uiOpen && !p.dead && !p.downed && !p.busy;
    if (n.state === 'idle' || n.state === 'charge') {
      if (!usable) { if (n.state === 'charge') { n.state = 'idle'; G.emit('fishingHud', null); } return; }
      if (!this.hints.net) { this.hints.net = true; G.notify('Balık ağı: sol tıkı basılı tut, bırakınca suya atılır. Sürünün üstüne düşerse birkaç balık çıkar.', 'info', 5500); }
    }
    switch (n.state) {
      case 'idle':
        if (input.pressed('saldiri')) { n.state = 'charge'; n.power = 0; }
        break;
      case 'charge':
        n.power = Math.min(1, n.power + dt * 1.1);
        G.emit('fishingHud', { mode: 'charge', power: n.power, title: 'Ağ atışı', help: 'Bırak: ağı at · uzaklık basılı tutma süresine bağlı' });
        if (!input.isDown('saldiri')) this.throwNet(p, n.power);
        break;
      case 'fly': {
        n.t += dt;
        const k = Math.min(1, n.t / 0.6);
        this.netMesh.position.lerpVectors(n.from, n.to, k);
        this.netMesh.position.y += Math.sin(k * Math.PI) * 2.2;
        this.netMesh.scale.setScalar(lerp(0.25, NET_R, k));
        this.netMesh.rotation.y += dt * 3;
        if (k >= 1) this._netLand(p);
        break;
      }
      case 'sink': {
        n.t += dt;
        const k = Math.min(1, n.t / 2.2);
        const wy = ocean.heightAt(n.to.x, n.to.z);
        this.netMesh.position.set(n.to.x, wy - k * Math.max(0.2, Math.min(2.2, n.depth - 0.3)), n.to.z);
        if (k >= 1) this._netHaul(p);
        break;
      }
      case 'haul': {
        n.t += dt;
        const k = Math.min(1, n.t / 1.1);
        const hand = this._handPos(p, _h);
        this.netMesh.position.lerpVectors(n.haulFrom, hand, k * k);
        this.netMesh.scale.setScalar(lerp(NET_R, 0.3, k));
        if (k >= 1) this._netDone(p);
        break;
      }
    }
  },

  // power 0..1 → 3..10 m; ağ kameranın baktığı yöne atılır
  throwNet(p = G.player, power = 0.5) {
    const n = this.n;
    p.yaw = tpCamera.yaw;
    const dist = 3 + clamp(power, 0, 1) * 7;
    const dir = _d.set(Math.sin(p.yaw), 0, Math.cos(p.yaw));
    n.from = p.pos.clone().add(_a.set(0, 1.5, 0)).addScaledVector(dir, 0.5);
    n.to = p.pos.clone().addScaledVector(dir, dist);
    n.to.y = ocean.heightAt(n.to.x, n.to.z);
    n.t = 0;
    n.state = 'fly';
    this.netMesh.visible = true;
    this.netMesh.scale.setScalar(0.25);
    this.netMesh.position.copy(n.from);
    if (p.char.held) p.char.held.visible = false;
    p.startAction('throw', 0.5);
    audio.tone(380, 0.22, 'triangle', 0.04, null, 1.6);
    G.emit('fishingHud', null);
  },

  _netLand(p) {
    const n = this.n;
    const b = n.to;
    const floor = terrain.heightAt(b.x, b.z);
    const solid = physics.floorAt(b.x, b.z, b.y + 0.5); // iskele/platform güvertesi dahil
    if (solid > b.y - 0.4) {
      G.notify('Ağ suya ulaşmadı — suya daha yakın dur ya da daha uzağa at.', 'warn');
      this._netDone(p);
      return;
    }
    effects.splash(b.x, b.z, 0.7);
    audio.splash(0.3);
    n.depth = b.y - floor;
    n.state = 'sink';
    n.t = 0;
    G.emit('fishingHud', { mode: 'net', title: 'Ağ batıyor…', help: 'Birazdan kendiliğinden toplanır' });
  },

  _netHaul(p) {
    const n = this.n;
    const c = this.netMesh.position;
    const R = NET_R + 0.4;
    const got = [];
    // ağın altına giren sürü balıkları (büyük ve yırtıcı türler ağdan kaçar)
    for (const s of fish.schools) {
      if (got.length >= NET_MAX) break;
      if (s.sp.len > 0.9 || s.sp.predator || s.sp.big) continue;
      const cx = s.center.x - c.x, cz = s.center.z - c.z;
      if (cx * cx + cz * cz > 900) continue;
      for (const m of s.members) {
        if (!m.alive || got.length >= NET_MAX) continue;
        const dx = m.p.x - c.x, dz = m.p.z - c.z;
        if (dx * dx + dz * dz < R * R && m.p.y > c.y - 3.5 && m.p.y < c.y + 1.5) {
          m.alive = false;
          got.push({ key: s.key, k: clamp((m.size / s.sp.len - 0.75) / 0.5, 0, 1) });
        }
      }
    }
    n.fromSchool = got.length;
    // sürü yoksa: şansa bağlı 1-2 kıyı balığı
    if (!got.length && Math.random() < 0.55) {
      const keys = netSpecies(c, n.depth);
      const cnt = Math.random() < 0.35 ? 2 : 1;
      for (let i = 0; i < cnt; i++) got.push({ key: keys[Math.floor(Math.random() * keys.length)], k: Math.pow(Math.random(), 1.6) });
    }
    const names = new Map();
    let stored = 0, lost = 0;
    for (const g of got) {
      const f = FISH[g.key];
      const data = fishing.makeCatch(g.key, lerp(f.weight[0], f.weight[1], g.k), c, 'Ağ');
      if (fishing.store(data)) { stored++; names.set(f.name, (names.get(f.name) || 0) + 1); G.emit('fishCaught', { data, how: 'net' }); }
      else { lost++; G.emit('fishCaught', { data, released: true }); }
    }
    this.lastHaul = { caught: stored, lost, fromSchool: n.fromSchool };
    if (stored) {
      const list = [...names].map(([nm, k]) => (k > 1 ? `${nm} ×${k}` : nm)).join(', ');
      G.notify(`Ağdan ${stored} balık çıktı: ${list}${lost ? ` (${lost} tanesine çantada yer yoktu)` : ''}`, 'good', 4500);
      audio.play('level_up', { vol: 0.35 });
    } else if (lost) G.notify('Ağ doldu ama çantanda yer yok — balıkları geri bıraktın.', 'warn');
    else G.notify('Ağ boş çıktı. Sürülerin üstüne atmayı dene: balıklar kıyıdan biraz açıkta, derin suda dolaşır.', 'info', 4000);
    effects.splash(c.x, c.z, 0.5);
    n.state = 'haul';
    n.t = 0;
    n.haulFrom = c.clone();
    G.emit('fishingHud', null);
  },

  _netDone(p) {
    const n = this.n;
    const thrown = n.state === 'haul';
    n.state = 'idle';
    this.netMesh.visible = false;
    if (p.char?.held) p.char.held.visible = true;
    G.emit('fishingHud', null);
    // yırtılma
    if (thrown && Math.random() < (this.tearChance ?? NET_TEAR)) {
      p.inv.remove('balik_agi', 1);
      G.notify(p.inv.has('balik_agi') ? 'Ağlarından biri yırtıldı!' : 'Ağın yırtıldı! Yenisini Balıkçı Yusuf\'tan alabilirsin.', 'warn', 4000);
      if (!p.inv.has('balik_agi') && p.equipped === 'net') p.equip('none');
    }
  },
};
