// (id, inceleyicinin ek durumu) Kilitliyken düğmeye fare tıklaması tuvale yönlendirilir; tuvalin mousedown dinleyicisinde atılan istisna
// (yönlendirilen kopyada) sayfa hatası olarak kaydedilmeli (KALDI).
[
 {click: [200, 150]},
 {js: `DK.kilitle()`},
 {wait: 300},
 {js: `DK.tuval.addEventListener('mousedown', () => { throw new Error('kosucu_negatif id: yönlendirilen olayın dinleyicisinde hata'); }); 'kuruldu'`},
 {click: [60, 25]},
 {wait: 200},
 {expect: {js: `document.pointerLockElement === DK.tuval`, truthy: true, label: 'ID01 Tuval kilitli'}},
]
