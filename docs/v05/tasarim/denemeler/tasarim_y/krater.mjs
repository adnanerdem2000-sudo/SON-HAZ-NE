const G = await import('/home/user/SON-HAZ-NE-w2/js/world/geo.js');
const cx = 7700, cz = -900, r = 540, a = 141 * Math.PI / 180;
const row = []; for (let f = 0.0; f <= 0.24; f += 0.02) row.push(`${f.toFixed(2)}:${G.computeHeight(cx + Math.cos(a) * f * r, cz + Math.sin(a) * f * r).toFixed(0)}`);
console.log('141° krater profili', row.join(' '));
const floor = G.computeHeight(cx, cz), rim = G.computeHeight(cx + r * 0.2, cz);
console.log('lav: taban', floor.toFixed(1), 'kenar', rim.toFixed(1), 'lav y', (floor + Math.max(1.2, (rim - floor) * 0.18)).toFixed(1), 'lav r', (r * 0.13).toFixed(0), 'Dev tetik r', (r * 0.24).toFixed(0));
