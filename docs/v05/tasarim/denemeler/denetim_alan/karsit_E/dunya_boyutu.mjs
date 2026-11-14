// Geç katılımda gönderilen 'world' iletisinin (net.js:510-522) ağır ama olası bir kayıtta boyutu ≈ ?
const enc = new TextEncoder(); const B = (m) => enc.encode(JSON.stringify(m)).byteLength; const MTU = 16300;
const contents = [['altin_para', 512], ['yakut', 2], ['zumrut', 1], ['altin_kulce', 1], ['eski_mucevher', 1], ['hazine_haritasi', 1, { site: null }]];
const holdChest = (i) => ({ id: 'ch_' + i.toString(36) + 'k3j9x', tier: 'medium', contents, weight: 35, siteId: null });
const ship = { id: 'ship_main', typeId: 'brigantine', name: 'Kara İnci', look: { hull: '#3a2418', stripe: '#7a1f1f', sail: '#efe6d0', flag: 'kraken', sailStripe: '#a33a2a' }, upg: { hull: 3, sails: 2, cannons: 3 },
  x: 1234.56, z: -987.65, yaw: 1.234, hp: 210, water: 3, holes: [], hold: { items: { tahta: 12, gulle: 40, ekmek: 8, muz: 6, baharat: 3 }, chests: Array.from({ length: 16 }, (_, i) => holdChest(i)) },
  cannonballs: 60, planks: 12, sailTarget: 1, parts: { pruva: 100, kic: 100, iskele: 100, sancak: 100, dumen: 100, yelken: 100 }, mastHp: [100, 100], cannonHp: Array(8).fill(100), anchorState: 'down', sunk: false };
const chestNet = (i) => ({ id: 'ch_w' + i, tier: 'small', pos: [100.12 + i, 2.31, -50.4], state: 'ground', carriers: [], contents, siteId: 'ada_' + i });
const pk = (i) => ({ id: 'pk_' + i, pos: [10.1 + i, 1.2, 33.3], items: [['altin_para', 37], ['mermi', 1], ['ekmek', 1]], from: 'Haydut Nişancı', keep: false, ship: null, local: null, t: 120 });
const markers = Array.from({ length: 60 }, (_, i) => ({ x: 1000.5 + i, z: -200.25 - i, by: 'Kaptan Derya', note: 'Buraya dön: mağara girişi ve sandık ' + i, color: '#c0392b' }));
const flags = Object.fromEntries(Array.from({ length: 40 }, (_, i) => ['bayrak_ornek_' + i, true]));
const world = (nCh, nPk, nMk) => ({ t: 'world', ship, chests: Array.from({ length: nCh }, (_, i) => chestNet(i)), pickups: Array.from({ length: nPk }, (_, i) => pk(i)), quests: { stage: 4, flags, markers: markers.slice(0, nMk) }, time: { hour: 13.2, weather: 'acik', wind: 1.1 }, rowboat: { state: 'docked', x: 1, z: 2, yaw: 0 } });
for (const [c, p, m] of [[0, 0, 0], [4, 10, 20], [8, 20, 60], [16, 40, 60]]) { const n = B(world(c, p, m)); console.log(`sandık ${c}, kese ${p}, işaret ${m} → ${n} bayt ${n >= MTU ? '≥ 16300: GÖNDERİLEMEZ → error → _dropPeer' : '< 16300'}`); }
console.log('yalnız gemi (dolu brigantine ambarı, shipFull/hold yayını):', B({ t: 'shipFull', ship }), 'bayt');
