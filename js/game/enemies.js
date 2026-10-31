import * as THREE from 'three';
import { G } from './ctx.js';
import { Character } from '../player/character.js';
import { randomAppearance } from '../player/appearance.js';
import { combat } from './combat.js';
import { effects } from './effects.js';
import { audio } from '../core/audio.js';
import { terrain } from '../world/terrain.js';
import { physics } from '../world/physics.js';
import { ocean } from '../world/ocean.js';
import { sky } from '../world/sky.js';
import { time } from '../world/time.js';
import { isOnce } from '../core/kk.js';
import { clamp, damp, dampAngle, rng, wrapAngle, uid, lerp } from '../core/util.js';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

// ---------------------------------------------------------------------------
// Saldırı setleri. hitAt = hazırlık (telgraf) süresi; oyuncu bu sürede kaçınabilir/parry yapabilir.
// unblockable: kırmızı parlamayla işaretlenir, yalnızca kaçınılabilir.
// ---------------------------------------------------------------------------
const MOVES = {
  sword1h: [
    { anim: 'Atk1', speed: 1.15, dur: 0.9, hitAt: 0.42, mult: 1 },
    { anim: 'Atk2', speed: 1.15, dur: 0.95, hitAt: 0.44, mult: 1 },
    { anim: 'Atk3', speed: 1.05, dur: 1.05, hitAt: 0.52, mult: 1.3, kb: 2.5 },
    { anim: 'AtkStab', speed: 1.35, dur: 1.2, hitAt: 0.58, mult: 1.15, reach: 0.5 },
  ],
  axe1h: [
    { anim: 'Atk3', speed: 1.0, dur: 1.1, hitAt: 0.55, mult: 1.15, kb: 2.5 },
    { anim: 'Atk1', speed: 1.1, dur: 0.95, hitAt: 0.45, mult: 1 },
  ],
  shield: [
    { anim: 'Atk1', speed: 1.0, dur: 1.0, hitAt: 0.5, mult: 1 },
    { anim: 'Counter', speed: 1.05, dur: 1.0, hitAt: 0.38, mult: 0.7, kb: 4.5, name: 'Kalkan darbesi' },
    { anim: 'Atk3', speed: 0.85, dur: 1.3, hitAt: 0.68, mult: 1.35, kb: 3 },
  ],
  twoh: [
    { anim: 'Atk2H', speed: 1.0, dur: 1.1, hitAt: 0.52, mult: 1 },
    { anim: 'Stab2H', speed: 1.2, dur: 1.35, hitAt: 0.62, mult: 1.1, reach: 0.7 },
    { anim: 'Heavy2H', speed: 0.82, dur: 2.0, hitAt: 1.15, mult: 1.8, unblockable: true, aoe: 2.2, kb: 5, w: 0.6 },
  ],
  dual: [
    { anim: 'DualSlice', speed: 1.25, dur: 0.95, hitAt: 0.4, mult: 0.85 },
    { anim: 'DualChop', speed: 1.2, dur: 1.05, hitAt: 0.47, mult: 1 },
    { anim: 'DualStab', speed: 1.4, dur: 1.15, hitAt: 0.55, mult: 1.2, reach: 0.4 },
  ],
  fists: [
    { anim: 'Punch', speed: 1.25, dur: 1.15, hitAt: 0.44, mult: 1 },
    { anim: 'Punch2', speed: 1.25, dur: 1.3, hitAt: 0.52, mult: 1.1 },
    { anim: 'Kick', speed: 0.95, dur: 1.0, hitAt: 0.45, mult: 1.2, kb: 4.5 },
  ],
};
const SPIN = { anim: 'Spin2H', speed: 1.1, dur: 2.2, hitAt: 0.7, hits: [0.7, 1.15, 1.6], mult: 0.7, unblockable: true, aoe360: 2.8, kb: 3.5 };
const DASH = { anim: 'Atk3', speed: 1.0, dur: 1.4, hitAt: 0.9, mult: 1.4, unblockable: true, dash: 9, kb: 5 };

// Menzilli silahlar
const RANGED = {
  pistol: { aim: 'Aim', shoot: 'Gun_Shoot', reload: 'Reload', aimT: 0.95, reloadT: 2.4, proj: 'bullet', speed: 95, spread: 0.035 },
  xbow1h: { aim: 'Aim', shoot: 'Gun_Shoot', reload: 'Reload', aimT: 1.0, reloadT: 1.9, proj: 'bolt', speed: 42, spread: 0.03 },
  xbow2h: { aim: 'Aim2H', shoot: 'Shoot2H', reload: 'Reload2H', aimT: 1.1, reloadT: 2.0, proj: 'bolt', speed: 44, spread: 0.025 },
  ghost: { aim: 'CastRaise', shoot: 'Cast', reload: null, aimT: 0.9, reloadT: 1.7, proj: 'ghostbolt', speed: 15, spread: 0, homing: 1.3 },
  knife: { aim: null, shoot: 'Throw', reload: null, aimT: 0.5, reloadT: 3.2, proj: 'knife', speed: 26, spread: 0.04 },
};

// Eski kimlikler (kayıt uyumluluğu)
const ALIASES = { hayalet_kafa: 'hayalet_nisanci', haydut_tabanca: 'haydut_nisanci' };

const BANDIT = { hatColor: '#8a1f1f', coatColor: '#5a1a1a', shirtColor: '#7a2a22', pantsColor: '#3a2a1e', beltColor: '#2a1a10' };

// ---------------------------------------------------------------------------
// Düşman kataloğu (değerler belgedeki denge tablosuyla aynıdır: docs/05_DUSMAN_DENGE_TABLOSU.md)
// ---------------------------------------------------------------------------
export const ENEMY_TYPES = {
  // --- İnsanlar: Kızıl Hançer çetesi ---
  haydut: {
    name: 'Haydut', faction: 'insan', hp: 100, dmg: 12, speed: 4.3, walk: 1.5, range: 1.9, moves: 'sword1h',
    body: ['cevik', 'kaba'], weapon: ['sword', 'kk:Knife', 'kk:1H_Axe'], look: { hat: 'bandana', ...BANDIT },
    vision: 24, fov: 125, hearing: 1, morale: 0.22, xp: 10, roles: ['patrol', 'rest', 'sentry'],
    loot: [['altin_para', 15, 40], ['mermi', 0.4], ['ekmek', 0.3]],
  },
  haydut_nisanci: {
    name: 'Nişancı', faction: 'insan', hp: 80, dmg: 20, speed: 3.9, walk: 1.4, range: 1.7, moves: 'fists', ranged: 'pistol', keep: [9, 17],
    body: ['kukuleta', 'cevik'], weapon: ['pistol'], look: { hat: 'tricorn', ...BANDIT }, cover: true,
    vision: 32, fov: 110, hearing: 1, morale: 0.3, xp: 12, roles: ['sentry', 'patrol'],
    loot: [['altin_para', 20, 45], ['mermi', 0.8]],
  },
  haydut_agir: {
    name: 'Ağır Zırhlı', faction: 'insan', hp: 250, dmg: 25, speed: 3.0, walk: 1.2, range: 2.1, moves: 'shield', shield: 0.85, backMult: 1.6, poise: true,
    body: ['subay'], weapon: ['kk:1H_Axe+Rectangle_Shield'], look: { hat: 'orijinal', ...BANDIT }, scale: 1.1,
    vision: 20, fov: 110, hearing: 0.8, morale: 0.05, xp: 25, roles: ['sentry'],
    loot: [['altin_para', 30, 70], ['gumus_kulce', 0.4], ['merhem', 0.3]],
  },
  haydut_avci: {
    name: 'Avcı', faction: 'insan', hp: 150, dmg: 18, speed: 4.9, walk: 1.6, range: 1.8, moves: 'dual', flanker: true, dodge: 0.3, throwKnife: true,
    body: ['kukuleta'], weapon: ['kk:Knife+Knife_Offhand'], look: { hat: 'orijinal', ...BANDIT, coatColor: '#3a2a1a' },
    vision: 30, fov: 140, hearing: 1.4, morale: 0.15, xp: 20, roles: ['patrol'],
    loot: [['altin_para', 25, 60], ['hayvan_postu', 0.4]],
  },
  haydut_kaptani: {
    name: 'Haydut Kaptanı', faction: 'insan', hp: 500, dmg: 30, speed: 3.9, walk: 1.4, range: 2.5, moves: 'twoh', parry: 0.25, callHelp: true, rally: true, miniboss: true,
    body: ['kaba'], weapon: ['kk:2H_Axe'], look: { hat: 'kaptan', coat: 'uzun', ...BANDIT, coatColor: '#4a1010' }, scale: 1.16,
    vision: 26, fov: 130, hearing: 1.1, morale: 0, xp: 60, roles: ['sentry'],
    loot: [['altin_para', 120, 220], ['altin_kulce', 0.6], ['yakut', 0.3], ['korsan_madalyonu', 0.25]],
  },
  kizil_hancer: {
    name: 'Kızıl Hançer', faction: 'insan', hp: 650, dmg: 26, speed: 4.5, walk: 1.5, range: 2.2, moves: 'sword1h', ranged2: 'pistol', parry: 0.35, boss: true, callHelp: true,
    summonAt: [0.55], summon: ['haydut', 'haydut_nisanci'], smoke: true,
    body: ['kaba'], weapon: ['sword'], scale: 1.12, vision: 30, fov: 140, hearing: 1.2, morale: 0, xp: 150,
    loot: [['altin_para', 400, 600], ['kizil_mektup', 1], ['altin_kulce', 2]],
  },
  // --- İskeletler ---
  iskelet: {
    name: 'İskelet', faction: 'iskelet', hp: 90, dmg: 15, speed: 3.4, walk: 1.2, range: 1.9, moves: 'sword1h', rise: 0.3,
    base: 'sk_minion', weapon: ['kk:Skeleton_Blade'], walkAnim: 'WalkSk', vision: 20, fov: 120, hearing: 1.2, xp: 8, roles: ['patrol', 'sentry'],
    loot: [['altin_para', 8, 25], ['lanetli_kafatasi', 0.08]],
  },
  iskelet_nisanci: {
    name: 'İskelet Nişancı', faction: 'iskelet', hp: 75, dmg: 22, speed: 3.2, walk: 1.2, range: 1.7, moves: 'fists', ranged: 'xbow2h', keep: [10, 18], rise: 0.2,
    base: 'sk_rogue', weapon: ['kk:Skeleton_Crossbow'], walkAnim: 'WalkSk', vision: 30, fov: 110, hearing: 1, xp: 12, roles: ['sentry'],
    loot: [['altin_para', 12, 30], ['inci', 0.1]],
  },
  iskelet_agir: {
    name: 'Ağır İskelet', faction: 'iskelet', hp: 300, dmg: 30, speed: 2.7, walk: 1.0, range: 2.1, moves: 'shield', shield: 0.8, backMult: 1.5, poise: true, rise: 0.15,
    base: 'sk_warrior', weapon: ['kk:Skeleton_Axe+Skeleton_Shield_Large_A'], scale: 1.12, vision: 18, fov: 110, hearing: 0.8, xp: 25, roles: ['sentry'],
    loot: [['altin_para', 30, 60], ['eski_kilic', 0.25], ['lanetli_kafatasi', 0.15]],
  },
  iskelet_altin: {
    name: 'Altın İskelet', faction: 'iskelet', hp: 450, dmg: 35, speed: 3.2, walk: 1.2, range: 2.0, moves: 'sword1h', shield: 0.5, parry: 0.2, gold: true,
    base: 'sk_warrior', weapon: ['kk:Skeleton_Blade+Skeleton_Shield_Small_A'], scale: 1.08, vision: 22, fov: 120, hearing: 1, xp: 40, roles: ['sentry'],
    loot: [['altin_para', 60, 120], ['altin_kulce', 0.6], ['yakut', 0.25], ['altin_heykelcik', 0.1]],
  },
  iskelet_kaptan: {
    name: 'İskelet Kaptan Morvan', faction: 'iskelet', hp: 800, dmg: 35, speed: 3.4, walk: 1.2, range: 2.3, moves: 'sword1h', shield: 0.6, parry: 0.2, boss: true,
    summonAt: [0.66, 0.33], summon: ['iskelet', 'iskelet', 'iskelet_nisanci'], enrageAt: 0.33, spin: true, callHelp: true,
    base: 'sk_warrior', weapon: ['kk:Skeleton_Blade+Skeleton_Shield_Large_B'], hat: 'tricorn', hatColor: '#1a1a20', scale: 1.3, vision: 30, fov: 160, hearing: 1.5, xp: 200,
    loot: [['altin_para', 150, 250], ['lanetli_kafatasi', 1], ['korsan_madalyonu', 1]],
  },
  // --- Hayaletler (gece) ---
  hayalet: {
    name: 'Hayalet Korsan', faction: 'hayalet', hp: 120, dmg: 20, speed: 3.9, walk: 1.3, range: 2.0, moves: 'sword1h', ghost: 0x8ff0e0, night: true, phase: true,
    body: ['cevik'], weapon: ['kk:1H_Sword'], look: { hat: 'tricorn' }, vision: 24, fov: 150, hearing: 1.4, xp: 15,
    loot: [['altin_para', 10, 30], ['inci', 0.25]],
  },
  hayalet_bogulmus: {
    name: 'Boğulmuş Denizci', faction: 'hayalet', hp: 180, dmg: 25, speed: 3.0, walk: 1.0, range: 1.8, moves: 'fists', ghost: 0x7fd8a8, night: true, grab: true,
    body: ['kaba'], weapon: [null], look: { hat: 'bandana', hatColor: '#3a5a4a' }, vision: 16, fov: 120, hearing: 1.6, xp: 18,
    loot: [['altin_para', 15, 35], ['istiridye', 0.4], ['inci', 0.2]],
  },
  hayalet_nisanci: {
    name: 'Hayalet Nişancı', faction: 'hayalet', hp: 100, dmg: 30, speed: 3.4, walk: 1.2, range: 1.7, moves: 'fists', ranged: 'ghost', keep: [9, 16], ghost: 0xa0e8ff, night: true, phase: true,
    body: ['kukuleta'], weapon: ['kk:1H_Crossbow'], look: { hat: 'orijinal' }, vision: 30, fov: 150, hearing: 1.2, xp: 18,
    loot: [['altin_para', 25, 60], ['eski_mucevher', 0.3]],
  },
  hayalet_muhafiz: {
    name: 'Lanetli Muhafız', faction: 'hayalet', hp: 400, dmg: 35, speed: 3.0, walk: 1.0, range: 2.1, moves: 'shield', shield: 0.85, backMult: 1.5, poise: true, ghost: 0xa8b8ff,
    body: ['subay'], weapon: ['kk:1H_Sword+Spike_Shield'], look: { hat: 'orijinal' }, scale: 1.12, vision: 20, fov: 120, hearing: 1, xp: 40,
    loot: [['altin_para', 50, 100], ['eski_mucevher', 0.5], ['zumrut', 0.2]],
  },
  hayalet_kaptan: {
    name: 'Hayalet Kaptan', faction: 'hayalet', hp: 1000, dmg: 40, speed: 3.7, walk: 1.3, range: 2.5, moves: 'twoh', ghost: 0x9fffe0, boss: true, phase: true, dash: true,
    summonAt: [0.5], summon: ['hayalet', 'hayalet_bogulmus'], callHelp: true,
    body: ['kaba'], weapon: ['kk:2H_Sword'], look: { hat: 'kaptan', coat: 'uzun' }, scale: 1.3, vision: 30, fov: 170, hearing: 1.6, xp: 250,
    loot: [['altin_para', 300, 500], ['kraliyet_taci', 0.5], ['elmas', 1]],
  },
};
export function enemyType(t) { return ENEMY_TYPES[ALIASES[t] || t] ? (ALIASES[t] || t) : 'haydut'; }

// Yerleşim grupları (dünya modülü yenilerini enemies.addGroup ile ekler)
const BASE_GROUPS = [
  { id: 'kemik_harabe', x: -520, z: -440, r: 26, list: ['iskelet', 'iskelet', 'iskelet_nisanci', 'iskelet_agir'], night: ['iskelet', 'hayalet'], respawn: 240 },
  { id: 'kemik_mezar', x: -575, z: -465, r: 22, list: ['iskelet', 'iskelet_nisanci'], night: ['hayalet', 'hayalet_bogulmus', 'hayalet_nisanci'], respawn: 200 },
  { id: 'kemik_kuzey', x: -470, z: -400, r: 18, list: ['iskelet', 'iskelet_altin'], night: ['hayalet'], respawn: 260 },
  { id: 'kamp', x: -40, z: -228, r: 20, list: ['haydut', 'haydut', 'haydut_nisanci', 'haydut_avci', 'haydut_agir'], respawn: 300, fire: { x: -40, z: -228 } },
  { id: 'sahil_gece', x: 150, z: 160, r: 40, list: [], night: ['iskelet', 'iskelet'], respawn: 300 },
];

// ---------------------------------------------------------------------------
// Baş üstü göstergeler: ?, !, sersemleme, can çubuğu (paylaşılan dokular)
// ---------------------------------------------------------------------------
const ICONS = {};
function iconTex(kind) {
  if (ICONS[kind]) return ICONS[kind];
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = 'bold 52px "Pirata One", Georgia, serif';
  g.lineWidth = 7; g.strokeStyle = 'rgba(0,0,0,.85)';
  const txt = kind === 'q' ? '?' : kind === 'x' ? '!' : '✦';
  g.strokeText(txt, 32, 34);
  g.fillStyle = kind === 'q' ? '#ffd24a' : kind === 'x' ? '#ff4030' : '#fff6a0';
  g.fillText(txt, 32, 34);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return (ICONS[kind] = t);
}
const BAR_BG = new THREE.SpriteMaterial({ color: 0x140c08, depthTest: false, transparent: true, opacity: 0.75 });

// ---------------------------------------------------------------------------
export class Enemy {
  constructor(scene, type, x, z, opts = {}) {
    type = enemyType(type);
    this.id = opts.id || uid('en');
    this.type = type;
    this.T = ENEMY_TYPES[type];
    this.scene = scene;
    this.home = new THREE.Vector3(x, 0, z);
    this.homeR = opts.homeR || 15;
    this.group = opts.group;
    this.role = opts.role || 'patrol';
    const coop = G.online ? 1 + 0.35 * G.remotes.size : 1;
    this.maxHp = this.T.hp * coop * (opts.hpMul || 1);
    this.hp = this.maxHp;
    this.alive = true;
    this.state = 'patrol';
    this.stateT = 0;
    this.radius = this.T.boss ? 0.65 : this.T.scale > 1.1 ? 0.5 : 0.42;
    this.height = 1.8 * (this.T.scale || 1);
    this.pos = new THREE.Vector3(x, terrain.heightAt(x, z), z);
    this.vel = new THREE.Vector3();
    this.speedNow = 0;
    this.yaw = opts.yaw ?? Math.random() * 6.28;
    this.target = null;
    this.lastKnown = null;
    this.awareness = 0;       // 0..1 algı ölçeri
    this.lostT = 0;
    this.atkCd = 0.8 + Math.random();
    this.rangedCd = 1 + Math.random() * 1.5;
    this.revived = false;
    this.bloodColor = this.T.faction === 'insan' ? [0.6, 0.05, 0.05] : this.T.ghost ? [0.5, 1, 0.9] : [0.9, 0.9, 0.8];
    this.big = !!(this.T.boss || this.T.miniboss);
    this.thinkT = Math.random() * 0.2;
    this.summoned = 0;
    this.enraged = false;
    this.healed = false;
    this.calledHelp = false;
    this.stuckT = 0;
    this.detour = null;
    this.alert = 0; // gösterge: 0 yok, 1 ?, 2 !, 3 sersem
    this.hover = 0;
    this._buildModel(opts);
    this._buildHud();
    combat.addTarget(this);
    if (opts.rise) { this.state = 'rise'; this.stateT = 0; this.char.play('SpawnGround', 0, { once: true, speed: 1.6 }); }
    else if (this.role === 'rest') this.char.play('SitFloor', 0);
  }

  // ---- görünüm ----
  _buildModel(opts) {
    const T = this.T;
    const r = rng(opts.seed ?? ((Math.random() * 1e9) | 0));
    let app;
    if (T.base) {
      app = { ...randomAppearance(r), base: T.base, hat: T.hat || 'yok', hatColor: T.hatColor || '#222', beard: 'yok', eyepatch: 'yok', earring: 'yok', necklace: 'yok', coat: 'kisa', scar: 'yok', facemark: 'yok' };
    } else {
      app = opts.appearance ? { ...opts.appearance } : randomAppearance(r);
      const body = T.body[Math.floor(r() * T.body.length)];
      app.body = body;
      app.base = undefined;
      Object.assign(app, T.look || {});
      if (T.look?.hat === 'orijinal') app.hat = 'orijinal';
      app.cape = T.boss || T.miniboss ? 'var' : 'yok';
      app.height = 1;
    }
    this.char = new Character(app);
    this.anim = this.char;
    this.root = this.char.root;
    const weapon = T.weapon ? T.weapon[Math.floor(r() * T.weapon.length)] : null;
    this.weapon = weapon;
    if (weapon) this.char.hold(weapon);
    if (T.scale) this.root.scale.multiplyScalar(T.scale);
    if (T.gold) this.char.tint(0xffd27a, 0x3a2600);
    if (T.ghost) this.char.ghostly(T.ghost, 0.62);
    this.scene.add(this.root);
    this.char.play(this._idleAnim(), 0);
  }

  _buildHud() {
    const hud = new THREE.Group();
    hud.position.y = (this.T.ghost ? 2.25 : 2.1) / (this.root.scale.y || 1) * (this.T.scale || 1);
    const icon = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconTex('q'), depthTest: false, transparent: true }));
    icon.scale.set(0.42, 0.42, 1); icon.position.y = 0.35; icon.visible = false; icon.renderOrder = 12;
    const bg = new THREE.Sprite(BAR_BG); bg.scale.set(0.9, 0.09, 1); bg.renderOrder = 11; bg.visible = false;
    const fill = new THREE.Sprite(new THREE.SpriteMaterial({ color: this.T.faction === 'hayalet' ? 0x60e0d0 : 0xd83a2a, depthTest: false, transparent: true }));
    fill.scale.set(0.86, 0.06, 1); fill.renderOrder = 12; fill.visible = false;
    hud.add(icon, bg, fill);
    this.root.add(hud);
    this.hud = { group: hud, icon, bg, fill, showT: 0, kind: null };
  }

  _setIcon(kind) {
    const ic = this.hud.icon;
    if (!kind) { ic.visible = false; this.hud.kind = null; return; }
    if (this.hud.kind !== kind) { ic.material.map = iconTex(kind); ic.material.needsUpdate = true; this.hud.kind = kind; }
    ic.visible = true;
  }

  _updateHud(dt) {
    const h = this.hud;
    h.showT = Math.max(0, h.showT - dt);
    const showBar = this.alive && !this.T.boss && (h.showT > 0 || (this.hp < this.maxHp && this.state !== 'patrol' && this.state !== 'return'));
    h.bg.visible = h.fill.visible = showBar;
    if (showBar) {
      // ekran uzayında sola hizalı dolum: çapa noktası doluluk oranına göre kaydırılır
      const f = Math.max(0.02, clamp(this.hp / this.maxHp, 0, 1));
      h.fill.scale.x = 0.86 * f;
      h.fill.center.set(0.5 / f, 0.5);
    }
    const k = this.alert === 3 ? 's' : this.alert === 2 ? 'x' : this.alert === 1 ? 'q' : null;
    this._setIcon(this.alive ? k : null);
    if (k === 's') h.icon.material.rotation += dt * 4;
    else h.icon.material.rotation = 0;
  }

  _idleAnim() {
    const T = this.T;
    if (this.role === 'rest' && this.state === 'patrol') return 'SitFloor';
    if (this.state === 'patrol' || this.state === 'return' || this.state === 'rise') return 'Idle';
    if (T.ranged) return RANGED[T.ranged].aim && this.state === 'cover' ? 'Idle' : 'IdleCombat';
    return T.moves === 'twoh' ? 'Idle2H' : 'IdleCombat';
  }
  _walkAnim() { return this.T.walkAnim || (this.T.ghost ? 'WalkC' : 'Walk'); }
  _runAnim() { return this.T.ghost ? 'RunB' : 'Run'; }

  // ---- hasar ----
  hurt(dmg, info = {}) {
    if (!this.alive || this.state === 'rise' || this.phased) return null;
    // kalkan: önden gelen hafif vuruşları karşılar (ağır vuruş savunmayı kırar)
    if (info.kind === 'melee' && info.pos && this._canBlock(info)) {
      if (info.guardBreak) { this.stun(1.3, 'guardbreak'); dmg *= 0.6; }
      else {
        this.char.playUpper('BlockHit', 0.04, { once: true, restart: true, speed: 1.5 });
        audio.play('hit', { pos: this.pos, vol: 0.6, rate: 1.7 });
        this.hud.showT = 2;
        this._aggro(info);
        return 'blocked';
      }
    }
    // çevik düşmanlar hafif vuruşlardan kaçınabilir
    if (info.kind === 'melee' && this.T.dodge && !info.heavy && !info.counter && this.state !== 'stunned' && this.state !== 'attack' && Math.random() < this.T.dodge && this.stateT > 0.3) {
      this._dodge(info.pos);
      return 'dodged';
    }
    if (!G.isHost && G.online) {
      G.emit('netHurtEnemy', { id: this.id, dmg, kind: info.kind, heavy: info.heavy, fin: info.finisher, ctr: info.counter, gb: info.guardBreak, kb: info.kb, yaw: info.yaw });
      this.hud.showT = 3;
      return null;
    }
    this.applyDamage(dmg, info);
    return 'hit';
  }

  _canBlock(info) {
    if (!this.T.shield && !this.T.parry) return false;
    if (['attack', 'stunned', 'hit', 'dead', 'flee', 'rise'].includes(this.state)) return false;
    if (this.state === 'patrol' && this.awareness < 0.5) return false; // habersiz yakalandı
    const toSrc = Math.atan2(info.pos.x - this.pos.x, info.pos.z - this.pos.z);
    if (Math.abs(wrapAngle(toSrc - this.yaw)) > 1.1) return false; // arkadan/yandan
    const ch = this.T.shield || this.T.parry || 0;
    return Math.random() < ch;
  }

  applyDamage(dmg, info = {}) {
    if (!this.alive) return;
    // arkadan vuruş zayıf noktası, sersemken ek hasar, kızgın boss direnci
    if (info.pos && this.T.backMult) {
      const toSrc = Math.atan2(info.pos.x - this.pos.x, info.pos.z - this.pos.z);
      if (Math.abs(wrapAngle(toSrc - this.yaw)) > 2.0) { dmg *= this.T.backMult; if (Math.random() < 0.4) G.notify('Arkadan vuruş — zayıf nokta!', 'good', 1100); }
    }
    if (this.state === 'stunned') dmg *= 1.25;
    if (this.tired > 0) dmg *= 1.4;
    this.hp -= dmg;
    this.hud.showT = 4;
    G.emit('dmgNumber', { pos: this.pos.clone().setY(this.pos.y + this.height), dmg: Math.round(dmg), crit: !!(info.counter || info.heavy) });
    // geri tepme
    if (info.pos) {
      const dx = this.pos.x - info.pos.x, dz = this.pos.z - info.pos.z;
      const d = Math.hypot(dx, dz) || 1;
      const k = Math.min(9, (info.kb || 1) * (1 + dmg * 0.04)) / (this.T.boss ? 3 : this.T.poise ? 2 : 1);
      this.kb = { x: (dx / d) * k, z: (dz / d) * k };
      this.lastHitDir = new THREE.Vector3(dx / d, 0, dz / d);
    }
    this._aggro(info);
    combat.markCombat();
    if (this.hp <= 0) { this.die(info); return; }
    // tepki: sersemleme / sendeleme / vuruş
    const heavyHit = info.heavy || info.counter || info.finisher;
    if (info.counter || (heavyHit && !this.T.poise && !this.T.boss)) this.stun(info.counter ? 1.6 : 1.0, 'hit');
    else if (this.state !== 'attack' || !this.T.poise) {
      if (!(this.T.boss && this.state === 'attack' && Math.random() < 0.7)) {
        this._setState('hit');
        this.char.stopUpper(0.04);
        this.char.play(Math.random() < 0.5 ? 'HitRecieve' : 'HitRecieve_2', 0.05, { once: true, restart: true, speed: 1.2 });
        this._releaseToken();
      }
    }
    audio.play(this.T.faction === 'insan' ? 'hurt' : 'hit', { pos: this.pos, vol: 0.5, rate: this.T.faction === 'insan' ? 1 : 0.7 });
    this._phaseCheck();
  }

  _aggro(info) {
    const src = info.by && info.by !== G.myId ? G.remotes.get(info.by) : G.player;
    const tg = src ? this._targetInfo(src, info.by || G.myId) : this._nearestPlayer();
    if (tg) { this.target = tg; this.lastKnown = tg.pos.clone(); this.awareness = 1; }
    if (['patrol', 'suspicious', 'investigate', 'return'].includes(this.state)) { this._setState('chase'); this.alert = 2; this.alertT = 1.5; this._groupAlert(); }
  }

  // Boss evreleri: çağırma, öfke
  _phaseCheck() {
    const T = this.T;
    const f = this.hp / this.maxHp;
    if (T.summonAt && this.summoned < T.summonAt.length && f < T.summonAt[this.summoned]) {
      this.summoned++;
      this._setState('summon');
      this.char.stopUpper(0.05);
      this.char.play(T.faction === 'insan' ? 'Taunt' : 'Summon', 0.15, { once: true, restart: true, speed: T.faction === 'insan' ? 1 : 2 });
      if (T.faction === 'insan') G.notify(`${T.name}: "Tayfa! Bu korsanı denize atın!"`, 'boss', 4000);
      else G.notify(`${T.name} ölüleri çağırıyor!`, 'boss', 3500);
    }
    if (T.enrageAt && !this.enraged && f < T.enrageAt) {
      this.enraged = true;
      this.char.tint(null, 0x801000);
      G.notify(`${T.name} öfkeyle kükrüyor!`, 'boss', 3000);
    }
    if (T.smoke && !this.smoked && f < 0.3) { this.smoked = true; this._smokeBomb(); }
  }

  stun(dur = 1.5, why = 'hit') {
    if (!this.alive || this.state === 'rise') return;
    if (this.T.boss) dur *= 0.6;
    this._setState('stunned');
    this.stunT = dur;
    this.alert = 3;
    this._releaseToken();
    this.char.stopUpper(0.04);
    this.char.play('HitRecieve_2', 0.05, { once: true, restart: true, speed: 0.9 });
    if (why === 'parry' || why === 'guardbreak') effects.sparks(this.pos.x, this.pos.y + this.height * 0.7, this.pos.z, 14, [1, 1, 0.7]);
  }

  die(info = {}) {
    this.alive = false;
    this._setState('dead');
    this._releaseToken();
    this.alert = 0;
    this.char.stopUpper(0.05);
    audio.play(this.T.boss ? 'big_kill' : 'kill', { pos: this.pos, vol: 0.7 });
    const willRise = this.T.rise && !this.revived && Math.random() < this.T.rise;
    if (this.T.ghost) {
      this.char.play('Death2', 0.1, { once: true, restart: true });
      this.fadeOut = 1;
      effects.glitter(this.pos.x, this.pos.y + 1, this.pos.z, [0.5, 1, 0.9]);
    } else if (willRise) {
      this.char.play('DeathSk', 0.1, { once: true, restart: true });
    } else {
      // ragdoll: darbenin yönünde savrulur
      const imp = (this.lastHitDir || new THREE.Vector3()).clone().multiplyScalar(2 + (info.kb || 1) * 1.2).setY(1.0 + (info.heavy ? 1.5 : 0));
      this.char.startRagdoll({ ground: (x, z, y) => physics.groundAt(x, z, y + 0.6), vel: this.vel.clone(), impulse: imp });
    }
    if (willRise) this.reviveT = 6 + Math.random() * 4;
    else {
      G.emit('enemyKilled', { enemy: this, type: this.type, pos: this.pos.clone(), by: info.by });
      G.emit('loot', { pos: this.pos.clone(), table: this.T.loot, from: this.T.name });
      // kaptan ölünce insan tayfanın morali çöker
      if (this.T.rally || this.T.callHelp && this.T.faction === 'insan') enemies.moraleShock(this);
    }
  }

  _dodge(from) {
    const side = Math.random() < 0.5 ? 1 : -1;
    const dx = this.pos.x - from.x, dz = this.pos.z - from.z;
    const d = Math.hypot(dx, dz) || 1;
    this.dodgeV = { x: (-dz / d * side + dx / d * 0.5) * 7, z: (dx / d * side + dz / d * 0.5) * 7, t: 0.38 };
    this.char.stopUpper(0.04);
    this.char.play(side > 0 ? 'Dodge_L' : 'Dodge_R', 0.04, { once: true, restart: true, speed: 0.9 });
    this._setState('dodge');
  }

  _smokeBomb() {
    effects.smoke(this.pos.x, this.pos.y + 0.5, this.pos.z, 40, 2.2, 0.75);
    audio.play('impact', { pos: this.pos, vol: 0.6, rate: 0.7 });
    G.notify(`${this.T.name} duman bombası attı!`, 'boss', 2500);
    // görülmeden yer değiştirir (gerçek hareket, ışınlanma yok): hızla yana koşar
    const a = Math.random() * 6.28;
    this.lastKnown = this.target?.pos.clone() || null;
    this.retreatTo = new THREE.Vector3(this.pos.x + Math.cos(a) * 9, 0, this.pos.z + Math.sin(a) * 9);
    this._setState('retreat');
    this.retreatFast = true;
  }

  // ---- hedef bilgisi ----
  _targetInfo(pl, id) {
    if (!pl || pl.dead || pl.downed) return null;
    return { id, pos: pl.pos, ref: pl, mode: pl.mode };
  }
  _players() {
    const out = [];
    const p = G.player;
    if (p && !p.dead && !p.downed) out.push({ id: G.myId, pos: p.pos, ref: p, mode: p.mode });
    for (const [id, r] of G.remotes) if (!r.downed && r.hp > 0) out.push({ id, pos: r.pos, ref: r, mode: r.mode });
    return out;
  }
  _nearestPlayer() {
    let best = null, bd = 1e9;
    for (const t of this._players()) { const d = t.pos.distanceTo(this.pos); if (d < bd) { bd = d; best = t; } }
    return best;
  }

  // ---- algı: görme (görüş konisi, ışık, eğilme, yükseklik, engeller) ----
  _perceive(dt) {
    const T = this.T;
    const night = sky.isNight();
    const fog = sky.weather ? (sky.weather.fog || 0) * 0.5 + (sky.weather.rain || 0) * 0.25 : 0;
    let best = null, bestRate = 0;
    const eyeY = this.pos.y + 1.6 * (T.scale || 1);
    for (const t of this._players()) {
      const pl = t.ref;
      const dx = t.pos.x - this.pos.x, dz = t.pos.z - this.pos.z, dy = t.pos.y - this.pos.y;
      const d = Math.hypot(dx, dz);
      let vis = T.vision;
      const torch = !!pl.torch;
      if (night && !T.ghost) vis *= torch ? 1.15 : 0.5;
      if (pl.inCave > 0.5 && !torch) vis *= 0.45;
      vis *= 1 - fog;
      if (pl.crouch) vis *= 0.55;
      if (pl.mode === 'swim') vis *= pl.underwater ? 0.15 : 0.6;
      if (dy > 5) vis *= 0.8;
      if (d > vis) continue;
      const ang = Math.abs(wrapAngle(Math.atan2(dx, dz) - this.yaw)) * 2 * 180 / Math.PI;
      const near = d < (pl.crouch ? 1.8 : 3.2);
      const inFov = ang < T.fov || near;
      if (!inFov) continue;
      if (physics.lineBlocked(this.pos.x, eyeY, this.pos.z, t.pos.x, t.pos.y + (pl.crouch ? 0.9 : 1.4), t.pos.z)) continue;
      // algılama hızı: yakın, görüş merkezinde, hareketli ve saldıran hedef daha çabuk fark edilir
      const moving = pl.vel ? Math.hypot(pl.vel.x, pl.vel.z) : 0;
      let rate = (1.8 - d / vis * 1.5) * (ang < T.fov * 0.5 ? 1 : 0.55) * (moving > 3 ? 1.4 : moving > 0.5 ? 1 : 0.6);
      if (near) rate = 6;
      if (pl.action && ['atk', 'shoot'].includes(pl.action.type)) rate *= 2;
      if (rate > bestRate) { bestRate = rate; best = t; }
    }
    if (best) {
      this.awareness = Math.min(1.2, this.awareness + bestRate * dt * (this.state === 'patrol' && this.role === 'rest' ? 0.6 : 1));
      this.seeT = 0;
      this.lastKnown = best.pos.clone();
      if (this.awareness >= 1) { this.target = best; return best; }
      this.suspectOf = best;
    } else {
      this.seeT = (this.seeT || 0) + dt;
      if (this.state === 'patrol' || this.state === 'suspicious') this.awareness = Math.max(0, this.awareness - dt * 0.18);
    }
    return null;
  }

  // ses duyma (enemies.noise üzerinden)
  hear(e) {
    if (!this.alive || ['dead', 'rise', 'stunned', 'flee'].includes(this.state)) return;
    const d = Math.hypot(e.x - this.pos.x, e.z - this.pos.z);
    const r = e.radius * (this.T.hearing || 1) * (this.role === 'rest' ? 0.8 : 1);
    if (d > r) return;
    const loud = e.kind === 'gunshot' || e.kind === 'explosion' || e.kind === 'cannon';
    if (['chase', 'attack', 'strafe', 'cover'].includes(this.state)) {
      if (this.target && Math.hypot(e.x - this.target.pos.x, e.z - this.target.pos.z) < 3) this.lastKnown = new THREE.Vector3(e.x, e.y, e.z);
      return;
    }
    this.lastKnown = new THREE.Vector3(e.x, e.y, e.z);
    this.awareness = Math.max(this.awareness, loud ? 0.85 : 0.45 + (1 - d / r) * 0.3);
    if (this.state === 'patrol' || this.state === 'return' || this.state === 'suspicious') {
      this._standUp();
      this._setState(loud || d < r * 0.4 ? 'investigate' : 'suspicious');
      this.alert = 1;
    } else if (this.state === 'investigate') this.stateT = 0;
  }

  _standUp() {
    if (this.role === 'rest' && this.char.currentName === 'SitFloor') { this.char.play('SitFloorUp', 0.1, { once: true, speed: 1.6 }); this.getUpT = 0.7; }
  }

  _setState(s) {
    if (this.state === s) return;
    this.state = s;
    this.stateT = 0;
  }

  // ---- saldırı belirteci (aynı anda en fazla N düşman yakın saldırı yapar, diğerleri kuşatır) ----
  _wantToken() {
    if (!this.target) return false;
    if (this.T.boss || this.T.miniboss) return true;
    return enemies.requestToken(this, this.target.id);
  }
  _releaseToken() { enemies.releaseToken(this); }

  // ---- ana güncelleme ----
  update(dt) {
    this.stateT += dt;
    this.atkCd -= dt; this.rangedCd -= dt;
    if (this.alertT > 0) { this.alertT -= dt; if (this.alertT <= 0 && this.alert === 2) this.alert = 0; }
    if (this.tired > 0) this.tired -= dt;
    if (this.getUpT > 0) { this.getUpT -= dt; this._place(dt); return; }

    if (this.state === 'dead') { this._updateDead(dt); return; }
    if (this.state === 'rise') {
      this.alert = 0;
      if (this.stateT > 2.2) { this._setState('chase'); this.awareness = 1; this.target = this._nearestPlayer(); }
      this._place(dt);
      return;
    }
    // hayaletler: görünmezleşme (dokunulmazlık) ve gündüz kayboluş
    if (this.T.ghost) {
      if (this.T.phase && ['chase', 'strafe'].includes(this.state)) {
        this.phaseT = (this.phaseT ?? 5 + Math.random() * 5) - dt;
        if (this.phaseT <= 0) { this.phased = !this.phased; this.phaseT = this.phased ? 1.6 : 6 + Math.random() * 5; if (this.phased) effects.glitter(this.pos.x, this.pos.y + 1, this.pos.z, [0.5, 1, 0.9]); }
      } else this.phased = false;
      this.opacity = damp(this.opacity ?? 0.62, this.phased ? 0.1 : 0.62, 6, dt);
      this.char.setOpacity(this.opacity);
      if (!sky.isNight() && this.T.night && Math.random() < dt * 0.05 && this.state !== 'attack') {
        this.alive = false; this.remove = true;
        effects.glitter(this.pos.x, this.pos.y + 1, this.pos.z, [0.5, 1, 0.9]);
        return;
      }
    }

    // algı (yükü dağıtmak için ~6 Hz)
    this.thinkT -= dt;
    let seen = null;
    if (this.thinkT <= 0) {
      const pdt = 0.16 + (this.thinkT < -0.5 ? 0 : 0);
      this.thinkT = 0.16;
      seen = this._perceive(pdt);
      this._think(seen);
    }
    this._act(dt);
    this._place(dt);
  }

  // Durum geçişleri (karar katmanı)
  _think(seen) {
    const T = this.T;
    const s = this.state;
    if (['attack', 'hit', 'stunned', 'summon', 'dodge', 'callHelp', 'heal'].includes(s)) return;
    // hedef geçerliliği
    if (this.target && (this.target.ref.dead || this.target.ref.downed || (this.target.id !== G.myId && !G.remotes.has(this.target.id)))) { this.target = null; this._releaseToken(); }
    if (seen) {
      if (['patrol', 'suspicious', 'investigate', 'return'].includes(s)) {
        this._standUp();
        this.alert = 2; this.alertT = 1.6;
        audio.tone(T.faction === 'insan' ? 520 : 220, 0.18, 'square', 0.03, this.pos, 0.6);
        if (T.callHelp && !this.calledHelp) { this.calledHelp = true; this._setState('callHelp'); this.char.play('Taunt', 0.15, { once: true, restart: true }); return; }
        this._groupAlert();
        this._setState('chase');
      }
      this.lostT = 0;
    } else if (this.awareness > 0.35 && this.awareness < 1 && s === 'patrol') {
      this._standUp();
      this._setState('suspicious'); this.alert = 1;
    }
    // hedef kayboldu → son görülen yere git → ara → eve dön
    if (['chase', 'strafe', 'cover'].includes(s) && !seen) {
      this.lostT = (this.lostT || 0) + 0.16;
      const close = this.target && this.target.pos.distanceTo(this.pos) < 6;
      if (this.lostT > (close ? 6 : 2.5)) { this._releaseToken(); this._setState('investigate'); this.alert = 1; this.awareness = 0.7; }
    }
    if (s === 'investigate' && this.stateT > 9) { this._setState('return'); this.alert = 0; this.awareness = 0.2; this.target = null; }
    if (s === 'suspicious' && this.stateT > 3.5) { if (this.awareness > 0.55) this._setState('investigate'); else { this._setState('patrol'); this.alert = 0; } }
    if (s === 'return' && Math.hypot(this.pos.x - this.home.x, this.pos.z - this.home.z) < 3) { this._setState('patrol'); this.alert = 0; }
    // tasma: evden çok uzaklaşınca geri dön
    if (['chase', 'strafe', 'investigate', 'cover'].includes(s) && Math.hypot(this.pos.x - this.home.x, this.pos.z - this.home.z) > this.homeR + (T.boss ? 30 : 45)) {
      this._releaseToken(); this._setState('return'); this.target = null; this.alert = 0; this.awareness = 0;
    }
    // geri çekilme / kaçış (yaşayan insanlar)
    const f = this.hp / this.maxHp;
    if (T.faction === 'insan' && !T.boss && ['chase', 'strafe', 'cover'].includes(s)) {
      if (!this.healed && f < 0.3 && enemies.alliesNear(this, 18) > 0) { this._releaseToken(); this._retreatFrom(this.target?.pos); return; }
      if (f < (T.morale || 0) && Math.random() < 0.25 && !this.fleeChecked) { this.fleeChecked = true; this._flee(); return; }
    }
    // menzilliler: siper ara
    if (T.cover && s === 'chase' && this.target && !this.coverPt && this.stateT > 0.6) {
      const cp = enemies.findCover(this, this.target.pos);
      if (cp) { this.coverPt = cp; this._setState('cover'); }
    }
  }

  _retreatFrom(src) {
    const a = src ? Math.atan2(this.pos.x - src.x, this.pos.z - src.z) : Math.random() * 6.28;
    this.retreatTo = new THREE.Vector3(this.pos.x + Math.sin(a) * 12, 0, this.pos.z + Math.cos(a) * 12);
    this._setState('retreat');
  }
  _flee() {
    this._releaseToken();
    this._retreatFrom(this.target?.pos);
    this.retreatTo.set(this.home.x + (this.retreatTo.x - this.pos.x) * 4, 0, this.home.z + (this.retreatTo.z - this.pos.z) * 4);
    this._setState('flee');
    this.alert = 0;
    if (Math.random() < 0.6) G.notify(`${this.T.name} kaçıyor!`, 'info', 1500);
  }

  // Grup uyarısı: yakındaki müttefikler hedefin yerini öğrenir
  _groupAlert(radius = 30) {
    for (const o of enemies.list) {
      if (o === this || !o.alive || o.T.faction !== this.T.faction && !(o.T.faction !== 'insan' && this.T.faction !== 'insan')) continue;
      if (o.pos.distanceTo(this.pos) > radius) continue;
      if (['patrol', 'suspicious', 'investigate', 'return'].includes(o.state)) {
        o.target = this.target; o.lastKnown = this.target?.pos.clone() || this.lastKnown?.clone();
        o.awareness = Math.max(o.awareness, 0.9);
        o._standUp();
        o._setState('investigate'); o.alert = 1;
      }
    }
  }

  // Eylem katmanı (her kare): hareket hedefi, hız ve saldırı zamanlaması
  _act(dt) {
    const T = this.T;
    const tgt = this.target;
    let goal = null, speed = 0, face = null;
    const night = sky.isNight();
    const boost = night && T.faction !== 'insan' ? (time.isActive('ghostHours') ? 1.35 : 1.18) : 1;
    switch (this.state) {
      case 'patrol': {
        this.alert = this.awareness > 0.3 ? 1 : 0;
        if (this.role === 'sentry' || this.role === 'rest') {
          // nöbetçi: yerinde durur, arada etrafa bakınır
          this.lookT = (this.lookT || 0) - dt;
          if (this.lookT <= 0) { this.lookT = 3 + Math.random() * 4; this.lookYaw = this.yaw + (Math.random() - 0.5) * 2.4; }
          if (this.role === 'sentry') face = this.lookYaw;
          break;
        }
        if (!this.wp || this.pos.distanceTo(_v.set(this.wp.x, this.pos.y, this.wp.z)) < 1.2) {
          this.waitT = (this.waitT ?? 0) - dt;
          if (this.waitT <= 0) { this.wp = enemies.patrolPoint(this); this.waitT = 2 + Math.random() * 4; }
        } else { goal = this.wp; speed = T.walk; }
        break;
      }
      case 'suspicious': {
        // dur, sesin/görüntünün geldiği yöne bak
        if (this.lastKnown) face = Math.atan2(this.lastKnown.x - this.pos.x, this.lastKnown.z - this.pos.z);
        break;
      }
      case 'investigate': {
        if (this.lastKnown && this.pos.distanceTo(_v.set(this.lastKnown.x, this.pos.y, this.lastKnown.z)) > 1.5) { goal = this.lastKnown; speed = T.walk * 1.8; }
        else { this.lookT = (this.lookT || 0) - dt; if (this.lookT <= 0) { this.lookT = 1.5; this.lookYaw = this.yaw + (Math.random() - 0.5) * 3; } face = this.lookYaw; }
        break;
      }
      case 'return': goal = this.home; speed = T.walk * 1.3; if (this.hp < this.maxHp) this.hp = Math.min(this.maxHp, this.hp + dt * this.maxHp * 0.03); break;
      case 'callHelp': {
        if (tgt) face = Math.atan2(tgt.pos.x - this.pos.x, tgt.pos.z - this.pos.z);
        if (this.stateT > 0.25 && !this.helpDone) {
          this.helpDone = true;
          this._groupAlert(45);
          if (T.rally) enemies.rally(this);
          G.notify(T.faction === 'insan' ? `${T.name}: "Hepiniz buraya!"` : `${T.name} tayfasını uyandırıyor…`, 'warn', 2000);
        }
        if (this.stateT > 1.0) this._setState('chase');
        break;
      }
      case 'summon': {
        if (this.stateT > 0.9 && !this.sumDone) {
          this.sumDone = true;
          const list = T.summon || [];
          for (let i = 0; i < list.length; i++) {
            const a = (i / list.length) * 6.28 + Math.random();
            G.emit('spawnEnemies', { list: [list[i]], x: this.pos.x + Math.cos(a) * 4, z: this.pos.z + Math.sin(a) * 4, r: 0.5, rise: T.faction !== 'insan', group: this.group });
          }
        }
        if (this.stateT > 2.2) { this.sumDone = false; this.tired = 2.5; this._setState('chase'); }
        break;
      }
      case 'heal': {
        if (this.stateT > 1.0 && !this.healed) { this.healed = true; this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.3); effects.glitter(this.pos.x, this.pos.y + 1.2, this.pos.z, [0.6, 1, 0.5]); }
        if (this.stateT > 1.6) this._setState('chase');
        break;
      }
      case 'retreat': case 'flee': {
        goal = this.retreatTo; speed = T.speed * (this.retreatFast ? 1.25 : 1);
        if (!goal || this.pos.distanceTo(_v.set(goal.x, this.pos.y, goal.z)) < 1.5 || this.stateT > (this.state === 'flee' ? 12 : 5)) {
          this.retreatFast = false;
          if (this.state === 'flee') { this.remove = this.target ? this.target.pos.distanceTo(this.pos) > 30 : true; this._setState('return'); }
          else if (!this.healed && T.faction === 'insan') { this._setState('heal'); this.char.playUpper('UseItem', 0.15, { once: true, restart: true }); }
          else this._setState('chase');
        }
        break;
      }
      case 'stunned': {
        this.stunT -= dt;
        if (this.stunT <= 0) { this.alert = 0; this._setState('chase'); }
        break;
      }
      case 'hit': if (this.stateT > 0.45) this._setState('chase'); break;
      case 'dodge': {
        if (this.dodgeV) { this.pos.x += this.dodgeV.x * dt; this.pos.z += this.dodgeV.z * dt; this.dodgeV.t -= dt; if (this.dodgeV.t <= 0) this.dodgeV = null; }
        if (this.stateT > 0.45) this._setState('chase');
        break;
      }
      case 'attack': if (this.move?.ranged) this._rangedUpdate(dt); else this._attackUpdate(dt, boost); break;
      case 'cover': case 'chase': case 'strafe': {
        if (!tgt) { this._setState(this.lastKnown ? 'investigate' : 'return'); break; }
        const d = Math.hypot(tgt.pos.x - this.pos.x, tgt.pos.z - this.pos.z);
        const dy = tgt.pos.y - this.pos.y;
        face = Math.atan2(tgt.pos.x - this.pos.x, tgt.pos.z - this.pos.z);
        const reachable = this._reachable(tgt, dy);
        // menzilli saldırı
        const R = T.ranged ? RANGED[T.ranged] : null;
        const knifeR = T.throwKnife && d > 5 && d < 13 ? RANGED.knife : null;
        const R2 = T.ranged2 && d > 6 && d < 18 ? RANGED[T.ranged2] : null;
        const useR = R || knifeR || R2;
        if (useR && this.rangedCd <= 0 && d < (useR === R ? T.keep[1] + 6 : 16) && (useR === R || Math.random() < 0.02) && this._los(tgt)) {
          this._startRanged(useR, tgt);
          break;
        }
        if (this.state === 'cover') {
          const cp = this.coverPt;
          if (!cp || this.stateT > 14 || d < 4) { this.coverPt = null; this._setState('chase'); break; }
          if (this.pos.distanceTo(_v.set(cp.x, this.pos.y, cp.z)) > 0.8) { goal = cp; speed = T.speed; face = null; }
          break;
        }
        if (R) {
          // menzilli: tercih edilen mesafeyi koru, yanlara kay
          const [kMin, kMax] = T.keep;
          if (d > kMax || !this._los(tgt)) { goal = tgt.pos; speed = T.speed * 0.9; face = null; }
          else if (d < kMin && d > 2.5) {
            const away = _w.set(this.pos.x - tgt.pos.x, 0, this.pos.z - tgt.pos.z).normalize();
            goal = this.pos.clone().addScaledVector(away, 3); speed = T.walk * 1.6; this.backing = true;
          } else if (d <= 2.5) { this._meleeOrStrafe(tgt, d, reachable, boost); goal = this._mGoal; speed = this._mSpeed; }
          else {
            this.strafeDir = this.strafeDir || (Math.random() < 0.5 ? 1 : -1);
            if (Math.random() < 0.004) this.strafeDir *= -1;
            const side = _w.set(tgt.pos.z - this.pos.z, 0, -(tgt.pos.x - this.pos.x)).normalize().multiplyScalar(this.strafeDir * 2);
            goal = this.pos.clone().add(side); speed = T.walk;
          }
          break;
        }
        this._meleeOrStrafe(tgt, d, reachable, boost);
        goal = this._mGoal; speed = this._mSpeed;
        break;
      }
      default: break;
    }
    this._move(dt, goal, speed * (goal ? boost : 1), face);
  }

  _reachable(tgt, dy) {
    if (tgt.mode === 'helm' || tgt.mode === 'boat' || tgt.mode === 'deck' || tgt.mode === 'cannon') return false;
    if (tgt.mode === 'swim' && !this.T.ghost) return false;
    if (dy > 2.4 && !this.T.ghost) return false;
    return true;
  }

  // Yakın dövüş: belirteç varsa yaklaş ve saldır, yoksa kuşatma halkasında dolaş
  _meleeOrStrafe(tgt, d, reachable, boost) {
    const T = this.T;
    this._mGoal = null; this._mSpeed = 0;
    if (!reachable) {
      // ulaşılamaz hedef: kıyıda/yamacın dibinde bekle, alay et; bıçak atabilenler atar
      if (d > 4) { this._mGoal = tgt.pos; this._mSpeed = T.walk * 1.5; }
      this.tauntT = (this.tauntT || 4) - 0.016;
      if (this.tauntT <= 0 && Math.random() < 0.01) { this.tauntT = 6; this.char.play('Taunt', 0.15, { once: true, restart: true }); }
      return;
    }
    const reach = T.range + 0.3;
    const hasTok = d < 7 ? this._wantToken() : false;
    if (hasTok) {
      this.state = 'chase';
      if (d > reach) { this._mGoal = tgt.pos; this._mSpeed = T.speed * (d > 6 ? 1 : 0.75); }
      else if (this.atkCd <= 0) this._startMelee(tgt, d);
    } else {
      // kuşatma: hedefin etrafında yayılmış açılarda bekle, yan/arkadan yaklaş
      if (this.state !== 'strafe') { this.state = 'strafe'; this.stateT = 0; this.flankA = enemies.flankAngle(this, tgt); }
      const ring = T.flanker ? 3.2 : 4.3;
      const a = this.flankA + Math.sin(this.stateT * 0.4) * 0.3;
      const gx = tgt.pos.x + Math.sin(a) * ring, gz = tgt.pos.z + Math.cos(a) * ring;
      const dd = Math.hypot(gx - this.pos.x, gz - this.pos.z);
      if (dd > 0.7) { this._mGoal = new THREE.Vector3(gx, 0, gz); this._mSpeed = dd > 4 ? T.speed * 0.8 : T.walk * 1.2; }
      // kuşatmacı arkadan fırsat kollar
      if (T.flanker && d < reach + 0.4 && this.atkCd <= 0 && Math.random() < 0.05) this._startMelee(tgt, d);
    }
  }

  _startMelee(tgt, d) {
    const T = this.T;
    const set = MOVES[T.moves] || MOVES.sword1h;
    let mv;
    if (T.dash && d > 4 && d < 10 && Math.random() < 0.5) mv = DASH;
    else if ((T.spin && this.enraged && Math.random() < 0.35) || (T.spin && Math.random() < 0.1)) mv = SPIN;
    else {
      const tot = set.reduce((s, m) => s + (m.w || 1), 0);
      let r = Math.random() * tot;
      mv = set[0];
      for (const m of set) { r -= m.w || 1; if (r <= 0) { mv = m; break; } }
    }
    this.move = mv;
    this.hitIdx = 0;
    this.hitDone = false;
    this.rangedNow = null;
    this._setState('attack');
    const sp = mv.speed * (this.enraged ? 1.2 : 1);
    this.char.stopUpper(0.05);
    this.char.play(mv.anim, 0.1, { once: true, restart: true, speed: sp });
    this.atkDur = mv.dur / (this.enraged ? 1.2 : 1);
    this.atkHit = (mv.hits || [mv.hitAt]).map((h) => h / (this.enraged ? 1.2 : 1));
    if (mv.unblockable) this._telegraph(this.atkHit[0]);
    if (mv.dash) this.dashDir = new THREE.Vector3(tgt.pos.x - this.pos.x, 0, tgt.pos.z - this.pos.z).normalize();
  }

  // Engellenemez saldırı uyarısı: kırmızı parlama + yerde halka
  _telegraph(t) {
    this.teleT = t;
    if (!this._ring) {
      const m = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 40), new THREE.MeshBasicMaterial({ color: 0xff3020, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide }));
      m.rotation.x = -Math.PI / 2;
      m.renderOrder = 4;
      this._ring = m;
      this.scene.add(m);
    }
    this._ring.visible = true;
    audio.tone(160, 0.3, 'sawtooth', 0.04, this.pos, 0.7);
  }

  _attackUpdate(dt, boost) {
    const tgt = this.target;
    const mv = this.move;
    const t = this.stateT;
    // hazırlıkta hedefe dön, vuruşa yakın kilitlen (yana kaçınma işe yarar)
    if (tgt && t < this.atkHit[0] * 0.7) this.yaw = dampAngle(this.yaw, Math.atan2(tgt.pos.x - this.pos.x, tgt.pos.z - this.pos.z), 9, dt);
    if (mv.dash && t > this.atkHit[0] * 0.55 && t < this.atkHit[0] + 0.15) {
      const k = mv.dash / 0.5;
      this.pos.x += this.dashDir.x * k * dt; this.pos.z += this.dashDir.z * k * dt;
      effects.smoke(this.pos.x, this.pos.y + 1, this.pos.z, 1, 0.6, 0.2);
    }
    if (this._ring && this.teleT > 0) {
      const R = (mv.aoe360 || mv.aoe || this.T.range + 0.6);
      const f = clamp(t / this.atkHit[0], 0, 1);
      const cx = mv.aoe360 ? this.pos.x : this.pos.x + Math.sin(this.yaw) * (mv.aoe ? 1.6 : 1.2);
      const cz = mv.aoe360 ? this.pos.z : this.pos.z + Math.cos(this.yaw) * (mv.aoe ? 1.6 : 1.2);
      this._ring.position.set(cx, terrain.heightAt(cx, cz) + 0.08, cz);
      this._ring.scale.setScalar(R * (0.4 + 0.6 * f));
      this._ring.material.opacity = 0.35 + 0.4 * Math.abs(Math.sin(t * 12));
    }
    while (this.hitIdx < this.atkHit.length && t >= this.atkHit[this.hitIdx]) {
      this.hitIdx++;
      this._resolveMelee(tgt, mv, boost);
    }
    if (this.hitIdx >= this.atkHit.length && this._ring) this._ring.visible = false;
    if (t >= this.atkDur) {
      this._releaseToken();
      this.atkCd = (this.T.boss ? 0.6 : 1.0) + Math.random() * (this.T.boss ? 0.6 : 1.1);
      // bazı düşmanlar art arda vurur
      if ((this.T.moves === 'dual' || this.T.boss) && Math.random() < 0.45 && tgt && tgt.pos.distanceTo(this.pos) < this.T.range + 0.5 && !this.chained) {
        this.chained = true; this._startMelee(tgt, tgt.pos.distanceTo(this.pos)); return;
      }
      this.chained = false;
      if (this.T.boss && mv.unblockable) this.tired = 1.8; // ağır saldırıdan sonra nefeslenir: zayıf an
      this._setState('chase');
    }
  }

  _resolveMelee(tgt, mv, boost) {
    const T = this.T;
    const dmg = T.dmg * (mv.mult || 1) * boost * (this.rallied > 0 ? 1.2 : 1) * (this.enraged ? 1.15 : 1);
    const hitOne = (pl, id) => {
      const dx = pl.pos.x - this.pos.x, dz = pl.pos.z - this.pos.z;
      const d = Math.hypot(dx, dz);
      if (Math.abs(pl.pos.y - this.pos.y) > 2.2) return;
      if (mv.aoe360) { if (d < mv.aoe360) this._hitPlayer(id, pl, dmg, mv); return; }
      if (mv.aoe) {
        const cx = this.pos.x + Math.sin(this.yaw) * 1.6, cz = this.pos.z + Math.cos(this.yaw) * 1.6;
        if (Math.hypot(pl.pos.x - cx, pl.pos.z - cz) < mv.aoe) this._hitPlayer(id, pl, dmg, mv);
        return;
      }
      const ang = Math.abs(wrapAngle(Math.atan2(dx, dz) - this.yaw));
      if (d < T.range + 0.6 + (mv.reach || 0) && ang < 1.0) this._hitPlayer(id, pl, dmg, mv);
    };
    for (const t of this._players()) hitOne(t.ref, t.id);
    audio.play('dash', { pos: this.pos, vol: 0.3, rate: 1.25 });
    if (mv.aoe || mv.aoe360) { effects.dirt(this.pos.x + Math.sin(this.yaw) * 1.6, this.pos.y + 0.1, this.pos.z + Math.cos(this.yaw) * 1.6, 12); }
  }

  _hitPlayer(id, pl, dmg, mv, opts = {}) {
    const cause = `${this.T.name} seni yere serdi`;
    const melee = !opts.ranged;
    if (id === G.myId) {
      G.player.hurt(dmg, this.pos, { cause, melee, unblockable: !!mv?.unblockable, attacker: this, bullet: opts.bullet });
      if (this.T.grab && melee && !G.player.dead) { G.player.slowT = 2.2; G.notify('Boğulmuş denizci seni yakaladı — yavaşladın!', 'warn', 1500); }
    } else G.emit('netHurtPlayer', { id, dmg, from: [this.pos.x, this.pos.y, this.pos.z], cause, melee, unblockable: !!mv?.unblockable, attackerId: this.id, bullet: opts.bullet });
    if (mv?.kb && id === G.myId && !G.player.blocking) G.player.knock = { x: Math.sin(this.yaw) * mv.kb, z: Math.cos(this.yaw) * mv.kb };
  }

  // ---- menzilli ----
  _los(tgt) {
    // görüş hattı sonucu kısa süre önbelleğe alınır
    const now = combat.time;
    if (this._losC && this._losC.id === tgt.id && now - this._losC.t < 0.25) return this._losC.v;
    const v = !physics.lineBlocked(this.pos.x, this.pos.y + 1.5, this.pos.z, tgt.pos.x, tgt.pos.y + 1.2, tgt.pos.z);
    this._losC = { id: tgt.id, t: now, v };
    return v;
  }
  _startRanged(R, tgt) {
    this.rangedNow = R;
    this.hitDone = false;
    this._setState('attack');
    this.move = { ranged: true };
    this.atkHit = [R.aimT];
    this.atkDur = R.aimT + 0.45;
    this.hitIdx = 0;
    if (R.aim) this.char.playUpper(R.aim, 0.15, { restart: true });
    else this.char.play(R.shoot, 0.1, { once: true, restart: true, speed: 1.2 });
    if (R === RANGED.pistol && this.T.ranged2 && this.weapon !== 'pistol') this.char.hold('pistol');
  }

  // menzilli saldırı durumu (attack durumu içinde move.ranged)
  _rangedUpdate(dt) {
    const R = this.rangedNow;
    const tgt = this.target;
    const t = this.stateT;
    if (tgt) this.yaw = dampAngle(this.yaw, Math.atan2(tgt.pos.x - this.pos.x, tgt.pos.z - this.pos.z), 8, dt);
    if (!this.hitDone && t >= R.aimT) {
      this.hitDone = true;
      if (R.aim) { this.char.playUpper(R.shoot, 0.05, { once: true, restart: true, speed: 1.2 }); }
      if (tgt) this._fire(R, tgt);
    }
    if (t >= R.aimT + 0.4) {
      this.rangedCd = R.reloadT * (0.8 + Math.random() * 0.4);
      if (R.reload) this.char.playUpper(R.reload, 0.1, { once: true, restart: true, speed: 1.0 });
      else this.char.stopUpper(0.2);
      if (this.T.ranged2 && R === RANGED.pistol) this.char.hold(this.weapon);
      this.rangedNow = null;
      this.coverPt = this.T.cover && Math.random() < 0.5 ? null : this.coverPt;
      this._setState(this.coverPt ? 'cover' : 'chase');
    }
  }

  _fire(R, tgt) {
    const from = new THREE.Vector3(this.pos.x + Math.sin(this.yaw) * 0.6, this.pos.y + 1.4 * (this.T.scale || 1), this.pos.z + Math.cos(this.yaw) * 0.6);
    // öngörülü nişan (kısmi) + mesafeye göre sapma
    const pl = tgt.ref;
    const d = tgt.pos.distanceTo(this.pos);
    const lead = d / R.speed * 0.6;
    const aim = new THREE.Vector3(tgt.pos.x + (pl.vel?.x || 0) * lead, tgt.pos.y + 1.15, tgt.pos.z + (pl.vel?.z || 0) * lead);
    const dir = aim.sub(from).normalize();
    const sp = R.spread * (1 + d * 0.04) * (sky.isNight() && !pl.torch ? 1.6 : 1);
    dir.x += (Math.random() - 0.5) * sp * 2; dir.y += (Math.random() - 0.5) * sp; dir.z += (Math.random() - 0.5) * sp * 2;
    dir.normalize();
    if (R.proj === 'bullet') { effects.flash(from.x, from.y, from.z, dir); audio.play('shoot', { pos: this.pos, vol: 0.7 }); combat.noise(this.pos, 40, 'gunshot'); }
    else if (R.proj === 'ghostbolt') audio.tone(880, 0.25, 'sine', 0.04, this.pos, 0.8);
    else audio.tone(420, 0.08, 'triangle', 0.04, this.pos, 0.6);
    enemies.shoot({ from, dir, speed: R.speed, kind: R.proj, dmg: this.T.dmg * (this.rallied > 0 ? 1.2 : 1), owner: this, homing: R.homing ? tgt : null, homingK: R.homing || 0 });
  }

  // ---- hareket: yönlendirme, engelden kaçınma, ayrışma, takılma tespiti ----
  _move(dt, goal, speed, face) {
    const T = this.T;
    let wantX = 0, wantZ = 0;
    if (goal && speed > 0) {
      let dx = goal.x - this.pos.x, dz = goal.z - this.pos.z;
      const d = Math.hypot(dx, dz);
      if (d > 0.3) {
        dx /= d; dz /= d;
        // takılma: ilerleme yoksa sapma yönü dene
        if (this.detour) {
          this.detour.t -= dt;
          const c = Math.cos(this.detour.a), s = Math.sin(this.detour.a);
          [dx, dz] = [dx * c - dz * s, dx * s + dz * c];
          if (this.detour.t <= 0) this.detour = null;
        }
        // önündeki engelden kaçınma (bakış sondası)
        const px = this.pos.x + dx * 1.3, pz = this.pos.z + dz * 1.3;
        const probe = { x: px, z: pz };
        if (physics.resolve(probe, this.radius, this.pos.y)) { const ox = probe.x - px, oz = probe.z - pz; dx += ox * 1.6; dz += oz * 1.6; const n = Math.hypot(dx, dz) || 1; dx /= n; dz /= n; }
        // suya ve uçuruma girme
        if (!T.ghost) {
          const h = terrain.heightAt(this.pos.x + dx * 1.2, this.pos.z + dz * 1.2);
          if (h < ocean.heightAt(this.pos.x, this.pos.z) + 0.15) { dx = -dx * 0.2; dz = -dz * 0.2; if (this.state === 'patrol') this.wp = null; }
        }
        const sp = Math.min(speed, d * 3);
        wantX = dx * sp; wantZ = dz * sp;
      }
    }
    // komşulardan ayrış
    for (const o of enemies.near(this, 1.4)) {
      const ox = this.pos.x - o.pos.x, oz = this.pos.z - o.pos.z;
      const d = Math.hypot(ox, oz) || 0.01;
      const k = (1.4 - d) * 2.2;
      wantX += (ox / d) * k; wantZ += (oz / d) * k;
    }
    // ivme
    const acc = this.state === 'attack' ? 10 : 6;
    this.vel.x = damp(this.vel.x, wantX, acc, dt);
    this.vel.z = damp(this.vel.z, wantZ, acc, dt);
    if (this.slowT > 0) { this.slowT -= dt; this.vel.multiplyScalar(0.5); }
    const before = Math.hypot(goal ? goal.x - this.pos.x : 0, goal ? goal.z - this.pos.z : 0);
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;
    physics.resolve(this.pos, this.radius, this.pos.y);
    // takılma tespiti
    if (goal && speed > 0.5) {
      const after = Math.hypot(goal.x - this.pos.x, goal.z - this.pos.z);
      this.progT = (this.progT || 0) + dt;
      this.progD = (this.progD || 0) + (before - after);
      if (this.progT > 1.2) {
        if (this.progD < 0.35 && !this.detour) this.detour = { a: (this.detourSide = -(this.detourSide || 1)) * 1.1, t: 1.0 };
        this.progT = 0; this.progD = 0;
      }
    }
    // yönelim
    const hs = Math.hypot(this.vel.x, this.vel.z);
    if (face !== null && face !== undefined) this.yaw = dampAngle(this.yaw, face, 7, dt);
    else if (hs > 0.3) this.yaw = dampAngle(this.yaw, Math.atan2(this.vel.x, this.vel.z), 8, dt);
    this.speedNow = hs;
    this._animate(hs);
  }

  _animate(hs) {
    const c = this.char;
    if (['attack', 'hit', 'stunned', 'summon', 'dodge', 'callHelp', 'dead', 'rise'].includes(this.state) && !(this.state === 'attack' && this.move?.ranged)) return;
    if (c.current && c.current.loop === THREE.LoopOnce && c.current.isRunning() && hs < 0.5) return;
    let a, sp = 1;
    if (hs < 0.25) a = this._idleAnim();
    else if (this.backing && hs < 3) { a = 'WalkBack'; sp = clamp(hs / 1.6, 0.6, 1.3); }
    else if (hs < 2.6) { a = this._walkAnim(); sp = clamp(hs / (this.T.walkAnim ? 1.3 : 1.7), 0.5, 1.5); }
    else { a = this._runAnim(); sp = clamp(hs / 5, 0.7, 1.4); }
    this.backing = false;
    if (c.currentName !== a) c.play(a, 0.25, { speed: sp });
    else c.setSpeed(sp);
  }

  _place(dt) {
    if (this.kb && this.state !== 'dead') {
      this.pos.x += this.kb.x * dt; this.pos.z += this.kb.z * dt;
      this.kb.x *= Math.exp(-7 * dt); this.kb.z *= Math.exp(-7 * dt);
      if (Math.hypot(this.kb.x, this.kb.z) < 0.1) this.kb = null;
      physics.resolve(this.pos, this.radius, this.pos.y);
    }
    let y;
    if (this.T.ghost) {
      this.hover += dt;
      y = Math.max(terrain.heightAt(this.pos.x, this.pos.z), ocean.heightAt(this.pos.x, this.pos.z)) + 0.25 + Math.sin(this.hover * 2 + this.home.x) * 0.12;
    } else y = physics.groundAt(this.pos.x, this.pos.z, this.pos.y + 1);
    this.pos.y = this.state === 'dead' && this.char.ragdoll ? this.pos.y : y;
    this.root.position.copy(this.pos);
    this.root.rotation.y = this.yaw;
  }

  _updateDead(dt) {
    if (this.fadeOut !== undefined) {
      this.fadeOut -= dt * 0.7;
      this.char.setOpacity(Math.max(0, this.fadeOut) * 0.62);
      if (this.fadeOut <= 0) this.remove = true;
      return;
    }
    if (this.reviveT !== undefined) {
      this.reviveT -= dt;
      if (this.reviveT <= 0) {
        this.reviveT = undefined;
        this.revived = true;
        this.alive = true;
        this.hp = this.maxHp * 0.5;
        this._setState('rise');
        this.char.play('Resurrect', 0.1, { once: true, restart: true, speed: 1.2 });
        G.notify(`${this.T.name} yeniden ayağa kalktı!`, 'warn', 2500);
        effects.dirt(this.pos.x, this.pos.y, this.pos.z, 14);
      }
      return;
    }
    // ceset bir süre kalır, sonra toprağa gömülür
    if (this.stateT > 20) {
      this.root.position.y -= dt * 0.4;
      if (this.stateT > 24) this.remove = true;
    }
  }

  dispose() {
    combat.removeTarget(this);
    this._releaseToken();
    this.scene.remove(this.root);
    if (this._ring) { this.scene.remove(this._ring); this._ring.geometry.dispose(); this._ring.material.dispose(); }
    this.hud.icon.material.dispose(); this.hud.fill.material.dispose();
  }

  net() {
    return [this.id, this.type, +this.pos.x.toFixed(2), +this.pos.y.toFixed(2), +this.pos.z.toFixed(2), +this.yaw.toFixed(2), this.char.currentName, Math.round(this.hp), this.alive ? 1 : 0, this.char.upperName || 0, this.alert, Math.round(this.maxHp)];
  }
}

// ---------------------------------------------------------------------------
// Mermi/ok/ruh topu: görünür mermiler; oyuncu kaçınabilir, kılıçla ok ve bıçak savuşturulabilir
// ---------------------------------------------------------------------------
const PROJ_GEO = {};
function projMesh(kind) {
  if (!PROJ_GEO.bolt) {
    PROJ_GEO.bolt = new THREE.CylinderGeometry(0.015, 0.015, 0.55, 5).rotateX(Math.PI / 2);
    PROJ_GEO.bullet = new THREE.SphereGeometry(0.04, 6, 4);
    PROJ_GEO.knife = new THREE.BoxGeometry(0.04, 0.02, 0.3);
    PROJ_GEO.ghost = new THREE.SphereGeometry(0.18, 10, 8);
    PROJ_GEO.mats = {
      bolt: new THREE.MeshStandardMaterial({ color: 0x6a4a2a }),
      bullet: new THREE.MeshBasicMaterial({ color: 0xffe0a0 }),
      knife: new THREE.MeshStandardMaterial({ color: 0xc0c4c8, metalness: 0.8, roughness: 0.3 }),
      ghostbolt: new THREE.MeshBasicMaterial({ color: 0x9ffff0, transparent: true, opacity: 0.85 }),
    };
  }
  const g = kind === 'ghostbolt' ? PROJ_GEO.ghost : PROJ_GEO[kind];
  const m = new THREE.Mesh(g, PROJ_GEO.mats[kind]);
  m.renderOrder = 3;
  return m;
}

export const enemies = {
  name: 'enemies',
  saveKey: 'enemies',
  list: [],
  groups: [],
  groupState: {},
  tokens: new Map(),
  shots: [],

  init(scene) {
    this.scene = scene;
    this.groups = BASE_GROUPS.map((g) => ({ ...g }));
    G.on('spawnEnemies', (e) => {
      for (const t of e.list) {
        const a = Math.random() * 6.28;
        this.spawn(t, e.x + Math.cos(a) * e.r, e.z + Math.sin(a) * e.r, { homeR: 20, rise: !!e.rise, group: e.group });
      }
    });
    G.on('noise', (e) => { for (const en of this.list) en.hear(e); });
  },

  // Dünya modülü yeni kamp/yerleşim ekler
  addGroup(g) {
    if (this.groups.some((x) => x.id === g.id)) return;
    this.groups.push({ respawn: 300, r: 18, list: [], ...g });
  },

  start() {
    for (const e of this.list) e.dispose();
    for (const s of this.shots) this.scene.remove(s.mesh);
    this.list = [];
    this.shots = [];
    this.tokens.clear();
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

  // ---- koordinasyon ----
  requestToken(e, tid) {
    let set = this.tokens.get(tid);
    if (!set) this.tokens.set(tid, (set = new Set()));
    if (set.has(e)) return true;
    for (const x of set) if (!x.alive || x.target?.id !== tid) set.delete(x);
    const max = G.difficulty === 'zor' ? 3 : G.difficulty === 'kolay' ? 1 : 2;
    if (set.size < max) { set.add(e); return true; }
    return false;
  },
  releaseToken(e) { for (const set of this.tokens.values()) set.delete(e); },
  flankAngle(e, tgt) {
    // hedefin etrafında boş açı: diğer kuşatanlardan uzak, tercihen hedefin arkası
    const base = Math.atan2(e.pos.x - tgt.pos.x, e.pos.z - tgt.pos.z);
    let best = base, bs = -1e9;
    for (let i = 0; i < 8; i++) {
      const a = base + (i - 3.5) * 0.45;
      let score = 0;
      for (const o of this.list) if (o !== e && o.alive && o.state === 'strafe' && o.target?.id === tgt.id) score -= Math.max(0, 1.2 - Math.abs(wrapAngle(a - (o.flankA ?? 0))));
      const behind = tgt.ref?.yaw !== undefined ? Math.abs(wrapAngle(a - (tgt.ref.yaw + Math.PI))) : 1.5;
      score -= behind * 0.25 + Math.abs(wrapAngle(a - base)) * 0.2;
      if (score > bs) { bs = score; best = a; }
    }
    return best;
  },
  alliesNear(e, r) { let n = 0; for (const o of this.list) if (o !== e && o.alive && o.T.faction === e.T.faction && o.pos.distanceTo(e.pos) < r) n++; return n; },
  near(e, r) {
    const out = [];
    for (const o of this.list) if (o !== e && o.alive && !o.T.ghost && Math.abs(o.pos.x - e.pos.x) < r && Math.abs(o.pos.z - e.pos.z) < r && o.pos.distanceTo(e.pos) < r) out.push(o);
    return out;
  },
  rally(cap) {
    for (const o of this.list) if (o.alive && o !== cap && o.T.faction === cap.T.faction && o.pos.distanceTo(cap.pos) < 16) { o.rallied = 20; effects.glitter(o.pos.x, o.pos.y + 1.6, o.pos.z, [1, 0.4, 0.3]); }
  },
  moraleShock(cap) {
    for (const o of this.list) {
      if (!o.alive || o === cap || o.T.faction !== 'insan' || o.T.boss || o.pos.distanceTo(cap.pos) > 30) continue;
      if (Math.random() < 0.55) o._flee();
    }
  },
  // devriye noktası: ev çevresinde karada rastgele nokta
  patrolPoint(e) {
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * 6.28, r = 2 + Math.random() * e.homeR;
      const x = e.home.x + Math.cos(a) * r, z = e.home.z + Math.sin(a) * r;
      if (e.T.ghost || terrain.heightAt(x, z) > 0.6) return new THREE.Vector3(x, 0, z);
    }
    return e.home.clone();
  },
  // siper: hedefle arasında çarpıştırıcı (kaya, ağaç, duvar) olan yakın nokta
  findCover(e, tpos) {
    let best = null, bd = 1e9;
    const R = 12;
    for (const c of physics.all) {
      if (c.t !== 'c' || c.r < 0.35 || c.r > 3) continue;
      if (Math.abs(c.x - e.pos.x) > R || Math.abs(c.z - e.pos.z) > R) continue;
      const dx = c.x - tpos.x, dz = c.z - tpos.z;
      const dt = Math.hypot(dx, dz);
      if (dt < 7 || dt > 22) continue;
      const px = c.x + (dx / dt) * (c.r + 0.7), pz = c.z + (dz / dt) * (c.r + 0.7);
      if (terrain.heightAt(px, pz) < 0.5) continue;
      const d = Math.hypot(px - e.pos.x, pz - e.pos.z);
      let taken = false;
      for (const o of this.list) if (o !== e && o.coverPt && Math.hypot(o.coverPt.x - px, o.coverPt.z - pz) < 1.5) taken = true;
      if (!taken && d < bd) { bd = d; best = new THREE.Vector3(px, 0, pz); }
    }
    return best;
  },

  // ---- mermiler ----
  shoot(o) {
    const mesh = projMesh(o.kind);
    mesh.position.copy(o.from);
    this.scene.add(mesh);
    this.shots.push({ ...o, pos: o.from.clone(), vel: o.dir.clone().multiplyScalar(o.speed), mesh, t: 0 });
  },
  _updateShots(dt) {
    const pls = [];
    const p = G.player;
    if (p && !p.dead && !p.downed) pls.push({ id: G.myId, ref: p });
    if (G.isHost) for (const [id, r] of G.remotes) if (!r.downed) pls.push({ id, ref: r });
    for (const s of this.shots) {
      s.t += dt;
      if (s.homing && s.homingK) {
        const want = _v.set(s.homing.pos.x, s.homing.pos.y + 1.1, s.homing.pos.z).sub(s.pos).normalize().multiplyScalar(s.speed);
        s.vel.lerp(want, Math.min(1, dt * s.homingK));
      }
      if (s.kind === 'bolt' || s.kind === 'knife') s.vel.y -= 4 * dt;
      const prev = s.pos.clone();
      s.pos.addScaledVector(s.vel, dt);
      s.mesh.position.copy(s.pos);
      if (s.kind === 'knife') s.mesh.rotateX(dt * 20); else s.mesh.lookAt(_w.copy(s.pos).add(s.vel));
      if (s.kind === 'ghostbolt' && Math.random() < 0.5) effects.spawn(s.pos.x, s.pos.y, s.pos.z, 0, 0.2, 0, 0.5, 0.25, 0.6, 1, 0.95, 0, 1);
      // oyunculara isabet (kapsül)
      for (const t of pls) {
        const pl = t.ref;
        const a = _v.set(pl.pos.x, pl.pos.y + 0.25, pl.pos.z), b = _w.set(pl.pos.x, pl.pos.y + 1.7, pl.pos.z);
        if (segSegDist(prev, s.pos, a, b) < (s.kind === 'ghostbolt' ? 0.5 : 0.36)) {
          s.dead = true;
          // kılıçla savuşturma (ok/bıçak), kaçınma dokunulmazlığı
          if (t.id === G.myId && pl.blocking && (s.kind === 'bolt' || s.kind === 'knife') && Math.abs(wrapAngle(Math.atan2(-s.vel.x, -s.vel.z) - pl.yaw)) < 1.2) {
            pl.stamina -= 8; effects.sparks(s.pos.x, s.pos.y, s.pos.z, 10, [1, 0.9, 0.6]); audio.play('hit', { pos: s.pos, vol: 0.6, rate: 1.8 }); break;
          }
          if (t.id === G.myId && pl.invuln > 0) { s.dead = false; continue; }
          const owner = s.owner;
          if (owner && owner._hitPlayer) owner._hitPlayer(t.id, pl, s.dmg, null, { ranged: true, bullet: s.kind === 'bullet' });
          else if (t.id === G.myId) pl.hurt(s.dmg, s.from, { cause: 'Vuruldun', bullet: true });
          effects.sparks(s.pos.x, s.pos.y, s.pos.z, 6, s.kind === 'ghostbolt' ? [0.5, 1, 0.9] : [0.6, 0.05, 0.05]);
          break;
        }
      }
      if (s.dead) continue;
      const g = terrain.heightAt(s.pos.x, s.pos.z);
      if (s.pos.y < g) { s.dead = true; effects.dirt(s.pos.x, g + 0.05, s.pos.z, 5); continue; }
      if (s.pos.y < ocean.heightAt(s.pos.x, s.pos.z)) { s.dead = true; effects.splash(s.pos.x, s.pos.z, 0.3); continue; }
      if (physics.lineBlocked(prev.x, prev.y, prev.z, s.pos.x, s.pos.y, s.pos.z)) { s.dead = true; effects.dirt(s.pos.x, s.pos.y, s.pos.z, 4); continue; }
      if (s.t > 4) s.dead = true;
    }
    for (const s of this.shots) if (s.dead) this.scene.remove(s.mesh);
    if (this.shots.some((s) => s.dead)) this.shots = this.shots.filter((s) => !s.dead);
  },

  // ---- oyuncuya yakın grupları doldur ----
  _populate(dt) {
    const p = G.player;
    if (!p) return;
    const night = sky.isNight();
    const focusPts = [p.pos, ...[...G.remotes.values()].map((r) => r.pos)];
    for (const gr of this.groups) {
      const st = this.groupState[gr.id] || (this.groupState[gr.id] = { spawned: false, cooldown: 0, nightDone: false });
      st.cooldown -= dt;
      const near = focusPts.some((f) => Math.hypot(f.x - gr.x, f.z - gr.z) < 140);
      const far = focusPts.every((f) => Math.hypot(f.x - gr.x, f.z - gr.z) > 220);
      if (near && !st.spawned && st.cooldown <= 0) {
        st.spawned = true;
        gr.list.forEach((t, i) => this._spawnInGroup(t, gr, false, i));
        st.nightDone = false;
      }
      if (near && night && !st.nightDone && gr.night) {
        st.nightDone = true;
        gr.night.forEach((t, i) => this._spawnInGroup(t, gr, true, i + 10));
      }
      if (!night) st.nightDone = false;
      if (far && st.spawned) {
        const mine = this.list.filter((e) => e.group === gr.id);
        const allDead = mine.length && mine.every((e) => !e.alive);
        for (const e of mine) { e.dispose(); e.removed = true; }
        this.list = this.list.filter((e) => e.group !== gr.id);
        st.spawned = false;
        st.cooldown = allDead ? gr.respawn : 0;
      }
    }
  },

  _spawnInGroup(t, gr, rise, i) {
    t = enemyType(t);
    const T = ENEMY_TYPES[t];
    // roller: kamp ateşi varsa geceleri bazıları ateş başında oturur
    let role = T.roles ? T.roles[i % T.roles.length] : 'patrol';
    if (role === 'rest' && !gr.fire) role = 'patrol';
    let x, z;
    if (role === 'rest' && gr.fire) {
      const a = i * 1.7;
      x = gr.fire.x + Math.cos(a) * 2.4; z = gr.fire.z + Math.sin(a) * 2.4;
    } else {
      const a = Math.random() * 6.28, r = Math.random() * gr.r;
      x = gr.x + Math.cos(a) * r; z = gr.z + Math.sin(a) * r;
      if (terrain.heightAt(x, z) < 0.6) { x = gr.x; z = gr.z; }
    }
    const yaw = role === 'rest' && gr.fire ? Math.atan2(gr.fire.x - x, gr.fire.z - z) : Math.random() * 6.28;
    this.spawn(t, x, z, { group: gr.id, homeR: gr.r + 6, rise: rise && T.faction === 'iskelet', role, yaw });
  },

  update(dt) {
    if (G.isHost) this._populate(dt);
    const p = G.player;
    for (const e of this.list) {
      // yapay zekâ ve animasyon ayrıntı seviyesi: uzaktakiler daha seyrek güncellenir
      const d = p ? Math.hypot(e.pos.x - p.pos.x, e.pos.z - p.pos.z) : 0;
      e._lodAcc = (e._lodAcc || 0) + dt;
      const step = d > 90 ? 0.25 : d > 45 ? 0.066 : 0;
      if (e._lodAcc < step) continue;
      const edt = e._lodAcc; e._lodAcc = 0;
      if (G.isHost || !G.online) e.update(edt);
      else this._interp(e, edt);
      e.char.update(edt);
      if (e.rallied > 0) e.rallied -= edt;
      e._updateHud(edt);
      if (e._ring && e.state !== 'attack') e._ring.visible = false;
    }
    this._updateShots(dt);
    const rm = this.list.filter((e) => e.remove);
    for (const e of rm) e.dispose();
    if (rm.length) this.list = this.list.filter((e) => !e.remove);
    // boss HUD
    const boss = this.list.find((e) => (e.T.boss || e.T.miniboss) && e.alive && G.player && e.pos.distanceTo(G.player.pos) < 45 && e.state !== 'patrol');
    G.emit('bossBar', boss ? { name: boss.T.name, hp: boss.hp / boss.maxHp } : null);
  },

  _interp(e, dt) {
    if (!e.netTarget) return;
    const t = e.netTarget;
    e.pos.x = damp(e.pos.x, t[2], 10, dt); e.pos.y = damp(e.pos.y, t[3], 10, dt); e.pos.z = damp(e.pos.z, t[4], 10, dt);
    e.yaw = dampAngle(e.yaw, t[5], 10, dt);
    const c = e.char;
    if (t[6] === 'Ragdoll') { if (!c.ragdoll) c.startRagdoll({ ground: (x, z, y) => physics.groundAt(x, z, y + 0.6) }); }
    else {
      if (t[6] && c.currentName !== t[6]) c.play(t[6], 0.15, { once: isOnce(t[6]) });
      const up = t[9] || null;
      if (up !== (c.upperName || null)) { if (up) c.playUpper(up, 0.1, { once: isOnce(up) }); else c.stopUpper(0.15); }
    }
    e.hp = t[7];
    if (t[11]) e.maxHp = t[11];
    e.alive = !!t[8];
    e.alert = t[10] || 0;
    if (!c.ragdoll) { e.root.position.copy(e.pos); e.root.rotation.y = e.yaw; }
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

// iki doğru parçası arasındaki en kısa mesafe (mermi ↔ oyuncu kapsülü)
function segSegDist(p1, q1, p2, q2) {
  const d1 = _sA.subVectors(q1, p1), d2 = _sB.subVectors(q2, p2), r = _sC.subVectors(p1, p2);
  const a = d1.dot(d1), e = d2.dot(d2), f = d2.dot(r);
  let s, t;
  if (a <= 1e-9 && e <= 1e-9) return r.length();
  if (a <= 1e-9) { s = 0; t = clamp(f / e, 0, 1); }
  else {
    const c = d1.dot(r);
    if (e <= 1e-9) { t = 0; s = clamp(-c / a, 0, 1); }
    else {
      const b = d1.dot(d2), den = a * e - b * b;
      s = den !== 0 ? clamp((b * f - c * e) / den, 0, 1) : 0;
      t = (b * s + f) / e;
      if (t < 0) { t = 0; s = clamp(-c / a, 0, 1); } else if (t > 1) { t = 1; s = clamp((b - c) / a, 0, 1); }
    }
  }
  const c1 = _sD.copy(p1).addScaledVector(d1, s), c2 = _sE.copy(p2).addScaledVector(d2, t);
  return c1.distanceTo(c2);
}
const _sA = new THREE.Vector3(), _sB = new THREE.Vector3(), _sC = new THREE.Vector3(), _sD = new THREE.Vector3(), _sE = new THREE.Vector3();
void lerp; void UP;
