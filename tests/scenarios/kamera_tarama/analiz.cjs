// Kamera parlaklık taraması çözümleyicisi: node tests/scenarios/kamera_tarama/analiz.cjs <rapor.json>...
// Her konum için medyan / en düşük parlaklık, "karanlık" kare sayısı (medyanın %60'ının altı ya da piksellerin yarısından fazlası
// luma < 28) ve yalnız parlaklık düşüşü ölçütüyle sayı yazar. Raporlar `run.cjs --report` ile üretilir.
const fs = require('fs');
for (const f of process.argv.slice(2)) {
  const r = JSON.parse(fs.readFileSync(f, 'utf8'));
  let data = null;
  for (const s of r.steps || []) if (typeof s.result === 'string' && s.result.startsWith('[{"name')) data = JSON.parse(s.result);
  if (!data) { console.log(f, 'veri yok', r.harnessError || '', r.timeout ? 'TIMEOUT' : ''); continue; }
  for (const loc of data) {
    const thr = 0.6 * loc.median;
    const dark = loc.f.filter((q) => q[2] < thr || q[3] > 0.5).length, byLum = loc.f.filter((q) => q[2] < thr).length;
    console.log(`${loc.name.padEnd(24)} medyan ${String(loc.median).padStart(6)}  en düşük ${String(loc.min).padStart(6)}  karanlık ${String(dark).padStart(3)}/${loc.f.length} (parlaklık düşüşü ${byLum})`);
  }
}
