import * as THREE from 'three';
import { Character, makeTorch } from './character.js';
import { Inventory } from './inventory.js';
import { input } from '../core/input.js';
import { tpCamera } from './camera.js';
import { terrain } from '../world/terrain.js';
import { physics } from '../world/physics.js';
import { ocean } from '../world/ocean.js';
import { cave } from '../world/cave.js';
import { clamp, damp, dampAngle, lerp, wrapAngle } from '../core/util.js';
import { G } from '../game/ctx.js';
import { ITEMS } from '../economy/items.js';
import { hullHalfWidth } from '../ship/shipModel.js';
import { WORLD_HALF } from '../world/archipelago.js';

const GRAV = -22;
const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();

export const EQUIP_SLOTS = { slot0: 'none', slot1: 'sword', slot2: 'pistol', slot3: 'shovel', slot4: 'rod', slot5: 'map' };

export class Player {
  constructor(scene, appearance, opts = {}) {
    this.scene = scene;
    this.char = new Character(appearance);
    scene.add(this.char.root);
    this.appearance = appearance;
    this.pos = new THREE.Vector3(opts.x || 0, opts.y || 5, opts.z || 0);
    this.vel = new THREE.Vector3();
    this.yaw = opts.yaw || 0;
    this.mode = 'ground';
    this.onGround = false;
    this.local = new THREE.Vector3();
    this.localVy = 0;
    this.localY = 0;
    this.ship = null;
    this.hp = 100; this.maxHp = 100;
    this.stamina = 100;
    this.oxygen = 100;
    this.poison = 0;
    this.inv = new Inventory(45);
    this.equipped = 'none';
    this.torch = false;
    this.carrying = null;
    this.action = null; // {type, t, dur, ...}
    this.aiming = false;
    this.blocking = false;
    this.loaded = true;
    this.reloadT = 0;
    this.invuln = 0;
    this.lastHurt = 0;
    this.downed = false;
    this.dead = false;
    this.crouch = false;
    this.sprinting = false;
    this.swimPhase = 0;
    this.stepT = 0;
    this.busy = null; // {label, t, dur, onDone, cancelOnMove}
    this.underwater = false;
    this.depth = 0;
    this.inCave = 0;
    this.lastSafe = this.pos.clone();
    this.animState = '';
    this.fallStartY = this.pos.y;
    // savaş durumu
    this.blockT = 0;        // savunmaya geçeli geçen süre (parry penceresi)
    this.blockCd = 0;       // savunma bırakıldıktan sonra yeniden başlama gecikmesi
    this._modeT = 0;        // yüzme↔yürüme geçiş kilidi (titreşim önleme)
    this.onPlatform = false;
    this.counterT = 0;      // parry sonrası karşı saldırı penceresi
    this.guardBroken = 0;   // savunması kırılınca bekleme
    this.combo = { step: 0, grace: 0 };
    this.charge = null;     // basılı tutma (ağır saldırı)
    this.idleT = 0;
    this.airT = 0;
    this.parryHints = 0;
  }

  setAppearance(app) {
    this.appearance = app;
    const held = this.char.heldType;
    this.char.build(app);
    if (held) this.char.hold(held);
  }

  // ---- ekipman ----
  equip(slot) {
    if (this.carrying) return;
    const need = { sword: ['kilic', 'usta_kilic'], pistol: ['tabanca', 'usta_tabanca'], shovel: ['kurek'], rod: ['olta', 'usta_olta'], map: ['hazine_haritasi'] }[slot];
    if (need && !need.some((id) => this.inv.has(id))) {
      G.notify(slot === 'map' ? 'Envanterinde hazine haritası yok.' : 'Bu eşyaya sahip değilsin.', 'warn');
      return;
    }
    if (this.equipped === slot && slot !== 'none') slot = 'none';
    this.equipped = slot;
    this.aiming = false;
    if (slot === 'map') { G.emit('openTreasureMap'); this.equipped = 'none'; }
    this.char.hold(this.equipped === 'none' || this.equipped === 'map' ? null : this.equipped);
    this._syncTorch();
    G.emit('equip', this.equipped);
  }
  weaponDamage() {
    const m = G.mods || {};
    if (this.equipped === 'sword') return (this.inv.has('usta_kilic') ? ITEMS.usta_kilic.dmg : ITEMS.kilic.dmg) * (m.melee || 1);
    if (this.equipped === 'pistol') return (this.inv.has('usta_tabanca') ? ITEMS.usta_tabanca.dmg : ITEMS.tabanca.dmg) * (m.gun || 1);
    return 8 * (m.melee || 1);
  }
  toggleTorch() {
    if (!this.inv.has('fener')) { G.notify('Meşalen yok. Genel Tüccar\'dan alabilirsin.', 'warn'); return; }
    this.torch = !this.torch;
    this._syncTorch();
  }
  _syncTorch() {
    const c = this.char;
    if (this.torch && !this.carrying && this.mode !== 'swim') {
      if (!c._torchObj || c._torchObj.parent !== c.handL) {
        const t = makeTorch();
        t.rotation.set(Math.PI / 2 - 0.4, 0, 0);
        c.handL.add(t);
        c._torchObj = t;
      }
      c._torchObj.visible = true;
    } else if (c._torchObj) c._torchObj.visible = false;
  }

  // ---- hasar ----
  hurt(amount, from = null, opts = {}) {
    if (this.dead || this.downed || G.godMode) return;
    if (this.invuln > 0) {
      if (this.action?.type === 'dodge' && opts.melee) G.emit('dodged', { pos: this.pos.clone() });
      return;
    }
    const front = from ? Math.abs(wrapAngle(Math.atan2(from.x - this.pos.x, from.z - this.pos.z) - this.yaw)) < 1.35 : false;
    if (this.blocking && front && opts.melee && !opts.unblockable) {
      // tam zamanında savunma = parry: hasar yok, saldıran sersemler, karşı saldırı penceresi açılır
      if (this.blockT < 0.24) { this._parry(opts.attacker, opts.attackerId); return; }
      const cost = amount * 0.9 + 4;
      if (this.stamina > cost) {
        this.stamina -= cost;
        amount *= 0.12;
        this.startAction('blockhit', 0.3);
        G.emit('sfx', { name: 'hit', pos: this.pos, vol: 0.7, rate: 1.5 });
        G.emit('blockSpark', { pos: this.pos.clone(), yaw: this.yaw });
        tpCamera.addShake(0.12);
        this.knock = from ? { x: (this.pos.x - from.x) * 0.8, z: (this.pos.z - from.z) * 0.8 } : null;
        if (amount < 1) return;
      } else {
        // dayanıklılık bitti: savunma kırılır
        this.stamina = 0;
        this.guardBroken = 1.4;
        this.blocking = false;
        this.char.stopUpper(0.05);
        this.startAction('stagger', 0.9);
        G.notify('Savunman kırıldı!', 'warn', 1500);
        amount *= 0.5;
      }
    }
    const diff = G.difficulty === 'kolay' ? 0.6 : G.difficulty === 'zor' ? 1.35 : 1;
    this.hp -= amount * diff;
    this.lastHurt = 0;
    if (opts.poison) this.poison = Math.max(this.poison, opts.poison);
    G.emit('playerHurt', { amount });
    tpCamera.addShake(Math.min(0.6, amount / 40));
    // geri tepme: darbe kaynağından uzağa itilir
    if (from && (this.mode === 'ground' || this.mode === 'swim')) {
      const dx = this.pos.x - from.x, dz = this.pos.z - from.z;
      const d = Math.hypot(dx, dz) || 1;
      const k = Math.min(7, 1.5 + amount * 0.12) * (this.blocking ? 0.4 : 1);
      this.knock = { x: (dx / d) * k, z: (dz / d) * k };
      if (amount > 20 && this.mode === 'ground') { this.vel.y = Math.max(this.vel.y, 3.5); this.onGround = false; }
    }
    this.lastHitFrom = from ? from.clone?.() || null : null;
    this.lastHitAmount = amount;
    if (this.hp <= 0) { this.hp = 0; this.die(opts.cause || 'Ağır yaralandın'); }
    else if (amount > 8 && (!this.action || this.action.type === 'blockhit')) this.startAction(amount > 22 && !opts.bullet ? 'stagger' : 'hit', amount > 22 && !opts.bullet ? 0.7 : 0.45);
  }
  _parry(attacker, attackerId) {
    this.counterT = 1.3;
    this.stamina = Math.min(100, this.stamina + 12);
    this.startAction('parry', 0.4);
    G.hitStop = 0.1;
    tpCamera.addShake(0.22);
    G.emit('sfx', { name: 'hit', pos: this.pos, vol: 0.95, rate: 2.0 });
    G.emit('parry', { pos: this.pos.clone(), yaw: this.yaw });
    if (attacker && attacker.stun) attacker.stun(1.7, 'parry');
    else if (attackerId) G.emit('netStunEnemy', { id: attackerId, dur: 1.7 });
    if (this.parryHints++ < 3) G.notify('Kusursuz savunma! Hemen vurursan karşı saldırı yaparsın.', 'good', 1800);
  }
  heal(n) { this.hp = Math.min(this.maxHp, this.hp + n); }

  die(cause) {
    if (this.dead || this.downed) return;
    if (this.carrying) G.emit('dropCarry', { player: this });
    this.action = null;
    this.char.stopUpper(0.05);
    if (G.online && G.remotes.size > 0) {
      this.downed = true;
      this.downT = 35;
      this.char.play('Death', 0.2, { once: true });
      G.emit('playerDowned', { cause });
    } else {
      this.dead = true;
      if (this.mode === 'ground' || this.mode === 'deck') this._ragdoll();
      else this.char.play('Death', 0.2, { once: true });
      G.emit('playerDied', { cause });
    }
  }
  _ragdoll() {
    const from = this.lastHitFrom;
    const imp = new THREE.Vector3();
    if (from) imp.set(this.pos.x - from.x, 0, this.pos.z - from.z).normalize().multiplyScalar(2 + Math.min(4, (this.lastHitAmount || 10) * 0.08)).setY(1.2);
    const ship = this.mode === 'deck' ? this.ship : null;
    const ground = ship ? (x, z) => {
      const l = ship.worldToLocal(new THREE.Vector3(x, ship.y, z));
      if (!ship.insideDeck(l.x, l.z, 0)) return ocean.heightAt(x, z) - 0.8;
      return ship.localToWorld(new THREE.Vector3(l.x, ship.deckAt(l.x, l.z), l.z)).y;
    } : (x, z, y) => physics.groundAt(x, z, y + 0.6);
    this.char.startRagdoll({ ground, vel: this.vel.clone().setY(Math.max(0, this.vel.y)), impulse: imp });
  }
  revive(hp = 45) {
    const wasRag = !!this.char.ragdoll;
    this.dead = false; this.downed = false;
    this.hp = hp; this.oxygen = 100; this.poison = 0;
    this.action = null;
    this.char.stopRagdoll();
    if (!wasRag && (this.mode === 'ground' || this.mode === 'deck')) this.startAction('getup', 1.1);
    else this.char.play('Idle', 0.2);
  }

  startAction(type, dur, data = {}) {
    this.action = { type, t: 0, dur, ...data };
    const c = this.char;
    const moving = Math.hypot(this.vel.x, this.vel.z) > 1.6 && this.mode !== 'swim';
    const once = { once: true, restart: true };
    const up = (name, speed = 1, fade = 0.08) => c.playUpper(name, fade, { ...once, speed });
    const full = (name, speed = 1, fade = 0.08) => { if (c.upper) c.stopUpper(0.05); return c.play(name, fade, { ...once, speed }); };
    const pick = (name, speed = 1, fade = 0.08) => (moving || data.upper ? up(name, speed, fade) : full(name, speed, fade));
    switch (type) {
      case 'atk': pick(data.anim, data.speed || 1, 0.07); break;
      case 'slash': pick('Atk1', 1.45); break; // eski çağrılar (olta atma vb.)
      case 'punch': pick('Punch_Right', 1.6); break;
      case 'shoot': up('Gun_Shoot', 1.3, 0.04); break;
      case 'reload': up('Reload', 1.17 / Math.max(0.3, dur)); break;
      case 'interact': full('Interact', 1.1, 0.1); break;
      case 'pickup': full('PickUp', 1.3 / Math.max(0.3, dur), 0.1); break;
      case 'use': up('UseItem', 1.6 / Math.max(0.3, dur)); break;
      case 'throw': pick('Throw', 1.37 / Math.max(0.3, dur)); break;
      case 'dodge': case 'roll': full(data.anim || 'Dodge_F', 0.4 / Math.max(0.2, dur), 0.04); break;
      case 'parry': up('Parry', 1.9, 0.03); break;
      case 'blockhit': up('BlockHit', 1.7, 0.03); break;
      case 'stagger': full('HitRecieve_2', 0.87 / Math.max(0.3, dur), 0.05); break;
      case 'hit': pick(Math.random() < 0.5 ? 'HitRecieve' : 'HitRecieve_2', 1.1, 0.05); break;
      case 'cheer': full('Cheer', 1, 0.15); break;
      case 'land': full('Jump_Land', 1.4, 0.05); break;
      case 'getup': full('LieUp', 2.33 / Math.max(0.5, dur), 0.1); break;
      case 'dig': c.play('Heavy2H', 0.15, { speed: 0.85 }); break;
      default: break;
    }
  }

  // uzun süreli eylem (kazma, tamir, sandık açma) — ilerleme çubuğu
  startBusy(label, dur, onDone, opts = {}) {
    this.busy = { label, t: 0, dur, onDone, anim: opts.anim || 'interact', cancelOnMove: opts.cancelOnMove !== false, onCancel: opts.onCancel };
    this.char.stopUpper(0.1);
    if (opts.anim === 'dig') this.startAction('dig', dur);
    else this.char.play(opts.anim === 'use' ? 'UseItem' : 'Interact', 0.15, { speed: 0.6 });
  }
  cancelBusy() {
    if (this.busy?.onCancel) this.busy.onCancel();
    this.busy = null;
    this.action = null;
  }

  headPos(out = new THREE.Vector3()) { return out.set(this.pos.x, this.pos.y + 1.55 * (this.appearance.height || 1), this.pos.z); }

  // ---- gemiye çık/in ----
  boardShip(ship, localPoint) {
    this.ship = ship;
    this.mode = 'deck';
    this.local.copy(localPoint || ship.model.stations.ladderTop);
    this.localY = 0; this.localVy = 0;
    ship.clampDeck(this.local);
    this.vel.set(0, 0, 0);
  }
  leaveShipToWorld(worldPos, vel) {
    this.mode = 'ground';
    this.ship = null;
    this.pos.copy(worldPos);
    this.vel.copy(vel || new THREE.Vector3());
    this.onGround = false;
    this.fallStartY = worldPos.y; // güverteden inişte eski zemin yüksekliği düşme hasarı saymasın
  }

  // ---- ana güncelleme ----
  update(dt) {
    const c = this.char;
    this.invuln = Math.max(0, this.invuln - dt);
    this.lastHurt += dt;
    this.counterT = Math.max(0, this.counterT - dt);
    this.guardBroken = Math.max(0, this.guardBroken - dt);
    this.combo.grace = Math.max(0, this.combo.grace - dt);
    if (this.blocking) this.blockT += dt; else this.blockT = 0;
    this._modeT = Math.max(0, this._modeT - dt);
    if (this.action) {
      this.action.t += dt;
      if (this.action.t >= this.action.dur) {
        const a = this.action;
        this.action = null;
        if (a.onDone) a.onDone();
      }
    }
    if (this.reloadT > 0) { this.reloadT -= dt; if (this.reloadT <= 0) { this.loaded = true; G.emit('sfx', { name: 'confirm', vol: 0.3 }); } }
    // zehir
    if (this.poison > 0) { this.poison -= dt; if (!this.dead) this.hp -= dt * 2.2; if (this.hp <= 0) this.die('Zehirlendin'); }
    // yenilenme
    if (this.lastHurt > 6 && this.hp < this.maxHp && !this.dead && this.poison <= 0) this.hp = Math.min(this.maxHp, this.hp + dt * 1.5);
    if (this.downed) {
      this.downT -= dt;
      if (this.downT <= 0) { this.downed = false; this.dead = true; G.emit('playerDied', { cause: 'Kimse yardıma gelmedi' }); }
    }
    const locked = this.dead || this.downed || G.uiOpen;
    if (this.mode === 'ground') this._updateGround(dt, locked);
    else if (this.mode === 'deck') this._updateDeck(dt, locked);
    else if (this.mode === 'swim') this._updateSwim(dt, locked);
    else if (this.mode === 'boat') this._updateBoat(dt, locked);
    else if (this.mode === 'helm') this._updateHelm(dt, locked);
    else if (this.mode === 'cannon') this._updateCannon(dt, locked);
    else if (this.mode === 'climb') this._updateClimb(dt);

    // meşgul eylem
    if (this.busy) {
      this.busy.t += dt;
      if (this.busy.t >= this.busy.dur) {
        const b = this.busy;
        this.busy = null;
        this.action = null;
        c.play('Idle', 0.2);
        b.onDone && b.onDone();
      }
    }

    // stamina
    if (!this.sprinting && !this.blocking) this.stamina = Math.min(100, this.stamina + dt * 18 * (G.mods?.stamina || 1));

    // mağara
    this.inCave = cave.insideFactor(this.pos.x, this.pos.z) * (this.pos.y < 9 ? 1 : 0);

    // karakter görsel güncellemesi
    c.root.position.copy(this.pos);
    if (this.mode !== 'swim') c.root.rotation.set(0, this.yaw, 0);
    c.overlay.carry = !!this.carrying;
    c.overlay.crouch = this.crouch && this.mode === 'ground' && this.onGround && !this.carrying;
    c.overlay.helm = this.mode === 'helm';
    c.overlay.row = this.mode === 'boat';
    c.overlay.rowPhase = G.rowboat ? G.rowboat.rowPhase : 0;
    c.overlay.fish = this.equipped === 'rod' && !!this.fishing;
    c.overlay.swim = this.mode === 'swim' && this.swimMoving;
    c.overlay.tread = this.mode === 'swim' && !this.swimMoving;
    c.overlay.swimPhase = this.swimPhase;
    c.overlay.climb = this.mode === 'climb';
    c.overlay.climbPhase = this.climbPhase || 0;
    c.overlay.air = this.mode === 'ground' && !this.onGround && !this.action ? clamp((this.airT || 0) * 4, 0, 1) : 0;
    c.update(dt);
  }

  _wantAnim(name, speed = 1, fade = 0.2) {
    if (this.busy || this.dead || this.downed) return;
    const c = this.char;
    // tam gövde eylemi oynarken temel katmana dokunma; üst katman eylemleri sırasında bacaklar yürümeye devam eder
    if (this.action && !c.upper) return;
    if (c.currentName !== name) c.play(name, fade, { speed });
    else c.setSpeed(speed);
  }
  // Üst gövde duruşu (nişan, savunma): eylem yokken sürekli
  _wantUpper(name) {
    const c = this.char;
    if (this.action || this.busy || this.dead || this.downed) return;
    if (name) { if (c.upperName !== name) c.playUpper(name, 0.15); }
    else if (c.upper && !c.upperOnce) c.stopUpper(0.2);
  }

  _moveDir() {
    const ax = input.moveAxis();
    const f = tpCamera.forward(), r = tpCamera.right();
    const d = new THREE.Vector3().addScaledVector(f, ax.y).addScaledVector(r, ax.x);
    const mag = Math.min(1, Math.hypot(ax.x, ax.y));
    if (d.lengthSq() > 1e-4) d.normalize();
    return { d, mag };
  }

  _speedFor(mag) {
    let sp = 4.4;
    this.sprinting = false;
    if (input.isDown('kos') && this.stamina > 2 && !this.carrying && !this.aiming && mag > 0.3) {
      sp = 7.0; this.sprinting = true;
    }
    if (this.crouch) sp = 1.7;
    if (this.aiming || this.blocking) sp = 2.0;
    if (this.carrying) sp *= this.carrying.speedFactor || 0.6;
    if (this.busy) sp = 0;
    const a = this.action;
    if (a) {
      if (a.type === 'atk') sp *= a.heavy || a.counter ? 0.15 : 0.5;
      else if (['interact', 'pickup', 'dig', 'cheer', 'stagger', 'getup', 'land', 'parry'].includes(a.type)) sp *= 0.1;
      else if (['slash', 'punch', 'shoot', 'reload', 'hit', 'use', 'throw', 'blockhit'].includes(a.type)) sp *= 0.5;
    }
    return sp * mag;
  }

  _commonCombatInput(dt) {
    // nişan / savunma
    const rmb = input.isDown('nisan') && !this.carrying;
    this.aiming = rmb && this.equipped === 'pistol';
    // savunma histerezisi: başlamak için dayanıklılık > 10, sürdürmek için > 0 (kare kare açılıp kapanmaz);
    // bırakıldıktan sonra 0.25 sn yeniden başlanamaz (parry penceresi tuş spam'iyle sürekli açık kalmaz)
    this.blockCd = Math.max(0, this.blockCd - dt);
    const canBlock = this.equipped === 'sword' && this.stamina > (this.blocking ? 0 : 10) && this.guardBroken <= 0 && !(this.action && ['atk', 'dodge', 'stagger'].includes(this.action.type)) && (this.blocking || this.blockCd <= 0);
    const wasBlocking = this.blocking;
    this.blocking = rmb && canBlock;
    if (wasBlocking && !this.blocking) this.blockCd = 0.25;
    if (this.blocking) this.stamina -= dt * 4;
    // kaçınma: hareket yönüne göre ileri/geri/sol/sağ
    if (input.pressed('kacin') && this.stamina > 16 && !this.carrying && this.onGround && (!this.action || ['atk', 'hit', 'blockhit', 'shoot'].includes(this.action.type) && this.action.t > 0.15)) {
      const md = this._moveDir().d;
      const dir = md.lengthSq() > 0 ? md.clone() : new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
      const rel = wrapAngle(Math.atan2(dir.x, dir.z) - this.yaw);
      const anim = Math.abs(rel) < 0.785 ? 'Dodge_F' : Math.abs(rel) > 2.356 ? 'Dodge_B' : rel > 0 ? 'Dodge_L' : 'Dodge_R';
      this.stamina -= 16;
      this.invuln = 0.34;
      this.blocking = false;
      this.char.stopUpper(0.04);
      this.startAction('dodge', 0.46, { dir, anim, keepYaw: anim !== 'Dodge_F' });
      G.emit('sfx', { name: 'dash', pos: this.pos, vol: 0.3 });
      G.emit('netAction', { a: 'dodge' });
    }
  }

  _faceTowards(d, dt, rate = 12) {
    if (d.lengthSq() < 1e-4) return;
    this.yaw = dampAngle(this.yaw, Math.atan2(d.x, d.z), rate, dt);
  }

  _updateGround(dt, locked) {
    const { d, mag } = locked ? { d: new THREE.Vector3(), mag: 0 } : this._moveDir();
    if (!locked) {
      if (input.pressed('egil')) this.crouch = !this.crouch;
      this._commonCombatInput(dt);
    }
    if (this.sprinting || this.carrying) this.crouch = false;
    let sp = this._speedFor(mag);
    let wish = d.clone().multiplyScalar(sp);
    if (this.action?.type === 'dodge' || this.action?.type === 'roll') {
      // hızlı çıkış, yumuşak duruş
      const k = clamp(1 - this.action.t / this.action.dur, 0, 1);
      wish = this.action.dir.clone().multiplyScalar(2.5 + 7.5 * k * k);
    } else if (this.action?.type === 'atk' && this.action.lunge && this.action.t < this.action.hitAt) {
      // vuruşa doğru küçük atılım
      wish.add(new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw)).multiplyScalar(this.action.lunge));
    }
    if (this.sprinting) this.stamina = Math.max(0, this.stamina - dt * 14);
    // yönelim
    if (this.action && this.action.lockYaw !== undefined && this.action.lockYaw !== null) {
      this.yaw = dampAngle(this.yaw, this.action.lockYaw, 20, dt);
    } else if (this.aiming || this.blocking || (this.action && ['slash', 'shoot', 'punch', 'atk'].includes(this.action.type))) {
      this.yaw = dampAngle(this.yaw, tpCamera.yaw, 16, dt);
    } else if (this.action?.type === 'dodge' || this.action?.type === 'roll') { if (!this.action.keepYaw) this._faceTowards(this.action.dir, dt, 20); }
    else this._faceTowards(wish, dt, this.sprinting ? 7 : 12);

    // ivme: kalkışta yumuşak, duruşta daha hızlı; havada az kontrol
    const speedNow = Math.hypot(this.vel.x, this.vel.z), speedWish = Math.hypot(wish.x, wish.z);
    const accel = !this.onGround ? 2.5 : this.action?.type === 'dodge' ? 20 : speedWish > speedNow ? 9 : 13;
    this.vel.x = damp(this.vel.x, wish.x, accel, dt);
    this.vel.z = damp(this.vel.z, wish.z, accel, dt);
    // geri tepme itkisi (sönümlenir)
    if (this.knock) {
      // 60 Hz'de kare başına eklenen itki; dt ile ölçeklenir (30/120 FPS'te aynı savrulma)
      this.vel.x += this.knock.x * 60 * dt; this.vel.z += this.knock.z * 60 * dt;
      this.knock.x *= Math.exp(-9 * dt); this.knock.z *= Math.exp(-9 * dt);
      if (Math.hypot(this.knock.x, this.knock.z) < 0.1) this.knock = null;
    }
    // dik yamaçta kayma: zemin normali yatıklaştıkça aşağı doğru ivme
    if (this.onGround && !this.onPlatform) {
      const gn = terrain.normalAt(this.pos.x, this.pos.z, _v2);
      if (gn.y < 0.68) {
        const slide = (0.68 - gn.y) * 26;
        this.vel.x += gn.x * slide * dt * 4; this.vel.z += gn.z * slide * dt * 4;
        this.sliding = true;
      } else this.sliding = false;
    }
    // zıplama
    if (!locked && input.pressed('zipla') && this.onGround && !this.busy && (!this.action || this.action.type === 'land') && (!this.carrying || this.carrying.tier === 'small')) {
      this.vel.y = 7.4;
      this.onGround = false;
      this.crouch = false;
      this.action = null;
      this.jumpAnimT = 0;
      if (!this.carrying) { this.char.stopUpper(0.05); this.char.play('JumpStart', 0.06, { once: true, restart: true, speed: 1.5 }); }
      G.emit('sfx', { name: 'dash', pos: this.pos, vol: 0.25 });
    }
    this.vel.y += GRAV * dt;
    const old = this.pos.clone();
    const nx = this.pos.x + this.vel.x * dt, nz = this.pos.z + this.vel.z * dt;
    // eğim kontrolü: çok dik yamaca tırmanılamaz
    const gNew = physics.groundAt(nx, nz, this.pos.y);
    const gOld = physics.groundAt(this.pos.x, this.pos.z, this.pos.y);
    const n = terrain.normalAt(nx, nz, _v);
    const climbing = gNew > gOld + 0.02;
    if (this.onGround && climbing && n.y < 0.6 && !physics.lastPlatform) {
      // çok dik: tırmanılamaz, geri kayar
      // (kare hızından bağımsız: 60 Hz'deki 0.2 çarpanı ve 2 cm itiş dt ile ölçeklenir)
      const kk = Math.exp(-96 * dt);
      this.vel.x = this.vel.x * kk + n.x * 1.875 * (1 - kk); this.vel.z = this.vel.z * kk + n.z * 1.875 * (1 - kk);
      this.pos.x += n.x * 1.2 * dt; this.pos.z += n.z * 1.2 * dt;
    } else if (gNew > this.pos.y + 0.65) {
      // basamak yüksek
    } else {
      this.pos.x = nx; this.pos.z = nz;
    }
    this.pos.y += this.vel.y * dt;
    physics.resolve(this.pos, 0.33, this.pos.y);
    this._shipHullPush();
    const g = physics.groundAt(this.pos.x, this.pos.z, this.pos.y);
    this.onPlatform = !!physics.lastPlatform;
    if (this.pos.y <= g + 0.02 && this.vel.y <= 0.5) {
      const fall = this.fallStartY - g;
      if (!this.onGround && fall > 7) {
        const dmg = (fall - 7) * 7;
        this.hurt(dmg, null, { cause: 'Yüksekten düştün' });
        G.emit('sfx', { name: 'land', pos: this.pos, vol: 0.6 });
      } else if (!this.onGround && fall > 1.5) G.emit('sfx', { name: 'land', pos: this.pos, vol: 0.3 });
      if (!this.onGround && fall > 0.9 && !this.action && !this.carrying && Math.hypot(this.vel.x, this.vel.z) < 3.2 && !this.dead) this.startAction('land', fall > 3 ? 0.5 : 0.3);
      this.pos.y = g;
      this.vel.y = 0;
      this.onGround = true;
      this.airT = 0;
      this.fallStartY = this.pos.y;
    } else {
      if (this.onGround && g < this.pos.y - 0.3) this.fallStartY = this.pos.y;
      if (this.onGround && this.pos.y - g < 0.35 && this.vel.y <= 0) { this.pos.y = g; this.vel.y = 0; }
      else { this.onGround = false; this.airT = (this.airT || 0) + dt; }
      if (this.vel.y > 0) this.fallStartY = Math.max(this.fallStartY, this.pos.y);
    }
    // suya girdi mi?
    const wh = ocean.heightAt(this.pos.x, this.pos.z);
    if (this._modeT <= 0 && this.pos.y < wh - 1.15 && g < wh - 1.35) {
      this.enterWater();
      return;
    }
    if (this.onGround && g > 0.5) this.lastSafe.copy(this.pos);
    // animasyon
    const hs = Math.hypot(this.vel.x, this.vel.z);
    this._locomotion(hs, dt, !this.onGround);
    // adım sesi
    if (this.onGround && hs > 1) {
      this.stepT += dt * hs;
      if (this.stepT > (this.sprinting ? 2.6 : 2.2)) { this.stepT = 0; G.emit('sfx', { name: 'step', pos: this.pos, vol: 0.12 + hs * 0.02, rate: 0.9 + Math.random() * 0.2 }); }
    }
  }

  // Hareket animasyonları: nişan/savunmada yan adım + üst gövde katmanı, boşta bekleme çeşitleri, zıplama evreleri
  _locomotion(hs, dt, air) {
    const c = this.char;
    if (this.action && !c.upper) { this.idleT = 0; return; }
    // üst gövde duruşu
    this._wantUpper(this.aiming ? 'Aim' : this.blocking ? 'Block' : null);
    if (air && this.mode === 'ground') {
      this.jumpAnimT = (this.jumpAnimT || 0) + dt;
      if (this.airT > 0.25 || (this.jumpAnimT > 0.35 && c.currentName === 'JumpStart')) this._wantAnim('Jump_Idle', 1, 0.15);
      return;
    }
    if (hs < 0.25) {
      this.idleT += dt;
      const combat = G.inCombat && this.equipped === 'sword';
      // uzun beklemede ara sıra farklı bekleme pozu
      const idle = combat ? 'IdleCombat' : this.idleT > 9 && (this.idleT % 14) < 2.1 && !this.aiming && !this.blocking ? 'IdleB' : 'Idle';
      this._wantAnim(idle, 1, 0.3);
      return;
    }
    this.idleT = 0;
    if (this.aiming || this.blocking) {
      // gövde kameraya dönük: hareket yönüne göre yan adım / geri yürüme
      const rel = wrapAngle(Math.atan2(this.vel.x, this.vel.z) - this.yaw);
      const a = Math.abs(rel) < 0.7 ? 'Walk' : Math.abs(rel) > 2.4 ? 'WalkBack' : rel > 0 ? 'StrafeL' : 'StrafeR';
      this._wantAnim(a, clamp(hs / (a.startsWith('Strafe') ? 3.6 : 1.9), 0.5, 1.3), 0.25);
      return;
    }
    if (this.crouch || hs < 2.6) this._wantAnim('Walk', clamp(hs / 1.9, 0.5, 1.4));
    else if (this.sprinting && hs > 5.6) this._wantAnim('Sprint', clamp(hs / 6.6, 0.8, 1.35));
    else this._wantAnim('Run', clamp(hs / 5.2, 0.7, 1.45));
  }

  // Gemi gövdesine dışarıdan girme
  _shipHullPush() {
    for (const s of G.ships) {
      if (s.sunk) continue;
      const dx = this.pos.x - s.x, dz = this.pos.z - s.z;
      if (dx * dx + dz * dz > (s.T.L * 0.7) ** 2) continue;
      const lx = dx * Math.cos(s.yaw) - dz * Math.sin(s.yaw);
      const lz = dx * Math.sin(s.yaw) + dz * Math.cos(s.yaw);
      if (Math.abs(lz) > s.T.L / 2 + 0.3) continue;
      const hw = hullHalfWidth(s.T, clamp(lz, -s.T.L / 2, s.T.L / 2)) + 0.4;
      if (Math.abs(lx) < hw && this.pos.y < s.y + s.T.deckY + 0.6) {
        const nlx = (lx >= 0 ? 1 : -1) * hw;
        this.pos.x = s.x + nlx * Math.cos(s.yaw) + lz * Math.sin(s.yaw);
        this.pos.z = s.z - nlx * Math.sin(s.yaw) + lz * Math.cos(s.yaw);
      }
    }
  }

  enterWater() {
    this._modeT = 0.35;
    this.mode = 'swim';
    this.crouch = false;
    this.aiming = false;
    if (this.carrying && this.carrying.tier !== 'small') G.emit('dropCarry', { player: this, inWater: true });
    if (this.equipped !== 'none') this.char.hold(null);
    this._syncTorch();
    this.vel.y *= 0.3;
    G.emit('sfx', { name: 'impact', pos: this.pos, vol: 0.4, rate: 0.6 });
    G.emit('splash', { x: this.pos.x, z: this.pos.z, size: 1 });
  }

  _updateSwim(dt, locked) {
    const { d, mag } = locked ? { d: new THREE.Vector3(), mag: 0 } : this._moveDir();
    const wh = ocean.heightAt(this.pos.x, this.pos.z);
    const surfaceY = wh - 1.35;
    let vy = 0;
    const fast = !locked && input.isDown('kos') && this.stamina > 2;
    if (!locked && input.isDown('egil')) vy = -2.4;
    else if (!locked && input.isDown('zipla')) vy = 2.6;
    else if (this.pos.y < surfaceY - 0.1) vy = 0.6; // yavaşça yüzeye çık
    let sp = (this.pos.y < surfaceY - 0.5 ? 2.6 : 2.8) * mag * (fast ? 1.45 : 1);
    if (fast && mag > 0.2) this.stamina = Math.max(0, this.stamina - dt * 10);
    if (this.carrying) sp *= 0.6;
    this.vel.x = damp(this.vel.x, d.x * sp, 5, dt);
    this.vel.z = damp(this.vel.z, d.z * sp, 5, dt);
    this.vel.y = damp(this.vel.y, vy, 4, dt);
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;
    this.pos.y += this.vel.y * dt;
    // dünya sınırı (20×20 km haritanın kenarı): yüzerek dışarı çıkılamaz
    const lim = WORLD_HALF - 250;
    if (Math.abs(this.pos.x) > lim || Math.abs(this.pos.z) > lim) {
      this.pos.x = clamp(this.pos.x, -lim, lim); this.pos.z = clamp(this.pos.z, -lim, lim);
      if (!(this._edgeT > 0)) { this._edgeT = 10; G.notify('Açık denizin sonu: haritanın kenarına ulaştın.', 'warn', 3000); }
    }
    if (this._edgeT > 0) this._edgeT -= dt;
    if (this.pos.y > surfaceY) { this.pos.y = damp(this.pos.y, surfaceY, 8, dt); if (this.vel.y > 0) this.vel.y = 0; }
    const floor = terrain.heightAt(this.pos.x, this.pos.z);
    if (this.pos.y < floor + 0.15) this.pos.y = floor + 0.15;
    physics.resolve(this.pos, 0.35, this.pos.y);
    this._shipHullPush();
    this.swimMoving = mag > 0.1 || Math.abs(vy) > 0.5;
    this.swimPhase += dt * (this.swimMoving ? 4.2 : 2.2) * (fast ? 1.3 : 1);
    if (mag > 0.1) this._faceTowards(d, dt, 6);
    // derinlik ve oksijen
    this.depth = Math.max(0, wh - (this.pos.y + 1.55));
    this.underwater = this.pos.y + 1.6 < wh;
    if (this.underwater) {
      this.oxygen = Math.max(0, this.oxygen - dt * (100 / 50) / (G.mods?.breath || 1));
      if (this.oxygen <= 0) this.hurt(dt * 9, null, { cause: 'Boğuldun' });
    } else this.oxygen = Math.min(100, this.oxygen + dt * 35);
    // görsel: yatay yüzüş
    const c = this.char;
    const pitch = this.swimMoving ? (this.pos.y < surfaceY - 0.6 ? 1.35 + clamp(-this.vel.y * 0.15, -0.5, 0.5) : 1.2) : 0.15;
    c.root.rotation.set(0, this.yaw, 0);
    c.model.rotation.x = damp(c.model.rotation.x, pitch, 6, dt);
    c.model.position.y = damp(c.model.position.y, this.swimMoving ? 1.0 : 0, 6, dt);
    this._wantAnim('Idle');
    // sığ suya çıkış (histerezis: giriş eşiği wh-1.35'in üstünde; mod kilidi süresince değişmez)
    if (this._modeT <= 0 && (floor > wh - 1.25 || this.pos.y - floor < 0.3 && floor > wh - 1.3)) {
      this.exitWater();
    }
  }
  exitWater() {
    this._modeT = 0.35;
    this.mode = 'ground';
    this.char.model.rotation.x = 0;
    this.char.model.position.y = 0;
    this.underwater = false;
    this.oxygen = 100;
    this.pos.y = Math.max(this.pos.y, terrain.heightAt(this.pos.x, this.pos.z));
    if (this.equipped !== 'none') this.char.hold(this.equipped);
    this._syncTorch();
  }

  _updateDeck(dt, locked) {
    const s = this.ship;
    if (!s || s.sunk || !s.root.parent) { this.leaveShipToWorld(this.pos.clone(), new THREE.Vector3()); return; }
    // batan gemi: güverte su altına inince denize geç (su altında yürüme yok)
    if (s.sinking && this.pos.y < ocean.heightAt(this.pos.x, this.pos.z) - 0.5) {
      this.leaveShipToWorld(this.pos.clone(), new THREE.Vector3(s.vx || 0, 0, s.vz || 0));
      this.enterWater();
      return;
    }
    const { d, mag } = locked ? { d: new THREE.Vector3(), mag: 0 } : this._moveDir();
    if (!locked) { if (input.pressed('egil')) this.crouch = !this.crouch; this._commonCombatInput(dt); }
    const sp = this._speedFor(mag);
    // dünya yönünü gemi yereline çevir
    const cy = Math.cos(-s.yaw), sy = Math.sin(-s.yaw);
    const lx = d.x * cy + d.z * sy, lz = -d.x * sy + d.z * cy;
    this.local.x += lx * sp * dt;
    this.local.z += lz * sp * dt;
    // güverte fiziği: yalpa ve baş-kıç vurmada eğime doğru hafif kayma, gemi ivmesinde atalet
    // (kontrolsüz savrulma yok: ölü bölge ve sınırlı kayma)
    if (this.localY <= 0.01) {
      const rollEx = Math.sign(s.roll) * Math.max(0, Math.abs(s.roll) - 0.1);
      const pitchEx = Math.sign(s.pitch) * Math.max(0, Math.abs(s.pitch) - 0.08);
      const slip = this.crouch ? 0.35 : 1;
      this.local.x += -Math.sin(rollEx) * 6.5 * slip * dt;
      this.local.z += Math.sin(pitchEx) * 5 * slip * dt;
      const acc = ((s.speed || 0) - (this._lastShipSpeed ?? s.speed ?? 0)) / Math.max(dt, 1e-3);
      this._lastShipSpeed = s.speed;
      this.local.z -= clamp(acc, -3, 3) * 0.04 * slip * dt * 10;
      // fırtınada sendeleme
      if (Math.abs(s.roll) > 0.3 && !this.action && !this.busy && Math.random() < dt * 0.6 * slip) {
        this.startAction('hit', 0.4);
        G.notify('Güverte sallandı — dengeni kaybettin! (Eğilerek daha sağlam durursun)', 'warn', 2200);
      }
    }
    // zıplama ve küpeşteden atlama
    if (!locked && input.pressed('zipla') && this.localY <= 0.001 && !this.busy) { this.localVy = 6.5; }
    this.localVy += GRAV * dt;
    this.localY = Math.max(0, this.localY + this.localVy * dt);
    if (this.localY <= 0) this.localVy = 0;
    const hw = hullHalfWidth(s.T, this.local.z);
    const outside = !s.insideDeck(this.local.x, this.local.z, 0.38);
    if (outside && this.localY > 0.55 && mag > 0.2) {
      // küpeşteden aşarak denize atla
      const w = s.localToWorld(new THREE.Vector3(this.local.x * 1.08, s.deckAt(this.local.x, this.local.z) + this.localY, this.local.z));
      const vel = new THREE.Vector3(d.x * 4, 3, d.z * 4).add(new THREE.Vector3(s.vx || 0, 0, s.vz || 0));
      this.leaveShipToWorld(w, vel);
      this.fallStartY = w.y + 5; // suya düşüşte hasar yok
      return;
    }
    s.clampDeck(this.local);
    void hw;
    const dy = s.deckAt(this.local.x, this.local.z);
    _v.set(this.local.x, dy + this.localY, this.local.z);
    s.localToWorld(_v, this.pos);
    // yön
    if (this.action && this.action.lockYaw !== undefined && this.action.lockYaw !== null) this.yaw = dampAngle(this.yaw, this.action.lockYaw, 20, dt);
    else if (this.aiming || this.blocking || (this.action && ['slash', 'shoot', 'punch'].includes(this.action.type))) this.yaw = dampAngle(this.yaw, tpCamera.yaw, 16, dt);
    else if (mag > 0.05) this._faceTowards(d, dt);
    const ws = sp;
    this.onGround = this.localY <= 0.01;
    this.vel.set(d.x * ws, 0, d.z * ws);
    this._locomotion(ws, dt, !this.onGround);
    if (ws > 1 && this.onGround) {
      this.stepT += dt * ws;
      if (this.stepT > 2.2) { this.stepT = 0; G.emit('sfx', { name: 'step', pos: this.pos, vol: 0.15, rate: 0.7 }); }
    }
  }

  _updateHelm(dt, locked) {
    const s = this.ship;
    if (!s) { this.mode = 'ground'; return; }
    const ax = locked ? { x: 0, y: 0 } : input.moveAxis();
    s.setRudder(-ax.x);
    s.backing = ax.y < -0.3 && s.sailTarget <= 0.01;
    if (Math.abs(ax.y) > 0.3) s.adjustSail(ax.y * dt * 0.45);
    if (!locked && input.pressed('zipla')) s.toggleSails();
    const st = s.model.stations.helm;
    _v.set(st.x, st.y, st.z);
    s.localToWorld(_v, this.pos);
    this.yaw = s.yaw;
    this._wantAnim('Idle');
  }

  _updateCannon(dt, locked) {
    const s = this.ship;
    if (!s) { this.mode = 'ground'; return; }
    const ci = this.cannonIndex;
    const cn = s.model.cannons[ci];
    // topun arkasında dur
    const back = new THREE.Vector3(0, 0, -1.2).applyAxisAngle(new THREE.Vector3(0, 1, 0), cn.mesh.rotation.y);
    _v.copy(cn.local).add(back);
    s.localToWorld(_v, this.pos);
    this.yaw = s.yaw + cn.mesh.rotation.y;
    this._wantAnim('Idle');
  }

  _updateBoat(dt, locked) {
    const b = G.rowboat;
    if (!b) { this.mode = 'ground'; return; }
    const ax = locked ? { x: 0, y: 0 } : input.moveAxis();
    b.control(ax.y, -ax.x, dt);
    b.seatWorld(this.pos);
    this.pos.y -= 0.55;
    this.yaw = b.yaw;
    this._wantAnim('Idle');
  }

  _updateClimb(dt) {
    const s = this.ship;
    this.climbT += dt;
    this.climbPhase = this.climbT * 7;
    const k = clamp(this.climbT / 1.6, 0, 1);
    const st = s.model.stations;
    _v.set(st.ladder.x + 0.2, lerp(-1.2, s.deckAt(0, st.ladder.z) + 0.1, k), st.ladder.z);
    s.localToWorld(_v, this.pos);
    this.yaw = s.yaw + Math.PI / 2;
    this.char.model.rotation.x = 0; this.char.model.position.y = 0;
    this._wantAnim('Idle');
    if (k >= 1) {
      this.boardShip(s, st.ladderTop.clone());
      if (this.equipped !== 'none') this.char.hold(this.equipped);
    }
  }
  startClimb(ship) {
    this.ship = ship;
    this.mode = 'climb';
    this.climbT = 0;
    this.underwater = false;
    this.oxygen = 100;
    this.char.model.rotation.x = 0;
    this.char.model.position.y = 0;
    G.emit('sfx', { name: 'step', vol: 0.3 });
  }

  // ağ için durum
  netState() {
    return {
      x: +this.pos.x.toFixed(2), y: +this.pos.y.toFixed(2), z: +this.pos.z.toFixed(2), yaw: +this.yaw.toFixed(2),
      anim: this.char.currentName, up: this.char.upperName || null, mode: this.mode, eq: this.equipped, carry: this.carrying ? this.carrying.id : null,
      hp: Math.round(this.hp), torch: this.torch, down: this.downed, swimP: +(this.char.model.rotation.x).toFixed(2),
      ship: this.ship ? this.ship.id : null, lx: +this.local.x.toFixed(2), lz: +this.local.z.toFixed(2), ly: +this.localY.toFixed(2),
    };
  }
}
