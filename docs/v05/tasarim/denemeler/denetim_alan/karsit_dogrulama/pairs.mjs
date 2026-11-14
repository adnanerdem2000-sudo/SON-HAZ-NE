// bodies._collidePairs maliyet tahmini (aynı döngü yapısı; cisimler 30 m'lik alanda rastgele, uyumayan)
function bench(n) {
  const L = Array.from({ length: n }, () => ({ enabled: true, sleeping: false, r: 0.22, mass: 0.3, pos: { x: Math.random() * 30, y: 0, z: Math.random() * 30 } }));
  const t0 = performance.now();
  let hits = 0;
  for (let i = 0; i < L.length; i++) {
    const a = L[i]; if (!a.enabled) continue;
    for (let j = i + 1; j < L.length; j++) {
      const b = L[j]; if (!b.enabled || (a.sleeping && b.sleeping)) continue;
      const dx = a.pos.x - b.pos.x, dy = a.pos.y - b.pos.y, dz = a.pos.z - b.pos.z;
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz), m = a.r + b.r;
      if (d >= m || d < 1e-5) continue; hits++;
    }
  }
  return performance.now() - t0;
}
for (const n of [500, 2000, 7200]) { bench(n); console.log('cisim', n, '→ tek _collidePairs çağrısı ms:', bench(n).toFixed(1)); }
