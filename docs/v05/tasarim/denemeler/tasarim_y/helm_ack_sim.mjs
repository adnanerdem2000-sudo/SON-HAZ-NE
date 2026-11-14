// Faz 5 tasarım denemesi (salt-okur): konuk dümende yelken aç/kapa (E-10).
// v0.4 (denetim kopyası /tmp/denetim_alan/dumen_yelken_sim.mjs): konuk 15 Hz 'helm{sail}' gönderir, host görüntüsü yerel sailTarget'ı ezer.
// Öneri: Boşluk → güvenilir 'shipCmd{cmd:'sails', v, cs}' (cs = komut sırası); konuk cs onaylanana (görüntüde hk ≥ cs) kadar
// görüntüdeki sailTarget'ı yok sayar; 'helm' yalnız dümen ve geri yelken taşır.
function trial(L, rng, method, presses = 1) {
  const P = 1000 / 15; const gPh = rng() * P, hPh = rng() * P;
  let host = 1, guest = 1, cs = 0, hk = 0, pendingCs = 0;
  const ev = [];
  for (let t = gPh; t < 4000; t += P) ev.push([t, 'gSend']);
  for (let t = hPh; t < 4000; t += P) ev.push([t, 'hSnap']);
  const pressT = []; for (let i = 0; i < presses; i++) pressT.push(400 + i * (3000 / presses) + rng() * 50);
  for (const t of pressT) ev.push([t, 'toggle']);
  const q = [...ev];
  while (q.length) {
    q.sort((a, b) => a[0] - b[0]);
    const [t, k, v, w] = q.shift();
    if (k === 'toggle') {
      guest = guest > 0.5 ? 0 : 1;
      if (method === 'oneri') { cs++; pendingCs = cs; q.push([t + L, 'hCmd', guest, cs]); }
    } else if (k === 'gSend') { if (method === 'v04') q.push([t + L, 'hRecv', guest]); }
    else if (k === 'hRecv') host = v;
    else if (k === 'hCmd') { host = v; hk = Math.max(hk, w); }
    else if (k === 'hSnap') q.push([t + L, 'gRecv', host, hk]);
    else if (k === 'gRecv') {
      if (method === 'v04') guest = v;
      else if (w >= pendingCs) { guest = v; pendingCs = 0; } // onaylı: host değeri esas
    }
  }
  const want = presses % 2 ? 0 : 1;
  return host === want && guest === want;
}
let s = 7; const rng = () => (s = (s * 16807) % 2147483647) / 2147483647;
const rows = [];
for (const L of [10, 33, 50, 100, 150]) {
  for (const method of ['v04', 'oneri']) { let ok = 0; const N = 2000; for (let i = 0; i < N; i++) ok += trial(L, rng, method, 1) ? 1 : 0; let ok3 = 0; for (let i = 0; i < N; i++) ok3 += trial(L, rng, method, 3) ? 1 : 0; rows.push({ tekYon_ms: L, yontem: method, tekBasis_basari: +(100 * ok / N).toFixed(1), ucBasis_basari: +(100 * ok3 / N).toFixed(1) }); }
}
console.table(rows);
