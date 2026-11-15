// Tanı (B1): farklı erteleme yollarında (mikro görev, MessageChannel, setTimeout 0/1) performance.now() farkının 0 çıkma sıklığı
[
 {meta: {olcum: true, testler: ['tanı'], dosyalar: []}},
 {js: `(async()=>{ const N = 300; const sonuc = {};
   const olc = async (ad, ertele) => { let esit = 0, top = 0, en = 1e9, mx = 0; for (let k = 0; k < N; k++) { const a = performance.now(); const b = await new Promise((r) => ertele(() => r(performance.now()))); const d = b - a; if (d === 0) esit++; top += d; en = Math.min(en, d); mx = Math.max(mx, d); } sonuc[ad] = { esit, n: N, ortMs: +(top / N).toFixed(3), en: +en.toFixed(3), mx: +mx.toFixed(3) }; };
   await olc('mikro', (f) => queueMicrotask(f));
   const mc = new MessageChannel(); const q = []; mc.port1.onmessage = () => q.shift()();
   await olc('messagechannel', (f) => { q.push(f); mc.port2.postMessage(0); });
   await olc('settimeout0', (f) => setTimeout(f, 0));
   await olc('settimeout1', (f) => setTimeout(f, 1));
   return sonuc; })()`},
]
