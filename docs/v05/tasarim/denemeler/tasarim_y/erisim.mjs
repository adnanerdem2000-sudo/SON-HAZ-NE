// Salt-okur: hikâye noktalarının yüksekliği, yerel eğimi ve kıyıdan yürüyerek erişim (minimax eğim, yalnız arazi)
const A = await import('/home/user/SON-HAZ-NE-w2/js/world/archipelago.js');
const Gm = await import('/home/user/SON-HAZ-NE-w2/js/world/geo.js');
const P = (await import('/home/user/SON-HAZ-NE-w2/js/world/ports.js')).ports;
const H = (x, z) => Gm.computeHeight(x, z);
const slopeDeg = (x, z) => { const e = 1; const dx = (H(x + e, z) - H(x - e, z)) / 2, dz = (H(x, z + e) - H(x, z - e)) / 2; return Math.atan(Math.hypot(dx, dz)) * 180 / Math.PI; };
// minimax: ızgara 3 m, kıyı hücrelerinden (0.2<h<1.5) başlayan Dijkstra; kenar maliyeti = komşu arası eğim (derece)
function minimax(isl, tx, tz, step = 3) {
  const I = A.EXTRA_ISLANDS.find((i) => i.id === isl);
  const R = I.r * 1.25 * Math.max(I.ex || 1, I.ez || 1);
  const n = Math.ceil((2 * R) / step);
  const x0 = I.x - R, z0 = I.z - R;
  const h = new Float32Array(n * n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) h[j * n + i] = H(x0 + i * step, z0 + j * step);
  const best = new Float64Array(n * n).fill(1e9);
  const heap = [];
  const push = (c, v) => { heap.push([v, c]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => { const top = heap[0]; const last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
  for (let c = 0; c < n * n; c++) if (h[c] > 0.2 && h[c] < 1.5) { best[c] = 0; push(c, 0); }
  while (heap.length) {
    const [v, c] = pop(); if (v > best[c]) continue;
    const i = c % n, j = (c / n) | 0;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
      const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= n || b >= n) continue;
      const c2 = b * n + a; if (h[c2] < 0.2) continue;
      const run = step * Math.hypot(di, dj);
      const s = Math.atan(Math.abs(h[c2] - h[c]) / run) * 180 / Math.PI;
      const nv = Math.max(v, s); if (nv < best[c2]) { best[c2] = nv; push(c2, nv); }
    }
  }
  const ti = Math.round((tx - x0) / step), tj = Math.round((tz - z0) / step);
  return +best[tj * n + ti].toFixed(1);
}
const pts = [
  ['6 Ateşgül (Kül Limanı iskele kökü)', 'kul_limani', null, null, 'kul_limani_port_0'],
  ['6 Kor Başrahibi arenası (Obsidyen maden düzlüğü)', 'obsidyen', 6387, 2663],
  ['6 Kor Kulesi tabanı (Ateş Dağı batı kenarı d=0.24r)', 'ates_dagi', 7700 - 0.24 * 540, -900],
  ['6 Kor Kulesi alternatif (kuzeybatı kenar d=0.24r)', 'ates_dagi', 7700 + Math.cos(3.93) * 0.24 * 540, -900 + Math.sin(3.93) * 0.24 * 540],
  ['6 Krater (Volkanik Dev)', 'ates_dagi', 7700, -900],
  ['7 Halil (mezarlık dışı 28 m)', 'korsan_mezarligi', -6735, -6380],
  ['7 Fener kapısı', 'fener_kayasi', -1246.4, -1950],
  ['7 Zincir Taşı (Sis Adası harabe yanı)', 'sis_adasi', -5265, -7844],
  ['8 Ayaz (Kuzeyfener iskele kökü)', 'kuzeyfener', null, null, 'kuzeyfener_port_0'],
  ['8 Ayaz Kulesi (Buzdişi zirvesi)', 'buzdisi', -1456, -7316],
  ['9 Sare (Kumsaati iskele kökü)', 'kumsaati', null, null, 'kumsaati_port_0'],
  ['9 Zindan Kulesi (Demirkapı avlu dışı 36 m)', 'demirkapi', -6678, 2522],
  ['9 Maden ağzı (Gümüş Madeni)', 'gumus_madeni', -7546, -1566],
  ['9 Güneş Taşı (Kızıl Kanyon harabe yanı)', 'kizil_kanyon', -5142 + 16 * Math.cos(-0.2), 3951 + 16 * Math.sin(-0.2)],
  ['10 Mahzen kapağı (Yıkık kasaba, 45 m)', 'korsan_kasabasi', -1789 - 0.162 * 45, 1492 - 0.987 * 45],
  ['10 Tapınak sunak üstü', 'kadim_tapinak', 1900, 7388],
];
for (const [name, isl, x0, z0, portId] of pts) {
  let x = x0, z = z0;
  if (portId) { const p = P.byId(portId); x = p.pierStart.x; z = p.pierStart.z; console.log('   iskele', portId, JSON.stringify({ start: [Math.round(p.pierStart.x), Math.round(p.pierStart.z)], end: [Math.round(p.pierEnd.x), Math.round(p.pierEnd.z)], boarding: [Math.round(p.boarding.x), Math.round(p.boarding.z)] })); }
  console.log(name, `@(${Math.round(x)},${Math.round(z)}) h=${H(x, z).toFixed(1)} eğim=${slopeDeg(x, z).toFixed(0)}° kıyıdan-minimax=${minimax(isl, x, z)}°`);
}
