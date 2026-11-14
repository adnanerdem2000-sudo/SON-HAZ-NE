const W = '/home/user/SON-HAZ-NE-w2/js/world/';
const A = await import(W + 'archipelago.js');
const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const CH = new Set(['ruin','graveyard','mine','ruined_town','beach_wreck','sunken_city','temple']);
const none = [], cnt = { sandik: 0 };
for (const I of A.EXTRA_ISLANDS) { let n = 0; for (const f of I.features) { if (CH.has(f.type)) n += f.type === 'sunken_city' ? 4 : 1; if (f.type === 'ruin' && hashStr(f.id) % 10 < 6) n += 0; } cnt.sandik += n; if (!n) none.push(I.id + '(' + I.features.map(f => f.type).join('+') + ')'); }
console.log('sabit sandik toplami', cnt.sandik, '| sandiksiz ada', none.length, none.join(', '));
const quests = 0; console.log('bulmacasiz/gorevsiz ada sayisi (tapinak/bulmaca adayi olmayan):', A.EXTRA_ISLANDS.filter(I => !I.features.some(f => f.type === 'temple' || (f.type === 'ruin' && hashStr(f.id) % 10 < 6))).length, '/', A.EXTRA_ISLANDS.length);
