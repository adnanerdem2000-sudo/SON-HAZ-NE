// Faz 5 tasarım denemesi (salt-okur): anlık görüntü bant genişliği — v0.4 biçimi ile önerilen konuk başına katmanlı biçim.
// v0.4 biçimleri kaynak koddan: player.netState (player.js:986-993), ship.netState (ship.js:704-708), enemy.net (enemies.js:1240-1242),
// animal.net (animals.js:746), megafauna.netSnapshot (megafauna.js:725-727), _hostSnapshot (net.js:734-743).
let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const r = (a, b, d = 2) => +(a + rnd() * (b - a)).toFixed(d);
const pid = (i) => 'p' + Math.floor(rnd() * 1e9).toString(36) + 'x' + i + 'abcdefghijklmno'.slice(0, 20); // PeerJS rastgele kimlikleri ~36 karakter
const v04 = {
  player: (x, z) => ({ x: r(x - 2, x + 2), y: r(1, 3), z: r(z - 2, z + 2), yaw: r(-3, 3), anim: 'Run', up: null, loop: 1, mode: 'ground', eq: 'sword', carry: null, hp: 100, torch: false, down: false, swimP: 0, air: 0, ship: null, lx: 0, lz: 0, ly: 0 }),
  ship: (x, z) => ({ id: 'ship_main', typeId: 'sloop', look: { hull: '#3a2418', stripe: '#7a1f1f', sail: '#f2e8d0', flag: 'skull' }, name: 'Martı', st: [r(x, x + 1), r(z, z + 1), r(-3, 3, 4), r(0, 11), 0.12, 0.85, 1, 0, 'up', 100, 0, 0, r(-9, 9), r(-9, 9), 0.012, [100, 100, 100, 100, 100, 100], [100], [100, 100, 100, 100], [], 0, 24, 8, [['h1', 1.2, -2.3, 1]]] }),
  enemy: (i, x, z) => ['e' + Math.floor(rnd() * 1e8).toString(36), 'haydut_nisanci', r(x - 60, x + 60), r(0, 40), r(z - 60, z + 60), r(-3, 3), 'Run', 80, 1, 0, 0.42, 100],
  animal: (i, x, z) => ['a' + Math.floor(rnd() * 1e8).toString(36), 'yaban_domuzu', r(x - 120, x + 120), r(0, 40), r(z - 120, z + 120), r(-3, 3), r(0, 3, 1), 'wander', 1],
  mf: (i, x, z) => ['m' + i, 2, r(x - 300, x + 300), r(-20, 0), r(z - 300, z + 300), r(-3, 3), 0.01, 0.0, 3, 1, 1.2, 1, 0.8],
};
// v0.4: her konuğa aynı ileti, 15 Hz; tam liste her 2. görüntüde
function v04Bytes(sc) {
  const light = { t: 'snap', players: {}, ships: [], floats: [], shots: [] };
  sc.players.forEach((p, i) => { light.players[pid(i)] = v04.player(p.x, p.z); });
  for (const s of sc.ships) light.ships.push(v04.ship(s.x, s.z));
  for (let i = 0; i < sc.floats; i++) light.floats.push(['f' + i, r(-9000, 9000), 0.2, r(-9000, 9000)]);
  for (let i = 0; i < sc.shots; i++) light.shots.push(['arrow', r(-9000, 9000), 2, r(-9000, 9000)]);
  light.rb = ['docked', 1, 2, 0.1, 0, [], null];
  const full = { ...light, en: [], bo: null, an: [], mf: [], time: [12.5, 'acik', 1.2, 3, [['acik', 14.0], ['yagmur', 20.0]], 0.1], wfx: [], we: { ice: [], wisp: null, met: null, vol: null, pl: 0 }, ch: [] };
  for (const g of sc.groups) { for (let i = 0; i < g.en; i++) full.en.push(v04.enemy(i, g.x, g.z)); for (let i = 0; i < g.an; i++) full.an.push(v04.animal(i, g.x, g.z)); for (let i = 0; i < g.mf; i++) full.mf.push(v04.mf(i, g.x, g.z)); }
  const L = JSON.stringify(light).length, F = JSON.stringify(full).length;
  return { perSnapLight: L, perSnapFull: F, perGuestBps: (L + F) * 7.5 };
}
// önerilen: konuk başına; varlık kimlikleri oturum içi kısa tamsayı (spawn iletisinde eşlenir); konum dm tamsayı; yaw 1/100 rad tamsayı;
// statik alanlar (tür, maxHp, görünüm, ad) yalnız spawn'da; hasar dizileri yalnız değişince olay kanalında.
const P = {
  player: (i, x, z) => [i, Math.round(x * 10), Math.round(r(1, 3) * 10), Math.round(z * 10), Math.round(r(-3, 3) * 100), 7, 0, 1, 100, 0], // [idx,x,y,z,yaw,animIdx,upIdx,flags,hp,modeIdx]
  ship: (i, x, z) => [i, Math.round(x * 10), Math.round(z * 10), Math.round(r(-3, 3) * 1000), Math.round(r(0, 11) * 10), 12, 85, 100, 0, Math.round(r(-9, 9) * 10), Math.round(r(-9, 9) * 10), 12, 0], // + rudder, sail, sailT, anchorT, vx, vz, yawRate, flags
  enemy: (i, x, z) => [i, Math.round(x * 10), Math.round(r(0, 40) * 10), Math.round(z * 10), Math.round(r(-3, 3) * 100), 4, 80, 1],
  animal: (i, x, z) => [i, Math.round(x * 10), Math.round(r(0, 40) * 10), Math.round(z * 10), Math.round(r(-3, 3) * 100), 2],
  mf: (i, x, z) => [i, Math.round(x * 10), Math.round(r(-20, 0) * 10), Math.round(z * 10), Math.round(r(-3, 3) * 100), 1, 0, 3, 1],
};
const T = [{ r: 80, hz: 15 }, { r: 250, hz: 5 }, { r: 1000, hz: 1 }];
// katman → Hz: K0 ≤40 m 15 Hz (hayvan 7,5), K1 40–80 m 7,5 Hz, K2 80–250 m 3 Hz, K3 250–1000 m 1 Hz (oyuncu/gemi/deniz devi), K4 ötesi 0,5 Hz (oyuncu/gemi)
function hzFor(d, kind) {
  if (kind === 'enemy' || kind === 'animal') { if (d <= 40) return kind === 'animal' ? 7.5 : 15; if (d <= 80) return 7.5; if (d <= 250) return 3; return 0; }
  if (kind === 'mf') { if (d <= 80) return 7.5; if (d <= 250) return 3; if (d <= 600) return 1; return 0; }
  if (d <= 40) return 15; if (d <= 80) return 7.5; if (d <= 250) return 3; if (d <= 1000) return 1; return 0.5;
}
function propBytes(sc, gi) {
  const me = sc.players[gi];
  let bps = 0; const per = { 15: [], 7.5: [], 3: [], 1: [], 0.5: [] };
  const add = (kind, arr, x, z) => { const hz = hzFor(Math.hypot(x - me.x, z - me.z), kind); if (!hz) return; per[hz].push(JSON.stringify(arr).length + 1); };
  sc.players.forEach((p, i) => { if (i !== gi) add('player', P.player(i, p.x, p.z), p.x, p.z); });
  sc.ships.forEach((s, i) => add('ship', P.ship(i, s.x, s.z), s.x, s.z));
  let k = 0;
  for (const g of sc.groups) {
    for (let i = 0; i < g.en; i++) { const x = r(g.x - 60, g.x + 60), z = r(g.z - 60, g.z + 60); add('enemy', P.enemy(k++, x, z), x, z); }
    for (let i = 0; i < g.an; i++) { const x = r(g.x - 120, g.x + 120), z = r(g.z - 120, g.z + 120); add('animal', P.animal(k++, x, z), x, z); }
    for (let i = 0; i < g.mf; i++) { const x = r(g.x - 300, g.x + 300), z = r(g.z - 300, g.z + 300); add('mf', P.mf(k++, x, z), x, z); }
  }
  // her paket: {"t":"s","sq":12345,"ts":1234567,"ak":123,"k":"0","p":[...],"e":[...]} başlığı ~60 B
  const HDR = 60;
  for (const hz of [15, 7.5, 3, 1, 0.5]) { const body = per[hz].reduce((a, b) => a + b, 0); if (body) bps += (body + HDR) * hz; }
  // olay kanalı (spawn/despawn, hasar, sohbet, envanter): ölçüm yok → sabit pay
  const evBps = 600;
  const biggest = Math.max(...[15, 7.5, 3, 1, 0.5].map((hz) => per[hz].reduce((a, b) => a + b, 0) + HDR));
  return { bps: bps + evBps, biggestPacket: biggest };
}
const scenarios = {
  'S1 liman: 4 oyuncu bir arada': { players: [{ x: 0, z: 0 }, { x: 5, z: 3 }, { x: -4, z: 6 }, { x: 8, z: -5 }], ships: [{ x: 30, z: 40 }], floats: 1, shots: 0, groups: [{ x: 0, z: 0, en: 4, an: 18, mf: 2 }] },
  'S2 dağınık: 3 adada': { players: [{ x: 0, z: 0 }, { x: 1800, z: 600 }, { x: -2500, z: 3000 }, { x: 1810, z: 610 }], ships: [{ x: 1830, z: 640 }], floats: 3, shots: 2, groups: [{ x: 0, z: 0, en: 6, an: 25, mf: 2 }, { x: 1800, z: 600, en: 10, an: 30, mf: 3 }, { x: -2500, z: 3000, en: 8, an: 25, mf: 2 }] },
  'S3 deniz savaşı: düşman gemisi': { players: [{ x: 0, z: 0 }, { x: 3, z: 2 }, { x: -2, z: 4 }, { x: 1, z: -3 }], ships: [{ x: 0, z: 0 }, { x: 60, z: 30 }], floats: 6, shots: 20, groups: [{ x: 40, z: 20, en: 8, an: 0, mf: 4 }] },
  'S4 en kötü: kalabalık kamp': { players: [{ x: 0, z: 0 }, { x: 20, z: 10 }, { x: -15, z: 12 }, { x: 10, z: -25 }], ships: [{ x: 120, z: 80 }, { x: 300, z: -200 }], floats: 5, shots: 30, groups: [{ x: 0, z: 0, en: 30, an: 50, mf: 4 }] },
};
const out = [];
for (const [name, sc] of Object.entries(scenarios)) {
  seed = 11; const a = v04Bytes(sc);
  const guests = [1, 2, 3].map((gi) => { seed = 11 + gi; return propBytes(sc, gi); });
  const propUp = guests.reduce((s, g) => s + g.bps, 0);
  out.push({ senaryo: name, v04_paket_hafif_B: a.perSnapLight, v04_paket_tam_B: a.perSnapFull, v04_konukBasi_kbit: +(a.perGuestBps * 8 / 1000).toFixed(1), v04_host_3konuk_kbit: Math.round(a.perGuestBps * 3 * 8 / 1000), oneri_konukBasi_kbit: guests.map((g) => +(g.bps * 8 / 1000).toFixed(1)).join(' / '), oneri_host_3konuk_kbit: Math.round(propUp * 8 / 1000), oneri_enBuyukPaket_B: Math.max(...guests.map((g) => g.biggestPacket)) });
}
console.table(out);
