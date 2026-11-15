// (ig/ih; son düzeltici 2, inceleme GZ-2) Sandbox'lı alt çerçevede (allow-pointer-lock yok) işaretçi kilidi isteği: gerçek Chromium
// SecurityError, pointerlockerror ve konsolda güvenlik hatası verir; taklit (ig) de aynısını vermeli (eskiden taklit kilidi veriyordu:
// gerçek bir gömme sorunu taklitte geçerdi). ih aynı senaryoyu --isaretci-kilidi gercek ile koşar. Sayfa: ig_sandbox.html.
// Konsoldaki iki güvenlik hatası izinsizdir: beklenen durum KALDI, tek neden izinsiz konsol hatası.
[
 {expect: {js: `(async () => { const t0 = performance.now(); while (Object.keys(window.__igHazir).length < 3 && performance.now() - t0 < 10000) await new Promise((r) => setTimeout(r, 50)); return Object.keys(window.__igHazir).sort().join(','); })()`, eq: 's1,s2,s3', label: 'IG00 Üç alt çerçeve yüklendi'}},
 {click: [50, 45]},
 {wait: 500},
 {click: [160, 45]},
 {wait: 500},
 {click: [270, 45]},
 {wait: 700},
 {js: `JSON.stringify(window.__ig)`},
 {expect: {js: `(() => { const g = window.__ig; const red = (x) => !!x && /^red SecurityError: .*sandboxed and the 'allow-pointer-lock' permission is not set/.test(x.sonuc) && x.olaylar.join() === 'error';
   return [red(g.s1), red(g.s2), !!g.s3 && g.s3.sonuc === 'ok' && g.s3.olaylar[0] === 'change:c', g.s1 && g.s1.koken, g.s2 && g.s2.koken !== 'null']; })()`,
   eq: [true, true, true, 'null', true], label: "IG01 Sandbox'lı çerçevelerde (s1 opak, s2 aynı köken) istek SecurityError + pointerlockerror; sandbox'sız s3 kilitlenir"}},
]
