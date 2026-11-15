// B2 hızlı Node denetimi (A-18): save.js depo engelliyken istisna atmaz; depo varken davranış aynı.
import { pathToFileURL } from 'node:url';
const kok = process.argv[2] || '/home/user/SON-HAZ-NE-b2';
let n = 0, k = 0; const ok = (ad, v) => { n++; if (v) k++; console.log((v ? 'GECTI ' : 'KALDI ') + ad); };
const engelli = {}; Object.defineProperty(engelli, 'localStorage', { get() { const e = new Error("Failed to read the 'localStorage' property from 'Window': Access is denied"); e.name = 'SecurityError'; throw e; } });
globalThis.window = engelli;
const errs = []; const ce = console.error; console.error = (...a) => { errs.push(a.map(String).join(' ')); };
const { save } = await import(pathToFileURL(kok + '/js/core/save.js').href + '?engelli');
const dene = (f) => { try { return { v: f() }; } catch (e) { return { hata: e.name + ': ' + e.message }; } };
const r = {
  available: dene(() => save.available()), profile: dene(() => save.profile()), read: dene(() => save.read('solo', 0)),
  list: dene(() => save.list('solo')), latest: dene(() => save.latest()), write: dene(() => save.write('solo', 0, { player: { inv: {} } })),
  remove: dene(() => save.remove('solo', 0)), writeProfile: dene(() => save.writeProfile({ a: 1 })), exportAll: dene(() => save.exportAll()), importAll: dene(() => save.importAll('{"dksh.x":"1"}')),
};
console.error = ce;
console.log(JSON.stringify(r));
ok('D01 engelli: hiçbir çağrı istisna atmıyor', Object.values(r).every((x) => !x.hata));
ok('D02 engelli: available false', r.available.v === false);
ok('D03 engelli: profile/read/latest null', r.profile.v === null && r.read.v === null && r.latest.v === null);
ok('D04 engelli: list 3 boş yuva', Array.isArray(r.list.v) && r.list.v.length === 3 && r.list.v.every((s) => s.empty));
ok('D05 engelli: write false, importAll false, exportAll {}', r.write.v === false && r.importAll.v === false && r.exportAll.v === '{}');
ok('D06 engelli: console.error yok', errs.length === 0);
// normal depo (bellek içi)
const m = new Map(); const ls = { getItem: (x) => (m.has(x) ? m.get(x) : null), setItem: (x, v) => m.set(x, String(v)), removeItem: (x) => m.delete(x), key: (i) => [...m.keys()][i] ?? null, get length() { return m.size; } };
globalThis.window = { localStorage: ls };
const d = { name: 'A', savedAt: 5, player: { inv: { gold: 7 } }, version: 1 };
ok('N01 normal: available true', save.available() === true);
ok('N02 normal: write true + read aynı', save.write('solo', 1, d) === true && JSON.stringify(save.read('solo', 1)) === JSON.stringify(d));
ok('N03 normal: ikinci yazımda .bak tutulur', save.write('solo', 1, { ...d, savedAt: 6 }) && JSON.parse(m.get('dksh.solo.1.bak')).savedAt === 5);
ok('N04 normal: latest/list', save.latest().slot === 1 && save.list('solo')[1].name === 'A');
m.set('dksh.solo.1', '{bozuk'); ok('N05 normal: bozuk asıl kayıtta yedek okunur', save.read('solo', 1).savedAt === 5);
save.writeProfile({ appearance: { name: 'X' } }); ok('N06 normal: profil', save.profile().appearance.name === 'X');
const ex = save.exportAll(); m.clear(); ok('N07 normal: dışa/içe aktarma', save.importAll(ex) === true && save.profile().appearance.name === 'X');
save.remove('solo', 1); ok('N08 normal: remove', save.read('solo', 1) === null);
// kota dolu: setItem atar → write false + console.error (gerçek hata, çağıran 'Kayıt başarısız' der)
const errs2 = []; console.error = (...a) => errs2.push(a.join(' ')); ls.setItem = () => { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; };
const w = save.write('solo', 2, d); console.error = ce;
ok('N09 kota dolu: write false, console.error 1 (gerçek yazma hatası görünür kalır)', w === false && errs2.length === 1);
console.log(`SONUC: ${k}/${n}`); process.exit(k === n ? 0 : 1);
