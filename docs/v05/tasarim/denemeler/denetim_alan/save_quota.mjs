// Salt-okur deneme: kota dolunca importAll ve write davranışı
const QUOTA = 3000;
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
const mk = (name, pad) => ({ version: 1, name, savedAt: Date.now(), player: { inv: { stacks: [], gold: 1 } }, pad: 'x'.repeat(pad) });
const out = {};
// mevcut iki yuva
save.write('solo', 0, mk('A-eski', 300)); save.write('solo', 0, mk('A', 300));
save.write('solo', 1, mk('B', 300));
out.before = save.list('solo').map((s) => s.name || 'boş');
// içe aktarma dosyası: 0 ve 1 yuvaları büyük kayıtlarla (kota aşılır)
const file = JSON.stringify({ 'dksh.solo.0': JSON.stringify(mk('A-ithal', 900)), 'dksh.solo.1': JSON.stringify(mk('B-ithal', 1500)), 'dksh.solo.2': JSON.stringify(mk('C-ithal', 900)) });
try { out.importReturn = save.importAll(file); } catch (e) { out.importReturn = 'İSTİSNA: ' + e.name; }
out.after = save.list('solo').map((s) => s.name || 'boş');
// kota dolu iken write: .tmp kalıntısı
const w = save.write('solo', 0, mk('A-yeni', 1200));
out.writeOk = w;
out.keys = [...localStorage.m.keys()];
console.log(JSON.stringify(out, null, 1));
