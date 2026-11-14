// (ae) Her şeyle eşleşen izin deseni (A1-09): '.*' bütün konsol ve ağ hatalarını izinliye taşırdı. Beklenen: KOSUCU_HATASI.
[
 {meta: {izinliHatalar: [{desen: '.*', gerekce: 'bütün hatalara izin (yanlış kullanım denemesi)'}]}},
 {expect: {js: `1 + 1`, eq: 2, label: 'AE01 Sabit sayfa açıldı'}},
]
