// (ai) Co-op: aynı adla mk() ile yeniden katılım (A1-02). İlk Tayfa sekmesinde yakalanmamış bir oyun hatası olur, sekme kapanır,
// aynı adla yeni sekme açılır. Eskiden mk() report.pageErrors['Tayfa']'yı sıfırlıyor, hata kayboluyor ve koşu GEÇİYORDU.
// Beklenen: KALDI (ilk sekmenin sayfa hatası 'Tayfa' anahtarında kalır; yeni sekme 'Tayfa#2').
module.exports = async ({ host, guests, ev, check, mk }) => {
  const g = guests[0];
  await ev(g, `DK.hataUret()`, 'hata');
  await host.waitForTimeout(500);
  await g.context().close();
  const yeni = await mk('Tayfa');
  check('AI01 Yeniden katılan Tayfa hazır', (await ev(yeni, `typeof DK`, 'dk')) === 'object');
};
