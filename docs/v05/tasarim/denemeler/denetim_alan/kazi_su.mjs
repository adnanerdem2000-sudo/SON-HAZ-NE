const W = '/home/user/SON-HAZ-NE-w2/js/world/';
const geo = await import(W + 'geo.js');
const D = await import(W + 'worldData.js');
const wet = [];
for (const s of D.DIG_SITES) { const h = geo.computeHeight(s.x, s.z); const lim = s.tide ? -0.6 : 0.2; if (h < lim) { const I = D.ISLANDS.find(i => i.id === s.island); wet.push(`${s.id} (${I.shape||'normal'}, r=${I.r}) h=${h.toFixed(2)} tier=${s.tier} lm=${s.landmarks.map(l=>l.type).join(',')}`); } }
console.log('islak kazi noktasi', wet.length, 'toplam', D.DIG_SITES.length); console.log(wet.join('\n'));
// landmark yükseklikleri (ipucu nesnesi su altında mı)
let lmWet = 0; for (const s of D.DIG_SITES) for (const L of s.landmarks) if (geo.computeHeight(L.x, L.z) < -0.3) lmWet++;
console.log('su altindaki ipucu nesnesi', lmWet);
// atol kazı noktalarının d/r dağılımı
for (const I of D.ISLANDS.filter(i => i.shape === 'atoll')) { const ds = D.DIG_SITES.filter(s => s.island === I.id).map(s => (Math.hypot(s.x - I.x, s.z - I.z) / I.r).toFixed(2)); console.log(I.id, 'd/r', ds.join(' ')); }
