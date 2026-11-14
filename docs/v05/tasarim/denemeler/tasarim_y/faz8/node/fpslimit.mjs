// engine.js:55-59 kare sınırlayıcısının birebir kopyası; rAF tazeleme aralıklarında gelir (küçük titreşimle)
function sim(hz, limit, mode = 'eski', secs = 20) {
  let last = 0, frames = 0; const iv = 1000 / hz; let rnd = 12345;
  const r = () => { rnd = (rnd * 1103515245 + 12345) & 0x7fffffff; return rnd / 0x7fffffff; };
  for (let t = iv; t < secs * 1000; t += iv) {
    const now = t + (r() - 0.5) * 0.3; // ±0,15 ms titreşim
    const minDt = 1000 / limit;
    if (mode === 'eski') { if (now - last < minDt - 1) continue; last = now; frames++; }
    else { // önerilen: biriktirmeli zamanlama
      if (now - last < minDt - 0.5 * iv) continue; // yarım tazeleme aralığı tolerans
      last = Math.max(last + minDt, now - minDt); frames++; }
  }
  return +(frames / secs).toFixed(1);
}
const out = [];
for (const hz of [60, 75, 100, 120, 144, 165]) out.push({ hz, eski60: sim(hz, 60), yeni60: sim(hz, 60, 'yeni'), eski30: sim(hz, 30), yeni30: sim(hz, 30, 'yeni') });
console.table(out);
