// (pk) İşaretçi kilidi taklidi (kosucu17). Koşucu varsayılan olarak gerçek kilidi istemez (O.ISARETCI_TAKLIT), ama oyunun gördüğü
// anlam gerçek kilitle aynıdır. pk: varsayılan (taklit) → GECTI. pk2: aynı senaryo --isaretci-kilidi gercek ile → yalnız PK02 (sel
// yok) KALIR; öteki kontrollerin geçmesi taklidin anlamının gerçek kilitle aynı olduğunu, PK02'nin kalması selin ölçüldüğünü gösterir.
// PK07/PK08 (2. deneme): kilitliyken fare olaylarının kilitli tuvale yönlendirilmesi (yoklama5) ve klavye click'inin yönlendirilmemesi.
[
 {js: `DK.kilitle()`},
 {wait: 300},
 {expect: {js: `document.pointerLockElement === DK.tuval && DK.input.pointerLocked === true && JSON.stringify(window.__olay) === JSON.stringify([['degisim', true]])`, truthy: true, label: 'PK01 requestPointerLock: pointerLockElement tuval, tek pointerlockchange, input.pointerLocked true'}},
 {js: `window.__mm = 0; 'mousemove sayacı sıfırlandı'`},
 {wait: 1500},
 {expect: {js: `window.__mm`, lte: 5, label: 'PK02 Kilitliyken 1,5 sn içinde sayfaya gelen mousemove ≤ 5 (sentetik fare olayı seli yok)'}},
 {expect: {js: `(async () => { document.exitPointerLock(); const esz = document.pointerLockElement; await new Promise((r) => setTimeout(r, 100)); return [esz, document.pointerLockElement, DK.input.pointerLocked, window.__duraklat, window.__olay.length]; })()`, eq: [null, null, false, 1, 2], label: 'PK03 exitPointerLock: öğe hemen null, değişim olayı sonra gelir; noAutoPause yokken bırakma duraklatır'}},
 {expect: {js: `(async () => { const d = document.createElement('div'); const r = await d.requestPointerLock().then(() => 'çözüldü', (e) => e.name); await new Promise((q) => setTimeout(q, 50)); return [r, window.__olay[window.__olay.length - 1][0], document.pointerLockElement]; })()`, eq: ['WrongDocumentError', 'hata', null], label: 'PK04 DOM dışı öğeye istek reddedilir (WrongDocumentError) ve pointerlockerror gönderilir'}},
 {expect: {js: `(async () => { DK.G.noAutoPause = true; DK.kilitle(); await new Promise((r) => setTimeout(r, 100)); const k = DK.input.pointerLocked; document.exitPointerLock(); await new Promise((r) => setTimeout(r, 100)); return [k, DK.input.pointerLocked, window.__duraklat]; })()`, eq: [true, false, 1], label: 'PK05 noAutoPause=true iken yeniden kilit ve bırakma; duraklatma sayısı değişmez'}},
 {expect: {js: `(async () => { await new Promise((r) => setTimeout(r, 5600)); const r = await DK.tuval.requestPointerLock().then(() => 'çözüldü', (e) => e.name + ': ' + e.message); await new Promise((q) => setTimeout(q, 50)); return /^NotAllowedError: .*user gesture/.test(r) && document.pointerLockElement === null; })()`, truthy: true, label: 'PK06 Geçici kullanıcı etkinliği (5 sn) bittikten sonraki istek reddedilir (NotAllowedError: user gesture)'}},
 // imleç kilitsizken (200,150)'ye götürülür (tuvale tıklama), sonra tuval kilitlenir; kilitliyken düğmeye ve metin kutusuna fare tıklaması
 {click: [200, 150]},
 {js: `DK.kilitle()`},
 {wait: 300},
 {js: `window.__tik = 0; window.__tuval = []; document.getElementById('dugme').blur(); [document.pointerLockElement === DK.tuval, document.activeElement.nodeName]`},
 {click: [60, 25]},
 {click: [60, 60]},
 {wait: 200},
 {expect: {js: `[window.__tik, window.__tuval.map((o) => o.join(':')).join(' '), document.activeElement.id || document.activeElement.nodeName, document.pointerLockElement === DK.tuval]`, eq: [0, 'mousedown:200:150:0 mouseup:200:150:0 click:200:150:0 mousedown:200:150:0 mouseup:200:150:0 click:200:150:0', 'BODY', true], label: 'PK07 Kilitliyken düğmeye ve metin kutusuna fare tıklaması kilitli tuvale gider (kilit anındaki konumla); düğme etkinleşmez, odak değişmez'}},
 {js: `document.getElementById('dugme').focus(); window.__tik = 0; document.activeElement.id`},
 {key: 'Enter'},
 {wait: 100},
 {expect: {js: `[window.__tik, document.pointerLockElement === DK.tuval]`, eq: [1, true], label: 'PK08 Kilitliyken klavyeyle (odaktaki düğmede Enter) üretilen click düğmeye gider (yönlendirilmez)'}},
]
