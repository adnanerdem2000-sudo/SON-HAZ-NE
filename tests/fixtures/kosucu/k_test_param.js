// (k) Koşucu test=1'i kendiliğinden ekler, diğer parametreleri bayt bayt korur (§5.6). Tür ölçümü: DK.sim çağrısından sonra
// (son gezinmeden bu yana sayaç değişti) kontroller 'tarayici+benzetim', öncesi 'tarayici' olmalı (§6.1).
[
 {expect: {js: `new URLSearchParams(location.search).get('test')`, eq: '1', label: 'K01 test=1 kendiliğinden eklendi'}},
 {expect: {js: `location.search`, eq: '?a=1&b=x%20y&test=1', label: 'K02 Diğer parametreler korundu'}},
 {js: `DK.sim(1)`},
 {expect: {js: `window.__simSayisi`, eq: 1, label: 'K03 DK.sim bir kez çağrıldı'}},
]
