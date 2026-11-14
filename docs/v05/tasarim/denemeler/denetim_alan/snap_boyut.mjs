// net.js _hostSnapshot JSON boyutu tahmini (biçimler kaynak koddan: player.netState, ship.netState, enemy.net, animal.net, megafauna, floats, shots)
const r = (a, b) => +(a + Math.random() * (b - a)).toFixed(2);
const player = () => ({ x: r(-9000, 9000), y: r(0, 40), z: r(-9000, 9000), yaw: r(-3, 3), anim: 'Run', up: null, loop: 1, mode: 'ground', eq: 'sword', carry: null, hp: 100, torch: false, down: false, swimP: 0, air: 0, ship: null, lx: 0, lz: 0, ly: 0 });
const ship = () => ({ id: 'ship_main', typeId: 'sloop', look: { hull: '#3a2418', stripe: '#7a1f1f', sail: '#f2e8d0', flag: 'skull' }, name: 'Martı', st: [r(-9000, 9000), r(-9000, 9000), r(-3, 3), r(0, 11), 0.12, 0.85, 1, 0, 'up', 100, 0, 0, r(-9, 9), r(-9, 9), 0.012, [100, 100, 100, 100, 100, 100], [100], [100, 100, 100, 100], [], 0, 24, 8, [[ 'h1', 1.2, -2.3, 1 ]]] });
const enemy = (i) => ['e' + (1000 + i), 'haydut_nisanci', r(-9000, 9000), r(0, 40), r(-9000, 9000), r(-3, 3), 'Run', 80, 1, 0, 0.42, 100];
const animal = (i) => ['a' + (100 + i), 'yaban_domuzu', r(-9000, 9000), r(0, 40), r(-9000, 9000), r(-3, 3), 2.4, 'wander', 1];
function snap({ players = 4, ships = 1, en = 0, an = 0, floats = 0, shots = 0, full = true }) {
  const m = { t: 'snap', players: {}, ships: [], floats: [], shots: [] };
  for (let i = 0; i < players; i++) m.players['dksh-peer-id-' + i + 'xxxxxxxxxxxxxxxx'] = player();
  for (let i = 0; i < ships; i++) m.ships.push(ship());
  for (let i = 0; i < floats; i++) m.floats.push(['f' + i, r(-9000, 9000), 0.2, r(-9000, 9000)]);
  for (let i = 0; i < shots; i++) m.shots.push(['arrow', r(-9000, 9000), 2, r(-9000, 9000)]);
  m.rb = ['docked', 1, 2, 0.1, 0, [], null];
  if (full) { m.en = Array.from({ length: en }, (_, i) => enemy(i)); m.bo = null; m.an = Array.from({ length: an }, (_, i) => animal(i)); m.mf = []; m.time = [12.5, 'acik', 1.2, 3, [['acik', 14.0], ['yagmur', 20.0]], 0.1]; m.wfx = []; m.we = { ice: [], wisp: null, met: null, vol: null, pl: 0 }; m.ch = []; }
  return JSON.stringify(m).length;
}
for (const c of [{ en: 0, an: 10 }, { en: 20, an: 30 }, { en: 40, an: 60, shots: 10, floats: 5, ships: 2 }]) {
  const full = snap({ ...c, full: true }), light = snap({ ...c, full: false });
  const perSec = (full + light) * 7.5; // 15 Hz: yarısı tam, yarısı hafif
  console.log(JSON.stringify({ ...c, fullBytes: full, lightBytes: light, perGuestKBps: +(perSec / 1024).toFixed(1), hostUpload3GuestsKbit: Math.round(perSec * 3 * 8 / 1000) }));
}
