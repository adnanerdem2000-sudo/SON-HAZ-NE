import { G } from '../game/ctx.js';
import { sky } from './sky.js';
import { CHEST_TIERS, RARITY } from '../economy/items.js';
import { DIG_SITES, ISLANDS } from './worldData.js';

// Zaman çizelgesi: takvim (gün sayacı), gelgit, günlük program, dönemsel dünya olayları ve macera günlüğü.
// Günün saati sky.hour'dadır; 1 oyun saati = 1 gerçek dakika (varsayılan).

const TIDE_PERIOD = 12.42; // saat (yarı günlük gelgit)
const TIDE_AMP = 0.55; // metre

// Günlük program: her gün tekrarlanan olaylar
export const DAILY = [
  { id: 'safak', h: 5.5, end: 7.5, icon: '🐟', title: 'Şafak balık akını', desc: 'Balıklar yeme daha hızlı vurur.', effect: 'fishFrenzy' },
  { id: 'liman_acilis', h: 6, icon: '⚓', title: 'Liman açılır', desc: 'Tüccarlar tezgâhlarını açar.' },
  { id: 'ogle', h: 12, icon: '☀', title: 'Öğle güneşi', desc: 'Gölgeler en kısa halinde; bazı hazine ipuçları öğle gölgesine bakar.' },
  { id: 'aksam_akini', h: 18, end: 20, icon: '🐟', title: 'Akşam balık akını', desc: 'Gün batımında balıklar yeniden hareketlenir.', effect: 'fishFrenzy' },
  { id: 'han_muzik', h: 19, end: 23, icon: '🎵', title: 'Handa akşam eğlencesi', desc: 'Kırlangıç Hanı\'nda müzik ve sıcak yemek.' },
  { id: 'liman_kapanis', h: 22, icon: '🌙', title: 'Dükkânlar kapanır', desc: 'Tüccarlar hana çekilir; Sedef Hanım gece yarısına kadar açık.' },
  { id: 'hayalet_saati', h: 0, end: 4, icon: '👻', title: 'Hayalet saatleri', desc: 'Ölüler en güçlü halinde. Kemik Adası\'ndan uzak dur — ya da cesaretini göster.', effect: 'ghostHours' },
];

// Dönemsel olaylar (gün numarasına bağlı)
export const PERIODIC = [
  { id: 'ticaret_gemisi', every: 2, offset: 1, h: 11, end: 16, icon: '⛵', title: 'Ticaret gemisi limanda', desc: 'Uzak diyarlardan gelen tüccar nadir eşyalar satar ve hazinelere +%15 öder.', effect: 'tradeShip' },
  { id: 'pazar', every: 3, offset: 0, h: 8, end: 20, icon: '🏪', title: 'Pazar günü', desc: 'Kırlangıç pazarında tüm satış fiyatları +%20.', effect: 'market' },
  { id: 'senlik', every: 5, offset: 2, h: 18, end: 23.9, icon: '🎉', title: 'Korsan şenliği', desc: 'Handa şenlik! Han hizmetleri yarı fiyata.', effect: 'festival' },
];

// Tüccar çalışma saatleri
export const SHOP_HOURS = {
  general: [6, 22], fisher: [5, 20], weapons: [7, 21], tailor: [8, 20], shipwright: [6, 21],
  cartographer: [8, 22], treasure: [6, 24], quest: [0, 24], board: [0, 24], trader: [11, 16],
};

export const time = {
  name: 'time',
  saveKey: 'time',
  day: 1,
  log: [],
  _prevHour: null,
  _active: new Set(),

  // Macera günlüğü: önemli olayları zaman damgasıyla kaydet
  init() {
    const L = (t, k) => { if (G.state === 'playing') this.addLog(t, k); };
    G.on('treasureFound', (e) => {
      const site = DIG_SITES.find((s) => s.id === e.site);
      const isl = site && ISLANDS.find((i) => i.id === site.island);
      L(`Hazine kazıldı: ${CHEST_TIERS[e.tier]?.name || 'sandık'}${isl ? ` (${isl.name})` : ''}`, 'good');
    });
    G.on('chestSold', (e) => L(`${CHEST_TIERS[e.tier]?.name || 'Sandık'} satıldı: +${e.gold} altın`, 'good'));
    G.on('chestOpened', (e) => L(`${CHEST_TIERS[e.tier]?.name || 'Sandık'} açıldı`, 'info'));
    G.on('fishCaught', (e) => { const r = e.data?.rarity; if (!e.released && r && r !== 'siradan' && r !== 'yaygin') L(`${RARITY[r]?.name || ''} balık: ${e.data.name} (${e.data.len} cm, ${e.data.weight} kg)`, 'good'); });
    G.on('enemyKilled', (e) => { if (e.enemy?.T?.boss) L(`${e.enemy.T.name} yenildi!`, 'story'); });
    G.on('bossSpawn', (e) => L(`${e.enemy?.T?.name || 'Güçlü bir düşman'} ile karşılaşıldı`, 'warn'));
    G.on('enemyShipSunk', () => L('Bir korsan gemisi batırıldı', 'good'));
    G.on('playerDied', (e) => L(`Bayıldın: ${e.cause || 'bilinmeyen sebep'}`, 'warn'));
    G.on('shipBought', () => L('Yeni bir gemi satın alındı', 'good'));
    G.on('shipUpgraded', (e) => L(`Gemi geliştirildi: ${{ hull: 'gövde', sails: 'yelkenler', cannons: 'toplar' }[e.kind] || e.kind}`, 'info'));
    G.on('mapGained', () => L('Yeni bir hazine haritası edinildi', 'info'));
    G.on('discovered', (e) => L(`Keşif: ${e.name}`, 'info'));
    G.on('storyAdvanced', (e) => L(`Hikâye: "${e.title || 'yeni bölüm'}" başladı`, 'story'));
    G.on('weatherChanged', (e) => { if (e.to === 'firtina') L('Fırtına koptu', 'warn'); else if (e.from === 'firtina') L('Fırtına dindi', 'info'); });
    G.on('shipEvent', (e) => { if (e.t === 'sinking' && e.ship === G.ship) L(`${e.ship.name} battı!`, 'warn'); });
    G.on('timeEvent', (e) => { const p = PERIODIC.find((x) => x.id === e.id); if (p && e.start) L(`${p.icon} ${p.title}`, 'info'); });
  },

  start(data) {
    const d = data?.time;
    this.day = d?.day || 1;
    this.log = d?.log || [];
    this._prevHour = null;
    this._active = new Set();
  },
  stop() {},
  save() { return { day: this.day, log: this.log.slice(-200) }; },

  totalHours() { return (this.day - 1) * 24 + sky.hour; },

  // ---- Gelgit ----
  tide(th = this.totalHours()) { return TIDE_AMP * Math.sin((2 * Math.PI * th) / TIDE_PERIOD + 1.2); },
  tideRising(th = this.totalHours()) { return Math.cos((2 * Math.PI * th) / TIDE_PERIOD + 1.2) > 0; },
  // sonraki yüksek ve alçak su saatleri
  nextTides(count = 4) {
    const out = [];
    const now = this.totalHours();
    // tepe noktaları: faz = π/2 + kπ
    const w = (2 * Math.PI) / TIDE_PERIOD;
    let k = Math.ceil(((now * w + 1.2) - Math.PI / 2) / Math.PI);
    while (out.length < count) {
      const t = (Math.PI / 2 + k * Math.PI - 1.2) / w;
      if (t > now) out.push({ at: t, high: k % 2 === 0 });
      k++;
    }
    return out;
  },

  // ---- Program ----
  isActive(effect) {
    for (const id of this._active) {
      const ev = [...DAILY, ...PERIODIC].find((e) => e.id === id);
      if (ev && ev.effect === effect) return true;
    }
    return false;
  },
  shopOpen(role) {
    const h = SHOP_HOURS[role];
    if (!h) return true;
    const x = sky.hour;
    return h[0] <= h[1] ? x >= h[0] && x < h[1] : x >= h[0] || x < h[1];
  },
  priceBonus() { return (this.isActive('market') ? 0.2 : 0) + (this.isActive('tradeShip') ? 0.15 : 0); },

  // Belirli bir gün için o günün olayları (saat sırasına göre)
  scheduleFor(day = this.day) {
    const list = DAILY.map((e) => ({ ...e }));
    for (const p of PERIODIC) if ((day - 1 - p.offset) % p.every === 0) list.push({ ...p });
    return list.sort((a, b) => a.h - b.h);
  },
  // Önümüzdeki saatlerdeki olaylar (HUD zaman çizelgesi için)
  upcoming(hours = 12) {
    const now = this.totalHours();
    const out = [];
    for (let d = this.day; d <= this.day + 1; d++) {
      for (const e of this.scheduleFor(d)) {
        const at = (d - 1) * 24 + e.h;
        if (at >= now - (e.end ? e.end - e.h : 0) && at <= now + hours) out.push({ ...e, at, endAt: e.end !== undefined ? (d - 1) * 24 + e.end : null });
      }
    }
    for (const f of sky.forecast || []) if (f.at > now && f.at <= now + hours) out.push({ id: 'hava_' + f.key, at: f.at, icon: sky.weatherIcon(f.key), title: 'Hava: ' + sky.weatherName(f.key), weather: true });
    for (const t of this.nextTides(3)) if (t.at <= now + hours) out.push({ id: 'gelgit', at: t.at, icon: t.high ? '🌊' : '🏖', title: t.high ? 'Yüksek su' : 'Alçak su', tide: true });
    return out.sort((a, b) => a.at - b.at);
  },

  addLog(text, kind = 'info') {
    this.log.push({ day: this.day, hour: +sky.hour.toFixed(2), text, kind });
    if (this.log.length > 250) this.log.shift();
  },

  hourString(h) {
    const hh = Math.floor(((h % 24) + 24) % 24), mm = Math.floor((h % 1) * 60);
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  },
  stamp(day, hour) { return `Gün ${day}, ${this.hourString(hour)}`; },

  update() {
    const h = sky.hour;
    if (this._prevHour !== null && h < this._prevHour - 12) {
      this.day++;
      G.emit('newDay', { day: this.day });
      G.notify(`Gün ${this.day} başladı.`, 'info', 3000);
    }
    this._prevHour = h;
    // olay başlangıç/bitişleri
    const now = this.totalHours();
    const todays = [...this.scheduleFor(this.day), ...this.scheduleFor(this.day - 1).filter((e) => e.end && e.end < e.h)];
    const nowActive = new Set();
    for (const e of todays) {
      const start = (this.day - 1) * 24 + e.h;
      const end = e.end !== undefined ? (this.day - 1) * 24 + e.end : start + 0.25;
      if (now >= start && now < end) nowActive.add(e.id);
    }
    for (const id of nowActive) if (!this._active.has(id)) {
      const e = todays.find((x) => x.id === id);
      if (this._prevActiveInit) { G.notify(`${e.icon} ${e.title} — ${e.desc}`, 'event', 5000); G.emit('timeEvent', { id, start: true }); }
    }
    for (const id of this._active) if (!nowActive.has(id)) G.emit('timeEvent', { id, start: false });
    this._active = nowActive;
    this._prevActiveInit = true;
  },

  // Handa uyuma: belirtilen saate kadar zamanı ilerlet
  sleepUntil(hour = 6) {
    let h = sky.hour;
    const add = (hour - h + 24) % 24 || 24;
    const total = this.totalHours() + add;
    this.day = Math.floor(total / 24) + 1;
    sky.hour = total % 24;
    this._prevHour = sky.hour;
    sky.advanceForecast?.(this.totalHours());
    return add;
  },
};
