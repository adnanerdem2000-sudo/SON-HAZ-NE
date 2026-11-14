// Salt-okur deneme: v0.3 ve v0.4 lineBlocked davranışı (arazi düz -10 m, yani yalnız çarpıştırıcılar)
import { physics as P3 } from './v03/physics.js';
import { physics as P4 } from './v04/physics.js';
const out = {};
for (const [name, P] of [['v03', P3], ['v04', P4]]) {
  const r = {};
  // 1) Testteki (03_fizik_duzeltmeler #6) eksene paralel 400 m doğru, kutu ortada
  P.addBox(1500, -3000, 2, 2, 0, -50, 100, 'a');
  r.eksenParalel400m = P.lineBlocked(1300, 5, -3000, 1700, 5, -3000);
  P.removeTag('a');
  // 2) Çapraz ~170 m doğru (AABB 9x9=81 hücre > 64), kutu ortada
  P.addBox(60, 60, 2, 2, 0, -50, 100, 'b');
  r.capraz170m = P.lineBlocked(0, 5, 0, 120, 5, 120);
  r.capraz170m_kisaParca = P.lineBlocked(40, 5, 40, 80, 5, 80);
  P.removeTag('b');
  // 3) Çapraz 50 m doğru (düşman görüşü ölçeği), kutu ortada
  P.addBox(25, 25, 1, 1, 0, -50, 100, 'c');
  r.capraz50m = P.lineBlocked(0, 5, 0, 50, 5, 50);
  P.removeTag('c');
  out[name] = r;
}
// 4) Zıpkın: ardışık parçalarda varsayılan tMin/tMax (0.02/0.98) — ek yerinde duran çember/kutu kaçırılıyor mu?
{
  const P = P4; const seg = 0.4; // 24 m/s, 60 FPS
  let missC = 0, missB = 0, N = 0;
  for (let k = 0; k < 400; k++) {
    const off = k / 400 * seg; // engelin ek yerine göre kayması
    const cx = 10 + off;
    P.addCircle(cx, 0.0, 0.3, -50, 100, 'h'); // ağaç gövdesi benzeri
    let hitC = false;
    for (let s = 0; s < 60 && !hitC; s++) { const ax = s * seg, bx = (s + 1) * seg; if (P.lineBlocked(ax, 1, 0, bx, 1, 0)) hitC = true; }
    P.removeTag('h');
    P.addBox(cx, 0, 0.15, 2, 0, -50, 100, 'h2'); // ince levha/duvar
    let hitB = false;
    for (let s = 0; s < 60 && !hitB; s++) { const ax = s * seg, bx = (s + 1) * seg; if (P.lineBlocked(ax, 1, 0, bx, 1, 0)) hitB = true; }
    P.removeTag('h2');
    N++; if (!hitC) missC++; if (!hitB) missB++;
  }
  out.zipkin_varsayilan = { deneme: N, cemberKacirma: missC, kutuKacirma: missB };
  // aynı deneme PROJ_LOS (tMin 0, tMax 1, rScale 1)
  missC = 0; missB = 0;
  for (let k = 0; k < 400; k++) {
    const cx = 10 + k / 400 * seg;
    P.addCircle(cx, 0.0, 0.3, -50, 100, 'h');
    let hitC = false; for (let s = 0; s < 60 && !hitC; s++) if (P.lineBlocked(s * seg, 1, 0, (s + 1) * seg, 1, 0, { tMin: 0, tMax: 1, rScale: 1 })) hitC = true;
    P.removeTag('h');
    P.addBox(cx, 0, 0.15, 2, 0, -50, 100, 'h2');
    let hitB = false; for (let s = 0; s < 60 && !hitB; s++) if (P.lineBlocked(s * seg, 1, 0, (s + 1) * seg, 1, 0, { tMin: 0, tMax: 1, rScale: 1 })) hitB = true;
    P.removeTag('h2');
    if (!hitC) missC++; if (!hitB) missB++;
  }
  out.zipkin_PROJ_LOS = { deneme: 400, cemberKacirma: missC, kutuKacirma: missB };
}
console.log(JSON.stringify(out, null, 1));
