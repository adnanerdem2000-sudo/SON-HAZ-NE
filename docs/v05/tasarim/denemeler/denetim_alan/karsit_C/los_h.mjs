import { physics as P } from './v04/physics.js';
import { terrain } from './v04/terrain.js';
terrain.h = -10; P.clear(); P.platList = [];
// 8 m genişlikte, 4 m yüksek bina (y0=-2, y1=4), x: 16..24
P.addBox(20, 0, 4, 4, 0, -2, 4, 'b');
const enemyEye = [0, 13.6, 0], playerHead = [30, 1.4, 0];
console.log('düşman→oyuncu (yüksekten):', P.lineBlocked(...enemyEye, ...playerHead));
console.log('oyuncu→düşman (ters yön):', P.lineBlocked(...playerHead, ...enemyEye));
// mermi seçenekleriyle (PROJ_LOS)
console.log('düşman mermisi tek parça (PROJ_LOS):', P.lineBlocked(...enemyEye, ...playerHead, { tMin: 0, tMax: 1, rScale: 1 }));
// tMax 0.98: duvara yaslanan oyuncu
P.removeTag('b'); P.addBox(0, 0, 0.1, 3, 0, -2, 6, 'w'); // 0,2 m kalın çit x=-0.1..0.1
const pl = [0.1 + 0.33, 1.4, 0];
for (const d of [20, 26, 27, 30, 40]) console.log('çit arkasındaki oyuncuya', d, 'm: engel?', P.lineBlocked(-d + 0.43, 1.6, 0, ...pl));
