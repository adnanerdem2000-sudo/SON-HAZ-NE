// (rw; son düzeltici 2, inceleme KC-1) Renderer süreci bir bekleme (wait) adımı sürerken öldürülür. Çökmüş sayfada Playwright'ın
// page.waitForTimeout'u 'Page crashed' ile reddedilir; eskiden bu koşucu hatası (KOSUCU_HATASI) sayılıyordu. Beklenen: KALDI, koşucu
// hatası yok, kopma.tur 'renderer', kopma.yaridaKalan bekleme adımı (3), RW02 koşmaz.
// (w2 doğrulaması) İşaret js adımının yanıtından SONRA (bir sonraki görevde) verilir: js adımının içinde verildiğinde öldürme yükte
// js adımı bitmeden yetişebiliyor, kopma bekleme adımı yerine js adımında kaydediliyordu (aynı yarış tm'de görüldü).
[
 {expect: {js: `typeof DK`, eq: 'object', label: 'RW01 Sabit sayfa açıldı'}},
 {js: `setTimeout(() => console.log('[test] KOSUCU_NEGATIF_OLDUR'), 0); 'işaret bir sonraki görevde verilecek'`},
 {wait: 20000},
 {expect: {js: `true`, truthy: true, label: 'RW02 Öldürmeden sonraki kontrol (koşmamalı)'}},
]
