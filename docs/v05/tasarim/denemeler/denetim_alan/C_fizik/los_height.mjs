// 2.5B yükseklik denetimi: kutu yalnız GİRİŞ noktasındaki yükseklikle sınanıyor mu?
import { physics as P4 } from './v04/physics.js';
import { physics as P3 } from './v03/physics.js';
const out = {};
for (const [n, P] of [['v03', P3], ['v04', P4]]) {
  P.addBox(0, 0, 4, 4, 0, 0, 6, 'bina'); // 8x8 m, 6 m yüksek bina
  // tepeden (yamaç/sur üstü 12 m) binanın arkasındaki oyuncuya bakış: doğru binanın içinden geçiyor
  const a = [-10, 12, 0], b = [6, 0.5, 0];
  const yIn = a[1] + (b[1] - a[1]) * ((-4 - a[0]) / (b[0] - a[0])), yOut = a[1] + (b[1] - a[1]) * ((4 - a[0]) / (b[0] - a[0]));
  out[n] = { girisY: +yIn.toFixed(2), cikisY: +yOut.toFixed(2), binaUstu: 6, engelli: P.lineBlocked(...a, ...b), kamera: P4 === P ? P.lineBlocked(...a, ...b, { tMin: 0.05, tMax: 1, rScale: 1, camera: true }) : null };
  // aynı doğru ters yönde (oyuncudan tepeye): giriş noktası alçakta → engel bulunur mu?
  out[n].tersYon = P.lineBlocked(...b, ...a);
  P.removeTag('bina');
  // çember (kaya) için en yakın yaklaşma noktasındaki yükseklik
  P.addCircle(0, 0, 3, 0, 4, 'kaya'); // 6 m çaplı, 4 m yüksek kaya
  out[n].kaya = { egikDogru: P.lineBlocked(-10, 9, 0.5, 6, 0.2, 0.5), tersYon: P.lineBlocked(6, 0.2, 0.5, -10, 9, 0.5) };
  P.removeTag('kaya');
}
console.log(JSON.stringify(out, null, 1));
