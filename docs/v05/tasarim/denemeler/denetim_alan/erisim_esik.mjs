// Salt-okur: yalnız arazi (çarpıştırıcısız) yürünebilirlik BFS'i — kıyıdan özellik merkezine yürüyerek ulaşılabilir mi?
// Kural player.js:566-576 ile aynı: tırmanırken (yükselme/ilerleme > 0,3) ve hedefte normal.y < 0,6 ise geçilemez.
const W = '/home/user/SON-HAZ-NE-w2/js/world/';
const geo = await import(W + 'geo.js');
const D = await import(W + 'worldData.js');
const A = await import(W + 'archipelago.js');
const S = 1.5; const NYT = +(process.env.NYT || 0.6); // ızgara adımı = terrain.normalAt e
const only = process.argv[2] || null;
const res = [];
for (const I of D.ISLANDS) {
  if (only && I.id !== only) continue;
  const targets = [];
  for (const f of I.features || []) {
    if (['camp','fort','ruin','graveyard','mine','market','ruined_town','prison','temple','lighthouse','port'].includes(f.type)) targets.push({ id: f.type + (f.auto ? '*' : ''), x: f.x, z: f.z, r: 3 });
    if (f.type === 'boss_land') targets.push({ id: 'boss_land:' + f.boss, x: f.x, z: f.z, r: 6 });
    if (f.type === 'temple') { for (const [lx, lz] of [[-26,42],[26,42],[0,52]]) targets.push({ id: 'levye', x: f.x+lx, z: f.z+lz, r: 1.5 }); }
  }
  for (const s of D.DIG_SITES) if (s.island === I.id) targets.push({ id: 'kazi:' + s.id, x: s.x, z: s.z, r: 1.5 });
  if (!targets.length) continue;
  const half = I.r * 1.25 * Math.max(I.ex || 1, I.ez || 1) + 10;
  const N = Math.ceil(2 * half / S) + 1;
  const x0 = I.x - half, z0 = I.z - half;
  const H = new Float32Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) H[j * N + i] = geo.computeHeight(x0 + i * S, z0 + j * S);
  const ny = new Float32Array(N * N).fill(1);
  for (let j = 1; j < N - 1; j++) for (let i = 1; i < N - 1; i++) { const hl = H[j*N+i-1], hr = H[j*N+i+1], hd = H[(j-1)*N+i], hu = H[(j+1)*N+i]; ny[j*N+i] = 2*S / Math.hypot(hl-hr, 2*S, hd-hu); }
  const seen = new Uint8Array(N * N); const q = new Int32Array(N * N); let qh = 0, qt = 0;
  for (let k = 0; k < N * N; k++) if (H[k] > -0.6 && H[k] < 0.8) { seen[k] = 1; q[qt++] = k; }
  const nb = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  while (qh < qt) { const k = q[qh++]; const i = k % N, j = (k / N) | 0; for (const [di, dj] of nb) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= N || jj >= N) continue; const kk = jj * N + ii; if (seen[kk]) continue; if (H[kk] < -0.6) continue; const run = S * Math.hypot(di, dj); const rise = H[kk] - H[k]; if (rise / run > 0.3 && ny[kk] < NYT) continue; seen[kk] = 1; q[qt++] = kk; } }
  let land = 0, reach = 0; for (let k = 0; k < N*N; k++) if (H[k] > 0.8) { land++; if (seen[k]) reach++; }
  const bad = [];
  for (const t of targets) { let ok = false; const ci = Math.round((t.x - x0) / S), cj = Math.round((t.z - z0) / S); const rr = Math.ceil(t.r / S); for (let dj = -rr; dj <= rr && !ok; dj++) for (let di = -rr; di <= rr && !ok; di++) { const ii = ci + di, jj = cj + dj; if (ii < 0 || jj < 0 || ii >= N || jj >= N) continue; if (seen[jj * N + ii]) ok = true; } if (!ok) bad.push(t.id + '@' + Math.round(geo.computeHeight(t.x, t.z)) + 'm'); }
  res.push({ id: I.id, shape: I.shape || 'normal', r: I.r, landReach: +(reach / Math.max(1, land)).toFixed(3), targets: targets.length, unreachable: bad });
}
for (const r of res) if (r.unreachable.length || r.landReach < 0.9) console.log(JSON.stringify(r));
console.log('ada', res.length, 'ulasilamayan hedefli ada', res.filter(r => r.unreachable.length).length, 'toplam ulasilamayan hedef', res.reduce((s, r) => s + r.unreachable.length, 0), 'toplam hedef', res.reduce((s, r) => s + r.targets, 0));
