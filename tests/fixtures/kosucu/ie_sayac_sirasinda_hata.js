// (ie, son düzeltici: DOG-2) Yerleşme (1000 ms) bittikten sonra, koşucu taklit sayaçlarını okurken (raporla: p.evaluate(ISARETCI_SAYAC_JS),
// en çok 3 sn) sayfa ana ipliği meşgul ve sonunda yakalanmamış hata atıyor. Rapor tutarlı olmalı: hata hatalar.sayfa'daysa durum KALDI
// olmalı. Eskiden durum sayaç okumasından önce hesaplanıyordu: GECTI/çıkış 0 ile hatalar.sayfa dolu (inceleyicinin yeniden üretimi).
[
 {expect: {js: `typeof DK`, eq: 'object', label: 'IE01 Sabit sayfa açıldı'}},
 {js: `setTimeout(() => { const t = performance.now(); while (performance.now() - t < 2500) {} throw new Error('kosucu_negatif ie: yerleşmeden sonra, sayaç okuması sürerken gelen hata'); }, 800); 'planlandı'`},
]
