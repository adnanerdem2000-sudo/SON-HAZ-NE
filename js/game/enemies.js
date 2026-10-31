import * as THREE from 'three';
import { G } from './ctx.js';
import { Animated, Character } from '../player/character.js';
import { randomAppearance } from '../player/appearance.js';
import { combat } from './combat.js';
import { effects } from './effects.js';
import { audio } from '../core/audio.js';
import { terrain } from '../world/terrain.js';
import { physics } from '../world/physics.js';
import { sky } from '../world/sky.js';
import { clamp, damp, dampAngle, rng, wrapAngle, uid, lerp } from '../core/util.js';

const _v = new THREE.Vector3();

export const ENEMY_TYPES = {
  iskelet: { name: 'İskelet Korsan', hp: 60, dmg: 12, speed: 3.3, range: 1.9, model: 'skeleton_crew', h: 1.75, loot: [['altin_para', 8, 25], ['lanetli_kafatasi', 0.08]], rise: 0.3, xp: 1 },
  iskelet_altin: { name: 'Altın Kaplı İskelet', hp: 130, dmg: 18, speed: 3.0, range: 2.0, model: 'skeleton_crew', h: 1.85, tint: 0xffd060, emissive: 0x3a2a00, loot: [['altin_para', 40, 90], ['altin_kulce', 0.5], ['yakut', 0.2]], rise: 0.4 },
  iskelet_kaptan: { name: 'İskelet Kaptan Morvan', hp: 320, dmg: 24, speed: 3.1, range: 2.4, model: 'skeleton_crew', h: 2.35, tint: 0xb0c8ff, emissive: 0x102040, boss: true, loot: [['altin_para', 150, 250], ['lanetli_kafatasi', 1], ['korsan_madalyonu', 1]] },
  hayalet: { name: 'Hayalet Denizci', hp: 55, dmg: 14, speed: 3.6, range: 2.0, model: 'ghost', h: 2.0, ghost: true, night: true, loot: [['altin_para', 10, 30], ['inci', 0.25]] },
  hayalet_kafa: { name: 'Lanetli Kaptan Ruhu', hp: 90, dmg: 18, speed: 3.4, range: 2.2, model: 'ghost_skull', h: 2.3, ghost: true, night: true, loot: [['altin_para', 25, 60], ['eski_mucevher', 0.3]] },
  haydut: { name: 'Kızıl Hançer Haydudu', hp: 70, dmg: 13, speed: 4.0, range: 2.0, human: true, loot: [['altin_para', 15, 40], ['mermi', 0.4], ['ekmek', 0.3]] },
  haydut_tabanca: { name: 'Tabancalı Haydut', hp: 60, dmg: 22, speed: 3.6, range: 14, ranged: true, human: true, loot: [['altin_para', 20, 45], ['mermi', 0.7]] },
  kizil_hancer: { name: 'Kızıl Hançer', hp: 520, dmg: 22, speed: 4.4, range: 2.3, human: true, boss: true, ranged2: true, loot: [['altin_para', 400, 600], ['kizil_mektup', 1], ['harita_parcasi', 1]] },
};

// Yerleşim grupları
const GROUPS = [
  { id: 'kemik_harabe', x: -520, z: -440, r: 26, list: ['iskelet', 'iskelet', 'iskelet', 'iskelet_altin'], night: ['iskelet', 'iskelet'], respawn: 240 },
  { id: 'kemik_mezar', x: -575, z: -465, r: 22, list: ['iskelet', 'iskelet'], night: ['hayalet', 'hayalet', 'hayalet_kafa'], respawn: 200 },
  { id: 'kemik_kuzey', x: -470, z: -400, r: 18, list: ['iskelet', 'iskelet_altin'], night: ['hayalet'], respawn: 260 },
  { id: 'kamp', x: -40, z: -228, r: 20, list: ['haydut', 'haydut', 'haydut_tabanca', 'haydut', 'haydut_tabanca'], respawn: 300 },
  { id: 'sahil_gece', x: 150, z: 160, r: 40, list: [], night: ['iskelet', 'iskelet'], respawn: 300 },
];

export class Enemy {
  constructor(scene, type, x, z, opts = {}) {
    this.id = opts.id || uid('en');
    this.type = type;
    this.T = ENEMY_TYPES[type];
    this.scene = scene;
    this.home = new THREE.Vector3(x, 0, z);
    this.homeR = opts.homeR || 15;
    this.group = opts.group;
    this.maxHp = this.T.hp * (G.online ? 1 + 0.35 * G.remotes.size : 1);
    this.hp = this.maxHp;
    this.alive = true;
    this.state = 'idle';
    this.stateT = 0;
    this.radius = this.T.boss ? 0.7 : 0.45;
    this.height = this.T.h || 1.8;
    this.pos = new THREE.Vector3(x, terrain.heightAt(x, z), z);
    this.yaw = Math.random() * 6.28;
    this.target = null;
    this.atkCd = 1 + Math.random();
    this.hover = 0;
    this.revived = false;
    this.bloodColor = this.T.human ? [0.6, 0.05, 0.05] : this.T.ghost ? [0.5, 1, 0.9] : [0.9, 0.9, 0.8];
    this.big = !!this.T.boss;
    this._buildModel(opts);
    combat.addTarget(this);
    if (opts.rise) { this.state = 'rise'; this.stateT = 0; this.pos.y -= 1.8; }
  }

  _buildModel(opts) {
    const T = this.T;
    if (T.human) {
      const app = opts.appearance || randomAppearance(rng((Math.random() * 1e6) | 0));
      if (this.type !== 'kizil_hancer') {
        app.hat = Math.random() < 0.7 ? 'bandana' : 'tricorn';
        app.hatColor = '#8a1f1f';
        app.coatColor = '#5a1a1a';
      }
      this.char = new Character(app);
      this.char.hold(T.ranged ? 'pistol' : 'sword');
      this.anim = this.char;
      this.root = this.char.root;
    } else {
      this.anim = new Animated(T.model, T.h);
      this.root = this.anim.root;
      if (T.tint || T.emissive) this.anim.tint(T.tint || null, T.emissive || null);
      if (T.ghost) this.anim.tint(0x80fff0, 0x20a090, 0.72);
    }
    if (this.type === 'kizil_hancer') this.root.scale.multiplyScalar(1.12);
    this.scene.add(this.root);
    this.anim.play(this._idleAnim(), 0);
    // can çubuğu (sadece bosslarda HUD'da)
  }

  _idleAnim() { return this.T.human ? (this.T.ranged ? 'Idle_Gun' : 'Idle_Sword') : this.T.ghost ? 'Flying_Idle' : 'Idle'; }
  _runAnim() { return this.T.human ? 'Run' : this.T.ghost ? 'Fast_Flying' : 'Run'; }
  _walkAnim() { return this.T.human ? 'Walk' : this.T.ghost ? 'Flying_Idle' : 'Walk'; }
  _atkAnim() { return this.T.human ? (this.T.ranged ? 'Gun_Shoot' : 'Sword_Slash') : this.T.ghost ? (Math.random() < 0.5 ? 'Headbutt' : 'Punch') : (Math.random() < 0.6 ? 'Sword' : 'Punch'); }
  _hitAnim() { return this.T.human ? 'HitRecieve' : 'HitReact'; }

  hurt(dmg, info = {}) {
    if (!this.alive || this.state === 'rise' || this.phased) return;
    if (!G.isHost && G.online) { G.emit('netHurtEnemy', { id: this.id, dmg, kind: info.kind }); return; }
    this.applyDamage(dmg, info);
  }

  applyDamage(dmg, info = {}) {
    if (!this.alive) return;
    this.hp -= dmg;
    this.state = this.hp > 0 ? 'hit' : this.state;
    this.stateT = 0;
    if (info.pos) this.target = this._nearestPlayer() || this.target;
    combat.markCombat();
    if (this.hp <= 0) this.die(info);
    else {
      if (dmg > 10 || Math.random() < 0.5) this.anim.play(this._hitAnim(), 0.05, { once: true, restart: true });
      audio.play(this.T.human ? 'hurt' : 'hit', { pos: this.pos, vol: 0.5, rate: this.T.human ? 1 : 0.7 });
      // boss: haydut çağır
      if (this.type === 'kizil_hancer' && !this.summoned && this.hp < this.maxHp * 0.5) {
        this.summoned = true;
        G.notify('Kızıl Hançer: "Tayfa! Bu korsanı denize atın!"', 'boss', 4000);
        G.emit('spawnEnemies', { list: ['haydut', 'haydut_tabanca'], x: this.pos.x, z: this.pos.z, r: 8 });
      }
    }
  }

  die(info) {
    this.alive = false;
    this.state = 'dead';
    this.stateT = 0;
    this.anim.play('Death', 0.1, { once: true, restart: true });
    audio.play(this.T.boss ? 'big_kill' : 'kill', { pos: this.pos, vol: 0.7 });
    if (this.T.ghost) effects.glitter(this.pos.x, this.pos.y + 1, this.pos.z, [0.5, 1, 0.9]);
    // iskeletler bazen yeniden kalkar
    if (this.T.rise && !this.revived && Math.random() < this.T.rise) {
      this.reviveT = 6 + Math.random() * 4;
    } else {
      G.emit('enemyKilled', { enemy: this, type: this.type, pos: this.pos.clone(), by: info.by });
      G.emit('loot', { pos: this.pos.clone(), table: this.T.loot, from: this.T.name });
    }
  }

  _nearestPlayer() {
    let best = null, bd = 1e9;
    const consider = (pl, id) => {
      if (!pl || pl.dead || pl.downed) return;
      const d = pl.pos.distanceTo(this.pos);
      if (d < bd) { bd = d; best = { id, pos: pl.pos, ref: pl, mode: pl.mode }; }
    };
    consider(G.player, G.myId);
    for (const [id, r] of G.remotes) consider(r, id);
    return best;
  }

  update(dt) {
    this.anim.update(dt);
    this.stateT += dt;
    if (this.state === 'dead') {
      if (this.reviveT !== undefined) {
        this.reviveT -= dt;
        if (this.reviveT <= 0) {
          this.reviveT = undefined;
          this.revived = true;
          this.alive = true;
          this.hp = this.maxHp * 0.5;
          this.state = 'idle';
          this.anim.play('Jump_Land', 0.2, { once: true }) || this.anim.play('Idle', 0.2);
          G.notify(`${this.T.name} yeniden ayağa kalktı!`, 'warn', 2500);
          effects.dirt(this.pos.x, this.pos.y, this.pos.z, 14);
        }
      } else if (this.stateT > 25) this.remove = true;
      this._place(dt);
      return;
    }
    if (this.state === 'rise') {
      this.pos.y = lerp(this.pos.y, terrain.heightAt(this.pos.x, this.pos.z), dt * 1.4);
      if (Math.random() < 0.3) effects.dirt(this.pos.x, terrain.heightAt(this.pos.x, this.pos.z), this.pos.z, 2);
      if (this.stateT > 2.2) this.state = 'idle';
      this._place(dt);
      return;
    }
    // hayalet: sisle kaybolma
    if (this.T.ghost) {
      this.phaseT = (this.phaseT || 6 + Math.random() * 6) - dt;
      if (this.phaseT <= 0) { this.phased = !this.phased; this.phaseT = this.phased ? 2.2 : 5 + Math.random() * 5; }
      const op = this.phased ? 0.12 : 0.72;
      this.anim.model.traverse((o) => { if (o.isMesh) { const ms = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ms) m.opacity = damp(m.opacity, op, 5, dt); } });
      // gündüz zayıflar ve kaybolur
      if (!sky.isNight() && this.T.night && Math.random() < dt * 0.05) { this.alive = false; this.remove = true; effects.glitter(this.pos.x, this.pos.y + 1, this.pos.z, [0.5, 1, 0.9]); return; }
    }
    const tgt = this._nearestPlayer();
    const dist = tgt ? tgt.pos.distanceTo(this.pos) : 1e9;
    const aggroR = this.T.boss ? 28 : this.T.ghost ? 20 : 17;
    const reachable = tgt && (tgt.mode === 'ground' || (this.T.ghost && tgt.mode !== 'helm' && tgt.mode !== 'boat'));
    const nightBoost = sky.isNight() && !this.T.human ? 1.25 : 1;
    let moveTo = null, speed = 0;
    if (this.state === 'hit') {
      if (this.stateT > 0.45) this.state = 'chase';
    } else if (this.state === 'attack') {
      // vuruş zamanlaması
      if (!this.hitDone && this.stateT > (this.T.ranged ? 0.55 : 0.45)) {
        this.hitDone = true;
        this._doAttack(tgt, nightBoost);
      }
      if (this.stateT > (this.T.ranged ? 1.1 : 0.95)) { this.state = 'chase'; this.atkCd = this.T.ranged ? 2.2 : 1.1 + Math.random() * 0.6; }
      if (tgt) this.yaw = dampAngle(this.yaw, Math.atan2(tgt.pos.x - this.pos.x, tgt.pos.z - this.pos.z), 8, dt);
    } else if (tgt && dist < aggroR && reachable && this._homeDist(tgt.pos) < this.homeR + 25) {
      this.state = 'chase';
      this.target = tgt;
      combat.markCombat();
      const want = this.T.ranged ? 9 : this.T.range * 0.85;
      if (dist > want) { moveTo = tgt.pos; speed = this.T.speed * nightBoost * (dist > 6 ? 1 : 0.7); }
      else if (this.T.ranged && dist < 5) { moveTo = this.pos.clone().add(this.pos.clone().sub(tgt.pos).setY(0).normalize().multiplyScalar(3)); speed = 2.5; }
      this.atkCd -= dt;
      const inRange = this.T.ranged ? dist < this.T.range : dist < this.T.range + 0.3;
      // boss menzilli ateş
      if (this.T.ranged2 && dist > 6 && dist < 16 && this.atkCd <= 0 && Math.random() < 0.02) {
        this.state = 'attack'; this.stateT = 0; this.hitDone = false; this.rangedNow = true;
        this.anim.play('Gun_Shoot', 0.1, { once: true, restart: true });
        this.char?.hold('pistol');
      } else if (inRange && this.atkCd <= 0) {
        this.state = 'attack'; this.stateT = 0; this.hitDone = false; this.rangedNow = !!this.T.ranged;
        if (this.T.ranged2) this.char?.hold('sword');
        this.anim.play(this._atkAnim(), 0.1, { once: true, restart: true, speed: this.T.boss ? 1.15 : 1 });
      }
      this.yaw = dampAngle(this.yaw, Math.atan2(tgt.pos.x - this.pos.x, tgt.pos.z - this.pos.z), 7, dt);
    } else {
      // devriye
      this.state = 'idle';
      this.wanderT = (this.wanderT || 0) - dt;
      if (this.wanderT <= 0) {
        this.wanderT = 4 + Math.random() * 6;
        const a = Math.random() * 6.28, r = Math.random() * this.homeR;
        this.wander = new THREE.Vector3(this.home.x + Math.cos(a) * r, 0, this.home.z + Math.sin(a) * r);
      }
      if (this.wander && this.pos.distanceTo(_v.set(this.wander.x, this.pos.y, this.wander.z)) > 1.2) { moveTo = this.wander; speed = 1.4; }
    }
    if (moveTo && this.state !== 'attack' && this.state !== 'hit') {
      const dx = moveTo.x - this.pos.x, dz = moveTo.z - this.pos.z;
      const d = Math.hypot(dx, dz);
      if (d > 0.05) {
        const nx = this.pos.x + (dx / d) * speed * dt, nz = this.pos.z + (dz / d) * speed * dt;
        // suya girmez (hayaletler hariç)
        if (this.T.ghost || terrain.heightAt(nx, nz) > 0.4) { this.pos.x = nx; this.pos.z = nz; }
        else if (this.wander) this.wanderT = 0;
        this.yaw = dampAngle(this.yaw, Math.atan2(dx, dz), 8, dt);
      }
      physics.resolve(this.pos, this.radius, this.pos.y);
      const a = speed > 2.5 ? this._runAnim() : this._walkAnim();
      if (this.anim.currentName !== a && (!this.anim.current || !this.anim.current.isRunning() || this.anim.current.loop !== THREE.LoopOnce)) this.anim.play(a, 0.2);
      else if (this.anim.currentName !== a && this.anim.current?.loop === THREE.LoopOnce && !this.anim.current.isRunning()) this.anim.play(a, 0.2);
    } else if (this.state !== 'attack' && this.state !== 'hit') {
      const ia = this._idleAnim();
      if (this.anim.currentName !== ia && (!this.anim.current || this.anim.current.loop !== THREE.LoopOnce || !this.anim.current.isRunning())) this.anim.play(ia, 0.25);
    }
    this._place(dt);
  }

  _homeDist(p) { return Math.hypot(p.x - this.home.x, p.z - this.home.z); }

  _doAttack(tgt, boost) {
    if (!tgt) return;
    const dmg = this.T.dmg * boost;
    if (this.rangedNow) {
      // menzilli: görüş kontrolü + isabet şansı
      const d = tgt.pos.distanceTo(this.pos);
      const muzzle = this.pos.clone().add(new THREE.Vector3(Math.sin(this.yaw) * 0.6, 1.45, Math.cos(this.yaw) * 0.6));
      effects.flash(muzzle.x, muzzle.y, muzzle.z, tgt.pos.clone().sub(this.pos).normalize());
      audio.play('shoot', { pos: this.pos, vol: 0.7 });
      const moving = tgt.ref?.vel ? Math.hypot(tgt.ref.vel.x, tgt.ref.vel.z) : 0;
      const hitChance = clamp(0.85 - d * 0.03 - moving * 0.06, 0.15, 0.85);
      if (Math.random() < hitChance) this._hitPlayer(tgt, dmg, 'Vuruldun');
      return;
    }
    const d = tgt.pos.distanceTo(this.pos);
    const ang = Math.abs(wrapAngle(Math.atan2(tgt.pos.x - this.pos.x, tgt.pos.z - this.pos.z) - this.yaw));
    if (d < this.T.range + 0.6 && ang < 1.1) {
      this._hitPlayer(tgt, dmg, this.T.name + ' seni yere serdi');
      audio.play('hit', { pos: this.pos, vol: 0.6, rate: 0.9 });
    } else audio.tone(260, 0.1, 'sawtooth', 0.03, null, 0.5);
  }

  _hitPlayer(tgt, dmg, cause) {
    if (tgt.id === G.myId) G.player.hurt(dmg, this.pos, { cause });
    else G.emit('netHurtPlayer', { id: tgt.id, dmg, from: [this.pos.x, this.pos.y, this.pos.z], cause });
  }

  _place(dt) {
    let y = this.T.ghost ? terrain.heightAt(this.pos.x, this.pos.z) + 0.6 + Math.sin(performance.now() * 0.002 + this.home.x) * 0.25 : (this.state === 'rise' ? this.pos.y : physics.groundAt(this.pos.x, this.pos.z, this.pos.y + 1));
    if (this.T.ghost) y = Math.max(y, 0.8);
    this.pos.y = y;
    this.root.position.copy(this.pos);
    this.root.rotation.y = this.yaw;
  }

  dispose() {
    combat.removeTarget(this);
    this.scene.remove(this.root);
  }

  net() { return [this.id, this.type, +this.pos.x.toFixed(2), +this.pos.y.toFixed(2), +this.pos.z.toFixed(2), +this.yaw.toFixed(2), this.anim.currentName, Math.round(this.hp), this.alive ? 1 : 0]; }
}

export const enemies = {
  name: 'enemies',
  saveKey: 'enemies',
  list: [],
  groupState: {},

  init(scene) {
    this.scene = scene;
    G.on('spawnEnemies', (e) => {
      for (const t of e.list) {
        const a = Math.random() * 6.28;
        this.spawn(t, e.x + Math.cos(a) * e.r, e.z + Math.sin(a) * e.r, { homeR: 20, rise: false });
      }
    });
  },

  start() {
    for (const e of this.list) e.dispose();
    this.list = [];
    this.groupState = {};
    this.wasNight = null;
    this.bossSpawned = false;
  },
  stop() { this.start(); },

  spawn(type, x, z, opts = {}) {
    const e = new Enemy(this.scene, type, x, z, opts);
    this.list.push(e);
    return e;
  },

  spawnBoss(type, x, z, opts = {}) {
    if (this.list.some((e) => e.type === type && e.alive)) return null;
    const e = this.spawn(type, x, z, { homeR: 14, ...opts });
    G.emit('bossSpawn', { enemy: e });
    return e;
  },

  // Oyuncuya yakın grupları doldur
  _populate(dt) {
    const p = G.player;
    if (!p) return;
    const night = sky.isNight();
    const focusPts = [p.pos, ...[...G.remotes.values()].map((r) => r.pos)];
    for (const gr of GROUPS) {
      const st = this.groupState[gr.id] || (this.groupState[gr.id] = { spawned: false, cooldown: 0, nightDone: false });
      st.cooldown -= dt;
      const near = focusPts.some((f) => Math.hypot(f.x - gr.x, f.z - gr.z) < 140);
      const far = focusPts.every((f) => Math.hypot(f.x - gr.x, f.z - gr.z) > 220);
      if (near && !st.spawned && st.cooldown <= 0) {
        st.spawned = true;
        for (const t of gr.list) this._spawnInGroup(t, gr, false);
        st.nightDone = false;
      }
      if (near && night && !st.nightDone && gr.night) {
        st.nightDone = true;
        for (const t of gr.night) this._spawnInGroup(t, gr, true);
      }
      if (!night) st.nightDone = false;
      if (far && st.spawned) {
        // uzaklaşınca temizle; ölenler bekleme süresi sonra döner
        const mine = this.list.filter((e) => e.group === gr.id);
        const allDead = mine.length && mine.every((e) => !e.alive);
        for (const e of mine) { e.dispose(); e.removed = true; }
        this.list = this.list.filter((e) => e.group !== gr.id);
        st.spawned = false;
        st.cooldown = allDead ? gr.respawn : 0;
      }
    }
  },

  _spawnInGroup(t, gr, rise) {
    const a = Math.random() * 6.28, r = Math.random() * gr.r;
    let x = gr.x + Math.cos(a) * r, z = gr.z + Math.sin(a) * r;
    if (terrain.heightAt(x, z) < 0.6) { x = gr.x; z = gr.z; }
    this.spawn(t, x, z, { group: gr.id, homeR: gr.r + 6, rise: rise && !ENEMY_TYPES[t].ghost && !ENEMY_TYPES[t].human });
  },

  update(dt) {
    if (G.isHost) this._populate(dt);
    for (const e of this.list) {
      if (G.isHost || !G.online) e.update(dt);
      else { e.anim.update(dt); this._interp(e, dt); }
    }
    const rm = this.list.filter((e) => e.remove);
    for (const e of rm) e.dispose();
    if (rm.length) this.list = this.list.filter((e) => !e.remove);
    // boss HUD
    const boss = this.list.find((e) => e.T.boss && e.alive && G.player && e.pos.distanceTo(G.player.pos) < 40);
    G.emit('bossBar', boss ? { name: boss.T.name, hp: boss.hp / boss.maxHp } : null);
  },

  _interp(e, dt) {
    if (!e.netTarget) return;
    const t = e.netTarget;
    e.pos.x = damp(e.pos.x, t[2], 10, dt); e.pos.y = damp(e.pos.y, t[3], 10, dt); e.pos.z = damp(e.pos.z, t[4], 10, dt);
    e.yaw = dampAngle(e.yaw, t[5], 10, dt);
    if (t[6] && e.anim.currentName !== t[6]) e.anim.play(t[6], 0.15, { once: /Death|Sword|Punch|Shoot|Slash|Hit|Headbutt/.test(t[6]) });
    e.hp = t[7];
    e.alive = !!t[8];
    e.root.position.copy(e.pos);
    e.root.rotation.y = e.yaw;
  },

  // ağ
  netSnapshot() { return this.list.filter((e) => !e.removed).map((e) => e.net()); },
  applySnapshot(arr) {
    const seen = new Set();
    for (const s of arr) {
      seen.add(s[0]);
      let e = this.list.find((x) => x.id === s[0]);
      if (!e) { e = this.spawn(s[1], s[2], s[4], { id: s[0] }); }
      e.netTarget = s;
    }
    for (const e of this.list) if (!seen.has(e.id)) { e.dispose(); e.remove = true; }
    this.list = this.list.filter((e) => !e.remove);
  },

  save() { return { groups: this.groupState }; },
};
