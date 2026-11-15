// (ie2, son düzeltici: DOG-2 co-op karşılığı) Senaryo bittikten ve yerleşme (1000 ms) geçtikten sonra, koşucu oyuncuların taklit sayaçlarını
// okurken Kaptan sayfasının ana ipliği meşgul ve sonunda yakalanmamış hata atıyor. Rapor tutarlı olmalı: hata hatalar.sayfa'daysa
// durum KALDI. Eskiden durum sayaç okumasından önce hesaplanıyordu (GECTI kalabilirdi).
module.exports = async ({ host, ev, check }) => {
  const r = await ev(host, `setTimeout(() => { const t = performance.now(); while (performance.now() - t < 2500) {} throw new Error('kosucu_negatif ie2: yerleşmeden sonra, sayaç okuması sürerken gelen hata'); }, 800); 'planlandı'`, 'planla');
  check('IE2-01 Hata planlandı', r === 'planlandı', r);
};
