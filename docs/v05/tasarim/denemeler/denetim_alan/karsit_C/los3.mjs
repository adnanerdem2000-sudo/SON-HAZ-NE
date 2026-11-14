import { physics as P4 } from './v04/physics.js';
const P=P4; P.clear(); P.platList=[];
P.addBox(9000, 9000, 2, 2, 0, -50, 100, 'u');
console.log('v04 kose-kose kutu t≈0.96 blocked', P.lineBlocked(-9750, 5, -9750, 9710, 5, 9710));
P.removeTag('u');
// 4096 adım sınırına ulaşan doğru var mı? Δi+Δj = (19460/16)*2
console.log('DDA adim ~', Math.ceil(19460/16)*2);
