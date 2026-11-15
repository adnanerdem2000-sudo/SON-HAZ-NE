// (td) Tarayıcı süreci bir bekleme (wait) adımı sürerken öldürülür. Eskiden yarıda kalan bekleme koşucu hatası (KOSUCU_HATASI)
// sayılıyordu; şimdi kopma kaydıyla KALDI. Beklenen: KALDI; hatalar.sayfa'da 'TARAYICI ÇÖKTÜ/KOPTU'; TD02 koşmaz.
// (w2 doğrulaması) İşaret js adımının yanıtından SONRA (bir sonraki görevde) verilir: js adımının içinde verildiğinde öldürme yükte
// js adımı bitmeden yetişebiliyor, kopma bekleme adımı yerine js adımında kaydediliyordu (aynı yarış tm'de görüldü).
[
 {expect: {js: `typeof DK`, eq: 'object', label: 'TD01 Sabit sayfa açıldı'}},
 {js: `setTimeout(() => console.log('[test] KOSUCU_NEGATIF_OLDUR'), 0); 'işaret bir sonraki görevde verilecek'`},
 {wait: 20000},
 {expect: {js: `true`, truthy: true, label: 'TD02 Öldürmeden sonraki kontrol (koşmamalı)'}},
]
