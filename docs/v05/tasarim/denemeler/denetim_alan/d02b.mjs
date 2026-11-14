// 07_dunya_kesif D02b'nin analitik (computeHeight) kopyası: 1 mm inceltmede >0,3 m süreksizlik sayısı (tüm 67 ada, 16 ışın)
const W = '/home/user/SON-HAZ-NE-w2/js/world/';
const geo = await import(W + 'geo.js');
const A = await import(W + 'archipelago.js');
let total = 0; const by = {};
for (const I of A.EXTRA_ISLANDS) { const sh = I.shape || 'normal'; for (let k = 0; k < 16; k++) { const a = k / 16 * 6.2832; const P = (d) => geo.computeHeight(I.x + Math.cos(a) * d * (I.ex || 1), I.z + Math.sin(a) * d * (I.ez || 1)); let p = null, pd = 0; for (let d = 0.3 * I.r; d < 1.6 * I.r; d += 0.25) { const h = P(d); if (p !== null && Math.abs(h - p) > 0.4) { let lo = pd, hi = d, hl = p, hh = h; for (let it = 0; it < 8; it++) { const m = (lo + hi) / 2, hm = P(m); if (Math.abs(hm - hl) > Math.abs(hh - hm)) { hi = m; hh = hm; } else { lo = m; hl = hm; } } if (Math.abs(hh - hl) > 0.3) { total++; by[sh] = (by[sh] || 0) + 1; } } p = h; pd = d; } } }
console.log('D02b analitik sureksizlik', total, JSON.stringify(by));
// çekirdek adalar da (testin kapsamadığı)
let core = 0; const D = await import(W + 'worldData.js');
for (const I of D.CORE_ISLANDS) for (let k = 0; k < 16; k++) { const a = k / 16 * 6.2832; const P = (d) => geo.computeHeight(I.x + Math.cos(a) * d, I.z + Math.sin(a) * d); let p = null, pd = 0; for (let d = 0.3 * I.r; d < 1.6 * I.r; d += 0.25) { const h = P(d); if (p !== null && Math.abs(h - p) > 0.4) { let lo = pd, hi = d, hl = p, hh = h; for (let it = 0; it < 8; it++) { const m = (lo + hi) / 2, hm = P(m); if (Math.abs(hm - hl) > Math.abs(hh - hm)) { hi = m; hh = hm; } else { lo = m; hl = hm; } } if (Math.abs(hh - hl) > 0.3) { core++; console.log('cekirdek sureksizlik', I.id, k, lo.toFixed(1), hl.toFixed(2), hh.toFixed(2)); } } p = h; pd = d; } }
console.log('cekirdek toplam', core);
