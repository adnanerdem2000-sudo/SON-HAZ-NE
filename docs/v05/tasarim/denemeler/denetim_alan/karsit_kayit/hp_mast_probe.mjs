// Salt-okur karşıt deneme: kod satırlarının birebir ifadeleriyle iki yan etki
// 1) progress.recompute (progress.js:153-162) yükleme sırası: game.js:130 p.hp=kayıt, Player maxHp=100 (player.js:42)
const recompute = (p, mHp) => { const ratio = p.maxHp ? p.hp / p.maxHp : 1; p.maxHp = 100 + mHp; p.hp = Math.min(p.maxHp, Math.max(1, Math.round(p.maxHp * ratio))); };
const loads = [];
let saved = 50; // Demir Bilek 3. kademe: +45 → azami 145
for (let i = 0; i < 4; i++) { const p = { hp: 100, maxHp: 100 }; p.hp = saved; recompute(p, 45); loads.push(`${saved}->${p.hp}/${p.maxHp}`); saved = p.hp; }
// 2) replaceShip (shipControl.js:41-52) → createPlayerShip mastHp/cannonHp eski diziyle (ship.js:43-44)
const sloop = { mastHp: [100], cannonHp: [100, 100, 100, 100] };
const brig = { masts: 2, cannons: 8 };
const mastHp = [...sloop.mastHp], cannonHp = [...sloop.cannonHp];
const toppled = []; for (let i = 0; i < brig.masts; i++) if (!(mastHp[i] > 0)) toppled.push(i); // ship.js:124 koşulu
const canFire = []; for (let i = 0; i < brig.cannons; i++) canFire.push((cannonHp?.[i] ?? 100) > 0); // ship.js:681
const dmgable = []; for (let i = 0; i < brig.cannons; i++) dmgable.push(cannonHp[i] > 0); // ship.js:96
// direk 1'e isabet: ship.js:88-90
const m2 = [...mastHp]; if (!(m2[1] <= 0)) m2[1] = Math.max(0, m2[1] - 10 * 2.4);
const afterSave = JSON.parse(JSON.stringify(m2));
const sailF = (arr) => { let a = 0; for (let i = 0; i < 2; i++) { const h = arr[i]; a += h <= 0 ? 0 : h < 30 ? 0.55 : 1; } return a / 2; }; // ship.js:115
console.log(JSON.stringify({ hpYuklemeZinciri: loads, devrikDirekler: toppled, topAtesEdebilir: canFire, topHasarAlabilir: dmgable, isabetSonrasi: m2.map(String), kayitSonrasi: afterSave, yelkenCarpani: { once: sailF(mastHp), kayitYuklemeSonrasi: sailF(afterSave) } }, null, 1));
