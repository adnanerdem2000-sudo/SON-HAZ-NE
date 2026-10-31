import * as THREE from 'three';
import { G } from '../game/ctx.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import { effects } from '../game/effects.js';
import { ocean } from '../world/ocean.js';
import { terrain } from '../world/terrain.js';
import { sky } from '../world/sky.js';
import { FISH, fish } from './fish.js';
import { ITEMS } from '../economy/items.js';
import { time } from '../world/time.js';
import { clamp, damp, lerp } from '../core/util.js';

const BAIT_ORDER = ['yem_solucan', 'yem_karides', 'yem_yapay'];

// Balık tutma: atış → bekleme → vuruş → ip gerginliği mücadelesi → yakalama
export const fishing = {
  name: 'fishing',
  state: 'idle',
  bait: 'yem_solucan',

  init(scene) {
    this.scene = scene;
    this.bobber = new THREE.Group();
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xd02a2a }));
    const bot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xf2f2f2 }));
    this.bobber.add(top, bot);
    this.bobber.visible = false;
    scene.add(this.bobber);
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(16 * 3), 3));
    this.line = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: 0xeeeeee, transparent: true, opacity: 0.8 }));
    this.line.frustumCulled = false;
    this.line.visible = false;
    scene.add(this.line);
  },

  start() { this.reset(); },
  stop() { this.reset(); },

  reset() {
    this.state = 'idle';
    this.power = 0;
    if (this.bobber) this.bobber.visible = false;
    if (this.line) this.line.visible = false;
    if (G.player) G.player.fishing = false;
    G.emit('fishingHud', null);
  },

  rodStats() {
    const p = G.player;
    return p.inv.has('usta_olta') ? ITEMS.usta_olta.rod : ITEMS.olta.rod;
  },

  cycleBait() {
    const p = G.player;
    const owned = BAIT_ORDER.filter((b) => p.inv.has(b));
    if (!owned.length) { G.notify('Hiç yemin yok! Balıkçı Yusuf\'tan yem al.', 'warn'); return; }
    const i = owned.indexOf(this.bait);
    this.bait = owned[(i + 1) % owned.length];
    G.notify(`Yem: ${ITEMS[this.bait].name} (${p.inv.count(this.bait)})`, 'info', 1500);
  },

  update(dt) {
    const p = G.player;
    if (!p) return;
    const usable = p.equipped === 'rod' && ['ground', 'deck'].includes(p.mode) && !p.carrying && !G.uiOpen;
    if (!usable) { if (this.state !== 'idle') this.reset(); return; }
    if (input.pressed('doldur') && this.state === 'idle') this.cycleBait();
    switch (this.state) {
      case 'idle':
        if (input.pressed('saldiri')) { this.state = 'charge'; this.power = 0; }
        break;
      case 'charge':
        this.power = Math.min(1, this.power + dt * 0.9);
        G.emit('fishingHud', { mode: 'charge', power: this.power, bait: ITEMS[this.bait]?.name });
        if (!input.isDown('saldiri')) this.cast();
        break;
      case 'fly': {
        this.flyT += dt;
        const k = Math.min(1, this.flyT / 0.6);
        const pos = new THREE.Vector3().lerpVectors(this.castFrom, this.castTo, k);
        pos.y += Math.sin(k * Math.PI) * 3;
        this.bobber.position.copy(pos);
        if (k >= 1) this.land();
        break;
      }
      case 'wait': {
        this.waitT -= dt;
        this._floatBobber(dt, 0);
        if (input.pressed('saldiri')) { this.reset(); G.notify('Oltayı topladın.'); break; }
        if (this.waitT <= 0) this.bite();
        break;
      }
      case 'bite': {
        this.biteT -= dt;
        this._floatBobber(dt, Math.sin(this.biteT * 30) * 0.08 - 0.12);
        G.emit('fishingHud', { mode: 'bite', t: this.biteT });
        if (input.pressed('saldiri')) this.hook();
        else if (this.biteT <= 0) { G.notify('Balık yemi kapıp kaçtı!', 'warn'); this.reset(); }
        break;
      }
      case 'fight': this._fight(dt); break;
    }
    if (this.state !== 'idle' && this.state !== 'charge') this._drawLine();
    p.fishing = this.state !== 'idle';
  },

  cast() {
    const p = G.player;
    if (!BAIT_ORDER.some((b) => p.inv.has(b))) { G.notify('Yemin yok! Yemsiz balık tutulmaz.', 'warn'); this.reset(); return; }
    if (!p.inv.has(this.bait)) this.bait = BAIT_ORDER.find((b) => p.inv.has(b));
    const dist = 4 + this.power * 16;
    const dir = new THREE.Vector3(Math.sin(p.yaw), 0, Math.cos(p.yaw));
    this.castFrom = p.pos.clone().add(new THREE.Vector3(0, 1.8, 0)).addScaledVector(dir, 0.6);
    this.castTo = p.pos.clone().addScaledVector(dir, dist);
    this.castTo.y = ocean.heightAt(this.castTo.x, this.castTo.z);
    this.flyT = 0;
    this.state = 'fly';
    this.bobber.visible = true;
    this.line.visible = true;
    p.startAction('slash', 0.5);
    audio.tone(500, 0.25, 'triangle', 0.04, null, 2.5);
    G.emit('fishingHud', null);
  },

  land() {
    const b = this.castTo;
    const floor = terrain.heightAt(b.x, b.z);
    if (floor > b.y - 0.4) { G.notify('Olta suya ulaşmadı.', 'warn'); this.reset(); return; }
    effects.splash(b.x, b.z, 0.35);
    this.depth = b.y - floor;
    this.state = 'wait';
    // bekleme süresi: yem uyumu, balık yoğunluğu
    this.candidate = this._pickSpecies(b);
    const near = fish.speciesNear(b, 30);
    const density = Math.min(3, [...near.values()].reduce((a, c) => a + c, 0) / 6);
    this.waitT = clamp(10 - density * 2 - (this.candidate.match ? 2.5 : 0) + Math.random() * 6, 2.5, 16);
    // zaman çizelgesi: şafak ve akşam balık akınlarında balıklar daha hızlı vurur
    const frenzy = time.isActive('fishFrenzy');
    if (frenzy) this.waitT = Math.max(1.5, this.waitT * 0.55);
    G.emit('fishingHud', { mode: 'wait', bait: (ITEMS[this.bait]?.name || '') + (frenzy ? ' · 🐟 Balık akını!' : '') });
  },

  _pickSpecies(pos) {
    const depth = this.depth;
    const baitKey = ITEMS[this.bait].bait;
    const near = fish.speciesNear(pos, 35);
    const hour = sky.hour;
    const timeOk = (t) => t === 'her zaman' || (t === 'gündüz' && hour > 7 && hour < 18) || (t === 'gece' && (hour < 6 || hour > 20)) || (t === 'akşam' && hour > 16 && hour < 21) || (t === 'şafak' && hour > 4 && hour < 9);
    const zoneReef = depth < 12;
    const keys = Object.keys(FISH).filter((k) => FISH[k].depth[0] <= depth + 1 && (FISH[k].zone === 'reef' ? zoneReef || near.has(k) : depth > 4));
    const weights = keys.map((k) => {
      const f = FISH[k];
      let w = { siradan: 6, yaygin: 4, nadir: 1.5, epik: 0.45 }[f.rarity] || 1;
      if (f.bait.includes(baitKey)) w *= 3; else w *= 0.25;
      if (near.has(k)) w *= 3;
      if (timeOk(f.time)) w *= 1.6;
      return w;
    });
    let tot = weights.reduce((a, b) => a + b, 0), r = Math.random() * tot;
    for (let i = 0; i < keys.length; i++) { r -= weights[i]; if (r <= 0) return { key: keys[i], match: FISH[keys[i]].bait.includes(baitKey) }; }
    return { key: 'sardalya', match: false };
  },

  _floatBobber(dt, dip) {
    const b = this.bobber.position;
    b.y = ocean.heightAt(b.x, b.z) + dip;
  },

  bite() {
    const p = G.player;
    p.inv.remove(this.bait, 1);
    this.state = 'bite';
    this.biteT = 1.1;
    effects.splash(this.bobber.position.x, this.bobber.position.z, 0.3);
    audio.play('gem', { vol: 0.5, rate: 0.7 });
    audio.splash(0.25);
  },

  hook() {
    const f = FISH[this.candidate.key];
    const w = lerp(f.weight[0], f.weight[1], Math.pow(Math.random(), 1.6));
    const rod = this.rodStats();
    this.fishInfo = { key: this.candidate.key, f, weight: w };
    this.strength = clamp(Math.log2(1 + w) / 4, 0.15, 1.6) / rod.power;
    this.tension = 0.35;
    this.progress = 0.08;
    this.pullDir = Math.random() < 0.5 ? -1 : 1;
    this.pullT = 1.5;
    this.slackT = 0;
    this.overT = 0;
    this.state = 'fight';
    audio.play('confirm', { vol: 0.4 });
  },

  _fight(dt) {
    const p = G.player;
    const rod = this.rodStats();
    this.pullT -= dt;
    if (this.pullT <= 0) { this.pullDir = -this.pullDir * (Math.random() < 0.8 ? 1 : -1); this.pullT = 0.8 + Math.random() * 1.8; }
    const reel = input.isDown('saldiri');
    const ax = input.moveAxis().x;
    const counter = ax * -this.pullDir > 0.3; // balığın tersine yönelmek
    const wrong = ax * this.pullDir > 0.3;
    let dT = (reel ? 0.55 : -0.42) * this.strength + (counter ? -0.25 : 0) + (wrong ? 0.35 : 0) + Math.sin(performance.now() * 0.01) * 0.05 * this.strength;
    dT /= rod.line;
    this.tension = clamp(this.tension + dT * dt * 1.6, 0, 1.15);
    if (reel) this.progress += dt * (0.12 + (counter ? 0.08 : 0)) / (0.6 + this.strength) * (this.tension < 0.95 ? 1 : 0.3);
    else this.progress -= dt * 0.03 * this.strength;
    // balık çekişi
    const bp = this.bobber.position;
    const toP = p.pos.clone().sub(bp).setY(0);
    const d = toP.length();
    const side = new THREE.Vector3(-toP.z, 0, toP.x).normalize().multiplyScalar(this.pullDir);
    bp.addScaledVector(side, dt * 1.2 * this.strength);
    if (d > 2.5) bp.addScaledVector(toP.normalize(), dt * (reel ? 1.6 : 0) * (this.tension < 0.95 ? 1 : 0.2));
    this._floatBobber(dt, -0.1);
    if (Math.random() < dt * 4) effects.splash(bp.x, bp.z, 0.15);
    if (this.tension >= 1) { this.overT += dt; if (this.overT > 0.45) { G.notify('Misina koptu! Balık kaçtı.', 'warn'); audio.tone(200, 0.3, 'square', 0.06, null, 0.5); this.reset(); return; } } else this.overT = 0;
    if (this.tension < 0.06) { this.slackT += dt; if (this.slackT > 2.2) { G.notify('İp gevşedi, balık kurtuldu.', 'warn'); this.reset(); return; } } else this.slackT = 0;
    G.emit('fishingHud', { mode: 'fight', tension: this.tension, progress: clamp(this.progress, 0, 1), dir: this.pullDir, name: '???' });
    if (this.progress >= 1) this.catch();
    else if (this.progress <= 0) { G.notify('Balık kaçtı.', 'warn'); this.reset(); }
  },

  catch() {
    const p = G.player;
    const { key, f, weight } = this.fishInfo;
    const lenCm = Math.round(f.len * 100 * Math.pow(weight / ((f.weight[0] + f.weight[1]) / 2), 1 / 3));
    const avgW = (f.weight[0] + f.weight[1]) / 2;
    const value = Math.round(f.value * (0.6 + 0.4 * weight / avgW));
    const zoneName = terrain.islandAt(this.bobber.position.x, this.bobber.position.z, 2.2)?.name || 'Açık deniz';
    const data = {
      key, name: f.name, weight: +weight.toFixed(2), len: lenCm, rarity: f.rarity, value, zone: zoneName,
      bait: ITEMS[this.bait]?.name, time: sky.timeString(), date: new Date().toLocaleDateString('tr-TR'),
      color: f.colors[0],
    };
    effects.splash(this.bobber.position.x, this.bobber.position.z, 0.6);
    let where = 'envanterine';
    if (!p.inv.canAdd('balik:' + key, 1, data)) {
      if (p.mode === 'deck' && p.ship) { const k = 'balik:' + key; p.ship.hold.items[k] = (p.ship.hold.items[k] || 0); p.ship.hold.fish = p.ship.hold.fish || []; p.ship.hold.fish.push(data); where = 'gemi ambarına'; }
      else { G.notify(`${f.name} yakaladın ama envanterin dolu — balığı geri bıraktın.`, 'warn'); G.emit('fishCaught', { data, released: true }); this.reset(); return; }
    } else p.inv.add('balik:' + key, 1, data);
    G.notify(`${f.name} yakaladın! ${lenCm} cm, ${data.weight} kg → ${where}`, 'good', 4500);
    audio.play('level_up', { vol: 0.5 });
    p.startAction('cheer', 1.2);
    G.emit('fishCaught', { data });
    this.reset();
  },

  _drawLine() {
    const p = G.player;
    const tip = p.char.held?.userData?.tip ? p.char.held.localToWorld(p.char.held.userData.tip.clone()) : p.pos.clone().add(new THREE.Vector3(Math.sin(p.yaw) * 1.5, 2.4, Math.cos(p.yaw) * 1.5));
    const b = this.bobber.position;
    const arr = this.line.geometry.attributes.position;
    const tension = this.state === 'fight' ? this.tension : 0.1;
    for (let i = 0; i < 16; i++) {
      const t = i / 15;
      const x = lerp(tip.x, b.x, t), z = lerp(tip.z, b.z, t);
      const y = lerp(tip.y, b.y, t) - Math.sin(t * Math.PI) * (1 - tension) * 1.2;
      arr.setXYZ(i, x, y, z);
    }
    arr.needsUpdate = true;
  },
};
