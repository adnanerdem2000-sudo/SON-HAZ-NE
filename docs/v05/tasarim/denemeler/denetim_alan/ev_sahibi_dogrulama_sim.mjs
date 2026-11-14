// js/net/net.js içindeki yardımcıların ve iki işleyicinin birebir kopyası (yan etkisiz, Node'da).
const num = (v, lo, hi, def = 0) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : def);
const str = (v, max = 64) => (typeof v === 'string' ? v.slice(0, max) : '');

// 1) 'hold' işleyicisi (net.js:345-357): ev sahibi ambarı konuğun gönderdiği nesneden yeniden kurar
function hostHold(m) {
  const items = {}; for (const k in (m.hold.items || {})) if (typeof k === 'string' && k.length < 40) items[k] = Math.round(num(m.hold.items[k], 0, 999));
  return { items, chests: Array.isArray(m.hold.chests) ? m.hold.chests.slice(0, 40) : [] };
}
const guestHold = { items: { tahta: 3 }, chests: [{ id: 'ch1', tier: 'small' }], fish: [{ key: 'orkinos', rarity: 'epik', value: 900 }] };
console.log('1) konuk ambarı (balıklı) →', JSON.stringify(guestHold));
console.log('   ev sahibinde yeni ambar →', JSON.stringify(hostHold({ hold: guestHold })), '(fish alanı düştü)');
console.log('   keyfî eşya enjeksiyonu  →', JSON.stringify(hostHold({ hold: { items: { altin_para: 999, elmas: 999 }, chests: [] } })));

// 2) NaN mesafe denetimi: 'st' doğrulanmadığı için uzak oyuncu konumu NaN olabilir (net.js:96-100)
let pos = 5; const tx = 'x' - 0; // konuk st.x = "x" gönderir → tx - pos = NaN
pos += (tx - pos) * (1 - Math.exp(-14 / 60));
const d = Math.hypot(100 - pos, 0);
console.log('2) uzak konum NaN mı?', Number.isNaN(pos), '| hurtEnemy reddi (d > 6):', d > 6, '| lootReq reddi (d > 30):', d > 30, '| chestState kabulü (d < 8):', d < 8);

// 3) altın payı (net.js:373-383): tek iletide ≤5000, dakikada ≤20000; satan konuk payı önceden düşmüştür (shop.js:120-128)
function share(total, remotes) { const s = Math.floor(total / (remotes + 1)); const sent = Math.round(num(s, 0, 5000)); return { pay: s, evSahibiAlir: sent, kayip: s - sent }; }
console.log('3) 2 oyuncu, 12000 satış →', share(12000, 1), '| 4 oyuncu, 30000 satış →', share(30000, 3));
