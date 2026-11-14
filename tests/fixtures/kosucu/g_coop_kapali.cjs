// (g) Co-op: bir oyuncunun sekmesi kasıtlı kapatılır, sonra tick(). Kapalı sayfa atlanmalı (kapaliAtlama > 0), hata sayılmamalı.
// Beklenen: GECTI.
module.exports = async ({ host, guests, ev, tick, check }) => {
  await guests[0].context().close();
  await tick(1);
  const n = await ev(host, `window.__simSayisi`, 'sim');
  check('G01 Kapalı sekmeden sonra ev sahibi ilerledi', n >= 5, n);
};
