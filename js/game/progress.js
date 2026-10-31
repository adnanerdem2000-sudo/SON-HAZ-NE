import { G } from './ctx.js';
import { audio } from '../core/audio.js';
import { effects } from './effects.js';
import { ENEMY_TYPES } from './enemies.js';
import { SPECIES } from '../wildlife/animals.js';

// Korsan rütbesi: deneyim (XP), seviye, rütbe unvanı ve dört dallı yetenek ağacı.
// Yetenekler G.mods çarpanlarıyla oyun sistemlerine bağlanır (savaş, gemi, kazı, ticaret).

export const MAX_LEVEL = 30;
export const need = (L) => Math.round(100 * Math.pow(L, 1.45));

export const RANKS = [
  [1, 'Miço'], [3, 'Tayfa'], [6, 'Gabya Neferi'], [9, 'Topçu'], [12, 'Lostromo'],
  [15, 'Serdümen'], [18, 'Kaptan'], [22, 'Reis'], [26, 'Kaptan-ı Derya'], [30, 'Efsanevi Korsan'],
];
export function rankOf(level) { let r = RANKS[0][1]; for (const [l, n] of RANKS) if (level >= l) r = n; return r; }
export function nextRank(level) { return RANKS.find(([l]) => l > level) || null; }

export const SKILLS = {
  kilic: {
    name: 'Kılıç Ustası', icon: 'sword', color: '#d8584a', list: [
      { id: 'keskin_pala', name: 'Keskin Pala', desc: (r) => `Kılıç ve yumruk hasarı +%${r * 8}`, apply: (m, r) => { m.melee *= 1 + 0.08 * r; } },
      { id: 'demir_bilek', name: 'Demir Bilek', desc: (r) => `Azami can +${r * 15}`, apply: (m, r) => { m.hp += 15 * r; } },
      { id: 'deniz_cigeri', name: 'Deniz Ciğeri', desc: (r) => `Dayanıklılık yenilenmesi ve su altında nefes +%${r * 20}`, apply: (m, r) => { m.stamina *= 1 + 0.2 * r; m.breath *= 1 + 0.2 * r; } },
    ],
  },
  nisanci: {
    name: 'Nişancı', icon: 'pistol', color: '#e8b84a', list: [
      { id: 'hizli_dolum', name: 'Hızlı Dolum', desc: (r) => `Tabanca dolum süresi −%${r * 12}`, apply: (m, r) => { m.reload *= 1 - 0.12 * r; } },
      { id: 'kartal_gozu', name: 'Kartal Gözü', desc: (r) => `Tabanca hasarı +%${r * 10}`, apply: (m, r) => { m.gun *= 1 + 0.1 * r; } },
      { id: 'topcu_ustasi', name: 'Topçu Ustası', desc: (r) => `Top hasarı +%${r * 10}, top dolumu −%${r * 8}`, apply: (m, r) => { m.cannon *= 1 + 0.1 * r; m.cannonReload *= 1 - 0.08 * r; } },
    ],
  },
  denizci: {
    name: 'Denizci', icon: 'anchor', color: '#5aa8f0', list: [
      { id: 'ruzgar_okuyucu', name: 'Rüzgâr Okuyucu', desc: (r) => `Gemi hızı +%${r * 4}`, apply: (m, r) => { m.ship *= 1 + 0.04 * r; } },
      { id: 'usta_marangoz', name: 'Usta Marangoz', desc: (r) => `Delik, top ve direk onarımı +%${r * 25} hızlı`, apply: (m, r) => { m.repair *= 1 + 0.25 * r; } },
      { id: 'saglam_omurga', name: 'Sağlam Omurga', desc: (r) => `Geminin aldığı hasar −%${r * 10}`, apply: (m, r) => { m.hull *= 1 - 0.1 * r; } },
    ],
  },
  hazine: {
    name: 'Hazine Avcısı', icon: 'shovel', color: '#8fd16a', list: [
      { id: 'hizli_kurek', name: 'Hızlı Kürek', desc: (r) => `Kazı hızı +%${r * 20}`, apply: (m, r) => { m.dig *= 1 + 0.2 * r; } },
      { id: 'pazarlikci', name: 'Pazarlıkçı', desc: (r) => `Tüccarlara satış fiyatı +%${r * 6}`, apply: (m, r) => { m.price *= 1 + 0.06 * r; } },
      { id: 'talihli', name: 'Talihli', desc: (r) => `Ganimetten çıkan altın +%${r * 8}`, apply: (m, r) => { m.gold *= 1 + 0.08 * r; } },
    ],
  },
};
export const SKILL_MAX = 3;
const ALL = Object.values(SKILLS).flatMap((b) => b.list);

const baseMods = () => ({ melee: 1, gun: 1, reload: 1, cannon: 1, cannonReload: 1, hp: 0, stamina: 1, breath: 1, ship: 1, repair: 1, hull: 1, dig: 1, price: 1, gold: 1 });
G.mods = baseMods();

const FISH_XP = { siradan: 5, yaygin: 8, nadir: 25, epik: 60, efsanevi: 150 };
const TREASURE_XP = { small: 60, medium: 100, large: 160, legend: 300 };
const GUEST_KEY = 'dk_progress_guest';

export const progress = {
  name: 'progress',
  saveKey: 'progress',
  level: 1, xp: 0, points: 0, skills: {}, seen: new Set(),

  init() {
    const share = (xp, reason, by) => {
      // ev sahibi: öldüren oyuncu tam, diğer tayfa üçte bir pay alır
      if (by && by !== G.myId && G.online) { G.emit('netXp', { id: by, xp, reason }); this.gain(Math.round(xp / 3), 'Tayfa payı'); }
      else { this.gain(xp, reason); if (G.online && G.isHost) for (const id of G.remotes.keys()) G.emit('netXp', { id, xp: Math.round(xp / 3), reason: 'Tayfa payı' }); }
    };
    G.on('enemyKilled', (e) => { const T = ENEMY_TYPES[e.type]; if (T && !T.boss) share((T.xp || 10) * 2, T.name || 'Düşman', e.by); });
    G.on('animalKilled', (e) => share(Math.max(3, Math.round((SPECIES[e.kind]?.hp || 30) / 6)), SPECIES[e.kind]?.name || 'Av', e.by));
    G.on('bossDefeated', (e) => { this.gain(600, e.name || 'Efsanevi düşman'); if (G.online && G.isHost) for (const id of G.remotes.keys()) G.emit('netXp', { id, xp: 600, reason: e.name }); });
    G.on('treasureFound', (e) => { const xp = TREASURE_XP[e.tier] || 60; if (!e.who || e.who === G.myId) this.gain(xp, 'Hazine bulundu'); else G.emit('netXp', { id: e.who, xp, reason: 'Hazine bulundu' }); });
    G.on('discovered', () => this.gain(25, 'Keşif'));
    G.on('fishCaught', (e) => { if (!e.released) this.gain(FISH_XP[e.data?.rarity] || 5, 'Balık'); });
    G.on('storyAdvanced', () => this.gain(150, 'Hikâye'));
    G.on('shipCaptured', () => this.gain(300, 'Gemi ele geçirildi'));
    G.on('enemyShipSunk', () => this.gain(200, 'Düşman gemisi batırıldı'));
    G.on('prisonerFreed', () => this.gain(80, 'Tutsak kurtarıldı'));
    G.on('puzzleLooted', () => this.gain(150, 'Bulmaca çözüldü'));
    G.on('templeOpened', () => this.gain(250, 'Tapınak açıldı'));
    G.on('chestSold', () => this.gain(20, 'Sandık satıldı'));
    G.on('rareFind', () => this.gain(80, 'Nadir buluntu'));
    G.on('diceWin', () => this.gain(5, 'Zar'));
    G.on('seeAnimal', (k) => { if (!this.seen.has(k)) { this.seen.add(k); this.gain(15, 'Yeni canlı'); } });
    G.on('autosave', () => this._guestSave());
  },

  start(data) {
    let d = data?.progress;
    if (G.online && !G.isHost) { try { d = JSON.parse(localStorage.getItem(GUEST_KEY) || 'null'); } catch (e) { d = null; } }
    this.level = d?.level || 1;
    this.xp = d?.xp || 0;
    this.skills = { ...(d?.skills || {}) };
    const spent = Object.values(this.skills).reduce((s, v) => s + v, 0);
    this.points = d?.points ?? Math.max(0, this.level - 1 - spent);
    this.seen = new Set(d?.seen || []);
    this.recompute();
  },
  stop() { this._guestSave(); },
  save() { return { level: this.level, xp: this.xp, points: this.points, skills: this.skills, seen: [...this.seen] }; },
  _guestSave() { if (G.online && !G.isHost) try { localStorage.setItem(GUEST_KEY, JSON.stringify(this.save())); } catch (e) { /* depolama dolu */ } },

  rank() { return rankOf(this.level); },
  needNow() { return need(this.level); },

  gain(xp, reason = '') {
    if (!(xp > 0) || this.level >= MAX_LEVEL) return;
    this.xp += Math.round(xp);
    G.emit('xpGain', { xp: Math.round(xp), reason });
    while (this.level < MAX_LEVEL && this.xp >= need(this.level)) {
      this.xp -= need(this.level);
      this.level++;
      this.points++;
      this._levelUp();
    }
    if (this.level >= MAX_LEVEL) this.xp = 0;
  },

  _levelUp() {
    const p = G.player;
    const before = rankOf(this.level - 1), now = rankOf(this.level);
    G.emit('levelUp', { level: this.level, rank: now, newRank: before !== now });
    audio.play('level_up', { vol: 0.8 });
    if (p) {
      p.hp = p.maxHp;
      p.stamina = 100;
      for (let i = 0; i < 3; i++) effects.glitter(p.pos.x, p.pos.y + 1 + i * 0.4, p.pos.z, [1, 0.85, 0.35]);
    }
    this._guestSave();
  },

  rankOfSkill(id) { return this.skills[id] || 0; },
  canLearn(id) { return this.points > 0 && this.rankOfSkill(id) < SKILL_MAX; },
  learn(id) {
    if (!this.canLearn(id)) return false;
    this.skills[id] = this.rankOfSkill(id) + 1;
    this.points--;
    this.recompute();
    audio.play('confirm', { vol: 0.5 });
    this._guestSave();
    return true;
  },

  recompute() {
    const m = baseMods();
    for (const s of ALL) { const r = this.rankOfSkill(s.id); if (r) s.apply(m, r); }
    G.mods = m;
    const p = G.player;
    if (p) {
      const ratio = p.maxHp ? p.hp / p.maxHp : 1;
      p.maxHp = 100 + m.hp;
      p.hp = Math.min(p.maxHp, Math.max(1, Math.round(p.maxHp * ratio)));
    }
  },

  update() {
    const s = G.ship;
    if (s) { s.speedMul = G.mods.ship; s.dmgTakenMul = G.mods.hull; }
  },
};
