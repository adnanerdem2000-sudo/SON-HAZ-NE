import { physics } from './world/physics.js';
physics.addBox(2, 0, 2, 10, 0, -5, 10, 'building');
const opts = { tMin: 0.05, tMax: 0.98, rScale: 1 }; // combat.raycast ile aynı
console.log('dışarıdan (x=-0.4) duvar arkasına (x=6):', physics.lineBlocked(-0.4, 1.6, 0, 6, 1.6, -3, opts));
console.log('duvarın içinden (x=0.25) duvar arkasına (x=6):', physics.lineBlocked(0.25, 1.6, 0.4, 6, 1.6, -3, opts));
console.log('duvarın içinden (x=0.25) ince duvar örneği (x=3.9→6):', physics.lineBlocked(3.9, 1.6, 0.4, 6, 1.6, -3, opts));
