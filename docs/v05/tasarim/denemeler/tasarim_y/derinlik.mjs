const G = await import('/home/user/SON-HAZ-NE-w2/js/world/geo.js');
// verilen merkezden belirli yönlerde, hedef derinliğe en yakın nokta
const find = (name, cx, cz, target, dirs) => { for (const deg of dirs) { const a = deg * Math.PI / 180; let best = null; for (let d = 50; d < 900; d += 5) { const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; const h = G.computeHeight(x, z); if (best === null || Math.abs(h - target) < Math.abs(best[2] - target)) best = [Math.round(x), Math.round(z), +h.toFixed(1), d]; } console.log(name, deg + '°', JSON.stringify(best)); } };
find('sis_adasi', -5300, -7900, -10, [180, 200, 220]);
find('derin_yarik', 1300, -8500, -4, [90, 270, 0]);
find('yitik_ufuk_yakin(sığ değil, açık deniz)', 300, -2100, -28, [180]);
