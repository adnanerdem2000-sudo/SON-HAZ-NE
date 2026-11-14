// Salt-okur: tüm adaların etki alanını hesapla, büyük boş açık deniz alanlarını bul
const W = await import('/home/user/SON-HAZ-NE-w2/js/world/worldData.js');
const A = await import('/home/user/SON-HAZ-NE-w2/js/world/archipelago.js');
const isl = W.ISLANDS;
console.log('ada sayısı', isl.length, 'extra', A.EXTRA_ISLANDS.length);
// her nokta için en yakın ada kenarı uzaklığı (reach = r*2.6*max(ex,ez))
function clearance(x, z) {
  let best = Infinity, who = null;
  for (const I of isl) {
    const R = I.r * 2.6 * Math.max(I.ex || 1, I.ez || 1);
    const d = Math.hypot(x - I.x, z - I.z) - R;
    if (d < best) { best = d; who = I.id; }
  }
  return [best, who];
}
const cands = [];
for (let x = -9300; x <= 9300; x += 100) for (let z = -9300; z <= 9300; z += 100) {
  const [c, who] = clearance(x, z);
  cands.push({ x, z, c, who, reg: A.regionAt(x, z) });
}
cands.sort((a, b) => b.c - a.c);
// en iyi 25 farklı nokta (birbirinden 1500 m uzak)
const picked = [];
for (const p of cands) {
  if (picked.every((q) => Math.hypot(q.x - p.x, q.z - p.z) > 1500)) picked.push(p);
  if (picked.length >= 25) break;
}
for (const p of picked) console.log(JSON.stringify(p));
