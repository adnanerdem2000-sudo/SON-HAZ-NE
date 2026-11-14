// (z) Tür ölçümü (A1-03, A1-11): rAF döngüsü → 'tarayici'; doğrudan DK.game.update → 'tarayici+benzetim' (update 3);
// DK.sim içindeki game.update çağrıları ayrıca sayılmaz (sim 1, adım 30, update 0); sayfa kendini yeniden yükleyince yeni
// belgedeki DK.sim de sayılır (sim 1, adım 60). Beklenen: GECTI ve kontrol türleri bu sırayla.
[
 {wait: 300},
 {expect: {js: `DK.game.n > 5`, truthy: true, label: 'Z01 Oyunun kendi rAF döngüsü game.update çağırdı'}},
 {js: `for (let i = 0; i < 3; i++) DK.game.update(1 / 15); 'üç doğrudan adım'`},
 {expect: {js: `DK.game.t > 0.2`, truthy: true, label: 'Z02 Doğrudan game.update ile ileri sarıldı'}},
 {goto: 'z_tur.html'},
 {js: `DK.sim(1)`},
 {expect: {js: `window.__simSayisi`, eq: 1, label: 'Z03 DK.sim bir kez çağrıldı'}},
 {js: `setTimeout(() => location.reload(), 30); 'yeniden yükleme planlandı'`},
 {wait: 1500},
 {js: `DK.sim(2)`},
 {expect: {js: `window.__simSayisi`, eq: 1, label: 'Z04 Sayfanın kendi yeniden yüklemesinden sonra DK.sim'}},
]
