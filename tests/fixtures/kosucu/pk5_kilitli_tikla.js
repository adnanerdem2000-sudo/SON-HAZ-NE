// (pk5/pk6) Kilitliyken arayüz düğmesine locator.click (tikla adımı), kosucu17 2. deneme. Gerçek kilitte Playwright'ın isabet denetimi
// olayın donmuş imleç konumunda (kilit anındaki konum) kilitli tuvali bulur, tıklamayı engelleyip yeniden dener ve zaman aşımına düşer
// (yoklama5, adım 11); düğme etkinleşmez. Taklitte de aynısı olmalı, yoksa "panel açılınca kilit bırakılmadı" türü bir hata taklitte
// geçerdi. pk5: taklit (varsayılan), pk6: --isaretci-kilidi gercek. Beklenen: ikisinde de KALDI, tek neden tikla adım hatası (Timeout).
[
 {click: [200, 150]},
 {js: `DK.kilitle()`},
 {wait: 300},
 {expect: {js: `document.pointerLockElement === DK.tuval`, truthy: true, label: 'PK5-01 Tuval kilitli'}},
 {tikla: {secici: '#dugme', zaman: 3000}},
 {expect: {js: `[window.__tik, document.pointerLockElement === DK.tuval]`, eq: [0, true], label: 'PK5-02 Düğme etkinleşmedi, kilit sürüyor'}},
]
