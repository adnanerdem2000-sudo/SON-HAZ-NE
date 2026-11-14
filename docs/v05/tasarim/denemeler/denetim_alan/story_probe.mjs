// Salt-okur deneme: hikâye verisini ve koordinatları kaynak dosyalardan okur (kod değiştirmez)
import fs from 'node:fs';
const root = process.argv[2];
const src = fs.readFileSync(root + '/js/game/quests.js', 'utf8');
const m = src.match(/export const STORY = (\[[\s\S]*?\n\]);/);
const STORY = eval(m[1]);
console.log('STORY uzunluğu', STORY.length, STORY.map((s) => s.id).join(','));
console.log('STORY[6] =', STORY[6]);
try { const s = STORY[6]; console.log(`Yeni görev: ${s.title}`); } catch (e) { console.log('advance(6) benzetimi hata:', e.message); }
const wd = await import(root + '/js/world/worldData.js');
const tiers = {}; for (const d of wd.DIG_SITES) tiers[d.tier] = (tiers[d.tier] || 0) + 1;
console.log('Kazı noktası sayısı', wd.DIG_SITES.length, 'kademeler', JSON.stringify(tiers));
console.log('ISLANDS', wd.ISLANDS.length, 'POIS', wd.POIS.length);
const kemik = wd.ISLANDS.find((i) => i.id === 'kemik');
console.log('Kemik r', kemik.r, '→ Morvan tetik 45 m, sıfırlama >200 m (ada yarıçapının', (200 / kemik.r).toFixed(2), 'katı)');
const kir = wd.ISLANDS.find((i) => i.id === 'kirlangic');
console.log('Kızıl kampı merkezden', Math.hypot(-40, -228).toFixed(0), 'm; Kırlangıç r', kir.r, '; liman→kamp', Math.hypot(10 + 40, 222 + 228).toFixed(0), 'm');
const ar = await import(root + '/js/world/archipelago.js');
console.log('REGIONS', Object.entries(ar.REGIONS).map(([k, v]) => k + '=' + v.name).join('; '));
