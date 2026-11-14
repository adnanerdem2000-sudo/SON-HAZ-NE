// Salt-okur: seçili adalarda radyal yükseklik profili (zirve/krater/teras), maden girişi konumu
const A = await import('/home/user/SON-HAZ-NE-w2/js/world/archipelago.js');
const Gm = await import('/home/user/SON-HAZ-NE-w2/js/world/geo.js');
const H = (x, z) => Gm.computeHeight(x, z);
function prof(id, ang = 0, step = 0.05) {
  const I = A.EXTRA_ISLANDS.find((i) => i.id === id);
  const out = [];
  for (let d = 0; d <= 1.3; d += step) out.push(`${d.toFixed(2)}:${H(I.x + Math.cos(ang) * d * I.r, I.z + Math.sin(ang) * d * I.r).toFixed(0)}`);
  console.log(id, 'açı', ang.toFixed(2), out.join(' '));
}
for (const a of [0, 1.57, 3.14, 4.71]) prof('ates_dagi', a);
for (const a of [0, 1.57, 3.14, 4.71]) prof('buzdisi', a);
// en yüksek nokta (ızgara)
function peak(id) {
  const I = A.EXTRA_ISLANDS.find((i) => i.id === id);
  let best = { h: -1e9 };
  for (let x = I.x - I.r; x <= I.x + I.r; x += 6) for (let z = I.z - I.r; z <= I.z + I.r; z += 6) { const h = H(x, z); if (h > best.h) best = { x, z, h: +h.toFixed(1) }; }
  console.log('zirve', id, JSON.stringify(best));
}
for (const id of ['ates_dagi', 'buzdisi', 'gumus_madeni', 'demirkapi', 'kizil_kanyon', 'korsan_mezarligi', 'sis_adasi', 'kadim_tapinak', 'kurt_adasi', 'kuzeyfener']) peak(id);
// maden girişleri
for (const id of ['gumus_madeni', 'obsidyen']) {
  const I = A.EXTRA_ISLANDS.find((i) => i.id === id);
  const f = I.features.find((f) => f.type === 'mine');
  const yaw = Math.atan2(I.x - f.x, I.z - f.z);
  const ex = f.x + Math.sin(yaw) * 18, ez = f.z + Math.cos(yaw) * 18;
  const pts = [];
  for (let k = 0; k <= 120; k += 10) pts.push(`${k}:${H(ex + Math.sin(yaw) * k, ez + Math.cos(yaw) * k).toFixed(1)}`);
  console.log('maden', id, 'giriş', ex.toFixed(0), ez.toFixed(0), 'yaw', yaw.toFixed(3), 'içeri doğru yükseklik', pts.join(' '));
}
