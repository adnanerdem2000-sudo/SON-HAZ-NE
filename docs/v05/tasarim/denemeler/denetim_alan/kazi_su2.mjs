const W = '/home/user/SON-HAZ-NE-w2/js/world/';
const geo = await import(W + 'geo.js');
const D = await import(W + 'worldData.js');
for (const s of D.DIG_SITES) { const h = geo.computeHeight(s.x, s.z); if (h >= (s.tide ? -0.6 : 0.2)) continue; let best = 1e9; for (let r = 0.25; r <= 40 && best > 1e8; r += 0.25) for (let a = 0; a < 6.283; a += 0.05) { if (geo.computeHeight(s.x + Math.cos(a) * r, s.z + Math.sin(a) * r) >= 0.2) { best = r; break; } } console.log(s.id, 'h', h.toFixed(2), 'en yakin kuru zemin', best > 1e8 ? '>40' : best.toFixed(2) + ' m', best <= 3.7 ? '(kiyidan kazilabilir: oyuncu 0,9 m onunu kazar, 2,8 m tolerans)' : '(KAZILAMAZ)'); }
