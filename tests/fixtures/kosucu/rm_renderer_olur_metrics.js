// (rm; son düzeltici 2, inceleme KC-1) Renderer süreci bir metrics adımının CDP isteği sürerken öldürülür: js adımı sayfanın ana
// ipliğini 8 sn meşgul edecek bir görev kurar; işaret bu görevin başında, yani js adımının yanıtından SONRA verilir, metrics adımının
// CDP istekleri bu yüzden yanıt beklerken renderer öldürülür. (w2 doğrulaması: işaret js adımının içinde verildiğinde öldürme yükte
// js adımı bitmeden yetişebiliyordu; tm'de kopma adım 2'de kaydedildi. Koşucu doğru davrandı: KALDI, asılı kalma yok.)
// Eskiden çökmüş sayfadaki CDP isteği --timeout dolana dek asılı kalabiliyordu (B0'ın 01:59 OOM kaydı, inceleyicinin rk koşusu).
// Beklenen: KALDI, zaman aşımı yok, kopma.tur 'renderer', kopma adımı 3 (metrics), RM02 koşmaz, süreç kısa sürede biter.
[
 {expect: {js: `typeof DK`, eq: 'object', label: 'RM01 Sabit sayfa açıldı'}},
 {js: `setTimeout(() => { console.log('[test] KOSUCU_NEGATIF_OLDUR'); const t = performance.now(); while (performance.now() - t < 8000) {} }, 0); 'işaret bir sonraki görevde verilecek; ana iplik 8 sn meşgul olacak'`},
 {metrics: 'm_cokerken'},
 {expect: {js: `true`, truthy: true, label: 'RM02 Metrics adımından sonraki kontrol (koşmamalı)'}},
]
