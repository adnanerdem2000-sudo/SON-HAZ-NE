// (ia2, son düzeltici: DOG-1 olumlu karşılığı) Kilitliyken başlayan tikla, kilit süre dolmadan bırakılınca tıklamayı yapar: gerçek
// kilitte Playwright yeniden dener ve kilit kalkınca tıklama düğmeye ulaşır. Taklitte de engellenen denemelerden sonra düğme bir kez
// etkinleşmeli, tuval tık olayı almamalı; rapordaki adım kaydı engellenen denemeleri gösterir (kilitEngeli).
[
 {click: [200, 150]},
 {js: `DK.kilitle()`},
 {wait: 300},
 {js: `window.__tik = 0; window.__tuval = []; setTimeout(() => document.exitPointerLock(), 700); [document.pointerLockElement === DK.tuval]`},
 {tikla: {secici: '#dugme', zaman: 5000}},
 {expect: {js: `[window.__tik, window.__tuval.length, document.pointerLockElement]`, eq: [1, 0, null], label: 'IA2-01 Kilit bırakılınca tikla düğmeyi bir kez etkinleştirdi; tuval tık almadı'}},
]
