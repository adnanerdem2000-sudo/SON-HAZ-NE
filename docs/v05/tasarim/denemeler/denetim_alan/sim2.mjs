// İkinci deneme: app adı, hold/lootReq/shipFull sahteciliği, chestReq mesafesi, maps+dig, hazard (salt-okur)
class V3 { constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;} set(x,y,z){this.x=x;this.y=y;this.z=z;return this;} clone(){return new V3(this.x,this.y,this.z);} copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;}
  distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z);} add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this;} toArray(){return [this.x,this.y,this.z];} }
globalThis.__THREE = { Vector3: V3 };
let nowMs = 0; globalThis.performance = { now: () => nowMs };
const log = [];
const G = { online: true, isHost: true, myId: 'HOST', remotes: new Map(), ships: [], player: { inv: { gold: 0 }, pos: new V3() }, state: 'playing', notify: (t) => log.push('notify:' + t) };
G.on = (evt, fn) => { (G._h ||= {})[evt] = fn; }; G.emit = (e, d) => { log.push('emit:' + e); if (G._h?.[e]) G._h[e](d); };
const ship = { serialize() { return {}; }, id: 'ship_main', typeId: 'sloop', x: 0, z: 0, hold: { items: {}, chests: [] }, upg: { hull: 0, sails: 0, cannons: 0 }, T: { hp: 100 }, look: {}, _syncHoles() {}, rebuild() {} };
G.ships.push(ship); G.ship = ship;
const chest = { id: 'ch1', state: 'ground', carriers: [], pos: new V3(3000, 0, 3000), tier: 'legend', contents: [['altin_para', 1500]] };
const T = { chestNet: (c) => c, pickupNet: (p) => p, chests: [chest], pickups: [{ id: 'pk1', remove: false, pos: new V3(-3000, 0, -3000) }], chestById: (id) => T.chests.find((c) => c.id === id),
  _grant: (c, who) => { log.push('grant:' + c.id + '>' + who); return true; }, _openChest: (c, who) => log.push('open:' + c.id + '>' + who), _collect: (pk, who) => log.push('collect:' + pk.id + '>' + who),
  _hole() {}, resolveDig: (x, z, pid) => log.push('dig:' + x + ',' + z), spawnLoot: (pos, table, from, exact, o) => log.push('loot:' + JSON.stringify(table) + ' exact=' + exact),
  takeFromHoldFor: (s, idx, who) => { const h = s.hold.chests[idx]; log.push('holdTake:' + JSON.stringify(h)); return h ? { id: h.id } : null; } };
globalThis.__STUBS = { G, Character: class {}, enemies: { list: [] }, bosses: {}, isOnce: () => false, physics: {}, terrain: {}, animals: { byId: () => null }, megafauna: { byId: () => null },
  hazards: { netApply: (m) => log.push('hazard:' + m.a + ':' + m.id + ' f=' + m.f) }, worldEvents: {}, progress: {}, treasure: T, combat: { noise() {} }, effects: {}, interact: { locks: new Map() },
  quests: { flags: {}, stage: 0, markers: [] }, sky: { hour: 1 }, time: {}, weatherfx: {}, events: { collectFloatingById: (id, who, pos) => log.push('float:' + id + ' pos=' + pos.x) }, audio: { play() {} },
  damp: (a, b) => b, dampAngle: (a, b) => b, clamp: (v, a, b) => Math.min(b, Math.max(a, v)) };
globalThis.location = { search: '' };
const { net } = await import('./net_copy.mjs');
net.room = { name: 'oda', max: 4, pw: '', code: 'X' }; net.roster = [{ id: 'HOST', name: 'Kaptan' }]; net.scene = {};
const sent = []; const conn = { peer: 'g1', open: true, send: (m) => sent.push(m) };
const H = (m) => { nowMs += 20; try { return net._hostData(conn, JSON.parse(JSON.stringify(m))); } catch (e) { console.log('   [işleyici istisnası]', m.t, '→', e.message); } };
H({ t: 'hello', ver: 'dksh-v1', name: 'Tayfa', app: {} });
const remote = { pos: new V3(0, 0, 0), target: { ship: null }, apply(s) { this.target = s; } }; G.remotes.set('g1', remote);
// app adı
H({ t: 'app', app: { base: 'x' }, name: '<img src=x onerror=alert(1)>' + 'Z'.repeat(3000) });
const me = net.roster.find((r) => r.id === 'g1'); console.log('A app sonrası roster adı uzunluğu:', me.name.length, '| başı:', me.name.slice(0, 28));
// hold: sahte efsanevi sandık + sınırsız anahtar
H({ t: 'hold', ship: 'ship_main', hold: { items: { altin_para: 999, elmas: 999, kraliyet_taci: 999, altin_kulce: 999 }, chests: Array.from({ length: 40 }, (_, i) => ({ id: 'f' + i, tier: 'legend', contents: [['altin_para', 1e9]], weight: -1e6 })) } });
console.log('B ambar sandık sayısı:', ship.hold.chests.length, '| ilk sandık:', JSON.stringify(ship.hold.chests[0]), '| eşyalar:', JSON.stringify(ship.hold.items));
H({ t: 'holdTake', ship: 'ship_main', idx: 0 });
console.log('B2 holdTake (ev sahibi sandığı konuk adına doğurur):', log.filter((l) => l.startsWith('holdTake')).pop());
// lootReq: 10 satır × 999 tam liste + veri nesnesi
H({ t: 'lootReq', pos: [1, 0, 1], exact: true, table: [['altin_para', 1, 999], ['balik:sahte', 1, 1, { value: 1e12, weight: -1e9, name: 'Altın Balık', rarity: 'epik' }], ['elmas', 1, 999]] });
console.log('C lootReq ile doğan kese:', log.filter((l) => l.startsWith('loot:')).pop());
// shipFull: hiçbir doğrulama yok
H({ t: 'shipFull', ship: { id: 'ship_main', typeId: 'sloop', upg: undefined, hold: { items: { altin_para: 1e9 }, chests: [] }, hp: 1e9, cannonballs: 1e9, planks: 1e9 } });
console.log('D shipFull sonrası: upg =', ship.upg, '| hp =', ship.hp, '| hold =', JSON.stringify(ship.hold), '| gülle =', ship.cannonballs);
// chestReq: konuk 4 km uzakta
H({ t: 'chestReq', a: 'open', id: 'ch1' }); H({ t: 'pickupReq', id: 'pk1' });
console.log('E uzaktan sandık açma / kese toplama:', log.filter((l) => l.startsWith('open:') || l.startsWith('collect:')).join(' ; '));
// maps + dig: tüm alanlar
H({ t: 'maps', sites: ['marti_1', 'x2', 'x3'] }); H({ t: 'dig', x: 'abc', z: null });
console.log('F remoteMapSites:', JSON.stringify(G.remoteMapSites), '| dig çağrısı:', log.filter((l) => l.startsWith('dig:')).pop());
// hazard: doğrulamasız iletim
H({ t: 'hazard', id: 'keg_17', a: 'ignite', f: -5 }); H({ t: 'hazard', id: 'pz_3', a: 'solve' });
console.log('G hazard:', log.filter((l) => l.startsWith('hazard:')).join(' ; '));
// revive: mesafesiz
let revived = false; G.player.revive = () => { revived = true; }; H({ t: 'revive', target: 'HOST' });
console.log('H revive (mesafe denetimi yok) ev sahibi kalktı mı:', revived);
// floatReq NaN konum
remote.pos.set(NaN, 0, NaN); H({ t: 'floatReq', id: 'fl1' });
console.log('I floatReq NaN konumla iletildi:', log.filter((l) => l.startsWith('float:')).pop());
