// engine.js:55-59 FPS sınırı mantığının benzetimi (rAF ekran tazeleme hızında gelir)
for (const hz of [60, 75, 100, 120, 144, 165, 240]) {
  const row = [];
  for (const lim of [30, 60, 120]) {
    let last = 0, n = 0; const T = 10000; const step = 1000 / hz;
    for (let now = step; now <= T; now += step) { const minDt = 1000 / lim; if (now - last < minDt - 1) continue; last = now; n++; }
    row.push(`${lim}→${(n / (T / 1000)).toFixed(1)}`);
  }
  console.log(`${hz} Hz ekran: sınır→gerçek FPS`, row.join('  '));
}
