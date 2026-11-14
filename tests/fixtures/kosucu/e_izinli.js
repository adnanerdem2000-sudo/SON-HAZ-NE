// (e) İzin listesindeki hatalar: konsol hatası metniyle, 404 görsel adresiyle eşlenir. GECTI olmalı.
[
 {meta: {izinliHatalar: [
   {desen: 'beklenen-hata: kosucu_negatif', gerekce: 'Sabit sayfa bu hatayı kasıtlı basar (izin listesinin metin eşlemesi denemesi).'},
   {desen: 'izinli-eksik\\.png$', gerekce: 'Sabit sayfa bu görseli kasıtlı ister; dosya yoktur (izin listesinin adres eşlemesi denemesi, N9-11).'},
 ]}},
 {expect: {js: `document.images.length`, eq: 1, label: 'E01 Görsel öğesi var'}},
]
