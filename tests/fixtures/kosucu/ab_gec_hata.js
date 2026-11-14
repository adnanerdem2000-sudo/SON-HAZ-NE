// (ab) Son adımın planladığı eşzamansız hata (A1-08): son adımdan 300 ms sonra gelir; koşucu yerleşme süresinde yakalamalı.
// Beklenen: KALDI (sayfa hatası).
[
 {expect: {js: `1`, eq: 1, label: 'AB01 Sabit sayfa açıldı'}},
 {js: `setTimeout(() => { throw new Error('kosucu_negatif ab: son adımdan 300 ms sonra gelen hata'); }, 300); 'planlandı'`},
]
