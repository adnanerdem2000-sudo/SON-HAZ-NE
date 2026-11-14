// Sayfa düzeyindeki 404'lerin konsol iletisi biçimi (metinde adres var mı?)
[
 {js: `fetch('assets/models/yok.glb').then(r=>r.status)`},
 {js: `new Promise(r=>{ const i=new Image(); i.onerror=()=>r('img hata'); i.onload=()=>r('img yüklendi'); i.src='yok.png'; })`},
 {wait: 500},
]
