// (tc) Tarayıcı süreci bir js adımı sürerken öldürülür (SIGKILL; bellek sınırındaki OOM öldürmesinin benzeri). kosucu_negatif.mjs
// '[test] KOSUCU_NEGATIF_OLDUR' satırını görünce koşucunun alt ağacındaki tarayıcı ana sürecini öldürür.
// Beklenen: KALDI; hatalar.sayfa'da 'TARAYICI ÇÖKTÜ/KOPTU'; TC02 koşmaz; süreç kendiliğinden ve kısa sürede biter.
[
 {expect: {js: `typeof DK`, eq: 'object', label: 'TC01 Sabit sayfa açıldı'}},
 {js: `(async () => { console.log('[test] KOSUCU_NEGATIF_OLDUR'); await new Promise((r) => setTimeout(r, 20000)); return 'öldürülmedi'; })()`},
 {expect: {js: `true`, truthy: true, label: 'TC02 Öldürmeden sonraki kontrol (koşmamalı)'}},
 {wait: 100},
]
