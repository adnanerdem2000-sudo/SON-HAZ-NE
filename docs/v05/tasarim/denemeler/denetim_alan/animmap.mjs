import fs from 'fs';
const src = fs.readFileSync('/home/user/SON-HAZ-NE-w2/js/core/kk.js', 'utf8');
const m = src.match(/export const ANIM_MAP = (\{[\s\S]*?\n\});/);
const ANIM_MAP = eval('(' + m[1] + ')');
const buf = fs.readFileSync('/home/user/SON-HAZ-NE-w2/assets/models/kk/kk_anims.glb');
const json = JSON.parse(buf.slice(20, 20 + buf.readUInt32LE(12)).toString('utf8'));
const names = new Set(json.animations.map(a => a.name));
const missing = Object.entries(ANIM_MAP).filter(([k, v]) => !names.has(v));
console.log('ANIM_MAP entries:', Object.keys(ANIM_MAP).length, 'missing:', JSON.stringify(missing));
// names used by player code
const used = new Set();
for (const f of ['js/player/player.js','js/game/combat.js','js/player/character.js','js/game/fishing.js','js/treasure/treasure.js','js/net/net.js','js/net/remote.js']) {
  try { const s = fs.readFileSync('/home/user/SON-HAZ-NE-w2/'+f,'utf8'); for (const mm of s.matchAll(/(?:play|playUpper|_wantAnim|_wantUpper|pick|full|up)\('([A-Za-z_0-9]+)'/g)) used.add(mm[1]); } catch(e) {}
}
const unresolved = [...used].filter(n => !(ANIM_MAP[n] && names.has(ANIM_MAP[n])) && !names.has(n));
console.log('used names:', [...used].sort().join(','));
console.log('unresolved:', unresolved);
