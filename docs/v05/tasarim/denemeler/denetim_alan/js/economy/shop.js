import { G } from '../game/ctx.js';
import { ports } from '../world/ports.js';
import { ITEMS, CHEST_TIERS, itemValue, itemName } from './items.js';
import { COSMETIC_PRICES } from '../player/appearance.js';
import { SHIP_TYPES } from '../ship/shipModel.js';
import { port } from '../world/port.js';
import { audio } from '../core/audio.js';
import { time } from '../world/time.js';

// Tüccar tanımları: ne satarlar, hangi kategorileri hangi çarpanla alırlar
export const MERCHANTS = {
  general: {
    name: 'Tüccar Rıza', sells: ['tahta', 'gulle', 'mermi', 'yem_solucan', 'yem_karides', 'ekmek', 'muz', 'merhem', 'fener', 'kurek', 'pusula', 'durbun', 'hava_kesesi'],
    buys: { ganimet: 0.55, tas: 0.6, koleksiyon: 0.5, balik: 0.5, sarf: 0.5, arac: 0.5, silah: 0.4, mermi: 0.5, harita: 0.5 },
    greet: 'Hoş geldin kaptan! Halat, tahta, gülle, erzak… Ne lazımsa Rıza\'da var.',
  },
  fisher: {
    name: 'Balıkçı Yusuf', sells: ['olta', 'usta_olta', 'yem_solucan', 'yem_karides', 'yem_yapay', 'zipkin', 'balik_agi', 'dalis_maskesi', 'palet', 'hava_kesesi'],
    buys: { balik: 1.0 },
    greet: 'Rüzgâr iyi, balık bol. Tuttuğunu getir, hakkını veririm. Nadir balıklara iyi para öderim!',
  },
  weapons: {
    name: 'Demirci Kara Ali', sells: ['kilic', 'usta_kilic', 'tabanca', 'usta_tabanca', 'mermi'],
    buys: { silah: 0.5, mermi: 0.5 },
    greet: 'Pala keskin, barut kuru olmalı. Kızıl Hançer\'in adamlarına karşı hazırlıklı ol.',
  },
  treasure: {
    name: 'Sedef Hanım', sells: [],
    buys: { tas: 1.15, ganimet: 1.0, koleksiyon: 1.05, harita: 0.6 },
    chests: true,
    greet: 'Mücevher, antika, sandık… Değerini bilen alıcıya getirdin. Sandıkları açmadan da alırım.',
  },
  cartographer: {
    name: 'Haritacı Nevra', sells: [],
    buys: { harita: 0.7 },
    greet: 'Haritalar konuşur, yeter ki dinlemeyi bil. Yeni bir harita mı arıyorsun?',
  },
  // Zaman çizelgesindeki ticaret günlerinde limana yanaşan "Altın Martı"nın tüccarı
  // Gizli Korsan Pazarı (yalnız gece)
  smuggler: {
    name: 'Kaçakçı', sells: ['usta_kilic', 'usta_tabanca', 'durbun', 'gulle', 'mermi', 'merhem', 'yem_yapay', 'hazine_haritasi', 'usta_zipkin'], discount: 0.85,
    buys: { tas: 1.25, ganimet: 1.1, koleksiyon: 1.2, silah: 0.7, harita: 0.9 },
    greet: 'Soru sorma, yalan duyma. Gece pazarında her şeyin bir fiyatı var, kaptan.',
  },
  trader: {
    name: 'Halil Reis — Altın Martı', sells: ['usta_kilic', 'usta_tabanca', 'usta_olta', 'usta_zipkin', 'durbun', 'yem_yapay', 'merhem', 'pusula', 'baharat', 'ipek'],
    buys: { tas: 1.2, ganimet: 1.05, koleksiyon: 1.15, balik: 0.7 },
    discount: 0.85,
    greet: 'Uzak limanlardan geldim kaptan: Kara Ali\'nin dövdüğünden iyi palalar, ipek, baharat… Hepsi %15 indirimli. Mücevherine de iyi para veririm — ama yalnızca gün batmadan!',
  },
};

export function sellPrice(stack, role) {
  const M = MERCHANTS[role];
  const cat = stack.id.startsWith('balik:') ? 'balik' : ITEMS[stack.id]?.cat;
  if (!M || !cat || ITEMS[stack.id]?.nosell || ITEMS[stack.id]?.currency) return 0;
  const mult = M.buys[cat];
  if (!mult) return 0;
  let v = itemValue(stack) * mult;
  if (stack.id.startsWith('balik:')) v = (stack.data?.value || 10) * mult * ({ nadir: 1.2, epik: 1.4 }[stack.data?.rarity] || 1);
  // zaman çizelgesi: pazar günü ve ticaret gemisi günlerinde satış fiyatları artar
  v *= 1 + time.priceBonus();
  v *= G.mods?.price || 1; // Pazarlıkçı yeteneği
  // al-sat döngüsü yok: bir tüccardan satın alınabilen eşya hiçbir yere liste değerinin %90'ından pahalıya satılamaz
  // (alış fiyatı en az %97,75); ganimet/balık/koleksiyon gibi satın alınamayan eşyalarda çarpanlar korunur
  if (PURCHASABLE.has(stack.id)) v = Math.min(v, (ITEMS[stack.id]?.value || 1) * 0.9);
  return Math.max(1, Math.round(v));
}
const PURCHASABLE = new Set(Object.values(MERCHANTS).flatMap((m) => m.sells || []));
export function buyPrice(id, role) { return Math.round((ITEMS[id]?.value || 1) * 1.15 * (MERCHANTS[role]?.discount || 1)); }

export const shop = {
  buy(id, n = 1, role) {
    const p = G.player;
    const price = buyPrice(id, role) * n;
    if (p.inv.gold < price) { G.notify('Yeterli altının yok.', 'warn'); audio.play('ui', { vol: 0.3, rate: 0.6 }); return false; }
    // gülle ve tahta doğrudan gemiye de konabilir
    if (id === 'gulle' && G.ship) { G.ship.cannonballs += n; if (G.online && !G.isHost) G.emit('shipCmd', { ship: G.ship.id, cmd: 'addBalls', n }); p.inv.gold -= price; G.notify(`${n} gülle gemine yüklendi (toplam ${G.ship.cannonballs}).`, 'good'); audio.play('coin', { vol: 0.5 }); this._afterTrade(); return true; }
    if (!p.inv.canAdd(id, n)) { G.notify('Envanterde yer yok (ağırlık sınırı).', 'warn'); return false; }
    if (!ITEMS[id].stack && p.inv.has(id) && ITEMS[id].cat !== 'sarf') { G.notify('Bundan zaten bir tane var.', 'info'); return false; }
    p.inv.gold -= price;
    p.inv.add(id, n);
    audio.play('coin', { vol: 0.5 });
    G.emit('itemBought', { id, n, price });
    this._afterTrade();
    return true;
  },

  sell(stack, role, n = null) {
    const p = G.player;
    const unit = sellPrice({ ...stack, n: 1 }, role);
    if (!unit) return 0;
    const count = n ?? (stack.n || 1);
    const gold = stack.id.startsWith('balik:') ? sellPrice(stack, role) : unit * count;
    p.inv.removeStack(stack, count);
    p.unequipIfMissing?.(); // son kılıç/tabanca/olta satıldıysa elde kalmasın
    this.earn(gold);
    G.emit('itemSold', { id: stack.id, n: count, gold, role, data: stack.data });
    audio.play('coin', { vol: 0.6 });
    this._afterTrade();
    return gold;
  },

  sellAll(role, filter = null) {
    const p = G.player;
    let total = 0, cnt = 0;
    for (const s of [...p.inv.stacks]) {
      if (filter && !filter(s)) continue;
      const pr = sellPrice(s, role);
      // 'Tümünü sat' teçhizatı, usta aletleri, dürbünü, hazine haritalarını, cephaneyi ve yemi satmaz
      const keep = ['kilic', 'tabanca', 'kurek', 'olta', 'pusula', 'fener', 'usta_kilic', 'usta_tabanca', 'usta_olta', 'durbun', 'hazine_haritasi', 'mermi', 'gulle', 'tahta', 'zipkin', 'usta_zipkin', 'balik_agi', 'dalis_maskesi', 'palet', 'hava_kesesi'];
      if (pr > 0 && !keep.includes(s.id) && !s.id.startsWith('yem')) { total += this.sell(s, role); cnt++; }
    }
    if (cnt) G.notify(`${cnt} kalem satıldı: +${total} altın`, 'good');
    else G.notify('Bu tüccara satılacak bir şeyin yok.', 'info');
    return total;
  },

  // Co-op: satış gelirini tayfa arasında paylaştır
  earn(gold) {
    const p = G.player;
    if (G.online && G.remotes.size > 0 && G.shareGold !== false) {
      const share = Math.floor(gold / (G.remotes.size + 1));
      p.inv.gold += gold - share * G.remotes.size;
      G.emit('netShareGold', { amount: share });
      G.notify(`Kazanç tayfayla paylaşıldı: herkese ${share} altın.`, 'good', 3000);
    } else p.inv.gold += gold;
    G.emit('goldEarned', { gold });
  },

  shipNearPort() {
    const s = G.ship;
    return !!(s && !s.sunk && ports.atShip(s, 60));
  },

  chestPrice(tier) { return CHEST_TIERS[tier].value; },

  sellCarriedChest(treasureSys) {
    const p = G.player;
    if (!p.carrying) return 0;
    const c = treasureSys.chestById(p.carrying.id);
    if (!c) return 0;
    const v = this.chestPrice(c.tier);
    c.state = 'gone';
    treasureSys.scene.remove(c.mesh);
    treasureSys.chests = treasureSys.chests.filter((x) => x !== c);
    p.carrying = null;
    this.earn(v);
    audio.play('coin', { vol: 0.7 });
    G.emit('chestSold', { tier: c.tier, gold: v });
    G.emit('netChestGone', { id: c.id });
    this._afterTrade();
    return v;
  },

  sellHoldChests() {
    const s = G.ship;
    if (!s || !this.shipNearPort()) return 0;
    let total = 0;
    for (const h of s.hold.chests) { total += this.chestPrice(h.tier); G.emit('chestSold', { tier: h.tier, gold: this.chestPrice(h.tier) }); }
    const n = s.hold.chests.length;
    s.hold.chests = [];
    if (total) { this.earn(total); audio.play('coin', { vol: 0.8 }); G.notify(`${n} sandık satıldı: +${total} altın`, 'good', 4000); }
    G.emit('netHold', { ship: s.id, hold: s.hold });
    this._afterTrade();
    return total;
  },

  // ---- Gemi ustası hizmetleri ----
  repairCost() {
    const s = G.ship;
    if (!s) return 0;
    const P = s.parts || {};
    const partCost = ['pruva', 'kic', 'iskele', 'sancak', 'dumen', 'yelken'].reduce((a, k) => a + (100 - (P[k] ?? 100)) * 0.8, 0);
    const mastCost = (s.mastHp || []).reduce((a, h) => a + (100 - h) * (h <= 0 ? 3 : 1.2), 0);
    const cannonCost = (s.cannonHp || []).reduce((a, h) => a + (100 - h) * 0.6, 0);
    return Math.round((s.maxHp - s.hp) * 3 + s.holes.length * 25 + s.water * 0.5 + (s.sunk ? 600 : 0) + partCost + mastCost + cannonCost + (s.fires?.length || 0) * 10);
  },
  repairShip() {
    const s = G.ship; const p = G.player;
    const c = this.repairCost();
    if (c <= 0) { G.notify('Gemin zaten sapasağlam.'); return; }
    if (p.inv.gold < c) { G.notify('Tamir için yeterli altının yok.', 'warn'); return; }
    p.inv.gold -= c;
    s.hp = s.maxHp; s.holes = []; s.water = 0; s.fires = [];
    for (const k in s.parts) s.parts[k] = 100;
    s.mastHp = s.mastHp.map(() => 100); s.cannonHp = s.cannonHp.map(() => 100);
    s.rebuild({});
    audio.play('confirm', { vol: 0.6 });
    G.notify(`Gemi tamir edildi (-${c} altın).`, 'good');
    G.emit('netShipFull', { ship: s.serialize() });
  },
  UPG_COST: [800, 1600, 3200],
  upgrade(kind) {
    const s = G.ship; const p = G.player;
    const lvl = s.upg[kind] || 0;
    if (lvl >= 3) { G.notify('Bu geliştirme en üst seviyede.'); return; }
    const c = this.UPG_COST[lvl];
    if (p.inv.gold < c) { G.notify('Yeterli altının yok.', 'warn'); return; }
    p.inv.gold -= c;
    s.upg[kind] = lvl + 1;
    if (kind === 'hull') { const r = s.hp / s.maxHp; s.maxHp = s.T.hp * (1 + s.upg.hull * 0.25); s.hp = s.maxHp * r; }
    audio.play('level_up', { vol: 0.6 });
    G.notify(`Geliştirme tamamlandı: ${{ hull: 'Gövde', sails: 'Yelkenler', cannons: 'Toplar' }[kind]} seviye ${lvl + 1}`, 'good');
    G.emit('shipUpgraded', { kind });
    G.emit('netShipFull', { ship: s.serialize() });
  },
  buyShip(typeId, shipControl, scene) {
    const p = G.player;
    const T = SHIP_TYPES[typeId];
    if (G.ship.typeId === typeId) { G.notify('Zaten bu gemiye sahipsin.'); return; }
    if (p.inv.gold < T.price) { G.notify(`${T.name} için ${T.price} altın gerekiyor.`, 'warn'); return; }
    if (G.ship.hold.chests.length) { G.notify('Önce ambarındaki sandıkları sat ya da boşalt.', 'warn'); return; }
    p.inv.gold -= T.price;
    const owned = new Set(G.ownedShips || ['sloop']);
    owned.add(typeId);
    G.ownedShips = [...owned];
    shipControl.replaceShip(scene, typeId);
    audio.play('level_up', { vol: 0.8 });
    G.notify(`Yeni gemin hayırlı olsun: ${T.name}!`, 'good', 5000);
    G.emit('shipBought', { typeId });
    G.emit('netShipFull', { ship: G.ship.serialize(), replace: true });
  },
  buyForShip(kind, n) {
    const p = G.player; const s = G.ship;
    const price = kind === 'gulle' ? 12 * n : 15 * n;
    if (p.inv.gold < price) { G.notify('Yeterli altının yok.', 'warn'); return; }
    p.inv.gold -= price;
    if (kind === 'gulle') s.cannonballs += n; else s.planks += n;
    if (G.online && !G.isHost) G.emit('shipCmd', { ship: s.id, cmd: kind === 'gulle' ? 'addBalls' : 'addPlanks', n });
    audio.play('coin', { vol: 0.5 });
    G.notify(`${n} ${kind === 'gulle' ? 'gülle' : 'tamir tahtası'} gemiye yüklendi.`, 'good');
  },
  setShipLook(look, cost = 150) {
    const p = G.player;
    if (p.inv.gold < cost) { G.notify('Yeterli altının yok.', 'warn'); return false; }
    p.inv.gold -= cost;
    G.ship.rebuild(look);
    audio.play('confirm', { vol: 0.5 });
    G.emit('netShipFull', { ship: G.ship.serialize() });
    return true;
  },

  unlockCosmetic(key) {
    const p = G.player;
    const price = COSMETIC_PRICES[key];
    if (!price) return true;
    const owned = new Set(G.profile.unlocked || []);
    if (owned.has(key)) return true;
    if (p.inv.gold < price) { G.notify('Yeterli altının yok.', 'warn'); return false; }
    p.inv.gold -= price;
    owned.add(key);
    G.profile.unlocked = [...owned];
    G.emit('profileChanged');
    audio.play('gem', { vol: 0.5 });
    G.notify('Kozmetik açıldı! (Savaş gücü vermez, sadece tarz.)', 'good');
    return true;
  },

  _afterTrade() { G.emit('tradeDone'); },
  describe(stack) { return itemName(stack.id, stack.data); },
};
