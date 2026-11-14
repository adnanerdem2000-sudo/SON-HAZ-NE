// (ka) Kanıt adımları (A1-06): snap ve view sayfada istisna atar, snapjs data: adresi döndürmez → üçü de adım hatası (KALDI).
// Son snapjs geçerli bir data: adresi döndürür ama dosya yazılamaz → yalnız kanıt uyarısı (sayılmaz).
[
 {expect: {js: `1`, eq: 1, label: 'KA01 Sabit sayfa açıldı'}},
 {snap: 'tests/out/kosucu_negatif_kanit/snap.jpg'},
 {view: ['tests/out/kosucu_negatif_kanit/view.jpg', [0, 0, 0], [1, 1, 1]]},
 {snapjs: ['tests/out/kosucu_negatif_kanit/snapjs.jpg', `null`]},
 {snapjs: ['/dev/null/kosucu_negatif/yazilamaz.png', `'data:image/png;base64,iVBORw0KGgo='`]},
]
