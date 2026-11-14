// (x) Döngüsel ve BigInt dönüş değerleri (A1-01): Playwright ikisini de olduğu gibi döndürür. Koşucu raporu döngü/BigInt güvenli
// yazmalı ve kendiliğinden bitmeli (önceden finish() istisna atıp süreç asılı kalıyordu). js adımının dönüş değeri onay değildir:
// yazılamaması adım hatası sayılmaz. Beklenen: GECTI, çıkış 0, rapor var; döngü "[Döngüsel]", BigInt "<sayı>n" olarak yazılır.
[
 {expect: {js: `1 + 1`, eq: 2, label: 'X01 Sabit sayfa açıldı'}},
 {js: `(() => { const a = { ad: 'dongusel' }; a.kendi = a; return a; })()`},
 {js: `2n ** 70n`},
 {expect: {js: `(() => { const a = { ad: 'd' }; a.kendi = a; return a; })()`, truthy: true, label: 'X02 Döngüsel değer truthy'}},
]
