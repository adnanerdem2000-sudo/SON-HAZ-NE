// (rk; son düzeltici 2, inceleme KC-1) Sayfanın renderer süreci bir js adımı sürerken öldürülür (SIGKILL; ölçümde bellek sınırındaki
// OOM'un sık kurbanı renderer'dı, oom_score_adj +300). kosucu_negatif.mjs '[test] KOSUCU_NEGATIF_OLDUR' satırını görünce koşucunun
// alt ağacındaki renderer sürecini öldürür. Beklenen: KALDI; hatalar.sayfa'da 'SAYFA ÇÖKTÜ (renderer crash)'; kopma.tur 'renderer';
// RK02, metrics, bekleme ve RK03 koşmaz (eskiden RK02 'Target crashed' ile kalıyor, metrics adımı --timeout dolana dek asılı kalıp
// koşu ZAMAN_ASIMI oluyordu); süreç kendiliğinden ve kısa sürede biter.
[
 {expect: {js: `typeof DK`, eq: 'object', label: 'RK01 Sabit sayfa açıldı'}},
 {js: `(async () => { console.log('[test] KOSUCU_NEGATIF_OLDUR'); await new Promise((r) => setTimeout(r, 20000)); return 'öldürülmedi'; })()`},
 {expect: {js: `true`, truthy: true, label: 'RK02 Öldürmeden sonraki kontrol (koşmamalı)'}},
 {metrics: 'm_sonra'},
 {wait: 3000},
 {expect: {js: `true`, truthy: true, label: 'RK03 Beklemeden sonraki kontrol (koşmamalı)'}},
]
