// (ac) Co-op: senaryonun son eyleminin planladığı eşzamansız hata (A1-08). Beklenen: KALDI (sayfa hatası, Kaptan).
module.exports = async ({ host, ev, check }) => {
  check('AC01 Sayfa açıldı', (await ev(host, `typeof DK`, 'dk')) === 'object');
  await ev(host, `setTimeout(() => { throw new Error('kosucu_negatif ac: senaryodan 300 ms sonra gelen hata'); }, 300); 'planlandı'`, 'gec-hata');
};
