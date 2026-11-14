// 09_performans düşman sızıntı döngüsündeki sabit tohumlarla haydut silah seçimi (enemies.js _buildModel sırası) — salt okuma
globalThis.window = globalThis; globalThis.location = { search: '' };
const ctx = new Proxy({}, { get: () => () => {} , set: () => true });
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx, style: {} }) };
const { rng } = await import('/home/user/SON-HAZ-NE-w2/js/core/util.js');
const { randomAppearance } = await import('/home/user/SON-HAZ-NE-w2/js/player/appearance.js');
const W = ['sword', 'kk:Knife', 'kk:1H_Axe'], BODY = ['cevik', 'kaba'];
for (const seed of [100, 101, 102, 103]) {
  const r = rng(seed);
  randomAppearance(r);
  BODY[Math.floor(r() * BODY.length)];
  console.log('tohum', seed, seed % 2 ? 'haydut' : 'iskelet', '→ haydut olsaydı silah:', W[Math.floor(r() * W.length)]);
}
// rastgele tohumla 'sword' olasılığı
let sw = 0; const N = 30000;
for (let i = 0; i < N; i++) { const r = rng((Math.random() * 1e9) | 0); randomAppearance(r); r(); if (W[Math.floor(r() * 3)] === 'sword') sw++; }
console.log('rastgele tohumda haydut kılıç oranı', (sw / N).toFixed(3));
