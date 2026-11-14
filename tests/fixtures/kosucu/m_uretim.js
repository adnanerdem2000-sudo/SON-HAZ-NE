// (m) --uretim: test parametresi eklenmez; koşucu U00 'Üretimde test kancası yok' kontrolünü kendiliğinden ekler.
// dk_yok.html ile GECTI, temiz.html (DK var) ile KALDI olmalı (m2).
[
 {expect: {js: `new URLSearchParams(location.search).has('test')`, eq: false, label: 'M01 Adreste test parametresi yok'}},
]
