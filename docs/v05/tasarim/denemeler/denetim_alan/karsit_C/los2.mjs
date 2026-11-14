import { physics as P3 } from './v03/physics.js';
import { physics as P4 } from './v04/physics.js';
for (const [n,P] of [['v03',P3],['v04',P4]]) {
  P.clear(); P.platList=[];
  const ax=15.99, az=15.99, bx=128.02, bz=112.02;
  P.addBox((ax+bx)/2,(az+bz)/2,1,1,0,-50,100,'t');
  const i0=Math.floor(ax/16), i1=Math.floor(bx/16), j0=Math.floor(az/16), j1=Math.floor(bz/16);
  console.log(n, 'len', Math.hypot(bx-ax,bz-az).toFixed(1), 'cells', (i1-i0+1)*(j1-j0+1), 'blocked', P.lineBlocked(ax,5,az,bx,5,bz));
  P.removeTag('t');
  // DDA uzun doğru: dünya köşeden köşeye, sonda kutu
  P.addBox(9700, 9700, 2, 2, 0, -50, 100, 'u');
  console.log(n, 'kose-kose (−9750→9700) blocked', P.lineBlocked(-9750, 5, -9750, 9710, 5, 9710));
  P.removeTag('u');
}
