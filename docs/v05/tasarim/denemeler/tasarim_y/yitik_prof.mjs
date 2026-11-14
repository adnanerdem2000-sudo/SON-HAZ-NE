// Salt-okur deneme: Yitik Ufuk'u bellekte ISLANDS'a ekleyip (dosya değişmez) atol profilini örnekler
const W = await import('/home/user/SON-HAZ-NE-w2/js/world/worldData.js');
const I = { id: 'yitik_ufuk', name: 'Yitik Ufuk', biome: 'hayalet', region: 'merkez', x: 300, z: -2100, r: 260, h: 95, hill: 0.5, coast: 0.18, seed: 1662, shape: 'atoll', features: [], story: true };
W.ISLANDS.push(I);
const G = await import('/home/user/SON-HAZ-NE-w2/js/world/geo.js');
for (let k = 0; k < 8; k++) {
  const a = k / 8 * Math.PI * 2; const row = [];
  for (let f = 0; f <= 1.2001; f += 0.06) row.push(G.computeHeight(I.x + Math.cos(a) * f * I.r, I.z + Math.sin(a) * f * I.r).toFixed(0));
  console.log(`a=${(a*180/Math.PI).toFixed(0).padStart(3)}°`, row.join(' '));
}
// kenar eğimi: halka iç ve dış en dik eğim (derece)
let maxIn = 0, maxOut = 0;
for (let k = 0; k < 64; k++) { const a = k / 64 * Math.PI * 2;
  for (let f = 0.6; f < 1.05; f += 0.01) { const x0 = I.x + Math.cos(a) * f * I.r, z0 = I.z + Math.sin(a) * f * I.r; const x1 = I.x + Math.cos(a) * (f + 0.01) * I.r, z1 = I.z + Math.sin(a) * (f + 0.01) * I.r; const s = Math.atan2(Math.abs(G.computeHeight(x1, z1) - G.computeHeight(x0, z0)), 0.01 * I.r) * 180 / Math.PI; if (f < 0.8) maxIn = Math.max(maxIn, s); else maxOut = Math.max(maxOut, s); } }
console.log('en dik iç yamaç', maxIn.toFixed(1), '° dış yamaç', maxOut.toFixed(1), '°');
// en yakın mevcut ada kıyısı ile etkileşim: yitik etki alanı (r*2.6=676) içinde başka ada var mı
const others = W.ISLANDS.filter(J => J !== I).map(J => [J.id, Math.round(Math.hypot(J.x - I.x, J.z - I.z) - J.r * 2.6 - I.r * 2.6)]).sort((a, b) => a[1] - b[1]).slice(0, 3);
console.log('etki alanları arası boşluk (m):', JSON.stringify(others));
