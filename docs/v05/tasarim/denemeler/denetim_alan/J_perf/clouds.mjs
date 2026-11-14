import * as THREE from '/home/user/SON-HAZ-NE-w2/vendor/three/three.module.js';
import { rng } from '/home/user/SON-HAZ-NE-w2/js/core/util.js';
let tot = 0;
for (let v = 0; v < 3; v++) { const r = rng(100 + v * 7); const n = 7 + Math.floor(r() * 5); const tris = n * new THREE.IcosahedronGeometry(1, 2).toNonIndexed().attributes.position.count / 3; tot += tris * 30; console.log('bulut seti', v, 'puf', n, 'üçgen/bulut', tris); }
console.log('tam kapalı gök (3×30 örnek) toplam üçgen:', tot);
// orman ağacı (props.jungleTreeGeometry tohum 7)
const r = rng(7); r(); const blobs = 4 + Math.floor(r() * 3);
const trunk = new THREE.CylinderGeometry(0.28, 0.55, 8, 7, 3); const tt = trunk.index.count / 3;
console.log('orman ağacı: gövde', tt, 'üçgen + taç', blobs, '× 80 =', tt + blobs * 80, 'üçgen');
