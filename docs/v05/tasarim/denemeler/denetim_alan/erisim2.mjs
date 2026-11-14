// Salt-okur arazi erişilebilirlik taraması (yalnız arazi; çarpıştırıcılar yok sayılır), 0,75 m ızgara.
// Kural (player.js:569-584): yokuş yukarı adımda yükselme/ilerleme > 0,3 VE normal.y < 0,6 ise geçilemez (normal: ±1,5 m farkı).
const geo = await import('/home/user/SON-HAZ-NE-w2/js/world/geo.js');
const W = await import('/home/user/SON-HAZ-NE-w2/js/world/worldData.js');
const H = geo.computeHeight;
const only = process.argv[2] && process.argv[2] !== 'all' ? process.argv[2].split(',') : null;
const STEP = 0.75;
const out = [];
const t0 = Date.now();
let checked = 0;
for (const I of W.ISLANDS) {
  if (only && !only.includes(I.id)) continue;
  const targets = [];
  for (const f of I.features || []) if (f.x !== undefined && !['port', 'boss_sea', 'boss_land', 'sunken_city', 'beach_wreck'].includes(f.type)) targets.push({ id: f.id, x: f.x, z: f.z, kind: f.type, rad: 2.4 });
  for (const s of W.DIG_SITES) if (s.island === I.id) targets.push({ id: s.id, x: s.x, z: s.z, kind: 'kazi', rad: 3.7 });
  if (!targets.length) continue;
  const R = I.r * 1.35 * Math.max(I.ex || 1, I.ez || 1);
  const n = Math.ceil(2 * R / STEP) + 1;
  const x0 = I.x - R, z0 = I.z - R;
  const h = new Float32Array(n * n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) h[j * n + i] = H(x0 + i * STEP, z0 + j * STEP);
  const at = (i, j) => h[Math.min(n - 1, Math.max(0, j)) * n + Math.min(n - 1, Math.max(0, i))];
  const nyAt = (i, j) => { const a = at(i - 2, j) - at(i + 2, j), c = at(i, j - 2) - at(i, j + 2), b = 2 * 2 * STEP; return b / Math.hypot(a, b, c); };
  const seen = new Uint8Array(n * n);
  const q = [];
  for (let i = 0; i < n; i++) for (const j of [0, n - 1]) for (const [a, b] of [[i, j], [j, i]]) { const k = b * n + a; if (!seen[k] && h[k] < 0) { seen[k] = 1; q.push(k); } }
  while (q.length) {
    const k = q.pop(); const i = k % n, j = (k - i) / n;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue; const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= n || b >= n) continue;
      const k2 = b * n + a; if (seen[k2]) continue;
      const hB = h[k2];
      if (hB < 0) { seen[k2] = 1; q.push(k2); continue; }
      const hA = Math.max(h[k], -1.35);
      const run = STEP * Math.hypot(di, dj);
      if ((hB - hA) / run > 0.3 && nyAt(a, b) < 0.6) continue;
      if (hB - hA > 0.65) continue;
      seen[k2] = 1; q.push(k2);
    }
  }
  for (const t of targets) {
    checked++;
    const ci = Math.round((t.x - x0) / STEP), cj = Math.round((t.z - z0) / STEP);
    const rr = Math.ceil(t.rad / STEP);
    let ok = false;
    for (let b = cj - rr; b <= cj + rr && !ok; b++) for (let a = ci - rr; a <= ci + rr; a++) { if (a < 0 || b < 0 || a >= n || b >= n) continue; if (Math.hypot(a - ci, b - cj) * STEP > t.rad) continue; const k = b * n + a; if (seen[k] && h[k] >= 0.2) { ok = true; break; } }
    if (!ok) out.push({ isl: I.id, shape: I.shape || 'normal', id: t.id, kind: t.kind, hc: +H(t.x, t.z).toFixed(2) });
  }
}
console.log('sure_ms', Date.now() - t0, 'hedef', checked);
console.log(JSON.stringify(out));
