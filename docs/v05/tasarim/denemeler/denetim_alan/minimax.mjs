// Kıyıdan hedefe giden yollar içinde "en dik tırmanış noktası en yumuşak" olan yol (minimax): yoldaki en küçük ny (tırmanırken)
const W = '/home/user/SON-HAZ-NE-w2/js/world/';
const geo = await import(W + 'geo.js');
const D = await import(W + 'worldData.js');
const S = 1.5;
function minimax(I, tx, tz) {
  const half = I.r * 1.25 + 10, N = Math.ceil(2 * half / S) + 1, x0 = I.x - half, z0 = I.z - half;
  const H = new Float32Array(N * N); for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) H[j*N+i] = geo.computeHeight(x0 + i*S, z0 + j*S);
  const ny = new Float32Array(N*N).fill(1); for (let j = 1; j < N-1; j++) for (let i = 1; i < N-1; i++) { const hl=H[j*N+i-1], hr=H[j*N+i+1], hd=H[(j-1)*N+i], hu=H[(j+1)*N+i]; ny[j*N+i] = 2*S/Math.hypot(hl-hr,2*S,hd-hu); }
  // best[k] = yoldaki en kötü (en küçük) tırmanış ny; büyüğü iyi. Basit kova-sıralı yayılım
  const best = new Float32Array(N*N).fill(-1); const heap = [];
  const push = (k, v) => { heap.push([v, k]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] >= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2*i+1, r = l+1; let m = i; if (l < heap.length && heap[l][0] > heap[m][0]) m = l; if (r < heap.length && heap[r][0] > heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  for (let k = 0; k < N*N; k++) if (H[k] > -0.6 && H[k] < 0.8) { best[k] = 1; push(k, 1); }
  const nb = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  while (heap.length) { const [v, k] = pop(); if (v < best[k]) continue; const i = k % N, j = (k / N) | 0; for (const [di, dj] of nb) { const ii = i+di, jj = j+dj; if (ii<0||jj<0||ii>=N||jj>=N) continue; const kk = jj*N+ii; if (H[kk] < -0.6) continue; const run = S*Math.hypot(di,dj), rise = H[kk]-H[k]; const c = rise/run > 0.3 ? Math.min(v, ny[kk]) : v; if (c > best[kk]) { best[kk] = c; push(kk, c); } } }
  const ti = Math.round((tx - x0)/S), tj = Math.round((tz - z0)/S); let b = -1; for (let dj=-1; dj<=1; dj++) for (let di=-1; di<=1; di++) b = Math.max(b, best[(tj+dj)*N+ti+di]);
  return b;
}
for (const [isl, kind] of [['ada_col_2','ruin'],['ada_col_2','kazi'],['ada_volkan_6','kazi'],['ada_volkan_5','kazi'],['ada_volkan_3','kazi'],['ada_volkan_0','kazi'],['ada_volkan_2','kazi'],['kizil_kanyon','kazi'],['demirkapi','prison'],['gumus_madeni','mine'],['ates_dagi','boss_land']]) {
  const I = D.ISLANDS.find(i => i.id === isl);
  const tg = kind === 'kazi' ? D.DIG_SITES.filter(s => s.island === isl) : I.features.filter(f => f.type === kind);
  for (const t of tg) { const b = minimax(I, t.x, t.z); console.log(isl, kind, t.id, 'h', geo.computeHeight(t.x, t.z).toFixed(1), 'yoldaki en dik tirmanis ny', b.toFixed(3), 'aci', (Math.acos(Math.min(1, b)) * 180 / Math.PI).toFixed(1) + '°', b < 0.6 ? 'ULASILAMAZ (ny<0,6)' : 'ulasilir'); }
}
