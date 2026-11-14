// Hakem: birleştirilmiş tasarımın yeni yerleşimleri — yükseklik ve 6 m içindeki fark
const geo = await import('/home/user/SON-HAZ-NE-w2/js/world/geo.js');
const A = await import('/home/user/SON-HAZ-NE-w2/js/world/archipelago.js');
const feat = (id) => { for (const I of A.EXTRA_ISLANDS) for (const f of I.features) if (f.id === id) return f; };
const town = feat('korsan_kasabasi_ruined_town_0'), gy2 = feat('korsan_mezarligi_graveyard_1'), gy1 = feat('korsan_mezarligi_graveyard_0'), pri = feat('demirkapi_prison_0'), ruin = feat('kizil_kanyon_ruin_0'), mine = feat('gumus_madeni_mine_0');
console.log('town', town.x, town.z, town.r, '| gy1', gy1.x, gy1.z, '| gy2', gy2.x, gy2.z, '| prison', pri.x, pri.z, pri.r, '| kanyon ruin', ruin.x, ruin.z, '| gümüş maden', mine.x, mine.z);
const at = (k, x, z) => { let lo = Infinity, hi = -Infinity; for (let a = 0; a < 16; a++) for (const r of [2, 4, 6]) { const h = geo.computeHeight(x + Math.cos(a / 16 * 6.283) * r, z + Math.sin(a / 16 * 6.283) * r); lo = Math.min(lo, h); hi = Math.max(hi, h); } console.log(k.padEnd(46), geo.computeHeight(x, z).toFixed(1).padStart(6), ' 6 m:', lo.toFixed(1), '…', hi.toFixed(1)); };
// Mira'nın evi: kasaba merkezinden 50 m (A'nın yönü)
{ const dx = -1760 - town.x, dz = 1460 - town.z, L = Math.hypot(dx, dz); const x = town.x + dx / L * 50, z = town.z + dz / L * 50; at(`Mira evi 50 m (${x.toFixed(0)},${z.toFixed(0)})`, x, z); console.log('  A konumunun merkeze uzaklığı', L.toFixed(1)); }
at('B defter kazısı (-1796,1448)', -1796, 1448); console.log('  merkeze', Math.hypot(-1796 - town.x, 1448 - town.z).toFixed(1));
// Halil ritüeli: mezarlık-2'den ada merkezine doğru 28 m
{ const I = { x: -6800, z: -6400 }; const dx = I.x - gy2.x, dz = I.z - gy2.z, L = Math.hypot(dx, dz); const x = gy2.x + dx / L * 28, z = gy2.z + dz / L * 28; at(`Halil ritüeli 28 m (${x.toFixed(0)},${z.toFixed(0)})`, x, z); }
at('Sare (-6525,-6368)', -6525, -6368);
at('A Kule Zindanı (-6683,2573)', -6683, 2573); console.log('  hapishane merkezine', Math.hypot(-6683 - pri.x, 2573 - pri.z).toFixed(1), '(köşe kuleleri 37,5 m)');
at('B Zindan Kulesi (-6684,2517)', -6684, 2517); console.log('  hapishane merkezine', Math.hypot(-6684 - pri.x, 2517 - pri.z).toFixed(1));
at('B Güneş Taşı (-5124,3947)', -5124, 3947); console.log('  harabe merkezine', Math.hypot(-5124 - ruin.x, 3947 - ruin.z).toFixed(1));
at('B maden ağzı (-7546,-1566)', -7546, -1566);
