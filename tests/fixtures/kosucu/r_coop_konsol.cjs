// (r) Co-op: sayfalar bir konsol hatası basar (coop.html?hata=1). Kontrol geçer ama koşu KALDI olmalı (K-11).
module.exports = async ({ host, ev, check }) => {
  const n = await ev(host, `typeof DK`, 'dk');
  check('R01 Sayfa açıldı', n === 'object', n);
};
