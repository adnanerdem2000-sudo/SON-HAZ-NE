import { SPAWN_ZONES } from '/home/user/SON-HAZ-NE-w2/js/world/worldData.js';
const sp = { x: 2, z: 202 }; // yeni oyun doğma noktası yaklaşık (port.boardingPoint.x-8, shoreZ-20)
let tot = 0;
for (const k in SPAWN_ZONES) for (const z of SPAWN_ZONES[k]) { const d = Math.hypot(z.x - sp.x, z.z - sp.z); const act = d < z.r + 150; if (act) tot += z.n; console.log(k.padEnd(7), JSON.stringify(z).padEnd(52), 'uzaklık', d.toFixed(0), act ? 'ETKİN' : '-'); }
console.log('limanda etkin hayvan (çekirdek bölgeler):', tot);
