// Konuk dümende "Boşluk" ile yelken aç/kapa (player.js:912 toggleSails) → net.js:719 'helm' iletisi (15 Hz) →
// ev sahibi net.js:362 s.sailTarget = m.sail. Ev sahibi anlık görüntüsü (15 Hz, net.js:713-716) ship.netState → konuk
// ship.applyNet (ship.js:714) this.sailTarget = s[6] ile YEREL değeri ezer. Ayrık olay benzetimi: tek yön gecikme L.
function trial(L, rng) {
  const P = 1000 / 15;
  const gPhase = rng() * P, hPhase = rng() * P;
  let host = 1, guest = 1;          // yelkenler açık
  const t0 = 500 + rng() * P;        // tuşa basış anı
  const ev = [];                     // [zaman, tür, değer]
  for (let t = gPhase; t < 3000; t += P) ev.push([t, 'gSend']);
  for (let t = hPhase; t < 3000; t += P) ev.push([t, 'hSnap']);
  ev.push([t0, 'toggle']);
  ev.sort((a, b) => a[0] - b[0]);
  const q = [...ev];
  while (q.length) {
    q.sort((a, b) => a[0] - b[0]);
    const [t, k, v] = q.shift();
    if (k === 'toggle') guest = guest > 0.5 ? 0 : 1;
    else if (k === 'gSend') q.push([t + L, 'hRecv', guest]);
    else if (k === 'hRecv') host = v;
    else if (k === 'hSnap') q.push([t + L, 'gRecv', host]);
    else if (k === 'gRecv') guest = v;
  }
  return host === 0; // yelken kapandı mı (istenen)?
}
let s = 7; const rng = () => (s = (s * 16807) % 2147483647) / 2147483647;
const rows = [];
for (const L of [1, 10, 20, 33, 50, 75, 100]) { let ok = 0; const N = 2000; for (let i = 0; i < N; i++) ok += trial(L, rng) ? 1 : 0; rows.push({ tekYonGecikme_ms: L, RTT_ms: 2 * L, basari_yuzde: +(100 * ok / N).toFixed(1) }); }
console.table(rows);
