// (ia/ib, son düzeltici: DOG-1) Kilit, tikla adımı başladıktan SONRA ama Playwright tıklamayı göndermeden ÖNCE alınır (hedef düğme
// görünürlük beklenirken; oyunda ui.close → 30 ms sonra lockPointer ile aynı biçim). Gerçek kilitte (ib) Playwright'ın isabet denetimi
// donmuş imleç konumunda tuvali bulur, tıklamayı engeller ve zaman aşımına düşer; tuval ve düğme hiçbir tık olayı almaz. Taklitte (ia)
// aynı sonuç beklenir: tikla hatasız geçerse ya da tuval mousedown/click alırsa kilitliyken tıklama sorunu gizlenmiş olur.
// (İnceleyicinin yeniden üretim senaryosu; kosucu_negatif'e eklendi.)
[
 {click: [200, 150]},
 {js: `(() => { const b = document.createElement('button'); b.id = 'gec'; b.textContent = 'Geç'; b.style.cssText = 'position:absolute;left:150px;top:60px;width:100px;height:30px;display:none'; window.__gec = 0; b.addEventListener('click', () => { window.__gec++; }); document.body.appendChild(b); window.__tuval = []; setTimeout(() => DK.kilitle(), 300); setTimeout(() => { b.style.display = 'block'; }, 900); return 'kuruldu'; })()`},
 {tikla: {secici: '#gec', zaman: 4000}},
 {js: `JSON.stringify({gec: window.__gec, tuval: window.__tuval, kilitli: document.pointerLockElement === DK.tuval, sayac: (Element.prototype.requestPointerLock.__kosucuTaklit || null)})`},
 {expect: {js: `[window.__gec, document.pointerLockElement === DK.tuval]`, eq: [0, true], label: 'IA01 Düğme etkinleşmedi, kilit sürüyor'}},
]
