// Salt-okur deneme: js/core/save.js davranışı (sahte localStorage ile)
const QUOTA = Number(process.env.QUOTA || 1e9);
class LS {
  constructor() { this.m = new Map(); }
  get length() { return this.m.size; }
  key(i) { return [...this.m.keys()][i] ?? null; }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) {
    v = String(v);
    let used = 0; for (const [kk, vv] of this.m) if (kk !== k) used += kk.length + vv.length;
    if (used + k.length + v.length > QUOTA) { const e = new Error('QuotaExceededError'); e.name = 'QuotaExceededError'; throw e; }
    this.m.set(k, v);
  }
  removeItem(k) { this.m.delete(k); }
}
globalThis.localStorage = new LS();
const { save } = await import(process.argv[2]);
const out = {};
// 1) gelecekteki sürüm kabul ediliyor mu?
localStorage.setItem('dksh.solo.0', JSON.stringify({ version: 999, name: 'gelecek', savedAt: 5, player: { inv: { stacks: [], gold: 1 } } }));
out.futureVersionRead = save.read('solo', 0)?.version ?? null;
// 2) içe aktarma: dize olmayan değer
localStorage.setItem('dksh.solo.1', JSON.stringify({ version: 1, name: 'eski', savedAt: 1, player: { inv: { stacks: [], gold: 10 } } }));
const r2 = save.importAll(JSON.stringify({ 'dksh.solo.1': { version: 1, name: 'nesne', player: { inv: {} } } }));
out.importObjectValue = { returned: r2, stored: localStorage.getItem('dksh.solo.1'), read: save.read('solo', 1) };
// 3) içe aktarma: tanınan anahtar yok ama 'başarılı'
out.importNoKeys = save.importAll(JSON.stringify({ foo: 1 }));
// 4) içe aktarma: dksh dışı ama dksh.settings ezilir mi
localStorage.setItem('dksh.settings', '{"quality":"high"}');
save.importAll(JSON.stringify({ 'dksh.settings': 'bozuk-json' }));
out.settingsAfterImport = localStorage.getItem('dksh.settings');
// 5) write(): döngüsel veri try dışında mı?
const circ = { player: { inv: {} } }; circ.self = circ;
try { save.write('solo', 2, circ); out.circularWrite = 'hata yakalandı (false döndü)'; } catch (e) { out.circularWrite = 'YAKALANMADI: ' + e.constructor.name; }
console.log(JSON.stringify(out, null, 1));
