// panels.js:101 ('Ambara koy' → netHold yayını, balık dahil), panels.js:150-152 (ambardan balık 'Al': yalnız yerel, ileti yok),
// net.js:563 (konukta 'hold' → s.hold = m.hold) ve net.js:345-357 (ev sahibinde konuk 'hold' → {items, chests}, fish atılır)
const clone = (o) => JSON.parse(JSON.stringify(o));
const host = { hold: { items: {}, chests: [] }, inv: [] }, guest = { hold: { items: {}, chests: [] }, inv: [] };
const hostBroadcastHold = () => { guest.hold = clone(host.hold); };                     // ev sahibi kaynaklı netHold → konuk kopyası
const takeFishLocal = (who) => { const f = who.hold.fish?.shift(); if (f) who.inv.push(f); };
// ev sahibi epik balığı 'Ambara koy' ile koyar → yayın
host.hold.fish = [{ key: 'kilic_baligi', rarity: 'epik', value: 420 }]; hostBroadcastHold();
takeFishLocal(guest);                       // konuk ambardan alır (ağ iletisi yok)
host.hold.items.tahta = 3; hostBroadcastHold(); // ev sahibi ambara başka bir şey koyar → konuğun kopyası balıkla yenilenir
takeFishLocal(guest);                       // konuk aynı balığı yeniden alır
takeFishLocal(host);                        // ev sahibi de alır
console.log('başlangıçta 1 balık → konuk çantası:', guest.inv.length, '| ev sahibi çantası:', host.inv.length, '| toplam', guest.inv.length + host.inv.length);
// Ters yön (E-02): ev sahibinde balık varken konuk ambara herhangi bir şey koyarsa
host.hold.fish = [{ key: 'orkinos', rarity: 'epik', value: 350 }]; hostBroadcastHold();
const g = clone(guest.hold); g.items.ekmek = 1; // konuk eşya koyar, kendi kopyasını gönderir
const items = {}; for (const k in g.items) items[k] = Math.round(Math.min(999, Math.max(0, g.items[k])));
host.hold = { items, chests: g.chests.slice(0, 40) };
console.log('konuk ekmek koyduktan sonra ev sahibinde fish:', host.hold.fish);
