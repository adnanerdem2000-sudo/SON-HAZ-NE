// En az "dik tırmanış yüksekliği" gerektiren yol (Dijkstra): maliyet = ny<0,6 olan tırmanış adımlarındaki toplam yükselme (m)
const W = '/home/user/SON-HAZ-NE-w2/js/world/';
const geo = await import(W + 'geo.js');
const D = await import(W + 'worldData.js');
const S = 1.0;
function steep(I, tx, tz) {
  const half = I.r * 1.25 + 10, N = Math.ceil(2 * half / S) + 1, x0 = I.x - half, z0 = I.z - half;
  const H = new Float32Array(N*N); for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) H[j*N+i] = geo.computeHeight(x0+i*S, z0+j*S);
  const e = 1.5; const nyAt = (x, z) => { const hl = geo.computeHeight(x-e, z), hr = geo.computeHeight(x+e, z), hd = geo.computeHeight(x, z-e), hu = geo.computeHeight(x, z+e); return 2*e / Math.hypot(hl-hr, 2*e, hd-hu); };
  const NY = new Float32Array(N*N); for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) NY[j*N+i] = nyAt(x0+i*S, z0+j*S);
  const dist = new Float32Array(N*N).fill(Infinity); const heap = [];
  const push = (k, v) => { heap.push([v,k]); let i = heap.length-1; while (i>0) { const p = (i-1)>>1; if (heap[p][0] <= heap[i][0]) break; [heap[p],heap[i]]=[heap[i],heap[p]]; i=p; } };
  const pop = () => { const t = heap[0], l = heap.pop(); if (heap.length) { heap[0] = l; let i = 0; for(;;){ const a=2*i+1,b=a+1; let m=i; if(a<heap.length&&heap[a][0]<heap[m][0])m=a; if(b<heap.length&&heap[b][0]<heap[m][0])m=b; if(m===i)break; [heap[m],heap[i]]=[heap[i],heap[m]]; i=m; } } return t; };
  for (let k = 0; k < N*N; k++) if (H[k] > -0.6 && H[k] < 0.8) { dist[k] = 0; push(k, 0); }
  const nb = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  while (heap.length) { const [v,k] = pop(); if (v > dist[k]) continue; const i = k % N, j = (k/N)|0; for (const [di,dj] of nb) { const ii=i+di, jj=j+dj; if (ii<0||jj<0||ii>=N||jj>=N) continue; const kk = jj*N+ii; if (H[kk] < -0.6) continue; const run = S*Math.hypot(di,dj), rise = H[kk]-H[k]; const c = (rise/run > 0.3 && NY[kk] < 0.6) ? rise : 0; if (v + c < dist[kk]) { dist[kk] = v + c; push(kk, v + c); } } }
  const ti = Math.round((tx-x0)/S), tj = Math.round((tz-z0)/S); let b = Infinity; for (let dj=-1; dj<=1; dj++) for (let di=-1; di<=1; di++) b = Math.min(b, dist[(tj+dj)*N+ti+di]); return b;
}
for (const [isl, kind] of [['ada_col_2','ruin'],['ada_col_2','kazi'],['ada_volkan_6','kazi']]) {
  const I = D.ISLANDS.find(i => i.id === isl);
  const tg = kind === 'kazi' ? D.DIG_SITES.filter(s => s.island === isl) : I.features.filter(f => f.type === kind);
  for (const t of tg) console.log(isl, kind, 'en az dik tirmanis yuksekligi (m)', steep(I, t.x, t.z).toFixed(2), '(ziplama ~1,24 m)');
}
