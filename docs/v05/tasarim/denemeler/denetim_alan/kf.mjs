const W = await import('/home/user/SON-HAZ-NE-w2/js/world/worldData.js');
const I = W.ISLANDS.find(i => i.id === 'kuzeyfener'); const f = I.features[0]; const s = W.DIG_SITES.find(x => x.id === 'kuzeyfener_kazi_0');
const ang = Math.atan2(s.z - f.z, s.x - f.x); const norm = (a) => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
const wm = norm(f.angle + Math.PI + 1.2), tw = norm(f.angle + Math.PI - 1.1);
console.log('port', f.x, f.z, 'angle', f.angle, 'site ang', norm(ang).toFixed(2), 'd', Math.hypot(s.x - f.x, s.z - f.z).toFixed(1), 'windmill ang', wm.toFixed(2), 'tower ang', tw.toFixed(2));
for (const [n, a] of [['windmill', wm], ['tower', tw]]) { const bx = f.x + Math.cos(a) * 52, bz = f.z + Math.sin(a) * 52; console.log(n, 'mesafe', Math.hypot(s.x - bx, s.z - bz).toFixed(1)); }
