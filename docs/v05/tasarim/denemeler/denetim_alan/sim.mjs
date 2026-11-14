// Saplamalı ev sahibi: konuk iletilerinin _hostData üzerindeki etkisini ölçer (salt-okur deneme)
class V3 { constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;} set(x,y,z){this.x=x;this.y=y;this.z=z;return this;} clone(){return new V3(this.x,this.y,this.z);} copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;}
  distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z);} add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this;} toArray(){return [this.x,this.y,this.z];} }
globalThis.__THREE = { Vector3: V3, CanvasTexture: class{}, SRGBColorSpace: 1, Sprite: class{ constructor(){ this.scale={set(){}}; this.position={}; } }, SpriteMaterial: class{} };
globalThis.performance = globalThis.performance || { now: () => Date.now() };
let nowMs = 0; performance.now = () => nowMs;
const log = [];
const G = { online: true, isHost: true, myId: 'HOST', remotes: new Map(), ships: [], player: { inv: { gold: 0 }, pos: new V3() }, state: 'playing',
  notify: (t) => log.push('notify:' + t), emit: (e, d) => log.push('emit:' + e + ':' + JSON.stringify(d).slice(0, 120)), on: () => {} };
const ship = { id: 'ship_main', x: 0, z: 0, sailTarget: 0, water: 50, planks: 0, cannonballs: 0, holes: [{ id: 'h1' }], cannonHp: [100, 100], mastHp: [100],
  cannonState: [{ reload: 0 }], toggleAnchor() { log.push('anchor'); }, repairHole(id) { log.push('repair:' + id); }, extinguish() {}, rebuild() { log.push('rebuild'); }, setRudder(v) { this.rud = v; }, aimCannon() {} };
G.ships.push(ship);
const enemy = { id: 'e1', alive: true, pos: new V3(500, 0, 500), hp: 1000, applyDamage(d, info) { this.hp -= d; this.lastInfo = info; }, stun(d) { this.stunned = d; } };
const boss = { hits: 0 };
globalThis.__STUBS = { G, Character: class { constructor() { this.root = { add() {}, position: new V3(), rotation: {} }; } }, enemies: { list: [enemy] }, bosses: {}, isOnce: () => false,
  physics: {}, terrain: {}, animals: { byId: () => null }, megafauna: { byId: () => null }, hazards: { netApply: (m) => log.push('hazard:' + m.a) }, worldEvents: {}, progress: {},
  treasure: { chests: [], pickups: [], chestById: () => null, _hole() {}, resolveDig: (x, z, pid) => log.push('dig:' + x + ',' + z), spawnLoot: (pos, table, from, exact) => log.push('loot:' + JSON.stringify(table)) },
  combat: { noise() {}, fireCannon() { log.push('fire'); } }, effects: {}, interact: { locks: new Map() }, quests: { flags: {}, stage: 0, markers: [], advance(to) { this.stage = to; log.push('advance:' + to); } },
  sky: {}, time: {}, weatherfx: {}, events: {}, audio: { play() {} }, damp: (a, b) => b, dampAngle: (a, b) => b, clamp: (v, a, b) => Math.min(b, Math.max(a, v)) };
globalThis.document = { createElement: () => ({ getContext: () => ({ strokeText() {}, fillText() {} }) }) };
G.on = (evt, fn) => { (G._h ||= {})[evt] = fn; };
G.emit = (e, d) => { log.push('emit:' + e); if (G._h?.[e]) G._h[e](d); };
globalThis.location = { search: '' };
const { net } = await import('./net_copy.mjs');
net.room = { name: 'oda', max: 4, pw: '', code: 'X' };
net.roster = [{ id: 'HOST', name: 'Kaptan' }];
net.scene = { add() {}, remove() {} };
const sent = [];
const conn = { peer: 'g1', open: true, send: (m) => sent.push(m) };
const H = (m) => net._hostData(conn, JSON.parse(JSON.stringify(m)));
// 1) hello iki kez → roster tekrarı
H({ t: 'hello', ver: 'dksh-v1', name: 'Tayfa', app: {} });
H({ t: 'hello', ver: 'dksh-v1', name: 'Tayfa', app: {} });
H({ t: 'hello', ver: 'dksh-v1', name: 'Tayfa', app: {} });
console.log('1 roster sonrası 3 hello:', net.roster.map((r) => r.id).join(','), '| reject gönderildi mi:', sent.some((m) => m.t === 'reject'));
// remote oyuncu kaydı (st ile RemotePlayer yerine sahte uzak)
const remote = { pos: new V3(0, 0, 0), target: null, apply(s) { this.target = s; const k = 0.5; this.pos.x += (s.x - this.pos.x) * k; this.pos.z += (s.z - this.pos.z) * k; } };
G.remotes.set('g1', remote);
// 2) 'gold' bütçesi: 1 dk içinde 300×5000 istek → işlenen
nowMs = 10000; let g0 = G.player.inv.gold;
for (let i = 0; i < 300; i++) { nowMs += 9; H({ t: 'gold', amount: 5000 }); }
console.log('2a 1. dakikada ev sahibine geçen altın:', G.player.inv.gold - g0);
let total = 0; g0 = G.player.inv.gold;
for (let min = 0; min < 60; min++) { nowMs += 60001; for (let i = 0; i < 4; i++) { nowMs += 1100; H({ t: 'gold', amount: 5000 }); } }
console.log('2b 60 dakikada ev sahibine geçen altın (yalnız gold iletisiyle):', G.player.inv.gold - g0);
// 3) hurtEnemy: konum st ile 'ışınlanır'; NaN konumla mesafe denetimi atlanır
nowMs += 5000;
H({ t: 'st', s: { x: 'a', z: 'b' } });
console.log('3a uzak konum (st x:"a"):', remote.pos.x, remote.pos.z);
const hp0 = enemy.hp; H({ t: 'hurtEnemy', id: 'e1', dmg: 99999, kind: 'melee', ctr: true });
console.log('3b NaN konumla 707 m uzaktaki düşmana hasar işlendi mi:', hp0 - enemy.hp, '| counter bayrağı:', enemy.lastInfo?.counter);
// 4) saniyede 120 ileti × 160 = DPS
remote.pos.set(500, 0, 501);
nowMs += 5000; const hp1 = enemy.hp; for (let i = 0; i < 200; i++) H({ t: 'hurtEnemy', id: 'e1', dmg: 99999, kind: 'melee' });
console.log('4 aynı saniyede 200 hurtEnemy → işlenen toplam hasar:', hp1 - enemy.hp);
// 5) hurtBoss: mesafe denetimi yok, kind serbest
nowMs += 5000; let bossMsg = null; G.on('netHurtBossApply', (m) => { bossMsg = m; });
remote.pos.set(9000, 0, 9000); H({ t: 'hurtBoss', id: 'kraken', dmg: 99999, kind: 'tentacle' });
console.log('5 hurtBoss (konuk 9 km uzakta) iletilen:', JSON.stringify(bossMsg));
// 6) shipCmd sails: sınırsız değer; konuk gemide değil
nowMs += 5000; H({ t: 'shipCmd', ship: 'ship_main', cmd: 'sails', v: 'abc' });
console.log('6a sailTarget (v:"abc"):', ship.sailTarget);
H({ t: 'shipCmd', ship: 'ship_main', cmd: 'sails', v: 1e9 });
console.log('6b sailTarget (v:1e9):', ship.sailTarget);
for (let i = 0; i < 5; i++) H({ t: 'shipCmd', ship: 'ship_main', cmd: 'addBalls', n: 200 });
console.log('6c ücretsiz gülle (5 ileti):', ship.cannonballs);
H({ t: 'shipCmd', ship: 'ship_main', cmd: 'repair', hole: 'h1' });
console.log('6d tahta 0 iken onarım çağrıldı mı:', log.includes('repair:h1'), 'planks:', ship.planks);
H({ t: 'shipCmd', ship: 'ship_main', cmd: 'cannonFix', i: 4294967294 });
console.log('6e cannonHp uzunluğu (i=4294967294):', ship.cannonHp.length);
// 7) lock + helm uzaktan
H({ t: 'lock', id: 'ship_main:helm', on: true });
H({ t: 'helm', ship: 'ship_main', rudder: 1, sail: 1, back: false });
console.log('7 uzaktan dümen kilidi ve dümen:', globalThis.__STUBS.interact.locks.get('ship_main:helm'), ship.rud, ship.sailTarget);
// 8) boat driver + boatSt ham değer
G.rowboat = { driver: null, state: 'docked', cargo: [], launch() {}, dock() {} };
H({ t: 'boat', cmd: 'driver', who: 'g1' });
H({ t: 'boatSt' });
const b = G.rowboat; let snapErr = null; try { [b.state, +b.x.toFixed(2)]; } catch (e) { snapErr = e.message; }
console.log('8 boatSt {} sonrası b.x:', b.x, '| _hostSnapshot satırı hata:', snapErr);
// 9) story: ardışık aşama atlama + keyfî bayrak
for (let s = 1; s <= 5; s++) H({ t: 'story', stage: s, flags: { kizilYenildi: true, parca1: true } });
console.log('9 hikâye aşaması:', globalThis.__STUBS.quests.stage, 'bayraklar:', JSON.stringify(globalThis.__STUBS.quests.flags));
// 10) st ve ping oran/boyut sınırı dışı
let before = sent.length; for (let i = 0; i < 1000; i++) H({ t: 'ping', ts: 'X'.repeat(70000) });
console.log('10 1000 büyük ping → yanıtlanan pong:', sent.length - before, 'yanıt boyutu ~', JSON.stringify(sent[sent.length - 1]).length);
// 11) app ile ad temizlenmeden değişir
H({ t: 'app', app: {}, name: '<img src=x onerror=alert(1)>' + 'Z'.repeat(5000) });
console.log('11 app sonrası ad uzunluğu/başı:', net.roster.find((r) => r.id === 'g1').name.length, net.roster.find((r) => r.id === 'g1').name.slice(0, 30));
