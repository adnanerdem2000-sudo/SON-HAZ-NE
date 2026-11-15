// Tanı: KY19 (askıdaki işçi + prepare timeout 400) zaman çizelgesi
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const KOK = process.argv[2] || '/home/user/SON-HAZ-NE-b1';
const THREE_URL = pathToFileURL(path.join(KOK, 'vendor', 'three', 'three.module.js')).href;
registerHooks({ resolve(spec, ctx, next) { if (spec === 'three') return { url: THREE_URL, shortCircuit: true }; return next(spec, ctx); } });
Object.defineProperty(globalThis, 'navigator', { value: { hardwareConcurrency: 4 }, configurable: true, writable: true });
const t0 = performance.now(); const ms = () => Math.round(performance.now() - t0);
const log = (...a) => process.stdout.write(`[${ms()}] ` + a.join(' ') + '\n');
console.warn = (...a) => log('W', ...a); console.info = (...a) => log('I', ...a);
class Sahte { constructor(url, o) { this.olu = false; this.onmessage = null; setTimeout(() => { log('ready', o.name); this.onmessage && this.onmessage({ data: { t: 'ready' } }); }, 3); }
  postMessage(m) { log('post', m.t, m.key ?? '', m.seg ?? m.res); } terminate() { this.olu = true; } }
globalThis.Worker = Sahte;
const THREE = await import('three');
const { terrain: T } = await import(pathToFileURL(path.join(KOK, 'js/world/terrain.js')).href);
T.init(new THREE.Scene(), 'high');
const o = T._localSlice; let n = 0;
T._localSlice = function () { const s = performance.now(); const q = this._queue.length; const p = this._yerelAktif(); const r = o.apply(this, arguments); n++; if (n < 30 || n % 20 === 0) log('dilim', n, 'paralel', p, 'q', q, '→', this._queue.length, 'şerit', this._lanes.map((a) => a && a.job.msg.t), (performance.now() - s).toFixed(1) + 'ms'); return r; };
const r = await T.prepare(160, 470, { radius: 300, timeout: 400 });
log('prepare →', r, 'jobs', T._jobs.size, 'q', T._queue.length);
process.exit(0);
