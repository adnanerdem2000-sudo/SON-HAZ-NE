const W = '/home/user/SON-HAZ-NE-w2/js/world/';
const A = await import(W + 'archipelago.js');
const D = await import(W + 'worldData.js');
const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
let ruins = 0, puz = 0; const list = [];
for (const I of A.EXTRA_ISLANDS) for (const f of I.features) if (f.type === 'ruin') { ruins++; const ok = (hashStr(f.id) % 10) < 6; if (ok) puz++; list.push(f.id + (ok ? ' [bulmaca]' : '')); }
console.log('harabe', ruins, 'bulmaca adayi', puz);
console.log(list.join('\n'));
const geyserIsl = A.EXTRA_ISLANDS.filter(I => I.shape === 'volcano' || I.biome === 'volkan' && I.r > 150).map(I => I.id + ':' + (I.shape||'normal') + ':' + I.r);
console.log('gayzer adalari', geyserIsl.length, geyserIsl.join(', '));
console.log('FISH_ZONES', D.FISH_ZONES.length, 'POIS', D.POIS.length, 'core POIS', D.CORE_POIS.length, 'extra POIS', A.EXTRA_POIS.length, 'WRECKS', D.WRECKS.length);
const chestFeat = {}; for (const I of A.EXTRA_ISLANDS) for (const f of I.features) { if (['ruin','graveyard','mine','ruined_town','beach_wreck','sunken_city','temple'].includes(f.type)) chestFeat[f.type] = (chestFeat[f.type]||0) + (f.type==='sunken_city'?4:1); }
console.log('sandikli ozellik', JSON.stringify(chestFeat));
// enemy groups
let groups = 0, nightOnly = 0; for (const I of A.EXTRA_ISLANDS) for (const f of I.features) { if (f.enemies || f.night) { groups++; if (!(f.enemies||[]).length) nightOnly++; } }
console.log('dusman grubu', groups);
// enemies per type of feature
const enemyTypes = {}; for (const I of A.EXTRA_ISLANDS) for (const f of I.features) if (f.enemies) { const k = I.region + ':' + f.type; enemyTypes[k] = enemyTypes[k] || new Set(); for (const e of f.enemies) enemyTypes[k].add(e); for (const e of (f.night||[])) enemyTypes[k].add('gece:'+e); }
for (const [k,v] of Object.entries(enemyTypes)) console.log(k, [...v].join(','));
