// (ic, inceleyicinin ek durumu) Taklidin gönderdiği pointerlockchange olayının sayfa dinleyicisinde atılan istisna sayfa hatası
// olarak kaydedilmeli (KALDI): taklit olayları ayrı görevde gönderir, dinleyici istisnası yutulmamalı.
[
 {js: `document.addEventListener('pointerlockchange', () => { throw new Error('kosucu_negatif ic: pointerlockchange dinleyicisinde hata'); }); DK.kilitle()`},
 {wait: 300},
 {expect: {js: `document.pointerLockElement === DK.tuval`, truthy: true, label: 'IC01 Tuval kilitli'}},
]
