// Salt-okur karşıt deneme: save.importAll / read davranışı (sahte localStorage)
const QUOTA = Number(process.env.QUOTA || 1e9);
class LS {
  constructor() { this.m = new Map(); }
  get length() { return this.m.size; }
  key(i) { return [...this.m.keys()][i] ?? null; }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { v = String(v); let used = 0; for (const [kk, vv] of this.m) if (kk !== k) used += kk.length + vv.length; if (used + k.length + v.length > QUOTA) { const e = new Error('QuotaExceededError'); e.name = 'QuotaExceededError'; throw e; } this.m.set(k, v); }
  removeItem(k) { this.m.delete(k); }
}
globalThis.localStorage = new LS();
const { save } = await import(process.argv[2]);
const out = {};
const mk = (name, gold, t) => ({ version: 1, name, savedAt: t, player: { inv: { stacks: [], gold } } });
// A) iki kayıt yap → .bak oluşur; sonra ana anahtara nesne değerli içe aktarma
save.write('solo', 0, mk('ilk', 10, 1));
save.write('solo', 0, mk('ikinci', 20, 2));
out.A_before = { main: save.read('solo', 0)?.name, bak: JSON.parse(localStorage.getItem('dksh.solo.0.bak')).name };
const rA = save.importAll(JSON.stringify({ 'dksh.solo.0': { version: 1, name: 'nesne' } }));
out.A_after = { returned: rA, stored: localStorage.getItem('dksh.solo.0'), readName: save.read('solo', 0)?.name ?? null };
// B) dışa aktarım .bak anahtarlarını içeriyor mu?
out.B_exportKeys = Object.keys(JSON.parse(save.exportAll()));
// C) eski dışa aktarım (ilk durum) içe aktarılınca .bak da eziliyor mu?
globalThis.localStorage = new LS();
save.write('solo', 1, mk('eski', 100, 1));
save.write('solo', 1, mk('eski2', 150, 2));
const oldExport = save.exportAll();
save.write('solo', 1, mk('yeni', 9999, 3));
save.write('solo', 1, mk('yeni2', 12000, 4));
const rC = save.importAll(oldExport);
out.C = { returned: rC, main: save.read('solo', 1)?.name, bak: JSON.parse(localStorage.getItem('dksh.solo.1.bak') || 'null')?.name, yeniKurtarilabilir: [...localStorage.m.values()].some((v) => v.includes('yeni')) };
// D) tuhaf girdiler
out.D = { arr: save.importAll('[]'), num: save.importAll('5'), str: save.importAll('"abc"'), zero: save.importAll('0'), nul: save.importAll('null') };
// E) profil ilkel değer → main.js:83-85 benzetimi (katı kip)
globalThis.localStorage = new LS();
save.importAll(JSON.stringify({ 'dksh.profile': '5' }));
const prof = save.profile();
let boot = 'ok';
try { (function () { 'use strict'; const G = {}; G.profile = prof || { appearance: {}, unlocked: [], recentRooms: [] }; G.profile.appearance = { ...{ gender: 'm' }, ...(G.profile.appearance || {}) }; })(); } catch (e) { boot = e.constructor.name + ': ' + e.message; }
out.E_profilePrimitive = { prof, boot };
// F) sürüm 999 ve bilinmeyen alan → read kabul ediyor mu?
globalThis.localStorage = new LS();
localStorage.setItem('dksh.solo.2', JSON.stringify({ version: 999, name: 'gelecek', savedAt: 5, player: { inv: { stacks: [], gold: 1 } }, gelecekAlani: { a: 1 } }));
out.F = { read: save.read('solo', 2)?.version, list: save.list('solo')[2] };
console.log(JSON.stringify(out, null, 1));
