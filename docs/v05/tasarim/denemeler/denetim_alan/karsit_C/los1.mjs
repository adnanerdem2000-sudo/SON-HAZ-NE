import { physics as P3 } from './v03/physics.js';
import { physics as P4 } from './v04/physics.js';
const res = {};
function run(name, P) {
  const out = {};
  P.clear(); P.platList = [];
  // test 03 #6 kopyası: eksene paralel 400 m
  P.addBox(1500, -3000, 2, 2, 0, -50, 100, 't1');
  out.eksenParalel400 = P.lineBlocked(1300, 5, -3000, 1700, 5, -3000);
  out.bos400 = P.lineBlocked(1300, 5, -3100, 1700, 5, -3100);
  P.removeTag('t1');
  out.kaldirilinca = P.lineBlocked(1300, 5, -3000, 1700, 5, -3000);
  // çapraz doğru, ortasında kutu
  const diag = (L, ox, oz) => { const d = L / Math.SQRT2; const ax = ox, az = oz, bx = ox + d, bz = oz + d; P.addBox((ax+bx)/2, (az+bz)/2, 1, 1, 0, -50, 100, 't2'); const r = P.lineBlocked(ax, 5, az, bx, 5, bz); P.removeTag('t2');
    const i0=Math.floor(Math.min(ax,bx)/16), i1=Math.floor(Math.max(ax,bx)/16), j0=Math.floor(Math.min(az,bz)/16), j1=Math.floor(Math.max(az,bz)/16); return { r, cells: (i1-i0+1)*(j1-j0+1) }; };
  out.capraz204 = diag(204, 0.5, 0.5);
  out.capraz158_7_hizali = diag(158.7, 15.9, 15.9); // en kötü hizalama: 112 m izdüşüm 9 hücre
  out.capraz147 = (()=>{ const ax=15.99, az=0.01, bx=ax+112.05, bz=az+96.0; P.addBox((ax+bx)/2,(az+bz)/2,1,1,0,-50,100,'t3'); const r=P.lineBlocked(ax,5,az,bx,5,bz); P.removeTag('t3'); return {r, len:+Math.hypot(bx-ax,bz-az).toFixed(1)}; })();
  out.capraz170_hizasiz = diag(170, 8, 8);
  out.capraz46 = diag(46, 15.9, 15.9);
  // eksene paralel ama z sınırına oturan doğru (2 hücre genişlik): 33 hücre × 2 = 66 > 64
  out.eksenParalel_sinirda = (()=>{ P.addBox(1500, 0, 2, 2, 0, -50, 100, 't4'); const r = P.lineBlocked(1000, 5, -0.5, 1530, 5, 0.5); P.removeTag('t4'); return { r }; })();
  return out;
}
res.v03 = run('v03', P3);
res.v04 = run('v04', P4);
console.log(JSON.stringify(res, null, 1));
