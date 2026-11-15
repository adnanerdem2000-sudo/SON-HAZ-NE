// Tanı (B1): performance.now() çözünürlüğü ve iki ardışık okumanın eşit çıkma sıklığı (LY08 önkoşulunun zamanlayıcı kabalığına duyarlılığı)
[
 {meta: {olcum: true, testler: ['tanı'], dosyalar: []}},
 {js: `(()=>{ const v = []; let son = performance.now(); const t0 = son; while (performance.now() - t0 < 50) { const n = performance.now(); if (n !== son) { v.push(n - son); son = n; } } v.sort((a,b)=>a-b); return { farkSayisi: v.length, enKucuk: v[0], ortanca: v[Math.floor(v.length/2)], ornek: v.slice(0, 10).map(x=>+x.toFixed(4)) }; })()`},
 {js: `(()=>{ let esit = 0, n = 0; for (let k = 0; k < 2000; k++) { const a = performance.now(); let s = 0; for (let i = 0; i < 2000; i++) s += Math.sqrt(i); const b = performance.now(); if (b === a) esit++; n++; } return { esit, n }; })()`},
 {js: `(()=>{ let esit = 0, n = 0, top = 0; for (let k = 0; k < 2000; k++) { const a = performance.now(); let s = 0; for (let i = 0; i < 20000; i++) s += Math.sqrt(i); const b = performance.now(); top += b - a; if (b === a) esit++; n++; } return { esit, n, ortMs: top / n }; })()`},
 {js: `crossOriginIsolated`},
]
