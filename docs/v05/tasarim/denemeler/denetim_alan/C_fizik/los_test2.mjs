import { physics as P3 } from './v03/physics.js';
import { physics as P4 } from './v04/physics.js';
const out = {};
for (const [name, P] of [['v03', P3], ['v04', P4]]) {
  const r = {};
  // AABB 9x9 = 81 hücre (>64): (0,0)->(144,144), ~204 m; kutu ortada
  P.addBox(72, 72, 2, 2, 0, -50, 100, 'b');
  r.capraz204m_81hucre = P.lineBlocked(0, 5, 0, 144, 5, 144);
  P.removeTag('b');
  // AABB 8x9 = 72 hücre: (8,8)->(130,140)
  P.addBox(69, 74, 2, 2, 0, -50, 100, 'b2');
  r.capraz_72hucre = P.lineBlocked(8, 5, 8, 130, 5, 140);
  P.removeTag('b2');
  // en kısa atlanan çapraz: (15.9,15.9) -> (16*8+0.1, 16*8+0.1) => i0=0..i1=8 (9 hücre)
  P.addBox(72, 72, 2, 2, 0, -50, 100, 'b3');
  const L = Math.hypot(128.1 - 15.9, 128.1 - 15.9);
  r.enKisaAtlanan = { uzunluk_m: +L.toFixed(1), sonuc: P.lineBlocked(15.9, 5, 15.9, 128.1, 5, 128.1) };
  P.removeTag('b3');
  // arazi denetimi: 64 sınırından bağımsız mı? (arazi düz -10; 'arazi tepesi' yok) -> bu düzende hep false
  out[name] = r;
}
// Alt adım sayısı: game.update formülü n = clamp(ceil(dt/STEP - 1e-6), 1, 6)
const STEP = 1 / 60, nOf = (dt) => Math.min(6, Math.max(1, Math.ceil(dt / STEP - 1e-6)));
out.altAdim = {};
for (const ms of [16.6, 16.66, 16.667, 16.67, 16.7, 16.8, 17.0, 20, 33.3, 33.4, 8.33, 6.94]) out.altAdim[ms + 'ms'] = nOf(ms / 1000);
// Zıplama tepe noktası: yarı örtük Euler, v0=7.4, g=-22 (player._updateGround sırası: vel.y += g*dt; pos.y += vel.y*dt)
const apex = (h) => { let y = 0, v = 7.4, m = 0; for (let i = 0; i < 400; i++) { v += -22 * h; y += v * h; if (y > m) m = y; if (y < 0) break; } return +m.toFixed(3); };
out.ziplamaTepe = { h60: apex(1 / 60), h90: apex(1 / 90), h120: apex(1 / 120), h144: apex(1 / 144), analitik: +(7.4 * 7.4 / 44).toFixed(3) };
// 60 Hz ekranda titreşimli kare süresi: n 1 ya da 2 -> h 16.7 ya da 8.35 ms
const apexMix = (seq) => { let y = 0, v = 7.4, m = 0, k = 0; while (y >= 0 && k < 2000) { const dt = seq[k % seq.length] / 1000; const n = nOf(dt), h = dt / n; for (let i = 0; i < n; i++) { v += -22 * h; y += v * h; if (y > m) m = y; } k++; } return +m.toFixed(3); };
out.ziplamaTepe_60Hz_titresim = { sabit16667: apexMix([16.6667]), titresimli: apexMix([16.6, 16.7, 16.7, 16.6, 16.8, 16.5]) };
// Platformdan düşerek geçme eşiği: groundAt(x,z,yFeet=pos.y, step=0.6) yalnız top <= pos.y+0.6 olan platformu görür.
// Adım h'de düşüş hızı v ise: pos.y bir adımda v*h iner; önceki adımda pos.y >= top+eps, sonraki pos.y = top+eps - v*h.
// Platform görülür <=> top <= pos.y_yeni + 0.6 <=> v*h <= 0.6 + eps. Geçme eşiği v > 0.6/h.
out.platformGecmeEsigi = { h60_hiz: +(0.6 * 60).toFixed(1), h60_yukseklik_m: +((0.6 * 60) ** 2 / 44).toFixed(1), v03_15fps_hiz: +(0.6 * 15).toFixed(1), v03_15fps_yukseklik_m: +((0.6 * 15) ** 2 / 44).toFixed(2), v03_10fps_hiz: +(0.6 * 10).toFixed(1), v03_10fps_yukseklik_m: +((0.6 * 10) ** 2 / 44).toFixed(2), v03_30fps_yukseklik_m: +((0.6 * 30) ** 2 / 44).toFixed(2) };
console.log(JSON.stringify(out, null, 1));
