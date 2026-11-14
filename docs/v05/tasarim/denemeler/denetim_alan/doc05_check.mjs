// docs/05 denge tablosunu ENEMY_TYPES ile karşılaştırır (salt-okur; enemies.js metninden değer ayrıştırma)
import fs from 'fs';
const src = fs.readFileSync('/home/user/SON-HAZ-NE-w2/js/game/enemies.js', 'utf8');
const doc = fs.readFileSync('/home/user/SON-HAZ-NE-w2/docs/05_DUSMAN_DENGE_TABLOSU.md', 'utf8');
const a = src.indexOf('export const ENEMY_TYPES = {'), b = src.indexOf('export function enemyType');
const block = src.slice(a, b);
const keys = [...block.matchAll(/^  ([a-z_]+): \{\s*$/gm)].map((m) => m[1]);
const T = {};
for (const k of keys) {
  const i = block.indexOf('  ' + k + ': {'); const seg = block.slice(i, block.indexOf('\n  },', i));
  const g = (re) => { const m = seg.match(re); return m ? +m[1] : null; };
  T[k] = { name: seg.match(/name: '([^']+)'/)[1], hp: g(/hp: ([\d.]+)/), dmg: g(/dmg: ([\d.]+)/), speed: g(/speed: ([\d.]+)/), range: g(/range: ([\d.]+)/), vision: g(/vision: ([\d.]+)/), fov: g(/fov: ([\d.]+)/), hearing: g(/hearing: ([\d.]+)/), morale: g(/morale: ([\d.]+)/), xp: g(/xp: ([\d.]+)/) };
}
const rows = doc.split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| Düşman') && !l.startsWith('|---') && /\d/.test(l) && l.split('|').length > 10);
let bad = 0;
for (const r of rows) {
  const c = r.split('|').map((s) => s.trim()).slice(1, -1);
  const t = Object.values(T).find((x) => x.name === c[0]);
  if (!t) { console.log('belgede var, kodda yok:', c[0]); bad++; continue; }
  const num = (s) => (s === '—' ? null : parseFloat(s.replace('°', '')));
  const cmp = [['hp', 1], ['dmg', 2], ['speed', 3], ['range', 4], ['vision', 5], ['fov', 6], ['hearing', 7], ['morale', 8], ['xp', 9]];
  for (const [f, i] of cmp) { const dv = num(c[i]); const cv = t[f]; if (!(dv === cv || (dv === null && cv === null))) { console.log('fark', c[0], f, 'belge', dv, 'kod', cv); bad++; } }
}
console.log('satır', rows.length, 'fark', bad);
