// ANIM_MAP değerlerinin kk_anims.glb'de varlığı (bağımsız ayrıştırma)
const fs = require('fs');
const src = fs.readFileSync('/home/user/SON-HAZ-NE-w2/js/core/kk.js', 'utf8');
const body = src.slice(src.indexOf('export const ANIM_MAP = {') + 'export const ANIM_MAP = '.length, src.indexOf('};', src.indexOf('export const ANIM_MAP')) + 1);
const pairs = [...body.matchAll(/([A-Za-z0-9_]+)\s*:\s*'([^']+)'/g)].map((m) => [m[1], m[2]]);
const buf = fs.readFileSync('/home/user/SON-HAZ-NE-w2/assets/models/kk/kk_anims.glb');
const json = JSON.parse(buf.slice(20, 20 + buf.readUInt32LE(12)).toString('utf8'));
const names = new Set(json.animations.map((a) => a.name));
const keys = new Set(pairs.map((p) => p[0]));
console.log('ANIM_MAP girişi:', pairs.length, 'tekil anahtar:', keys.size, 'tekil hedef klip:', new Set(pairs.map((p) => p[1])).size, 'GLB klip sayısı:', names.size);
console.log('eksik:', pairs.filter(([k, v]) => !names.has(v)));
// oyunda kullanılan mantıksal adlar (play/playUpper/_wantAnim/pick/full/up çağrıları) ve çözülemeyenler
const used = new Map();
const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = d + '/' + f; if (fs.statSync(p).isDirectory()) walk(p); else if (p.endsWith('.js')) { const s = fs.readFileSync(p, 'utf8'); for (const m of s.matchAll(/(?:\.play|playUpper|_wantAnim|\bpick|\bfull|\bup)\(\s*'([A-Za-z_0-9]+)'/g)) used.set(m[1], (used.get(m[1]) || '') + ' ' + p.replace('/home/user/SON-HAZ-NE-w2/', '')); } } };
walk('/home/user/SON-HAZ-NE-w2/js');
const map = Object.fromEntries(pairs);
const bad = [...used.keys()].filter((n) => !(map[n] && names.has(map[n])) && !names.has(n));
console.log('kullanılan ad sayısı:', used.size, 'çözülemeyen:', bad.map((b) => b + ' <-' + used.get(b)));
