// Salt-okur: önerilen hikâye alanlarının arazi yüksekliği, en yakın özellik uzaklığı ve D02 ışınına açısal uzaklık
const A = await import('/home/user/SON-HAZ-NE-w2/js/world/archipelago.js');
const G = await import('/home/user/SON-HAZ-NE-w2/js/world/geo.js');
const S = [
  ['kevser', 'kul_limani', 5155, 421],
  ['obs_giris', 'obsidyen', 6387 + Math.sin(Math.atan2(6300-6387, 2700-2663))*18, 2663 + Math.cos(Math.atan2(6300-6387, 2700-2663))*18],
  ['obs_oda', 'obsidyen', 6335, 2690],
  ['kor_giris', 'ates_dagi', 7700 - 0.707*0.62*540, -900 + 0.707*0.62*540],
  ['kor_oda', 'ates_dagi', 7700 - 0.707*0.36*540, -900 + 0.707*0.36*540],
  ['kor_cikis', 'ates_dagi', 7700 - 0.707*0.15*540, -900 + 0.707*0.15*540],
  ['mira_ev', 'korsan_kasabasi', -1760, 1460],
  ['sare_kulube', 'korsan_mezarligi', -6800 + 0.86*320, -6400 + 0.1*320],
  ['halil_mezar', 'korsan_mezarligi', -6951, -6309],
  ['mahzen_oda', 'korsan_mezarligi', -6708 + 40, -6372 - 30],
  ['ayaz_kamp', 'buzdisi', -1500 + 0.6*430, -7300],
  ['saray_giris', 'buzdisi', -1500 + 0.48*430, -7300 - 20],
  ['saray_salon', 'buzdisi', -1500 + 0.25*430, -7300],
  ['bulut', 'kuzeyfener', 295 + 8, -5118 + 10],
  ['nur', 'kumsaati', -5133 + 12, 717],
  ['zindan', 'demirkapi', -6653 - 30, 2548 + 25],
  ['ocak_cukur', 'gumus_madeni', -7500 + Math.cos(1.9)*0.25*320, -1700 + Math.sin(1.9)*0.25*320],
  ['ores_tepe', 'kizil_kanyon', -4900, 3900],
  ['kuyu', 'kadim_tapinak', 1900 + 16, 7400 - 20],
  ['fener', 'fener_kayasi', -1243, -1950],
];
for (const [id, isl, x, z] of S) {
  const I = A.EXTRA_ISLANDS.find(i => i.id === isl);
  const h = G.computeHeight(x, z);
  let nearF = 1e9, nf = '';
  for (const f of I.features) { const d = Math.hypot(f.x - x, f.z - z) - (f.r || 0); if (d < nearF) { nearF = d; nf = f.type; } }
  const a = Math.atan2(z - I.z, x - I.x);
  const k16 = ((a / (2 * Math.PI)) * 16 % 1 + 1) % 1; const ray = Math.min(k16, 1 - k16) * (2 * Math.PI / 16);
  const dn = Math.hypot(x - I.x, z - I.z) / I.r;
  console.log(`${id.padEnd(12)} ${isl.padEnd(17)} (${Math.round(x)},${Math.round(z)}) h=${h.toFixed(1).padStart(6)} d/r=${dn.toFixed(2)} enYakınÖzellik=${nf}:${Math.round(nearF)}m D02b ışınına açı=${(ray*180/Math.PI).toFixed(1)}°`);
}
