// (af) İzin yalnız metne ve "Failed to load resource" iletisinin kaynak adresine uygulanır; öteki konsol iletilerinin konumu
// (iletiyi basan betik) eşlenmez (A1-09). Beklenen: KALDI (betiğin hatası izinsiz), af-eksik.png 404'ü izinli.
[
 {meta: {izinliHatalar: [{desen: 'af[-_]', gerekce: 'af-eksik.png sabit sayfada kasıtlı eksik (ağ için yazılmış geniş desen denemesi)'}]}},
 {expect: {js: `document.images.length`, eq: 1, label: 'AF01 Görsel öğesi var'}},
]
